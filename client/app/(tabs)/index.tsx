import React from 'react';
import { View, ActivityIndicator, Text } from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/hooks/useTheme';
import WorkerHomeScreen from '@/screens/worker-home';
import EmployerHomeScreen from '@/screens/employer-home';

/**
 * 首页 - 根据用户角色动态显示不同的页面
 * worker: 显示工人首页（浏览任务、接单）
 * employer: 显示雇主首页（发布任务、管理订单）
 */
export default function HomeScreen() {
  const { userType, isLoading } = useAuth();
  const { theme } = useTheme();

  // 加载中状态
  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.backgroundRoot }}>
        <ActivityIndicator size="large" color={theme.primary} />
        <Text style={{ marginTop: 16, color: theme.textSecondary }}>加载中...</Text>
      </View>
    );
  }

  // 根据用户角色显示对应的首页
  if (userType === 'employer') {
    return <EmployerHomeScreen />;
  }

  // 默认显示工人首页
  return <WorkerHomeScreen />;
}
