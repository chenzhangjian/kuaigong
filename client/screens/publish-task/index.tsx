import React, { useMemo, useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Modal,
  FlatList,
} from 'react-native';
import { FontAwesome6, Ionicons } from '@expo/vector-icons';
import { Screen } from '@/components/Screen';
import { useTheme } from '@/hooks/useTheme';
import { useSafeRouter } from '@/hooks/useSafeRouter';
import { createStyles } from './styles';
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
  { label: '一周以上', value: 80 },
];

// 紧急程度选项
const URGENCY_OPTIONS = [
  { label: '普通', value: 'normal', color: '#6C63FF' },
  { label: '紧急', value: 'urgent', color: '#F39C12' },
  { label: '非常紧急', value: 'very_urgent', color: '#E74C3C' },
];

// 预算类型选项
const BUDGET_TYPE_OPTIONS = [
  { label: '固定预算', value: 'fixed' },
  { label: '预算范围', value: 'range' },
  { label: '面议', value: 'negotiable' },
];

interface Category {
  id: string;
  name: string;
  icon: string;
}

export default function PublishTaskScreen() {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const router = useSafeRouter();

  // 表单状态
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [address, setAddress] = useState('');
  const [latitude, setLatitude] = useState<number | undefined>();
  const [longitude, setLongitude] = useState<number | undefined>();
  const [budgetType, setBudgetType] = useState<'fixed' | 'range' | 'negotiable'>('fixed');
  const [budgetFixed, setBudgetFixed] = useState('');
  const [budgetMin, setBudgetMin] = useState('');
  const [budgetMax, setBudgetMax] = useState('');
  const [estimatedDuration, setEstimatedDuration] = useState<number>(2);
  const [urgency, setUrgency] = useState<'normal' | 'urgent' | 'very_urgent'>('normal');
  const [workTime, setWorkTime] = useState('');
  const [loading, setLoading] = useState(false);
  
  // 弹窗状态
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [showDurationPicker, setShowDurationPicker] = useState(false);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [showUrgencyPicker, setShowUrgencyPicker] = useState(false);
  const [showBudgetTypePicker, setShowBudgetTypePicker] = useState(false);
  
  // 分类数据
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);

  // 加载任务分类
  useEffect(() => {
    loadCategories();
  }, []);

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
      Alert.alert('提示', '请选择工作地点');
      return;
    }
    
    // 预算验证
    if (budgetType === 'fixed') {
      if (!budgetFixed.trim() || parseFloat(budgetFixed) <= 0) {
        Alert.alert('提示', '请输入有效的预算金额');
        return;
      }
    } else if (budgetType === 'range') {
      if (!budgetMin.trim() || !budgetMax.trim()) {
        Alert.alert('提示', '请输入预算范围');
        return;
      }
      if (parseFloat(budgetMin) >= parseFloat(budgetMax)) {
        Alert.alert('提示', '预算最小值必须小于最大值');
        return;
      }
    }

    setLoading(true);
    try {
      const taskData: any = {
        title,
        description,
        categoryId: selectedCategory.id,
        address,
        latitude,
        longitude,
        budgetType,
        estimatedDuration,
        urgency,
        workTime,
      };

      if (budgetType === 'fixed') {
        taskData.budgetFixed = parseFloat(budgetFixed);
      } else if (budgetType === 'range') {
        taskData.budgetMin = parseFloat(budgetMin);
        taskData.budgetMax = parseFloat(budgetMax);
      }

      await api.createTask(taskData);

      Alert.alert('成功', '任务发布成功', [
        { text: '确定', onPress: () => router.back() }
      ]);
    } catch (error: any) {
      // 处理特殊错误码
      if (error.code === 'VERIFICATION_REQUIRED' || error.code === 'VERIFICATION_PENDING' || error.code === 'VERIFICATION_REJECTED') {
        Alert.alert(
          '无法发布任务',
          error.message,
          [
            { text: '取消', style: 'cancel' },
            { text: '去认证', onPress: () => router.push('/verification') },
          ]
        );
      } else if (error.code === 'DISCLAIMER_REQUIRED') {
        Alert.alert(
          '无法发布任务',
          error.message,
          [
            { text: '取消', style: 'cancel' },
            { text: '去签署', onPress: () => router.push('/verification') },
          ]
        );
      } else {
        Alert.alert('发布失败', error.message || '请重试');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLocationSelect = (location: { address: string; latitude: number; longitude: number }) => {
    setAddress(location.address);
    setLatitude(location.latitude);
    setLongitude(location.longitude);
    setShowLocationPicker(false);
  };

  const getDurationLabel = (value: number) => {
    const option = DURATION_OPTIONS.find(o => o.value === value);
    return option?.label || '选择时长';
  };

  const getUrgencyLabel = (value: string) => {
    const option = URGENCY_OPTIONS.find(o => o.value === value);
    return option?.label || '普通';
  };

  const getUrgencyColor = (value: string) => {
    const option = URGENCY_OPTIONS.find(o => o.value === value);
    return option?.color || theme.primary;
  };

  const getBudgetTypeLabel = (value: string) => {
    const option = BUDGET_TYPE_OPTIONS.find(o => o.value === value);
    return option?.label || '固定预算';
  };

  return (
    <Screen backgroundColor={theme.backgroundRoot} statusBarStyle="dark">
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <FontAwesome6 name="arrow-left" size={24} color={theme.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>发布任务</Text>
          <View style={{ width: 24 }} />
        </View>

        {/* Form */}
        <View style={styles.form}>
          {/* 任务标题 */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>任务标题 <Text style={styles.required}>*</Text></Text>
            <TextInput
              style={styles.input}
              placeholder="请输入任务标题，如：搬家搬运"
              placeholderTextColor={theme.textMuted}
              value={title}
              onChangeText={setTitle}
              maxLength={50}
            />
            <Text style={styles.charCount}>{title.length}/50</Text>
          </View>

          {/* 任务分类 */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>任务分类 <Text style={styles.required}>*</Text></Text>
            <TouchableOpacity
              style={styles.pickerInput}
              onPress={() => setShowCategoryPicker(true)}
            >
              <FontAwesome6 name="tag" size={18} color={theme.primary} />
              <Text style={[styles.pickerText, !selectedCategory && { color: theme.textMuted }]}>
                {selectedCategory?.name || '请选择任务分类'}
              </Text>
              <Ionicons name="chevron-forward" size={18} color={theme.textMuted} />
            </TouchableOpacity>
          </View>

          {/* 任务描述 */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>任务描述</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="详细描述您的需求，包括具体工作内容、要求等"
              placeholderTextColor={theme.textMuted}
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>

          {/* 工作地点 */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>工作地点 <Text style={styles.required}>*</Text></Text>
            <TouchableOpacity
              style={styles.pickerInput}
              onPress={() => setShowLocationPicker(true)}
            >
              <Ionicons name="location-outline" size={20} color={theme.primary} />
              <Text
                style={[styles.pickerText, !address && { color: theme.textMuted }]}
                numberOfLines={1}
              >
                {address || '点击选择工作地点'}
              </Text>
              <Ionicons name="chevron-forward" size={18} color={theme.textMuted} />
            </TouchableOpacity>
            {latitude && longitude && (
              <Text style={styles.locationHint}>
                ✓ 已获取精确位置
              </Text>
            )}
          </View>

          {/* 工作时间 */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>工作时间</Text>
            <TextInput
              style={styles.input}
              placeholder="如：周一至周五 9:00-18:00"
              placeholderTextColor={theme.textMuted}
              value={workTime}
              onChangeText={setWorkTime}
            />
          </View>

          {/* 预计时长 */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>预计时长 <Text style={styles.required}>*</Text></Text>
            <TouchableOpacity
              style={styles.pickerInput}
              onPress={() => setShowDurationPicker(true)}
            >
              <FontAwesome6 name="clock" size={18} color={theme.primary} />
              <Text style={styles.pickerText}>
                {getDurationLabel(estimatedDuration)}
              </Text>
              <Ionicons name="chevron-forward" size={18} color={theme.textMuted} />
            </TouchableOpacity>
          </View>

          {/* 紧急程度 */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>紧急程度</Text>
            <TouchableOpacity
              style={styles.pickerInput}
              onPress={() => setShowUrgencyPicker(true)}
            >
              <FontAwesome6 
                name={urgency === 'normal' ? 'clock' : urgency === 'urgent' ? 'bolt' : 'fire'} 
                size={18} 
                color={getUrgencyColor(urgency)} 
              />
              <Text style={[styles.pickerText, { color: getUrgencyColor(urgency) }]}>
                {getUrgencyLabel(urgency)}
              </Text>
              <Ionicons name="chevron-forward" size={18} color={theme.textMuted} />
            </TouchableOpacity>
          </View>

          {/* 预算类型 */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>预算类型</Text>
            <TouchableOpacity
              style={styles.pickerInput}
              onPress={() => setShowBudgetTypePicker(true)}
            >
              <FontAwesome6 name="coins" size={18} color={theme.primary} />
              <Text style={styles.pickerText}>
                {getBudgetTypeLabel(budgetType)}
              </Text>
              <Ionicons name="chevron-forward" size={18} color={theme.textMuted} />
            </TouchableOpacity>
          </View>

          {/* 预算金额 */}
          {budgetType === 'fixed' && (
            <View style={styles.inputContainer}>
              <Text style={styles.label}>预算金额 <Text style={styles.required}>*</Text></Text>
              <View style={styles.budgetInput}>
                <Text style={styles.currencySymbol}>¥</Text>
                <TextInput
                  style={styles.budgetTextInput}
                  placeholder="请输入预算金额"
                  placeholderTextColor={theme.textMuted}
                  value={budgetFixed}
                  onChangeText={setBudgetFixed}
                  keyboardType="numeric"
                />
              </View>
            </View>
          )}

          {budgetType === 'range' && (
            <View style={styles.inputContainer}>
              <Text style={styles.label}>预算范围 <Text style={styles.required}>*</Text></Text>
              <View style={styles.budgetRangeContainer}>
                <View style={styles.budgetRangeInput}>
                  <Text style={styles.currencySymbol}>¥</Text>
                  <TextInput
                    style={styles.budgetTextInput}
                    placeholder="最低"
                    placeholderTextColor={theme.textMuted}
                    value={budgetMin}
                    onChangeText={setBudgetMin}
                    keyboardType="numeric"
                  />
                </View>
                <Text style={styles.rangeSeparator}>—</Text>
                <View style={styles.budgetRangeInput}>
                  <Text style={styles.currencySymbol}>¥</Text>
                  <TextInput
                    style={styles.budgetTextInput}
                    placeholder="最高"
                    placeholderTextColor={theme.textMuted}
                    value={budgetMax}
                    onChangeText={setBudgetMax}
                    keyboardType="numeric"
                  />
                </View>
              </View>
            </View>
          )}

          {budgetType === 'negotiable' && (
            <View style={styles.inputContainer}>
              <View style={styles.negotiableHint}>
                <Ionicons name="information-circle-outline" size={16} color={theme.textSecondary} />
                <Text style={styles.negotiableHintText}>预算面议，工人可在申请时报价</Text>
              </View>
            </View>
          )}

          {/* 发布按钮 */}
          <TouchableOpacity
            style={[styles.publishButton, loading && styles.publishButtonDisabled]}
            onPress={handlePublish}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <FontAwesome6 name="paper-plane" size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
                <Text style={styles.publishButtonText}>发布任务</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* 分类选择弹窗 */}
      <Modal
        visible={showCategoryPicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowCategoryPicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>选择任务分类</Text>
              <TouchableOpacity onPress={() => setShowCategoryPicker(false)}>
                <Ionicons name="close" size={24} color={theme.textPrimary} />
              </TouchableOpacity>
            </View>
            <FlatList
              data={categories}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.optionItem,
                    selectedCategory?.id === item.id && styles.optionItemSelected
                  ]}
                  onPress={() => {
                    setSelectedCategory(item);
                    setShowCategoryPicker(false);
                  }}
                >
                  <Text style={[
                    styles.optionText,
                    selectedCategory?.id === item.id && styles.optionTextSelected
                  ]}>
                    {item.name}
                  </Text>
                  {selectedCategory?.id === item.id && (
                    <FontAwesome6 name="check" size={18} color={theme.primary} />
                  )}
                </TouchableOpacity>
              )}
              style={styles.optionsList}
            />
          </View>
        </View>
      </Modal>

      {/* 时长选择弹窗 */}
      <Modal
        visible={showDurationPicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowDurationPicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>选择预计时长</Text>
              <TouchableOpacity onPress={() => setShowDurationPicker(false)}>
                <Ionicons name="close" size={24} color={theme.textPrimary} />
              </TouchableOpacity>
            </View>
            <FlatList
              data={DURATION_OPTIONS}
              keyExtractor={(item) => item.value.toString()}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.optionItem,
                    estimatedDuration === item.value && styles.optionItemSelected
                  ]}
                  onPress={() => {
                    setEstimatedDuration(item.value);
                    setShowDurationPicker(false);
                  }}
                >
                  <Text style={[
                    styles.optionText,
                    estimatedDuration === item.value && styles.optionTextSelected
                  ]}>
                    {item.label}
                  </Text>
                  {estimatedDuration === item.value && (
                    <FontAwesome6 name="check" size={18} color={theme.primary} />
                  )}
                </TouchableOpacity>
              )}
              style={styles.optionsList}
            />
          </View>
        </View>
      </Modal>

      {/* 紧急程度选择弹窗 */}
      <Modal
        visible={showUrgencyPicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowUrgencyPicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>选择紧急程度</Text>
              <TouchableOpacity onPress={() => setShowUrgencyPicker(false)}>
                <Ionicons name="close" size={24} color={theme.textPrimary} />
              </TouchableOpacity>
            </View>
            <FlatList
              data={URGENCY_OPTIONS}
              keyExtractor={(item) => item.value}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.optionItem,
                    urgency === item.value && styles.optionItemSelected
                  ]}
                  onPress={() => {
                    setUrgency(item.value as any);
                    setShowUrgencyPicker(false);
                  }}
                >
                  <View style={styles.optionContent}>
                    <View style={[styles.urgencyDot, { backgroundColor: item.color }]} />
                    <Text style={[
                      styles.optionText,
                      urgency === item.value && styles.optionTextSelected
                    ]}>
                      {item.label}
                    </Text>
                  </View>
                  {urgency === item.value && (
                    <FontAwesome6 name="check" size={18} color={theme.primary} />
                  )}
                </TouchableOpacity>
              )}
              style={styles.optionsList}
            />
          </View>
        </View>
      </Modal>

      {/* 预算类型选择弹窗 */}
      <Modal
        visible={showBudgetTypePicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowBudgetTypePicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>选择预算类型</Text>
              <TouchableOpacity onPress={() => setShowBudgetTypePicker(false)}>
                <Ionicons name="close" size={24} color={theme.textPrimary} />
              </TouchableOpacity>
            </View>
            <FlatList
              data={BUDGET_TYPE_OPTIONS}
              keyExtractor={(item) => item.value}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.optionItem,
                    budgetType === item.value && styles.optionItemSelected
                  ]}
                  onPress={() => {
                    setBudgetType(item.value as any);
                    setShowBudgetTypePicker(false);
                  }}
                >
                  <Text style={[
                    styles.optionText,
                    budgetType === item.value && styles.optionTextSelected
                  ]}>
                    {item.label}
                  </Text>
                  {budgetType === item.value && (
                    <FontAwesome6 name="check" size={18} color={theme.primary} />
                  )}
                </TouchableOpacity>
              )}
              style={styles.optionsList}
            />
          </View>
        </View>
      </Modal>

      {/* Location Picker */}
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
    </Screen>
  );
}
