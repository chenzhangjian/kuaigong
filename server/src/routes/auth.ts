import express, { type Request, type Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { body, validationResult } from 'express-validator';
import multer from 'multer';
import pool from '../db';
import { S3Storage } from 'coze-coding-dev-sdk';
import { sendSmsCode } from '../services/sms';
import { checkRateLimit, recordSmsSend } from '../services/sms-limiter';
import { JWT_SECRET, JWT_EXPIRES_IN, PASSWORD_MIN_LENGTH } from '../config/auth';
import { loginLimiter, registerLimiter, smsLimiter, passwordResetLimiter } from '../middleware/rateLimit';

const router = express.Router();

// 初始化对象存储
const storage = new S3Storage({
  endpointUrl: process.env.COZE_BUCKET_ENDPOINT_URL,
  accessKey: '',
  secretKey: '',
  bucketName: process.env.COZE_BUCKET_NAME,
  region: 'cn-beijing',
});

// 配置 multer 用于文件上传
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 最大 5MB
  },
});

// 用户注册
router.post('/register', registerLimiter, [
  body('phone').isMobilePhone('zh-CN').withMessage('请输入有效的手机号'),
  body('password').isLength({ min: PASSWORD_MIN_LENGTH }).withMessage(`密码至少${PASSWORD_MIN_LENGTH}位`)
    .matches(/^(?=.*[a-zA-Z])(?=.*\d).+/).withMessage('密码必须包含字母和数字'),
  body('userType').isIn(['worker', 'employer']).withMessage('请选择用户类型'),
], async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { phone, password, userType, nickname } = req.body;

    // 检查用户是否已存在
    const existingUser = await pool.query(
      'SELECT id FROM users WHERE phone = $1',
      [phone]
    );

    if (existingUser.rows.length > 0) {
      return res.status(400).json({ error: '该手机号已注册' });
    }

    // 加密密码
    const passwordHash = await bcrypt.hash(password, 10);

    // 创建用户
    const result = await pool.query(
      `INSERT INTO users (phone, password_hash, user_type, nickname, rating)
       VALUES ($1, $2, $3, $4, 5.00)
       RETURNING id, phone, nickname, user_type, rating, created_at`,
      [phone, passwordHash, userType, nickname || `用户${phone.slice(-4)}`]
    );

    const user = result.rows[0];

    // 生成 JWT token
    const token = jwt.sign(
      { userId: user.id, userType: user.user_type },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN } as jwt.SignOptions
    );

    res.status(201).json({
      user: {
        id: user.id,
        phone: user.phone,
        nickname: user.nickname,
        userType: user.user_type,
        rating: user.rating,
      },
      token,
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: '注册失败，请重试' });
  }
});

// 用户登录
router.post('/login', loginLimiter, [
  body('phone').isMobilePhone('zh-CN').withMessage('请输入有效的手机号'),
  body('password').notEmpty().withMessage('请输入密码'),
], async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { phone, password } = req.body;

    // 查找用户
    const result = await pool.query(
      'SELECT * FROM users WHERE phone = $1',
      [phone]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: '手机号或密码错误' });
    }

    const user = result.rows[0];

    // 验证密码
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      return res.status(401).json({ error: '手机号或密码错误' });
    }

    // 生成 JWT token
    const token = jwt.sign(
      { userId: user.id, userType: user.user_type },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN } as jwt.SignOptions
    );

    res.json({
      user: {
        id: user.id,
        phone: user.phone,
        nickname: user.nickname,
        avatarUrl: user.avatar_url,
        userType: user.user_type,
        rating: user.rating,
        skills: user.skills || [],
        bio: user.bio,
        totalOrders: user.total_orders,
        balance: user.balance,
      },
      token,
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: '登录失败，请重试' });
  }
});

