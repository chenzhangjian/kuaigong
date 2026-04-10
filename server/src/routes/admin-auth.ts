import express, { type Request, type Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { body, validationResult } from 'express-validator';
import pool from '../db';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'quick-work-secret-key-2024';
const ADMIN_JWT_SECRET = process.env.ADMIN_JWT_SECRET || 'admin-secret-key-2024';

// 扩展请求类型
interface AdminRequest extends Request {
  admin?: { adminId: number; username: string; role: string };
}

// 管理员认证中间件
const authenticateAdmin = (req: AdminRequest, res: Response, next: any) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) {
    return res.status(401).json({ error: '未登录' });
  }

  try {
    const decoded = jwt.verify(token, ADMIN_JWT_SECRET) as { adminId: number; username: string; role: string };
    req.admin = decoded;
    next();
  } catch (error) {
    res.status(401).json({ error: 'token无效' });
  }
};

// 超级管理员权限检查
const requireSuperAdmin = async (req: AdminRequest, res: Response, next: any) => {
  if (req.admin?.role !== 'super_admin') {
    return res.status(403).json({ error: '需要超级管理员权限' });
  }
  next();
};

/**
 * 管理员登录
 * POST /api/v1/admin/login
 */
router.post('/login', [
  body('username').notEmpty().withMessage('请输入用户名'),
  body('password').notEmpty().withMessage('请输入密码'),
], async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { username, password } = req.body;

    // 查询管理员
    const result = await pool.query(
      'SELECT * FROM admins WHERE username = $1 AND status = $2',
      [username, 'active']
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: '用户名或密码错误' });
    }

    const admin = result.rows[0];

    // 验证密码
    const isValidPassword = await bcrypt.compare(password, admin.password_hash);
    if (!isValidPassword) {
      return res.status(401).json({ error: '用户名或密码错误' });
    }

    // 更新最后登录时间
    await pool.query(
      'UPDATE admins SET last_login_at = CURRENT_TIMESTAMP WHERE id = $1',
      [admin.id]
    );

    // 生成 JWT token
    const token = jwt.sign(
      { adminId: admin.id, username: admin.username, role: admin.role },
      ADMIN_JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      token,
      admin: {
        id: admin.id,
        username: admin.username,
        nickname: admin.nickname,
        role: admin.role,
      },
    });
  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({ error: '登录失败' });
  }
});

/**
 * 获取当前管理员信息
 * GET /api/v1/admin/me
 */
