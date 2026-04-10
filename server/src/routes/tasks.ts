import express, { type Request, type Response } from 'express';
import jwt from 'jsonwebtoken';
import { body, validationResult } from 'express-validator';
import pool from '../db';
import { JWT_SECRET } from '../config/auth';

const router = express.Router();

// 扩展 Request 类型
interface AuthRequest extends Request {
  user?: { userId: string; userType: string };
}

// 认证中间件
const authenticate = (req: AuthRequest, res: Response, next: any) => {
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

// 获取任务分类列表
router.get('/categories', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, name, icon, parent_id, sort_order
       FROM task_categories
       WHERE is_active = true
       ORDER BY sort_order ASC`
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({ error: '获取分类失败' });
  }
});

// 获取任务列表
router.get('/', async (req, res) => {
  try {
    const {
      categoryId,
      status,
      lat,
      lng,
      radius = 50, // 默认50公里
      minBudget,
      maxBudget,
      keyword,
      page = 1,
      limit = 20,
    } = req.query;

    let whereConditions = ['t.status = $1'];
    let params: any[] = ['open'];
    let paramIndex = 2;

    // 分类筛选
    if (categoryId) {
      whereConditions.push(`t.category_id = $${paramIndex}`);
      params.push(categoryId);
      paramIndex++;
    }

    // 预算筛选
    if (minBudget) {
      whereConditions.push(`(t.budget_fixed >= $${paramIndex} OR t.budget_min >= $${paramIndex})`);
      params.push(minBudget);
      paramIndex++;
    }
    if (maxBudget) {
      whereConditions.push(`(t.budget_fixed <= $${paramIndex} OR t.budget_max <= $${paramIndex})`);
      params.push(maxBudget);
      paramIndex++;
    }

    // 关键词搜索
    if (keyword) {
      whereConditions.push(`(t.title ILIKE $${paramIndex} OR t.description ILIKE $${paramIndex})`);
      params.push(`%${keyword}%`);
      paramIndex++;
    }

    // 距离筛选（如果提供了位置）
    let distanceSelect = '';
    let orderBy = 't.created_at DESC';
    if (lat && lng) {
      distanceSelect = `,
        (6371 * acos(
          cos(radians($${paramIndex})) * cos(radians(t.latitude)) *
          cos(radians(t.longitude) - radians($${paramIndex + 1})) +
          sin(radians($${paramIndex})) * sin(radians(t.latitude))
        )) as distance`;
      params.push(parseFloat(lat as string), parseFloat(lng as string));
      paramIndex += 2;
      
      if (radius) {
        whereConditions.push(`(6371 * acos(
          cos(radians($${paramIndex - 2})) * cos(radians(t.latitude)) *
          cos(radians(t.longitude) - radians($${paramIndex - 1})) +
          sin(radians($${paramIndex - 2})) * sin(radians(t.latitude))
        )) <= $${paramIndex}`);
        params.push(parseFloat(radius as string));
        paramIndex++;
      }
      orderBy = 'distance ASC, t.created_at DESC';
    }

    // 计算分页参数
    const limitNum = parseInt(limit as string) || 20;
    const pageNum = parseInt(page as string) || 1;
    const offset = (pageNum - 1) * limitNum;
    
    // 添加分页参数到params
    const limitIndex = paramIndex;
    const offsetIndex = paramIndex + 1;
    params.push(limitNum, offset);

    const query = `
      SELECT 
        t.id, t.title, t.description, t.address, t.latitude, t.longitude,
        t.budget_min, t.budget_max, t.budget_fixed, t.budget_type,
        t.urgency, t.work_time, t.estimated_duration, t.status,
        t.view_count, t.apply_count, t.created_at,
        tc.name as category_name, tc.icon as category_icon,
        u.id as employer_id, u.nickname as employer_name, u.rating as employer_rating,
        t.images
        ${distanceSelect}
      FROM tasks t
      LEFT JOIN task_categories tc ON t.category_id = tc.id
      LEFT JOIN users u ON t.employer_id = u.id
      WHERE ${whereConditions.join(' AND ')}
      ORDER BY ${orderBy}
      LIMIT $${limitIndex} OFFSET $${offsetIndex}
    `;

    const result = await pool.query(query, params);
    
    res.json({
      tasks: result.rows.map(task => ({
        id: task.id,
        title: task.title,
        description: task.description,
        address: task.address,
        latitude: task.latitude,
        longitude: task.longitude,
        budget: {
          min: task.budget_min,
          max: task.budget_max,
          fixed: task.budget_fixed,
          type: task.budget_type,
        },
        urgency: task.urgency,
        workTime: task.work_time,
        estimatedDuration: task.estimated_duration,
        status: task.status,
        viewCount: task.view_count,
        applyCount: task.apply_count,
        createdAt: task.created_at,
        category: {
          name: task.category_name,
          icon: task.category_icon,
        },
        employer: {
          id: task.employer_id,
          name: task.employer_name,
          rating: task.employer_rating,
        },
        images: task.images || [],
        distance: task.distance || null,
      })),
      page: parseInt(page as string),
      limit: parseInt(limit as string),
    });
  } catch (error) {
    console.error('Get tasks error:', error);
    res.status(500).json({ error: '获取任务列表失败' });
  }
});

// 获取任务详情
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `SELECT 
        t.*, 
        tc.name as category_name, tc.icon as category_icon,
        u.id as employer_id, u.nickname as employer_name, u.avatar_url as employer_avatar,
        u.rating as employer_rating, u.total_orders as employer_total_orders
       FROM tasks t
       LEFT JOIN task_categories tc ON t.category_id = tc.id
       LEFT JOIN users u ON t.employer_id = u.id
       WHERE t.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: '任务不存在' });
    }

    const task = result.rows[0];

    // 增加浏览次数
    await pool.query(
      'UPDATE tasks SET view_count = view_count + 1 WHERE id = $1',
      [id]
    );

    res.json({
      id: task.id,
      title: task.title,
      description: task.description,
      address: task.address,
      latitude: task.latitude,
      longitude: task.longitude,
      budget: {
        min: task.budget_min,
        max: task.budget_max,
        fixed: task.budget_fixed,
        type: task.budget_type,
      },
      urgency: task.urgency,
      workTime: task.work_time,
      estimatedDuration: task.estimated_duration,
      status: task.status,
      viewCount: task.view_count + 1,
      applyCount: task.apply_count,
      createdAt: task.created_at,
      category: {
        id: task.category_id,
        name: task.category_name,
        icon: task.category_icon,
      },
      employer: {
        id: task.employer_id,
        name: task.employer_name,
        avatar: task.employer_avatar,
        rating: task.employer_rating,
        totalOrders: task.employer_total_orders,
      },
      images: task.images || [],
      requirements: task.requirements,
    });
  } catch (error) {
    console.error('Get task detail error:', error);
    res.status(500).json({ error: '获取任务详情失败' });
  }
});

