import { StyleSheet } from 'react-native';
import { Spacing, BorderRadius, Theme } from '@/constants/theme';

export const createStyles = (theme: Theme) => {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.backgroundRoot,
    },
    scrollContent: {
      paddingHorizontal: Spacing["2xl"],
      paddingTop: Spacing["2xl"],
      paddingBottom: Spacing["6xl"],
    },
    header: {
      marginBottom: Spacing["2xl"],
    },
    title: {
      fontSize: 28,
      fontWeight: '800',
      color: theme.textPrimary,
    },
    tabsContainer: {
      flexDirection: 'row',
      marginBottom: Spacing.xl,
    },
    tab: {
      paddingVertical: Spacing.sm,
      paddingHorizontal: Spacing.lg,
      marginRight: Spacing.md,
      borderRadius: BorderRadius.full,
      backgroundColor: theme.backgroundTertiary,
    },
    tabActive: {
      backgroundColor: theme.primary,
    },
    tabText: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.textSecondary,
    },
    tabTextActive: {
      color: '#FFFFFF',
    },
    orderCard: {
      backgroundColor: theme.backgroundDefault,
      borderRadius: BorderRadius["2xl"],
      padding: Spacing.xl,
      marginBottom: Spacing.lg,
    },
    orderCardHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: Spacing.md,
    },
    orderTitle: {
      fontSize: 16,
      fontWeight: '700',
      color: theme.textPrimary,
      flex: 1,
      marginRight: Spacing.md,
    },
    orderStatus: {
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.xs,
      borderRadius: BorderRadius.full,
    },
    orderMeta: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    orderMetaItem: {
      flexDirection: 'row',
      alignItems: 'center',
      marginRight: Spacing.lg,
    },
    orderMetaText: {
      fontSize: 13,
      color: theme.textSecondary,
      marginLeft: Spacing.xs,
    },
    emptyContainer: {
      alignItems: 'center',
      paddingVertical: Spacing["4xl"],
    },
    emptyIcon: {
      marginBottom: Spacing.lg,
    },
    emptyText: {
      fontSize: 14,
      color: theme.textMuted,
    },
  });
};