// 获取当前用户信息
router.get('/me', async (req: any, res: any) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ error: '未登录' });
    }

    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    
    const result = await pool.query(
      `SELECT id, phone, nickname, avatar_url, user_type, rating, skills, bio,
              total_orders, completed_orders, balance, is_verified
       FROM users WHERE id = $1`,
      [decoded.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: '用户不存在' });
    }

    const user = result.rows[0];
    res.json({
      id: user.id,
      phone: user.phone,
      nickname: user.nickname,
      avatarUrl: user.avatar_url,
      userType: user.user_type,
      rating: user.rating,
      skills: user.skills || [],
      bio: user.bio,
      totalOrders: user.total_orders,
      completedOrders: user.completed_orders,
      balance: user.balance,
      isVerified: user.is_verified,
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(401).json({ error: 'token无效' });
  }
});

// 更新用户信息
router.put('/profile', async (req: any, res: any) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ error: '未登录' });
    }

    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    const { nickname, bio, skills, avatarUrl } = req.body;

    const result = await pool.query(
      `UPDATE users 
       SET nickname = COALESCE($1, nickname),
           bio = COALESCE($2, bio),
           skills = COALESCE($3, skills),
           avatar_url = COALESCE($4, avatar_url),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $5
       RETURNING id, nickname, bio, skills, avatar_url`,
      [nickname, bio, skills, avatarUrl, decoded.userId]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: '更新失败' });
  }
});

// 上传头像
router.post('/avatar', upload.single('file'), async (req: any, res: any) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ error: '未登录' });
    }

    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    const file = req.file;

    if (!file) {
      return res.status(400).json({ error: '请选择要上传的图片' });
    }

    // 验证文件类型
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg'];
    if (!allowedTypes.includes(file.mimetype)) {
      return res.status(400).json({ error: '只支持 JPG、PNG 格式的图片' });
    }

    // 上传到对象存储
    const fileKey = await storage.uploadFile({
      fileContent: file.buffer,
      fileName: `avatars/${decoded.userId}_${Date.now()}.${file.originalname.split('.').pop()}`,
      contentType: file.mimetype,
    });

    // 生成签名URL
    const signedUrl = await storage.generatePresignedUrl({
      key: fileKey,
      expireTime: 86400 * 30, // 30天有效期
    });

    // 更新用户头像URL
    await pool.query(
      'UPDATE users SET avatar_url = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [signedUrl, decoded.userId]
    );

    res.json({
      success: true,
      avatarUrl: signedUrl,
      avatarKey: fileKey,
    });
  } catch (error) {
    console.error('Upload avatar error:', error);
    res.status(500).json({ error: '上传头像失败' });
  }
});

// 修改密码
router.post('/change-password', [
  body('oldPassword').notEmpty().withMessage('请输入当前密码'),
  body('newPassword').isLength({ min: 6 }).withMessage('新密码至少6位'),
], async (req: any, res: any) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ error: '未登录' });
    }

    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    const { oldPassword, newPassword } = req.body;

    // 查询用户
    const result = await pool.query(
      'SELECT password_hash FROM users WHERE id = $1',
      [decoded.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: '用户不存在' });
    }

    const user = result.rows[0];

    // 验证旧密码
    const isValidPassword = await bcrypt.compare(oldPassword, user.password_hash);
    if (!isValidPassword) {
      return res.status(400).json({ error: '当前密码错误' });
    }

    // 加密新密码
    const newPasswordHash = await bcrypt.hash(newPassword, 10);

    // 更新密码
    await pool.query(
      'UPDATE users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [newPasswordHash, decoded.userId]
    );

    res.json({ success: true, message: '密码修改成功' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ error: '修改密码失败' });
  }
});

// 获取用户设置
router.get('/settings', async (req: any, res: any) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ error: '未登录' });
    }

    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };

    const result = await pool.query(
      `SELECT notification_enabled, push_enabled, language, theme
       FROM user_settings WHERE user_id = $1`,
      [decoded.userId]
    );

    if (result.rows.length === 0) {
      // 返回默认设置
      return res.json({
        notificationEnabled: true,
        pushEnabled: true,
        language: 'zh-CN',
        theme: 'light',
      });
    }

    const settings = result.rows[0];
    res.json({
      notificationEnabled: settings.notification_enabled ?? true,
      pushEnabled: settings.push_enabled ?? true,
      language: settings.language || 'zh-CN',
      theme: settings.theme || 'light',
    });
  } catch (error) {
    console.error('Get settings error:', error);
    res.status(500).json({ error: '获取设置失败' });
  }
});

