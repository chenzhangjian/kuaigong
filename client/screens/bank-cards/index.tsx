import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  ActivityIndicator,
  Alert,
  Platform,
  KeyboardAvoidingView,
  TouchableWithoutFeedback,
  Keyboard,
  FlatList,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Ionicons, FontAwesome6 } from '@expo/vector-icons';
import { Screen } from '@/components/Screen';
import { useTheme } from '@/hooks/useTheme';
import { useSafeRouter } from '@/hooks/useSafeRouter';
import api from '@/utils/api';

interface BankCard {
  id: string;
  bankName: string;
  bankCode: string;
  cardNumber: string;
  cardNumberLast4: string;
  cardHolder: string;
  cardType: string;
  isDefault: boolean;
  status: string;
  createdAt: string;
}

interface Bank {
  code: string;
  name: string;
  icon: string;
}

export default function BankCardsScreen() {
  const { theme } = useTheme();
  const router = useSafeRouter();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const [cards, setCards] = useState<BankCard[]>([]);
  const [banks, setBanks] = useState<Bank[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // 添加银行卡弹窗状态
  const [modalVisible, setModalVisible] = useState(false);
  const [cardNumber, setCardNumber] = useState('');
  const [cardHolder, setCardHolder] = useState('');
  const [selectedBank, setSelectedBank] = useState<Bank | null>(null);
  const [identifying, setIdentifying] = useState(false);
  const [adding, setAdding] = useState(false);

  // 银行选择弹窗
  const [bankPickerVisible, setBankPickerVisible] = useState(false);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  const loadData = async () => {
    try {
      setLoading(true);
      const [cardsData, banksData] = await Promise.all([
        api.getBankCards(),
        api.getBankList(),
      ]);
      setCards(cardsData.cards || []);
      setBanks(banksData);
    } catch (error) {
      console.error('Load bank cards error:', error);
      Alert.alert('错误', '获取银行卡列表失败');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  // 识别银行卡
  const identifyBankCard = async (number: string) => {
    if (number.length < 6) {
      setSelectedBank(null);
      return;
    }

    try {
      setIdentifying(true);
      const result = await api.identifyBank(number);
      if (result.success && result.bank) {
        // 从银行列表中找到对应的银行图标
        const bankInfo = banks.find(b => b.code === result.bank!.code);
        setSelectedBank(bankInfo || { ...result.bank, icon: 'building-columns' });
      } else {
        setSelectedBank(null);
      }
    } catch (error) {
      console.error('Identify bank error:', error);
    } finally {
      setIdentifying(false);
    }
  };

  // 格式化卡号输入
  const formatCardNumber = (text: string) => {
    const digits = text.replace(/\D/g, '');
    const formatted = digits.replace(/(\d{4})(?=\d)/g, '$1 ');
    return formatted.substring(0, 23); // 最多19位数字 + 3个空格
  };

  const handleCardNumberChange = (text: string) => {
    const formatted = formatCardNumber(text);
    setCardNumber(formatted);
    
    // 自动识别银行
    const digits = text.replace(/\s/g, '');
    if (digits.length >= 6) {
      identifyBankCard(digits);
    }
  };

  // 添加银行卡
  const handleAddCard = async () => {
    const digits = cardNumber.replace(/\s/g, '');
    
    if (digits.length < 16 || digits.length > 19) {
      Alert.alert('提示', '请输入正确的银行卡号');
      return;
    }
    if (!cardHolder.trim()) {
      Alert.alert('提示', '请输入持卡人姓名');
      return;
    }
    if (!selectedBank) {
      Alert.alert('提示', '请选择开户银行');
      return;
    }

    try {
      setAdding(true);
      const result = await api.addBankCard(digits, cardHolder, selectedBank.code, selectedBank.name);
      
      if (result.success) {
        Alert.alert('成功', '银行卡绑定成功');
        setModalVisible(false);
        setCardNumber('');
        setCardHolder('');
        setSelectedBank(null);
        loadData();
      }
    } catch (error: any) {
      Alert.alert('绑定失败', error.message || '请重试');
    } finally {
      setAdding(false);
    }
  };

  // 设置默认卡
  const handleSetDefault = async (cardId: string) => {
    try {
      await api.setDefaultBankCard(cardId);
      loadData();
    } catch (error: any) {
      Alert.alert('设置失败', error.message || '请重试');
    }
  };

  // 删除银行卡
  const handleDeleteCard = (card: BankCard) => {
    Alert.alert(
      '确认删除',
      `确定要删除 ${card.bankName} 尾号 ${card.cardNumberLast4} 的银行卡吗？`,
      [
        { text: '取消', style: 'cancel' },
        {
          text: '删除',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.deleteBankCard(card.id);
              Alert.alert('成功', '银行卡已删除');
              loadData();
            } catch (error: any) {
              Alert.alert('删除失败', error.message || '请重试');
            }
          },
        },
      ]
    );
  };

  // 获取银行图标颜色
  const getBankColor = (bankCode: string) => {
    const colors: Record<string, string> = {
      'ICBC': '#C41230',
      'ABC': '#009556',
      'BOC': '#E60012',
      'CCB': '#003B70',
      'COMM': '#004F9F',
      'PSBC': '#007C48',
      'CMB': '#DC0F26',
      'CITIC': '#E60012',
      'CEB': '#6E1D80',
      'HXB': '#E60012',
      'CMBC': '#006633',
      'GDB': '#E60012',
      'PAB': '#FF6600',
      'CIB': '#003B70',
      'SPDB': '#003B70',
    };
    return colors[bankCode] || theme.primary;
  };

  if (loading) {
    return (
      <Screen backgroundColor={theme.backgroundRoot}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      </Screen>
    );
  }

  return (
    <Screen backgroundColor={theme.backgroundRoot} statusBarStyle="dark">
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <FontAwesome6 name="arrow-left" size={24} color={theme.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>银行卡管理</Text>
          <View style={{ width: 24 }} />
        </View>

        {/* 提示信息 */}
        <View style={styles.tipCard}>
          <Ionicons name="information-circle" size={20} color={theme.primary} />
          <Text style={styles.tipText}>
            银行卡持卡人姓名需与实名认证姓名一致
          </Text>
        </View>

        {/* 银行卡列表 */}
        {cards.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="card-outline" size={64} color={theme.textMuted} />
            <Text style={styles.emptyText}>暂无绑定银行卡</Text>
            <Text style={styles.emptyHint}>绑定银行卡后可用于提现</Text>
          </View>
        ) : (
          cards.map((card) => (
            <View
              key={card.id}
              style={[styles.cardItem, { backgroundColor: getBankColor(card.bankCode) }]}
            >
              <View style={styles.cardHeader}>
                <Text style={styles.bankName}>{card.bankName}</Text>
                {card.isDefault && (
                  <View style={styles.defaultTag}>
                    <Text style={styles.defaultTagText}>默认</Text>
                  </View>
                )}
              </View>
              
              <Text style={styles.cardNumber}>{card.cardNumber}</Text>
              
              <View style={styles.cardFooter}>
                <Text style={styles.cardHolder}>持卡人：{card.cardHolder}</Text>
                <View style={styles.cardActions}>
                  {!card.isDefault && (
                    <TouchableOpacity
                      style={styles.cardActionButton}
                      onPress={() => handleSetDefault(card.id)}
                    >
                      <Text style={styles.cardActionText}>设为默认</Text>
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity
                    style={styles.cardActionButton}
                    onPress={() => handleDeleteCard(card)}
                  >
                    <Text style={[styles.cardActionText, { color: '#FF6B6B' }]}>删除</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          ))
        )}

        {/* 添加银行卡按钮 */}
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setModalVisible(true)}
        >
          <Ionicons name="add-circle-outline" size={24} color={theme.primary} />
          <Text style={styles.addButtonText}>添加银行卡</Text>
        </TouchableOpacity>

        {/* 说明 */}
        <View style={styles.noteSection}>
          <Text style={styles.noteTitle}>温馨提示</Text>
          <Text style={styles.noteText}>• 每个账户最多可绑定5张银行卡</Text>
          <Text style={styles.noteText}>• 提现时将优先使用默认银行卡</Text>
          <Text style={styles.noteText}>• 如需帮助，请联系客服 400-888-9999</Text>
        </View>
      </ScrollView>

      {/* 添加银行卡弹窗 */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss} disabled={Platform.OS === 'web'}>
          <KeyboardAvoidingView
            style={styles.modalOverlay}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          >
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>添加银行卡</Text>
                <TouchableOpacity onPress={() => setModalVisible(false)}>
                  <Ionicons name="close" size={24} color={theme.textPrimary} />
                </TouchableOpacity>
              </View>

              <View style={styles.modalBody}>
                {/* 卡号输入 */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>银行卡号 <Text style={styles.required}>*</Text></Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="请输入银行卡号"
                    placeholderTextColor={theme.textMuted}
                    value={cardNumber}
                    onChangeText={handleCardNumberChange}
                    keyboardType="numeric"
                    maxLength={23}
                  />
                  {identifying && (
                    <ActivityIndicator size="small" color={theme.primary} style={styles.inputIndicator} />
                  )}
                </View>

                {/* 银行选择 */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>开户银行 <Text style={styles.required}>*</Text></Text>
                  <TouchableOpacity
                    style={styles.pickerInput}
                    onPress={() => setBankPickerVisible(true)}
                  >
                    {selectedBank ? (
                      <Text style={styles.pickerText}>{selectedBank.name}</Text>
                    ) : (
                      <Text style={[styles.pickerText, { color: theme.textMuted }]}>
                        {identifying ? '正在识别...' : '点击选择银行'}
                      </Text>
                    )}
                    <Ionicons name="chevron-forward" size={18} color={theme.textMuted} />
                  </TouchableOpacity>
                </View>

                {/* 持卡人姓名 */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>持卡人姓名 <Text style={styles.required}>*</Text></Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="请输入持卡人姓名"
                    placeholderTextColor={theme.textMuted}
                    value={cardHolder}
                    onChangeText={setCardHolder}
                    maxLength={20}
                  />
                  <Text style={styles.inputHint}>
                    需与实名认证姓名一致
                  </Text>
                </View>

                {/* 提交按钮 */}
                <TouchableOpacity
                  style={[styles.submitButton, adding && styles.submitButtonDisabled]}
                  onPress={handleAddCard}
                  disabled={adding}
                >
                  {adding ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text style={styles.submitButtonText}>确认绑定</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </KeyboardAvoidingView>
        </TouchableWithoutFeedback>
      </Modal>

      {/* 银行选择弹窗 */}
      <Modal
        visible={bankPickerVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setBankPickerVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.bankPickerContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>选择银行</Text>
              <TouchableOpacity onPress={() => setBankPickerVisible(false)}>
                <Ionicons name="close" size={24} color={theme.textPrimary} />
              </TouchableOpacity>
            </View>
            <FlatList
              data={banks}
              keyExtractor={(item) => item.code}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.bankOption,
                    selectedBank?.code === item.code && styles.bankOptionSelected
                  ]}
                  onPress={() => {
                    setSelectedBank(item);
                    setBankPickerVisible(false);
                  }}
                >
                  <Text style={styles.bankIcon}>{item.icon}</Text>
                  <Text style={styles.bankNameOption}>{item.name}</Text>
                  {selectedBank?.code === item.code && (
                    <Ionicons name="checkmark" size={20} color={theme.primary} />
                  )}
                </TouchableOpacity>
              )}
              style={styles.bankList}
            />
          </View>
        </View>
      </Modal>
    </Screen>
  );
}

const createStyles = (theme: any) => StyleSheet.create({
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.textPrimary,
  },
  tipCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${theme.primary}10`,
    borderRadius: 12,
    padding: 14,
    marginBottom: 20,
  },
  tipText: {
    fontSize: 14,
    color: theme.primary,
    marginLeft: 10,
    flex: 1,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.textPrimary,
    marginTop: 16,
  },
  emptyHint: {
    fontSize: 14,
    color: theme.textMuted,
    marginTop: 8,
  },
  cardItem: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    minHeight: 140,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  bankName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  defaultTag: {
    backgroundColor: 'rgba(255,255,255,0.3)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  defaultTagText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  cardNumber: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 2,
    marginBottom: 20,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardHolder: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
  },
  cardActions: {
    flexDirection: 'row',
  },
  cardActionButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  cardActionText: {
    fontSize: 13,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.backgroundDefault,
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: theme.borderLight,
    borderStyle: 'dashed',
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.primary,
    marginLeft: 10,
  },
  noteSection: {
    marginTop: 24,
    padding: 16,
    backgroundColor: theme.backgroundTertiary,
    borderRadius: 12,
  },
  noteTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.textPrimary,
    marginBottom: 10,
  },
  noteText: {
    fontSize: 13,
    color: theme.textSecondary,
    lineHeight: 22,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: theme.backgroundDefault,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: theme.borderLight,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.textPrimary,
  },
  modalBody: {
    padding: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.textPrimary,
    marginBottom: 8,
  },
  required: {
    color: '#E74C3C',
  },
  textInput: {
    backgroundColor: theme.backgroundTertiary,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: theme.textPrimary,
    borderWidth: 1,
    borderColor: theme.borderLight,
  },
  inputIndicator: {
    position: 'absolute',
    right: 16,
    top: 45,
  },
  inputHint: {
    fontSize: 12,
    color: theme.textMuted,
    marginTop: 6,
  },
  pickerInput: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.backgroundTertiary,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: theme.borderLight,
  },
  pickerText: {
    fontSize: 16,
    color: theme.textPrimary,
  },
  submitButton: {
    backgroundColor: theme.primary,
    borderRadius: 16,
    padding: 18,
    alignItems: 'center',
    marginTop: 20,
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  bankPickerContent: {
    backgroundColor: theme.backgroundDefault,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '70%',
  },
  bankList: {
    padding: 16,
  },
  bankOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  bankOptionSelected: {
    backgroundColor: `${theme.primary}10`,
  },
  bankIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  bankNameOption: {
    flex: 1,
    fontSize: 16,
    color: theme.textPrimary,
  },
});
