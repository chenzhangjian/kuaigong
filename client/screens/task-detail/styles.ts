import { StyleSheet } from 'react-native';
import { Spacing, BorderRadius, Theme } from '@/constants/theme';

export const createStyles = (theme: Theme) => {
  return StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
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
      marginBottom: Spacing.xl,
    },
    title: {
      fontSize: 24,
      fontWeight: '800',
      color: theme.textPrimary,
      marginBottom: Spacing.sm,
    },
    budget: {
      fontSize: 32,
      fontWeight: '800',
      color: theme.primary,
    },
    detailItem: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: Spacing.md,
    },
    detailText: {
      fontSize: 15,
      color: theme.textSecondary,
      marginLeft: Spacing.md,
    },
    section: {
      marginTop: Spacing.xl,
      marginBottom: Spacing.xl,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: theme.textPrimary,
      marginBottom: Spacing.md,
    },
    description: {
      fontSize: 15,
      color: theme.textSecondary,
      lineHeight: 24,
    },
    employerCard: {
      backgroundColor: theme.backgroundDefault,
      borderRadius: BorderRadius["2xl"],
      padding: Spacing.xl,
      marginBottom: Spacing.xl,
    },
    employerInfo: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    employerText: {
      marginLeft: Spacing.lg,
    },
    employerName: {
      fontSize: 16,
      fontWeight: '700',
      color: theme.textPrimary,
    },
    employerRating: {
      fontSize: 14,
      color: theme.textSecondary,
      marginTop: Spacing.xs,
    },
    applyButton: {
      backgroundColor: theme.primary,
      borderRadius: BorderRadius["2xl"],
      paddingVertical: Spacing.xl,
      alignItems: 'center',
      marginTop: Spacing.xl,
      flexDirection: 'row',
      justifyContent: 'center',
      gap: Spacing.md,
    },
    applyButtonText: {
      fontSize: 18,
      fontWeight: '700',
      color: '#FFFFFF',
    },
    viewApplicationsButton: {
      backgroundColor: theme.primary,
      borderRadius: BorderRadius["2xl"],
      paddingVertical: Spacing.xl,
      alignItems: 'center',
      marginTop: Spacing.xl,
      flexDirection: 'row',
      justifyContent: 'center',
      gap: Spacing.md,
    },
    viewApplicationsButtonText: {
      fontSize: 18,
      fontWeight: '700',
      color: '#FFFFFF',
    },
    badge: {
      backgroundColor: '#FFFFFF',
      borderRadius: BorderRadius.full,
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.xs,
      marginLeft: Spacing.sm,
    },
    badgeText: {
      fontSize: 14,
      fontWeight: '700',
      color: theme.primary,
    },
    statusCard: {
      backgroundColor: theme.backgroundDefault,
      borderRadius: BorderRadius["2xl"],
      padding: Spacing.lg,
      marginBottom: Spacing.xl,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    statusRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.md,
    },
    statusText: {
      fontSize: 15,
      fontWeight: '600',
      color: theme.textPrimary,
    },
    applyCountText: {
      fontSize: 14,
      color: theme.primary,
      fontWeight: '600',
    },
    closedMessage: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: Spacing.md,
      marginTop: Spacing.xl,
      padding: Spacing.lg,
      backgroundColor: theme.backgroundElevated,
      borderRadius: BorderRadius["2xl"],
    },
    closedMessageText: {
      fontSize: 15,
      color: theme.textMuted,
    },
  });
};
