import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  ActivityIndicator,
  Modal,
  TextInput,
} from 'react-native';
import { FontAwesome6 } from '@expo/vector-icons';
import { Screen } from '@/components/Screen';
import { useTheme } from '@/hooks/useTheme';
import { useAuth } from '@/contexts/AuthContext';
import { useSafeRouter } from '@/hooks/useSafeRouter';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '@/utils/api';
import { Spacing, BorderRadius, Typography } from '@/constants/theme';

interface UserSettings {
  notificationEnabled: boolean;
  pushEnabled: boolean;
  language: string;
  theme: string;
}

export default function SettingsScreen() {
  const { theme } = useTheme();
  const { user, logout } = useAuth();
  const router = useSafeRouter();
  const styles = useMemo(() => createStyles(theme), [theme]);

  // 状态
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<UserSettings>({
    notificationEnabled: true,
    pushEnabled: true,
    language: 'zh-CN',
    theme: 'light',
  });

  // 修改密码弹窗
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);

  // 注销账号弹窗
  const [showDeactivateModal, setShowDeactivateModal] = useState(false);
  const [deactivateReason, setDeactivateReason] = useState('');
  const [deactivating, setDeactivating] = useState(false);

  // 加载设置
  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const data = await api.getSettings();
      setSettings(data);
    } catch (error) {
      console.error('Load settings error:', error);
    } finally {
      setLoading(false);
    }
  };

  // 更新设置
  const updateSettings = async (key: keyof UserSettings, value: any) => {
    try {
      setSaving(true);
      const newSettings = { ...settings, [key]: value };
      setSettings(newSettings);
      await api.updateSettings(newSettings);
    } catch (error) {
      console.error('Update settings error:', error);
      // 恢复原值
      setSettings(settings);
      Alert.alert('错误', '保存设置失败');
    } finally {
      setSaving(false);
    }
  };

  // 修改密码
  const handleChangePassword = async () => {
    if (!oldPassword.trim()) {
      Alert.alert('提示', '请输入当前密码');
      return;
    }
    if (newPassword.length < 6) {
      Alert.alert('提示', '新密码至少6位');
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert('提示', '两次输入的密码不一致');
      return;
    }

    try {
      setChangingPassword(true);
      await api.changePassword(oldPassword, newPassword);
      Alert.alert('成功', '密码修改成功，请重新登录', [
        {
          text: '确定',
          onPress: async () => {
            await logout();
            router.replace('/login');
          },
        },
      ]);
    } catch (error: any) {
      console.error('Change password error:', error);
      Alert.alert('错误', error.message || '修改密码失败');
    } finally {
      setChangingPassword(false);
    }
  };

  // 注销账号
  const handleDeactivate = async () => {
    if (!deactivateReason.trim()) {
      Alert.alert('提示', '请填写注销原因');
      return;
    }

    try {
      setDeactivating(true);
      await api.deactivateAccount(deactivateReason);
      Alert.alert('账号已注销', '您的账号已成功注销', [
        {
          text: '确定',
          onPress: async () => {
            await logout();
            router.replace('/login');
          },
        },
      ]);
    } catch (error: any) {
      console.error('Deactivate account error:', error);
      Alert.alert('错误', error.message || '注销账号失败');
    } finally {
      setDeactivating(false);
    }
  };

  // 清除缓存
  const handleClearCache = () => {
    Alert.alert(
      '清除缓存',
      '确定要清除本地缓存吗？这不会影响您的账号数据。',
      [
        { text: '取消', style: 'cancel' },
        {
          text: '确定',
          onPress: async () => {
            try {
              const keys = await AsyncStorage.getAllKeys();
              const keepKeys = ['token', 'userType'];
              const keysToRemove = keys.filter(k => !keepKeys.includes(k));
              await AsyncStorage.multiRemove(keysToRemove);
              Alert.alert('成功', '缓存已清除');
            } catch (error) {
              console.error('Clear cache error:', error);
              Alert.alert('错误', '清除缓存失败');
            }
          },
        },
      ]
    );
  };

  // 退出登录
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

  return (
    <Screen backgroundColor={theme.backgroundRoot}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <FontAwesome6 name="arrow-left" size={20} color={theme.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>设置</Text>
        <View style={{ width: 20 }} />
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* 账号安全 */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>账号安全</Text>
            
            <TouchableOpacity style={styles.menuItem} onPress={() => setShowPasswordModal(true)}>
              <View style={styles.menuIconContainer}>
                <FontAwesome6 name="lock" size={18} color={theme.primary} />
              </View>
              <Text style={styles.menuTitle}>修改密码</Text>
              <FontAwesome6 name="chevron-right" size={14} color={theme.textPlaceholder} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/verification')}>
              <View style={styles.menuIconContainer}>
                <FontAwesome6 name="shield-halved" size={18} color={theme.primary} />
              </View>
              <View style={styles.menuContent}>
                <Text style={styles.menuTitle}>实名认证</Text>
                <Text style={styles.menuSubtitle}>
                  {user?.isVerified ? '已认证' : '未认证'}
                </Text>
              </View>
              <FontAwesome6 name="chevron-right" size={14} color={theme.textPlaceholder} />
            </TouchableOpacity>
          </View>

          {/* 通知设置 */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>通知设置</Text>
            
            <View style={styles.menuItem}>
              <View style={styles.menuIconContainer}>
                <FontAwesome6 name="bell" size={18} color={theme.primary} />
              </View>
              <Text style={styles.menuTitle}>消息通知</Text>
              <Switch
                value={settings.notificationEnabled}
                onValueChange={(value) => updateSettings('notificationEnabled', value)}
                trackColor={{ false: theme.border, true: `${theme.primary}50` }}
                thumbColor={settings.notificationEnabled ? theme.primary : theme.textPlaceholder}
              />
            </View>

            <View style={styles.menuItem}>
              <View style={styles.menuIconContainer}>
                <FontAwesome6 name="mobile-screen" size={18} color={theme.primary} />
              </View>
              <Text style={styles.menuTitle}>推送通知</Text>
              <Switch
                value={settings.pushEnabled}
                onValueChange={(value) => updateSettings('pushEnabled', value)}
                trackColor={{ false: theme.border, true: `${theme.primary}50` }}
                thumbColor={settings.pushEnabled ? theme.primary : theme.textPlaceholder}
              />
            </View>
          </View>

          {/* 其他设置 */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>其他</Text>
            
            <TouchableOpacity style={styles.menuItem} onPress={handleClearCache}>
              <View style={styles.menuIconContainer}>
                <FontAwesome6 name="trash" size={18} color={theme.primary} />
              </View>
              <Text style={styles.menuTitle}>清除缓存</Text>
              <FontAwesome6 name="chevron-right" size={14} color={theme.textPlaceholder} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/privacy-policy')}>
              <View style={styles.menuIconContainer}>
                <FontAwesome6 name="file-lines" size={18} color={theme.primary} />
              </View>
              <Text style={styles.menuTitle}>隐私政策</Text>
              <FontAwesome6 name="chevron-right" size={14} color={theme.textPlaceholder} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/user-agreement')}>
              <View style={styles.menuIconContainer}>
                <FontAwesome6 name="file-contract" size={18} color={theme.primary} />
              </View>
              <Text style={styles.menuTitle}>用户协议</Text>
              <FontAwesome6 name="chevron-right" size={14} color={theme.textPlaceholder} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/about')}>
              <View style={styles.menuIconContainer}>
                <FontAwesome6 name="circle-info" size={18} color={theme.primary} />
              </View>
              <View style={styles.menuContent}>
                <Text style={styles.menuTitle}>关于快工</Text>
                <Text style={styles.menuSubtitle}>版本 1.0.0</Text>
              </View>
              <FontAwesome6 name="chevron-right" size={14} color={theme.textPlaceholder} />
            </TouchableOpacity>
          </View>

          {/* 退出登录 */}
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Text style={styles.logoutText}>退出登录</Text>
          </TouchableOpacity>

          {/* 注销账号 */}
          <TouchableOpacity style={styles.deactivateButton} onPress={() => setShowDeactivateModal(true)}>
            <Text style={styles.deactivateText}>注销账号</Text>
          </TouchableOpacity>
        </ScrollView>
      )}

      {/* 修改密码弹窗 */}
      <Modal visible={showPasswordModal} transparent animationType="slide" onRequestClose={() => setShowPasswordModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.backgroundSurface }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>修改密码</Text>
              <TouchableOpacity onPress={() => setShowPasswordModal(false)}>
                <FontAwesome6 name="xmark" size={20} color={theme.textPrimary} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>当前密码</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: theme.backgroundElevated, color: theme.textPrimary }]}
                  placeholder="请输入当前密码"
                  placeholderTextColor={theme.textPlaceholder}
                  secureTextEntry
                  value={oldPassword}
                  onChangeText={setOldPassword}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>新密码</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: theme.backgroundElevated, color: theme.textPrimary }]}
                  placeholder="请输入新密码（至少6位）"
                  placeholderTextColor={theme.textPlaceholder}
                  secureTextEntry
                  value={newPassword}
                  onChangeText={setNewPassword}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>确认密码</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: theme.backgroundElevated, color: theme.textPrimary }]}
                  placeholder="请再次输入新密码"
                  placeholderTextColor={theme.textPlaceholder}
                  secureTextEntry
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                />
              </View>
            </View>

            <TouchableOpacity
              style={[styles.modalButton, { backgroundColor: theme.primary }]}
              onPress={handleChangePassword}
              disabled={changingPassword}
            >
              {changingPassword ? (
                <ActivityIndicator size="small" color="#FFF" />
              ) : (
                <Text style={styles.modalButtonText}>确认修改</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* 注销账号弹窗 */}
      <Modal visible={showDeactivateModal} transparent animationType="slide" onRequestClose={() => setShowDeactivateModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.backgroundSurface }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>注销账号</Text>
              <TouchableOpacity onPress={() => setShowDeactivateModal(false)}>
                <FontAwesome6 name="xmark" size={20} color={theme.textPrimary} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <View style={styles.warningBox}>
                <FontAwesome6 name="triangle-exclamation" size={24} color="#FF6B6B" />
                <Text style={styles.warningText}>
                  注销账号后，您的所有数据将被永久删除且无法恢复。请谨慎操作。
                </Text>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>注销原因</Text>
                <TextInput
                  style={[styles.input, styles.textArea, { backgroundColor: theme.backgroundElevated, color: theme.textPrimary }]}
                  placeholder="请说明注销原因"
                  placeholderTextColor={theme.textPlaceholder}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                  value={deactivateReason}
                  onChangeText={setDeactivateReason}
                />
              </View>
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonCancel, { backgroundColor: theme.backgroundElevated }]}
                onPress={() => setShowDeactivateModal(false)}
              >
                <Text style={[styles.modalButtonText, { color: theme.textPrimary }]}>取消</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonDanger, { backgroundColor: '#FF6B6B' }]}
                onPress={handleDeactivate}
                disabled={deactivating}
              >
                {deactivating ? (
                  <ActivityIndicator size="small" color="#FFF" />
                ) : (
                  <Text style={styles.modalButtonText}>确认注销</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </Screen>
  );
}

