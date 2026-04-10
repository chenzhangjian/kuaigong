import { StyleSheet } from 'react-native';
import { Spacing, BorderRadius, Theme } from '@/constants/theme';

export const createStyles = (theme: Theme) => {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.backgroundRoot,
    },
    // Header
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: Spacing.lg,
      paddingVertical: Spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: theme.borderLight,
    },
    backButton: {
      width: 40,
      height: 40,
      justifyContent: 'center',
      alignItems: 'center',
    },
    headerTitle: {
      fontSize: 17,
      fontWeight: '600',
      color: theme.textPrimary,
    },
    // 步骤指示器
    stepIndicator: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: Spacing.xl,
      paddingHorizontal: Spacing["2xl"],
    },
    stepItem: {
      alignItems: 'center',
    },
    stepCircle: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: theme.backgroundTertiary,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: Spacing.xs,
      borderWidth: 2,
      borderColor: theme.border,
    },
    stepCircleActive: {
      backgroundColor: theme.primary,
      borderColor: theme.primary,
    },
    stepCircleCompleted: {
      backgroundColor: theme.success,
      borderColor: theme.success,
    },
    stepText: {
      fontSize: 12,
      color: theme.textSecondary,
    },
    stepLine: {
      flex: 1,
      height: 2,
      backgroundColor: theme.border,
      marginHorizontal: Spacing.sm,
      marginBottom: Spacing.xl,
    },
    scrollContent: {
      flexGrow: 1,
      paddingHorizontal: Spacing["2xl"],
      paddingTop: Spacing["2xl"],
      paddingBottom: Spacing["5xl"],
    },
    title: {
      fontSize: 24,
      fontWeight: '700',
      color: theme.textPrimary,
      marginBottom: Spacing["2xl"],
    },
    form: {
      marginBottom: Spacing["2xl"],
    },
    hint: {
      fontSize: 14,
      color: theme.textSecondary,
      marginBottom: Spacing.xl,
      lineHeight: 20,
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
    button: {
      backgroundColor: theme.primary,
      borderRadius: BorderRadius.full,
      paddingVertical: Spacing.lg,
      alignItems: 'center',
      marginTop: Spacing.xl,
    },
    buttonText: {
      fontSize: 16,
      fontWeight: '700',
      color: theme.buttonPrimaryText,
    },
    backToLogin: {
      alignItems: 'center',
      marginTop: Spacing["2xl"],
    },
    backToLoginText: {
      fontSize: 14,
      color: theme.primary,
      fontWeight: '600',
    },
  });
};
