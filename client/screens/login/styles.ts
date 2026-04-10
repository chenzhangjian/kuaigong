import { StyleSheet } from 'react-native';
import { Spacing, BorderRadius, Theme } from '@/constants/theme';

export const createStyles = (theme: Theme) => {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.backgroundRoot,
    },
    scrollContent: {
      flexGrow: 1,
      paddingHorizontal: Spacing["2xl"],
      paddingTop: Spacing["4xl"],
      paddingBottom: Spacing["5xl"],
    },
    header: {
      alignItems: 'center',
      marginBottom: Spacing["3xl"],
      marginTop: Spacing["2xl"],
    },
    logo: {
      width: 80,
      height: 80,
      borderRadius: BorderRadius["2xl"],
      marginBottom: Spacing.xl,
    },
    title: {
      fontSize: 28,
      fontWeight: '800',
      color: theme.textPrimary,
      marginBottom: Spacing.sm,
    },
    subtitle: {
      fontSize: 14,
      color: theme.textSecondary,
    },
    // 登录/注册切换
    authModeSwitch: {
      flexDirection: 'row',
      backgroundColor: theme.backgroundTertiary,
      borderRadius: BorderRadius.xl,
      padding: 4,
      marginBottom: Spacing["2xl"],
    },
    authModeButton: {
      flex: 1,
      paddingVertical: Spacing.md,
      borderRadius: BorderRadius.lg,
      alignItems: 'center',
    },
    authModeButtonActive: {
      backgroundColor: theme.primary,
    },
    authModeText: {
      fontSize: 15,
      fontWeight: '600',
      color: theme.textSecondary,
    },
    authModeTextActive: {
      color: '#FFFFFF',
    },
    // 登录方式切换
    loginModeSwitch: {
      flexDirection: 'row',
      marginBottom: Spacing.lg,
      gap: Spacing.md,
    },
    loginModeButton: {
      paddingVertical: Spacing.sm,
      paddingHorizontal: Spacing.lg,
      borderRadius: BorderRadius.full,
      borderWidth: 1,
      borderColor: theme.border,
    },
    loginModeButtonActive: {
      backgroundColor: `${theme.primary}15`,
      borderColor: theme.primary,
    },
    loginModeText: {
      fontSize: 14,
      color: theme.textSecondary,
    },
    loginModeTextActive: {
      color: theme.primary,
      fontWeight: '600',
    },
    form: {
      marginBottom: Spacing["2xl"],
    },
    inputContainer: {
      marginBottom: Spacing.lg,
    },
    label: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.textPrimary,
      marginBottom: Spacing.sm,
    },
    input: {
      backgroundColor: theme.backgroundTertiary,
      borderRadius: BorderRadius.lg,
      padding: Spacing.lg,
      fontSize: 15,
      color: theme.textPrimary,
      borderWidth: 1,
      borderColor: theme.borderLight,
    },
    // 验证码输入行
    codeInputRow: {
      flexDirection: 'row',
      gap: Spacing.sm,
    },
    codeInput: {
      flex: 1,
    },
    sendCodeButton: {
      backgroundColor: theme.primary,
      borderRadius: BorderRadius.lg,
      paddingHorizontal: Spacing.lg,
      justifyContent: 'center',
      alignItems: 'center',
      minWidth: 110,
    },
    sendCodeButtonDisabled: {
      backgroundColor: theme.textMuted,
    },
    sendCodeText: {
      fontSize: 14,
      fontWeight: '600',
      color: '#FFFFFF',
    },
    forgotPassword: {
      alignItems: 'flex-end',
      marginBottom: Spacing.lg,
    },
    forgotPasswordText: {
      fontSize: 14,
      color: theme.primary,
      fontWeight: '600',
    },
    buttonContainer: {
      marginTop: Spacing.xl,
    },
    button: {
      backgroundColor: theme.primary,
      borderRadius: BorderRadius.full,
      paddingVertical: Spacing.lg,
      alignItems: 'center',
      marginBottom: Spacing.lg,
    },
    buttonText: {
      fontSize: 16,
      fontWeight: '700',
      color: theme.buttonPrimaryText,
    },
    switchButton: {
      alignItems: 'center',
    },
    switchText: {
      fontSize: 14,
      color: theme.textSecondary,
    },
    switchTextHighlight: {
      color: theme.primary,
      fontWeight: '600',
    },
    divider: {
      flexDirection: 'row',
      alignItems: 'center',
      marginVertical: Spacing["2xl"],
    },
    dividerLine: {
      flex: 1,
      height: 1,
      backgroundColor: theme.border,
    },
    dividerText: {
      marginHorizontal: Spacing.lg,
      fontSize: 13,
      color: theme.textMuted,
    },
    roleSelectContainer: {
      marginTop: Spacing.lg,
    },
    roleSelectTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.textPrimary,
      marginBottom: Spacing.lg,
      textAlign: 'center',
    },
    roleButtons: {
      flexDirection: 'row',
      gap: Spacing.lg,
    },
    roleButton: {
      flex: 1,
      backgroundColor: theme.backgroundTertiary,
      borderRadius: BorderRadius["2xl"],
      padding: Spacing.xl,
      alignItems: 'center',
      borderWidth: 2,
      borderColor: 'transparent',
    },
    roleButtonActive: {
      borderColor: theme.primary,
      backgroundColor: `${theme.primary}15`,
    },
    roleIcon: {
      width: 56,
      height: 56,
      borderRadius: BorderRadius["2xl"],
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: Spacing.md,
    },
    roleIconActive: {
      backgroundColor: theme.primary,
    },
    roleIconInactive: {
      backgroundColor: `${theme.primary}12`,
    },
    roleTitle: {
      fontSize: 16,
      fontWeight: '700',
      color: theme.textPrimary,
      marginBottom: Spacing.xs,
    },
    roleDescription: {
      fontSize: 12,
      color: theme.textSecondary,
      textAlign: 'center',
    },
    errorText: {
      fontSize: 12,
      color: theme.error,
      marginTop: Spacing.xs,
    },
    // 协议提示
    agreementContainer: {
      alignItems: 'center',
      paddingHorizontal: Spacing.xl,
    },
    agreementText: {
      fontSize: 12,
      color: theme.textSecondary,
      textAlign: 'center',
      lineHeight: 20,
    },
    agreementLink: {
      color: theme.primary,
      fontWeight: '500',
    },
  });
};
