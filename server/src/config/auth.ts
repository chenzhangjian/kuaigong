/**
 * 认证配置模块
 * 统一管理JWT密钥和认证相关配置
 */

import crypto from 'crypto';

// 生成随机密钥（仅在未设置环境变量时使用）
const generateRandomKey = () => {
  return crypto.randomBytes(32).toString('hex');
};

// JWT密钥配置
export const JWT_SECRET = (() => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === 'production') {
      // 生产环境：使用随机密钥（每次重启会变化，需要重新登录）
      console.warn('[SECURITY WARNING] JWT_SECRET not set in production! Using random key. All users will need to re-login after server restart.');
      return generateRandomKey();
    }
    console.warn('[SECURITY WARNING] JWT_SECRET not set, using insecure fallback. Please configure JWT_SECRET!');
    return 'quick-work-secret-key-2024-INSECURE';
  }
  return secret;
})();

// 管理员JWT密钥配置
export const ADMIN_JWT_SECRET = (() => {
  const secret = process.env.ADMIN_JWT_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === 'production') {
      // 生产环境：使用随机密钥
      console.warn('[SECURITY WARNING] ADMIN_JWT_SECRET not set in production! Using random key. All admins will need to re-login after server restart.');
      return generateRandomKey();
    }
    console.warn('[SECURITY WARNING] ADMIN_JWT_SECRET not set, using insecure fallback. Please configure ADMIN_JWT_SECRET!');
    return 'admin-secret-key-2024-INSECURE';
  }
  return secret;
})();

// JWT过期时间配置
export const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';
export const ADMIN_JWT_EXPIRES_IN = process.env.ADMIN_JWT_EXPIRES_IN || '8h';

// 密码最小长度
export const PASSWORD_MIN_LENGTH = 6;

// 密码强度要求（正则表达式）
export const PASSWORD_STRENGTH_REGEX = /^(?=.*[a-zA-Z])(?=.*\d).{6,}$/;

// Token刷新阈值（小时）
export const TOKEN_REFRESH_THRESHOLD_HOURS = 24;
