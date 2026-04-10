/**
 * 支付服务模块
 * 支持支付宝和微信支付
 */

import type AlipaySdkType from 'alipay-sdk';
import type { WxPay } from 'wxpay-sdk';

// 支付配置接口
interface PaymentConfig {
  // 支付宝配置
  alipayAppId?: string;
  alipayPrivateKey?: string;
  alipayPublicKey?: string;
  alipayNotifyUrl?: string;
  
  // 微信支付配置
  wechatAppId?: string;
  wechatMchId?: string;
  wechatApiKey?: string;
  wechatCertPath?: string;
  wechatNotifyUrl?: string;
}

// 支付配置（从环境变量读取）
const config: PaymentConfig = {
  alipayAppId: process.env.ALIPAY_APP_ID,
  alipayPrivateKey: process.env.ALIPAY_PRIVATE_KEY,
  alipayPublicKey: process.env.ALIPAY_PUBLIC_KEY,
  alipayNotifyUrl: process.env.ALIPAY_NOTIFY_URL || `${process.env.BACKEND_URL}/api/v1/payments/callback/alipay`,
  
  wechatAppId: process.env.WECHAT_APP_ID,
  wechatMchId: process.env.WECHAT_MCH_ID,
  wechatApiKey: process.env.WECHAT_API_KEY,
  wechatCertPath: process.env.WECHAT_CERT_PATH,
  wechatNotifyUrl: process.env.WECHAT_NOTIFY_URL || `${process.env.BACKEND_URL}/api/v1/payments/callback/wechat`,
};

// 支付宝SDK实例
let alipaySdk: any = null;

/**
 * 获取支付宝SDK实例
 */
async function getAlipaySdk(): Promise<any | null> {
  if (!config.alipayAppId || !config.alipayPrivateKey) {
    console.warn('[支付宝] 未配置支付宝支付参数');
    return null;
  }
  
  if (!alipaySdk) {
    const AlipayModule = await import('alipay-sdk');
    const AlipaySdkClass = AlipayModule.default;
    alipaySdk = new AlipaySdkClass({
      appId: config.alipayAppId,
      privateKey: config.alipayPrivateKey,
      alipayPublicKey: config.alipayPublicKey,
      signType: 'RSA2',
    });
  }
  
  return alipaySdk;
}

// 微信支付SDK实例
let wechatPay: any = null;

/**
 * 获取微信支付SDK实例
 */
async function getWechatPay(): Promise<any | null> {
  if (!config.wechatAppId || !config.wechatMchId || !config.wechatApiKey) {
    console.warn('[微信支付] 未配置微信支付参数');
    return null;
  }
  
  if (!wechatPay) {
    const WxPayModule = await import('wxpay-sdk');
    wechatPay = new WxPayModule.WxPay({
      mchId: config.wechatMchId,
      appId: config.wechatAppId,
      key: config.wechatApiKey,
      cert: config.wechatCertPath,
    });
  }
  
  return wechatPay;
}

/**
 * 支付宝支付结果
 */
export interface AlipayResult {
  success: boolean;
  message: string;
  qrCode?: string;        // 扫码支付二维码
  tradeNo?: string;       // 支付宝交易号
  outTradeNo?: string;    // 商户订单号
}

/**
 * 微信支付结果
 */
export interface WechatPayResult {
  success: boolean;
  message: string;
  codeUrl?: string;       // 扫码支付链接
  prepayId?: string;      // 预支付交易会话标识
  qrCode?: string;        // 生成的二维码内容
}

/**
 * 支付宝扫码支付
 * @param orderNo 商户订单号
 * @param amount 金额（元）
 * @param subject 商品标题
 * @returns 支付结果
 */
export async function alipayQrCodePay(
  orderNo: string,
  amount: number,
  subject: string
): Promise<AlipayResult> {
  const sdk = await getAlipaySdk();
  
  if (!sdk) {
    return {
      success: false,
      message: '支付宝支付未配置',
    };
  }
  
  try {
    const result = await sdk.exec(
      'alipay.trade.precreate',
      {
        outTradeNo: orderNo,
        totalAmount: amount.toFixed(2),
        subject: subject,
        storeId: config.alipayAppId,
        timeoutExpress: '30m',
      },
      {
        signType: 'RSA2',
        notifyUrl: config.alipayNotifyUrl,
      }
    );
    
    console.log('[支付宝] 扫码支付响应:', result);
    
    if (result?.code === '10000') {
      return {
        success: true,
        message: '订单创建成功',
        qrCode: result.qrCode, // 二维码链接
        outTradeNo: orderNo,
      };
    } else {
      return {
        success: false,
        message: result?.subMsg || '支付宝支付创建失败',
      };
    }
  } catch (error: any) {
    console.error('[支付宝] 支付异常:', error);
    return {
      success: false,
      message: error.message || '支付宝支付异常',
    };
  }
}

/**
 * 支付宝手机网页支付
 * @param orderNo 商户订单号
 * @param amount 金额（元）
 * @param subject 商品标题
 * @param returnUrl 支付完成后跳转URL
 * @returns 支付表单或链接
 */
