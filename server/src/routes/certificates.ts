/**
 * 技术证书路由
 * 工人上传和管理技术证书
 */

import express, { type Request, type Response } from 'express';
import jwt from 'jsonwebtoken';
import multer from 'multer';
import { S3Storage } from 'coze-coding-dev-sdk';
import pool from '../db';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'quick-work-secret-key-2024';

// 初始化对象存储
const storage = new S3Storage({
  endpointUrl: process.env.COZE_BUCKET_ENDPOINT_URL,
  accessKey: '',
  secretKey: '',
  bucketName: process.env.COZE_BUCKET_NAME,
  region: 'cn-beijing',
});

// 配置multer用于接收文件
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 最大10MB
  },
  fileFilter: (req, file, cb) => {
    // 只允许图片
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('只支持图片格式'));
    }
  },
});

// 认证中间件
const authenticate = (req: any, res: any, next: any) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) {
    return res.status(401).json({ error: '未登录' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; userType: string };
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ error: 'token无效' });
  }
};

// 仅工人可访问中间件
const workerOnly = (req: any, res: any, next: any) => {
  if (req.user.userType !== 'worker') {
    return res.status(403).json({ error: '仅工人可以管理证书' });
  }
  next();
};

/**
 * 获取当前用户的证书列表
 * GET /api/v1/certificates
 */
router.get('/', authenticate, async (req: any, res) => {
  try {
    const userId = req.user.userId;

    const result = await pool.query(
      `SELECT 
        id, certificate_name, certificate_type, issuing_authority,
        issue_date, expiry_date, certificate_number, image_url,
        status, reject_reason, created_at, updated_at
       FROM certificates
       WHERE user_id = $1
       ORDER BY created_at DESC`,
      [userId]
    );

    // 为每个证书生成签名URL
    const certificates = await Promise.all(
      result.rows.map(async (cert) => {
        let imageUrl = cert.image_url;
        
        // 如果有存储key，生成签名URL
        if (cert.image_url && !cert.image_url.startsWith('http')) {
          try {
            imageUrl = await storage.generatePresignedUrl({
              key: cert.image_url,
              expireTime: 86400, // 1天有效
            });
          } catch (e) {
            console.error('生成签名URL失败:', e);
          }
        }

        return {
          id: cert.id,
          certificateName: cert.certificate_name,
          certificateType: cert.certificate_type,
          issuingAuthority: cert.issuing_authority,
          issueDate: cert.issue_date,
          expiryDate: cert.expiry_date,
          certificateNumber: cert.certificate_number,
          imageUrl,
          imageKey: cert.image_url, // 保留key用于内部操作
          status: cert.status,
          rejectReason: cert.reject_reason,
          createdAt: cert.created_at,
          updatedAt: cert.updated_at,
        };
      })
    );

    res.json({ certificates });
  } catch (error) {
    console.error('Get certificates error:', error);
    res.status(500).json({ error: '获取证书列表失败' });
  }
});

/**
 * 获取单个证书详情
 * GET /api/v1/certificates/:id
 */
router.get('/:id', authenticate, async (req: any, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    const result = await pool.query(
      `SELECT * FROM certificates WHERE id = $1 AND user_id = $2`,
      [id, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: '证书不存在' });
    }

    const cert = result.rows[0];
    let imageUrl = cert.image_url;

    if (cert.image_url && !cert.image_url.startsWith('http')) {
      try {
        imageUrl = await storage.generatePresignedUrl({
          key: cert.image_url,
          expireTime: 86400,
        });
      } catch (e) {
        console.error('生成签名URL失败:', e);
      }
    }

    res.json({
      id: cert.id,
      certificateName: cert.certificate_name,
      certificateType: cert.certificate_type,
      issuingAuthority: cert.issuing_authority,
      issueDate: cert.issue_date,
      expiryDate: cert.expiry_date,
      certificateNumber: cert.certificate_number,
      imageUrl,
      status: cert.status,
      rejectReason: cert.reject_reason,
      createdAt: cert.created_at,
      updatedAt: cert.updated_at,
    });
  } catch (error) {
    console.error('Get certificate error:', error);
    res.status(500).json({ error: '获取证书详情失败' });
  }
});

/**
 * 上传证书
 * POST /api/v1/certificates
 * Body: certificateName, certificateType?, issuingAuthority?, issueDate?, expiryDate?, certificateNumber?
 * File: image (证书图片)
 */
router.post(
  '/',
  authenticate,
  workerOnly,
  upload.single('image'),
  async (req: any, res) => {
    try {
      const userId = req.user.userId;
      const {
        certificateName,
        certificateType,
        issuingAuthority,
        issueDate,
        expiryDate,
        certificateNumber,
      } = req.body;

      if (!certificateName) {
        return res.status(400).json({ error: '证书名称不能为空' });
      }

      if (!req.file) {
        return res.status(400).json({ error: '请上传证书图片' });
      }

      // 上传图片到对象存储
      const fileExtension = req.file.originalname.split('.').pop() || 'jpg';
      const fileName = `certificates/${userId}/${Date.now()}.${fileExtension}`;

      const imageKey = await storage.uploadFile({
        fileContent: req.file.buffer,
        fileName,
        contentType: req.file.mimetype,
      });

      // 保存到数据库
      const result = await pool.query(
        `INSERT INTO certificates (
          user_id, certificate_name, certificate_type, issuing_authority,
          issue_date, expiry_date, certificate_number, image_url, status
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'pending')
        RETURNING *`,
        [
          userId,
          certificateName,
          certificateType || null,
          issuingAuthority || null,
          issueDate || null,
          expiryDate || null,
          certificateNumber || null,
          imageKey,
        ]
      );

      const cert = result.rows[0];

      // 生成访问URL
      const imageUrl = await storage.generatePresignedUrl({
        key: imageKey,
        expireTime: 86400,
      });

      res.status(201).json({
        id: cert.id,
        certificateName: cert.certificate_name,
        certificateType: cert.certificate_type,
        issuingAuthority: cert.issuing_authority,
        issueDate: cert.issue_date,
        expiryDate: cert.expiry_date,
        certificateNumber: cert.certificate_number,
        imageUrl,
        status: cert.status,
        createdAt: cert.created_at,
      });
    } catch (error) {
      console.error('Upload certificate error:', error);
      res.status(500).json({ error: '上传证书失败' });
    }
  }
);