// 更新用户设置
router.put('/settings', async (req: any, res: any) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ error: '未登录' });
    }

    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    const { notificationEnabled, pushEnabled, language, theme } = req.body;

    // 使用 upsert 语法
    await pool.query(
      `INSERT INTO user_settings (user_id, notification_enabled, push_enabled, language, theme, updated_at)
       VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)
       ON CONFLICT (user_id)
       DO UPDATE SET
         notification_enabled = COALESCE($2, user_settings.notification_enabled),
         push_enabled = COALESCE($3, user_settings.push_enabled),
         language = COALESCE($4, user_settings.language),
         theme = COALESCE($5, user_settings.theme),
         updated_at = CURRENT_TIMESTAMP`,
      [decoded.userId, notificationEnabled, pushEnabled, language, theme]
    );

    res.json({ success: true, message: '设置已保存' });
  } catch (error) {
    console.error('Update settings error:', error);
    res.status(500).json({ error: '保存设置失败' });
  }
});

// 注销账号
router.post('/deactivate', async (req: any, res: any) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ error: '未登录' });
    }

    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    const { reason } = req.body;

    // 标记用户为已注销（软删除）
    await pool.query(
      `UPDATE users 
       SET is_active = FALSE, 
           deactivated_at = CURRENT_TIMESTAMP,
           deactivation_reason = $1,
           phone = phone || '_deactivated_' || EXTRACT(EPOCH FROM NOW())::text,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $2`,
      [reason || null, decoded.userId]
    );

    res.json({ success: true, message: '账号已注销' });
  } catch (error) {
    console.error('Deactivate account error:', error);
    res.status(500).json({ error: '注销账号失败' });
  }
});

// ==================== 验证码相关 ====================

// 生成6位随机验证码
const generateCode = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// 清理过期的验证码
const cleanExpiredCodes = async () => {
  await pool.query(
    'DELETE FROM verification_codes WHERE expires_at < CURRENT_TIMESTAMP'
  );
};

/**
 * POST /api/v1/auth/send-code
 * 发送验证码
 * Body: { phone: string, type: 'login' | 'register' | 'reset_password' }
 */
router.post('/send-code', smsLimiter, [
  body('phone').isMobilePhone('zh-CN').withMessage('请输入有效的手机号'),
  body('type').isIn(['login', 'register', 'reset_password']).withMessage('无效的验证码类型'),
], async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { phone, type } = req.body;

    // 清理过期验证码
    await cleanExpiredCodes();

    // 获取客户端IP
    const clientIp = req.ip || req.headers['x-forwarded-for'] as string || 'unknown';

    // 检查发送频率限制
    const rateLimitCheck = await checkRateLimit(phone, clientIp);
    if (!rateLimitCheck.allowed) {
      return res.status(429).json({ 
        error: rateLimitCheck.reason,
        retryAfter: rateLimitCheck.retryAfter 
      });
    }

    // 检查业务逻辑
    if (type === 'register') {
      // 注册时检查手机号是否已存在
      const existingUser = await pool.query('SELECT id FROM users WHERE phone = $1', [phone]);
      if (existingUser.rows.length > 0) {
        return res.status(400).json({ error: '该手机号已注册' });
      }
    } else if (type === 'login' || type === 'reset_password') {
      // 登录/重置密码时检查用户是否存在
      const existingUser = await pool.query('SELECT id FROM users WHERE phone = $1', [phone]);
      if (existingUser.rows.length === 0) {
        return res.status(400).json({ error: '该手机号未注册' });
      }
    }

    // 生成验证码
    const code = generateCode();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5分钟后过期

    // 保存验证码到数据库
    await pool.query(
      `INSERT INTO verification_codes (phone, code, type, expires_at)
       VALUES ($1, $2, $3, $4)`,
      [phone, code, type, expiresAt]
    );

    // 发送短信验证码
    const smsResult = await sendSmsCode(phone, code);

    // 记录发送日志
    await recordSmsSend(phone, clientIp, type, smsResult.success);

    if (!smsResult.success) {
      return res.status(500).json({ error: smsResult.message });
    }

    console.log(`[验证码] 手机号: ${phone}, 类型: ${type}, 验证码: ${code}, 发送结果: ${smsResult.message}`);

    res.json({
      success: true,
      message: smsResult.message,
      // 开发环境返回验证码，方便测试
      ...(smsResult.code && { code: smsResult.code }),
    });
  } catch (error) {
    console.error('Send code error:', error);
    res.status(500).json({ error: '发送验证码失败' });
  }
});

