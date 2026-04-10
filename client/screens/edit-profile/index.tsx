import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  Alert,
  ActivityIndicator,
  Platform,
  Modal,
  FlatList,
} from 'react-native';
import { FontAwesome6 } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { Screen } from '@/components/Screen';
import { useTheme } from '@/hooks/useTheme';
import { useAuth } from '@/contexts/AuthContext';
import { useSafeRouter } from '@/hooks/useSafeRouter';
import { createFormDataFile } from '@/utils';
import api from '@/utils/api';
import { Spacing, BorderRadius, Typography } from '@/constants/theme';

// 常用技能列表
const COMMON_SKILLS = [
  '搬运', '清洁', '装修', '电工', '木工', '水管工',
  '厨师', '服务员', '收银员', '保安', '司机', '快递员',
  '家政', '月嫂', '护工', '美容美发', '按摩', '其他'
];

export default function EditProfileScreen() {
  const { theme } = useTheme();
  const { user, updateUser, refreshUser } = useAuth();
  const router = useSafeRouter();
  const styles = useMemo(() => createStyles(theme), [theme]);

  // 状态
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  // 表单数据
  const [nickname, setNickname] = useState('');
  const [bio, setBio] = useState('');
  const [skills, setSkills] = useState<string[]>([]);
  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const [showSkillPicker, setShowSkillPicker] = useState(false);

  // 初始化数据
  useEffect(() => {
    if (user) {
      setNickname(user.nickname || '');
      setBio(user.bio || '');
      setSkills(user.skills || []);
      setAvatarUri(user.avatarUrl || null);
    }
  }, [user]);

  // 选择并上传头像
  const pickAndUploadAvatar = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('权限提示', '需要相册权限才能上传头像');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (result.canceled || !result.assets[0]) {
        return;
      }

      const asset = result.assets[0];
      setUploadingAvatar(true);

      // 上传头像
      const formData = new FormData();
      const file = await createFormDataFile(asset.uri, `avatar_${Date.now()}.jpg`, 'image/jpeg');
      formData.append('file', file as any);

      const uploadResult = await api.uploadAvatar(formData);

      setAvatarUri(uploadResult.avatarUrl);
      updateUser({ avatarUrl: uploadResult.avatarUrl });
    } catch (error) {
      console.error('Upload avatar error:', error);
      Alert.alert('上传失败', '头像上传失败，请重试');
    } finally {
      setUploadingAvatar(false);
    }
  };

  // 切换技能选择
  const toggleSkill = (skill: string) => {
    if (skills.includes(skill)) {
      setSkills(skills.filter(s => s !== skill));
    } else {
      if (skills.length >= 5) {
        Alert.alert('提示', '最多选择5个技能');
        return;
      }
      setSkills([...skills, skill]);
    }
  };

  // 保存资料
  const handleSave = async () => {
    if (!nickname.trim()) {
      Alert.alert('提示', '请输入昵称');
      return;
    }

    if (nickname.length > 20) {
      Alert.alert('提示', '昵称不能超过20个字符');
      return;
    }

    try {
      setSaving(true);

      await api.updateProfile({
        nickname: nickname.trim(),
        bio: bio.trim() || undefined,
        skills: skills.length > 0 ? skills : undefined,
      });

      updateUser({
        nickname: nickname.trim(),
        bio: bio.trim(),
        skills,
      });

      Alert.alert('保存成功', '个人资料已更新', [
        { text: '确定', onPress: () => router.back() }
      ]);
    } catch (error: any) {
      console.error('Save profile error:', error);
      Alert.alert('保存失败', error.message || '保存资料失败，请重试');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Screen backgroundColor={theme.backgroundRoot}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <FontAwesome6 name="arrow-left" size={20} color={theme.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>编辑资料</Text>
        <TouchableOpacity onPress={handleSave} disabled={saving}>
          {saving ? (
            <ActivityIndicator size="small" color={theme.primary} />
          ) : (
            <Text style={styles.saveButton}>保存</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        {/* 头像 */}
        <TouchableOpacity style={styles.avatarSection} onPress={pickAndUploadAvatar}>
          <View style={styles.avatarContainer}>
            {uploadingAvatar ? (
              <View style={[styles.avatar, { backgroundColor: theme.backgroundElevated }]}>
                <ActivityIndicator size="large" color={theme.primary} />
              </View>
            ) : avatarUri ? (
              <Image source={{ uri: avatarUri }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, { backgroundColor: `${theme.primary}20` }]}>
                <FontAwesome6 name="user" size={40} color={theme.primary} />
              </View>
            )}
            <View style={styles.avatarBadge}>
              <FontAwesome6 name="camera" size={12} color="#FFF" />
            </View>
          </View>
          <Text style={styles.avatarHint}>点击更换头像</Text>
        </TouchableOpacity>

        {/* 基本信息 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>基本信息</Text>
          
          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>昵称</Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="请输入昵称"
                placeholderTextColor={theme.textPlaceholder}
                value={nickname}
                onChangeText={setNickname}
                maxLength={20}
              />
              <Text style={styles.charCount}>{nickname.length}/20</Text>
            </View>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>个人简介</Text>
            <View style={[styles.inputContainer, styles.textAreaContainer]}>
              <TextInput
                style={styles.textArea}
                placeholder="介绍一下自己吧"
                placeholderTextColor={theme.textPlaceholder}
                value={bio}
                onChangeText={setBio}
                multiline
                numberOfLines={4}
                maxLength={200}
                textAlignVertical="top"
              />
              <Text style={styles.charCount}>{bio.length}/200</Text>
            </View>
          </View>
        </View>

        {/* 技能标签（仅工人显示） */}
        {user?.userType === 'worker' && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>技能标签</Text>
              <Text style={styles.sectionHint}>最多选择5个</Text>
            </View>
            
            <View style={styles.skillsContainer}>
              {skills.map((skill, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.skillTag}
                  onPress={() => toggleSkill(skill)}
                >
                  <Text style={styles.skillTagText}>{skill}</Text>
                  <FontAwesome6 name="xmark" size={12} color={theme.primary} />
                </TouchableOpacity>
              ))}
              <TouchableOpacity
                style={styles.addSkillButton}
                onPress={() => setShowSkillPicker(true)}
              >
                <FontAwesome6 name="plus" size={14} color={theme.primary} />
                <Text style={styles.addSkillText}>添加技能</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* 手机号（只读） */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>账号信息</Text>
          
          <View style={styles.readonlyItem}>
            <Text style={styles.readonlyLabel}>手机号</Text>
            <Text style={styles.readonlyValue}>{user?.phone || '-'}</Text>
          </View>

          <View style={styles.readonlyItem}>
            <Text style={styles.readonlyLabel}>用户类型</Text>
            <Text style={styles.readonlyValue}>
              {user?.userType === 'worker' ? '工人' : '雇主'}
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* 技能选择弹窗 */}
      <Modal
        visible={showSkillPicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowSkillPicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.backgroundSurface }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>选择技能</Text>
              <TouchableOpacity onPress={() => setShowSkillPicker(false)}>
                <FontAwesome6 name="xmark" size={20} color={theme.textPrimary} />
              </TouchableOpacity>
            </View>

            <FlatList
              data={COMMON_SKILLS}
              numColumns={3}
              keyExtractor={(item) => item}
              renderItem={({ item }) => {
                const isSelected = skills.includes(item);
                return (
                  <TouchableOpacity
                    style={[
                      styles.skillPickerItem,
                      isSelected && { backgroundColor: `${theme.primary}15`, borderColor: theme.primary }
                    ]}
                    onPress={() => toggleSkill(item)}
                  >
                    <Text style={[
                      styles.skillPickerText,
                      isSelected && { color: theme.primary }
                    ]}>
                      {item}
                    </Text>
                    {isSelected && (
                      <FontAwesome6 name="check" size={12} color={theme.primary} />
                    )}
                  </TouchableOpacity>
                );
              }}
              contentContainerStyle={styles.skillPickerList}
            />

            <TouchableOpacity
              style={[styles.modalButton, { backgroundColor: theme.primary }]}
              onPress={() => setShowSkillPicker(false)}
            >
              <Text style={styles.modalButtonText}>确定</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </Screen>
  );
}

const createStyles = (theme: any) =>
  StyleSheet.create({
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: Spacing.lg,
      paddingVertical: Spacing.md,
      backgroundColor: theme.backgroundRoot,
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: theme.textPrimary,
    },
    saveButton: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.primary,
    },
    scrollContent: {
      paddingHorizontal: Spacing.lg,
      paddingBottom: Spacing.xxl * 2,
    },
    // 头像部分
    avatarSection: {
      alignItems: 'center',
      paddingVertical: Spacing.xl,
    },
    avatarContainer: {
      position: 'relative',
    },
    avatar: {
      width: 100,
      height: 100,
      borderRadius: 50,
      justifyContent: 'center',
      alignItems: 'center',
    },
    avatarBadge: {
      position: 'absolute',
      right: 0,
      bottom: 0,
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: theme.primary,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 3,
      borderColor: theme.backgroundRoot,
    },
    avatarHint: {
      marginTop: Spacing.sm,
      fontSize: 14,
      color: theme.textSecondary,
    },
    // 区块
    section: {
      marginTop: Spacing.lg,
    },
    sectionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: Spacing.sm,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.textPrimary,
      marginBottom: Spacing.sm,
    },
    sectionHint: {
      fontSize: 12,
      color: theme.textSecondary,
    },
    // 表单
    formGroup: {
      marginBottom: Spacing.md,
    },
    formLabel: {
      fontSize: 14,
      fontWeight: '500',
      color: theme.textSecondary,
      marginBottom: Spacing.xs,
    },
    inputContainer: {
      backgroundColor: theme.backgroundElevated,
      borderRadius: BorderRadius.md,
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.6)',
      position: 'relative',
    },
    input: {
      padding: Spacing.md,
      fontSize: 15,
      color: theme.textPrimary,
      paddingRight: 60,
    },
    textAreaContainer: {
      minHeight: 120,
    },
    textArea: {
      padding: Spacing.md,
      fontSize: 15,
      color: theme.textPrimary,
      height: 120,
    },
    charCount: {
      position: 'absolute',
      right: Spacing.md,
      bottom: Spacing.sm,
      fontSize: 12,
      color: theme.textPlaceholder,
    },
    // 技能
    skillsContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: Spacing.sm,
    },
    skillTag: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.xs,
      backgroundColor: `${theme.primary}12`,
      borderRadius: BorderRadius.xl,
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.xs + 2,
    },
    skillTagText: {
      fontSize: 14,
      color: theme.primary,
      fontWeight: '500',
    },
    addSkillButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.xs,
      backgroundColor: theme.backgroundElevated,
      borderRadius: BorderRadius.xl,
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.xs + 2,
      borderWidth: 1,
      borderColor: theme.border,
      borderStyle: 'dashed',
    },
    addSkillText: {
      fontSize: 14,
      color: theme.primary,
      fontWeight: '500',
    },
    // 只读信息
    readonlyItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: Spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
    },
    readonlyLabel: {
      fontSize: 15,
      color: theme.textSecondary,
    },
    readonlyValue: {
      fontSize: 15,
      color: theme.textPrimary,
      fontWeight: '500',
    },
    // 弹窗
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'flex-end',
    },
    modalContent: {
      borderTopLeftRadius: BorderRadius.xl,
      borderTopRightRadius: BorderRadius.xl,
      paddingBottom: 40,
      maxHeight: '70%',
    },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: Spacing.lg,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
    },
    modalTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: theme.textPrimary,
    },
    skillPickerList: {
      padding: Spacing.lg,
    },
    skillPickerItem: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: Spacing.xs,
      margin: Spacing.xs,
      padding: Spacing.sm,
      borderRadius: BorderRadius.md,
      backgroundColor: theme.backgroundElevated,
      borderWidth: 1,
      borderColor: theme.border,
    },
    skillPickerText: {
      fontSize: 14,
      color: theme.textPrimary,
    },
    modalButton: {
      margin: Spacing.lg,
      borderRadius: BorderRadius.xl,
      paddingVertical: Spacing.md + 2,
      alignItems: 'center',
    },
    modalButtonText: {
      fontSize: 16,
      fontWeight: '700',
      color: '#FFFFFF',
    },
  });
