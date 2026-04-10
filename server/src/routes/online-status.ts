import express, { type Request, type Response } from 'express';
import jwt from 'jsonwebtoken';
import pool from '../db';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'quick-work-secret-key-2024';

// 认证中间件
const authMiddleware = async (req: any, res: any, next: any) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ error: '未授权访问' });
    }

    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    req.userId = decoded.userId;
    next();
  } catch (error) {
    return res.status(401).json({ error: '无效的token' });
  }
};

/**
 * 获取当前在线状态
 * GET /api/v1/online-status
 */
router.get('/', authMiddleware, async (req: any, res: Response) => {
  try {
    const result = await pool.query(
      'SELECT is_online FROM users WHERE id = $1',
      [req.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: '用户不存在' });
    }

    res.json({ isOnline: result.rows[0].is_online || false });
  } catch (error) {
    console.error('Get online status error:', error);
    res.status(500).json({ error: '获取在线状态失败' });
  }
});

/**
 * 切换在线状态
 * PUT /api/v1/online-status
 * Body: { isOnline: boolean }
 */
router.put('/', authMiddleware, async (req: any, res: Response) => {
  try {
    const { isOnline } = req.body;

    if (typeof isOnline !== 'boolean') {
      return res.status(400).json({ error: '参数错误' });
    }

    // 检查用户类型，只有工人可以切换在线状态
    const userResult = await pool.query(
      'SELECT user_type FROM users WHERE id = $1',
      [req.userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: '用户不存在' });
    }

    if (userResult.rows[0].user_type !== 'worker') {
      return res.status(403).json({ error: '只有工人可以切换在线状态' });
    }

    // 如果要上线，检查实名认证和免责声明签署状态
    if (isOnline) {
      const verificationResult = await pool.query(
        `SELECT status, disclaimer_signed_at 
         FROM verifications 
         WHERE user_id = $1`,
        [req.userId]
      );

      if (verificationResult.rows.length === 0) {
        return res.status(403).json({ 
          error: '请先完成实名认证',
          code: 'VERIFICATION_REQUIRED'
        });
      }

      const verification = verificationResult.rows[0];
      
      if (verification.status !== 'approved') {
        return res.status(403).json({ 
          error: verification.status === 'pending' 
            ? '您的实名认证正在审核中，请耐心等待' 
            : '实名认证未通过，请重新提交',
          code: 'VERIFICATION_' + verification.status.toUpperCase()
        });
      }

      if (!verification.disclaimer_signed_at) {
        return res.status(403).json({ 
          error: '请先签署免责声明',
          code: 'DISCLAIMER_REQUIRED'
        });
      }
    }

    // 更新在线状态
    await pool.query(
      'UPDATE users SET is_online = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [isOnline, req.userId]
    );

    res.json({
      success: true,
      isOnline,
      message: isOnline ? '已上线，开始接单' : '已下线，停止接单'
    });
  } catch (error) {
    console.error('Update online status error:', error);
    res.status(500).json({ error: '更新在线状态失败' });
  }
});

export default router;
