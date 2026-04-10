import express, { type Request, type Response } from 'express';
import jwt from 'jsonwebtoken';
import { body, validationResult } from 'express-validator';
import bcrypt from 'bcryptjs';
import pool from '../db';
import { ADMIN_JWT_SECRET, ADMIN_JWT_EXPIRES_IN } from '../config/auth';

const router = express.Router();

// 管理员认证中间件
interface AdminRequest extends Request {
  admin?: { adminId: number; username: string; role: string };
}

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

/**
 * 管理员登录
 * POST /api/v1/admin/login
 * Body: username, password
 */
router.post('/login', [
  body('username').isLength({ min: 3 }).withMessage('用户名长度不能少于3位'),
  body('password').isLength({ min: 6 }).withMessage('密码长度不能少于6位'),
], async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { username, password } = req.body;

    // 查询管理员
    const result = await pool.query(
      'SELECT * FROM admins WHERE username = $1',
      [username]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: '用户名或密码错误' });
    }

    const admin = result.rows[0];

    // 检查管理员状态
    if (admin.status !== 'active') {
      return res.status(403).json({ error: '账号已被禁用' });
    }

    // 验证密码
    const isValidPassword = await bcrypt.compare(password, admin.password_hash);
    if (!isValidPassword) {
      return res.status(401).json({ error: '用户名或密码错误' });
    }

    // 生成 JWT token
    const token = jwt.sign(
      { adminId: admin.id, username: admin.username, role: admin.role },
      ADMIN_JWT_SECRET,
      { expiresIn: ADMIN_JWT_EXPIRES_IN } as jwt.SignOptions
    );

    // 更新最后登录时间
    await pool.query(
      'UPDATE admins SET last_login_at = NOW() WHERE id = $1',
      [admin.id]
    );

    res.json({
      token,
      admin: {
        id: admin.id,
        username: admin.username,
        nickname: admin.nickname,
        email: admin.email,
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
router.get('/me', authenticateAdmin, async (req: AdminRequest, res: Response) => {
  try {
    const result = await pool.query(
      'SELECT id, username, nickname, email, phone, role, status, created_at FROM admins WHERE id = $1',
      [req.admin!.adminId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: '管理员不存在' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get admin info error:', error);
    res.status(500).json({ error: '获取管理员信息失败' });
  }
});

/**
 * 获取平台统计数据
 * GET /api/v1/admin/statistics
 */
router.get('/statistics', authenticateAdmin, async (req: AdminRequest, res) => {
  try {
    // 用户统计
    const userStats = await pool.query(`
      SELECT 
        COUNT(*) as total_users,
        COUNT(*) FILTER (WHERE user_type = 'worker') as worker_count,
        COUNT(*) FILTER (WHERE user_type = 'employer') as employer_count,
        COUNT(*) FILTER (WHERE is_verified = true) as verified_count,
        COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE) as today_new_users,
        COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE - INTERVAL '7 days') as week_new_users,
        COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE - INTERVAL '30 days') as month_new_users
      FROM users
    `);

    // 订单统计
    const orderStats = await pool.query(`
      SELECT 
        COUNT(*) as total_orders,
        COUNT(*) FILTER (WHERE status = 'pending') as pending_orders,
        COUNT(*) FILTER (WHERE status = 'accepted') as accepted_orders,
        COUNT(*) FILTER (WHERE status = 'in_progress') as in_progress_orders,
        COUNT(*) FILTER (WHERE status = 'completed') as completed_orders,
        COUNT(*) FILTER (WHERE status = 'cancelled') as cancelled_orders,
        COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE) as today_orders,
        COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE - INTERVAL '7 days') as week_orders,
        COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE - INTERVAL '30 days') as month_orders,
        COALESCE(SUM(agreed_amount) FILTER (WHERE status = 'completed'), 0) as total_transaction_amount
      FROM orders
    `);

    // 任务统计
    const taskStats = await pool.query(`
      SELECT 
        COUNT(*) as total_tasks,
        COUNT(*) FILTER (WHERE status = 'open') as open_tasks,
        COUNT(*) FILTER (WHERE status = 'assigned') as assigned_tasks,
        COUNT(*) FILTER (WHERE status = 'in_progress') as in_progress_tasks,
        COUNT(*) FILTER (WHERE status = 'completed') as completed_tasks,
        COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE) as today_tasks,
        COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE - INTERVAL '7 days') as week_tasks
      FROM tasks
    `);

    // 今日活跃用户
    const activeUsers = await pool.query(`
      SELECT COUNT(DISTINCT user_id) as count
      FROM (
        SELECT employer_id as user_id FROM orders WHERE created_at >= CURRENT_DATE
        UNION
        SELECT worker_id FROM orders WHERE created_at >= CURRENT_DATE
        UNION
        SELECT employer_id FROM tasks WHERE created_at >= CURRENT_DATE
      ) active
    `);

    // 用户增长趋势（最近7天）
    const userTrend = await pool.query(`
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as new_users,
        COUNT(*) FILTER (WHERE user_type = 'worker') as new_workers,
        COUNT(*) FILTER (WHERE user_type = 'employer') as new_employers
      FROM users 
      WHERE created_at >= CURRENT_DATE - INTERVAL '7 days'
      GROUP BY DATE(created_at)
      ORDER BY date DESC
    `);

    // 订单增长趋势（最近7天）
    const orderTrend = await pool.query(`
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as new_orders,
        COUNT(*) FILTER (WHERE status = 'completed') as completed_orders,
        COALESCE(SUM(agreed_amount) FILTER (WHERE status = 'completed'), 0) as transaction_amount
      FROM orders 
      WHERE created_at >= CURRENT_DATE - INTERVAL '7 days'
      GROUP BY DATE(created_at)
      ORDER BY date DESC
    `);

    // 热门任务分类
    const categoryStats = await pool.query(`
      SELECT 
        tc.name as category_name,
        tc.icon,
        COUNT(t.id) as task_count,
        COUNT(t.id) FILTER (WHERE t.status = 'open') as open_count,
        COUNT(o.id) FILTER (WHERE o.status = 'completed') as completed_count
      FROM task_categories tc
      LEFT JOIN tasks t ON tc.id = t.category_id
      LEFT JOIN orders o ON t.id = o.task_id
      GROUP BY tc.id, tc.name, tc.icon
      ORDER BY task_count DESC
      LIMIT 10
    `);

    res.json({
      users: {
        total: parseInt(userStats.rows[0].total_users) || 0,
        workers: parseInt(userStats.rows[0].worker_count) || 0,
        employers: parseInt(userStats.rows[0].employer_count) || 0,
        verified: parseInt(userStats.rows[0].verified_count) || 0,
        todayNew: parseInt(userStats.rows[0].today_new_users) || 0,
        weekNew: parseInt(userStats.rows[0].week_new_users) || 0,
        monthNew: parseInt(userStats.rows[0].month_new_users) || 0,
      },
      orders: {
        total: parseInt(orderStats.rows[0].total_orders) || 0,
        pending: parseInt(orderStats.rows[0].pending_orders) || 0,
        accepted: parseInt(orderStats.rows[0].accepted_orders) || 0,
        inProgress: parseInt(orderStats.rows[0].in_progress_orders) || 0,
        completed: parseInt(orderStats.rows[0].completed_orders) || 0,
        cancelled: parseInt(orderStats.rows[0].cancelled_orders) || 0,
        todayOrders: parseInt(orderStats.rows[0].today_orders) || 0,
        weekOrders: parseInt(orderStats.rows[0].week_orders) || 0,
        monthOrders: parseInt(orderStats.rows[0].month_orders) || 0,
        totalTransactionAmount: parseFloat(orderStats.rows[0].total_transaction_amount) || 0,
      },
      tasks: {
        total: parseInt(taskStats.rows[0].total_tasks) || 0,
        open: parseInt(taskStats.rows[0].open_tasks) || 0,
        assigned: parseInt(taskStats.rows[0].assigned_tasks) || 0,
        inProgress: parseInt(taskStats.rows[0].in_progress_tasks) || 0,
        completed: parseInt(taskStats.rows[0].completed_tasks) || 0,
        todayTasks: parseInt(taskStats.rows[0].today_tasks) || 0,
        weekTasks: parseInt(taskStats.rows[0].week_tasks) || 0,
      },
      activeUsers: {
        today: parseInt(activeUsers.rows[0]?.count) || 0,
      },
      trends: {
        users: userTrend.rows.map(row => ({
          date: row.date,
          newUsers: parseInt(row.new_users) || 0,
          newWorkers: parseInt(row.new_workers) || 0,
          newEmployers: parseInt(row.new_employers) || 0,
        })),
        orders: orderTrend.rows.map(row => ({
          date: row.date,
          newOrders: parseInt(row.new_orders) || 0,
          completedOrders: parseInt(row.completed_orders) || 0,
          transactionAmount: parseFloat(row.transaction_amount) || 0,
        })),
      },
      categories: categoryStats.rows.map(row => ({
        name: row.category_name,
        icon: row.icon,
        taskCount: parseInt(row.task_count) || 0,
        openCount: parseInt(row.open_count) || 0,
        completedCount: parseInt(row.completed_count) || 0,
      })),
    });
  } catch (error) {
    console.error('Get statistics error:', error);
    res.status(500).json({ error: '获取统计数据失败' });
  }
});

/**
 * 获取用户列表
 * GET /api/v1/admin/users?page=1&limit=20&type=worker|employer&keyword=xxx
 */
router.get('/users', authenticateAdmin, async (req: AdminRequest, res) => {
  try {
    const { page = 1, limit = 20, type, keyword, status } = req.query;
    const offset = (parseInt(page as string) - 1) * parseInt(limit as string);

    let whereConditions = '1=1';
    const params: any[] = [];
    let paramIndex = 1;

    if (type) {
      whereConditions += ` AND user_type = $${paramIndex}`;
      params.push(type);
      paramIndex++;
    }

    if (keyword) {
      whereConditions += ` AND (nickname ILIKE $${paramIndex} OR phone ILIKE $${paramIndex})`;
      params.push(`%${keyword}%`);
      paramIndex++;
    }

    if (status === 'verified') {
      whereConditions += ` AND is_verified = true`;
    } else if (status === 'unverified') {
      whereConditions += ` AND is_verified = false`;
    }

    // 获取总数
    const countResult = await pool.query(
      `SELECT COUNT(*) FROM users WHERE ${whereConditions}`,
      params
    );

    // 获取列表
    const result = await pool.query(
      `SELECT 
        id, phone, nickname, avatar_url, user_type, is_verified,
        rating, total_orders, completed_orders, balance,
        created_at
       FROM users 
       WHERE ${whereConditions}
       ORDER BY created_at DESC
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      [...params, parseInt(limit as string), offset]
    );

    res.json({
      total: parseInt(countResult.rows[0].count),
      page: parseInt(page as string),
      limit: parseInt(limit as string),
      users: result.rows.map(user => ({
        id: user.id,
        phone: user.phone,
        nickname: user.nickname,
        avatar: user.avatar_url,
        userType: user.user_type,
        isVerified: user.is_verified,
        rating: parseFloat(user.rating) || 5.0,
        totalOrders: user.total_orders || 0,
        completedOrders: user.completed_orders || 0,
        balance: parseFloat(user.balance) || 0,
        createdAt: user.created_at,
        lastLoginAt: null,
      })),
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: '获取用户列表失败' });
  }
});

/**
 * 获取用户详情
 * GET /api/v1/admin/users/:id
 */
router.get('/users/:id', authenticateAdmin, async (req: AdminRequest, res) => {
  try {
    const { id } = req.params;

    // 获取用户基本信息
    const userResult = await pool.query(
      `SELECT 
        id, phone, nickname, avatar_url, user_type, is_verified,
        real_name, id_card, bio, skills, rating, 
        total_orders, completed_orders, balance,
        is_online, created_at, updated_at
       FROM users 
       WHERE id = $1`,
      [id]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: '用户不存在' });
    }

    const user = userResult.rows[0];

    // 获取用户的银行卡列表
    const bankCardsResult = await pool.query(
      `SELECT 
        id, bank_name, card_number, card_holder, 
        is_default, status, created_at
       FROM bank_cards 
       WHERE user_id = $1
       ORDER BY is_default DESC, created_at DESC`,
      [id]
    );

    // 获取用户的认证记录
    const verificationResult = await pool.query(
      `SELECT 
        id, real_name, id_card_number, status, reject_reason,
        submitted_at, reviewed_at
       FROM verifications 
       WHERE user_id = $1
       ORDER BY submitted_at DESC
       LIMIT 5`,
      [id]
    );

    // 获取用户的任务统计（如果是雇主）
    let taskStats = null;
    if (user.user_type === 'employer') {
      const taskResult = await pool.query(
        `SELECT 
          COUNT(*) as total_tasks,
          COUNT(*) FILTER (WHERE status = 'open') as open_tasks,
          COUNT(*) FILTER (WHERE status = 'assigned') as assigned_tasks,
          COUNT(*) FILTER (WHERE status = 'completed') as completed_tasks,
          COUNT(*) FILTER (WHERE status = 'cancelled') as cancelled_tasks
         FROM tasks 
         WHERE employer_id = $1`,
        [id]
      );
      taskStats = taskResult.rows[0];
    }

    // 获取用户的订单统计
    const orderStatsResult = await pool.query(
      `SELECT 
        COUNT(*) FILTER (WHERE employer_id = $1) as employer_orders,
        COUNT(*) FILTER (WHERE worker_id = $1) as worker_orders,
        COUNT(*) FILTER (WHERE status = 'completed' AND (employer_id = $1 OR worker_id = $1)) as completed_orders,
        COUNT(*) FILTER (WHERE status = 'cancelled' AND (employer_id = $1 OR worker_id = $1)) as cancelled_orders,
        COALESCE(SUM(agreed_amount) FILTER (WHERE status = 'completed' AND worker_id = $1), 0) as total_earnings
       FROM orders`,
      [id]
    );

    // 获取用户的评价统计
    const reviewStatsResult = await pool.query(
      `SELECT 
        COUNT(*) as total_reviews,
        COALESCE(AVG(rating), 0) as avg_rating_received
       FROM reviews 
       WHERE reviewee_id = $1`,
      [id]
    );

    // 获取最近的钱包交易记录
    const transactionsResult = await pool.query(
      `SELECT 
        id, type, amount, balance_after,
        status, description, created_at
       FROM wallet_transactions 
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT 10`,
      [id]
    );

    // 获取用户的证书（如果是工人）
    let certificates: any[] = [];
    if (user.user_type === 'worker') {
      const certResult = await pool.query(
        `SELECT 
          id, certificate_name, certificate_type, issue_date,
          status, reject_reason, created_at
         FROM certificates 
         WHERE user_id = $1
         ORDER BY created_at DESC`,
        [id]
      );
      certificates = certResult.rows;
    }

    res.json({
      user: {
        id: user.id,
        phone: user.phone,
        nickname: user.nickname,
        avatar: user.avatar_url,
        userType: user.user_type,
        isVerified: user.is_verified,
        realName: user.real_name,
        idCard: user.id_card ? user.id_card.slice(0, 4) + '**********' + user.id_card.slice(-4) : null,
        bio: user.bio,
        skills: user.skills || [],
        rating: parseFloat(user.rating) || 5.0,
        totalOrders: user.total_orders || 0,
        completedOrders: user.completed_orders || 0,
        balance: parseFloat(user.balance) || 0,
        isOnline: user.is_online || false,
        createdAt: user.created_at,
        updatedAt: user.updated_at,
      },
      bankCards: bankCardsResult.rows.map(card => ({
        id: card.id,
        bankName: card.bank_name,
        bankCardNumber: card.card_number.slice(-4),
        cardHolderName: card.card_holder,
        isDefault: card.is_default,
        status: card.status,
        createdAt: card.created_at,
      })),
      verification: verificationResult.rows[0] ? {
        id: verificationResult.rows[0].id,
        realName: verificationResult.rows[0].real_name,
        idCardNumber: verificationResult.rows[0].id_card_number.slice(0, 4) + '**********' + verificationResult.rows[0].id_card_number.slice(-4),
        status: verificationResult.rows[0].status,
        rejectReason: verificationResult.rows[0].reject_reason,
        submittedAt: verificationResult.rows[0].submitted_at,
        reviewedAt: verificationResult.rows[0].reviewed_at,
      } : null,
      taskStats: taskStats ? {
        totalTasks: parseInt(taskStats.total_tasks),
        openTasks: parseInt(taskStats.open_tasks),
        assignedTasks: parseInt(taskStats.assigned_tasks),
        completedTasks: parseInt(taskStats.completed_tasks),
        cancelledTasks: parseInt(taskStats.cancelled_tasks),
      } : null,
      orderStats: {
        employerOrders: parseInt(orderStatsResult.rows[0].employer_orders),
        workerOrders: parseInt(orderStatsResult.rows[0].worker_orders),
        completedOrders: parseInt(orderStatsResult.rows[0].completed_orders),
        cancelledOrders: parseInt(orderStatsResult.rows[0].cancelled_orders),
        totalEarnings: parseFloat(orderStatsResult.rows[0].total_earnings),
      },
      reviewStats: {
        totalReviews: parseInt(reviewStatsResult.rows[0].total_reviews),
        avgRating: parseFloat(reviewStatsResult.rows[0].avg_rating_received) || 0,
      },
      transactions: transactionsResult.rows.map(t => ({
        id: t.id,
        type: t.type,
        amount: parseFloat(t.amount),
        balanceAfter: parseFloat(t.balance_after),
        status: t.status,
        description: t.description,
        createdAt: t.created_at,
      })),
      certificates: certificates.map(cert => ({
        id: cert.id,
        certificateName: cert.certificate_name,
        certificateType: cert.certificate_type,
        issueDate: cert.issue_date,
        status: cert.status,
        rejectReason: cert.reject_reason,
        createdAt: cert.created_at,
      })),
    });
  } catch (error) {
    console.error('Get user detail error:', error);
    res.status(500).json({ error: '获取用户详情失败' });
  }
});

/**
 * 获取订单列表
 * GET /api/v1/admin/orders?page=1&limit=20&status=completed
 */
router.get('/orders', authenticateAdmin, async (req: AdminRequest, res) => {
  try {
    const { page = 1, limit = 20, status, startDate, endDate } = req.query;
    const offset = (parseInt(page as string) - 1) * parseInt(limit as string);

    let whereConditions = '1=1';
    const params: any[] = [];
    let paramIndex = 1;

    if (status) {
      whereConditions += ` AND o.status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    if (startDate) {
      whereConditions += ` AND o.created_at >= $${paramIndex}`;
      params.push(startDate);
      paramIndex++;
    }

    if (endDate) {
      whereConditions += ` AND o.created_at <= $${paramIndex}`;
      params.push(endDate);
      paramIndex++;
    }

    // 获取总数
    const countResult = await pool.query(
      `SELECT COUNT(*) FROM orders o WHERE ${whereConditions}`,
      params
    );

    // 获取列表
    const result = await pool.query(
      `SELECT 
        o.id, o.status, o.agreed_amount, o.start_time, o.end_time, o.created_at,
        o.cancellation_reason,
        t.title as task_title, t.address,
        employer.nickname as employer_name, employer.phone as employer_phone,
        worker.nickname as worker_name, worker.phone as worker_phone
       FROM orders o
       LEFT JOIN tasks t ON o.task_id = t.id
       LEFT JOIN users employer ON o.employer_id = employer.id
       LEFT JOIN users worker ON o.worker_id = worker.id
       WHERE ${whereConditions}
       ORDER BY o.created_at DESC
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      [...params, parseInt(limit as string), offset]
    );

    res.json({
      total: parseInt(countResult.rows[0].count),
      page: parseInt(page as string),
      limit: parseInt(limit as string),
      orders: result.rows.map(order => ({
        id: order.id,
        status: order.status,
        taskTitle: order.task_title,
        address: order.address,
        agreedAmount: parseFloat(order.agreed_amount) || 0,
        employer: {
          name: order.employer_name,
          phone: order.employer_phone,
        },
        worker: {
          name: order.worker_name,
          phone: order.worker_phone,
        },
        startTime: order.start_time,
        endTime: order.end_time,
        cancellationReason: order.cancellation_reason,
        createdAt: order.created_at,
      })),
    });
  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({ error: '获取订单列表失败' });
  }
});

/**
 * 获取实名认证列表
 * GET /api/v1/admin/verifications
 */
router.get('/verifications', authenticateAdmin, async (req: AdminRequest, res) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    const offset = (parseInt(page as string) - 1) * parseInt(limit as string);

    let whereConditions = '1=1';
    const params: any[] = [];
    let paramIndex = 1;

    if (status) {
      whereConditions += ` AND v.status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    // 获取总数
    const countResult = await pool.query(
      `SELECT COUNT(*) FROM verifications v WHERE ${whereConditions}`,
      params
    );

    // 获取列表
    const result = await pool.query(
      `SELECT 
        v.id, v.real_name, v.id_card_number, v.status, v.reject_reason,
        v.id_card_front_key, v.id_card_back_key,
        v.submitted_at, v.reviewed_at,
        u.nickname as user_nickname, u.phone as user_phone, u.user_type
       FROM verifications v
       LEFT JOIN users u ON v.user_id = u.id
       WHERE ${whereConditions}
       ORDER BY v.submitted_at DESC
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      [...params, parseInt(limit as string), offset]
    );

    res.json({
      total: parseInt(countResult.rows[0].count),
      page: parseInt(page as string),
      limit: parseInt(limit as string),
      verifications: result.rows.map(v => ({
        id: v.id,
        realName: v.real_name,
        idCardNumber: v.id_card_number.slice(0, 4) + '**********' + v.id_card_number.slice(-4),
        status: v.status,
        rejectReason: v.reject_reason,
        frontImageKey: v.id_card_front_key,
        backImageKey: v.id_card_back_key,
        submittedAt: v.submitted_at,
        reviewedAt: v.reviewed_at,
        user: {
          nickname: v.user_nickname,
          phone: v.user_phone,
          userType: v.user_type,
        },
      })),
    });
  } catch (error) {
    console.error('Get verifications error:', error);
    res.status(500).json({ error: '获取认证列表失败' });
  }
});

/**
 * 获取任务列表
 * GET /api/v1/admin/tasks?page=1&limit=20&status=open
 */
router.get('/tasks', authenticateAdmin, async (req: AdminRequest, res) => {
  try {
    const { page = 1, limit = 20, status, keyword, categoryId } = req.query;
    const offset = (parseInt(page as string) - 1) * parseInt(limit as string);

    let whereConditions = '1=1';
    const params: any[] = [];
    let paramIndex = 1;

    if (status) {
      whereConditions += ` AND t.status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    if (keyword) {
      whereConditions += ` AND (t.title ILIKE $${paramIndex} OR t.description ILIKE $${paramIndex})`;
      params.push(`%${keyword}%`);
      paramIndex++;
    }

    if (categoryId) {
      whereConditions += ` AND t.category_id = $${paramIndex}`;
      params.push(categoryId);
      paramIndex++;
    }

    // 获取总数
    const countResult = await pool.query(
      `SELECT COUNT(*) FROM tasks t WHERE ${whereConditions}`,
      params
    );

    // 获取列表
    const result = await pool.query(
      `SELECT 
        t.id, t.title, t.description, t.status, t.budget_min, t.budget_max,
        t.address, t.work_time, t.created_at,
        tc.name as category_name,
        employer.nickname as employer_name, employer.phone as employer_phone
       FROM tasks t
       LEFT JOIN task_categories tc ON t.category_id = tc.id
       LEFT JOIN users employer ON t.employer_id = employer.id
       WHERE ${whereConditions}
       ORDER BY t.created_at DESC
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      [...params, parseInt(limit as string), offset]
    );

    res.json({
      total: parseInt(countResult.rows[0].count),
      page: parseInt(page as string),
      limit: parseInt(limit as string),
      tasks: result.rows.map(task => ({
        id: task.id,
        title: task.title,
        description: task.description,
        status: task.status,
        categoryName: task.category_name,
        budgetMin: parseFloat(task.budget_min) || 0,
        budgetMax: parseFloat(task.budget_max) || 0,
        address: task.address,
        workTime: task.work_time,
        employer: {
          name: task.employer_name,
          phone: task.employer_phone,
        },
        createdAt: task.created_at,
      })),
    });
  } catch (error) {
    console.error('Get tasks error:', error);
    res.status(500).json({ error: '获取任务列表失败' });
  }
});

// ============ 数据导出 ============

/**
 * 导出用户数据
 * GET /api/v1/admin/export/users
 */
router.get('/export/users', authenticateAdmin, async (req: AdminRequest, res: Response) => {
  try {
    const { type, status, startDate, endDate } = req.query;

    let whereConditions = '1=1';
    const params: any[] = [];
    let paramIndex = 1;

    if (type) {
      whereConditions += ` AND user_type = $${paramIndex}`;
      params.push(type);
      paramIndex++;
    }

    if (status === 'verified') {
      whereConditions += ` AND is_verified = true`;
    } else if (status === 'unverified') {
      whereConditions += ` AND is_verified = false`;
    }

    if (startDate) {
      whereConditions += ` AND created_at >= $${paramIndex}`;
      params.push(startDate);
      paramIndex++;
    }

    if (endDate) {
      whereConditions += ` AND created_at <= $${paramIndex}`;
      params.push(endDate);
      paramIndex++;
    }

    const result = await pool.query(
      `SELECT 
        id, phone, nickname, user_type, is_verified, rating, 
        total_orders, completed_orders, balance, created_at
       FROM users 
       WHERE ${whereConditions}
       ORDER BY created_at DESC
       LIMIT 10000`,
      params
    );

    // 生成CSV
    const headers = ['ID', '手机号', '昵称', '用户类型', '认证状态', '评分', '总订单', '已完成订单', '余额', '注册时间'];
    const rows = result.rows.map(user => [
      user.id,
      user.phone,
      user.nickname || '',
      user.user_type === 'worker' ? '工人' : '雇主',
      user.is_verified ? '已认证' : '未认证',
      parseFloat(user.rating).toFixed(1),
      user.total_orders || 0,
      user.completed_orders || 0,
      parseFloat(user.balance).toFixed(2),
      new Date(user.created_at).toLocaleString('zh-CN')
    ]);

    const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');
    const bom = '\uFEFF'; // UTF-8 BOM for Excel

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename=users_${Date.now()}.csv`);
    res.send(bom + csvContent);
  } catch (error) {
    console.error('Export users error:', error);
    res.status(500).json({ error: '导出用户数据失败' });
  }
});

/**
 * 导出订单数据
 * GET /api/v1/admin/export/orders
 */
router.get('/export/orders', authenticateAdmin, async (req: AdminRequest, res: Response) => {
  try {
    const { status, startDate, endDate } = req.query;

    let whereConditions = '1=1';
    const params: any[] = [];
    let paramIndex = 1;

    if (status) {
      whereConditions += ` AND o.status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    if (startDate) {
      whereConditions += ` AND o.created_at >= $${paramIndex}`;
      params.push(startDate);
      paramIndex++;
    }

    if (endDate) {
      whereConditions += ` AND o.created_at <= $${paramIndex}`;
      params.push(endDate);
      paramIndex++;
    }

    const result = await pool.query(
      `SELECT 
        o.id, o.status, o.agreed_amount, o.start_time, o.end_time, o.created_at,
        t.title as task_title, t.address,
        employer.nickname as employer_name, employer.phone as employer_phone,
        worker.nickname as worker_name, worker.phone as worker_phone
       FROM orders o
       LEFT JOIN tasks t ON o.task_id = t.id
       LEFT JOIN users employer ON o.employer_id = employer.id
       LEFT JOIN users worker ON o.worker_id = worker.id
       WHERE ${whereConditions}
       ORDER BY o.created_at DESC
       LIMIT 10000`,
      params
    );

    // 生成CSV
    const headers = ['订单ID', '任务标题', '状态', '金额', '地址', '雇主', '雇主电话', '工人', '工人电话', '开始时间', '结束时间', '创建时间'];
    const statusMap: Record<string, string> = {
      pending: '待接单',
      accepted: '已接单',
      in_progress: '进行中',
      completed: '已完成',
      cancelled: '已取消'
    };
    const rows = result.rows.map(order => [
      order.id,
      order.task_title || '',
      statusMap[order.status] || order.status,
      parseFloat(order.agreed_amount).toFixed(2),
      order.address || '',
      order.employer_name || '',
      order.employer_phone || '',
      order.worker_name || '',
      order.worker_phone || '',
      order.start_time || '',
      order.end_time || '',
      new Date(order.created_at).toLocaleString('zh-CN')
    ]);

    const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');
    const bom = '\uFEFF';

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename=orders_${Date.now()}.csv`);
    res.send(bom + csvContent);
  } catch (error) {
    console.error('Export orders error:', error);
    res.status(500).json({ error: '导出订单数据失败' });
  }
});

/**
 * 导出任务数据
 * GET /api/v1/admin/export/tasks
 */
router.get('/export/tasks', authenticateAdmin, async (req: AdminRequest, res: Response) => {
  try {
    const { status, startDate, endDate } = req.query;

    let whereConditions = '1=1';
    const params: any[] = [];
    let paramIndex = 1;

    if (status) {
      whereConditions += ` AND t.status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    if (startDate) {
      whereConditions += ` AND t.created_at >= $${paramIndex}`;
      params.push(startDate);
      paramIndex++;
    }

    if (endDate) {
      whereConditions += ` AND t.created_at <= $${paramIndex}`;
      params.push(endDate);
      paramIndex++;
    }

    const result = await pool.query(
      `SELECT 
        t.id, t.title, t.description, t.status, t.budget_min, t.budget_max,
        t.address, t.work_time, t.created_at,
        tc.name as category_name,
        employer.nickname as employer_name, employer.phone as employer_phone
       FROM tasks t
       LEFT JOIN task_categories tc ON t.category_id = tc.id
       LEFT JOIN users employer ON t.employer_id = employer.id
       WHERE ${whereConditions}
       ORDER BY t.created_at DESC
       LIMIT 10000`,
      params
    );

    // 生成CSV
    const headers = ['任务ID', '标题', '描述', '状态', '分类', '预算最低', '预算最高', '地址', '工作时间', '发布者', '发布者电话', '创建时间'];
    const statusMap: Record<string, string> = {
      open: '待接单',
      assigned: '已指派',
      in_progress: '进行中',
      completed: '已完成',
      cancelled: '已取消'
    };
    const rows = result.rows.map(task => [
      task.id,
      task.title,
      (task.description || '').replace(/,/g, '，').substring(0, 100),
      statusMap[task.status] || task.status,
      task.category_name || '',
      parseFloat(task.budget_min).toFixed(2),
      parseFloat(task.budget_max).toFixed(2),
      task.address || '',
      task.work_time || '',
      task.employer_name || '',
      task.employer_phone || '',
      new Date(task.created_at).toLocaleString('zh-CN')
    ]);

    const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');
    const bom = '\uFEFF';

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename=tasks_${Date.now()}.csv`);
    res.send(bom + csvContent);
  } catch (error) {
    console.error('Export tasks error:', error);
    res.status(500).json({ error: '导出任务数据失败' });
  }
});

/**
 * 审核实名认证
 * POST /api/v1/admin/verifications/review
 */
router.post('/verifications/review', authenticateAdmin, [
  body('verificationId').isInt({ min: 1 }).withMessage('无效的认证ID'),
  body('status').isIn(['approved', 'rejected']).withMessage('无效的审核状态'),
], async (req: AdminRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { verificationId, status, rejectReason } = req.body;

    if (status === 'rejected' && !rejectReason) {
      return res.status(400).json({ error: '请填写拒绝原因' });
    }

    // 更新认证状态
    await pool.query(
      `UPDATE verifications 
       SET status = $1, reject_reason = $2, reviewed_at = CURRENT_TIMESTAMP
       WHERE id = $3`,
      [status, rejectReason || null, verificationId]
    );

    // 如果审核通过，更新用户的认证状态
    if (status === 'approved') {
      const verificationResult = await pool.query(
        'SELECT user_id, real_name, id_card_number FROM verifications WHERE id = $1',
        [verificationId]
      );
      
      if (verificationResult.rows.length > 0) {
        const { user_id, real_name, id_card_number } = verificationResult.rows[0];
        await pool.query(
          'UPDATE users SET is_verified = TRUE, real_name = $1, id_card = $2 WHERE id = $3',
          [real_name, id_card_number, user_id]
        );
      }
    }

    res.json({ success: true, message: '审核完成' });
  } catch (error) {
    console.error('Review verification error:', error);
    res.status(500).json({ error: '审核失败' });
  }
});

// ============ 管理员管理 ============

/**
 * 获取管理员列表
 * GET /api/v1/admin/managers
 */
router.get('/managers', authenticateAdmin, async (req: AdminRequest, res: Response) => {
  try {
    const { page = 1, limit = 20, keyword, status } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    let whereClause = 'WHERE 1=1';
    const params: any[] = [];
    let paramIndex = 1;

    if (keyword) {
      whereClause += ` AND (username ILIKE $${paramIndex} OR nickname ILIKE $${paramIndex})`;
      params.push(`%${keyword}%`);
      paramIndex++;
    }

    if (status) {
      whereClause += ` AND status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    // 获取总数
    const countResult = await pool.query(
      `SELECT COUNT(*) as total FROM admins ${whereClause}`,
      params
    );
    const total = parseInt(countResult.rows[0].total);

    // 获取列表
    const result = await pool.query(
      `SELECT id, username, nickname, email, phone, role, status, last_login_at, created_at
       FROM admins ${whereClause}
       ORDER BY id ASC
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      [...params, Number(limit), offset]
    );

    res.json({
      managers: result.rows,
      total,
      page: Number(page),
      limit: Number(limit),
    });
  } catch (error) {
    console.error('Get managers error:', error);
    res.status(500).json({ error: '获取管理员列表失败' });
  }
});

/**
 * 创建管理员
 * POST /api/v1/admin/managers
 */
router.post('/managers', authenticateAdmin, [
  body('username').isLength({ min: 3, max: 50 }).withMessage('用户名长度3-50位'),
  body('password').isLength({ min: 6 }).withMessage('密码至少6位'),
  body('role').isIn(['admin', 'super_admin']).withMessage('无效的角色'),
], async (req: AdminRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { username, password, nickname, email, phone, role } = req.body;

    // 检查用户名是否已存在
    const existingAdmin = await pool.query(
      'SELECT id FROM admins WHERE username = $1',
      [username]
    );
    if (existingAdmin.rows.length > 0) {
      return res.status(400).json({ error: '用户名已存在' });
    }

    // 加密密码
    const passwordHash = await bcrypt.hash(password, 10);

    // 创建管理员
    const result = await pool.query(
      `INSERT INTO admins (username, password_hash, nickname, email, phone, role, status)
       VALUES ($1, $2, $3, $4, $5, $6, 'active')
       RETURNING id, username, nickname, email, phone, role, status, created_at`,
      [username, passwordHash, nickname || null, email || null, phone || null, role]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Create manager error:', error);
    res.status(500).json({ error: '创建管理员失败' });
  }
});

/**
 * 更新管理员
 * PUT /api/v1/admin/managers/:id
 */
router.put('/managers/:id', authenticateAdmin, [
  body('role').optional().isIn(['admin', 'super_admin']).withMessage('无效的角色'),
  body('status').optional().isIn(['active', 'disabled']).withMessage('无效的状态'),
], async (req: AdminRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { nickname, email, phone, role, status, password } = req.body;

    // 检查管理员是否存在
    const existingAdmin = await pool.query(
      'SELECT id, username FROM admins WHERE id = $1',
      [id]
    );
    if (existingAdmin.rows.length === 0) {
      return res.status(404).json({ error: '管理员不存在' });
    }

    // 构建更新语句
    const updates: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    if (nickname !== undefined) {
      updates.push(`nickname = $${paramIndex}`);
      params.push(nickname || null);
      paramIndex++;
    }
    if (email !== undefined) {
      updates.push(`email = $${paramIndex}`);
      params.push(email || null);
      paramIndex++;
    }
    if (phone !== undefined) {
      updates.push(`phone = $${paramIndex}`);
      params.push(phone || null);
      paramIndex++;
    }
    if (role) {
      updates.push(`role = $${paramIndex}`);
      params.push(role);
      paramIndex++;
    }
    if (status) {
      updates.push(`status = $${paramIndex}`);
      params.push(status);
      paramIndex++;
    }
    if (password) {
      const passwordHash = await bcrypt.hash(password, 10);
      updates.push(`password_hash = $${paramIndex}`);
      params.push(passwordHash);
      paramIndex++;
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: '没有要更新的内容' });
    }

    updates.push(`updated_at = NOW()`);
    params.push(id);

    const result = await pool.query(
      `UPDATE admins SET ${updates.join(', ')} WHERE id = $${paramIndex}
       RETURNING id, username, nickname, email, phone, role, status, created_at`,
      params
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update manager error:', error);
    res.status(500).json({ error: '更新管理员失败' });
  }
});

/**
 * 删除管理员
 * DELETE /api/v1/admin/managers/:id
 */
router.delete('/managers/:id', authenticateAdmin, async (req: AdminRequest, res: Response) => {
  try {
    const { id } = req.params;

    // 检查管理员是否存在
    const existingAdmin = await pool.query(
      'SELECT id, role FROM admins WHERE id = $1',
      [id]
    );
    if (existingAdmin.rows.length === 0) {
      return res.status(404).json({ error: '管理员不存在' });
    }

    // 不能删除超级管理员
    if (existingAdmin.rows[0].role === 'super_admin') {
      return res.status(403).json({ error: '不能删除超级管理员' });
    }

    // 不能删除自己
    if (existingAdmin.rows[0].id === req.admin!.adminId) {
      return res.status(403).json({ error: '不能删除自己' });
    }

    await pool.query('DELETE FROM admins WHERE id = $1', [id]);

    res.json({ success: true, message: '删除成功' });
  } catch (error) {
    console.error('Delete manager error:', error);
    res.status(500).json({ error: '删除管理员失败' });
  }
});

export default router;