/**
 * POST /api/v1/auth/login-with-code
 * 验证码登录
 * Body: { phone: string, code: string }
 */
router.post('/login-with-code', [
  body('phone').isMobilePhone('zh-CN').withMessage('请输入有效的手机号'),
  body('code').isLength({ min: 6, max: 6 }).withMessage('请输入6位验证码'),
], async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { phone, code } = req.body;

    // 清理过期验证码
    await cleanExpiredCodes();

    // 验证验证码
    const codeResult = await pool.query(
      `SELECT id FROM verification_codes 
       WHERE phone = $1 AND code = $2 AND type = 'login' AND is_used = FALSE AND expires_at > CURRENT_TIMESTAMP`,
      [phone, code]
    );

    if (codeResult.rows.length === 0) {
      return res.status(400).json({ error: '验证码错误或已过期' });
    }

    // 标记验证码已使用
    await pool.query(
      'UPDATE verification_codes SET is_used = TRUE, used_at = CURRENT_TIMESTAMP WHERE id = $1',
      [codeResult.rows[0].id]
    );

    // 查询用户
    const userResult = await pool.query(
      `SELECT id, phone, nickname, avatar_url, user_type, rating, skills, bio,
              total_orders, completed_orders, balance, is_verified
       FROM users WHERE phone = $1`,
      [phone]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: '用户不存在' });
    }

    const user = userResult.rows[0];

    // 生成 JWT token
    const token = jwt.sign(
      { userId: user.id, userType: user.user_type },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN } as jwt.SignOptions
    );

    res.json({
      user: {
        id: user.id,
        phone: user.phone,
        nickname: user.nickname,
        avatarUrl: user.avatar_url,
        userType: user.user_type,
        rating: user.rating,
        skills: user.skills || [],
        bio: user.bio,
        totalOrders: user.total_orders,
        completedOrders: user.completed_orders,
        balance: user.balance,
        isVerified: user.is_verified,
      },
      token,
    });
  } catch (error) {
    console.error('Login with code error:', error);
    res.status(500).json({ error: '登录失败' });
  }
});

/**
 * POST /api/v1/auth/register-with-code
 * 验证码注册
 * Body: { phone: string, code: string, password: string, userType: 'worker' | 'employer', nickname?: string }
 */
router.post('/register-with-code', [
  body('phone').isMobilePhone('zh-CN').withMessage('请输入有效的手机号'),
  body('code').isLength({ min: 6, max: 6 }).withMessage('请输入6位验证码'),
  body('password').isLength({ min: 6 }).withMessage('密码至少6位'),
  body('userType').isIn(['worker', 'employer']).withMessage('请选择用户类型'),
], async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { phone, code, password, userType, nickname } = req.body;

    // 清理过期验证码
    await cleanExpiredCodes();

    // 验证验证码
    const codeResult = await pool.query(
      `SELECT id FROM verification_codes 
       WHERE phone = $1 AND code = $2 AND type = 'register' AND is_used = FALSE AND expires_at > CURRENT_TIMESTAMP`,
      [phone, code]
    );

    if (codeResult.rows.length === 0) {
      return res.status(400).json({ error: '验证码错误或已过期' });
    }

    // 标记验证码已使用
    await pool.query(
      'UPDATE verification_codes SET is_used = TRUE, used_at = CURRENT_TIMESTAMP WHERE id = $1',
      [codeResult.rows[0].id]
    );

    // 检查用户是否已存在
    const existingUser = await pool.query('SELECT id FROM users WHERE phone = $1', [phone]);
    if (existingUser.rows.length > 0) {
      return res.status(400).json({ error: '该手机号已注册' });
    }

    // 加密密码
    const passwordHash = await bcrypt.hash(password, 10);

    // 创建用户
    const result = await pool.query(
      `INSERT INTO users (phone, password_hash, user_type, nickname, rating)
       VALUES ($1, $2, $3, $4, 5.00)
       RETURNING id, phone, nickname, user_type, rating, created_at`,
      [phone, passwordHash, userType, nickname || `用户${phone.slice(-4)}`]
    );

    const user = result.rows[0];

    // 生成 JWT token
    const token = jwt.sign(
      { userId: user.id, userType: user.user_type },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN } as jwt.SignOptions
    );

    res.status(201).json({
      user: {
        id: user.id,
        phone: user.phone,
        nickname: user.nickname,
        userType: user.user_type,
        rating: user.rating,
      },
      token,
    });
  } catch (error) {
    console.error('Register with code error:', error);
    res.status(500).json({ error: '注册失败' });
  }
});

