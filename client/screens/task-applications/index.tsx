import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { FontAwesome6 } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { Screen } from '@/components/Screen';
import { useTheme } from '@/hooks/useTheme';
import { useSafeRouter, useSafeSearchParams } from '@/hooks/useSafeRouter';
import { createStyles } from './styles';
import api from '@/utils/api';

interface Application {
  id: string;
  message: string;
  proposedAmount: number;
  status: string;
  createdAt: string;
  worker: {
    id: string;
    nickname: string;
    avatar: string;
    rating: number;
    skills: string[];
    totalOrders: number;
    completedOrders: number;
  };
}

export default function TaskApplicationsScreen() {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const router = useSafeRouter();
  const { taskId } = useSafeSearchParams<{ taskId: string }>();

  const [applications, setApplications] = useState<Application[]>([]);
  const [task, setTask] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);

  useFocusEffect(
    React.useCallback(() => {
      loadData();
    }, [taskId])
  );

  const loadData = async () => {
    try {
      const [taskData, applicationsData] = await Promise.all([
        api.getTaskDetail(taskId),
        api.getTaskApplications(taskId),
      ]);
      setTask(taskData);
      setApplications(applicationsData);
    } catch (error) {
      console.error('Load data error:', error);
      Alert.alert('错误', '加载数据失败');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const handleAccept = (application: Application) => {
    const agreedAmount = application.proposedAmount || task?.budget?.fixed || 0;
    
    Alert.alert(
      '确认选择',
      `确定选择 ${application.worker.nickname} 完成此任务？\n\n协商金额: ¥${agreedAmount}`,
      [
        { text: '取消', style: 'cancel' },
        {
          text: '确认',
          onPress: () => acceptApplication(application.id, agreedAmount),
        },
      ]
    );
  };

  const acceptApplication = async (applicationId: string, agreedAmount: number) => {
    setProcessingId(applicationId);
    try {
      await api.acceptApplication(applicationId, agreedAmount);
      Alert.alert('成功', '已选择工人，订单已创建', [
        {
          text: '查看订单',
          onPress: () => router.replace('/(tabs)/orders'),
        },
      ]);
    } catch (error: any) {
      Alert.alert('操作失败', error.message || '请重试');
    } finally {
      setProcessingId(null);
    }
  };

  const renderStars = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    for (let i = 0; i < fullStars; i++) {
      stars.push(
        <FontAwesome6 key={i} name="star" size={12} color="#F39C12" solid />
      );
    }
    if (rating % 1 >= 0.5 && stars.length < 5) {
      stars.push(
        <FontAwesome6 key="half" name="star-half-stroke" size={12} color="#F39C12" />
      );
    }
    return stars;
  };

  if (loading) {
    return (
      <Screen backgroundColor={theme.backgroundRoot} statusBarStyle="dark">
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
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <FontAwesome6 name="arrow-left" size={24} color={theme.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>申请管理</Text>
          <View style={{ width: 24 }} />
        </View>

        {/* Task Info */}
        {task && (
          <View style={styles.taskInfo}>
            <Text style={styles.taskTitle}>{task.title}</Text>
            <Text style={styles.taskBudget}>
              ¥{task.budget?.fixed || task.budget?.min || '面议'}
            </Text>
          </View>
        )}

        {/* Applications List */}
        <Text style={styles.sectionTitle}>
          申请列表 ({applications.length}人)
        </Text>

        {applications.length === 0 ? (
          <View style={styles.emptyContainer}>
            <FontAwesome6
              name="users"
              size={48}
              color={theme.textMuted}
              style={styles.emptyIcon}
            />
            <Text style={styles.emptyText}>暂无申请</Text>
            <Text style={styles.emptyHint}>等待工人申请接单</Text>
          </View>
        ) : (
          applications.map((application) => (
            <View key={application.id} style={styles.applicationCard}>
              {/* Worker Info */}
              <View style={styles.applicationHeader}>
                <View style={styles.avatar}>
                  {application.worker.avatar ? (
                    <Image
                      source={{ uri: application.worker.avatar }}
                      style={styles.avatarImage}
                    />
                  ) : (
                    <FontAwesome6 name="user" size={20} color={theme.primary} />
                  )}
                </View>
                <View style={styles.workerInfo}>
                  <Text style={styles.workerName}>{application.worker.nickname}</Text>
                  <View style={styles.workerMeta}>
                    <FontAwesome6 name="star" size={12} color={theme.warning} />
                    <Text style={styles.workerRating}>
                      {application.worker.rating?.toFixed(1) || '5.0'}
                    </Text>
                    <Text style={styles.workerOrders}>
                      已完成 {application.worker.completedOrders || 0} 单
                    </Text>
                  </View>
                </View>
              </View>

              {/* Application Details */}
              <View style={styles.applicationBody}>
                {application.message && (
                  <Text style={styles.applicationMessage}>{application.message}</Text>
                )}
                <View style={styles.proposedAmount}>
                  <Text style={styles.proposedLabel}>报价:</Text>
                  <Text style={styles.proposedValue}>
                    ¥{application.proposedAmount || task?.budget?.fixed || '面议'}
                  </Text>
                </View>
                {application.worker.skills && application.worker.skills.length > 0 && (
                  <View style={styles.skillsContainer}>
                    {application.worker.skills.slice(0, 4).map((skill, index) => (
                      <View key={index} style={styles.skillTag}>
                        <Text style={styles.skillText}>{skill}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>

              {/* Actions */}
              <View style={styles.applicationFooter}>
                <TouchableOpacity
                  style={styles.rejectButton}
                  onPress={() => Alert.alert('提示', '如需取消，请等待24小时后系统自动取消，或联系客服')}
                >
                  <Text style={styles.rejectButtonText}>暂不选择</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.acceptButton,
                    processingId === application.id && { opacity: 0.7 },
                  ]}
                  onPress={() => handleAccept(application)}
                  disabled={processingId !== null}
                >
                  {processingId === application.id ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text style={styles.acceptButtonText}>选择TA</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </Screen>
  );
}
