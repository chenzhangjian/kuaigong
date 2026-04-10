import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Linking,
} from 'react-native';
import { FontAwesome6 } from '@expo/vector-icons';
import { Screen } from '@/components/Screen';
import { useTheme } from '@/hooks/useTheme';
import { useSafeRouter } from '@/hooks/useSafeRouter';
import { Spacing, BorderRadius, Typography } from '@/constants/theme';

export default function AboutScreen() {
  const { theme } = useTheme();
  const router = useSafeRouter();
  const styles = useMemo(() => createStyles(theme), [theme]);

  // 拨打电话
  const handleCall = () => {
    Linking.openURL('tel:18552809300');
  };

  // 发送邮件
  const handleEmail = () => {
    Linking.openURL('mailto:kuaigongapp@foxmail.com');
  };

  return (
    <Screen backgroundColor={theme.backgroundRoot}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <FontAwesome6 name="arrow-left" size={20} color={theme.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>关于快工</Text>
        <View style={{ width: 20 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Logo */}
        <View style={styles.logoContainer}>
          <View style={[styles.logo, { backgroundColor: `${theme.primary}20` }]}>
            <FontAwesome6 name="briefcase" size={48} color={theme.primary} />
          </View>
          <Text style={styles.appName}>快工</Text>
          <Text style={styles.slogan}>快速匹配，即时用工</Text>
          <Text style={styles.version}>版本 1.0.0</Text>
        </View>

        {/* 平台简介 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>平台简介</Text>
          <Text style={styles.paragraph}>
            快工是一款专注于零工经济的即时匹配平台，连接有临时用工需求的雇主与寻找兼职机会的工人。通过智能匹配系统，帮助双方快速找到合适的合作对象。
          </Text>
        </View>

        {/* 核心功能 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>核心功能</Text>
          <View style={styles.featureList}>
            <View style={styles.featureItem}>
              <View style={[styles.featureIcon, { backgroundColor: `${theme.primary}15` }]}>
                <FontAwesome6 name="bullhorn" size={18} color={theme.primary} />
              </View>
              <View style={styles.featureContent}>
                <Text style={styles.featureTitle}>任务发布</Text>
                <Text style={styles.featureDesc}>雇主可快速发布搬家、跑腿、保洁、配送等各类零工任务</Text>
              </View>
            </View>
            <View style={styles.featureItem}>
              <View style={[styles.featureIcon, { backgroundColor: `${theme.primary}15` }]}>
                <FontAwesome6 name="magnifying-glass" size={18} color={theme.primary} />
              </View>
              <View style={styles.featureContent}>
                <Text style={styles.featureTitle}>智能接单</Text>
                <Text style={styles.featureDesc}>工人可浏览附近任务，一键申请接单</Text>
              </View>
            </View>
            <View style={styles.featureItem}>
              <View style={[styles.featureIcon, { backgroundColor: `${theme.primary}15` }]}>
                <FontAwesome6 name="comments" size={18} color={theme.primary} />
              </View>
              <View style={styles.featureContent}>
                <Text style={styles.featureTitle}>即时通讯</Text>
                <Text style={styles.featureDesc}>内置消息系统，方便双方沟通任务细节</Text>
              </View>
            </View>
            <View style={styles.featureItem}>
              <View style={[styles.featureIcon, { backgroundColor: `${theme.primary}15` }]}>
                <FontAwesome6 name="credit-card" size={18} color={theme.primary} />
              </View>
              <View style={styles.featureContent}>
                <Text style={styles.featureTitle}>在线支付</Text>
                <Text style={styles.featureDesc}>支持钱包充值、提现，保障资金安全</Text>
              </View>
            </View>
            <View style={styles.featureItem}>
              <View style={[styles.featureIcon, { backgroundColor: `${theme.primary}15` }]}>
                <FontAwesome6 name="shield-halved" size={18} color={theme.primary} />
              </View>
              <View style={styles.featureContent}>
                <Text style={styles.featureTitle}>实名认证</Text>
                <Text style={styles.featureDesc}>严格审核用户身份，保障交易安全</Text>
              </View>
            </View>
            <View style={styles.featureItem}>
              <View style={[styles.featureIcon, { backgroundColor: `${theme.primary}15` }]}>
                <FontAwesome6 name="star" size={18} color={theme.primary} />
              </View>
              <View style={styles.featureContent}>
                <Text style={styles.featureTitle}>评价体系</Text>
                <Text style={styles.featureDesc}>双向评价机制，建立信任体系</Text>
              </View>
            </View>
          </View>
        </View>

        {/* 平台特色 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>平台特色</Text>
          <View style={styles.featureList}>
            <View style={styles.featureItem}>
              <View style={[styles.featureIcon, { backgroundColor: `${theme.primary}15` }]}>
                <FontAwesome6 name="bolt" size={18} color={theme.primary} />
              </View>
              <View style={styles.featureContent}>
                <Text style={styles.featureTitle}>极速匹配</Text>
                <Text style={styles.featureDesc}>智能算法快速匹配供需双方</Text>
              </View>
            </View>
            <View style={styles.featureItem}>
              <View style={[styles.featureIcon, { backgroundColor: `${theme.primary}15` }]}>
                <FontAwesome6 name="location-dot" size={18} color={theme.primary} />
              </View>
              <View style={styles.featureContent}>
                <Text style={styles.featureTitle}>位置优先</Text>
                <Text style={styles.featureDesc}>基于地理位置推荐附近任务</Text>
              </View>
            </View>
            <View style={styles.featureItem}>
              <View style={[styles.featureIcon, { backgroundColor: `${theme.primary}15` }]}>
                <FontAwesome6 name="tags" size={18} color={theme.primary} />
              </View>
              <View style={styles.featureContent}>
                <Text style={styles.featureTitle}>透明定价</Text>
                <Text style={styles.featureDesc}>任务明码标价，避免纠纷</Text>
              </View>
            </View>
            <View style={styles.featureItem}>
              <View style={[styles.featureIcon, { backgroundColor: `${theme.primary}15` }]}>
                <FontAwesome6 name="vault" size={18} color={theme.primary} />
              </View>
              <View style={styles.featureContent}>
                <Text style={styles.featureTitle}>资金保障</Text>
                <Text style={styles.featureDesc}>平台托管资金，完成后放款</Text>
              </View>
            </View>
          </View>
        </View>

        {/* 适用场景 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>适用场景</Text>
          <View style={styles.scenarioContainer}>
            <View style={styles.scenarioCard}>
              <Text style={styles.scenarioTitle}>雇主端</Text>
              <Text style={styles.scenarioDesc}>搬家、装修、清洁、跑腿、临时工</Text>
            </View>
            <View style={styles.scenarioCard}>
              <Text style={styles.scenarioTitle}>工人端</Text>
              <Text style={styles.scenarioDesc}>兼职赚钱、技能变现、空闲时间利用</Text>
            </View>
          </View>
        </View>

        {/* 安全说明 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>安全说明</Text>
          <View style={styles.featureList}>
            <View style={styles.featureItem}>
              <View style={[styles.featureIcon, { backgroundColor: `${theme.primary}15` }]}>
                <FontAwesome6 name="user-check" size={18} color={theme.primary} />
              </View>
              <View style={styles.featureContent}>
                <Text style={styles.featureTitle}>用户实名认证</Text>
                <Text style={styles.featureDesc}>保障双方权益</Text>
              </View>
            </View>
            <View style={styles.featureItem}>
              <View style={[styles.featureIcon, { backgroundColor: `${theme.primary}15` }]}>
                <FontAwesome6 name="shield" size={18} color={theme.primary} />
              </View>
              <View style={styles.featureContent}>
                <Text style={styles.featureTitle}>交易资金托管</Text>
                <Text style={styles.featureDesc}>平台保障资金安全</Text>
              </View>
            </View>
            <View style={styles.featureItem}>
              <View style={[styles.featureIcon, { backgroundColor: `${theme.primary}15` }]}>
                <FontAwesome6 name="headset" size={18} color={theme.primary} />
              </View>
              <View style={styles.featureContent}>
                <Text style={styles.featureTitle}>专业客服团队</Text>
                <Text style={styles.featureDesc}>随时支持您的需求</Text>
              </View>
            </View>
          </View>
        </View>

        {/* 联系我们 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>联系我们</Text>
          
          <TouchableOpacity style={styles.contactItem} onPress={handleCall}>
            <View style={[styles.contactIcon, { backgroundColor: `${theme.primary}15` }]}>
              <FontAwesome6 name="phone" size={18} color={theme.primary} />
            </View>
            <View style={styles.contactContent}>
              <Text style={styles.contactLabel}>客服电话</Text>
              <Text style={styles.contactValue}>18552809300</Text>
            </View>
            <FontAwesome6 name="chevron-right" size={14} color={theme.textPlaceholder} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.contactItem} onPress={handleEmail}>
            <View style={[styles.contactIcon, { backgroundColor: `${theme.primary}15` }]}>
              <FontAwesome6 name="envelope" size={18} color={theme.primary} />
            </View>
            <View style={styles.contactContent}>
              <Text style={styles.contactLabel}>客服邮箱</Text>
              <Text style={styles.contactValue}>kuaigongapp@foxmail.com</Text>
            </View>
            <FontAwesome6 name="chevron-right" size={14} color={theme.textPlaceholder} />
          </TouchableOpacity>

          <View style={styles.contactItem}>
            <View style={[styles.contactIcon, { backgroundColor: `${theme.primary}15` }]}>
              <FontAwesome6 name="location-dot" size={18} color={theme.primary} />
            </View>
            <View style={styles.contactContent}>
              <Text style={styles.contactLabel}>公司地址</Text>
              <Text style={styles.contactValue}>徐州市云龙区汉风街道绿地商务城B03号楼</Text>
            </View>
          </View>

          <View style={styles.contactItem}>
            <View style={[styles.contactIcon, { backgroundColor: `${theme.primary}15` }]}>
              <FontAwesome6 name="clock" size={18} color={theme.primary} />
            </View>
            <View style={styles.contactContent}>
              <Text style={styles.contactLabel}>工作时间</Text>
              <Text style={styles.contactValue}>周一至周日 9:00-21:00</Text>
            </View>
          </View>
        </View>

        {/* 相关链接 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>相关链接</Text>
          
          <TouchableOpacity style={styles.linkItem} onPress={() => router.push('/user-agreement')}>
            <View style={[styles.linkIcon, { backgroundColor: `${theme.primary}15` }]}>
              <FontAwesome6 name="file-contract" size={18} color={theme.primary} />
            </View>
            <Text style={styles.linkTitle}>用户服务协议</Text>
            <FontAwesome6 name="chevron-right" size={14} color={theme.textPlaceholder} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.linkItem} onPress={() => router.push('/privacy-policy')}>
            <View style={[styles.linkIcon, { backgroundColor: `${theme.primary}15` }]}>
              <FontAwesome6 name="file-lines" size={18} color={theme.primary} />
            </View>
            <Text style={styles.linkTitle}>隐私政策</Text>
            <FontAwesome6 name="chevron-right" size={14} color={theme.textPlaceholder} />
          </TouchableOpacity>
        </View>

        {/* 版权信息 */}
        <View style={styles.footer}>
          <Text style={styles.copyright}>
            快工 版权所有 (c) 2025{'\n'}
            徐州昊呈电子商务
          </Text>
          
          {/* ICP备案信息 */}
          <View style={styles.icpContainer}>
            <Text style={styles.icpText}>
              <Text style={styles.icpLink} onPress={() => Linking.openURL('https://beian.miit.gov.cn/')}>
              ICP备案号: 苏ICP备2026018841号
              </Text>
            </Text>
            <Text style={styles.icpPolice}>
              <Text style={styles.icpLink} onPress={() => Linking.openURL('http://www.beian.gov.cn/')}>
                公安网备号: 您的公安网备号
              </Text>
            </Text>
          </View>
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
      borderBottomWidth: 1,
      borderBottomColor: theme.borderLight,
    },
    headerTitle: {
      ...Typography.h4,
      color: theme.textPrimary,
    },
    scrollContent: {
      padding: Spacing.lg,
    },
    // Logo区域
    logoContainer: {
      alignItems: 'center',
      paddingVertical: Spacing["3xl"],
    },
    logo: {
      width: 100,
      height: 100,
      borderRadius: BorderRadius["2xl"],
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: Spacing.lg,
    },
    appName: {
      ...Typography.h1,
      color: theme.textPrimary,
      marginBottom: Spacing.xs,
    },
    slogan: {
      ...Typography.body,
      color: theme.textSecondary,
      marginBottom: Spacing.sm,
    },
    version: {
      ...Typography.caption,
      color: theme.textMuted,
    },
    // 通用section
    section: {
      marginBottom: Spacing["2xl"],
    },
    sectionTitle: {
      ...Typography.h4,
      color: theme.textPrimary,
      marginBottom: Spacing.lg,
    },
    paragraph: {
      ...Typography.body,
      color: theme.textSecondary,
      lineHeight: 24,
    },
    // 功能列表
    featureList: {
      gap: Spacing.md,
    },
    featureItem: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.backgroundTertiary,
      borderRadius: BorderRadius.lg,
      padding: Spacing.lg,
    },
    featureIcon: {
      width: 44,
      height: 44,
      borderRadius: BorderRadius.md,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: Spacing.md,
    },
    featureContent: {
      flex: 1,
    },
    featureTitle: {
      ...Typography.bodyMedium,
      color: theme.textPrimary,
      marginBottom: 2,
    },
    featureDesc: {
      ...Typography.caption,
      color: theme.textSecondary,
    },
    // 适用场景
    scenarioContainer: {
      flexDirection: 'row',
      gap: Spacing.md,
    },
    scenarioCard: {
      flex: 1,
      backgroundColor: theme.backgroundTertiary,
      borderRadius: BorderRadius.lg,
      padding: Spacing.lg,
    },
    scenarioTitle: {
      ...Typography.bodyMedium,
      color: theme.primary,
      marginBottom: Spacing.xs,
    },
    scenarioDesc: {
      ...Typography.caption,
      color: theme.textSecondary,
    },
    // 联系方式
    contactItem: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.backgroundTertiary,
      borderRadius: BorderRadius.lg,
      padding: Spacing.lg,
      marginBottom: Spacing.sm,
    },
    contactIcon: {
      width: 44,
      height: 44,
      borderRadius: BorderRadius.md,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: Spacing.md,
    },
    contactContent: {
      flex: 1,
    },
    contactLabel: {
      ...Typography.caption,
      color: theme.textSecondary,
      marginBottom: 2,
    },
    contactValue: {
      ...Typography.bodyMedium,
      color: theme.textPrimary,
    },
    // 链接
    linkItem: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.backgroundTertiary,
      borderRadius: BorderRadius.lg,
      padding: Spacing.lg,
      marginBottom: Spacing.sm,
    },
    linkIcon: {
      width: 44,
      height: 44,
      borderRadius: BorderRadius.md,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: Spacing.md,
    },
    linkTitle: {
      ...Typography.bodyMedium,
      color: theme.textPrimary,
      flex: 1,
    },
    // 底部
    footer: {
      alignItems: 'center',
      paddingVertical: Spacing["2xl"],
    },
    copyright: {
      ...Typography.caption,
      color: theme.textMuted,
      textAlign: 'center',
      lineHeight: 20,
    },
    // ICP备案
    icpContainer: {
      marginTop: Spacing.md,
      alignItems: 'center',
    },
    icpText: {
      ...Typography.caption,
      color: theme.textMuted,
      textAlign: 'center',
    },
    icpPolice: {
      ...Typography.caption,
      color: theme.textMuted,
      textAlign: 'center',
      marginTop: Spacing.xs,
    },
    icpLink: {
      color: theme.primary,
    },
  });
