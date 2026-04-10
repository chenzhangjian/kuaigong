/**
 * API请求频率限制中间件
 * 防止暴力破解、短信轰炸等攻击
 * 注意：需要在 Express 应用中设置 app.set('trust proxy', 1)
 */

import rateLimit from 'express-rate-limit';

// 通用API限制：每分钟100次请求
export const apiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1分钟
  max: 100, // 每分钟最多100次请求
  message: { error: '请求过于频繁，请稍后再试' },
  standardHeaders: true,
  legacyHeaders: false,
});

// 登录限制：每分钟5次尝试
export const loginLimiter = rateLimit({
  windowMs: 60 * 1000, // 1分钟
  max: 5, // 每分钟最多5次登录尝试
  message: { error: '登录尝试次数过多，请1分钟后再试' },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // 成功的请求不计入限制
});

// 注册限制：每小时5次
export const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1小时
  max: 5, // 每小时最多5次注册
  message: { error: '注册请求过于频繁，请1小时后再试' },
  standardHeaders: true,
  legacyHeaders: false,
});

// 短信验证码限制：每分钟1次
export const smsLimiter = rateLimit({
  windowMs: 60 * 1000, // 1分钟
  max: 1, // 每分钟最多1次
  message: { error: '验证码发送过于频繁，请1分钟后再试' },
  standardHeaders: true,
  legacyHeaders: false,
});

// 密码重置限制：每小时3次
export const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1小时
  max: 3, // 每小时最多3次
  message: { error: '密码重置请求过于频繁，请1小时后再试' },
  standardHeaders: true,
  legacyHeaders: false,
});

// 提现限制：每天10次
export const withdrawLimiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000, // 24小时
  max: 10, // 每天最多10次提现
  message: { error: '今日提现次数已达上限，请明天再试' },
  standardHeaders: true,
  legacyHeaders: false,
});

// 充值限制：每分钟10次
export const rechargeLimiter = rateLimit({
  windowMs: 60 * 1000, // 1分钟
  max: 10, // 每分钟最多10次充值请求
  message: { error: '充值请求过于频繁，请稍后再试' },
  standardHeaders: true,
  legacyHeaders: false,
});

// 管理员API限制：每秒10次
export const adminLimiter = rateLimit({
  windowMs: 1000, // 1秒
  max: 10, // 每秒最多10次请求
  message: { error: '管理后台请求过于频繁' },
  standardHeaders: true,
  legacyHeaders: false,
});
