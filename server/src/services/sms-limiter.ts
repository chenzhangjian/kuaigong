/**
 * 短信发送频率限制服务
 * 使用数据库实现频率限制
 */

import pool from '../db';

// 频率限制配置
const LIMITS = {
  // 单个手机号限制
  perPhone: {
    windowSeconds: 60,      // 时间窗口：60秒
    maxAttempts: 1,         // 最多发送次数
  },
  // 单个手机号每日限制
  perPhoneDaily: {
    maxAttempts: 10,        // 每天最多发送10次
  },
  // 单个IP限制
  perIp: {
    windowSeconds: 60,      // 时间窗口：60秒
    maxAttempts: 5,         // 最多发送5次
  },
  // 单个IP每日限制
  perIpDaily: {
    maxAttempts: 50,        // 每天最多发送50次
  },
};

interface LimitCheckResult {
  allowed: boolean;
  reason?: string;
  retryAfter?: number; // 多少秒后可重试
}

/**
 * 检查手机号发送频率限制
 */
export async function checkPhoneLimit(phone: string): Promise<LimitCheckResult> {
  try {
    // 检查60秒内是否已发送
    const recentResult = await pool.query(
      `SELECT created_at FROM sms_rate_limits 
       WHERE phone = $1 AND created_at > CURRENT_TIMESTAMP - INTERVAL '${LIMITS.perPhone.windowSeconds} seconds'
       ORDER BY created_at DESC LIMIT 1`,
      [phone]
    );

    if (recentResult.rows.length >= LIMITS.perPhone.maxAttempts) {
      const lastSent = new Date(recentResult.rows[0].created_at);
      const retryAfter = Math.ceil(
        (lastSent.getTime() + LIMITS.perPhone.windowSeconds * 1000 - Date.now()) / 1000
      );
      return {
        allowed: false,
        reason: '发送太频繁，请稍后再试',
        retryAfter: Math.max(retryAfter, 1),
      };
    }

    // 检查当日发送次数
    const dailyResult = await pool.query(
      `SELECT COUNT(*) as count FROM sms_rate_limits 
       WHERE phone = $1 AND created_at > CURRENT_DATE`,
      [phone]
    );

    const dailyCount = parseInt(dailyResult.rows[0].count, 10);
    if (dailyCount >= LIMITS.perPhoneDaily.maxAttempts) {
      return {
        allowed: false,
        reason: `今日发送次数已达上限（${LIMITS.perPhoneDaily.maxAttempts}次）`,
        retryAfter: 86400, // 等到明天
      };
    }

    return { allowed: true };
  } catch (error) {
    console.error('[频率限制] 检查手机号限制失败:', error);
    // 出错时允许发送，避免阻塞用户
    return { allowed: true };
  }
}

/**
 * 检查IP发送频率限制
 */
export async function checkIpLimit(ip: string): Promise<LimitCheckResult> {
  if (!ip) return { allowed: true };

  try {
    // 检查60秒内IP发送次数
    const recentResult = await pool.query(
      `SELECT COUNT(*) as count FROM sms_rate_limits 
       WHERE ip_address = $1 AND created_at > CURRENT_TIMESTAMP - INTERVAL '${LIMITS.perIp.windowSeconds} seconds'`,
      [ip]
    );

    const recentCount = parseInt(recentResult.rows[0].count, 10);
    if (recentCount >= LIMITS.perIp.maxAttempts) {
      return {
        allowed: false,
        reason: '请求过于频繁，请稍后再试',
        retryAfter: LIMITS.perIp.windowSeconds,
      };
    }

    // 检查当日IP发送次数
    const dailyResult = await pool.query(
      `SELECT COUNT(*) as count FROM sms_rate_limits 
       WHERE ip_address = $1 AND created_at > CURRENT_DATE`,
      [ip]
    );

    const dailyCount = parseInt(dailyResult.rows[0].count, 10);
    if (dailyCount >= LIMITS.perIpDaily.maxAttempts) {
      return {
        allowed: false,
        reason: '今日请求次数已达上限',
        retryAfter: 86400,
      };
    }

    return { allowed: true };
  } catch (error) {
    console.error('[频率限制] 检查IP限制失败:', error);
    return { allowed: true };
  }
}

/**
 * 记录发送日志
 */
export async function recordSmsSend(
  phone: string,
  ip: string,
  type: string,
  success: boolean
): Promise<void> {
  try {
    await pool.query(
      `INSERT INTO sms_rate_limits (phone, ip_address, type, success, created_at)
       VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)`,
      [phone, ip || null, type, success]
    );
  } catch (error) {
    console.error('[频率限制] 记录发送日志失败:', error);
  }
}

/**
 * 清理过期的频率限制记录（可定期执行）
 */
export async function cleanupExpiredRecords(): Promise<void> {
  try {
    // 删除7天前的记录
    await pool.query(
      `DELETE FROM sms_rate_limits WHERE created_at < CURRENT_DATE - INTERVAL '7 days'`
    );
  } catch (error) {
    console.error('[频率限制] 清理过期记录失败:', error);
  }
}

/**
 * 综合检查（手机号 + IP）
 */
export async function checkRateLimit(
  phone: string,
  ip: string
): Promise<LimitCheckResult> {
  // 先检查手机号限制
  const phoneCheck = await checkPhoneLimit(phone);
  if (!phoneCheck.allowed) {
    return phoneCheck;
  }

  // 再检查IP限制
  const ipCheck = await checkIpLimit(ip);
  if (!ipCheck.allowed) {
    return ipCheck;
  }

  return { allowed: true };
}

export default {
  checkPhoneLimit,
  checkIpLimit,
  checkRateLimit,
  recordSmsSend,
  cleanupExpiredRecords,
};
