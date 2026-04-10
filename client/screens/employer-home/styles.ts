import { StyleSheet } from 'react-native';
import { Spacing, BorderRadius, Theme } from '@/constants/theme';

export const createStyles = (theme: Theme) => {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.backgroundRoot,
    },
    scrollContent: {
      paddingHorizontal: Spacing.xl,
      paddingTop: Spacing['2xl'],
      paddingBottom: Spacing['6xl'],
    },
    header: {
      marginBottom: Spacing.xl,
    },
    headerTop: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    greeting: {
      fontSize: 28,
      fontWeight: '800',
      color: theme.textPrimary,
    },
    subGreeting: {
      fontSize: 14,
      color: theme.textSecondary,
      marginTop: Spacing.xs,
    },
    avatar: {
      width: 52,
      height: 52,
      borderRadius: BorderRadius['2xl'],
      justifyContent: 'center',
      alignItems: 'center',
    },
    avatarImage: {
      width: 52,
      height: 52,
      borderRadius: BorderRadius['2xl'],
    },
    publishButton: {
      backgroundColor: theme.primary,
      borderRadius: BorderRadius['2xl'],
      padding: Spacing.xl,
      marginBottom: Spacing.xl,
      flexDirection: 'row',
      alignItems: 'center',
      shadowColor: theme.primary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 12,
      elevation: 8,
    },
    publishIcon: {
      width: 52,
      height: 52,
      borderRadius: BorderRadius.xl,
      backgroundColor: 'rgba(255,255,255,0.2)',
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: Spacing.lg,
    },
    publishContent: {
      flex: 1,
    },
    publishTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: '#FFFFFF',
      marginBottom: Spacing.xs,
    },
    publishDescription: {
      fontSize: 13,
      color: 'rgba(255,255,255,0.8)',
    },
    // Stats
    statsContainer: {
      flexDirection: 'row',
      marginBottom: Spacing.xl,
      gap: Spacing.sm,
    },
    statCard: {
      flex: 1,
      backgroundColor: theme.backgroundDefault,
      borderRadius: BorderRadius.xl,
      padding: Spacing.md,
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 8,
      elevation: 2,
    },
    statIcon: {
      width: 36,
      height: 36,
      borderRadius: BorderRadius.lg,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: Spacing.sm,
    },
    statValue: {
      fontSize: 20,
      fontWeight: '700',
      color: theme.textPrimary,
    },
    statLabel: {
      fontSize: 11,
      color: theme.textSecondary,
      marginTop: Spacing.xs,
    },
    // Section
    sectionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: Spacing.lg,
      marginTop: Spacing.md,
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
    // Quick Actions
    quickActions: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      marginBottom: Spacing.xl,
      gap: Spacing.md,
    },
    quickActionItem: {
      width: '47%',
      backgroundColor: theme.backgroundDefault,
      borderRadius: BorderRadius.xl,
      padding: Spacing.lg,
      flexDirection: 'row',
      alignItems: 'center',
    },
    quickActionIcon: {
      width: 44,
      height: 44,
      borderRadius: BorderRadius.lg,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: Spacing.md,
    },
    quickActionText: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.textPrimary,
    },
    // Spent Card
    spentCard: {
      backgroundColor: theme.backgroundDefault,
      borderRadius: BorderRadius.xl,
      padding: Spacing.xl,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: Spacing.xl,
    },
    spentLeft: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    spentInfo: {
      marginLeft: Spacing.lg,
    },
    spentLabel: {
      fontSize: 13,
      color: theme.textSecondary,
    },
    spentValue: {
      fontSize: 24,
      fontWeight: '700',
      color: theme.textPrimary,
      marginTop: Spacing.xs,
    },
    spentAction: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.primary,
    },
    // Loading
    loadingContainer: {
      paddingVertical: Spacing['3xl'],
      alignItems: 'center',
    },
    // Empty
    emptyContainer: {
      backgroundColor: theme.backgroundDefault,
      borderRadius: BorderRadius['2xl'],
      padding: Spacing['3xl'],
      alignItems: 'center',
    },
    emptyIcon: {
      marginBottom: Spacing.lg,
    },
    emptyText: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.textPrimary,
      marginBottom: Spacing.sm,
    },
    emptyHint: {
      fontSize: 14,
      color: theme.textSecondary,
      marginBottom: Spacing.xl,
    },
    emptyButton: {
      backgroundColor: theme.primary,
      paddingHorizontal: Spacing.xl,
      paddingVertical: Spacing.md,
      borderRadius: BorderRadius.xl,
    },
    emptyButtonText: {
      color: '#FFFFFF',
      fontSize: 14,
      fontWeight: '600',
    },
    // Order Card
    orderCard: {
      backgroundColor: theme.backgroundDefault,
      borderRadius: BorderRadius.xl,
      padding: Spacing.xl,
      marginBottom: Spacing.md,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 8,
      elevation: 2,
    },
    orderCardHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: Spacing.md,
    },
    orderTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.textPrimary,
      flex: 1,
      marginRight: Spacing.md,
    },
    orderStatus: {
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.xs,
      borderRadius: BorderRadius.lg,
    },
    orderStatusText: {
      color: '#FFFFFF',
      fontWeight: '600',
      fontSize: 12,
    },
    orderMeta: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.lg,
      marginBottom: Spacing.sm,
    },
    orderMetaItem: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    orderMetaText: {
      fontSize: 13,
      color: theme.textSecondary,
      marginLeft: Spacing.xs,
      flex: 1,
    },
    orderWorker: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: Spacing.sm,
      paddingTop: Spacing.sm,
      borderTopWidth: 1,
      borderTopColor: theme.border,
    },
    orderWorkerText: {
      fontSize: 13,
      color: theme.success,
      marginLeft: Spacing.xs,
      fontWeight: '500',
    },
  });
};
