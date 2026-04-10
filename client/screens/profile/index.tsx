import React, { useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
} from 'react-native';
import { FontAwesome6 } from '@expo/vector-icons';
import { Screen } from '@/components/Screen';
import { useTheme } from '@/hooks/useTheme';
import { useAuth } from '@/contexts/AuthContext';
import { useSafeRouter } from '@/hooks/useSafeRouter';
import { createStyles } from './styles';

export default function ProfileScreen() {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const { user, logout, userType } = useAuth();
  const router = useSafeRouter();

  const handleLogout = () => {
    Alert.alert(
      '退出登录',
      '确定要退出登录吗？',
      [
        { text: '取消', style: 'cancel' },
        {
          text: '确定',
          style: 'destructive',
          onPress: async () => {
            await logout();
            router.replace('/login');
          },
        },
      ]
    );
  };

  const menuItems = [
    {
      icon: 'user-pen',
      title: '编辑资料',
      onPress: () => router.push('/edit-profile'),
    },
    {
      icon: 'shield-halved',
      title: '实名认证',
      subtitle: user?.isVerified ? '已认证' : '未认证',
      onPress: () => router.push('/verification'),
    },
    // 工人专属：技术证书
    ...(userType === 'worker' ? [{
      icon: 'scroll',
      title: '技术证书',
      onPress: () => router.push('/certificates'),
    }] : []),
    {
      icon: 'wallet',
      title: '钱包',
      subtitle: `余额: ¥${user?.balance || 0}`,
      onPress: () => router.push('/wallet'),
    },
    {
      icon: 'star',
      title: '我的评价',
      onPress: () => router.push('/orders'),
    },
    {
      icon: 'headset',
      title: '帮助中心',
      onPress: () => router.push('/customer-service'),
    },
  ];

  const legalItems = [
    {
      icon: 'file-lines',
      title: '隐私政策',
      onPress: () => router.push('/privacy-policy'),
    },
    {
      icon: 'file-contract',
      title: '用户协议',
      onPress: () => router.push('/user-agreement'),
    },
    {
      icon: 'info-circle',
      title: '关于快工',
      subtitle: '版本 1.0.0',
      onPress: () => router.push('/about'),
    },
  ];

  return (
    <Screen backgroundColor={theme.backgroundRoot} statusBarStyle="dark">
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <View style={styles.avatarContainer}>
            {user?.avatarUrl ? (
              <Image source={{ uri: user.avatarUrl }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, { backgroundColor: `${theme.primary}20` }]}>
                <FontAwesome6 name="user" size={32} color={theme.primary} />
              </View>
            )}
          </View>
          <Text style={styles.userName}>{user?.nickname || '用户'}</Text>
          <Text style={styles.userPhone}>{user?.phone || ''}</Text>
          <View style={styles.userTypeBadge}>
            <Text style={styles.userTypeText}>
              {userType === 'worker' ? '工人' : '雇主'}
            </Text>
          </View>
        </View>

        {/* Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{user?.rating || 5.0}</Text>
            <Text style={styles.statLabel}>评分</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{user?.completedOrders || 0}</Text>
            <Text style={styles.statLabel}>已完成</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{user?.totalOrders || 0}</Text>
            <Text style={styles.statLabel}>总订单</Text>
          </View>
        </View>

        {/* Menu List */}
        <View style={styles.menuContainer}>
          {menuItems.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={styles.menuItem}
              onPress={item.onPress}
            >
              <View style={styles.menuIconContainer}>
                <FontAwesome6
                  name={item.icon as any}
                  size={18}
                  color={theme.primary}
                />
              </View>
              <View style={styles.menuContent}>
                <Text style={styles.menuTitle}>{item.title}</Text>
                {item.subtitle && (
                  <Text style={styles.menuSubtitle}>{item.subtitle}</Text>
                )}
              </View>
              <FontAwesome6 name="chevron-right" size={14} color={theme.textMuted} />
            </TouchableOpacity>
          ))}
        </View>

        {/* Legal List */}
        <View style={styles.menuContainer}>
          {legalItems.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={styles.menuItem}
              onPress={item.onPress}
            >
              <View style={styles.menuIconContainer}>
                <FontAwesome6
                  name={item.icon as any}
                  size={18}
                  color={theme.textSecondary}
                />
              </View>
              <View style={styles.menuContent}>
                <Text style={styles.menuTitle}>{item.title}</Text>
                {item.subtitle && (
                  <Text style={styles.menuSubtitle}>{item.subtitle}</Text>
                )}
              </View>
              <FontAwesome6 name="chevron-right" size={14} color={theme.textMuted} />
            </TouchableOpacity>
          ))}
        </View>

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutButtonText}>退出登录</Text>
        </TouchableOpacity>
      </ScrollView>
    </Screen>
  );
}
