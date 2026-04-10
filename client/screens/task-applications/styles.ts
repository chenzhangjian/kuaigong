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
    taskInfo: {
      backgroundColor: theme.backgroundDefault,
      borderRadius: BorderRadius["2xl"],
      padding: Spacing.xl,
      marginBottom: Spacing["2xl"],
    },
    taskTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: theme.textPrimary,
      marginBottom: Spacing.sm,
    },
    taskBudget: {
      fontSize: 24,
      fontWeight: '800',
      color: theme.primary,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: theme.textPrimary,
      marginBottom: Spacing.lg,
    },
    applicationCard: {
      backgroundColor: theme.backgroundDefault,
      borderRadius: BorderRadius["2xl"],
      padding: Spacing.xl,
      marginBottom: Spacing.lg,
    },
    applicationHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: Spacing.lg,
    },
    avatar: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: `${theme.primary}20`,
      justifyContent: 'center',
      alignItems: 'center',
    },
    avatarImage: {
      width: 48,
      height: 48,
      borderRadius: 24,
    },
    workerInfo: {
      flex: 1,
      marginLeft: Spacing.lg,
    },
    workerName: {
      fontSize: 16,
      fontWeight: '700',
      color: theme.textPrimary,
    },
    workerMeta: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: Spacing.xs,
    },
    workerRating: {
      fontSize: 13,
      color: theme.warning,
      marginLeft: Spacing.xs,
    },
    workerOrders: {
      fontSize: 13,
      color: theme.textSecondary,
      marginLeft: Spacing.md,
    },
    applicationBody: {
      marginBottom: Spacing.lg,
    },
    applicationMessage: {
      fontSize: 14,
      color: theme.textSecondary,
      lineHeight: 20,
      marginBottom: Spacing.md,
    },
    proposedAmount: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    proposedLabel: {
      fontSize: 14,
      color: theme.textSecondary,
    },
    proposedValue: {
      fontSize: 18,
      fontWeight: '700',
      color: theme.primary,
      marginLeft: Spacing.sm,
    },
    skillsContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      marginTop: Spacing.sm,
    },
    skillTag: {
      backgroundColor: `${theme.primary}15`,
      borderRadius: BorderRadius.full,
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.xs,
      marginRight: Spacing.sm,
      marginBottom: Spacing.xs,
    },
    skillText: {
      fontSize: 12,
      color: theme.primary,
    },
    applicationFooter: {
      flexDirection: 'row',
      gap: Spacing.md,
    },
    rejectButton: {
      flex: 1,
      backgroundColor: theme.backgroundElevated,
      borderRadius: BorderRadius.xl,
      paddingVertical: Spacing.lg,
      alignItems: 'center',
    },
    rejectButtonText: {
      fontSize: 15,
      fontWeight: '600',
      color: theme.textSecondary,
    },
    acceptButton: {
      flex: 2,
      backgroundColor: theme.primary,
      borderRadius: BorderRadius.xl,
      paddingVertical: Spacing.lg,
      alignItems: 'center',
    },
    acceptButtonText: {
      fontSize: 15,
      fontWeight: '600',
      color: '#FFFFFF',
    },
    emptyContainer: {
      alignItems: 'center',
      paddingVertical: Spacing["6xl"],
    },
    emptyIcon: {
      marginBottom: Spacing.xl,
    },
    emptyText: {
      fontSize: 16,
      color: theme.textSecondary,
    },
    emptyHint: {
      fontSize: 14,
      color: theme.textMuted,
      marginTop: Spacing.sm,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingVertical: Spacing["6xl"],
    },
  });
};