/**
 * 更新证书信息
 * PUT /api/v1/certificates/:id
 */
router.put(
  '/:id',
  authenticate,
  workerOnly,
  upload.single('image'),
  async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.userId;
      const {
        certificateName,
        certificateType,
        issuingAuthority,
        issueDate,
        expiryDate,
        certificateNumber,
      } = req.body;

      // 检查证书是否存在且属于当前用户
      const existingCert = await pool.query(
        'SELECT * FROM certificates WHERE id = $1 AND user_id = $2',
        [id, userId]
      );

      if (existingCert.rows.length === 0) {
        return res.status(404).json({ error: '证书不存在' });
      }

      let imageKey = existingCert.rows[0].image_url;

      // 如果上传了新图片
      if (req.file) {
        // 删除旧图片
        if (imageKey && !imageKey.startsWith('http')) {
          try {
            await storage.deleteFile({ fileKey: imageKey });
          } catch (e) {
            console.error('删除旧图片失败:', e);
          }
        }

        // 上传新图片
        const fileExtension = req.file.originalname.split('.').pop() || 'jpg';
        const fileName = `certificates/${userId}/${Date.now()}.${fileExtension}`;

        imageKey = await storage.uploadFile({
          fileContent: req.file.buffer,
          fileName,
          contentType: req.file.mimetype,
        });
      }

      // 更新数据库
      const result = await pool.query(
        `UPDATE certificates SET
          certificate_name = COALESCE($1, certificate_name),
          certificate_type = COALESCE($2, certificate_type),
          issuing_authority = COALESCE($3, issuing_authority),
          issue_date = COALESCE($4, issue_date),
          expiry_date = COALESCE($5, expiry_date),
          certificate_number = COALESCE($6, certificate_number),
          image_url = COALESCE($7, image_url),
          status = 'pending',
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $8 AND user_id = $9
        RETURNING *`,
        [
          certificateName || null,
          certificateType || null,
          issuingAuthority || null,
          issueDate || null,
          expiryDate || null,
          certificateNumber || null,
          req.file ? imageKey : null,
          id,
          userId,
        ]
      );

      const cert = result.rows[0];

      // 生成访问URL
      let imageUrl = cert.image_url;
      if (cert.image_url && !cert.image_url.startsWith('http')) {
        imageUrl = await storage.generatePresignedUrl({
          key: cert.image_url,
          expireTime: 86400,
        });
      }

      res.json({
        id: cert.id,
        certificateName: cert.certificate_name,
        certificateType: cert.certificate_type,
        issuingAuthority: cert.issuing_authority,
        issueDate: cert.issue_date,
        expiryDate: cert.expiry_date,
        certificateNumber: cert.certificate_number,
        imageUrl,
        status: cert.status,
        updatedAt: cert.updated_at,
      });
    } catch (error) {
      console.error('Update certificate error:', error);
      res.status(500).json({ error: '更新证书失败' });
    }
  }
);

/**
 * 删除证书
 * DELETE /api/v1/certificates/:id
 */
router.delete('/:id', authenticate, workerOnly, async (req: any, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    // 获取证书信息
    const certResult = await pool.query(
      'SELECT * FROM certificates WHERE id = $1 AND user_id = $2',
      [id, userId]
    );

    if (certResult.rows.length === 0) {
      return res.status(404).json({ error: '证书不存在' });
    }

    const cert = certResult.rows[0];

    // 删除对象存储中的图片
    if (cert.image_url && !cert.image_url.startsWith('http')) {
      try {
        await storage.deleteFile({ fileKey: cert.image_url });
      } catch (e) {
        console.error('删除图片失败:', e);
      }
    }

    // 删除数据库记录
    await pool.query('DELETE FROM certificates WHERE id = $1', [id]);

    res.json({ success: true, message: '证书已删除' });
  } catch (error) {
    console.error('Delete certificate error:', error);
    res.status(500).json({ error: '删除证书失败' });
  }
});

/**
 * 管理员审核证书（预留接口）
 * POST /api/v1/certificates/:id/verify
 */
router.post('/:id/verify', authenticate, async (req: any, res) => {
  try {
    // TODO: 添加管理员权限检查
    const { id } = req.params;
    const { status, rejectReason } = req.body;

    if (!['verified', 'rejected'].includes(status)) {
      return res.status(400).json({ error: '无效的审核状态' });
    }

    const result = await pool.query(
      `UPDATE certificates 
       SET status = $1, reject_reason = $2, updated_at = CURRENT_TIMESTAMP
       WHERE id = $3
       RETURNING *`,
      [status, status === 'rejected' ? rejectReason : null, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: '证书不存在' });
    }

    res.json({
      id: result.rows[0].id,
      status: result.rows[0].status,
      rejectReason: result.rows[0].reject_reason,
    });
  } catch (error) {
    console.error('Verify certificate error:', error);
    res.status(500).json({ error: '审核失败' });
  }
});

export default router;
