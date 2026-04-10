/**
 * 发布任务对话框组件
 * 可在雇主首页快速发布任务
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  StyleSheet,
} from 'react-native';
import { FontAwesome6 } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { Spacing, BorderRadius } from '@/constants/theme';
import api from '@/utils/api';
import LocationPicker from '@/components/LocationPicker';

// 预设时长选项
const DURATION_OPTIONS = [
  { label: '1小时以内', value: 1 },
  { label: '1-2小时', value: 2 },
  { label: '2-4小时', value: 4 },
  { label: '半天(4-6小时)', value: 6 },
  { label: '全天(8小时)', value: 8 },
  { label: '2-3天', value: 24 },
  { label: '一周以内', value: 56 },
];

// 紧急程度选项
const URGENCY_OPTIONS = [
  { label: '普通', value: 'normal', color: '#6C63FF' },
  { label: '紧急', value: 'urgent', color: '#F39C12' },
  { label: '非常紧急', value: 'very_urgent', color: '#E74C3C' },
];

interface Category {
  id: string;
  name: string;
  icon: string;
}

interface PublishTaskModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function PublishTaskModal({ visible, onClose, onSuccess }: PublishTaskModalProps) {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  // 表单状态
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [address, setAddress] = useState('');
  const [latitude, setLatitude] = useState<number | undefined>();
  const [longitude, setLongitude] = useState<number | undefined>();
  const [budget, setBudget] = useState('');
  const [estimatedDuration, setEstimatedDuration] = useState(2);
  const [urgency, setUrgency] = useState<'normal' | 'urgent' | 'very_urgent'>('normal');
  const [workTime, setWorkTime] = useState('');
  const [loading, setLoading] = useState(false);

  // 弹窗状态
  const [showDurationPicker, setShowDurationPicker] = useState(false);
  const [showUrgencyPicker, setShowUrgencyPicker] = useState(false);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [showLocationPicker, setShowLocationPicker] = useState(false);

  // 分类数据
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);

  // 加载分类
  useEffect(() => {
    if (visible) {
      loadCategories();
    }
  }, [visible]);

  const loadCategories = async () => {
    try {
      const data = await api.getTaskCategories();
      setCategories(data);
      if (data.length > 0) {
        setSelectedCategory(data[0]);
      }
    } catch (error) {
      console.error('Load categories error:', error);
    }
  };

  // 重置表单
  const resetForm = () => {
    setTitle('');
    setDescription('');
    setAddress('');
    setLatitude(undefined);
    setLongitude(undefined);
    setBudget('');
    setEstimatedDuration(2);
    setUrgency('normal');
    setWorkTime('');
    setShowDurationPicker(false);
    setShowUrgencyPicker(false);
    setShowCategoryPicker(false);
    setShowLocationPicker(false);
  };

  // 关闭弹窗
  const handleClose = () => {
    resetForm();
    onClose();
  };

  // 发布任务
  const handlePublish = async () => {
    // 表单验证
    if (!title.trim()) {
      Alert.alert('提示', '请输入任务标题');
      return;
    }
    if (!selectedCategory) {
      Alert.alert('提示', '请选择任务分类');
      return;
    }
    if (!address.trim()) {
      Alert.alert('提示', '请输入工作地点');
      return;
    }
    if (!budget.trim() || parseFloat(budget) <= 0) {
      Alert.alert('提示', '请输入有效的预算金额');
      return;
    }

    setLoading(true);
    try {
      await api.createTask({
        title,
        description,
        categoryId: selectedCategory.id,
        address,
        latitude,
        longitude,
        budgetType: 'fixed',
        budgetFixed: parseFloat(budget),
        estimatedDuration,
        urgency,
        workTime,
      });

      Alert.alert('成功', '任务发布成功！', [
        {
          text: '确定',
          onPress: () => {
            resetForm();
            onSuccess();
          },
        },
      ]);
    } catch (error: any) {
      Alert.alert('发布失败', error.message || '请重试');
    } finally {
      setLoading(false);
    }
  };

  const getDurationLabel = (value: number) => {
    const option = DURATION_OPTIONS.find((o) => o.value === value);
    return option?.label || '选择时长';
  };

  const getUrgencyOption = (value: string) => {
    return URGENCY_OPTIONS.find((o) => o.value === value) || URGENCY_OPTIONS[0];
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <KeyboardAvoidingView
          style={styles.modalContainer}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <TouchableWithoutFeedback>
            <View style={styles.modalContent}>
              {/* Header */}
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>发布新任务</Text>
                <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
                  <FontAwesome6 name="xmark" size={20} color={theme.textSecondary} />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
                {/* 任务标题 */}
                <View style={styles.field}>
                  <Text style={styles.label}>任务标题 *</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="简要描述您的任务"
                    placeholderTextColor={theme.textMuted}
                    value={title}
                    onChangeText={setTitle}
                    maxLength={50}
                  />
                </View>

                {/* 任务分类 */}
                <View style={styles.field}>
                  <Text style={styles.label}>任务分类 *</Text>
                  <TouchableOpacity
                    style={styles.selector}
                    onPress={() => setShowCategoryPicker(true)}
                  >
                    <FontAwesome6
                      name={selectedCategory?.icon as any || 'tag'}
                      size={18}
                      color={theme.primary}
                    />
                    <Text style={styles.selectorText}>
                      {selectedCategory?.name || '选择分类'}
                    </Text>
                    <FontAwesome6 name="chevron-down" size={14} color={theme.textMuted} />
                  </TouchableOpacity>
                </View>

                {/* 工作地点 */}
                <View style={styles.field}>
                  <Text style={styles.label}>工作地点 *</Text>
                  <TouchableOpacity
                    style={styles.selector}
                    onPress={() => setShowLocationPicker(true)}
                  >
                    <FontAwesome6 name="location-dot" size={18} color={theme.primary} />
                    <Text style={[styles.selectorText, !address && { color: theme.textMuted }]}>
                      {address || '点击选择工作地点'}
                    </Text>
                    <FontAwesome6 name="chevron-right" size={14} color={theme.textMuted} />
                  </TouchableOpacity>
                  {latitude && longitude && (
                    <Text style={styles.locationHint}>✓ 已获取精确位置</Text>
                  )}
                </View>

                {/* 预算金额 */}
                <View style={styles.field}>
                  <Text style={styles.label}>预算金额 *</Text>
                  <View style={styles.inputWithIcon}>
                    <Text style={styles.currencySymbol}>¥</Text>
                    <TextInput
                      style={styles.inputWithIconText}
                      placeholder="输入预算金额"
                      placeholderTextColor={theme.textMuted}
                      value={budget}
                      onChangeText={setBudget}
                      keyboardType="decimal-pad"
                    />
                  </View>
                </View>

                {/* 预计时长 */}
                <View style={styles.field}>
                  <Text style={styles.label}>预计时长</Text>
                  <TouchableOpacity
                    style={styles.selector}
                    onPress={() => setShowDurationPicker(true)}
                  >
                    <FontAwesome6 name="clock" size={18} color={theme.primary} />
                    <Text style={styles.selectorText}>{getDurationLabel(estimatedDuration)}</Text>
                    <FontAwesome6 name="chevron-down" size={14} color={theme.textMuted} />
                  </TouchableOpacity>
                </View>

                {/* 紧急程度 */}
                <View style={styles.field}>
                  <Text style={styles.label}>紧急程度</Text>
                  <View style={styles.urgencyOptions}>
                    {URGENCY_OPTIONS.map((option) => (
                      <TouchableOpacity
                        key={option.value}
                        style={[
                          styles.urgencyOption,
                          urgency === option.value && {
                            backgroundColor: `${option.color}15`,
                            borderColor: option.color,
                          },
                        ]}
                        onPress={() => setUrgency(option.value as any)}
                      >
                        <View
                          style={[
                            styles.urgencyDot,
                            { backgroundColor: option.color },
                          ]}
                        />
                        <Text
                          style={[
                            styles.urgencyText,
                            urgency === option.value && { color: option.color },
                          ]}
                        >
                          {option.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                {/* 工作时间 */}
                <View style={styles.field}>
                  <Text style={styles.label}>工作时间要求</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="例如：工作日上午9点-下午5点"
                    placeholderTextColor={theme.textMuted}
                    value={workTime}
                    onChangeText={setWorkTime}
                  />
                </View>

                {/* 任务描述 */}
                <View style={styles.field}>
                  <Text style={styles.label}>任务描述</Text>
                  <TextInput
                    style={[styles.input, styles.textArea]}
                    placeholder="详细描述任务要求、注意事项等"
                    placeholderTextColor={theme.textMuted}
                    value={description}
                    onChangeText={setDescription}
                    multiline
                    numberOfLines={4}
                    textAlignVertical="top"
                  />
                </View>
              </ScrollView>

              {/* Footer */}
              <View style={styles.modalFooter}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={handleClose}
                >
                  <Text style={styles.cancelButtonText}>取消</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.submitButton, loading && styles.submitButtonDisabled]}
                  onPress={handlePublish}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text style={styles.submitButtonText}>发布任务</Text>
                  )}
                </TouchableOpacity>
              </View>

              {/* 分类选择器 */}
              <Modal visible={showCategoryPicker} transparent animationType="fade">
                <TouchableOpacity
                  style={styles.pickerOverlay}
                  activeOpacity={1}
                  onPress={() => setShowCategoryPicker(false)}
                >
                  <View style={styles.pickerContent}>
                    <Text style={styles.pickerTitle}>选择分类</Text>
                    <ScrollView showsVerticalScrollIndicator={false}>
                      {categories.map((category) => (
                        <TouchableOpacity
                          key={category.id}
                          style={[
                            styles.pickerItem,
                            selectedCategory?.id === category.id && styles.pickerItemActive,
                          ]}
                          onPress={() => {
                            setSelectedCategory(category);
                            setShowCategoryPicker(false);
                          }}
                        >
                          <FontAwesome6
                            name={category.icon as any}
                            size={20}
                            color={
                              selectedCategory?.id === category.id
                                ? theme.primary
                                : theme.textSecondary
                            }
                          />
                          <Text
                            style={[
                              styles.pickerItemText,
                              selectedCategory?.id === category.id && styles.pickerItemTextActive,
                            ]}
                          >
                            {category.name}
                          </Text>
                          {selectedCategory?.id === category.id && (
                            <FontAwesome6 name="check" size={16} color={theme.primary} />
                          )}
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                </TouchableOpacity>
              </Modal>

              {/* 时长选择器 */}
              <Modal visible={showDurationPicker} transparent animationType="fade">
                <TouchableOpacity
                  style={styles.pickerOverlay}
                  activeOpacity={1}
                  onPress={() => setShowDurationPicker(false)}
                >
                  <View style={styles.pickerContent}>
                    <Text style={styles.pickerTitle}>选择预计时长</Text>
                    <ScrollView showsVerticalScrollIndicator={false}>
                      {DURATION_OPTIONS.map((option) => (
                        <TouchableOpacity
                          key={option.value}
                          style={[
                            styles.pickerItem,
                            estimatedDuration === option.value && styles.pickerItemActive,
                          ]}
                          onPress={() => {
                            setEstimatedDuration(option.value);
                            setShowDurationPicker(false);
                          }}
                        >
                          <Text
                            style={[
                              styles.pickerItemText,
                              estimatedDuration === option.value && styles.pickerItemTextActive,
                            ]}
                          >
                            {option.label}
                          </Text>
                          {estimatedDuration === option.value && (
                            <FontAwesome6 name="check" size={16} color={theme.primary} />
                          )}
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                </TouchableOpacity>
              </Modal>

              {/* 位置选择器 */}
              <LocationPicker
                visible={showLocationPicker}
                onClose={() => setShowLocationPicker(false)}
                onSelect={(location: { address: string; lat?: number; lng?: number; name?: string }) => {
                  setAddress(location.address);
                  setLatitude(location.lat);
                  setLongitude(location.lng);
                  setShowLocationPicker(false);
                }}
              />
            </View>
          </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const createStyles = (theme: any) =>
  StyleSheet.create({
    modalContainer: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.5)',
      justifyContent: 'flex-end' as const,
    },
    modalContent: {
      backgroundColor: theme.backgroundDefault,
      borderTopLeftRadius: BorderRadius['3xl'],
      borderTopRightRadius: BorderRadius['3xl'],
      maxHeight: '90%' as const,
    },
    modalHeader: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      justifyContent: 'space-between' as const,
      padding: Spacing.xl,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
    },
    modalTitle: {
      fontSize: 18,
      fontWeight: '700' as const,
      color: theme.textPrimary,
    },
    closeButton: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: theme.backgroundElevated,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
    },
    modalBody: {
      padding: Spacing.xl,
      maxHeight: 500,
    },
    field: {
      marginBottom: Spacing.xl,
    },
    label: {
      fontSize: 14,
      fontWeight: '600' as const,
      color: theme.textPrimary,
      marginBottom: Spacing.sm,
    },
    input: {
      backgroundColor: theme.backgroundElevated,
      borderRadius: BorderRadius.xl,
      paddingHorizontal: Spacing.lg,
      paddingVertical: Spacing.md,
      fontSize: 16,
      color: theme.textPrimary,
      borderWidth: 1,
      borderColor: theme.border,
    },
    inputWithIcon: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      backgroundColor: theme.backgroundElevated,
      borderRadius: BorderRadius.xl,
      paddingHorizontal: Spacing.lg,
      borderWidth: 1,
      borderColor: theme.border,
    },
    inputWithIconText: {
      flex: 1,
      paddingVertical: Spacing.md,
      fontSize: 16,
      color: theme.textPrimary,
      marginLeft: Spacing.sm,
    },
    currencySymbol: {
      fontSize: 18,
      fontWeight: '600' as const,
      color: theme.textSecondary,
    },
    textArea: {
      minHeight: 100,
      paddingTop: Spacing.md,
    },
    selector: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      backgroundColor: theme.backgroundElevated,
      borderRadius: BorderRadius.xl,
      paddingHorizontal: Spacing.lg,
      paddingVertical: Spacing.md,
      borderWidth: 1,
      borderColor: theme.border,
    },
    selectorText: {
      flex: 1,
      fontSize: 16,
      color: theme.textPrimary,
      marginLeft: Spacing.sm,
    },
    locationHint: {
      fontSize: 12,
      color: theme.success,
      marginTop: Spacing.xs,
      marginLeft: Spacing.sm,
    },
    urgencyOptions: {
      flexDirection: 'row' as const,
      gap: Spacing.sm,
    },
    urgencyOption: {
      flex: 1,
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      paddingVertical: Spacing.md,
      borderRadius: BorderRadius.xl,
      borderWidth: 1,
      borderColor: theme.border,
      backgroundColor: theme.backgroundElevated,
    },
    urgencyDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      marginRight: Spacing.xs,
    },
    urgencyText: {
      fontSize: 14,
      fontWeight: '500' as const,
      color: theme.textSecondary,
    },
    modalFooter: {
      flexDirection: 'row' as const,
      padding: Spacing.xl,
      gap: Spacing.md,
      borderTopWidth: 1,
      borderTopColor: theme.border,
    },
    cancelButton: {
      flex: 1,
      paddingVertical: Spacing.md,
      borderRadius: BorderRadius.xl,
      borderWidth: 1,
      borderColor: theme.border,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
    },
    cancelButtonText: {
      fontSize: 16,
      fontWeight: '600' as const,
      color: theme.textSecondary,
    },
    submitButton: {
      flex: 2,
      paddingVertical: Spacing.md,
      borderRadius: BorderRadius.xl,
      backgroundColor: theme.primary,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
    },
    submitButtonDisabled: {
      opacity: 0.6,
    },
    submitButtonText: {
      fontSize: 16,
      fontWeight: '600' as const,
      color: '#FFFFFF',
    },
    pickerOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.5)',
      justifyContent: 'center' as const,
      padding: Spacing.xl,
    },
    pickerContent: {
      backgroundColor: theme.backgroundDefault,
      borderRadius: BorderRadius['2xl'],
      padding: Spacing.xl,
      maxHeight: 400,
    },
    pickerTitle: {
      fontSize: 18,
      fontWeight: '700' as const,
      color: theme.textPrimary,
      marginBottom: Spacing.lg,
      textAlign: 'center' as const,
    },
    pickerItem: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      paddingVertical: Spacing.md,
      paddingHorizontal: Spacing.lg,
      borderRadius: BorderRadius.xl,
      marginBottom: Spacing.sm,
    },
    pickerItemActive: {
      backgroundColor: `${theme.primary}10`,
    },
    pickerItemText: {
      flex: 1,
      fontSize: 16,
      color: theme.textSecondary,
      marginLeft: Spacing.md,
    },
    pickerItemTextActive: {
      color: theme.primary,
      fontWeight: '600' as const,
    },
  });

export default PublishTaskModal;
