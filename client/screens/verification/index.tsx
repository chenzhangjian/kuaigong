import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { FontAwesome6 } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { Screen } from '@/components/Screen';
import { useTheme } from '@/hooks/useTheme';
import { useAuth } from '@/contexts/AuthContext';
import { useSafeRouter } from '@/hooks/useSafeRouter';
import { createFormDataFile } from '@/utils';
import api from '@/utils/api';
import { Colors, Spacing, BorderRadius, Typography } from '@/constants/theme';

// 认证状态类型
type VerificationStatus = 'not_submitted' | 'pending' | 'approved' | 'rejected';

interface VerificationData {
  hasSubmitted: boolean;
  status: VerificationStatus;
  realName?: string;
  idCardNumber?: string;
  rejectReason?: string;
  submittedAt?: string;
  reviewedAt?: string;
  disclaimerSignedAt?: string;
  disclaimerVersion?: string;
}

// 免责声明内容
const DISCLAIMER_CONTENT = `快工平台免责声明

生效日期：2025年1月1日

欢迎使用"快工"平台。在使用本平台提供的各项服务前，请您仔细阅读以下免责声明。

一、平台定位与责任边界

1.1 信息撮合服务
本平台仅为雇主与工人提供信息发布、展示、撮合及交易辅助的技术服务平台，不对用户发布的任务信息、工人资质、服务质量等进行实质性审查或保证。

1.2 非劳动关系
• 本平台与工人之间不存在劳动雇佣关系、劳务派遣关系或任何形式的从属关系。
• 工人通过本平台承接任务属于独立承揽行为，自行承担工作过程中的风险与责任。
• 雇主与工人之间形成的是平等主体之间的承揽/劳务关系，由双方自行协商确定权利义务。

1.3 非中介机构
本平台非职业中介机构，不参与雇主与工人之间的谈判、签约、履约过程，不对交易结果承担任何法律责任。

二、雇主声明与承诺

2.1 信息真实性
• 您发布的任务信息应当真实、准确、完整。
• 如因信息不实导致工人损失或纠纷，由您承担全部责任。

2.2 合法合规
• 您发布的任务内容应当符合国家法律法规及社会公序良俗。
• 您不得通过本平台从事任何违法犯罪活动。

2.3 支付义务
• 您应当按时足额支付约定的报酬。
• 工人完成任务后，您应当在约定时间内确认并完成支付。

三、工人声明与承诺

3.1 身份真实
• 您提供的个人信息、技能证书、工作经历等应当真实有效。

3.2 独立承揽
• 您确认自己具有完全民事行为能力，能够独立承担民事责任。
• 您与雇主之间为平等主体之间的承揽/劳务关系。

3.3 安全责任
• 您在工作过程中应当注意自身安全，遵守安全操作规范。
• 如因您自身原因发生人身损害或财产损失，由您自行承担。
• 强烈建议您自行购买人身意外伤害保险。

3.4 税务义务
• 您通过本平台获得的收入为个人劳务所得，应当按照国家税法规定自行申报缴纳个人所得税。

四、平台免责条款

在法律允许的最大范围内，本平台对以下情形不承担任何责任：
• 用户之间的任何纠纷、争议、违法行为
• 用户使用本平台服务过程中遭受的任何人身伤害、财产损失
• 因不可抗力导致的服务中断、数据丢失
• 用户发布信息的真实性、准确性
• 工人的工作技能、服务质量

五、争议解决

用户之间因使用本平台服务产生的任何争议，应当首先友好协商解决。协商不成的，任何一方均可向有管辖权的人民法院提起诉讼。

六、法律适用

本免责声明的解释、效力及争议解决均适用中华人民共和国法律。`;

const DISCLAIMER_VERSION = '1.0';

