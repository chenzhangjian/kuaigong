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

export default function UserAgreementScreen() {
  const router = useSafeRouter();

  return (
    <Screen>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={Colors.light.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>用户服务协议</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          {/* 更新日期 */}
          <View style={styles.updateInfo}>
            <Text style={styles.updateLabel}>更新日期：2024年1月1日</Text>
            <Text style={styles.updateLabel}>生效日期：2024年1月1日</Text>
          </View>

          {/* 特别提示 */}
          <View style={styles.notice}>
            <Ionicons name="information-circle" size={20} color={Colors.light.primary} />
            <Text style={styles.noticeText}>
              在使用快工服务前，请您务必仔细阅读并理解本协议。您使用快工APP服务即表示您已阅读并同意本协议的所有条款。
            </Text>
          </View>

          {/* 协议正文 */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>一、服务条款的确认和接纳</Text>
            <Text style={styles.paragraph}>
              1.1 快工（以下简称「本平台」）的各项服务的所有权和运营权归快工科技有限公司（以下简称「我们」）所有。
            </Text>
            <Text style={styles.paragraph}>
              1.2 用户在使用本平台提供的各项服务之前，应仔细阅读本服务协议。用户一旦注册使用本平台的服务，即视为用户已了解并完全同意本服务协议各项内容。
            </Text>
            <Text style={styles.paragraph}>
              1.3 我们有权在必要时修改本服务协议条款，条款一旦发生变动，将会在相关页面提示修改内容。如果不同意所改动的内容，用户可以主动取消获得的网络服务。
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>二、用户注册</Text>
            <Text style={styles.paragraph}>
              2.1 用户注册成功后，本平台将给予每个用户一个用户账号及相应的密码，该用户账号和密码由用户负责保管；用户应当对以其用户账号进行的所有活动和事件负法律责任。
            </Text>
            <Text style={styles.paragraph}>
              2.2 用户对以其用户账号进行的所有活动和事件负法律责任，因保管不当、黑客行为或第三方过失导致账号遭他人非法使用，我们不承担任何责任。
            </Text>
            <Text style={styles.paragraph}>
              2.3 用户同意接受本平台通过短信、邮件或其他方式向用户发送通知或商业信息。
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>三、用户账号安全</Text>
            <Text style={styles.paragraph}>
              3.1 用户一旦注册成功，成为本平台的用户，将得到一个用户名和密码，用户将对用户名和密码安全负全部责任。
            </Text>
            <Text style={styles.paragraph}>
              3.2 用户对以其用户账号进行的所有活动和事件负法律责任。
            </Text>
            <Text style={styles.paragraph}>
              3.3 用户若发现任何非法使用用户账号或安全漏洞的情况，请立即通告本平台。
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>四、使用规则</Text>
            <Text style={styles.paragraph}>
              4.1 用户在使用本平台服务过程中，必须遵循以下原则：
            </Text>
            <View style={styles.list}>
              <Text style={styles.listItem}>• 遵守中国有关的法律和法规</Text>
              <Text style={styles.listItem}>• 不得为任何非法目的而使用网络服务系统</Text>
              <Text style={styles.listItem}>• 遵守所有与网络服务有关的网络协议、规定和程序</Text>
              <Text style={styles.listItem}>• 不得利用本平台服务进行任何可能对互联网正常运转造成不利影响的行为</Text>
              <Text style={styles.listItem}>• 不得利用本平台服务传输任何骚扰性的、中伤他人的、辱骂性的、恐吓性的、庸俗淫秽的或其他任何非法的信息资料</Text>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>五、用户行为规范</Text>
            <Text style={styles.paragraph}>
              5.1 用户在使用本平台服务时，不得从事以下行为：
            </Text>
            <View style={styles.list}>
              <Text style={styles.listItem}>• 发布虚假任务或提供虚假信息</Text>
              <Text style={styles.listItem}>• 恶意接单后无故取消或拖延工作</Text>
              <Text style={styles.listItem}>• 诱导交易脱离平台进行私下交易</Text>
              <Text style={styles.listItem}>• 恶意差评或诽谤其他用户</Text>
              <Text style={styles.listItem}>• 利用平台漏洞谋取不正当利益</Text>
              <Text style={styles.listItem}>• 传播违法、淫秽、暴力等不良信息</Text>
            </View>
            <Text style={styles.paragraph}>
              5.2 对于违反上述规定的用户，我们有权采取警告、限制功能、暂停或终止服务等措施。
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>六、服务内容</Text>
            <Text style={styles.paragraph}>
              6.1 本平台提供的服务包括但不限于：任务发布、任务匹配、在线沟通、订单管理、在线支付、评价系统等。
            </Text>
            <Text style={styles.paragraph}>
              6.2 我们有权在提前通知或不通知的情况下，修改或中断服务，恕不另行通知。
            </Text>
            <Text style={styles.paragraph}>
              6.3 本平台不承担由于使用服务或无法使用服务导致的任何损失。
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>七、交易规则</Text>
            <Text style={styles.paragraph}>
              7.1 任务发布方应真实、准确地描述任务内容、要求和报酬。
            </Text>
            <Text style={styles.paragraph}>
              7.2 任务承接方应按时、按质完成约定的工作内容。
            </Text>
            <Text style={styles.paragraph}>
              7.3 所有交易应通过平台进行，禁止私下交易以规避平台监管。
            </Text>
            <Text style={styles.paragraph}>
              7.4 平台有权在必要时冻结争议资金，待纠纷解决后处理。
            </Text>
            <Text style={styles.paragraph}>
              7.5 平台收取的服务费用以页面显示为准。
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>八、知识产权</Text>
            <Text style={styles.paragraph}>
              8.1 本平台的所有内容，包括但不限于文字、图片、软件、音频、视频、图表、版面设计等，均为本平台所有，受中国版权法律保护。
            </Text>
            <Text style={styles.paragraph}>
              8.2 未经本平台书面许可，任何人不得擅自复制、传播、展示、修改或以其他方式使用上述内容。
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>九、免责声明</Text>
            <Text style={styles.paragraph}>
              9.1 本平台仅提供信息发布和交易撮合服务，不对用户发布的任务信息的真实性、准确性和合法性负责。
            </Text>
            <Text style={styles.paragraph}>
              9.2 因不可抗力或非本平台原因导致的服务中断或终止，本平台不承担责任。
            </Text>
            <Text style={styles.paragraph}>
              9.3 用户因使用本平台服务而产生的任何损失，本平台不承担责任。
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>十、争议解决</Text>
            <Text style={styles.paragraph}>
              10.1 本协议的订立、执行和解释及争议的解决均应适用中国法律。
            </Text>
            <Text style={styles.paragraph}>
              10.2 如双方就本协议内容或其执行发生任何争议，双方应尽量友好协商解决；协商不成时，任何一方均可向本平台所在地人民法院提起诉讼。
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>十一、联系我们</Text>
            <Text style={styles.paragraph}>
              如您对本协议有任何疑问，可通过以下方式联系我们：
            </Text>
            <View style={styles.contactInfo}>
              <Text style={styles.contactItem}>客服电话：18552809300</Text>
              <Text style={styles.contactItem}>客服邮箱：kuaigongapp@foxmail.com</Text>
              <Text style={styles.contactItem}>公司地址：徐州市云龙区汉风街道绿地商务城B03号楼</Text>
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
    marginBottom: Spacing.lg,
  },
  updateLabel: {
    color: Colors.light.textSecondary,
    fontSize: 13,
    marginBottom: Spacing.xs,
  },
  notice: {
    flexDirection: 'row',
    backgroundColor: `${Colors.light.primary}15`,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing['2xl'],
    alignItems: 'flex-start',
  },
  noticeText: {
    flex: 1,
    fontSize: 13,
    color: Colors.light.primary,
    marginLeft: Spacing.sm,
    lineHeight: 20,
  },
  section: {
    backgroundColor: Colors.light.backgroundDefault,
    borderRadius: BorderRadius['2xl'],
    padding: Spacing.xl,
    marginBottom: Spacing.lg,
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
  footer: {
    alignItems: 'center',
    paddingVertical: Spacing['3xl'],
  },
  footerText: {
    fontSize: 12,
    color: Colors.light.textMuted,
  },
});
