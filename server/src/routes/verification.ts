import express, { type Request, type Response } from 'express';
import { body, validationResult } from 'express-validator';
import jwt from 'jsonwebtoken';
import multer from 'multer';
import pool from '../db';
import { S3Storage } from 'coze-coding-dev-sdk';
import { JWT_SECRET, ADMIN_JWT_SECRET } from '../config/auth';

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

// 认证中间件
const authMiddleware = async (req: Request, res: Response, next: express.NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: '请先登录' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: number };
    (req as any).userId = decoded.userId;
    next();
  } catch (error) {
    return res.status(401).json({ error: '登录已过期，请重新登录' });
  }
};

// 管理员认证中间件
interface AdminRequest extends Request {
  admin?: { adminId: number; username: string; role: string };
}

const adminAuthMiddleware = async (req: Request, res: Response, next: express.NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: '请先登录' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, ADMIN_JWT_SECRET) as { adminId: number; username: string; role: string };
    
    // 验证管理员是否存在且状态正常
    const adminResult = await pool.query(
      'SELECT id, username, role, status FROM admins WHERE id = $1',
      [decoded.adminId]
    );

    if (adminResult.rows.length === 0) {
      return res.status(401).json({ error: '管理员账号不存在' });
    }

    const admin = adminResult.rows[0];
    if (admin.status !== 'active') {
      return res.status(403).json({ error: '管理员账号已被禁用' });
    }

    (req as AdminRequest).admin = {
      adminId: admin.id,
      username: admin.username,
      role: admin.role,
    };
    next();
  } catch (error) {
    return res.status(401).json({ error: '登录已过期，请重新登录' });
  }
};

/**
 * GET /api/v1/verification/status
 * 获取当前用户的实名认证状态
 */
router.get('/status', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;

    // 查询认证记录
    const result = await pool.query(
      `SELECT id, real_name, id_card_number, status, reject_reason, submitted_at, reviewed_at,
              disclaimer_signed_at, disclaimer_version
       FROM verifications 
       WHERE user_id = $1`,
      [userId]
    );

    if (result.rows.length === 0) {
      return res.json({
        hasSubmitted: false,
        status: 'not_submitted',
      });
    }

    const verification = result.rows[0];

    // 隐藏身份证号中间部分
    const maskedIdCard = verification.id_card_number.slice(0, 4) + '**********' + verification.id_card_number.slice(-4);

    res.json({
      hasSubmitted: true,
      status: verification.status,
      realName: verification.real_name,
      idCardNumber: maskedIdCard,
      rejectReason: verification.reject_reason,
      submittedAt: verification.submitted_at,
      reviewedAt: verification.reviewed_at,
      disclaimerSignedAt: verification.disclaimer_signed_at,
      disclaimerVersion: verification.disclaimer_version,
    });
  } catch (error) {
    console.error('Get verification status error:', error);
    res.status(500).json({ error: '获取认证状态失败' });
  }
});

/**
 * POST /api/v1/verification/submit
 * 提交实名认证申请
 * Body: { realName: string, idCardNumber: string, idCardFrontKey: string, idCardBackKey: string }
 */
