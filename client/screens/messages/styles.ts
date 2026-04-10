import { StyleSheet } from 'react-native';
import { Spacing, Theme } from '@/constants/theme';

export const createStyles = (theme: Theme) => {
  return StyleSheet.create({
    container: {
      flex: 1,
      paddingHorizontal: Spacing["2xl"],
      paddingTop: Spacing["2xl"],
    },
    header: {
      marginBottom: Spacing["2xl"],
    },
    title: {
      fontSize: 28,
      fontWeight: '800',
      color: theme.textPrimary,
    },
    emptyContainer: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
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
