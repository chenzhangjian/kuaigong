import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
  Modal,
} from 'react-native';
import { FontAwesome6 } from '@expo/vector-icons';
import { Screen } from '@/components/Screen';
import { useTheme } from '@/hooks/useTheme';
import { useAuth } from '@/contexts/AuthContext';
import { useSafeRouter, useSafeSearchParams } from '@/hooks/useSafeRouter';
import { createStyles } from './styles';
import api from '@/utils/api';
import { formatBeijingTimeOnly } from '@/utils';
import { WorkerLocationCard } from '@/components/WorkerLocationCard';
import { useWorkerLocationReport } from '@/hooks/useWorkerLocationReport';
import { ReviewModal } from '@/components/ReviewModal';

export default function OrderDetailScreen() {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const router = useSafeRouter();
  const { id } = useSafeSearchParams<{ id: string }>();
  const { userType } = useAuth();

  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelling, setCancelling] = useState(false);

  // 工人位置上报（仅工人端且订单进行中时启用）
  const locationReport = useWorkerLocationReport({
    orderId: id,
    enabled: userType === 'worker' && order?.status === 'in_progress',
  });

  useEffect(() => {
    loadOrder();
  }, [id]);

  const loadOrder = async () => {
    try {
      const data = await api.getOrderDetail(id);
      setOrder(data);
    } catch (error) {
      console.error('Load order error:', error);
      Alert.alert('错误', '加载订单详情失败');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (action: string) => {
    try {
      if (action === 'start') {
        await api.startWork(id);
        Alert.alert('成功', '已开始工作');
      } else if (action === 'complete') {
        await api.completeWork(id);
        Alert.alert('成功', '已提交完成申请，等待雇主确认');
      } else if (action === 'confirm') {
        await api.confirmOrder(id);
        Alert.alert('成功', '订单已完成');
      }
      loadOrder();
    } catch (error: any) {
      Alert.alert('操作失败', error.message || '请重试');
    }
  };

  const handleCancel = async () => {
    if (!cancelReason.trim()) {
      Alert.alert('提示', '请填写取消原因');
      return;
    }

    setCancelling(true);
    try {
      await api.cancelOrder(id, cancelReason.trim());
      Alert.alert('成功', '订单已取消');
      setShowCancelModal(false);
      loadOrder();
    } catch (error: any) {
      Alert.alert('取消失败', error.message || '请重试');
    } finally {
      setCancelling(false);
    }
  };

  const handleReviewSuccess = () => {
    setShowReviewModal(false);
    loadOrder();
  };

  if (loading || !order) {
    return (
      <Screen backgroundColor={theme.backgroundRoot} statusBarStyle="dark">
        <View style={styles.container}>
          <Text>加载中...</Text>
        </View>
      </Screen>
    );
  }

  const getStatusText = (status: string) => {
    const statusTexts: Record<string, string> = {
      'pending': '待接单',
      'accepted': '已接单',
      'in_progress': '进行中',
      'completed': '已完成',
      'cancelled': '已取消',
    };
    return statusTexts[status] || status;
  };

  return (
    <Screen backgroundColor={theme.backgroundRoot} statusBarStyle="dark">
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <FontAwesome6 name="arrow-left" size={24} color={theme.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>订单详情</Text>
          <View style={{ width: 24 }} />
        </View>

        {/* Status */}
        <View style={styles.statusCard}>
          <Text style={styles.statusText}>{getStatusText(order.status)}</Text>
        </View>

        {/* Task Info */}
        <View style={styles.taskInfo}>
          <Text style={styles.title}>{order.task?.title}</Text>
          <Text style={styles.budget}>¥{order.agreedAmount}</Text>
        </View>

        <View style={styles.detailItem}>
          <FontAwesome6 name="location-dot" size={16} color={theme.primary} />
          <Text style={styles.detailText}>{order.task?.address}</Text>
        </View>

        {/* Worker Location Card - 雇主查看工人位置 */}
        <WorkerLocationCard
          orderId={id}
          orderStatus={order.status}
          taskLocation={order.task?.latitude ? {
            latitude: order.task.latitude,
            longitude: order.task.longitude,
            address: order.task.address,
          } : undefined}
          worker={order.worker}
          isEmployer={userType === 'employer'}
        />

        {/* Counterparty Info */}
        <View style={styles.counterpartyCard}>
          <Text style={styles.counterpartyLabel}>
            {userType === 'employer' ? '工人信息' : '雇主信息'}
          </Text>
          <View style={styles.counterpartyInfo}>
            <View style={styles.counterpartyAvatar}>
              <FontAwesome6 name="user" size={20} color={theme.primary} />
            </View>
            <View style={styles.counterpartyDetails}>
              <Text style={styles.counterpartyName}>
                {userType === 'employer' ? order.worker?.name : order.employer?.name || '未指定'}
              </Text>
              {userType === 'employer' && order.worker?.phone && (
                <Text style={styles.counterpartyPhone}>电话: {order.worker.phone}</Text>
              )}
            </View>
          </View>
        </View>

        {/* Cancel Button - For pending/accepted status */}
        {(order.status === 'pending' || order.status === 'accepted') && (
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => setShowCancelModal(true)}
          >
            <FontAwesome6 name="xmark" size={16} color={theme.error} />
            <Text style={styles.cancelButtonText}>取消订单</Text>
          </TouchableOpacity>
        )}

        {/* Actions */}
        {userType === 'worker' && order.status === 'accepted' && (
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleAction('start')}
          >
            <FontAwesome6 name="play" size={18} color="#FFFFFF" />
            <Text style={styles.actionButtonText}>开始工作</Text>
          </TouchableOpacity>
        )}

        {userType === 'worker' && order.status === 'in_progress' && (
          <>
            {/* 位置上报状态提示 */}
            {locationReport.isReporting && (
              <View style={styles.locationStatusCard}>
                <FontAwesome6 name="satellite-dish" size={16} color={theme.success} />
                <Text style={styles.locationStatusText}>
                  位置上报中 {locationReport.lastReportTime ? 
                    `(上次: ${formatBeijingTimeOnly(locationReport.lastReportTime.toISOString())})` : ''}
                </Text>
              </View>
            )}
            {locationReport.error && (
              <View style={styles.locationStatusCard}>
                <FontAwesome6 name="triangle-exclamation" size={16} color={theme.warning} />
                <Text style={styles.locationStatusText}>{locationReport.error}</Text>
              </View>
            )}
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => handleAction('complete')}
            >
              <FontAwesome6 name="check" size={18} color="#FFFFFF" />
              <Text style={styles.actionButtonText}>提交完成</Text>
            </TouchableOpacity>
          </>
        )}

        {userType === 'employer' && order.status === 'in_progress' && (
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleAction('confirm')}
          >
            <FontAwesome6 name="check-double" size={18} color="#FFFFFF" />
            <Text style={styles.actionButtonText}>确认完成</Text>
          </TouchableOpacity>
        )}

        {/* Review Button - For completed orders */}
        {order.status === 'completed' && (
          <TouchableOpacity
            style={styles.reviewButton}
            onPress={() => setShowReviewModal(true)}
          >
            <FontAwesome6 name="star" size={18} color="#FFFFFF" />
            <Text style={styles.actionButtonText}>评价</Text>
          </TouchableOpacity>
        )}
      </ScrollView>

      {/* Cancel Modal */}
      <Modal visible={showCancelModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>取消订单</Text>
            <Text style={styles.modalHint}>请填写取消原因</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="请输入取消原因..."
              placeholderTextColor={theme.textMuted}
              value={cancelReason}
              onChangeText={setCancelReason}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => {
                  setShowCancelModal(false);
                  setCancelReason('');
                }}
              >
                <Text style={styles.modalCancelText}>返回</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalConfirmButton, cancelling && { opacity: 0.7 }]}
                onPress={handleCancel}
                disabled={cancelling}
              >
                <Text style={styles.modalConfirmText}>
                  {cancelling ? '处理中...' : '确认取消'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Review Modal */}
      <ReviewModal
        visible={showReviewModal}
        orderId={id}
        revieweeName={userType === 'employer' ? order.worker?.name : order.employer?.name}
        onClose={() => setShowReviewModal(false)}
        onSuccess={handleReviewSuccess}
      />
    </Screen>
  );
}