router.post('/submit', [
  authMiddleware,
  body('realName').trim().notEmpty().withMessage('请输入真实姓名')
    .isLength({ min: 2, max: 20 }).withMessage('姓名长度应在2-20个字符之间'),
  body('idCardNumber').trim().notEmpty().withMessage('请输入身份证号')
    .matches(/^[1-9]\d{5}(18|19|20)\d{2}(0[1-9]|1[0-2])(0[1-9]|[12]\d|3[01])\d{3}[\dXx]$/)
    .withMessage('请输入有效的身份证号'),
  body('idCardFrontKey').trim().notEmpty().withMessage('请上传身份证正面照'),
  body('idCardBackKey').trim().notEmpty().withMessage('请上传身份证背面照'),
], async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const userId = (req as any).userId;
    const { realName, idCardNumber, idCardFrontKey, idCardBackKey } = req.body;

    // 检查是否已有认证记录
    const existingVerification = await pool.query(
      'SELECT id, status FROM verifications WHERE user_id = $1',
      [userId]
    );

    if (existingVerification.rows.length > 0) {
      const status = existingVerification.rows[0].status;
      if (status === 'approved') {
        return res.status(400).json({ error: '您已完成实名认证' });
      }
      if (status === 'pending') {
        return res.status(400).json({ error: '您的认证申请正在审核中，请耐心等待' });
      }
      // rejected 状态允许重新提交
      await pool.query(
        `UPDATE verifications 
         SET real_name = $1, id_card_number = $2, id_card_front_key = $3, id_card_back_key = $4,
             status = 'pending', reject_reason = NULL, submitted_at = CURRENT_TIMESTAMP, 
             reviewed_at = NULL, reviewed_by = NULL, updated_at = CURRENT_TIMESTAMP
         WHERE user_id = $5`,
        [realName, idCardNumber.toUpperCase(), idCardFrontKey, idCardBackKey, userId]
      );
    } else {
      // 创建新认证记录
      await pool.query(
        `INSERT INTO verifications (user_id, real_name, id_card_number, id_card_front_key, id_card_back_key, status)
         VALUES ($1, $2, $3, $4, $5, 'pending')`,
        [userId, realName, idCardNumber.toUpperCase(), idCardFrontKey, idCardBackKey]
      );
    }

    res.json({
      success: true,
      message: '实名认证申请已提交，请等待审核',
    });
  } catch (error) {
    console.error('Submit verification error:', error);
    res.status(500).json({ error: '提交认证失败，请重试' });
  }
});

/**
 * POST /api/v1/verification/upload
 * 上传身份证照片
 * Body: FormData with file (multipart/form-data)
 */
router.post('/upload', authMiddleware, upload.single('file'), async (req: Request, res: Response) => {
  try {
    const file = (req as any).file;
    if (!file) {
      return res.status(400).json({ error: '请选择要上传的图片' });
    }

    // 验证文件类型
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg'];
    if (!allowedTypes.includes(file.mimetype)) {
      return res.status(400).json({ error: '只支持 JPG、PNG 格式的图片' });
    }

    // 验证文件大小 (最大 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return res.status(400).json({ error: '图片大小不能超过 5MB' });
    }

    // 上传到对象存储
    const fileKey = await storage.uploadFile({
      fileContent: file.buffer,
      fileName: `verifications/${Date.now()}_${file.originalname}`,
      contentType: file.mimetype,
    });

    // 生成签名URL返回给前端预览
    const signedUrl = await storage.generatePresignedUrl({
      key: fileKey,
      expireTime: 3600, // 1小时有效期
    });

    res.json({
      success: true,
      key: fileKey,
      url: signedUrl,
    });
  } catch (error) {
    console.error('Upload verification image error:', error);
    res.status(500).json({ error: '上传图片失败，请重试' });
  }
});

/**
 * POST /api/v1/verification/review
 * 审核认证申请（管理员接口）
 * Header: Authorization: Bearer <admin_token>
 * Body: { verificationId: number, status: 'approved' | 'rejected', rejectReason?: string }
 */
router.post('/review', [
  adminAuthMiddleware,
  body('verificationId').isInt({ min: 1 }).withMessage('无效的认证记录ID'),
  body('status').isIn(['approved', 'rejected']).withMessage('无效的审核状态'),
], async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const adminReq = req as AdminRequest;
    const adminId = adminReq.admin!.adminId;
    const { verificationId, status, rejectReason } = req.body;

    if (status === 'rejected' && !rejectReason) {
      return res.status(400).json({ error: '请填写拒绝原因' });
    }

    // 更新认证状态
    await pool.query(
      `UPDATE verifications 
       SET status = $1, reject_reason = $2, reviewed_at = CURRENT_TIMESTAMP, reviewed_by = $3, updated_at = CURRENT_TIMESTAMP
       WHERE id = $4`,
      [status, rejectReason || null, adminId, verificationId]
    );

    // 如果审核通过，更新用户的认证状态
    if (status === 'approved') {
      const verificationResult = await pool.query(
        'SELECT user_id FROM verifications WHERE id = $1',
        [verificationId]
      );
      
      if (verificationResult.rows.length > 0) {
        await pool.query(
          'UPDATE users SET is_verified = TRUE WHERE id = $1',
          [verificationResult.rows[0].user_id]
        );
      }
    }

    res.json({
      success: true,
      message: status === 'approved' ? '认证已通过' : '认证已拒绝',
    });
  } catch (error) {
    console.error('Review verification error:', error);
    res.status(500).json({ error: '审核失败，请重试' });
  }
});

