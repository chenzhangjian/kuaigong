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
      paddingTop: Spacing["3xl"],
      paddingBottom: Spacing["6xl"],
    },
    profileHeader: {
      alignItems: 'center',
      marginBottom: Spacing["2xl"],
    },
    avatarContainer: {
      marginBottom: Spacing.lg,
    },
    avatar: {
      width: 80,
      height: 80,
      borderRadius: BorderRadius["2xl"],
    },
    userName: {
      fontSize: 24,
      fontWeight: '700',
      color: theme.textPrimary,
      marginBottom: Spacing.xs,
    },
    userPhone: {
      fontSize: 14,
      color: theme.textSecondary,
      marginBottom: Spacing.md,
    },
    userTypeBadge: {
      backgroundColor: `${theme.primary}15`,
      paddingHorizontal: Spacing.lg,
      paddingVertical: Spacing.xs,
      borderRadius: BorderRadius.full,
    },
    userTypeText: {
      fontSize: 13,
      fontWeight: '600',
      color: theme.primary,
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
      fontSize: 24,
      fontWeight: '800',
      color: theme.primary,
      marginBottom: Spacing.xs,
    },
    statLabel: {
      fontSize: 12,
      color: theme.textSecondary,
    },
    statDivider: {
      width: 1,
      backgroundColor: theme.border,
      marginHorizontal: Spacing.lg,
    },
    menuContainer: {
      marginBottom: Spacing["2xl"],
    },
    menuItem: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.backgroundDefault,
      borderRadius: BorderRadius["2xl"],
      padding: Spacing.lg,
      marginBottom: Spacing.md,
    },
    menuIconContainer: {
      width: 40,
      height: 40,
      borderRadius: BorderRadius.lg,
      backgroundColor: `${theme.primary}12`,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: Spacing.lg,
    },
    menuContent: {
      flex: 1,
    },
    menuTitle: {
      fontSize: 15,
      fontWeight: '600',
      color: theme.textPrimary,
    },
    menuSubtitle: {
      fontSize: 12,
      color: theme.textSecondary,
      marginTop: Spacing.xs,
    },
    logoutButton: {
      backgroundColor: theme.error,
      borderRadius: BorderRadius["2xl"],
      paddingVertical: Spacing.lg,
      alignItems: 'center',
    },
    logoutButtonText: {
      fontSize: 16,
      fontWeight: '600',
      color: '#FFFFFF',
    },
  });
};