export async function alipayWapPay(
  orderNo: string,
  amount: number,
  subject: string,
  returnUrl: string
): Promise<{ success: boolean; message: string; payUrl?: string }> {
  const sdk = await getAlipaySdk();
  
  if (!sdk) {
    return {
      success: false,
      message: '支付宝支付未配置',
    };
  }
  
  try {
    const result = await sdk.exec(
      'alipay.trade.wap.pay',
      {
        outTradeNo: orderNo,
        totalAmount: amount.toFixed(2),
        subject: subject,
        productCode: 'QUICK_WAP_WAY',
        quitUrl: returnUrl,
      },
      {
        signType: 'RSA2',
        notifyUrl: config.alipayNotifyUrl,
      }
    );
    
    if (result) {
      return {
        success: true,
        message: '支付链接创建成功',
        payUrl: result as string,
      };
    } else {
      return {
        success: false,
        message: '支付宝支付创建失败',
      };
    }
  } catch (error: any) {
    console.error('[支付宝] 支付异常:', error);
    return {
      success: false,
      message: error.message || '支付宝支付异常',
    };
  }
}

/**
 * 微信扫码支付
 * @param orderNo 商户订单号
 * @param amount 金额（元）
 * @param description 商品描述
 * @returns 支付结果
 */
export async function wechatQrCodePay(
  orderNo: string,
  amount: number,
  description: string
): Promise<WechatPayResult> {
  const sdk = await getWechatPay();
  
  if (!sdk) {
    return {
      success: false,
      message: '微信支付未配置',
    };
  }
  
  try {
    // 统一下单
    const unifiedOrderResult = await sdk.unifiedOrder({
      openid: '',
      body: description,
      out_trade_no: orderNo,
      total_fee: Math.round(amount * 100), // 转换为分
      spbill_create_ip: '127.0.0.1',
      notify_url: config.wechatNotifyUrl,
      trade_type: 'NATIVE',
    });
    
    console.log('[微信支付] 统一下单响应:', unifiedOrderResult);
    
    if (unifiedOrderResult.return_code === 'SUCCESS' && unifiedOrderResult.result_code === 'SUCCESS') {
      return {
        success: true,
        message: '订单创建成功',
        codeUrl: unifiedOrderResult.code_url, // 扫码支付链接
        prepayId: unifiedOrderResult.prepay_id,
      };
    } else {
      return {
        success: false,
        message: unifiedOrderResult.err_code_des || unifiedOrderResult.return_msg || '微信支付创建失败',
      };
    }
  } catch (error: any) {
    console.error('[微信支付] 支付异常:', error);
    return {
      success: false,
      message: error.message || '微信支付异常',
    };
  }
}

/**
 * 微信H5支付
 * @param orderNo 商户订单号
 * @param amount 金额（元）
 * @param description 商品描述
 * @param h5Info H5场景信息
 * @returns 支付结果
 */
export async function wechatH5Pay(
  orderNo: string,
  amount: number,
  description: string,
  h5Info: { wapUrl: string; wapName: string }
): Promise<{ success: boolean; message: string; payUrl?: string; mwebUrl?: string }> {
  const sdk = await getWechatPay();
  
  if (!sdk) {
    return {
      success: false,
      message: '微信支付未配置',
    };
  }
  
  try {
    const result = await sdk.unifiedOrder({
      body: description,
      out_trade_no: orderNo,
      total_fee: Math.round(amount * 100),
      spbill_create_ip: '127.0.0.1',
      notify_url: config.wechatNotifyUrl,
      trade_type: 'MWEB',
      scene_info: JSON.stringify({
        h5_info: {
          type: 'Wap',
          wap_url: h5Info.wapUrl,
          wap_name: h5Info.wapName,
        },
      }),
    });
    
    console.log('[微信支付] H5支付响应:', result);
    
    if (result.return_code === 'SUCCESS' && result.result_code === 'SUCCESS') {
      return {
        success: true,
        message: '支付链接创建成功',
        mwebUrl: result.mweb_url, // H5支付链接
      };
    } else {
      return {
        success: false,
        message: result.err_code_des || result.return_msg || '微信H5支付创建失败',
      };
    }
  } catch (error: any) {
    console.error('[微信支付] H5支付异常:', error);
    return {
      success: false,
      message: error.message || '微信H5支付异常',
    };
  }
}

/**
 * 查询支付宝交易状态
 */
export async function queryAlipayTrade(orderNo: string): Promise<{ success: boolean; status?: string; tradeNo?: string }> {
  const sdk = await getAlipaySdk();
  
  if (!sdk) {
    return { success: false };
  }
  
  try {
    const result = await sdk.exec(
      'alipay.trade.query',
      { out_trade_no: orderNo },
      { signType: 'RSA2' }
    );
    
    if (result?.code === '10000') {
      return {
        success: true,
        status: result.trade_status,
        tradeNo: result.trade_no,
      };
    }
    return { success: false };
  } catch (error) {
    console.error('[支付宝] 查询异常:', error);
    return { success: false };
  }
}

/**
 * 查询微信支付交易状态
 */
export async function queryWechatTrade(orderNo: string): Promise<{ success: boolean; status?: string; tradeNo?: string }> {
  const sdk = await getWechatPay();
  
  if (!sdk) {
    return { success: false };
  }
  
  try {
    const result = await sdk.orderQuery({ out_trade_no: orderNo });
    
    if (result.return_code === 'SUCCESS' && result.trade_state === 'SUCCESS') {
      return {
        success: true,
        status: result.trade_state,
        tradeNo: result.transaction_id,
      };
    }
    return { success: false, status: result.trade_state };
  } catch (error) {
    console.error('[微信支付] 查询异常:', error);
    return { success: false };
  }
}

/**
 * 检查支付是否已配置
 */
export function isPaymentConfigured(): { alipay: boolean; wechat: boolean } {
  return {
    alipay: !!(config.alipayAppId && config.alipayPrivateKey),
    wechat: !!(config.wechatAppId && config.wechatMchId && config.wechatApiKey),
  };
}