/**
 * GET /api/v1/verification/image/:key
 * 获取身份证图片的签名URL
 */
router.get('/image/:key(*)', authMiddleware, async (req: Request, res: Response) => {
  try {
    const fileKeyParam = req.params.key;
    const fileKey = Array.isArray(fileKeyParam) ? fileKeyParam[0] : fileKeyParam;
    
    // 验证该用户是否有权限访问此图片
    const userId = (req as any).userId;
    const verificationResult = await pool.query(
      'SELECT id FROM verifications WHERE user_id = $1 AND (id_card_front_key = $2 OR id_card_back_key = $2)',
      [userId, fileKey]
    );

    if (verificationResult.rows.length === 0) {
      return res.status(403).json({ error: '无权访问此图片' });
    }

    // 生成签名URL
    const signedUrl = await storage.generatePresignedUrl({
      key: fileKey,
      expireTime: 3600, // 1小时有效期
    });

    res.json({ url: signedUrl });
  } catch (error) {
    console.error('Get verification image error:', error);
    res.status(500).json({ error: '获取图片失败' });
  }
});

/**
 * POST /api/v1/verification/sign-disclaimer
 * 签署免责声明
 * Body: { version: string }
 * 要求：用户必须已通过实名认证才能签署
 */
router.post('/sign-disclaimer', [
  authMiddleware,
  body('version').trim().notEmpty().withMessage('请提供免责声明版本号'),
], async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const userId = (req as any).userId;
    const { version } = req.body;

    // 检查实名认证状态
    const verificationResult = await pool.query(
      'SELECT id, status FROM verifications WHERE user_id = $1',
      [userId]
    );

    if (verificationResult.rows.length === 0 || verificationResult.rows[0].status !== 'approved') {
      return res.status(400).json({ error: '请先完成实名认证后再签署免责声明' });
    }

    // 更新免责声明签署状态
    await pool.query(
      `UPDATE verifications 
       SET disclaimer_signed_at = CURRENT_TIMESTAMP, 
           disclaimer_version = $1, 
           updated_at = CURRENT_TIMESTAMP
       WHERE user_id = $2`,
      [version, userId]
    );

    res.json({
      success: true,
      message: '免责声明签署成功',
      signedAt: new Date().toISOString(),
      version,
    });
  } catch (error) {
    console.error('Sign disclaimer error:', error);
    res.status(500).json({ error: '签署免责声明失败，请重试' });
  }
});

/**
 * GET /api/v1/verification/check-completion
 * 检查用户是否完成了实名认证和免责声明签署
 * 用于前端判断是否可以进行接单/发布任务
 */
router.get('/check-completion', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;

    const result = await pool.query(
      `SELECT 
        v.status as verification_status,
        v.disclaimer_signed_at,
        u.user_type
       FROM verifications v
       JOIN users u ON u.id = v.user_id
       WHERE v.user_id = $1`,
      [userId]
    );

    if (result.rows.length === 0) {
      return res.json({
        isVerified: false,
        hasSignedDisclaimer: false,
        canOperate: false,
        userType: null,
        message: '请先完成实名认证',
      });
    }

    const { verification_status, disclaimer_signed_at, user_type } = result.rows[0];
    const isVerified = verification_status === 'approved';
    const hasSignedDisclaimer = !!disclaimer_signed_at;
    const canOperate = isVerified && hasSignedDisclaimer;

    let message = '';
    if (!isVerified) {
      message = '请先完成实名认证';
    } else if (!hasSignedDisclaimer) {
      message = '请签署免责声明';
    }

    res.json({
      isVerified,
      hasSignedDisclaimer,
      canOperate,
      userType: user_type,
      message: canOperate ? '' : message,
    });
  } catch (error) {
    console.error('Check completion error:', error);
    res.status(500).json({ error: '检查状态失败' });
  }
});

export default router;
