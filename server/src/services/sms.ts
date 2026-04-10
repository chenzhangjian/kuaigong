/**
 * 短信服务模块
 * 支持阿里云短信 SDK 和开发环境模拟发送
 */

// 短信配置接口
interface SmsConfig {
  provider: 'aliyun' | 'mock';
  accessKeyId?: string;
  accessKeySecret?: string;
  signName?: string;
  templateCode?: string;
}

// 发送结果
interface SendResult {
  success: boolean;
  message: string;
  code?: string; // 开发环境返回验证码
  requestId?: string; // 真实发送返回的请求ID
}

// 短信配置（从环境变量读取）
const config: SmsConfig = {
  provider: process.env.SMS_PROVIDER === 'aliyun' ? 'aliyun' : 'mock',
  accessKeyId: process.env.ALIYUN_ACCESS_KEY_ID,
  accessKeySecret: process.env.ALIYUN_ACCESS_KEY_SECRET,
  signName: process.env.ALIYUN_SMS_SIGN_NAME || '快工',
  templateCode: process.env.ALIYUN_SMS_TEMPLATE_CODE || 'SMS_123456789',
};

// 是否为开发环境
const isDevelopment = process.env.NODE_ENV !== 'production';

// 阿里云 SDK 类型（延迟加载）
type AliyunClient = InstanceType<typeof import('@alicloud/dysmsapi20170525').default>;

// 阿里云客户端实例（懒加载）
let aliYunClient: AliyunClient | null = null;

/**
 * 获取阿里云客户端
 */
async function getAliYunClient(): Promise<AliyunClient> {
  if (!aliYunClient) {
    // 动态导入阿里云 SDK
    const DysmsModule = await import('@alicloud/dysmsapi20170525');
    const DysmsClient = DysmsModule.default;
    const OpenApi = await import('@alicloud/openapi-client');

    const clientConfig = new OpenApi.Config({
      accessKeyId: config.accessKeyId,
      accessKeySecret: config.accessKeySecret,
      endpoint: 'dysmsapi.aliyuncs.com',
    });
    aliYunClient = new DysmsClient(clientConfig);
  }
  return aliYunClient;
}

/**
 * 发送短信验证码（阿里云短信）
 */
async function sendAliyunSms(phone: string, code: string): Promise<SendResult> {
  try {
    const client = await getAliYunClient();
    const DysmsModule = await import('@alicloud/dysmsapi20170525');

    // 创建请求对象
    const sendSmsRequest = new DysmsModule.SendSmsRequest({
      phoneNumbers: phone,
      signName: config.signName!,
      templateCode: config.templateCode!,
      templateParam: JSON.stringify({ code, expire: '5' }),
    });

    const response = await client.sendSms(sendSmsRequest);

    if (response.body?.code === 'OK') {
      return {
        success: true,
        message: '验证码已发送',
        requestId: response.body.requestId,
      };
    } else {
      console.error('[阿里云短信] 发送失败:', response.body);
      return {
        success: false,
        message: response.body?.message || '发送失败',
      };
    }
  } catch (error: any) {
    console.error('[阿里云短信] 发送异常:', error);
    return {
      success: false,
      message: '短信服务异常，请稍后重试',
    };
  }
}

/**
 * 模拟发送验证码（开发环境）
 */
async function sendMockSms(phone: string, code: string): Promise<SendResult> {
  // 模拟网络延迟
  await new Promise((resolve) => setTimeout(resolve, 500));

  console.log(`[模拟短信] 发送验证码到 ${phone}: ${code}`);

  return {
    success: true,
    message: '验证码已发送',
  };
}

/**
 * 发送短信验证码
 * @param phone 手机号
 * @param code 验证码
 * @returns 发送结果
 */
export async function sendSmsCode(phone: string, code: string): Promise<SendResult> {
  // 如果配置为阿里云短信且已配置AccessKey，使用阿里云发送
  if (config.provider === 'aliyun' && config.accessKeyId && config.accessKeySecret) {
    return sendAliyunSms(phone, code);
  }

  // 否则使用模拟发送（开发环境或未配置阿里云）
  if (!config.accessKeyId || !config.accessKeySecret) {
    console.warn('[短信服务] 阿里云配置缺失，使用模拟发送');
  } else {
    console.log('[短信服务] 使用阿里云短信发送');
  }
  return sendMockSms(phone, code);
}

/**
 * 发送自定义短信内容
 * @param phone 手机号
 * @param templateCode 模板CODE
 * @param templateParam 模板参数
 */
export async function sendSms(
  phone: string,
  templateCode: string,
  templateParam: Record<string, any>
): Promise<SendResult> {
  if (isDevelopment || config.provider === 'mock') {
    console.log(`[模拟短信] 发送到 ${phone}, 模板: ${templateCode}, 参数:`, templateParam);
    return { success: true, message: '短信已发送（开发环境）' };
  }

  try {
    const client = getAliYunClient();

    const sendSmsRequest = new SendSmsRequest({
      phoneNumbers: phone,
      signName: config.signName!,
      templateCode,
      templateParam: JSON.stringify(templateParam),
    });

    const response = await client.sendSms(sendSmsRequest);

    if (response.body?.code === 'OK') {
      return {
        success: true,
        message: '短信已发送',
        requestId: response.body.requestId,
      };
    }

    return {
      success: false,
      message: response.body?.message || '发送失败',
    };
  } catch (error: any) {
    console.error('[短信服务] 发送异常:', error);
    return {
      success: false,
      message: '短信服务异常',
    };
  }
}

/**
 * 发送订单通知短信
 */
export async function sendOrderNotification(
  phone: string,
  orderType: string,
  orderTitle: string
): Promise<SendResult> {
  // 可以使用不同的模板CODE
  const templateCode = process.env.ALIYUN_SMS_ORDER_TEMPLATE || 'SMS_ORDER_TEMPLATE';
  return sendSms(phone, templateCode, { orderType, orderTitle });
}

/**
 * 发送提现通知短信
 */
export async function sendWithdrawNotification(
  phone: string,
  amount: string,
  status: string
): Promise<SendResult> {
  const templateCode = process.env.ALIYUN_SMS_WITHDRAW_TEMPLATE || 'SMS_WITHDRAW_TEMPLATE';
  return sendSms(phone, templateCode, { amount, status });
}

export default {
  sendSmsCode,
  sendSms,
  sendOrderNotification,
  sendWithdrawNotification,
};
