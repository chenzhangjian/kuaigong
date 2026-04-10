// wxpay-sdk 类型声明
declare module 'wxpay-sdk' {
  export class WxPay {
    constructor(config: {
      mchId: string;
      appId: string;
      key: string;
      cert?: string;
    });
    unifiedOrder(options: {
      body: string;
      out_trade_no: string;
      total_fee: number;
      spbill_create_ip: string;
      notify_url: string;
      trade_type: string;
      openid?: string;
      scene_info?: string;
    }): Promise<{
      return_code: string;
      return_msg?: string;
      result_code?: string;
      err_code?: string;
      err_code_des?: string;
      code_url?: string;
      mweb_url?: string;
      prepay_id?: string;
      transaction_id?: string;
      trade_state?: string;
    }>;
    orderQuery(options: { out_trade_no: string }): Promise<{
      return_code: string;
      return_msg?: string;
      result_code?: string;
      err_code?: string;
      err_code_des?: string;
      trade_state?: string;
      transaction_id?: string;
    }>;
  }
}

// alipay-sdk 补充类型
declare module 'alipay-sdk' {
  export interface AlipayConfig {
    appId: string;
    privateKey: string;
    alipayPublicKey?: string;
    signType?: 'RSA' | 'RSA2';
  }
  
  export interface AlipayExecResult {
    code?: string;
    msg?: string;
    subMsg?: string;
    qrCode?: string;
    outTradeNo?: string;
    tradeNo?: string;
    trade_status?: string;
  }
  
  export default class AlipaySdk {
    constructor(config: AlipayConfig);
    exec(
      method: string,
      bizContent: Record<string, any>,
      options?: { signType?: string; notifyUrl?: string }
    ): Promise<AlipayExecResult | string>;
  }
}
