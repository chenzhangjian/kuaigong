import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { FontAwesome6 } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { Screen } from '@/components/Screen';
import { useTheme } from '@/hooks/useTheme';
import { useAuth } from '@/contexts/AuthContext';
import { useSafeRouter } from '@/hooks/useSafeRouter';
import { createStyles } from './styles';
import api from '@/utils/api';

export default function OrdersScreen() {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const { user, userType } = useAuth();
  const router = useSafeRouter();

  const [orders, setOrders] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');

  useFocusEffect(
    React.useCallback(() => {
      loadOrders();
    }, [activeTab])
  );

  const loadOrders = async () => {
    try {
      const status = activeTab === 'all' ? undefined : activeTab;
      const data = await api.getOrders({
        role: userType as any,
        status,
        limit: 20
      });
      setOrders(data.orders || []);
    } catch (error) {
      console.error('Load orders error:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadOrders();
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

  const tabs = [
    { key: 'all', label: '全部' },
    { key: 'in_progress', label: '进行中' },
    { key: 'completed', label: '已完成' },
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
          <Text style={styles.title}>我的订单</Text>
        </View>

        {/* Tabs */}
        <View style={styles.tabsContainer}>
          {tabs.map((tab) => (
            <TouchableOpacity
              key={tab.key}
              style={[
                styles.tab,
                activeTab === tab.key && styles.tabActive,
              ]}
              onPress={() => setActiveTab(tab.key)}
            >
              <Text
                style={[
                  styles.tabText,
                  activeTab === tab.key && styles.tabTextActive,
                ]}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Orders List */}
        {orders.length === 0 ? (
          <View style={styles.emptyContainer}>
            <FontAwesome6
              name="clipboard-list"
              size={48}
              color={theme.textMuted}
              style={styles.emptyIcon}
            />
            <Text style={styles.emptyText}>暂无订单</Text>
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
                  <Text style={{ color: '#FFFFFF', fontWeight: '600', fontSize: 12 }}>
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
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </Screen>
  );
}
