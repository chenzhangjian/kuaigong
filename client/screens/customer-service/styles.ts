import { StyleSheet } from 'react-native';
import { Spacing, BorderRadius, Theme } from '@/constants/theme';

export const createStyles = (theme: Theme) => {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.backgroundRoot,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: Spacing.lg,
      paddingVertical: Spacing.md,
      backgroundColor: theme.backgroundElevated,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
    },
    backButton: {
      padding: Spacing.sm,
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: theme.textPrimary,
    },
    clearButton: {
      padding: Spacing.sm,
    },
    clearButtonText: {
      fontSize: 14,
      color: theme.primary,
    },
    messagesContainer: {
      flex: 1,
      paddingHorizontal: Spacing.lg,
    },
    messagesContent: {
      paddingVertical: Spacing.lg,
    },
    messageWrapper: {
      marginBottom: Spacing.md,
    },
    userMessageWrapper: {
      alignItems: 'flex-end',
    },
    botMessageWrapper: {
      alignItems: 'flex-start',
    },
    messageBubble: {
      maxWidth: '80%',
      padding: Spacing.md,
      borderRadius: BorderRadius.lg,
    },
    userMessage: {
      backgroundColor: theme.primary,
    },
    botMessage: {
      backgroundColor: theme.backgroundElevated,
      borderWidth: 1,
      borderColor: theme.border,
    },
    messageText: {
      fontSize: 15,
      lineHeight: 22,
    },
    userMessageText: {
      color: '#FFFFFF',
    },
    botMessageText: {
      color: theme.textPrimary,
    },
    senderInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: Spacing.xs,
      gap: Spacing.xs,
    },
    senderName: {
      fontSize: 12,
      color: theme.textMuted,
    },
    timeText: {
      fontSize: 11,
      color: theme.textMuted,
      marginTop: Spacing.xs,
    },
    typingIndicator: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: Spacing.md,
      gap: Spacing.sm,
    },
    typingText: {
      fontSize: 14,
      color: theme.textMuted,
      fontStyle: 'italic',
    },
    inputContainer: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      paddingHorizontal: Spacing.lg,
      paddingVertical: Spacing.md,
      backgroundColor: theme.backgroundElevated,
      borderTopWidth: 1,
      borderTopColor: theme.border,
      gap: Spacing.md,
    },
    input: {
      flex: 1,
      minHeight: 44,
      maxHeight: 120,
      backgroundColor: theme.backgroundRoot,
      borderRadius: BorderRadius.xl,
      paddingHorizontal: Spacing.lg,
      paddingVertical: Spacing.md,
      fontSize: 15,
      color: theme.textPrimary,
      borderWidth: 1,
      borderColor: theme.border,
    },
    sendButton: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: theme.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    sendButtonDisabled: {
      backgroundColor: theme.textMuted,
    },
    emptyContainer: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: Spacing['6xl'],
    },
    emptyIcon: {
      marginBottom: Spacing.lg,
    },
    emptyTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: theme.textPrimary,
      marginBottom: Spacing.sm,
    },
    emptyText: {
      fontSize: 14,
      color: theme.textMuted,
      textAlign: 'center',
      paddingHorizontal: Spacing['2xl'],
    },
    quickActions: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'center',
      gap: Spacing.sm,
      marginTop: Spacing.xl,
      paddingHorizontal: Spacing.lg,
    },
    quickActionButton: {
      backgroundColor: theme.backgroundElevated,
      borderRadius: BorderRadius.lg,
      paddingHorizontal: Spacing.lg,
      paddingVertical: Spacing.md,
      borderWidth: 1,
      borderColor: theme.border,
    },
    quickActionText: {
      fontSize: 14,
      color: theme.primary,
    },
  });
};
