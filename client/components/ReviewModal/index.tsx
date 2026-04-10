/**
 * 评价弹窗组件
 * 用于订单完成后双方互评
 */

import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  StyleSheet,
} from 'react-native';
import { FontAwesome6 } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { Spacing, BorderRadius } from '@/constants/theme';
import api from '@/utils/api';

interface ReviewModalProps {
  visible: boolean;
  orderId: string;
  revieweeName: string;
  onClose: () => void;
  onSuccess: () => void;
}

export function ReviewModal({
  visible,
  orderId,
  revieweeName,
  onClose,
  onSuccess,
}: ReviewModalProps) {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (rating === 0) {
      Alert.alert('提示', '请选择评分');
      return;
    }

    setLoading(true);
    try {
      await api.submitReview(orderId, rating, comment.trim() || undefined);
      Alert.alert('成功', '评价已提交', [
        {
          text: '确定',
          onPress: () => {
            setRating(5);
            setComment('');
            onSuccess();
          },
        },
      ]);
    } catch (error: any) {
      Alert.alert('提交失败', error.message || '请重试');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setRating(5);
    setComment('');
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <KeyboardAvoidingView
          style={styles.modalContainer}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <TouchableWithoutFeedback>
            <View style={styles.modalContent}>
              {/* Header */}
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>评价 {revieweeName}</Text>
                <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
                  <FontAwesome6 name="xmark" size={20} color={theme.textSecondary} />
                </TouchableOpacity>
              </View>

              {/* Rating */}
              <View style={styles.ratingSection}>
                <Text style={styles.ratingLabel}>评分</Text>
                <View style={styles.starsContainer}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <TouchableOpacity
                      key={star}
                      onPress={() => setRating(star)}
                      style={styles.starButton}
                    >
                      <FontAwesome6
                        name={star <= rating ? 'star' : 'star'}
                        size={36}
                        color={star <= rating ? '#F39C12' : theme.border}
                        solid={star <= rating}
                      />
                    </TouchableOpacity>
                  ))}
                </View>
                <Text style={styles.ratingText}>
                  {rating === 5 ? '非常满意' : rating === 4 ? '满意' : rating === 3 ? '一般' : rating === 2 ? '不满意' : '非常不满意'}
                </Text>
              </View>

              {/* Comment */}
              <View style={styles.commentSection}>
                <Text style={styles.commentLabel}>评价内容（可选）</Text>
                <TextInput
                  style={styles.commentInput}
                  placeholder="分享您的合作体验..."
                  placeholderTextColor={theme.textMuted}
                  value={comment}
                  onChangeText={setComment}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                  maxLength={200}
                />
                <Text style={styles.charCount}>{comment.length}/200</Text>
              </View>

              {/* Submit Button */}
              <TouchableOpacity
                style={[styles.submitButton, loading && styles.submitButtonDisabled]}
                onPress={handleSubmit}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.submitButtonText}>提交评价</Text>
                )}
              </TouchableOpacity>
            </View>
          </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const createStyles = (theme: any) =>
  StyleSheet.create({
    modalContainer: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.5)',
      justifyContent: 'flex-end',
    },
    modalContent: {
      backgroundColor: theme.backgroundDefault,
      borderTopLeftRadius: BorderRadius['3xl'],
      borderTopRightRadius: BorderRadius['3xl'],
      paddingHorizontal: Spacing.xl,
      paddingTop: Spacing.xl,
      paddingBottom: Spacing['3xl'],
    },
    modalHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: Spacing['2xl'],
    },
    modalTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: theme.textPrimary,
    },
    closeButton: {
      padding: Spacing.sm,
    },
    ratingSection: {
      alignItems: 'center',
      marginBottom: Spacing['2xl'],
    },
    ratingLabel: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.textPrimary,
      marginBottom: Spacing.lg,
    },
    starsContainer: {
      flexDirection: 'row',
      gap: Spacing.md,
    },
    starButton: {
      padding: Spacing.sm,
    },
    ratingText: {
      fontSize: 14,
      color: theme.warning,
      marginTop: Spacing.md,
    },
    commentSection: {
      marginBottom: Spacing['2xl'],
    },
    commentLabel: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.textPrimary,
      marginBottom: Spacing.md,
    },
    commentInput: {
      backgroundColor: theme.backgroundElevated,
      borderRadius: BorderRadius.xl,
      padding: Spacing.lg,
      fontSize: 15,
      color: theme.textPrimary,
      minHeight: 100,
    },
    charCount: {
      fontSize: 12,
      color: theme.textMuted,
      textAlign: 'right',
      marginTop: Spacing.sm,
    },
    submitButton: {
      backgroundColor: theme.primary,
      borderRadius: BorderRadius.xl,
      paddingVertical: Spacing.xl,
      alignItems: 'center',
    },
    submitButtonDisabled: {
      opacity: 0.7,
    },
    submitButtonText: {
      fontSize: 16,
      fontWeight: '600',
      color: '#FFFFFF',
    },
  });