router.get('/me', authenticateAdmin, async (req: AdminRequest, res) => {
  try {
    const result = await pool.query(
      'SELECT id, username, nickname, email, phone, role, status, last_login_at, created_at FROM admins WHERE id = $1',
      [req.admin?.adminId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: '管理员不存在' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get admin info error:', error);
    res.status(500).json({ error: '获取信息失败' });
  }
});

/**
 * 获取管理员列表（仅超级管理员）
 * GET /api/v1/admin/managers
 */
router.get('/managers', authenticateAdmin, requireSuperAdmin, async (req: AdminRequest, res) => {
  try {
    const { page = 1, limit = 20, keyword, status } = req.query;
    const offset = (parseInt(page as string) - 1) * parseInt(limit as string);

    let whereConditions = '1=1';
    const params: any[] = [];
    let paramIndex = 1;

    if (keyword) {
      whereConditions += ` AND (username ILIKE $${paramIndex} OR nickname ILIKE $${paramIndex})`;
      params.push(`%${keyword}%`);
      paramIndex++;
    }

    if (status) {
      whereConditions += ` AND status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    // 获取总数
    const countResult = await pool.query(
      `SELECT COUNT(*) FROM admins WHERE ${whereConditions}`,
      params
    );

    // 获取列表
    const result = await pool.query(
      `SELECT id, username, nickname, email, phone, role, status, last_login_at, created_at
       FROM admins 
       WHERE ${whereConditions}
       ORDER BY created_at DESC
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      [...params, parseInt(limit as string), offset]
    );

    res.json({
      total: parseInt(countResult.rows[0].count),
      page: parseInt(page as string),
      limit: parseInt(limit as string),
      managers: result.rows,
    });
  } catch (error) {
    console.error('Get managers error:', error);
    res.status(500).json({ error: '获取管理员列表失败' });
  }
});

/**
 * 创建管理员（仅超级管理员）
 * POST /api/v1/admin/managers
 */
router.post('/managers', authenticateAdmin, requireSuperAdmin, [
  body('username').isLength({ min: 3, max: 50 }).withMessage('用户名长度3-50位'),
  body('password').isLength({ min: 6 }).withMessage('密码至少6位'),
  body('role').isIn(['admin', 'super_admin']).withMessage('角色无效'),
], async (req: AdminRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { username, password, nickname, email, phone, role } = req.body;

    // 检查用户名是否已存在
    const existing = await pool.query(
      'SELECT id FROM admins WHERE username = $1',
      [username]
    );

    if (existing.rows.length > 0) {
      return res.status(400).json({ error: '用户名已存在' });
    }

    // 加密密码
    const passwordHash = await bcrypt.hash(password, 10);

    // 创建管理员
    const result = await pool.query(
      `INSERT INTO admins (username, password_hash, nickname, email, phone, role, status)
       VALUES ($1, $2, $3, $4, $5, $6, 'active')
       RETURNING id, username, nickname, email, phone, role, status, created_at`,
      [username, passwordHash, nickname || username, email, phone, role]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Create manager error:', error);
    res.status(500).json({ error: '创建管理员失败' });
  }
});

/**
 * 更新管理员（仅超级管理员）
 * PUT /api/v1/admin/managers/:id
 */
router.put('/managers/:id', authenticateAdmin, requireSuperAdmin, async (req: AdminRequest, res) => {
  try {
    const { id } = req.params;
    const { nickname, email, phone, role, status, password } = req.body;

    let updateFields: string[] = [];
    let params: any[] = [];
    let paramIndex = 1;

    if (nickname !== undefined) {
      updateFields.push(`nickname = $${paramIndex}`);
      params.push(nickname);
      paramIndex++;
    }

    if (email !== undefined) {
      updateFields.push(`email = $${paramIndex}`);
      params.push(email);
      paramIndex++;
    }

    if (phone !== undefined) {
      updateFields.push(`phone = $${paramIndex}`);
      params.push(phone);
      paramIndex++;
    }

    if (role !== undefined) {
      updateFields.push(`role = $${paramIndex}`);
      params.push(role);
      paramIndex++;
    }

    if (status !== undefined) {
      updateFields.push(`status = $${paramIndex}`);
      params.push(status);
      paramIndex++;
    }

    if (password) {
      const passwordHash = await bcrypt.hash(password, 10);
      updateFields.push(`password_hash = $${paramIndex}`);
      params.push(passwordHash);
      paramIndex++;
    }

    if (updateFields.length === 0) {
      return res.status(400).json({ error: '没有要更新的内容' });
    }

    updateFields.push('updated_at = CURRENT_TIMESTAMP');
    params.push(id);

    const result = await pool.query(
      `UPDATE admins SET ${updateFields.join(', ')} WHERE id = $${paramIndex} 
       RETURNING id, username, nickname, email, phone, role, status`,
      params
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: '管理员不存在' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update manager error:', error);
    res.status(500).json({ error: '更新管理员失败' });
  }
});

/**
 * 删除管理员（仅超级管理员）
 * DELETE /api/v1/admin/managers/:id
 */
router.delete('/managers/:id', authenticateAdmin, requireSuperAdmin, async (req: AdminRequest, res) => {
  try {
    const { id } = req.params;

    // 不能删除自己
    if (parseInt(id as string) === req.admin?.adminId) {
      return res.status(400).json({ error: '不能删除自己' });
    }

    const result = await pool.query(
      'DELETE FROM admins WHERE id = $1 RETURNING id',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: '管理员不存在' });
    }

    res.json({ message: '删除成功' });
  } catch (error) {
    console.error('Delete manager error:', error);
    res.status(500).json({ error: '删除管理员失败' });
  }
});

export default router;