/**
 * POST /api/v1/auth/reset-password
 * 重置密码
 * Body: { phone: string, code: string, newPassword: string }
 */
router.post('/reset-password', passwordResetLimiter, [
  body('phone').isMobilePhone('zh-CN').withMessage('请输入有效的手机号'),
  body('code').isLength({ min: 6, max: 6 }).withMessage('请输入6位验证码'),
  body('newPassword').isLength({ min: PASSWORD_MIN_LENGTH }).withMessage(`新密码至少${PASSWORD_MIN_LENGTH}位`)
    .matches(/^(?=.*[a-zA-Z])(?=.*\d).+/).withMessage('密码必须包含字母和数字'),
], async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { phone, code, newPassword } = req.body;

    // 清理过期验证码
    await cleanExpiredCodes();

    // 验证验证码
    const codeResult = await pool.query(
      `SELECT id FROM verification_codes 
       WHERE phone = $1 AND code = $2 AND type = 'reset_password' AND is_used = FALSE AND expires_at > CURRENT_TIMESTAMP`,
      [phone, code]
    );

    if (codeResult.rows.length === 0) {
      return res.status(400).json({ error: '验证码错误或已过期' });
    }

    // 标记验证码已使用
    await pool.query(
      'UPDATE verification_codes SET is_used = TRUE, used_at = CURRENT_TIMESTAMP WHERE id = $1',
      [codeResult.rows[0].id]
    );

    // 检查用户是否存在
    const userResult = await pool.query('SELECT id FROM users WHERE phone = $1', [phone]);
    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: '用户不存在' });
    }

    // 加密新密码
    const passwordHash = await bcrypt.hash(newPassword, 10);

    // 更新密码
    await pool.query(
      'UPDATE users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [passwordHash, userResult.rows[0].id]
    );

    res.json({ success: true, message: '密码重置成功' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ error: '重置密码失败' });
  }
});

/**
 * POST /api/v1/auth/verify-reset-code
 * 验证重置密码的验证码（不实际重置）
 * Body: { phone: string, code: string }
 */
router.post('/verify-reset-code', [
  body('phone').isMobilePhone('zh-CN').withMessage('请输入有效的手机号'),
  body('code').isLength({ min: 6, max: 6 }).withMessage('请输入6位验证码'),
], async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { phone, code } = req.body;

    // 清理过期验证码
    await cleanExpiredCodes();

    // 验证验证码
    const codeResult = await pool.query(
      `SELECT id FROM verification_codes 
       WHERE phone = $1 AND code = $2 AND type = 'reset_password' AND is_used = FALSE AND expires_at > CURRENT_TIMESTAMP`,
      [phone, code]
    );

    if (codeResult.rows.length === 0) {
      return res.status(400).json({ error: '验证码错误或已过期' });
    }

    res.json({ success: true, message: '验证码有效' });
  } catch (error) {
    console.error('Verify reset code error:', error);
    res.status(500).json({ error: '验证失败' });
  }
});

export default router;
