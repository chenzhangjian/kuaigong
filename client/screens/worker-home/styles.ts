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
    headerTop: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: Spacing.lg,
    },
    greeting: {
      fontSize: 28,
      fontWeight: '800',
      color: theme.textPrimary,
    },
    avatar: {
      width: 48,
      height: 48,
      borderRadius: BorderRadius["2xl"],
    },
    statsContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: Spacing["2xl"],
    },
    statCard: {
      flex: 1,
      backgroundColor: theme.backgroundDefault,
      borderRadius: BorderRadius["2xl"],
      padding: Spacing.lg,
      marginHorizontal: Spacing.xs,
      alignItems: 'center',
    },
    statValue: {
      fontSize: 24,
      fontWeight: '800',
      color: theme.primary,
      marginBottom: Spacing.xs,
    },
    statLabel: {
      fontSize: 12,
      color: theme.textSecondary,
    },
    sectionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: Spacing.lg,
      marginTop: Spacing.xl,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: theme.textPrimary,
    },
    sectionAction: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.primary,
    },
    taskCard: {
      backgroundColor: theme.backgroundDefault,
      borderRadius: BorderRadius["2xl"],
      padding: Spacing.xl,
      marginBottom: Spacing.lg,
    },
    taskCardHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: Spacing.md,
    },
    taskTitle: {
      fontSize: 16,
      fontWeight: '700',
      color: theme.textPrimary,
      flex: 1,
      marginRight: Spacing.md,
    },
    taskBudget: {
      fontSize: 18,
      fontWeight: '800',
      color: theme.primary,
    },
    taskMeta: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: Spacing.md,
    },
    taskMetaItem: {
      flexDirection: 'row',
      alignItems: 'center',
      marginRight: Spacing.lg,
    },
    taskMetaText: {
      fontSize: 13,
      color: theme.textSecondary,
      marginLeft: Spacing.xs,
    },
    taskDescription: {
      fontSize: 14,
      color: theme.textSecondary,
      lineHeight: 20,
    },
    categoryContainer: {
      marginBottom: Spacing["2xl"],
    },
    categoryScroll: {
      flexDirection: 'row',
    },
    categoryItem: {
      alignItems: 'center',
      marginRight: Spacing.lg,
    },
    categoryIcon: {
      width: 56,
      height: 56,
      borderRadius: BorderRadius["2xl"],
      backgroundColor: `${theme.primary}12`,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: Spacing.sm,
    },
    categoryName: {
      fontSize: 13,
      color: theme.textPrimary,
      fontWeight: '600',
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
    searchContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.backgroundTertiary,
      borderRadius: BorderRadius["2xl"],
      paddingHorizontal: Spacing.lg,
      paddingVertical: Spacing.md,
      marginBottom: Spacing.xl,
    },
    searchInput: {
      flex: 1,
      marginLeft: Spacing.sm,
      fontSize: 15,
      color: theme.textPrimary,
    },
  });
};
