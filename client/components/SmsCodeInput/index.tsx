/**
 * 短信验证码输入组件
 * 可复用的验证码发送和输入组件
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { useTheme } from '@/hooks/useTheme';

// 验证码类型
type CodeType = 'login' | 'register' | 'reset_password' | 'bind_phone' | 'bind_bank';

interface SmsCodeInputProps {
  // 手机号
  phone: string;
  // 验证码类型
  type: CodeType;
  // 验证码值
  value: string;
  // 值变化回调
  onChangeText: (code: string) => void;
  // 发送成功回调
  onSendSuccess?: (code?: string) => void;
  // 发送失败回调
  onSendError?: (error: string) => void;
  // 是否禁用发送按钮
  disabled?: boolean;
  // 输入框占位文字
  placeholder?: string;
  // 按钮文字
  buttonText?: string;
  // 自定义样式
  style?: any;
  // 输入框样式
  inputStyle?: any;
  // 按钮样式
  buttonStyle?: any;
}

export function SmsCodeInput({
  phone,
  type,
  value,
  onChangeText,
  onSendSuccess,
  onSendError,
  disabled = false,
  placeholder = '请输入验证码',
  buttonText = '获取验证码',
  style,
  inputStyle,
  buttonStyle,
}: SmsCodeInputProps) {
  const { theme } = useTheme();
  const styles = createStyles(theme);

  const [sending, setSending] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // 清理定时器
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  // 发送验证码
  const handleSendCode = async () => {
    // 验证手机号
    if (!phone || !/^1[3-9]\d{9}$/.test(phone)) {
      onSendError?.('请输入有效的手机号');
      return;
    }

    if (countdown > 0 || sending || disabled) return;

    try {
      setSending(true);

      const response = await fetch(
        `${process.env.EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/auth/send-code`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phone, type }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '发送失败');
      }

      // 发送成功，开始倒计时
      setCountdown(60);
      timerRef.current = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            if (timerRef.current) {
              clearInterval(timerRef.current);
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      onSendSuccess?.(data.code);
    } catch (error: any) {
      onSendError?.(error.message || '发送失败，请稍后重试');
    } finally {
      setSending(false);
    }
  };

  // 按钮是否禁用
  const isButtonDisabled = countdown > 0 || sending || disabled;

  return (
    <View style={[styles.container, style]}>
      <TextInput
        style={[styles.input, inputStyle]}
        placeholder={placeholder}
        placeholderTextColor={theme.textMuted}
        value={value}
        onChangeText={onChangeText}
        keyboardType="number-pad"
        maxLength={6}
      />
      <TouchableOpacity
        style={[
          styles.button,
          isButtonDisabled && styles.buttonDisabled,
          buttonStyle,
        ]}
        onPress={handleSendCode}
        disabled={isButtonDisabled}
        activeOpacity={0.7}
      >
        {sending ? (
          <ActivityIndicator size="small" color={theme.primary} />
        ) : (
          <Text style={[styles.buttonText, isButtonDisabled && styles.buttonTextDisabled]}>
            {countdown > 0 ? `${countdown}s` : buttonText}
          </Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

const createStyles = (theme: any) =>
  StyleSheet.create({
    container: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    input: {
      flex: 1,
      height: 48,
      backgroundColor: theme.backgroundElevated,
      borderRadius: 12,
      paddingHorizontal: 16,
      fontSize: 16,
      color: theme.text,
      borderWidth: 1,
      borderColor: theme.border,
    },
    button: {
      paddingHorizontal: 16,
      height: 48,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: `${theme.primary}15`,
      borderRadius: 12,
      minWidth: 100,
    },
    buttonDisabled: {
      backgroundColor: theme.backgroundElevated,
    },
    buttonText: {
      color: theme.primary,
      fontSize: 14,
      fontWeight: '600',
    },
    buttonTextDisabled: {
      color: theme.textMuted,
    },
  });

export default SmsCodeInput;
