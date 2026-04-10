import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '@/components/Screen';
import { useSafeRouter } from '@/hooks/useSafeRouter';
import { Colors, Spacing, BorderRadius, Typography } from '@/constants/theme';

export default function PrivacyPolicyScreen() {
  const router = useSafeRouter();

  return (
    <Screen>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={Colors.light.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>隐私政策</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          {/* 更新日期 */}
          <View style={styles.updateInfo}>
            <Text style={styles.updateLabel}>更新日期：2024年1月1日</Text>
            <Text style={styles.updateLabel}>生效日期：2024年1月1日</Text>
          </View>

          {/* 引言 */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>引言</Text>
            <Text style={styles.paragraph}>
              快工（以下简称「我们」）非常重视用户的隐私和个人信息保护。本隐私政策将向您说明我们如何收集、使用、存储、共享和保护您的个人信息，以及您享有的相关权利。
            </Text>
            <Text style={styles.paragraph}>
              请您在使用快工服务前，仔细阅读并理解本隐私政策的全部内容。如果您不同意本政策的任何内容，您应立即停止使用我们的服务。
            </Text>
          </View>

          {/* 一、我们如何收集和使用您的个人信息 */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>一、我们如何收集和使用您的个人信息</Text>
            
            <Text style={styles.subTitle}>1.1 账号注册与登录</Text>
            <Text style={styles.paragraph}>
              当您注册快工账号时，我们需要收集以下信息：
            </Text>
            <View style={styles.list}>
              <Text style={styles.listItem}>• 手机号码（必填）：用于账号注册、登录验证和安全保护</Text>
              <Text style={styles.listItem}>• 密码（必填）：用于账号安全登录</Text>
              <Text style={styles.listItem}>• 昵称、头像（可选）：用于个人资料展示</Text>
            </View>

            <Text style={styles.subTitle}>1.2 实名认证</Text>
            <Text style={styles.paragraph}>
              为了保障平台交易安全，部分功能需要进行实名认证：
            </Text>
            <View style={styles.list}>
              <Text style={styles.listItem}>• 真实姓名</Text>
              <Text style={styles.listItem}>• 身份证号码</Text>
              <Text style={styles.listItem}>• 人脸识别信息（通过第三方认证服务处理）</Text>
            </View>

            <Text style={styles.subTitle}>1.3 位置信息</Text>
            <Text style={styles.paragraph}>
              当您授权后，我们会收集您的位置信息用于：
            </Text>
            <View style={styles.list}>
              <Text style={styles.listItem}>• 展示您周边的任务信息</Text>
              <Text style={styles.listItem}>• 提供导航和路线规划服务</Text>
              <Text style={styles.listItem}>• 发布任务时自动填充工作地点</Text>
            </View>
            <Text style={styles.paragraph}>
              您可以在系统设置中随时关闭位置权限。
            </Text>

            <Text style={styles.subTitle}>1.4 相机和相册</Text>
            <Text style={styles.paragraph}>
              当您授权后，我们会访问您的相机和相册用于：
            </Text>
            <View style={styles.list}>
              <Text style={styles.listItem}>• 上传头像和个人照片</Text>
              <Text style={styles.listItem}>• 发布任务时上传图片</Text>
              <Text style={styles.listItem}>• 完成订单时上传工作照片</Text>
            </View>

            <Text style={styles.subTitle}>1.5 交易信息</Text>
            <Text style={styles.paragraph}>
              当您使用快工平台进行交易时，我们会收集：
            </Text>
            <View style={styles.list}>
              <Text style={styles.listItem}>• 任务发布和接单信息</Text>
              <Text style={styles.listItem}>• 订单详情和交易记录</Text>
              <Text style={styles.listItem}>• 支付信息（通过第三方支付平台处理）</Text>
              <Text style={styles.listItem}>• 评价和反馈信息</Text>
            </View>

            <Text style={styles.subTitle}>1.6 设备信息</Text>
            <Text style={styles.paragraph}>
              为了保障账号安全和服务稳定性，我们会收集：
            </Text>
            <View style={styles.list}>
              <Text style={styles.listItem}>• 设备型号、操作系统版本</Text>
              <Text style={styles.listItem}>• 设备标识符（用于账号安全保护）</Text>
              <Text style={styles.listItem}>• 网络状态、IP地址</Text>
            </View>
          </View>

          {/* 二、我们如何使用Cookie和同类技术 */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>二、我们如何使用Cookie和同类技术</Text>
            <Text style={styles.paragraph}>
              我们使用本地存储技术（如 AsyncStorage）来：
            </Text>
            <View style={styles.list}>
              <Text style={styles.listItem}>• 记住您的登录状态</Text>
              <Text style={styles.listItem}>• 保存您的个人偏好设置</Text>
              <Text style={styles.listItem}>• 提供更流畅的使用体验</Text>
            </View>
            <Text style={styles.paragraph}>
              您可以通过清除本地数据来删除这些信息，但这可能会影响您的使用体验。
            </Text>
          </View>

          {/* 三、我们如何共享、转让、公开披露您的个人信息 */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>三、我们如何共享、转让、公开披露您的个人信息</Text>
            
            <Text style={styles.subTitle}>3.1 共享</Text>
            <Text style={styles.paragraph}>
              我们不会向第三方出售您的个人信息。我们仅在以下情况下共享您的信息：
            </Text>
            <View style={styles.list}>
              <Text style={styles.listItem}>• 经您事先同意或授权</Text>
              <Text style={styles.listItem}>• 与授权合作伙伴共享：支付服务商、地图服务商、短信服务商、实名认证服务商等</Text>
              <Text style={styles.listItem}>• 法律法规要求或司法、行政机关要求</Text>
            </View>

            <Text style={styles.subTitle}>3.2 转让</Text>
            <Text style={styles.paragraph}>
              我们不会将您的个人信息转让给任何公司、组织或个人，但以下情况除外：
            </Text>
            <View style={styles.list}>
              <Text style={styles.listItem}>• 获得您的明确同意</Text>
              <Text style={styles.listItem}>• 涉及合并、收购或破产清算时</Text>
            </View>

            <Text style={styles.subTitle}>3.3 公开披露</Text>
            <Text style={styles.paragraph}>
              我们仅会在以下情况下公开披露您的个人信息：
            </Text>
            <View style={styles.list}>
              <Text style={styles.listItem}>• 获得您的明确同意</Text>
              <Text style={styles.listItem}>• 基于法律法规、法律程序、诉讼或政府部门的强制性要求</Text>
            </View>
          </View>

          {/* 四、我们如何保护您的个人信息 */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>四、我们如何保护您的个人信息</Text>
            <Text style={styles.paragraph}>
              我们采取多种安全措施来保护您的个人信息：
            </Text>
            <View style={styles.list}>
              <Text style={styles.listItem}>• 数据加密：使用HTTPS加密传输，密码加密存储</Text>
              <Text style={styles.listItem}>• 访问控制：严格限制员工访问权限</Text>
              <Text style={styles.listItem}>• 安全审计：定期进行安全漏洞扫描和修复</Text>
              <Text style={styles.listItem}>• 应急响应：建立数据安全应急响应机制</Text>
            </View>
          </View>

          {/* 五、您的权利 */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>五、您的权利</Text>
            <Text style={styles.paragraph}>
              您对您的个人信息享有以下权利：
            </Text>
            
            <Text style={styles.subTitle}>5.1 访问权</Text>
            <Text style={styles.paragraph}>
              您可以在「个人中心」页面查看和访问您的个人信息。
            </Text>

            <Text style={styles.subTitle}>5.2 更正权</Text>
            <Text style={styles.paragraph}>
              您可以在「编辑资料」页面更正您的个人信息。
            </Text>

            <Text style={styles.subTitle}>5.3 删除权</Text>
            <Text style={styles.paragraph}>
              您可以通过以下方式删除您的个人信息：
            </Text>
            <View style={styles.list}>
              <Text style={styles.listItem}>• 在「设置」页面删除特定信息</Text>
              <Text style={styles.listItem}>• 联系客服申请注销账号</Text>
            </View>

            <Text style={styles.subTitle}>5.4 撤回同意权</Text>
            <Text style={styles.paragraph}>
              您可以在系统设置中撤回已授予的权限（如位置、相机、相册权限）。
            </Text>

            <Text style={styles.subTitle}>5.5 注销账号</Text>
            <Text style={styles.paragraph}>
              您可以在「设置 - 账号安全」页面申请注销账号。账号注销后，我们将停止为您提供服务，并根据法律法规要求删除您的个人信息。
            </Text>
          </View>

          {/* 六、未成年人保护 */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>六、未成年人保护</Text>
            <Text style={styles.paragraph}>
              我们非常重视对未成年人个人信息的保护。根据相关法律法规，若您是18周岁以下的未成年人，在使用我们的服务前，应事先取得您的家长或法定监护人的同意。
            </Text>
            <Text style={styles.paragraph}>
              若您是未成年人的家长或法定监护人，请您关注未成年人的使用情况。如发现未成年人在未取得您同意的情况下使用我们的服务，请及时联系我们。
            </Text>
          </View>

          {/* 七、本政策如何更新 */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>七、本政策如何更新</Text>
            <Text style={styles.paragraph}>
              我们可能会适时修订本隐私政策。未经您明确同意，我们不会削减您依据本政策所享有的权利。
            </Text>
            <Text style={styles.paragraph}>
              当隐私政策发生变更时，我们会在APP内通过弹窗、推送通知等方式向您告知变更内容。如您在变更后继续使用我们的服务，即表示您已充分阅读、理解并同意接受变更后的隐私政策。
            </Text>
          </View>

          {/* 八、如何联系我们 */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>八、如何联系我们</Text>
            <Text style={styles.paragraph}>
              如果您对本隐私政策有任何疑问、意见或建议，可以通过以下方式联系我们：
            </Text>
            <View style={styles.contactInfo}>
              <Text style={styles.contactItem}>客服电话：18552809300</Text>
              <Text style={styles.contactItem}>客服邮箱：kuaigongapp@foxmail.com</Text>
              <Text style={styles.contactItem}>工作时间：周一至周日 9:00-21:00</Text>
              <Text style={styles.contactItem}>公司地址：徐州市云龙区汉风街道绿地商务城B03号楼</Text>
            </View>
            <Text style={styles.paragraph}>
              我们将在15个工作日内回复您的请求。
            </Text>
          </View>

          {/* 附录 */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>附录：权限说明</Text>
            <View style={styles.permissionTable}>
              <View style={styles.permissionRow}>
                <Text style={styles.permissionName}>位置权限</Text>
                <Text style={styles.permissionDesc}>用于展示周边任务、提供导航服务</Text>
              </View>
              <View style={styles.permissionRow}>
                <Text style={styles.permissionName}>相机权限</Text>
                <Text style={styles.permissionDesc}>用于拍摄照片上传头像、任务图片</Text>
              </View>
              <View style={styles.permissionRow}>
                <Text style={styles.permissionName}>相册权限</Text>
                <Text style={styles.permissionDesc}>用于选择照片上传</Text>
              </View>
              <View style={styles.permissionRow}>
                <Text style={styles.permissionName}>通知权限</Text>
                <Text style={styles.permissionDesc}>用于接收订单、消息等重要通知</Text>
              </View>
            </View>
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>
              快工 版权所有 (c) 2024
            </Text>
          </View>
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
    backgroundColor: Colors.light.backgroundDefault,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  headerTitle: {
    ...Typography.h2,
    fontSize: 18,
    color: Colors.light.textPrimary,
  },
  container: {
    flex: 1,
    backgroundColor: Colors.light.backgroundRoot,
  },
  content: {
    padding: Spacing.lg,
  },
  updateInfo: {
    backgroundColor: Colors.light.backgroundTertiary,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing['2xl'],
  },
  updateLabel: {
    color: Colors.light.textSecondary,
    fontSize: 13,
    marginBottom: Spacing.xs,
  },
  section: {
    backgroundColor: Colors.light.backgroundDefault,
    borderRadius: BorderRadius['2xl'],
    padding: Spacing.xl,
    marginBottom: Spacing.lg,
    // 新拟态阴影
    shadowColor: Colors.light.shadowDark,
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 4,
  },
  sectionTitle: {
    ...Typography.h3,
    fontSize: 17,
    color: Colors.light.textPrimary,
    marginBottom: Spacing.lg,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  subTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.light.textPrimary,
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
  },
  paragraph: {
    fontSize: 14,
    lineHeight: 22,
    color: Colors.light.textSecondary,
    marginBottom: Spacing.md,
  },
  list: {
    marginLeft: Spacing.sm,
    marginBottom: Spacing.md,
  },
  listItem: {
    fontSize: 14,
    lineHeight: 22,
    color: Colors.light.textSecondary,
    marginBottom: Spacing.xs,
  },
  contactInfo: {
    backgroundColor: Colors.light.backgroundTertiary,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
  },
  contactItem: {
    fontSize: 14,
    color: Colors.light.textPrimary,
    marginBottom: Spacing.sm,
  },
  permissionTable: {
    marginTop: Spacing.sm,
  },
  permissionRow: {
    flexDirection: 'row',
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  permissionName: {
    width: 100,
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.primary,
  },
  permissionDesc: {
    flex: 1,
    fontSize: 14,
    color: Colors.light.textSecondary,
  },
  footer: {
    alignItems: 'center',
    paddingVertical: Spacing['3xl'],
  },
  footerText: {
    fontSize: 12,
    color: Colors.light.textMuted,
  },
});
