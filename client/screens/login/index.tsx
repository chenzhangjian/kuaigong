import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FontAwesome6 } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Screen } from '@/components/Screen';
import { useTheme } from '@/hooks/useTheme';
import { useSafeRouter } from '@/hooks/useSafeRouter';
import { createStyles } from './styles';
import api from '@/utils/api';

type LoginMode = 'password' | 'code';
type AuthMode = 'login' | 'register';

export default function LoginScreen() {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const router = useSafeRouter();

  // 模式状态
  const [authMode, setAuthMode] = useState<AuthMode>('login');
  const [loginMode, setLoginMode] = useState<LoginMode>('password');

  // 表单数据
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [verifyCode, setVerifyCode] = useState('');
  const [userType, setUserType] = useState<'worker' | 'employer'>('worker');

  // UI 状态
  const [loading, setLoading] = useState(false);
  const [sendingCode, setSendingCode] = useState(false);
  const [countdown, setCountdown] = useState(0);

  // 倒计时 ref
  const countdownRef = useRef<NodeJS.Timeout | null>(null);

  // 清理倒计时
  useEffect(() => {
    return () => {
      if (countdownRef.current) {
        clearInterval(countdownRef.current);
      }
    };
  }, []);

  // 发送验证码
  const handleSendCode = async () => {
    if (!phone.trim()) {
      Alert.alert('提示', '请输入手机号');
      return;
    }

    const phoneRegex = /^1[3-9]\d{9}$/;
    if (!phoneRegex.test(phone)) {
      Alert.alert('提示', '请输入有效的手机号');
      return;
    }

    try {
      setSendingCode(true);

      // 根据当前模式决定验证码类型
      const codeType = authMode === 'login' ? 'login' : 'register';

      const result = await api.sendVerificationCode(phone, codeType);

      if (result.success !== false) {
        Alert.alert('成功', '验证码已发送');
      }

      // 开始倒计时
      setCountdown(60);
      countdownRef.current = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            if (countdownRef.current) {
              clearInterval(countdownRef.current);
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (error: any) {
      const errorMsg = error.message || '请稍后重试';
      // 针对性提示
      if (errorMsg.includes('未注册')) {
        Alert.alert(
          '提示',
          '该手机号未注册，请先注册账号',
          [
            { text: '取消', style: 'cancel' },
            { text: '去注册', onPress: () => handleAuthModeSwitch('register') },
          ]
        );
      } else if (errorMsg.includes('已注册')) {
        Alert.alert(
          '提示',
          '该手机号已注册，请直接登录',
          [
            { text: '取消', style: 'cancel' },
            { text: '去登录', onPress: () => handleAuthModeSwitch('login') },
          ]
        );
      } else {
        Alert.alert('发送失败', errorMsg);
      }
    } finally {
      setSendingCode(false);
    }
  };

  // 密码登录
  const handlePasswordLogin = async () => {
    if (!phone.trim()) {
      Alert.alert('提示', '请输入手机号');
      return;
    }
    if (!password.trim()) {
      Alert.alert('提示', '请输入密码');
      return;
    }

    setLoading(true);
    try {
      const { user, token } = await api.login(phone, password);
      await AsyncStorage.setItem('token', token);
      await AsyncStorage.setItem('userType', user.userType);
      api.setToken(token);
      router.replace('/(tabs)');
    } catch (error: any) {
      Alert.alert('登录失败', error.message || '请检查手机号和密码');
    } finally {
      setLoading(false);
    }
  };

  // 验证码登录
  const handleCodeLogin = async () => {
    if (!phone.trim()) {
      Alert.alert('提示', '请输入手机号');
      return;
    }
    if (!verifyCode.trim() || verifyCode.length !== 6) {
      Alert.alert('提示', '请输入6位验证码');
      return;
    }

    setLoading(true);
    try {
      const { user, token } = await api.loginWithCode(phone, verifyCode);
      await AsyncStorage.setItem('token', token);
      await AsyncStorage.setItem('userType', user.userType);
      api.setToken(token);
      router.replace('/(tabs)');
    } catch (error: any) {
      const errorMsg = error.message || '验证码错误或已过期';
      if (errorMsg.includes('不存在')) {
        Alert.alert(
          '提示',
          '该手机号未注册，请先注册账号',
          [
            { text: '取消', style: 'cancel' },
            { text: '去注册', onPress: () => handleAuthModeSwitch('register') },
          ]
        );
      } else {
        Alert.alert('登录失败', errorMsg);
      }
    } finally {
      setLoading(false);
    }
  };

  // 密码注册
  const handlePasswordRegister = async () => {
    if (!phone.trim()) {
      Alert.alert('提示', '请输入手机号');
      return;
    }
    if (!password.trim()) {
      Alert.alert('提示', '请输入密码');
      return;
    }
    if (password.length < 6) {
      Alert.alert('提示', '密码至少6位');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('提示', '两次密码不一致');
      return;
    }

    setLoading(true);
    try {
      const { user, token } = await api.register(phone, password, userType);
      await AsyncStorage.setItem('token', token);
      await AsyncStorage.setItem('userType', user.userType);
      api.setToken(token);
      router.replace('/(tabs)');
    } catch (error: any) {
      Alert.alert('注册失败', error.message || '请重试');
    } finally {
      setLoading(false);
    }
  };

  // 验证码注册
  const handleCodeRegister = async () => {
    if (!phone.trim()) {
      Alert.alert('提示', '请输入手机号');
      return;
    }
    if (!verifyCode.trim() || verifyCode.length !== 6) {
      Alert.alert('提示', '请输入6位验证码');
      return;
    }
    if (!password.trim()) {
      Alert.alert('提示', '请输入密码');
      return;
    }
    if (password.length < 6) {
      Alert.alert('提示', '密码至少6位');
      return;
    }

    setLoading(true);
    try {
      const { user, token } = await api.registerWithCode(phone, verifyCode, password, userType);
      await AsyncStorage.setItem('token', token);
      await AsyncStorage.setItem('userType', user.userType);
      api.setToken(token);
      router.replace('/(tabs)');
    } catch (error: any) {
      Alert.alert('注册失败', error.message || '验证码错误或已过期');
    } finally {
      setLoading(false);
    }
  };

  // 提交表单
  const handleSubmit = () => {
    if (authMode === 'login') {
      if (loginMode === 'password') {
        handlePasswordLogin();
      } else {
        handleCodeLogin();
      }
    } else {
      if (loginMode === 'password') {
        handlePasswordRegister();
      } else {
        handleCodeRegister();
      }
    }
  };

  // 切换登录/注册模式时重置部分状态
  const handleAuthModeSwitch = (mode: AuthMode) => {
    setAuthMode(mode);
    setVerifyCode('');
    setCountdown(0);
    if (countdownRef.current) {
      clearInterval(countdownRef.current);
    }
  };

  return (
    <Screen backgroundColor={theme.backgroundRoot} statusBarStyle="dark">
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={[styles.logo, { backgroundColor: `${theme.primary}20` }]}>
              <FontAwesome6 name="briefcase" size={40} color={theme.primary} />
            </View>
            <Text style={styles.title}>快工</Text>
            <Text style={styles.subtitle}>快速匹配，即时用工</Text>
          </View>

          {/* 登录/注册切换 */}
          <View style={styles.authModeSwitch}>
            <TouchableOpacity
              style={[styles.authModeButton, authMode === 'login' && styles.authModeButtonActive]}
              onPress={() => handleAuthModeSwitch('login')}
            >
              <Text style={[styles.authModeText, authMode === 'login' && styles.authModeTextActive]}>
                登录
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.authModeButton, authMode === 'register' && styles.authModeButtonActive]}
              onPress={() => handleAuthModeSwitch('register')}
            >
              <Text style={[styles.authModeText, authMode === 'register' && styles.authModeTextActive]}>
                注册
              </Text>
            </TouchableOpacity>
          </View>

          {/* Form */}
          <View style={styles.form}>
            {/* 登录方式切换（仅登录模式显示） */}
            {authMode === 'login' && (
              <View style={styles.loginModeSwitch}>
                <TouchableOpacity
                  style={[styles.loginModeButton, loginMode === 'password' && styles.loginModeButtonActive]}
                  onPress={() => setLoginMode('password')}
                >
                  <Text style={[styles.loginModeText, loginMode === 'password' && styles.loginModeTextActive]}>
                    密码登录
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.loginModeButton, loginMode === 'code' && styles.loginModeButtonActive]}
                  onPress={() => setLoginMode('code')}
                >
                  <Text style={[styles.loginModeText, loginMode === 'code' && styles.loginModeTextActive]}>
                    验证码登录
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {/* 手机号 */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>手机号</Text>
              <TextInput
                style={styles.input}
                placeholder="请输入手机号"
                placeholderTextColor={theme.textMuted}
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
                maxLength={11}
              />
            </View>

            {/* 验证码输入 */}
            {loginMode === 'code' && (
              <View style={styles.inputContainer}>
                <Text style={styles.label}>验证码</Text>
                <View style={styles.codeInputRow}>
                  <TextInput
                    style={[styles.input, styles.codeInput]}
                    placeholder="请输入验证码"
                    placeholderTextColor={theme.textMuted}
                    value={verifyCode}
                    onChangeText={setVerifyCode}
                    keyboardType="number-pad"
                    maxLength={6}
                  />
                  <TouchableOpacity
                    style={[styles.sendCodeButton, (countdown > 0 || sendingCode) && styles.sendCodeButtonDisabled]}
                    onPress={handleSendCode}
                    disabled={countdown > 0 || sendingCode}
                  >
                    {sendingCode ? (
                      <ActivityIndicator size="small" color={theme.primary} />
                    ) : (
                      <Text style={styles.sendCodeText}>
                        {countdown > 0 ? `${countdown}s` : '获取验证码'}
                      </Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* 密码 */}
            {(loginMode === 'password' || authMode === 'register') && (
              <View style={styles.inputContainer}>
                <Text style={styles.label}>密码</Text>
                <TextInput
                  style={styles.input}
                  placeholder={loginMode === 'code' && authMode === 'register' ? '请设置密码' : '请输入密码'}
                  placeholderTextColor={theme.textMuted}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                />
              </View>
            )}

            {/* 确认密码（仅密码注册模式） */}
            {authMode === 'register' && loginMode === 'password' && (
              <View style={styles.inputContainer}>
                <Text style={styles.label}>确认密码</Text>
                <TextInput
                  style={styles.input}
                  placeholder="请再次输入密码"
                  placeholderTextColor={theme.textMuted}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry
                />
              </View>
            )}

            {/* 角色选择（仅注册模式） */}
            {authMode === 'register' && (
              <View style={styles.roleSelectContainer}>
                <Text style={styles.roleSelectTitle}>选择您的身份</Text>
                <View style={styles.roleButtons}>
                  <TouchableOpacity
                    style={[
                      styles.roleButton,
                      userType === 'worker' && styles.roleButtonActive,
                    ]}
                    onPress={() => setUserType('worker')}
                  >
                    <View
                      style={[
                        styles.roleIcon,
                        userType === 'worker' ? styles.roleIconActive : styles.roleIconInactive,
                      ]}
                    >
                      <FontAwesome6
                        name="user-tie"
                        size={24}
                        color={userType === 'worker' ? '#FFFFFF' : theme.primary}
                      />
                    </View>
                    <Text style={styles.roleTitle}>我是工人</Text>
                    <Text style={styles.roleDescription}>提供服务，接单赚钱</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.roleButton,
                      userType === 'employer' && styles.roleButtonActive,
                    ]}
                    onPress={() => setUserType('employer')}
                  >
                    <View
                      style={[
                        styles.roleIcon,
                        userType === 'employer' ? styles.roleIconActive : styles.roleIconInactive,
                      ]}
                    >
                      <FontAwesome6
                        name="building"
                        size={24}
                        color={userType === 'employer' ? '#FFFFFF' : theme.primary}
                      />
                    </View>
                    <Text style={styles.roleTitle}>我是雇主</Text>
                    <Text style={styles.roleDescription}>发布任务，找人干活</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* 忘记密码 */}
            {authMode === 'login' && (
              <View style={styles.forgotPassword}>
                <TouchableOpacity onPress={() => router.push('/forgot-password')}>
                  <Text style={styles.forgotPasswordText}>忘记密码？</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* 提交按钮 */}
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={styles.button}
                onPress={handleSubmit}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.buttonText}>
                    {authMode === 'login' ? '登录' : '注册'}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>

          {/* 协议提示 */}
          <View style={styles.agreementContainer}>
            <Text style={styles.agreementText}>
              {authMode === 'login' ? '登录' : '注册'}即表示您已同意
              <Text style={styles.agreementLink} onPress={() => router.push('/user-agreement')}>
                《用户协议》
              </Text>
              和
              <Text style={styles.agreementLink} onPress={() => router.push('/privacy-policy')}>
                《隐私政策》
              </Text>
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}
