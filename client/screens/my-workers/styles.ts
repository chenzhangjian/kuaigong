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
    statsContainer: {
      flexDirection: 'row',
      backgroundColor: theme.backgroundDefault,
      borderRadius: BorderRadius["2xl"],
      padding: Spacing.xl,
      marginBottom: Spacing["2xl"],
    },
    statItem: {
      flex: 1,
      alignItems: 'center',
    },
    statValue: {
      fontSize: 28,
      fontWeight: '800',
      color: theme.primary,
      marginBottom: Spacing.xs,
    },
    statLabel: {
      fontSize: 13,
      color: theme.textSecondary,
    },
    statDivider: {
      width: 1,
      backgroundColor: theme.borderLight,
      marginHorizontal: Spacing.lg,
    },
    workerCard: {
      backgroundColor: theme.backgroundDefault,
      borderRadius: BorderRadius["2xl"],
      padding: Spacing.xl,
      marginBottom: Spacing.lg,
    },
    workerHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: Spacing.lg,
    },
    workerAvatar: {
      width: 56,
      height: 56,
      borderRadius: BorderRadius["2xl"],
      backgroundColor: `${theme.primary}12`,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: Spacing.lg,
    },
    avatarImage: {
      width: 56,
      height: 56,
      borderRadius: BorderRadius["2xl"],
    },
    workerInfo: {
      flex: 1,
    },
    workerName: {
      fontSize: 16,
      fontWeight: '700',
      color: theme.textPrimary,
      marginBottom: Spacing.xs,
    },
    ratingContainer: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    ratingText: {
      fontSize: 13,
      fontWeight: '600',
      color: '#F39C12',
      marginLeft: Spacing.xs,
    },
    orderCount: {
      alignItems: 'flex-end',
    },
    orderCountValue: {
      fontSize: 20,
      fontWeight: '700',
      color: theme.primary,
    },
    orderCountLabel: {
      fontSize: 12,
      color: theme.textMuted,
    },
    skillContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      marginBottom: Spacing.lg,
    },
    skillTag: {
      backgroundColor: `${theme.primary}10`,
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.xs,
      borderRadius: BorderRadius.full,
      marginRight: Spacing.sm,
      marginBottom: Spacing.xs,
    },
    skillText: {
      fontSize: 12,
      color: theme.primary,
      fontWeight: '500',
    },
    workerFooter: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingTop: Spacing.lg,
      borderTopWidth: 1,
      borderTopColor: theme.borderLight,
    },
    lastOrderText: {
      fontSize: 13,
      color: theme.textSecondary,
    },
    contactButton: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: `${theme.primary}10`,
      paddingHorizontal: Spacing.lg,
      paddingVertical: Spacing.sm,
      borderRadius: BorderRadius.full,
    },
    contactText: {
      fontSize: 13,
      fontWeight: '600',
      color: theme.primary,
      marginLeft: Spacing.xs,
    },
    emptyContainer: {
      alignItems: 'center',
      paddingVertical: Spacing["4xl"],
    },
    emptyText: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.textPrimary,
      marginTop: Spacing.lg,
      marginBottom: Spacing.xs,
    },
    emptyHint: {
      fontSize: 14,
      color: theme.textMuted,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingVertical: Spacing["6xl"],
    },
  });
};
