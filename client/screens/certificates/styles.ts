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
    addButton: {
      padding: Spacing.sm,
    },
    scrollContent: {
      padding: Spacing.lg,
    },
    emptyContainer: {
      alignItems: 'center',
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
    certificateCard: {
      backgroundColor: theme.backgroundElevated,
      borderRadius: BorderRadius.lg,
      padding: Spacing.lg,
      marginBottom: Spacing.md,
    },
    certificateHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: Spacing.md,
    },
    certificateName: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.textPrimary,
      flex: 1,
      marginRight: Spacing.sm,
    },
    statusBadge: {
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.xs,
      borderRadius: BorderRadius.xl,
    },
    statusPending: {
      backgroundColor: `${theme.warning}20`,
    },
    statusVerified: {
      backgroundColor: `${theme.success}20`,
    },
    statusRejected: {
      backgroundColor: `${theme.error}20`,
    },
    statusText: {
      fontSize: 12,
      fontWeight: '500',
    },
    statusPendingText: {
      color: theme.warning,
    },
    statusVerifiedText: {
      color: theme.success,
    },
    statusRejectedText: {
      color: theme.error,
    },
    certificateImage: {
      width: '100%',
      height: 150,
      borderRadius: BorderRadius.md,
      marginBottom: Spacing.md,
    },
    certificateInfo: {
      gap: Spacing.xs,
    },
    infoRow: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    infoLabel: {
      fontSize: 13,
      color: theme.textMuted,
      width: 80,
    },
    infoValue: {
      fontSize: 14,
      color: theme.textPrimary,
      flex: 1,
    },
    rejectReason: {
      marginTop: Spacing.sm,
      padding: Spacing.md,
      backgroundColor: `${theme.error}10`,
      borderRadius: BorderRadius.md,
      borderLeftWidth: 3,
      borderLeftColor: theme.error,
    },
    rejectReasonText: {
      fontSize: 13,
      color: theme.error,
    },
    certificateActions: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      gap: Spacing.md,
      marginTop: Spacing.md,
      paddingTop: Spacing.md,
      borderTopWidth: 1,
      borderTopColor: theme.border,
    },
    actionButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.xs,
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.sm,
      borderRadius: BorderRadius.md,
    },
    editButton: {
      backgroundColor: `${theme.primary}10`,
    },
    deleteButton: {
      backgroundColor: `${theme.error}10`,
    },
    actionButtonText: {
      fontSize: 14,
    },
    editButtonText: {
      color: theme.primary,
    },
    deleteButtonText: {
      color: theme.error,
    },
    // Modal styles
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.5)',
      justifyContent: 'flex-end',
    },
    modalContent: {
      backgroundColor: theme.backgroundElevated,
      borderTopLeftRadius: BorderRadius.xl,
      borderTopRightRadius: BorderRadius.xl,
      maxHeight: '90%',
    },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: Spacing.lg,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
    },
    modalTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: theme.textPrimary,
    },
    modalBody: {
      padding: Spacing.lg,
    },
    formGroup: {
      marginBottom: Spacing.lg,
    },
    formLabel: {
      fontSize: 14,
      fontWeight: '500',
      color: theme.textPrimary,
      marginBottom: Spacing.sm,
    },
    formInput: {
      backgroundColor: theme.backgroundRoot,
      borderRadius: BorderRadius.lg,
      paddingHorizontal: Spacing.lg,
      paddingVertical: Spacing.md,
      fontSize: 15,
      color: theme.textPrimary,
      borderWidth: 1,
      borderColor: theme.border,
    },
    imagePicker: {
      backgroundColor: theme.backgroundRoot,
      borderRadius: BorderRadius.lg,
      borderWidth: 1,
      borderColor: theme.border,
      borderStyle: 'dashed',
      height: 150,
      justifyContent: 'center',
      alignItems: 'center',
      overflow: 'hidden',
    },
    imagePickerContent: {
      alignItems: 'center',
    },
    imagePickerText: {
      fontSize: 14,
      color: theme.textMuted,
      marginTop: Spacing.sm,
    },
    previewImage: {
      width: '100%',
      height: '100%',
      resizeMode: 'cover',
    },
    modalFooter: {
      flexDirection: 'row',
      gap: Spacing.md,
      padding: Spacing.lg,
      borderTopWidth: 1,
      borderTopColor: theme.border,
    },
    cancelButton: {
      flex: 1,
      paddingVertical: Spacing.lg,
      borderRadius: BorderRadius.lg,
      alignItems: 'center',
      backgroundColor: theme.backgroundRoot,
      borderWidth: 1,
      borderColor: theme.border,
    },
    cancelButtonText: {
      fontSize: 16,
      color: theme.textSecondary,
    },
    submitButton: {
      flex: 1,
      paddingVertical: Spacing.lg,
      borderRadius: BorderRadius.lg,
      alignItems: 'center',
      backgroundColor: theme.primary,
    },
    submitButtonText: {
      fontSize: 16,
      fontWeight: '600',
      color: '#FFFFFF',
    },
    typeSelector: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: Spacing.sm,
    },
    typeOption: {
      paddingHorizontal: Spacing.lg,
      paddingVertical: Spacing.sm,
      borderRadius: BorderRadius.lg,
      backgroundColor: theme.backgroundRoot,
      borderWidth: 1,
      borderColor: theme.border,
    },
    typeOptionSelected: {
      backgroundColor: `${theme.primary}10`,
      borderColor: theme.primary,
    },
    typeOptionText: {
      fontSize: 14,
      color: theme.textSecondary,
    },
    typeOptionTextSelected: {
      color: theme.primary,
    },
  });
};