const createStyles = (theme: any) =>
  StyleSheet.create({
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: Spacing.lg,
      paddingVertical: Spacing.md,
      backgroundColor: theme.backgroundRoot,
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: theme.textPrimary,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    scrollContent: {
      paddingHorizontal: Spacing.lg,
      paddingBottom: Spacing.xxl * 2,
    },
    // 区块
    section: {
      marginTop: Spacing.lg,
    },
    sectionTitle: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.textSecondary,
      marginBottom: Spacing.sm,
      marginLeft: Spacing.xs,
    },
    // 菜单项
    menuItem: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.backgroundSurface,
      borderRadius: BorderRadius.lg,
      padding: Spacing.md,
      marginBottom: Spacing.sm,
    },
    menuIconContainer: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: `${theme.primary}12`,
      justifyContent: 'center',
      alignItems: 'center',
    },
    menuContent: {
      flex: 1,
      marginLeft: Spacing.md,
    },
    menuTitle: {
      fontSize: 16,
      fontWeight: '500',
      color: theme.textPrimary,
    },
    menuSubtitle: {
      fontSize: 13,
      color: theme.textSecondary,
      marginTop: 2,
    },
    // 退出登录按钮
    logoutButton: {
      backgroundColor: theme.backgroundSurface,
      borderRadius: BorderRadius.lg,
      paddingVertical: Spacing.md + 2,
      alignItems: 'center',
      marginTop: Spacing.xl,
    },
    logoutText: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.primary,
    },
    // 注销账号按钮
    deactivateButton: {
      borderRadius: BorderRadius.lg,
      paddingVertical: Spacing.md,
      alignItems: 'center',
      marginTop: Spacing.md,
    },
    deactivateText: {
      fontSize: 14,
      color: '#FF6B6B',
    },
    // 弹窗
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      paddingHorizontal: Spacing.lg,
    },
    modalContent: {
      borderRadius: BorderRadius.xl,
      padding: Spacing.lg,
    },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: Spacing.lg,
    },
    modalTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: theme.textPrimary,
    },
    modalBody: {
      marginBottom: Spacing.lg,
    },
    formGroup: {
      marginBottom: Spacing.md,
    },
    formLabel: {
      fontSize: 14,
      fontWeight: '500',
      color: theme.textSecondary,
      marginBottom: Spacing.xs,
    },
    input: {
      borderRadius: BorderRadius.md,
      padding: Spacing.md,
      fontSize: 15,
    },
    textArea: {
      height: 100,
      textAlignVertical: 'top',
    },
    warningBox: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      backgroundColor: 'rgba(255, 107, 107, 0.1)',
      borderRadius: BorderRadius.md,
      padding: Spacing.md,
      marginBottom: Spacing.lg,
      gap: Spacing.sm,
    },
    warningText: {
      flex: 1,
      fontSize: 14,
      color: '#FF6B6B',
      lineHeight: 20,
    },
    modalButton: {
      borderRadius: BorderRadius.xl,
      paddingVertical: Spacing.md,
      alignItems: 'center',
    },
    modalButtonText: {
      fontSize: 16,
      fontWeight: '600',
      color: '#FFFFFF',
    },
    modalButtons: {
      flexDirection: 'row',
      gap: Spacing.md,
    },
    modalButtonCancel: {
      flex: 1,
    },
    modalButtonDanger: {
      flex: 1,
    },
  });
