/**
 * 工人位置卡片组件
 * 显示工人的实时位置信息
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { FontAwesome6 } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '@/hooks/useTheme';
import { Spacing, BorderRadius } from '@/constants/theme';

interface WorkerLocationCardProps {
  orderId: string;
  orderStatus: string;
  taskLocation?: {
    latitude: number;
    longitude: number;
    address: string;
  };
  worker?: {
    id: string;
    name: string;
    avatar?: string;
  };
  isEmployer: boolean;
}

interface WorkerLocation {
  hasLocation: boolean;
  location?: {
    latitude: number;
    longitude: number;
    updatedAt: string;
  };
  worker?: {
    id: string;
    name: string;
    avatar?: string;
  };
  orderStatus: string;
  message?: string;
}

const BASE_URL = process.env.EXPO_PUBLIC_BACKEND_BASE_URL || 'http://localhost:9091';

export function WorkerLocationCard({
  orderId,
  orderStatus,
  taskLocation,
  worker,
  isEmployer,
}: WorkerLocationCardProps) {
  const { theme } = useTheme();
  const styles = createStyles(theme);

  const [locationData, setLocationData] = useState<WorkerLocation | null>(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // 只有雇主且订单状态为 accepted 或 in_progress 时才显示
  const shouldShow = isEmployer && (orderStatus === 'accepted' || orderStatus === 'in_progress');

  // 获取工人位置
  const fetchWorkerLocation = useCallback(async (showLoading = false) => {
    if (!shouldShow) return;

    if (showLoading) setLoading(true);
    try {
      const token = await getStoredToken();
      const response = await fetch(`${BASE_URL}/api/v1/orders/${orderId}/worker-location`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setLocationData(data);
      }
    } catch (error) {
      console.error('获取工人位置失败:', error);
    } finally {
      if (showLoading) setLoading(false);
    }
  }, [orderId, shouldShow]);

  // 初始加载
  useEffect(() => {
    if (!shouldShow) return;

    fetchWorkerLocation(true);
  }, [shouldShow, orderId, fetchWorkerLocation]);

  // 定时刷新（每30秒）
  useEffect(() => {
    if (!shouldShow || orderStatus !== 'in_progress') return;

    const interval = setInterval(() => {
      setRefreshing(true);
      fetchWorkerLocation().finally(() => setRefreshing(false));
    }, 30000);

    return () => clearInterval(interval);
  }, [shouldShow, orderStatus, fetchWorkerLocation]);

  // 手动刷新
  const handleRefresh = () => {
    setRefreshing(true);
    fetchWorkerLocation().finally(() => setRefreshing(false));
  };

  if (!shouldShow) return null;

  // 计算两点间距离（简化版，实际应使用更精确的算法）
  const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number): string => {
    const R = 6371; // 地球半径（公里）
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;

    if (distance < 1) {
      return `${Math.round(distance * 1000)}米`;
    }
    return `${distance.toFixed(1)}公里`;
  };

  // 格式化时间
  const formatTime = (dateStr: string): string => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return '刚刚';
    if (diffMins < 60) return `${diffMins}分钟前`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}小时前`;
    return `${Math.floor(diffMins / 1440)}天前`;
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="small" color={theme.primary} />
        <Text style={styles.loadingText}>获取工人位置...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <FontAwesome6 name="location-crosshairs" size={18} color={theme.primary} />
          <Text style={styles.title}>工人位置</Text>
        </View>
        <TouchableOpacity onPress={handleRefresh} style={styles.refreshButton}>
          <FontAwesome6
            name={refreshing ? "spinner" : "rotate"}
            size={16}
            color={theme.textSecondary}
          />
        </TouchableOpacity>
      </View>

      {locationData?.hasLocation && locationData.location ? (
        <>
          <View style={styles.locationInfo}>
            <View style={styles.locationRow}>
              <FontAwesome6 name="user" size={14} color={theme.textSecondary} />
              <Text style={styles.workerName}>
                {locationData.worker?.name || worker?.name || '工人'}
              </Text>
            </View>

            <View style={styles.locationRow}>
              <FontAwesome6 name="map-pin" size={14} color={theme.success} />
              <Text style={styles.locationText}>
                纬度: {locationData.location.latitude.toFixed(6)}, 
                经度: {locationData.location.longitude.toFixed(6)}
              </Text>
            </View>

            {taskLocation && (
              <View style={styles.locationRow}>
                <FontAwesome6 name="route" size={14} color={theme.warning} />
                <Text style={styles.distanceText}>
                  距离工作地点: {
                    calculateDistance(
                      locationData.location.latitude,
                      locationData.location.longitude,
                      taskLocation.latitude,
                      taskLocation.longitude
                    )
                  }
                </Text>
              </View>
            )}

            <View style={styles.locationRow}>
              <FontAwesome6 name="clock" size={14} color={theme.textMuted} />
              <Text style={styles.timeText}>
                更新于: {formatTime(locationData.location.updatedAt)}
              </Text>
            </View>
          </View>

          {/* 状态提示 */}
          <View style={styles.statusHint}>
            <View style={[styles.statusDot, { backgroundColor: theme.success }]} />
            <Text style={styles.statusText}>
              {orderStatus === 'in_progress' ? '工人正在工作中' : '工人已接单，即将开始'}
            </Text>
          </View>
        </>
      ) : (
        <View style={styles.emptyState}>
          <FontAwesome6 name="map-location-dot" size={32} color={theme.textMuted} />
          <Text style={styles.emptyText}>
            {locationData?.message || '工人暂未上报位置'}
          </Text>
          <Text style={styles.emptyHint}>
            工人开始工作后会上报实时位置
          </Text>
        </View>
      )}
    </View>
  );
}

// 获取存储的token
async function getStoredToken(): Promise<string> {
  return await AsyncStorage.getItem('auth_token') || '';
}

const createStyles = (theme: any) =>
  StyleSheet.create({
    container: {
      backgroundColor: theme.backgroundElevated,
      borderRadius: BorderRadius.lg,
      padding: Spacing.lg,
      marginVertical: Spacing.sm,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: Spacing.md,
    },
    headerLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.sm,
    },
    title: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.textPrimary,
    },
    refreshButton: {
      padding: Spacing.xs,
    },
    loadingText: {
      marginLeft: Spacing.sm,
      color: theme.textSecondary,
      fontSize: 14,
    },
    locationInfo: {
      gap: Spacing.sm,
    },
    locationRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.sm,
    },
    workerName: {
      fontSize: 15,
      fontWeight: '500',
      color: theme.textPrimary,
    },
    locationText: {
      fontSize: 14,
      color: theme.textSecondary,
    },
    distanceText: {
      fontSize: 14,
      color: theme.warning,
      fontWeight: '500',
    },
    timeText: {
      fontSize: 13,
      color: theme.textMuted,
    },
    statusHint: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.sm,
      marginTop: Spacing.md,
      paddingTop: Spacing.md,
      borderTopWidth: 1,
      borderTopColor: theme.border,
    },
    statusDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
    },
    statusText: {
      fontSize: 13,
      color: theme.textSecondary,
    },
    emptyState: {
      alignItems: 'center',
      paddingVertical: Spacing.xl,
    },
    emptyText: {
      fontSize: 15,
      color: theme.textSecondary,
      marginTop: Spacing.md,
    },
    emptyHint: {
      fontSize: 13,
      color: theme.textMuted,
      marginTop: Spacing.xs,
    },
  });
