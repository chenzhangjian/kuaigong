import React, { useState, useCallback, useEffect, useMemo } from 'react';
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
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '@/components/Screen';
import { Colors, Spacing, BorderRadius, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import { useSafeRouter } from '@/hooks/useSafeRouter';
import api from '@/utils/api';
import { useAuth } from '@/contexts/AuthContext';
import { formatBeijingTime } from '@/utils';

// 交易类型映射
const TRANSACTION_TYPE_MAP: Record<string, { label: string; icon: string; color: string }> = {
  recharge: { label: '充值', icon: 'arrow-down', color: '#00B894' },
  withdraw: { label: '提现', icon: 'arrow-up', color: '#FF6B6B' },
  payment: { label: '支付', icon: 'remove', color: '#FF6B6B' },
  income: { label: '收入', icon: 'add', color: '#00B894' },
  refund: { label: '退款', icon: 'refresh', color: '#FDCB6E' },
};

interface Transaction {
  id: number;
  transactionNo: string;
  type: string;
  amount: number;
  balanceAfter: number;
  status: string;
  paymentMethod: string | null;
  description: string | null;
  createdAt: string;
}

interface WalletData {
  balance: number;
  frozenAmount: number;
  transactions: Transaction[];
}

interface BankCard {
  id: string;
  bankName: string;
  bankCode: string;
  cardNumberLast4: string;
  cardHolder: string;
  isDefault: boolean;
}

// 充值金额快捷选项
const QUICK_AMOUNTS = [50, 100, 200, 500];

// 提现金额快捷选项
const WITHDRAW_AMOUNTS = [100, 500, 1000, 2000];

export default function WalletScreen() {
  const { user } = useAuth();
  const router = useSafeRouter();
  const { theme } = useTheme();
  const [walletData, setWalletData] = useState<WalletData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalType, setModalType] = useState<'recharge' | 'withdraw'>('recharge');
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [customAmount, setCustomAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'wechat' | 'alipay'>('wechat');
  const [isPaying, setIsPaying] = useState(false);
  const [paySuccess, setPaySuccess] = useState(false);
  
  // 提现相关状态
  const [bankCards, setBankCards] = useState<BankCard[]>([]);
  const [selectedCard, setSelectedCard] = useState<BankCard | null>(null);
  const [withdrawFee, setWithdrawFee] = useState(0);

  // 加载钱包数据
  const loadWalletData = async () => {
    try {
      setIsLoading(true);
      const [data, cardsData] = await Promise.all([
        api.getWallet(),
        api.getBankCards(),
      ]);
      setWalletData(data);
      setBankCards(cardsData.cards || []);
      // 默认选择第一张银行卡
      if (cardsData.cards && cardsData.cards.length > 0) {
        const defaultCard = cardsData.cards.find((c: BankCard) => c.isDefault) || cardsData.cards[0];
        setSelectedCard(defaultCard);
      }
    } catch (error) {
      console.error('Load wallet error:', error);
      Alert.alert('错误', '获取钱包信息失败');
    } finally {
      setIsLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadWalletData();
    }, [])
  );

  // 打开充值弹窗
  const handleOpenRecharge = () => {
    setModalType('recharge');
    setSelectedAmount(null);
    setCustomAmount('');
    setPaymentMethod('wechat');
    setPaySuccess(false);
    setModalVisible(true);
  };

  // 打开提现弹窗
  const handleOpenWithdraw = () => {
    if (!user?.isVerified) {
      Alert.alert('提示', '请先完成实名认证后再提现', [
        { text: '取消', style: 'cancel' },
        { text: '去认证', onPress: () => router.push('/verification') },
      ]);
      return;
    }
    if (bankCards.length === 0) {
      Alert.alert('提示', '请先绑定银行卡后再提现', [
        { text: '取消', style: 'cancel' },
        { text: '去绑定', onPress: () => router.push('/bank-cards') },
      ]);
      return;
    }
    setModalType('withdraw');
    setSelectedAmount(null);
    setCustomAmount('');
    setPaySuccess(false);
    setModalVisible(true);
  };

  // 获取充值金额
  const getRechargeAmount = () => {
    if (selectedAmount) return selectedAmount;
    const custom = parseFloat(customAmount);
    return isNaN(custom) ? 0 : custom;
  };

  // 计算提现手续费
  const calculateWithdrawFee = (amount: number) => {
    // 固定0.1%，最低1元，最高50元
    let fee = amount * 0.001;
    if (fee < 1) fee = 1;
    if (fee > 50) fee = 50;
    return Math.round(fee * 100) / 100;
  };

  // 获取提现金额
  const getWithdrawAmount = () => {
    if (selectedAmount) return selectedAmount;
    const custom = parseFloat(customAmount);
    return isNaN(custom) ? 0 : custom;
  };

  // 提现申请
  const handleWithdraw = async () => {
    const amount = getWithdrawAmount();
    
    if (amount < 10 || amount > 50000) {
      Alert.alert('提示', '提现金额需在10-50000元之间');
      return;
    }
    
    if (!selectedCard) {
      Alert.alert('提示', '请选择银行卡');
      return;
    }

    const balance = walletData?.balance || 0;
    if (amount > balance) {
      Alert.alert('提示', '余额不足');
      return;
    }

    try {
      setIsPaying(true);
      
      const result = await api.applyWithdraw(amount, parseInt(selectedCard.id));
      
      if (result.success) {
        setPaySuccess(true);
        // 刷新钱包数据
        await loadWalletData();
        
        // 1.5秒后关闭弹窗
        setTimeout(() => {
          setModalVisible(false);
        }, 1500);
      }
    } catch (error: any) {
      console.error('Withdraw error:', error);
      Alert.alert('提现失败', error.message || '请稍后重试');
    } finally {
      setIsPaying(false);
    }
  };

  // 创建充值订单并支付
  const handleRecharge = async () => {
    const amount = getRechargeAmount();
    
    if (amount < 1 || amount > 50000) {
      Alert.alert('提示', '充值金额需在1-50000元之间');
      return;
    }

    try {
      setIsPaying(true);
      
      // 创建充值订单
      const orderData = await api.createRechargeOrder(amount, paymentMethod);
      
      // 模拟支付（真实环境应调用支付SDK）
      if (orderData.mockPayment) {
        // 模拟支付确认
        const result = await api.mockPay(orderData.orderNo);
        
        if (result.success) {
          setPaySuccess(true);
          // 刷新钱包数据
          await loadWalletData();
          
          // 1.5秒后关闭弹窗
          setTimeout(() => {
            setModalVisible(false);
          }, 1500);
        }
      }
      // 真实支付对接示例：
      // else {
      //   // 微信支付
      //   if (paymentMethod === 'wechat') {
      //     const payResult = await Wechat.pay({
      //       prepayId: orderData.prepaidId,
      //       ...orderData.paymentParams
      //     });
      //     if (payResult.errCode === 0) {
      //       Alert.alert('成功', '支付成功');
      //       await loadWalletData();
      //     }
      //   }
      //   // 支付宝支付
      //   else if (paymentMethod === 'alipay') {
      //     const payResult = await Alipay.pay(orderData.payUrl);
      //     if (payResult.resultStatus === '9000') {
      //       Alert.alert('成功', '支付成功');
      //       await loadWalletData();
      //     }
      //   }
      // }
    } catch (error: any) {
      console.error('Recharge error:', error);
      Alert.alert('支付失败', error.message || '请稍后重试');
    } finally {
      setIsPaying(false);
    }
  };

  // 格式化金额
  const formatAmount = (amount: number) => {
    return amount.toFixed(2);
  };

  // 格式化日期（北京时间）
  const formatDate = (dateStr: string) => {
    return formatBeijingTime(dateStr, 'MM-DD HH:mm');
  };

  if (isLoading) {
    return (
      <Screen>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.light.primary} />
        </View>
      </Screen>
    );
  }

  const balance = walletData?.balance || 0;
  const frozenAmount = walletData?.frozenAmount || 0;
  const transactions = walletData?.transactions || [];

  return (
    <Screen>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* 钱包卡片 */}
        <LinearGradient
          colors={[Colors.light.primary, Colors.light.primaryGradient]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.walletCard}
        >
          <Text style={styles.cardLabel}>账户余额（元）</Text>
          <Text style={styles.balanceAmount}>¥{formatAmount(balance)}</Text>
          
          {frozenAmount > 0 && (
            <View style={styles.frozenRow}>
              <Text style={styles.frozenLabel}>冻结金额</Text>
              <Text style={styles.frozenAmount}>¥{formatAmount(frozenAmount)}</Text>
            </View>
          )}
          
          <View style={styles.cardActions}>
            <TouchableOpacity style={styles.cardButton} onPress={handleOpenRecharge}>
              <Ionicons name="add-circle-outline" size={20} color="#FFFFFF" />
              <Text style={styles.cardButtonText}>充值</Text>
            </TouchableOpacity>
            <View style={styles.cardDivider} />
            <TouchableOpacity style={styles.cardButton} onPress={handleOpenWithdraw}>
              <Ionicons name="arrow-up-circle-outline" size={20} color="#FFFFFF" />
              <Text style={styles.cardButtonText}>提现</Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>

        {/* 功能入口 */}
        <View style={styles.quickActions}>
          <TouchableOpacity style={styles.quickActionItem}>
            <View style={[styles.quickActionIcon, { backgroundColor: 'rgba(108, 99, 255, 0.1)' }]}>
              <Ionicons name="receipt-outline" size={24} color={Colors.light.primary} />
            </View>
            <Text style={styles.quickActionText}>交易记录</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.quickActionItem}
            onPress={() => router.push('/bank-cards')}
          >
            <View style={[styles.quickActionIcon, { backgroundColor: 'rgba(255, 101, 132, 0.1)' }]}>
              <Ionicons name="card-outline" size={24} color={Colors.light.accent} />
            </View>
            <Text style={styles.quickActionText}>银行卡</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.quickActionItem}
            onPress={() => router.push('/verification')}
          >
            <View style={[styles.quickActionIcon, { backgroundColor: 'rgba(0, 184, 148, 0.1)' }]}>
              <Ionicons name="shield-checkmark-outline" size={24} color={Colors.light.success} />
            </View>
            <Text style={styles.quickActionText}>实名认证</Text>
          </TouchableOpacity>
        </View>

        {/* 交易记录 */}
        <View style={styles.transactionsSection}>
          <Text style={styles.sectionTitle}>最近交易</Text>
          
          {transactions.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="receipt-outline" size={48} color={Colors.light.textMuted} />
              <Text style={styles.emptyText}>暂无交易记录</Text>
            </View>
          ) : (
            transactions.map((item) => {
              const typeInfo = TRANSACTION_TYPE_MAP[item.type] || TRANSACTION_TYPE_MAP.recharge;
              return (
                <View key={item.id} style={styles.transactionItem}>
                  <View style={[styles.transactionIcon, { backgroundColor: `${typeInfo.color}15` }]}>
                    <Ionicons name={typeInfo.icon as any} size={20} color={typeInfo.color} />
                  </View>
                  <View style={styles.transactionInfo}>
                    <Text style={styles.transactionType}>{typeInfo.label}</Text>
                    <Text style={styles.transactionDate}>{formatDate(item.createdAt)}</Text>
                  </View>
                  <Text style={[
                    styles.transactionAmount,
                    { color: typeInfo.color }
                  ]}>
                    {item.type === 'payment' || item.type === 'withdraw' ? '-' : '+'}¥{formatAmount(item.amount)}
                  </Text>
                </View>
              );
            })
          )}
        </View>
      </ScrollView>

      {/* 充值/提现弹窗 */}
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
              {paySuccess ? (
                // 成功页面
                <View style={styles.successContainer}>
                  <View style={styles.successIcon}>
                    <Ionicons name="checkmark-circle" size={64} color={Colors.light.success} />
                  </View>
                  <Text style={styles.successTitle}>{modalType === 'recharge' ? '充值成功' : '提现申请已提交'}</Text>
                  <Text style={styles.successAmount}>
                    ¥{formatAmount(modalType === 'recharge' ? getRechargeAmount() : getWithdrawAmount())}
                  </Text>
                  {modalType === 'withdraw' && (
                    <Text style={styles.successHint}>预计1-3个工作日到账</Text>
                  )}
                </View>
              ) : (
                <>
                  {/* 弹窗头部 */}
                  <View style={styles.modalHeader}>
                    <Text style={styles.modalTitle}>{modalType === 'recharge' ? '充值' : '提现'}</Text>
                    <TouchableOpacity onPress={() => setModalVisible(false)}>
                      <Ionicons name="close" size={24} color={Colors.light.textSecondary} />
                    </TouchableOpacity>
                  </View>

                  {/* 快捷金额 */}
                  <View style={styles.modalBody}>
                    <Text style={styles.inputLabel}>选择金额</Text>
                    <View style={styles.amountGrid}>
                      {(modalType === 'recharge' ? QUICK_AMOUNTS : WITHDRAW_AMOUNTS).map((amount) => (
                        <TouchableOpacity
                          key={amount}
                          style={[
                            styles.amountOption,
                            selectedAmount === amount && styles.amountOptionSelected
                          ]}
                          onPress={() => {
                            setSelectedAmount(amount);
                            setCustomAmount('');
                          }}
                        >
                          <Text style={[
                            styles.amountText,
                            selectedAmount === amount && styles.amountTextSelected
                          ]}>
                            ¥{amount}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>

                    {/* 自定义金额 */}
                    <Text style={styles.inputLabel}>或输入金额</Text>
                    <View style={styles.inputWrapper}>
                      <Text style={styles.currencySymbol}>¥</Text>
                      <TextInput
                        style={styles.amountInput}
                        value={customAmount}
                        onChangeText={(text) => {
                          setCustomAmount(text);
                          setSelectedAmount(null);
                        }}
                        placeholder={modalType === 'recharge' ? '1-50000' : '10-50000'}
                        keyboardType="decimal-pad"
                        placeholderTextColor={Colors.light.textMuted}
                      />
                    </View>

                    {/* 提现时显示银行卡选择和手续费 */}
                    {modalType === 'withdraw' && (
                      <>
                        <Text style={styles.inputLabel}>提现银行卡</Text>
                        {selectedCard ? (
                          <TouchableOpacity style={styles.selectedCard} onPress={() => router.push('/bank-cards')}>
                            <View style={styles.cardInfo}>
                              <Text style={styles.cardBankName}>{selectedCard.bankName}</Text>
                              <Text style={styles.cardNumber}>尾号 {selectedCard.cardNumberLast4}</Text>
                            </View>
                            <Ionicons name="chevron-forward" size={20} color={Colors.light.textMuted} />
                          </TouchableOpacity>
                        ) : (
                          <TouchableOpacity style={styles.addCardButton} onPress={() => router.push('/bank-cards')}>
                            <Ionicons name="add-circle-outline" size={20} color={Colors.light.primary} />
                            <Text style={styles.addCardText}>添加银行卡</Text>
                          </TouchableOpacity>
                        )}

                        {/* 手续费提示 */}
                        {getWithdrawAmount() > 0 && (
                          <View style={styles.feeInfo}>
                            <Text style={styles.feeText}>
                              手续费: ¥{formatAmount(calculateWithdrawFee(getWithdrawAmount()))}
                            </Text>
                            <Text style={styles.actualText}>
                              实际到账: ¥{formatAmount(getWithdrawAmount() - calculateWithdrawFee(getWithdrawAmount()))}
                            </Text>
                          </View>
                        )}
                      </>
                    )}

                    {/* 充值时显示支付方式 */}
                    {modalType === 'recharge' && (
                      <>
                        <Text style={styles.inputLabel}>支付方式</Text>
                        <View style={styles.paymentMethods}>
                          <TouchableOpacity
                            style={[
                              styles.paymentMethod,
                              paymentMethod === 'wechat' && styles.paymentMethodSelected
                            ]}
                            onPress={() => setPaymentMethod('wechat')}
                          >
                            <Ionicons name="logo-wechat" size={24} color="#07C160" />
                            <Text style={styles.paymentMethodText}>微信支付</Text>
                            {paymentMethod === 'wechat' && (
                              <Ionicons name="checkmark-circle" size={20} color={Colors.light.primary} style={styles.paymentCheck} />
                            )}
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={[
                              styles.paymentMethod,
                              paymentMethod === 'alipay' && styles.paymentMethodSelected
                            ]}
                            onPress={() => setPaymentMethod('alipay')}
                          >
                            <Ionicons name="logo-alipay" size={24} color="#1677FF" />
                            <Text style={styles.paymentMethodText}>支付宝</Text>
                            {paymentMethod === 'alipay' && (
                              <Ionicons name="checkmark-circle" size={20} color={Colors.light.primary} style={styles.paymentCheck} />
                            )}
                          </TouchableOpacity>
                        </View>
                      </>
                    )}
                  </View>

                  {/* 确认按钮 */}
                  <View style={styles.modalFooter}>
                    <TouchableOpacity
                      style={[
                        styles.confirmButton,
                        ((modalType === 'recharge' && getRechargeAmount() < 1) || 
                         (modalType === 'withdraw' && getWithdrawAmount() < 10) ||
                         isPaying) && styles.confirmButtonDisabled
                      ]}
                      onPress={modalType === 'recharge' ? handleRecharge : handleWithdraw}
                      disabled={isPaying}
                    >
                      {isPaying ? (
                        <ActivityIndicator size="small" color="#FFFFFF" />
                      ) : (
                        <Text style={styles.confirmButtonText}>
                          {modalType === 'recharge' 
                            ? `确认充值 ¥${formatAmount(getRechargeAmount() || 0)}`
                            : `确认提现 ¥${formatAmount(getWithdrawAmount() || 0)}`
                          }
                        </Text>
                      )}
                    </TouchableOpacity>
                    <Text style={styles.disclaimer}>
                      {modalType === 'recharge' 
                        ? '充值金额将存入快工账户，可用于支付任务'
                        : '提现将在1-3个工作日内到账，手续费0.1%'
                      }
                    </Text>
                  </View>
                </>
              )}
            </View>
          </KeyboardAvoidingView>
        </TouchableWithoutFeedback>
      </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.backgroundRoot,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  walletCard: {
    margin: Spacing.lg,
    padding: Spacing['2xl'],
    borderRadius: BorderRadius['2xl'],
    shadowColor: Colors.light.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
  },
  cardLabel: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
    marginBottom: Spacing.xs,
  },
  balanceAmount: {
    color: '#FFFFFF',
    fontSize: 40,
    fontWeight: '700',
    marginBottom: Spacing.md,
  },
  frozenRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  frozenLabel: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 13,
    marginRight: Spacing.sm,
  },
  frozenAmount: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 13,
    fontWeight: '600',
  },
  cardActions: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.2)',
    paddingTop: Spacing.lg,
  },
  cardButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.sm,
  },
  cardButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
    marginLeft: Spacing.xs,
  },
  cardDivider: {
    width: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    marginHorizontal: Spacing.lg,
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  quickActionItem: {
    alignItems: 'center',
    padding: Spacing.md,
  },
  quickActionIcon: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xs,
  },
  quickActionText: {
    color: Colors.light.textSecondary,
    fontSize: 12,
  },
  transactionsSection: {
    backgroundColor: Colors.light.backgroundDefault,
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing['2xl'],
    borderRadius: BorderRadius['2xl'],
    padding: Spacing.lg,
    // 新拟态凹效果
    shadowColor: Colors.light.shadowDark,
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 4,
  },
  sectionTitle: {
    ...Typography.h3,
    color: Colors.light.textPrimary,
    fontSize: 18,
    marginBottom: Spacing.lg,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: Spacing['4xl'],
  },
  emptyText: {
    color: Colors.light.textMuted,
    marginTop: Spacing.md,
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  transactionIcon: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  transactionInfo: {
    flex: 1,
  },
  transactionType: {
    color: Colors.light.textPrimary,
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 2,
  },
  transactionDate: {
    color: Colors.light.textMuted,
    fontSize: 12,
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: '700',
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.light.backgroundDefault,
    borderTopLeftRadius: BorderRadius['3xl'],
    borderTopRightRadius: BorderRadius['3xl'],
    paddingHorizontal: Spacing['2xl'],
    paddingBottom: Spacing['3xl'],
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.xl,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  modalTitle: {
    ...Typography.h2,
    color: Colors.light.textPrimary,
    fontSize: 20,
  },
  modalBody: {
    paddingVertical: Spacing.xl,
  },
  inputLabel: {
    color: Colors.light.textSecondary,
    fontSize: 14,
    marginBottom: Spacing.md,
    marginTop: Spacing.lg,
  },
  amountGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  amountOption: {
    width: '47%',
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.light.backgroundTertiary,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  amountOptionSelected: {
    borderColor: Colors.light.primary,
    backgroundColor: `${Colors.light.primary}15`,
  },
  amountText: {
    color: Colors.light.textPrimary,
    fontSize: 18,
    fontWeight: '600',
  },
  amountTextSelected: {
    color: Colors.light.primary,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.backgroundTertiary,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  currencySymbol: {
    color: Colors.light.textPrimary,
    fontSize: 24,
    fontWeight: '600',
    marginRight: Spacing.sm,
  },
  amountInput: {
    flex: 1,
    color: Colors.light.textPrimary,
    fontSize: 24,
    fontWeight: '600',
    padding: 0,
  },
  paymentMethods: {
    gap: Spacing.md,
  },
  paymentMethod: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.light.backgroundTertiary,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  paymentMethodSelected: {
    borderColor: Colors.light.primary,
    backgroundColor: `${Colors.light.primary}10`,
  },
  paymentMethodText: {
    color: Colors.light.textPrimary,
    fontSize: 15,
    fontWeight: '500',
    marginLeft: Spacing.md,
    flex: 1,
  },
  paymentCheck: {
    marginLeft: 'auto',
  },
  modalFooter: {
    paddingTop: Spacing.lg,
  },
  confirmButton: {
    backgroundColor: Colors.light.primary,
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.xl,
    alignItems: 'center',
  },
  confirmButtonDisabled: {
    opacity: 0.5,
  },
  confirmButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  disclaimer: {
    color: Colors.light.textMuted,
    fontSize: 12,
    textAlign: 'center',
    marginTop: Spacing.md,
  },
  // Success styles
  successContainer: {
    alignItems: 'center',
    paddingVertical: Spacing['4xl'],
  },
  successIcon: {
    marginBottom: Spacing.lg,
  },
  successTitle: {
    ...Typography.h2,
    color: Colors.light.textPrimary,
    marginBottom: Spacing.md,
  },
  successAmount: {
    color: Colors.light.success,
    fontSize: 36,
    fontWeight: '700',
  },
  successHint: {
    color: Colors.light.textSecondary,
    fontSize: 14,
    marginTop: Spacing.sm,
  },
  // Withdraw specific styles
  selectedCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.light.backgroundTertiary,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.light.borderLight,
  },
  cardInfo: {
    flex: 1,
  },
  cardBankName: {
    color: Colors.light.textPrimary,
    fontSize: 16,
    fontWeight: '600',
  },
  cardNumber: {
    color: Colors.light.textSecondary,
    fontSize: 13,
    marginTop: 2,
  },
  addCardButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.light.backgroundTertiary,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.light.borderLight,
    borderStyle: 'dashed',
  },
  addCardText: {
    color: Colors.light.primary,
    fontSize: 15,
    fontWeight: '500',
    marginLeft: Spacing.sm,
  },
  feeInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: `${Colors.light.primary}10`,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginTop: Spacing.md,
  },
  feeText: {
    color: Colors.light.textSecondary,
    fontSize: 13,
  },
  actualText: {
    color: Colors.light.primary,
    fontSize: 13,
    fontWeight: '600',
  },
});
