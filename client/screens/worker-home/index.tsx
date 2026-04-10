import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  FlatList,
  RefreshControl,
  Image,
  Switch,
  Alert,
} from 'react-native';
import { FontAwesome6 } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Screen } from '@/components/Screen';
import { ThemedText } from '@/components/ThemedText';
import { useTheme } from '@/hooks/useTheme';
import { useAuth } from '@/contexts/AuthContext';
import { useSafeRouter } from '@/hooks/useSafeRouter';
import { Spacing } from '@/constants/theme';
import { createStyles } from './styles';
import api from '@/utils/api';
import OnlineNoticeModal from '@/components/OnlineNoticeModal';

const EXPO_PUBLIC_BACKEND_BASE_URL = process.env.EXPO_PUBLIC_BACKEND_BASE_URL;

interface Task {
  id: string;
  title: string;
  description: string;
  address: string;
  budget: {
    fixed?: number;
    min?: number;
    max?: number;
    type: string;
  };
  urgency: string;
  distance?: number;
  category: {
    name: string;
    icon: string;
  };
  employer: {
    id: string;
    name: string;
    rating: number;
  };
  createdAt: string;
}

export default function WorkerHomeScreen() {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const { user, updateUser } = useAuth();
  const router = useSafeRouter();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  // 在线状态相关
  const [isOnline, setIsOnline] = useState(false);
  const [showOnlineModal, setShowOnlineModal] = useState(false);
  const [isLoadingStatus, setIsLoadingStatus] = useState(false);

  useFocusEffect(
    React.useCallback(() => {
      loadData();
      fetchOnlineStatus();
    }, [])
  );

  const loadData = async () => {
    try {
      const [tasksData, categoriesData] = await Promise.all([
        api.getTasks({ limit: 10 }),
        api.getTaskCategories(),
      ]);
      setTasks(tasksData.tasks || []);
      setCategories(categoriesData || []);
    } catch (error) {
      console.error('Load data error:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchOnlineStatus = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      /**
       * 服务端文件：server/src/routes/online-status.ts
       * 接口：GET /api/v1/online-status
       * 无参数
       */
      const response = await fetch(`${EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/online-status`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (response.ok) {
        setIsOnline(data.isOnline);
        updateUser({ isOnline: data.isOnline });
      }
    } catch (error) {
      console.error('Fetch online status error:', error);
    }
  };

  const handleOnlineToggle = (value: boolean) => {
    if (value) {
      // 上线时显示弹窗
      setShowOnlineModal(true);
    } else {
      // 下线直接执行
      updateOnlineStatus(false);
    }
  };

  const handleOnlineConfirm = () => {
    setShowOnlineModal(false);
    updateOnlineStatus(true);
  };

  const updateOnlineStatus = async (status: boolean) => {
    setIsLoadingStatus(true);
    try {
      const token = await AsyncStorage.getItem('token');
      /**
       * 服务端文件：server/src/routes/online-status.ts
       * 接口：PUT /api/v1/online-status
       * Body 参数：isOnline: boolean
       */
      const response = await fetch(`${EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/online-status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ isOnline: status }),
      });
      const data = await response.json();
      if (response.ok) {
        setIsOnline(status);
        updateUser({ isOnline: status });
      } else {
        // 处理特殊错误码
        if (data.code === 'VERIFICATION_REQUIRED' || data.code === 'VERIFICATION_PENDING' || data.code === 'VERIFICATION_REJECTED') {
          Alert.alert(
            '无法上线',
            data.error,
            [
              { text: '取消', style: 'cancel' },
              { text: '去认证', onPress: () => router.push('/verification') },
            ]
          );
        } else if (data.code === 'DISCLAIMER_REQUIRED') {
          Alert.alert(
            '无法上线',
            data.error,
            [
              { text: '取消', style: 'cancel' },
              { text: '去签署', onPress: () => router.push('/verification') },
            ]
          );
        } else {
          Alert.alert('错误', data.error || '操作失败');
        }
      }
    } catch (error) {
      console.error('Update online status error:', error);
      Alert.alert('错误', '网络错误，请重试');
    } finally {
      setIsLoadingStatus(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const formatBudget = (budget: Task['budget']) => {
    if (budget.type === 'fixed' && budget.fixed) {
      return `¥${budget.fixed}`;
    } else if (budget.type === 'range' && budget.min && budget.max) {
      return `¥${budget.min}-${budget.max}`;
    } else {
      return '面议';
    }
  };

  const formatDistance = (distance?: number) => {
    if (!distance) return '';
    if (distance < 1) {
      return `${Math.round(distance * 1000)}m`;
    }
    return `${distance.toFixed(1)}km`;
  };

  const getCategoryIcon = (iconName: string) => {
    const iconMap: Record<string, string> = {
      'truck': 'truck',
      'home': 'house',
      'wrench': 'wrench',
      'paint-roller': 'paint-roller',
      'bolt': 'bolt',
      'laptop-code': 'laptop-code',
      'palette': 'palette',
      'graduation-cap': 'graduation-cap',
      'running': 'person-running',
      'users': 'users',
    };
    return iconMap[iconName] || 'briefcase';
  };

  // 在线状态卡片样式
  const onlineStatusStyles = useMemo(() => ({
    onlineCard: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      justifyContent: 'space-between' as const,
      backgroundColor: isOnline ? `${theme.success}10` : theme.backgroundDefault,
      borderRadius: 24,
      padding: 20,
      marginBottom: 24,
      borderWidth: 1,
      borderColor: isOnline ? `${theme.success}30` : 'transparent',
    },
    onlineInfo: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
    },
    onlineIconContainer: {
      width: 48,
      height: 48,
      borderRadius: 16,
      backgroundColor: isOnline ? `${theme.success}15` : `${theme.textMuted}15`,
      justifyContent: 'center' as const,
      alignItems: 'center' as const,
      marginRight: 16,
    },
    onlineTextContainer: {
      flex: 1,
    },
    onlineTitle: {
      fontSize: 16,
      fontWeight: '600' as const,
      color: theme.textPrimary,
      marginBottom: 4,
    },
    onlineSubtitle: {
      fontSize: 13,
      color: isOnline ? theme.success : theme.textSecondary,
    },
  }), [theme, isOnline]);

  const renderTaskItem = ({ item }: { item: Task }) => (
    <TouchableOpacity
      style={styles.taskCard}
      onPress={() => router.push('/task-detail', { id: item.id })}
    >
      <View style={styles.taskCardHeader}>
        <Text style={styles.taskTitle} numberOfLines={2}>
          {item.title}
        </Text>
        <Text style={styles.taskBudget}>{formatBudget(item.budget)}</Text>
      </View>

      <View style={styles.taskMeta}>
        <View style={styles.taskMetaItem}>
          <FontAwesome6 name="location-dot" size={12} color={theme.textSecondary} />
          <Text style={styles.taskMetaText} numberOfLines={1}>
            {formatDistance(item.distance) || item.address}
          </Text>
        </View>
        <View style={styles.taskMetaItem}>
          <FontAwesome6 name="tag" size={12} color={theme.textSecondary} />
          <Text style={styles.taskMetaText}>{item.category.name}</Text>
        </View>
      </View>

      <Text style={styles.taskDescription} numberOfLines={2}>
        {item.description}
      </Text>
    </TouchableOpacity>
  );

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
            <Text style={styles.greeting}>
              你好，{user?.nickname || '工人'}
            </Text>
            <TouchableOpacity onPress={() => router.push('/(tabs)/profile')}>
              <View style={[styles.avatar, { backgroundColor: `${theme.primary}20` }]}>
                {user?.avatarUrl ? (
                  <Image source={{ uri: user.avatarUrl }} style={styles.avatar} />
                ) : (
                  <FontAwesome6 name="user" size={24} color={theme.primary} />
                )}
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{user?.completedOrders || 0}</Text>
            <Text style={styles.statLabel}>已完成</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{user?.rating || 5.0}</Text>
            <Text style={styles.statLabel}>评分</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>¥{user?.balance || 0}</Text>
            <Text style={styles.statLabel}>余额</Text>
          </View>
        </View>

        {/* 接单状态卡片 */}
        <View style={onlineStatusStyles.onlineCard}>
          <View style={onlineStatusStyles.onlineInfo}>
            <View style={onlineStatusStyles.onlineIconContainer}>
              <FontAwesome6
                name={isOnline ? 'toggle-on' : 'toggle-off'}
                size={24}
                color={isOnline ? theme.success : theme.textMuted}
              />
            </View>
            <View style={onlineStatusStyles.onlineTextContainer}>
              <Text style={onlineStatusStyles.onlineTitle}>
                {isOnline ? '接单中' : '已下线'}
              </Text>
              <Text style={onlineStatusStyles.onlineSubtitle}>
                {isOnline ? '您可以接收新的工作订单' : '开启接单状态以接收订单'}
              </Text>
            </View>
          </View>
          <Switch
            value={isOnline}
            onValueChange={handleOnlineToggle}
            trackColor={{ false: theme.border, true: `${theme.success}50` }}
            thumbColor={isOnline ? theme.success : theme.backgroundElevated}
            ios_backgroundColor={theme.border}
            disabled={isLoadingStatus}
          />
        </View>

        {/* Categories */}
        <View style={styles.categoryContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>任务分类</Text>
          </View>
          <View style={{ marginLeft: -Spacing["2xl"], marginRight: -Spacing["2xl"] }}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.categoryScroll}
              contentContainerStyle={{ paddingHorizontal: Spacing["2xl"] }}
            >
              {categories.slice(0, 8).map((category) => (
                <TouchableOpacity key={category.id} style={styles.categoryItem}>
                  <View style={styles.categoryIcon}>
                    <FontAwesome6
                      name={getCategoryIcon(category.icon)}
                      size={22}
                      color={theme.primary}
                    />
                  </View>
                  <Text style={styles.categoryName}>{category.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>

        {/* Task List */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>附近任务</Text>
          <TouchableOpacity>
            <Text style={styles.sectionAction}>查看全部</Text>
          </TouchableOpacity>
        </View>

        {tasks.length === 0 ? (
          <View style={styles.emptyContainer}>
            <FontAwesome6
              name="briefcase"
              size={48}
              color={theme.textMuted}
              style={styles.emptyIcon}
            />
            <Text style={styles.emptyText}>暂无附近任务</Text>
          </View>
        ) : (
          tasks.map((task) => (
            <View key={task.id}>
              {renderTaskItem({ item: task })}
            </View>
          ))
        )}
      </ScrollView>

      {/* 上线注意事项弹窗 */}
      <OnlineNoticeModal
        visible={showOnlineModal}
        onClose={() => setShowOnlineModal(false)}
        onConfirm={handleOnlineConfirm}
      />
    </Screen>
  );
}
