import { StyleSheet } from 'react-native';
import { Spacing, BorderRadius, Theme } from '@/constants/theme';

export const createStyles = (theme: Theme) => {
  return StyleSheet.create({
    scrollContent: {
      paddingHorizontal: Spacing["2xl"],
      paddingTop: Spacing["2xl"],
      paddingBottom: Spacing["6xl"],
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: Spacing["2xl"],
    },
    headerTitle: {
      fontSize: 20,
      fontWeight: '700',
      color: theme.textPrimary,
    },
    form: {
      marginTop: Spacing.xl,
    },
    inputContainer: {
      marginBottom: Spacing.xl,
    },
    label: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.textPrimary,
      marginBottom: Spacing.sm,
    },
    required: {
      color: '#E74C3C',
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
    textArea: {
      height: 100,
      textAlignVertical: 'top',
    },
    charCount: {
      fontSize: 12,
      color: theme.textMuted,
      textAlign: 'right',
      marginTop: Spacing.xs,
    },
    pickerInput: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.backgroundTertiary,
      borderRadius: BorderRadius.lg,
      padding: Spacing.lg,
      borderWidth: 1,
      borderColor: theme.borderLight,
    },
    pickerText: {
      flex: 1,
      fontSize: 15,
      color: theme.textPrimary,
      marginHorizontal: Spacing.sm,
    },
    locationHint: {
      fontSize: 12,
      color: theme.success,
      marginTop: Spacing.xs,
    },
    budgetInput: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.backgroundTertiary,
      borderRadius: BorderRadius.lg,
      padding: Spacing.lg,
      borderWidth: 1,
      borderColor: theme.borderLight,
    },
    currencySymbol: {
      fontSize: 18,
      fontWeight: '600',
      color: theme.textPrimary,
      marginRight: Spacing.sm,
    },
    budgetTextInput: {
      flex: 1,
      fontSize: 15,
      color: theme.textPrimary,
      padding: 0,
    },
    budgetRangeContainer: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    budgetRangeInput: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.backgroundTertiary,
      borderRadius: BorderRadius.lg,
      padding: Spacing.lg,
      borderWidth: 1,
      borderColor: theme.borderLight,
    },
    rangeSeparator: {
      fontSize: 16,
      color: theme.textMuted,
      marginHorizontal: Spacing.sm,
    },
    negotiableHint: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: `${theme.primary}10`,
      borderRadius: BorderRadius.lg,
      padding: Spacing.lg,
    },
    negotiableHintText: {
      fontSize: 14,
      color: theme.textSecondary,
      marginLeft: Spacing.sm,
    },
    publishButton: {
      backgroundColor: theme.primary,
      borderRadius: BorderRadius["2xl"],
      paddingVertical: Spacing.xl,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: Spacing["2xl"],
    },
    publishButtonDisabled: {
      opacity: 0.7,
    },
    publishButtonText: {
      fontSize: 18,
      fontWeight: '700',
      color: '#FFFFFF',
    },
    // Modal styles
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.5)',
      justifyContent: 'flex-end',
    },
    modalContent: {
      backgroundColor: theme.backgroundDefault,
      borderTopLeftRadius: BorderRadius["2xl"],
      borderTopRightRadius: BorderRadius["2xl"],
      maxHeight: '70%',
    },
    modalHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: Spacing.xl,
      borderBottomWidth: 1,
      borderBottomColor: theme.borderLight,
    },
    modalTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: theme.textPrimary,
    },
    optionsList: {
      padding: Spacing.lg,
    },
    optionItem: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: Spacing.lg,
      borderRadius: BorderRadius.lg,
      marginBottom: Spacing.sm,
    },
    optionItemSelected: {
      backgroundColor: `${theme.primary}10`,
    },
    optionText: {
      fontSize: 16,
      color: theme.textPrimary,
    },
    optionTextSelected: {
      color: theme.primary,
      fontWeight: '600',
    },
    optionContent: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    urgencyDot: {
      width: 10,
      height: 10,
      borderRadius: 5,
      marginRight: Spacing.sm,
    },
  });
};
