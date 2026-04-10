import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { FontAwesome6 } from '@expo/vector-icons';
import { Screen } from '@/components/Screen';
import { useTheme } from '@/hooks/useTheme';
import { useAuth } from '@/contexts/AuthContext';
import { useSafeRouter, useSafeSearchParams } from '@/hooks/useSafeRouter';
import { createStyles } from './styles';
import api from '@/utils/api';

export default function TaskDetailScreen() {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const router = useSafeRouter();
  const { id } = useSafeSearchParams<{ id: string }>();
  const { user, userType } = useAuth();

  const [task, setTask] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [applyCount, setApplyCount] = useState(0);

  useEffect(() => {
    loadTask();
  }, [id]);

  const loadTask = async () => {
    try {
      const data = await api.getTaskDetail(id);
      setTask(data);
      setApplyCount(data.applyCount || 0);
    } catch (error) {
      console.error('Load task error:', error);
      Alert.alert('错误', '加载任务详情失败');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const handleApply = async () => {
    if (userType !== 'worker') {
      Alert.alert('提示', '只有工人可以申请任务');
      return;
    }

    try {
      await api.applyTask(id);
      Alert.alert('成功', '已申请该任务，等待雇主确认');
      router.back();
    } catch (error: any) {
      Alert.alert('申请失败', error.message || '请重试');
    }
  };

  const handleViewApplications = () => {
    router.push('/task-applications', { taskId: id });
  };

  if (loading || !task) {
    return (
      <Screen backgroundColor={theme.backgroundRoot} statusBarStyle="dark">
        <View style={styles.container}>
          <Text>加载中...</Text>
        </View>
      </Screen>
    );
  }

  return (
    <Screen backgroundColor={theme.backgroundRoot} statusBarStyle="dark">
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <FontAwesome6 name="arrow-left" size={24} color={theme.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>任务详情</Text>
          <View style={{ width: 24 }} />
        </View>

        {/* Task Info */}
        <View style={styles.taskInfo}>
          <Text style={styles.title}>{task.title}</Text>
          <Text style={styles.budget}>
            ¥{task.budget.fixed || task.budget.min || '面议'}
          </Text>
        </View>

        <View style={styles.detailItem}>
          <FontAwesome6 name="location-dot" size={16} color={theme.primary} />
          <Text style={styles.detailText}>{task.address}</Text>
        </View>

        <View style={styles.detailItem}>
          <FontAwesome6 name="tag" size={16} color={theme.primary} />
          <Text style={styles.detailText}>{task.category?.name}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>任务描述</Text>
          <Text style={styles.description}>{task.description}</Text>
        </View>

        {/* Employer Info */}
        <View style={styles.employerCard}>
          <View style={styles.employerInfo}>
            <FontAwesome6 name="user" size={24} color={theme.primary} />
            <View style={styles.employerText}>
              <Text style={styles.employerName}>{task.employer?.name}</Text>
              <Text style={styles.employerRating}>
                评分: {task.employer?.rating || 5.0}
              </Text>
            </View>
          </View>
        </View>

        {/* Task Status */}
        <View style={styles.statusCard}>
          <View style={styles.statusRow}>
            <FontAwesome6 name="circle-info" size={18} color={theme.textSecondary} />
            <Text style={styles.statusText}>
              {task.status === 'open' ? '招募中' : task.status === 'assigned' ? '已指派' : task.status === 'in_progress' ? '进行中' : '已完成'}
            </Text>
          </View>
          {task.status === 'open' && (
            <Text style={styles.applyCountText}>{applyCount} 人申请</Text>
          )}
        </View>

        {/* Employer: View Applications Button */}
        {userType === 'employer' && task.status === 'open' && (
          <TouchableOpacity style={styles.viewApplicationsButton} onPress={handleViewApplications}>
            <FontAwesome6 name="users" size={18} color="#FFFFFF" />
            <Text style={styles.viewApplicationsButtonText}>查看申请列表</Text>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{applyCount}</Text>
            </View>
          </TouchableOpacity>
        )}

        {/* Worker: Apply Button */}
        {userType === 'worker' && task.status === 'open' && (
          <TouchableOpacity style={styles.applyButton} onPress={handleApply}>
            <FontAwesome6 name="paper-plane" size={18} color="#FFFFFF" />
            <Text style={styles.applyButtonText}>申请接单</Text>
          </TouchableOpacity>
        )}

        {/* Task closed message */}
        {task.status !== 'open' && userType === 'worker' && (
          <View style={styles.closedMessage}>
            <FontAwesome6 name="lock" size={16} color={theme.textMuted} />
            <Text style={styles.closedMessageText}>该任务已关闭申请</Text>
          </View>
        )}
      </ScrollView>
    </Screen>
  );
}