export default function VerificationScreen() {
  const { theme } = useTheme();
  const { user, refreshUser } = useAuth();
  const router = useSafeRouter();
  const styles = useMemo(() => createStyles(theme), [theme]);

  // 状态
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [signingDisclaimer, setSigningDisclaimer] = useState(false);
  const [verificationData, setVerificationData] = useState<VerificationData | null>(null);

  // 表单数据
  const [realName, setRealName] = useState('');
  const [idCardNumber, setIdCardNumber] = useState('');
  const [frontImageKey, setFrontImageKey] = useState('');
  const [backImageKey, setBackImageKey] = useState('');
  const [frontImageUri, setFrontImageUri] = useState<string | null>(null);
  const [backImageUri, setBackImageUri] = useState<string | null>(null);
  const [uploadingFront, setUploadingFront] = useState(false);
  const [uploadingBack, setUploadingBack] = useState(false);

  // 获取认证状态
  useEffect(() => {
    fetchVerificationStatus();
  }, []);

  const fetchVerificationStatus = async () => {
    try {
      setLoading(true);
      const data = await api.getVerificationStatus();
      setVerificationData(data);

      // 如果被拒绝，预填表单
      if (data.status === 'rejected' && data.realName) {
        setRealName(data.realName);
        setIdCardNumber(data.idCardNumber?.replace(/\*/g, '') || '');
      }
    } catch (error) {
      console.error('Fetch verification status error:', error);
    } finally {
      setLoading(false);
    }
  };

  // 选择并上传图片
  const pickAndUploadImage = async (type: 'front' | 'back') => {
    try {
      // 请求相册权限
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('权限提示', '需要相册权限才能上传身份证照片');
        return;
      }

      // 选择图片
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [16, 10],
        quality: 0.8,
      });

      if (result.canceled || !result.assets[0]) {
        return;
      }

      const asset = result.assets[0];
      const setUploading = type === 'front' ? setUploadingFront : setUploadingBack;
      const setImageUri = type === 'front' ? setFrontImageUri : setBackImageUri;
      const setImageKey = type === 'front' ? setFrontImageKey : setBackImageKey;

      setUploading(true);

      // 确定文件类型
      const fileExtension = asset.uri.split('.').pop()?.toLowerCase() || 'jpg';
      const mimeType = fileExtension === 'png' ? 'image/png' : 'image/jpeg';
      const fileName = `id_card_${type}_${Date.now()}.${fileExtension}`;

      // 使用 createFormDataFile 创建跨平台兼容的文件对象
      const formData = new FormData();
      const file = await createFormDataFile(asset.uri, fileName, mimeType);
      formData.append('file', file as any);

      // 上传到服务器
      const uploadResult = await api.uploadVerificationImage(formData);

      setImageUri(asset.uri);
      setImageKey(uploadResult.key);
    } catch (error) {
      console.error('Upload image error:', error);
      Alert.alert('上传失败', '图片上传失败，请重试');
    } finally {
      if (type === 'front') {
        setUploadingFront(false);
      } else {
        setUploadingBack(false);
      }
    }
  };

  // 提交认证
  const handleSubmit = async () => {
    // 表单验证
    if (!realName.trim()) {
      Alert.alert('提示', '请输入真实姓名');
      return;
    }
    if (realName.length < 2 || realName.length > 20) {
      Alert.alert('提示', '姓名长度应在2-20个字符之间');
      return;
    }
    if (!idCardNumber.trim()) {
      Alert.alert('提示', '请输入身份证号');
      return;
    }
    // 简单的身份证号格式验证
    const idCardRegex = /^[1-9]\d{5}(?:18|19|20)\d{2}(?:0[1-9]|1[0-2])(?:0[1-9]|[12]\d|3[01])\d{3}[\dX]$/i;
    if (!idCardRegex.test(idCardNumber)) {
      Alert.alert('提示', '请输入有效的身份证号');
      return;
    }
    if (!frontImageKey) {
      Alert.alert('提示', '请上传身份证正面照');
      return;
    }
    if (!backImageKey) {
      Alert.alert('提示', '请上传身份证背面照');
      return;
    }

    try {
      setSubmitting(true);
      await api.submitVerification(realName.trim(), idCardNumber.trim(), frontImageKey, backImageKey);
      Alert.alert('提交成功', '实名认证申请已提交，请等待审核', [
        {
          text: '确定',
          onPress: () => {
            fetchVerificationStatus();
            refreshUser();
          },
        },
      ]);
    } catch (error: any) {
      console.error('Submit verification error:', error);
      Alert.alert('提交失败', error.message || '提交认证失败，请重试');
    } finally {
      setSubmitting(false);
    }
  };

  // 签署免责声明
  const handleSignDisclaimer = async () => {
    Alert.alert(
      '确认签署',
      '您确认已阅读并同意《快工平台免责声明》的全部内容吗？',
      [
        { text: '取消', style: 'cancel' },
        {
          text: '确认签署',
          onPress: async () => {
            try {
              setSigningDisclaimer(true);
              await api.signDisclaimer(DISCLAIMER_VERSION);
              Alert.alert('签署成功', '您已成功签署免责声明', [
                {
                  text: '确定',
                  onPress: () => {
                    fetchVerificationStatus();
                    refreshUser();
                  },
                },
              ]);
            } catch (error: any) {
              console.error('Sign disclaimer error:', error);
              Alert.alert('签署失败', error.message || '签署免责声明失败，请重试');
            } finally {
              setSigningDisclaimer(false);
            }
          },
        },
      ]
    );
  };

  // 渲染加载状态
  if (loading) {
    return (
      <Screen backgroundColor={theme.backgroundRoot}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <FontAwesome6 name="arrow-left" size={20} color={theme.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>实名认证</Text>
          <View style={{ width: 20 }} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      </Screen>
    );
  }

  // 渲染免责声明签署页面（实名认证通过但未签署免责声明）
  if (verificationData?.status === 'approved' && !verificationData.disclaimerSignedAt) {
    return (
      <Screen backgroundColor={theme.backgroundRoot}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <FontAwesome6 name="arrow-left" size={20} color={theme.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>签署免责声明</Text>
          <View style={{ width: 20 }} />
        </View>
        <ScrollView contentContainerStyle={styles.disclaimerScrollContent}>
          {/* 提示 */}
          <View style={styles.disclaimerNotice}>
            <FontAwesome6 name="file-contract" size={24} color={theme.primary} />
            <Text style={styles.disclaimerNoticeTitle}>请阅读并签署免责声明</Text>
            <Text style={styles.disclaimerNoticeText}>
              为保障您的权益，使用平台服务前请仔细阅读并签署以下免责声明。
            </Text>
          </View>

          {/* 免责声明内容 */}
          <View style={styles.disclaimerCard}>
            <ScrollView style={styles.disclaimerContent} nestedScrollEnabled>
              <Text style={styles.disclaimerText}>{DISCLAIMER_CONTENT}</Text>
            </ScrollView>
          </View>

          {/* 签署按钮 */}
          <TouchableOpacity
            style={[styles.signButton, signingDisclaimer && styles.signButtonDisabled]}
            onPress={handleSignDisclaimer}
            disabled={signingDisclaimer}
          >
            {signingDisclaimer ? (
              <ActivityIndicator size="small" color="#FFF" />
            ) : (
              <>
                <FontAwesome6 name="signature" size={18} color="#FFF" style={{ marginRight: 8 }} />
                <Text style={styles.signButtonText}>我已阅读并同意签署</Text>
              </>
            )}
          </TouchableOpacity>

          {/* 提示 */}
          <Text style={styles.disclaimerHint}>
            签署后即可开始{user?.userType === 'worker' ? '接单' : '发布任务'}
          </Text>
        </ScrollView>
      </Screen>
    );
  }

  // 渲染已认证状态（包括免责声明已签署）
  if (verificationData?.status === 'approved') {
    return (
      <Screen backgroundColor={theme.backgroundRoot}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <FontAwesome6 name="arrow-left" size={20} color={theme.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>实名认证</Text>
          <View style={{ width: 20 }} />
        </View>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.successContainer}>
            <View style={styles.successIconContainer}>
              <FontAwesome6 name="check" size={48} color="#00B894" />
            </View>
            <Text style={styles.successTitle}>已认证</Text>
            <Text style={styles.successSubtitle}>您的实名认证已通过审核</Text>

            <View style={styles.infoCard}>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>姓名</Text>
                <Text style={styles.infoValue}>{verificationData.realName}</Text>
              </View>
              <View style={styles.infoDivider} />
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>身份证号</Text>
                <Text style={styles.infoValue}>{verificationData.idCardNumber}</Text>
              </View>
              <View style={styles.infoDivider} />
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>免责声明</Text>
                <View style={styles.signedBadge}>
                  <FontAwesome6 name="check-circle" size={14} color="#00B894" />
                  <Text style={styles.signedText}>已签署</Text>
                </View>
              </View>
            </View>
          </View>
        </ScrollView>
      </Screen>
    );
  }

  // 渲染审核中状态
  if (verificationData?.status === 'pending') {
    return (
      <Screen backgroundColor={theme.backgroundRoot}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <FontAwesome6 name="arrow-left" size={20} color={theme.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>实名认证</Text>
          <View style={{ width: 20 }} />
        </View>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.pendingContainer}>
            <View style={styles.pendingIconContainer}>
              <FontAwesome6 name="clock" size={48} color={theme.primary} />
            </View>
            <Text style={styles.pendingTitle}>审核中</Text>
            <Text style={styles.pendingSubtitle}>您的实名认证申请正在审核中，请耐心等待</Text>

            <View style={styles.infoCard}>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>姓名</Text>
                <Text style={styles.infoValue}>{verificationData.realName}</Text>
              </View>
              <View style={styles.infoDivider} />
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>提交时间</Text>
                <Text style={styles.infoValue}>
                  {verificationData.submittedAt
                    ? new Date(verificationData.submittedAt).toLocaleString('zh-CN')
                    : '-'}
                </Text>
              </View>
            </View>

            <View style={styles.pendingNotice}>
              <FontAwesome6 name="info-circle" size={16} color={theme.textSecondary} />
              <Text style={styles.pendingNoticeText}>
                审核通过后，您需要签署免责声明才能开始{user?.userType === 'worker' ? '接单' : '发布任务'}
              </Text>
            </View>
          </View>
        </ScrollView>
      </Screen>
    );
  }

  // 渲染表单
  return (
    <Screen backgroundColor={theme.backgroundRoot}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <FontAwesome6 name="arrow-left" size={20} color={theme.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>实名认证</Text>
        <View style={{ width: 20 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        {/* 拒绝原因提示 */}
        {verificationData?.status === 'rejected' && verificationData.rejectReason && (
          <View style={styles.rejectNotice}>
            <FontAwesome6 name="circle-exclamation" size={20} color="#FF6B6B" />
            <Text style={styles.rejectNoticeText}>
              认证未通过：{verificationData.rejectReason}
            </Text>
          </View>
        )}

        {/* 说明 */}
        <View style={styles.noticeCard}>
          <FontAwesome6 name="shield-halved" size={20} color={theme.primary} />
          <Text style={styles.noticeText}>
            为保障账户安全，请填写您的真实身份信息。您的个人信息将被严格保密。
          </Text>
        </View>

        {/* 姓名 */}
        <View style={styles.formGroup}>
          <Text style={styles.formLabel}>真实姓名</Text>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="请输入身份证上的姓名"
              placeholderTextColor={theme.textPlaceholder}
              value={realName}
              onChangeText={setRealName}
              maxLength={20}
            />
          </View>
        </View>

        {/* 身份证号 */}
        <View style={styles.formGroup}>
          <Text style={styles.formLabel}>身份证号</Text>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="请输入18位身份证号码"
              placeholderTextColor={theme.textPlaceholder}
              value={idCardNumber}
              onChangeText={setIdCardNumber}
              maxLength={18}
              keyboardType="ascii-capable"
            />
          </View>
        </View>

        {/* 身份证正面照 */}
        <View style={styles.formGroup}>
          <Text style={styles.formLabel}>身份证正面照（人像面）</Text>
          <TouchableOpacity
            style={styles.uploadBox}
            onPress={() => pickAndUploadImage('front')}
            disabled={uploadingFront}
          >
            {frontImageUri ? (
              <Image source={{ uri: frontImageUri }} style={styles.uploadedImage} />
            ) : (
              <View style={styles.uploadPlaceholder}>
                {uploadingFront ? (
                  <ActivityIndicator size="large" color={theme.primary} />
                ) : (
                  <>
                    <FontAwesome6 name="id-card" size={40} color={theme.textPlaceholder} />
                    <Text style={styles.uploadText}>点击上传身份证正面</Text>
                    <Text style={styles.uploadHint}>请确保照片清晰、完整</Text>
                  </>
                )}
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* 身份证背面照 */}
        <View style={styles.formGroup}>
          <Text style={styles.formLabel}>身份证背面照（国徽面）</Text>
          <TouchableOpacity
            style={styles.uploadBox}
            onPress={() => pickAndUploadImage('back')}
            disabled={uploadingBack}
          >
            {backImageUri ? (
              <Image source={{ uri: backImageUri }} style={styles.uploadedImage} />
            ) : (
              <View style={styles.uploadPlaceholder}>
                {uploadingBack ? (
                  <ActivityIndicator size="large" color={theme.primary} />
                ) : (
                  <>
                    <FontAwesome6 name="id-card" size={40} color={theme.textPlaceholder} />
                    <Text style={styles.uploadText}>点击上传身份证背面</Text>
                    <Text style={styles.uploadHint}>请确保照片清晰、完整</Text>
                  </>
                )}
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* 提交按钮 */}
        <TouchableOpacity
          style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator size="small" color="#FFF" />
          ) : (
            <Text style={styles.submitButtonText}>提交认证</Text>
          )}
        </TouchableOpacity>

        {/* 温馨提示 */}
        <View style={styles.tipsContainer}>
          <Text style={styles.tipsTitle}>温馨提示</Text>
          <Text style={styles.tipsText}>• 请确保证件照片清晰、边框完整、无反光</Text>
          <Text style={styles.tipsText}>• 证件信息需与填写信息一致</Text>
          <Text style={styles.tipsText}>• 认证信息仅用于身份验证，严格保密</Text>
          <Text style={styles.tipsText}>• 审核通过后需签署免责声明才能使用平台服务</Text>
        </View>
      </ScrollView>
    </Screen>
  );
}

const createStyles = (theme: any) =>
  StyleSheet.create({
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: Spacing.lg,
      paddingVertical: Spacing.md,
      backgroundColor: theme.backgroundRoot,
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: theme.textPrimary,
    },
    scrollContent: {
      paddingHorizontal: Spacing.lg,
      paddingBottom: Spacing.xxl * 2,
    },
    disclaimerScrollContent: {
      paddingHorizontal: Spacing.lg,
      paddingBottom: Spacing.xxl * 2,
      paddingTop: Spacing.md,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    // 成功状态
    successContainer: {
      alignItems: 'center',
      paddingTop: Spacing.xxl,
    },
    successIconContainer: {
      width: 100,
      height: 100,
      borderRadius: 50,
      backgroundColor: 'rgba(0, 184, 148, 0.12)',
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: Spacing.lg,
    },
    successTitle: {
      fontSize: 24,
      fontWeight: '800',
      color: '#00B894',
      marginBottom: Spacing.sm,
    },
    successSubtitle: {
      fontSize: 14,
      color: theme.textSecondary,
      marginBottom: Spacing.xl,
    },
    // 审核中状态
    pendingContainer: {
      alignItems: 'center',
      paddingTop: Spacing.xxl,
    },
    pendingIconContainer: {
      width: 100,
      height: 100,
      borderRadius: 50,
      backgroundColor: `${theme.primary}12`,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: Spacing.lg,
    },
    pendingTitle: {
      fontSize: 24,
      fontWeight: '800',
      color: theme.primary,
      marginBottom: Spacing.sm,
    },
    pendingSubtitle: {
      fontSize: 14,
      color: theme.textSecondary,
      marginBottom: Spacing.xl,
      textAlign: 'center',
    },
    pendingNotice: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: `${theme.primary}08`,
      borderRadius: BorderRadius.md,
      padding: Spacing.md,
      marginTop: Spacing.lg,
      width: '100%',
    },
    pendingNoticeText: {
      flex: 1,
      marginLeft: Spacing.sm,
      fontSize: 13,
      color: theme.textSecondary,
      lineHeight: 20,
    },
    // 信息卡片
    infoCard: {
      width: '100%',
      backgroundColor: theme.backgroundSurface,
      borderRadius: BorderRadius.lg,
      padding: Spacing.lg,
      marginTop: Spacing.md,
    },
    infoRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: Spacing.sm,
    },
    infoLabel: {
      fontSize: 14,
      color: theme.textSecondary,
    },
    infoValue: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.textPrimary,
    },
    infoDivider: {
      height: 1,
      backgroundColor: theme.border,
      marginVertical: Spacing.xs,
    },
    signedBadge: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    signedText: {
      fontSize: 14,
      color: '#00B894',
      marginLeft: 4,
      fontWeight: '600',
    },
    // 拒绝提示
    rejectNotice: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: 'rgba(255, 107, 107, 0.1)',
      borderRadius: BorderRadius.md,
      padding: Spacing.md,
      marginBottom: Spacing.lg,
    },
    rejectNoticeText: {
      flex: 1,
      marginLeft: Spacing.sm,
      fontSize: 14,
      color: '#FF6B6B',
    },
    // 说明卡片
    noticeCard: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      backgroundColor: `${theme.primary}08`,
      borderRadius: BorderRadius.md,
      padding: Spacing.md,
      marginBottom: Spacing.lg,
    },
    noticeText: {
      flex: 1,
      marginLeft: Spacing.sm,
      fontSize: 13,
      color: theme.textSecondary,
      lineHeight: 20,
    },
    // 表单
    formGroup: {
      marginBottom: Spacing.lg,
    },
    formLabel: {
      fontSize: 15,
      fontWeight: '600',
      color: theme.textPrimary,
      marginBottom: Spacing.sm,
    },
    inputContainer: {
      backgroundColor: theme.backgroundElevated,
      borderRadius: BorderRadius.md,
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.6)',
    },
    input: {
      padding: Spacing.md,
      fontSize: 15,
      color: theme.textPrimary,
    },
    // 上传区域
    uploadBox: {
      backgroundColor: theme.backgroundElevated,
      borderRadius: BorderRadius.lg,
      borderWidth: 2,
      borderColor: theme.border,
      borderStyle: 'dashed',
      overflow: 'hidden',
    },
    uploadPlaceholder: {
      height: 160,
      justifyContent: 'center',
      alignItems: 'center',
    },
    uploadText: {
      fontSize: 15,
      fontWeight: '600',
      color: theme.textSecondary,
      marginTop: Spacing.sm,
    },
    uploadHint: {
      fontSize: 12,
      color: theme.textPlaceholder,
      marginTop: Spacing.xs,
    },
    uploadedImage: {
      width: '100%',
      height: 160,
      resizeMode: 'cover',
    },
    // 提交按钮
    submitButton: {
      backgroundColor: theme.primary,
      borderRadius: BorderRadius.xl,
      paddingVertical: Spacing.md + 2,
      alignItems: 'center',
      marginTop: Spacing.lg,
      flexDirection: 'row',
      justifyContent: 'center',
    },
    submitButtonDisabled: {
      opacity: 0.6,
    },
    submitButtonText: {
      fontSize: 16,
      fontWeight: '700',
      color: '#FFFFFF',
    },
    // 提示
    tipsContainer: {
      marginTop: Spacing.xl,
      padding: Spacing.md,
      backgroundColor: theme.backgroundElevated,
      borderRadius: BorderRadius.md,
    },
    tipsTitle: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.textPrimary,
      marginBottom: Spacing.sm,
    },
    tipsText: {
      fontSize: 13,
      color: theme.textSecondary,
      lineHeight: 22,
      marginBottom: Spacing.xs,
    },
    // 免责声明相关样式
    disclaimerNotice: {
      alignItems: 'center',
      marginBottom: Spacing.lg,
    },
    disclaimerNoticeTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: theme.textPrimary,
      marginTop: Spacing.sm,
    },
    disclaimerNoticeText: {
      fontSize: 14,
      color: theme.textSecondary,
      textAlign: 'center',
      marginTop: Spacing.sm,
    },
    disclaimerCard: {
      backgroundColor: theme.backgroundSurface,
      borderRadius: BorderRadius.lg,
      padding: Spacing.md,
      marginBottom: Spacing.lg,
    },
    disclaimerContent: {
      maxHeight: 400,
    },
    disclaimerText: {
      fontSize: 13,
      color: theme.textPrimary,
      lineHeight: 22,
    },
    signButton: {
      backgroundColor: theme.primary,
      borderRadius: BorderRadius.xl,
      paddingVertical: Spacing.md + 2,
      alignItems: 'center',
      flexDirection: 'row',
      justifyContent: 'center',
    },
    signButtonDisabled: {
      opacity: 0.6,
    },
    signButtonText: {
      fontSize: 16,
      fontWeight: '700',
      color: '#FFFFFF',
    },
    disclaimerHint: {
      fontSize: 13,
      color: theme.textSecondary,
      textAlign: 'center',
      marginTop: Spacing.md,
    },
  });
