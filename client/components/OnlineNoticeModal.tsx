import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { FontAwesome6 } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { Spacing, BorderRadius } from '@/constants/theme';

interface OnlineNoticeModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

const noticeItems = [
  {
    icon: 'heart-pulse',
    title: '健康状态确认',
    description: '请确保您当前身体状况良好，无发热、头晕等不适症状，能够安全完成工作任务。',
    color: '#FF6B6B',
  },
  {
    icon: 'shield-halved',
    title: '安全防护措施',
    description: '请佩戴必要的防护装备（如安全帽、手套等），遵守工作场所安全规范，注意人身安全。',
    color: '#00B894',
  },
  {
    icon: 'id-card',
    title: '证件齐全有效',
    description: '确保证件（身份证、技能证书等）真实有效且随身携带，以备雇主核验。',
    color: '#6C63FF',
  },
  {
    icon: 'clock',
    title: '准时到达岗位',
    description: '上线后请保持通讯畅通，接到订单后请准时到达指定地点，避免爽约。',
    color: '#FDCB6E',
  },
  {
    icon: 'handshake',
    title: '诚信服务承诺',
    description: '请诚信服务，不虚假报价、不中途加价，维护良好职业信誉，收获更多好评。',
    color: '#FF6584',
  },
];

export default function OnlineNoticeModal({ visible, onClose, onConfirm }: OnlineNoticeModalProps) {
  const { theme } = useTheme();
  const [checked, setChecked] = useState(false);

  const styles = useMemo(() => ({
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center' as const,
      alignItems: 'center' as const,
      padding: Spacing.xl,
    },
    modalContainer: {
      backgroundColor: theme.backgroundElevated,
      borderRadius: BorderRadius['2xl'],
      width: '100%' as const,
      maxWidth: 400,
      maxHeight: 500,
      overflow: 'hidden' as const,
    },
    header: {
      padding: Spacing['2xl'],
      paddingBottom: Spacing.lg,
      alignItems: 'center' as const,
    },
    headerIcon: {
      width: 64,
      height: 64,
      borderRadius: BorderRadius['2xl'],
      backgroundColor: `${theme.primary}15`,
      justifyContent: 'center' as const,
      alignItems: 'center' as const,
      marginBottom: Spacing.lg,
    },
    headerTitle: {
      fontSize: 20,
      fontWeight: '700' as const,
      color: theme.textPrimary,
      marginBottom: Spacing.xs,
    },
    headerSubtitle: {
      fontSize: 14,
      color: theme.textSecondary,
      textAlign: 'center' as const,
    },
    content: {
      paddingHorizontal: Spacing['2xl'],
      maxHeight: 320,
    },
    noticeItem: {
      flexDirection: 'row' as const,
      marginBottom: Spacing.xl,
    },
    noticeIcon: {
      width: 40,
      height: 40,
      borderRadius: BorderRadius.lg,
      justifyContent: 'center' as const,
      alignItems: 'center' as const,
      marginRight: Spacing.lg,
    },
    noticeContent: {
      flex: 1,
    },
    noticeTitle: {
      fontSize: 15,
      fontWeight: '600' as const,
      color: theme.textPrimary,
      marginBottom: Spacing.xs,
    },
    noticeDescription: {
      fontSize: 13,
      color: theme.textSecondary,
      lineHeight: 18,
    },
    checkboxContainer: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      paddingHorizontal: Spacing['2xl'],
      paddingVertical: Spacing.lg,
      borderTopWidth: 1,
      borderTopColor: theme.border,
    },
    checkbox: {
      width: 22,
      height: 22,
      borderRadius: BorderRadius.sm,
      borderWidth: 2,
      borderColor: checked ? theme.primary : theme.border,
      backgroundColor: checked ? theme.primary : 'transparent',
      justifyContent: 'center' as const,
      alignItems: 'center' as const,
      marginRight: Spacing.md,
    },
    checkboxLabel: {
      fontSize: 14,
      color: theme.textPrimary,
    },
    footer: {
      flexDirection: 'row' as const,
      padding: Spacing['2xl'],
      paddingTop: Spacing.lg,
      gap: Spacing.md,
    },
    cancelButton: {
      flex: 1,
      paddingVertical: Spacing.lg,
      borderRadius: BorderRadius.xl,
      backgroundColor: theme.backgroundTertiary,
      alignItems: 'center' as const,
    },
    cancelButtonText: {
      fontSize: 16,
      fontWeight: '600' as const,
      color: theme.textSecondary,
    },
    confirmButton: {
      flex: 1,
      paddingVertical: Spacing.lg,
      borderRadius: BorderRadius.xl,
      backgroundColor: checked ? theme.primary : theme.backgroundTertiary,
      alignItems: 'center' as const,
    },
    confirmButtonText: {
      fontSize: 16,
      fontWeight: '600' as const,
      color: checked ? theme.buttonPrimaryText : theme.textMuted,
    },
  }), [theme, checked]);

  const handleClose = () => {
    setChecked(false);
    onClose();
  };

  const handleConfirm = () => {
    if (checked) {
      setChecked(false);
      onConfirm();
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerIcon}>
              <FontAwesome6 name="bell" size={28} color={theme.primary} />
            </View>
            <Text style={styles.headerTitle}>上线注意事项</Text>
            <Text style={styles.headerSubtitle}>请您仔细阅读以下事项，确保安全接单</Text>
          </View>

          {/* Notice List */}
          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {noticeItems.map((item, index) => (
              <View key={index} style={styles.noticeItem}>
                <View style={[styles.noticeIcon, { backgroundColor: `${item.color}15` }]}>
                  <FontAwesome6 name={item.icon as any} size={18} color={item.color} />
                </View>
                <View style={styles.noticeContent}>
                  <Text style={styles.noticeTitle}>{item.title}</Text>
                  <Text style={styles.noticeDescription}>{item.description}</Text>
                </View>
              </View>
            ))}
          </ScrollView>

          {/* Checkbox */}
          <TouchableOpacity
            style={styles.checkboxContainer}
            onPress={() => setChecked(!checked)}
            activeOpacity={0.7}
          >
            <View style={styles.checkbox}>
              {checked && (
                <FontAwesome6 name="check" size={12} color={theme.buttonPrimaryText} />
              )}
            </View>
            <Text style={styles.checkboxLabel}>我已阅读并同意遵守以上注意事项</Text>
          </TouchableOpacity>

          {/* Footer */}
          <View style={styles.footer}>
            <TouchableOpacity style={styles.cancelButton} onPress={handleClose}>
              <Text style={styles.cancelButtonText}>取消</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.confirmButton}
              onPress={handleConfirm}
              disabled={!checked}
            >
              <Text style={styles.confirmButtonText}>确认上线</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}
