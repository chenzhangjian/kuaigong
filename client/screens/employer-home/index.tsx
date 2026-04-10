import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Image,
  ActivityIndicator,
} from 'react-native';
import { FontAwesome6 } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { Screen } from '@/components/Screen';
import { useTheme } from '@/hooks/useTheme';
import { useAuth } from '@/contexts/AuthContext';
import { useSafeRouter } from '@/hooks/useSafeRouter';
import { PublishTaskModal } from '@/components/PublishTaskModal';
import { createStyles } from './styles';
import api from '@/utils/api';

interface Order {
  id: string;
  status: string;
  agreedAmount: number;
  createdAt: string;
  task: {
    id: string;
    title: string;
    address: string;
    images: string[];
  };
  worker?: {
    id: string;
    name: string;
    avatar: string;
  };
}

interface Stats {
  totalTasks: number;
  pendingTasks: number;
  inProgressTasks: number;
  completedTasks: number;
  totalSpent: number;
}

export default function EmployerHomeScreen() {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const { user } = useAuth();
  const router = useSafeRouter();

  const [orders, setOrders] = useState<Order[]>([]);
  const [stats, setStats] = useState<Stats>({
    totalTasks: 0,
    pendingTasks: 0,
    inProgressTasks: 0,
    completedTasks: 0,
    totalSpent: 0,
  });
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showPublishModal, setShowPublishModal] = useState(false);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  const loadData = async () => {
    try {
      const [ordersData] = await Promise.all([
        api.getOrders({ role: 'employer', limit: 5 }),
      ]);
      
      setOrders(ordersData.orders || []);
      
      // 计算统计数据
      const allOrders = ordersData.orders || [];
      const totalSpent = allOrders
        .filter((o: Order) => o.status === 'completed')
        .reduce((sum: number, o: Order) => sum + (o.agreedAmount || 0), 0);
      
      setStats({
        totalTasks: allOrders.length,
        pendingTasks: allOrders.filter((o: Order) => o.status === 'pending').length,
        inProgressTasks: allOrders.filter((o: Order) => o.status === 'in_progress' || o.status === 'accepted').length,
        completedTasks: allOrders.filter((o: Order) => o.status === 'completed').length,
        totalSpent,
      });
    } catch (error) {
      console.error('Load data error:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const getStatusColor = (status: string) => {
    const statusColors: Record<string, string> = {
      'pending': '#FDCB6E',
      'accepted': '#00B894',
      'in_progress': '#6C63FF',
      'completed': '#00B894',
      'cancelled': '#FF6B6B',
    };
    return statusColors[status] || theme.textMuted;
  };

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

  // 快捷入口配置
  const quickActions = [
    {
      icon: 'clock-rotate-left',
      label: '历史任务',
      color: theme.accent,
      bgColor: `${theme.accent}15`,
      onPress: () => router.push('/(tabs)/orders'),
    },
    {
      icon: 'users',
      label: '我的工人',
      color: theme.success,
      bgColor: `${theme.success}15`,
      onPress: () => router.push('/my-workers'),
    },
    {
      icon: 'wallet',
      label: '钱包管理',
      color: theme.warning,
      bgColor: `${theme.warning}15`,
      onPress: () => router.push('/wallet'),
    },
    {
      icon: 'credit-card',
      label: '银行卡',
      color: '#00CEC9',
      bgColor: '#00CEC915',
      onPress: () => router.push('/bank-cards'),
    },
  ];

  // 统计卡片
  const statCards = [
    {
      icon: 'clipboard-list',
      label: '全部任务',
      value: stats.totalTasks,
      color: theme.primary,
    },
    {
      icon: 'hourglass-start',
      label: '待接单',
      value: stats.pendingTasks,
      color: '#FDCB6E',
    },
    {
      icon: 'spinner',
      label: '进行中',
      value: stats.inProgressTasks,
      color: '#6C63FF',
    },
    {
      icon: 'check-circle',
      label: '已完成',
      value: stats.completedTasks,
      color: '#00B894',
    },
  ];

  return (
    <Screen backgroundColor={theme.backgroundRoot} statusBarStyle="dark">
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <View>
              <Text style={styles.greeting}>你好，{user?.nickname || '雇主'}</Text>
              <Text style={styles.subGreeting}>今天想发布什么任务？</Text>
            </View>
            <TouchableOpacity onPress={() => router.push('/(tabs)/profile')}>
              <View style={[styles.avatar, { backgroundColor: `${theme.primary}20` }]}>
                {user?.avatarUrl ? (
                  <Image source={{ uri: user.avatarUrl }} style={styles.avatarImage} />
                ) : (
                  <FontAwesome6 name="user" size={24} color={theme.primary} />
                )}
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* Publish Task Button */}
        <TouchableOpacity
          style={styles.publishButton}
          onPress={() => setShowPublishModal(true)}
        >
          <View style={styles.publishIcon}>
            <FontAwesome6 name="plus" size={24} color="#FFFFFF" />
          </View>
          <View style={styles.publishContent}>
            <Text style={styles.publishTitle}>发布新任务</Text>
            <Text style={styles.publishDescription}>快速找到合适的工人</Text>
          </View>
          <FontAwesome6 name="chevron-right" size={20} color="#FFFFFF" />
        </TouchableOpacity>

        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          {statCards.map((stat, index) => (
            <TouchableOpacity
              key={index}
              style={styles.statCard}
              onPress={() => router.push('/(tabs)/orders')}
            >
              <View style={[styles.statIcon, { backgroundColor: `${stat.color}15` }]}>
                <FontAwesome6 name={stat.icon as any} size={18} color={stat.color} />
              </View>
              <Text style={styles.statValue}>{stat.value}</Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Quick Actions */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>快捷功能</Text>
        </View>
        <View style={styles.quickActions}>
          {quickActions.map((action, index) => (
            <TouchableOpacity
              key={index}
              style={styles.quickActionItem}
              onPress={action.onPress}
            >
              <View style={[styles.quickActionIcon, { backgroundColor: action.bgColor }]}>
                <FontAwesome6 name={action.icon as any} size={22} color={action.color} />
              </View>
              <Text style={styles.quickActionText}>{action.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Total Spent */}
        {stats.totalSpent > 0 && (
          <View style={styles.spentCard}>
            <View style={styles.spentLeft}>
              <FontAwesome6 name="coins" size={24} color={theme.warning} />
              <View style={styles.spentInfo}>
                <Text style={styles.spentLabel}>累计支出</Text>
                <Text style={styles.spentValue}>¥{stats.totalSpent.toFixed(2)}</Text>
              </View>
            </View>
            <TouchableOpacity onPress={() => router.push('/wallet')}>
              <Text style={styles.spentAction}>查看明细</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Recent Orders */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>最近订单</Text>
          <TouchableOpacity onPress={() => router.push('/(tabs)/orders')}>
            <Text style={styles.sectionAction}>查看全部</Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.primary} />
          </View>
        ) : orders.length === 0 ? (
          <View style={styles.emptyContainer}>
            <FontAwesome6
              name="clipboard-list"
              size={48}
              color={theme.textMuted}
              style={styles.emptyIcon}
            />
            <Text style={styles.emptyText}>暂无订单</Text>
            <Text style={styles.emptyHint}>点击上方发布新任务</Text>
            <TouchableOpacity
              style={styles.emptyButton}
              onPress={() => setShowPublishModal(true)}
            >
              <Text style={styles.emptyButtonText}>立即发布</Text>
            </TouchableOpacity>
          </View>
        ) : (
          orders.map((order) => (
            <TouchableOpacity
              key={order.id}
              style={styles.orderCard}
              onPress={() => router.push('/order-detail', { id: order.id })}
            >
              <View style={styles.orderCardHeader}>
                <Text style={styles.orderTitle} numberOfLines={2}>
                  {order.task.title}
                </Text>
                <View
                  style={[
                    styles.orderStatus,
                    { backgroundColor: getStatusColor(order.status) },
                  ]}
                >
                  <Text style={styles.orderStatusText}>
                    {getStatusText(order.status)}
                  </Text>
                </View>
              </View>

              <View style={styles.orderMeta}>
                <View style={styles.orderMetaItem}>
                  <FontAwesome6 name="location-dot" size={12} color={theme.textSecondary} />
                  <Text style={styles.orderMetaText} numberOfLines={1}>
                    {order.task.address}
                  </Text>
                </View>
                <View style={styles.orderMetaItem}>
                  <FontAwesome6 name="coins" size={12} color={theme.textSecondary} />
                  <Text style={styles.orderMetaText}>¥{order.agreedAmount}</Text>
                </View>
              </View>

              {order.worker && (
                <View style={styles.orderWorker}>
                  <FontAwesome6 name="user-check" size={12} color={theme.success} />
                  <Text style={styles.orderWorkerText}>{order.worker.name}</Text>
                </View>
              )}
            </TouchableOpacity>
          ))
        )}
      </ScrollView>

      {/* 发布任务弹窗 */}
      <PublishTaskModal
        visible={showPublishModal}
        onClose={() => setShowPublishModal(false)}
        onSuccess={() => {
          setShowPublishModal(false);
          loadData();
        }}
      />
    </Screen>
  );
}