// 发布任务（雇主）
router.post('/', authenticate, [
  body('title').notEmpty().withMessage('请输入任务标题'),
  body('address').notEmpty().withMessage('请选择工作地点'),
  body('categoryId').isUUID().withMessage('请选择任务分类'),
], async (req: AuthRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    if (!req.user || req.user.userType !== 'employer') {
      return res.status(403).json({ error: '只有雇主可以发布任务' });
    }

    // 检查实名认证和免责声明签署状态
    const verificationResult = await pool.query(
      `SELECT status, disclaimer_signed_at 
       FROM verifications 
       WHERE user_id = $1`,
      [req.user.userId]
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

    const {
      title,
      description,
      categoryId,
      address,
      latitude,
      longitude,
      budgetType,
      budgetMin,
      budgetMax,
      budgetFixed,
      urgency,
      workTime,
      estimatedDuration,
      images,
      requirements,
    } = req.body;

    const result = await pool.query(
      `INSERT INTO tasks 
       (employer_id, category_id, title, description, address, latitude, longitude,
        budget_type, budget_min, budget_max, budget_fixed, urgency, work_time,
        estimated_duration, images, requirements)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
       RETURNING *`,
      [
        req.user.userId, categoryId, title, description, address, latitude, longitude,
        budgetType || 'fixed', budgetMin, budgetMax, budgetFixed, urgency || 'normal',
        workTime, estimatedDuration, images || [], requirements
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Create task error:', error);
    res.status(500).json({ error: '发布任务失败' });
  }
});

// 申请任务（工人）
router.post('/:id/apply', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user || req.user.userType !== 'worker') {
      return res.status(403).json({ error: '只有工人可以申请任务' });
    }

    const taskId = req.params.id;
    const { message, proposedAmount } = req.body;

    // 检查任务状态
    const taskResult = await pool.query(
      'SELECT * FROM tasks WHERE id = $1 AND status = $2',
      [taskId, 'open']
    );

    if (taskResult.rows.length === 0) {
      return res.status(400).json({ error: '任务不存在或已关闭' });
    }

    // 检查是否已申请
    const existingApplication = await pool.query(
      'SELECT id FROM task_applications WHERE task_id = $1 AND worker_id = $2',
      [taskId, req.user!.userId]
    );

    if (existingApplication.rows.length > 0) {
      return res.status(400).json({ error: '您已申请过该任务' });
    }

    // 创建申请
    const result = await pool.query(
      `INSERT INTO task_applications (task_id, worker_id, message, proposed_amount)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [taskId, req.user!.userId, message, proposedAmount]
    );

    // 更新任务申请数
    await pool.query(
      'UPDATE tasks SET apply_count = apply_count + 1 WHERE id = $1',
      [taskId]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Apply task error:', error);
    res.status(500).json({ error: '申请失败' });
  }
});

// 获取任务申请列表（雇主查看）
router.get('/:id/applications', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const taskId = req.params.id;

    // 验证任务所有权
    const taskResult = await pool.query(
      'SELECT employer_id FROM tasks WHERE id = $1',
      [taskId]
    );

    if (taskResult.rows.length === 0) {
      return res.status(404).json({ error: '任务不存在' });
    }

    if (!req.user || taskResult.rows[0].employer_id !== req.user.userId) {
      return res.status(403).json({ error: '无权查看' });
    }

    const result = await pool.query(
      `SELECT 
        ta.id, ta.message, ta.proposed_amount, ta.status, ta.created_at,
        u.id as worker_id, u.nickname, u.avatar_url, u.rating, u.skills,
        u.total_orders, u.completed_orders
       FROM task_applications ta
       LEFT JOIN users u ON ta.worker_id = u.id
       WHERE ta.task_id = $1
       ORDER BY ta.created_at DESC`,
      [taskId]
    );

    res.json(result.rows.map(app => ({
      id: app.id,
      message: app.message,
      proposedAmount: app.proposed_amount,
      status: app.status,
      createdAt: app.created_at,
      worker: {
        id: app.worker_id,
        nickname: app.nickname,
        avatar: app.avatar_url,
        rating: app.rating,
        skills: app.skills || [],
        totalOrders: app.total_orders,
        completedOrders: app.completed_orders,
      },
    })));
  } catch (error) {
    console.error('Get applications error:', error);
    res.status(500).json({ error: '获取申请列表失败' });
  }
});

export default router;
