/**
 * 证书管理页面
 * 工人可以上传和管理技术证书
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  Modal,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { FontAwesome6 } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Screen } from '@/components/Screen';
import { useTheme } from '@/hooks/useTheme';
import { useAuth } from '@/contexts/AuthContext';
import { useSafeRouter } from '@/hooks/useSafeRouter';
import { createFormDataFile, formatBeijingDate } from '@/utils';
import { createStyles } from './styles';

const BASE_URL = process.env.EXPO_PUBLIC_BACKEND_BASE_URL || 'http://localhost:9091';

// 证书类型选项
const CERTIFICATE_TYPES = [
  { label: '技能证书', value: 'skill' },
  { label: '资格证书', value: 'qualification' },
  { label: '学历证书', value: 'education' },
  { label: '培训证书', value: 'training' },
  { label: '其他', value: 'other' },
];

interface Certificate {
  id: number;
  certificateName: string;
  certificateType?: string;
  issuingAuthority?: string;
  issueDate?: string;
  expiryDate?: string;
  certificateNumber?: string;
  imageUrl?: string;
  status: 'pending' | 'verified' | 'rejected';
  rejectReason?: string;
  createdAt: string;
}

const getStatusInfo = (status: string, theme: any) => {
  switch (status) {
    case 'pending':
      return { text: '审核中', style: 'pending' };
    case 'verified':
      return { text: '已认证', style: 'verified' };
    case 'rejected':
      return { text: '已拒绝', style: 'rejected' };
    default:
      return { text: '未知', style: 'pending' };
  }
};

export default function CertificatesScreen() {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const router = useSafeRouter();
  const { userType } = useAuth();

  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingCertificate, setEditingCertificate] = useState<Certificate | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // 表单状态
  const [certificateName, setCertificateName] = useState('');
  const [certificateType, setCertificateType] = useState('skill');
  const [issuingAuthority, setIssuingAuthority] = useState('');
  const [issueDate, setIssueDate] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [certificateNumber, setCertificateNumber] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  // 获取状态样式
  const getStatusStyles = (status: string) => {
    switch (status) {
      case 'verified':
        return {
          badge: styles.statusVerified,
          text: styles.statusVerifiedText,
        };
      case 'rejected':
        return {
          badge: styles.statusRejected,
          text: styles.statusRejectedText,
        };
      default:
        return {
          badge: styles.statusPending,
          text: styles.statusPendingText,
        };
    }
  };

  // 检查是否是工人
  useEffect(() => {
    if (userType !== 'worker') {
      Alert.alert('提示', '仅工人可以管理证书', [
        { text: '确定', onPress: () => router.back() },
      ]);
    }
  }, [userType]);

  // 加载证书列表
  useEffect(() => {
    if (userType === 'worker') {
      loadCertificates();
    }
  }, [userType]);

  const loadCertificates = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await fetch(`${BASE_URL}/api/v1/certificates`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setCertificates(data.certificates || []);
      }
    } catch (error) {
      console.error('Load certificates error:', error);
    } finally {
      setLoading(false);
    }
  };

  const pickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      Alert.alert('提示', '需要相册权限才能选择图片');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setSelectedImage(result.assets[0].uri);
    }
  };

  const takePhoto = async () => {
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
    if (!permissionResult.granted) {
      Alert.alert('提示', '需要相机权限才能拍照');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setSelectedImage(result.assets[0].uri);
    }
  };

  const showImageOptions = () => {
    Alert.alert('选择图片', '', [
      { text: '从相册选择', onPress: pickImage },
      { text: '拍照', onPress: takePhoto },
      { text: '取消', style: 'cancel' },
    ]);
  };

  const resetForm = () => {
    setCertificateName('');
    setCertificateType('skill');
    setIssuingAuthority('');
    setIssueDate('');
    setExpiryDate('');
    setCertificateNumber('');
    setSelectedImage(null);
    setEditingCertificate(null);
  };

  const openAddModal = () => {
    resetForm();
    setModalVisible(true);
  };

  const openEditModal = (cert: Certificate) => {
    setEditingCertificate(cert);
    setCertificateName(cert.certificateName);
    setCertificateType(cert.certificateType || 'skill');
    setIssuingAuthority(cert.issuingAuthority || '');
    setIssueDate(cert.issueDate || '');
    setExpiryDate(cert.expiryDate || '');
    setCertificateNumber(cert.certificateNumber || '');
    setSelectedImage(null); // 不预加载图片，用户可选择更新
    setModalVisible(true);
  };

  const handleSubmit = async () => {
    if (!certificateName.trim()) {
      Alert.alert('提示', '请输入证书名称');
      return;
    }

    if (!editingCertificate && !selectedImage) {
      Alert.alert('提示', '请上传证书图片');
      return;
    }

    setSubmitting(true);

    try {
      const token = await AsyncStorage.getItem('token');
      const formData = new FormData();

      formData.append('certificateName', certificateName.trim());
      formData.append('certificateType', certificateType);
      if (issuingAuthority.trim()) {
        formData.append('issuingAuthority', issuingAuthority.trim());
      }
      if (issueDate.trim()) {
        formData.append('issueDate', issueDate.trim());
      }
      if (expiryDate.trim()) {
        formData.append('expiryDate', expiryDate.trim());
      }
      if (certificateNumber.trim()) {
        formData.append('certificateNumber', certificateNumber.trim());
      }

      // 如果选择了新图片
      if (selectedImage) {
        const filename = selectedImage.split('/').pop() || 'certificate.jpg';
        const match = /\.(\w+)$/.exec(filename);
        const ext = match ? match[1] : 'jpg';
        const mimeType = `image/${ext === 'jpg' ? 'jpeg' : ext}`;

        const fileData = await createFormDataFile(selectedImage, filename, mimeType);
        formData.append('image', fileData as any);
      }

      const url = editingCertificate
        ? `${BASE_URL}/api/v1/certificates/${editingCertificate.id}`
        : `${BASE_URL}/api/v1/certificates`;

      const response = await fetch(url, {
        method: editingCertificate ? 'PUT' : 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      if (response.ok) {
        Alert.alert('成功', editingCertificate ? '证书已更新' : '证书已上传，等待审核');
        setModalVisible(false);
        loadCertificates();
      } else {
        const error = await response.json();
        Alert.alert('错误', error.error || '操作失败');
      }
    } catch (error) {
      console.error('Submit certificate error:', error);
      Alert.alert('错误', '网络错误，请重试');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = (cert: Certificate) => {
    Alert.alert(
      '删除证书',
      `确定要删除"${cert.certificateName}"吗？`,
      [
        { text: '取消', style: 'cancel' },
        {
          text: '删除',
          style: 'destructive',
          onPress: async () => {
            try {
              const token = await AsyncStorage.getItem('token');
              const response = await fetch(`${BASE_URL}/api/v1/certificates/${cert.id}`, {
                method: 'DELETE',
                headers: {
                  'Authorization': `Bearer ${token}`,
                },
              });

              if (response.ok) {
                Alert.alert('成功', '证书已删除');
                loadCertificates();
              }
            } catch (error) {
              Alert.alert('错误', '删除失败');
            }
          },
        },
      ]
    );
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '-';
    return formatBeijingDate(dateStr);
  };

  if (loading) {
    return (
      <Screen backgroundColor={theme.backgroundRoot} statusBarStyle="dark">
        <View style={styles.container}>
          <ActivityIndicator size="large" color={theme.primary} style={{ marginTop: 100 }} />
        </View>
      </Screen>
    );
  }

  return (
    <Screen backgroundColor={theme.backgroundRoot} statusBarStyle="dark">
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <FontAwesome6 name="arrow-left" size={20} color={theme.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>技术证书</Text>
          <TouchableOpacity style={styles.addButton} onPress={openAddModal}>
            <FontAwesome6 name="plus" size={20} color={theme.primary} />
          </TouchableOpacity>
        </View>

        {/* Certificate List */}
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {certificates.length === 0 ? (
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIcon}>
                <FontAwesome6 name="scroll" size={64} color={theme.textMuted} />
              </View>
              <Text style={styles.emptyTitle}>暂无证书</Text>
              <Text style={styles.emptyText}>
                上传您的技术证书，让雇主更了解您的能力
              </Text>
            </View>
          ) : (
            certificates.map((cert) => {
              const statusInfo = getStatusInfo(cert.status, theme);
              const statusStyles = getStatusStyles(statusInfo.style);
              return (
                <View key={cert.id} style={styles.certificateCard}>
                  <View style={styles.certificateHeader}>
                    <Text style={styles.certificateName}>{cert.certificateName}</Text>
                    <View
                      style={[
                        styles.statusBadge,
                        statusStyles.badge,
                      ]}
                    >
                      <Text
                        style={[
                          styles.statusText,
                          statusStyles.text,
                        ]}
                      >
                        {statusInfo.text}
                      </Text>
                    </View>
                  </View>

                  {cert.imageUrl && (
                    <Image source={{ uri: cert.imageUrl }} style={styles.certificateImage} />
                  )}

                  <View style={styles.certificateInfo}>
                    <View style={styles.infoRow}>
                      <Text style={styles.infoLabel}>证书类型</Text>
                      <Text style={styles.infoValue}>
                        {CERTIFICATE_TYPES.find(t => t.value === cert.certificateType)?.label || '-'}
                      </Text>
                    </View>
                    {cert.issuingAuthority && (
                      <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>发证机构</Text>
                        <Text style={styles.infoValue}>{cert.issuingAuthority}</Text>
                      </View>
                    )}
                    {cert.certificateNumber && (
                      <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>证书编号</Text>
                        <Text style={styles.infoValue}>{cert.certificateNumber}</Text>
                      </View>
                    )}
                    <View style={styles.infoRow}>
                      <Text style={styles.infoLabel}>发证日期</Text>
                      <Text style={styles.infoValue}>{formatDate(cert.issueDate)}</Text>
                    </View>
                  </View>

                  {cert.status === 'rejected' && cert.rejectReason && (
                    <View style={styles.rejectReason}>
                      <Text style={styles.rejectReasonText}>拒绝原因: {cert.rejectReason}</Text>
                    </View>
                  )}

                  <View style={styles.certificateActions}>
                    <TouchableOpacity
                      style={[styles.actionButton, styles.editButton]}
                      onPress={() => openEditModal(cert)}
                    >
                      <FontAwesome6 name="pen" size={14} color={theme.primary} />
                      <Text style={[styles.actionButtonText, styles.editButtonText]}>编辑</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.actionButton, styles.deleteButton]}
                      onPress={() => handleDelete(cert)}
                    >
                      <FontAwesome6 name="trash" size={14} color={theme.error} />
                      <Text style={[styles.actionButtonText, styles.deleteButtonText]}>删除</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })
          )}
        </ScrollView>

        {/* Add/Edit Modal */}
        <Modal
          visible={modalVisible}
          animationType="slide"
          transparent
          onRequestClose={() => setModalVisible(false)}
        >
          <KeyboardAvoidingView
            style={styles.modalOverlay}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          >
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>
                  {editingCertificate ? '编辑证书' : '添加证书'}
                </Text>
                <TouchableOpacity onPress={() => setModalVisible(false)}>
                  <FontAwesome6 name="xmark" size={20} color={theme.textPrimary} />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.modalBody}>
                {/* Certificate Image */}
                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>证书图片 *</Text>
                  <TouchableOpacity style={styles.imagePicker} onPress={showImageOptions}>
                    {selectedImage ? (
                      <Image source={{ uri: selectedImage }} style={styles.previewImage} />
                    ) : editingCertificate?.imageUrl ? (
                      <Image source={{ uri: editingCertificate.imageUrl }} style={styles.previewImage} />
                    ) : (
                      <View style={styles.imagePickerContent}>
                        <FontAwesome6 name="cloud-arrow-up" size={32} color={theme.textMuted} />
                        <Text style={styles.imagePickerText}>点击上传证书图片</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                </View>

                {/* Certificate Name */}
                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>证书名称 *</Text>
                  <TextInput
                    style={styles.formInput}
                    placeholder="如：电工证、焊工证等"
                    placeholderTextColor={theme.textMuted}
                    value={certificateName}
                    onChangeText={setCertificateName}
                  />
                </View>

                {/* Certificate Type */}
                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>证书类型</Text>
                  <View style={styles.typeSelector}>
                    {CERTIFICATE_TYPES.map((type) => (
                      <TouchableOpacity
                        key={type.value}
                        style={[
                          styles.typeOption,
                          certificateType === type.value && styles.typeOptionSelected,
                        ]}
                        onPress={() => setCertificateType(type.value)}
                      >
                        <Text
                          style={[
                            styles.typeOptionText,
                            certificateType === type.value && styles.typeOptionTextSelected,
                          ]}
                        >
                          {type.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                {/* Issuing Authority */}
                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>发证机构</Text>
                  <TextInput
                    style={styles.formInput}
                    placeholder="发证机构名称"
                    placeholderTextColor={theme.textMuted}
                    value={issuingAuthority}
                    onChangeText={setIssuingAuthority}
                  />
                </View>

                {/* Certificate Number */}
                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>证书编号</Text>
                  <TextInput
                    style={styles.formInput}
                    placeholder="证书编号"
                    placeholderTextColor={theme.textMuted}
                    value={certificateNumber}
                    onChangeText={setCertificateNumber}
                  />
                </View>

                {/* Issue Date */}
                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>发证日期</Text>
                  <TextInput
                    style={styles.formInput}
                    placeholder="如：2024-01-01"
                    placeholderTextColor={theme.textMuted}
                    value={issueDate}
                    onChangeText={setIssueDate}
                  />
                </View>
              </ScrollView>

              <View style={styles.modalFooter}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => setModalVisible(false)}
                >
                  <Text style={styles.cancelButtonText}>取消</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.submitButton}
                  onPress={handleSubmit}
                  disabled={submitting}
                >
                  {submitting ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text style={styles.submitButtonText}>
                      {editingCertificate ? '更新' : '提交'}
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </KeyboardAvoidingView>
        </Modal>
      </View>
    </Screen>
  );
}
