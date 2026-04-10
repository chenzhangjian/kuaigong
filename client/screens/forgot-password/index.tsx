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
import { Screen } from '@/components/Screen';
import { useTheme } from '@/hooks/useTheme';
import { useSafeRouter } from '@/hooks/useSafeRouter';
import { createStyles } from './styles';
import api from '@/utils/api';

type Step = 'phone' | 'verify' | 'reset';

export default function ForgotPasswordScreen() {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const router = useSafeRouter();

  // 步骤状态
  const [step, setStep] = useState<Step>('phone');

  // 表单数据
  const [phone, setPhone] = useState('');
  const [verifyCode, setVerifyCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

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
      const result = await api.sendVerificationCode(phone, 'reset_password');

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
      Alert.alert('发送失败', error.message || '请稍后重试');
    } finally {
      setSendingCode(false);
    }
  };

  // 下一步（验证验证码）
  const handleVerifyCode = async () => {
    if (!verifyCode.trim() || verifyCode.length !== 6) {
      Alert.alert('提示', '请输入6位验证码');
      return;
    }

    setLoading(true);
    try {
      // 先验证验证码是否正确
      await api.verifyResetCode(phone, verifyCode);
      setStep('reset');
    } catch (error: any) {
      Alert.alert('验证失败', error.message || '验证码错误或已过期');
    } finally {
      setLoading(false);
    }
  };

  // 重置密码
  const handleResetPassword = async () => {
    if (!newPassword.trim()) {
      Alert.alert('提示', '请输入新密码');
      return;
    }
    if (newPassword.length < 6) {
      Alert.alert('提示', '密码至少6位');
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert('提示', '两次密码不一致');
      return;
    }

    setLoading(true);
    try {
      await api.resetPassword(phone, verifyCode, newPassword);
      Alert.alert('成功', '密码重置成功，请重新登录', [
        {
          text: '确定',
          onPress: () => router.replace('/login'),
        },
      ]);
    } catch (error: any) {
      Alert.alert('重置失败', error.message || '请重试');
    } finally {
      setLoading(false);
    }
  };

  // 步骤标题
  const getStepTitle = () => {
    switch (step) {
      case 'phone':
        return '输入手机号';
      case 'verify':
        return '验证身份';
      case 'reset':
        return '重置密码';
    }
  };

  return (
    <Screen backgroundColor={theme.backgroundRoot} statusBarStyle="dark">
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <FontAwesome6 name="arrow-left" size={20} color={theme.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>找回密码</Text>
          <View style={styles.backButton} />
        </View>

        {/* 步骤指示器 */}
        <View style={styles.stepIndicator}>
          <View style={styles.stepItem}>
            <View style={[styles.stepCircle, step !== 'phone' && styles.stepCircleActive]}>
              <FontAwesome6
                name="phone"
                size={14}
                color={step !== 'phone' ? '#FFFFFF' : theme.textSecondary}
              />
            </View>
            <Text style={styles.stepText}>输入手机</Text>
          </View>
          <View style={styles.stepLine} />
          <View style={styles.stepItem}>
            <View
              style={[
                styles.stepCircle,
                step === 'verify' && styles.stepCircleActive,
                step === 'reset' && styles.stepCircleCompleted,
              ]}
            >
              <FontAwesome6
                name="shield-halved"
                size={14}
                color={step === 'verify' || step === 'reset' ? '#FFFFFF' : theme.textSecondary}
              />
            </View>
            <Text style={styles.stepText}>验证身份</Text>
          </View>
          <View style={styles.stepLine} />
          <View style={styles.stepItem}>
            <View style={[styles.stepCircle, step === 'reset' && styles.stepCircleActive]}>
              <FontAwesome6
                name="key"
                size={14}
                color={step === 'reset' ? '#FFFFFF' : theme.textSecondary}
              />
            </View>
            <Text style={styles.stepText}>重置密码</Text>
          </View>
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* 标题 */}
          <Text style={styles.title}>{getStepTitle()}</Text>

          {/* Step 1: 手机号 */}
          {step === 'phone' && (
            <View style={styles.form}>
              <View style={styles.inputContainer}>
                <Text style={styles.label}>手机号</Text>
                <TextInput
                  style={styles.input}
                  placeholder="请输入注册时的手机号"
                  placeholderTextColor={theme.textMuted}
                  value={phone}
                  onChangeText={setPhone}
                  keyboardType="phone-pad"
                  maxLength={11}
                />
              </View>

              <TouchableOpacity
                style={styles.button}
                onPress={() => {
                  if (!phone.trim()) {
                    Alert.alert('提示', '请输入手机号');
                    return;
                  }
                  const phoneRegex = /^1[3-9]\d{9}$/;
                  if (!phoneRegex.test(phone)) {
                    Alert.alert('提示', '请输入有效的手机号');
                    return;
                  }
                  setStep('verify');
                }}
              >
                <Text style={styles.buttonText}>下一步</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Step 2: 验证码 */}
          {step === 'verify' && (
            <View style={styles.form}>
              <Text style={styles.hint}>我们将向 {phone} 发送验证码</Text>

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

              <TouchableOpacity style={styles.button} onPress={handleVerifyCode} disabled={loading}>
                {loading ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.buttonText}>验证</Text>
                )}
              </TouchableOpacity>
            </View>
          )}

          {/* Step 3: 重置密码 */}
          {step === 'reset' && (
            <View style={styles.form}>
              <View style={styles.inputContainer}>
                <Text style={styles.label}>新密码</Text>
                <TextInput
                  style={styles.input}
                  placeholder="请输入新密码（至少6位）"
                  placeholderTextColor={theme.textMuted}
                  value={newPassword}
                  onChangeText={setNewPassword}
                  secureTextEntry
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>确认密码</Text>
                <TextInput
                  style={styles.input}
                  placeholder="请再次输入新密码"
                  placeholderTextColor={theme.textMuted}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry
                />
              </View>

              <TouchableOpacity style={styles.button} onPress={handleResetPassword} disabled={loading}>
                {loading ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.buttonText}>重置密码</Text>
                )}
              </TouchableOpacity>
            </View>
          )}

          {/* 返回登录 */}
          <TouchableOpacity style={styles.backToLogin} onPress={() => router.replace('/login')}>
            <Text style={styles.backToLoginText}>想起密码了？返回登录</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}
