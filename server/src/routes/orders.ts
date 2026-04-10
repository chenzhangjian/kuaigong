import express from 'express';
import jwt from 'jsonwebtoken';
import pool from '../db';
import { JWT_SECRET } from '../config/auth';

const router = express.Router();

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

// 获取订单列表
router.get('/', authenticate, async (req: any, res) => {
  try {
    const { status, role, page = 1, limit = 20 } = req.query;
    const offset = (parseInt(page as string) - 1) * parseInt(limit as string);

    let whereCondition = '';
    if (role === 'worker') {
      whereCondition = 'o.worker_id = $1';
    } else if (role === 'employer') {
      whereCondition = 'o.employer_id = $1';
    } else {
      whereCondition = '(o.worker_id = $1 OR o.employer_id = $1)';
    }

    let params: any[] = [req.user.userId];
    let paramIndex = 2;

    if (status) {
      whereCondition += ` AND o.status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    // 添加分页参数
    const limitNum = parseInt(limit as string) || 20;
    const limitIndex = paramIndex;
    const offsetIndex = paramIndex + 1;
    params.push(limitNum, offset);

    const result = await pool.query(
      `SELECT 
        o.id, o.status, o.agreed_amount, o.start_time, o.end_time, o.created_at,
        t.id as task_id, t.title, t.address, t.budget_fixed, t.budget_min, t.budget_max,
        t.images as task_images,
        employer.id as employer_id, employer.nickname as employer_name, employer.avatar_url as employer_avatar,
        worker.id as worker_id, worker.nickname as worker_name, worker.avatar_url as worker_avatar
       FROM orders o
       LEFT JOIN tasks t ON o.task_id = t.id
       LEFT JOIN users employer ON o.employer_id = employer.id
       LEFT JOIN users worker ON o.worker_id = worker.id
       WHERE ${whereCondition}
       ORDER BY o.created_at DESC
       LIMIT $${limitIndex} OFFSET $${offsetIndex}`,
      params
    );

    res.json({
      orders: result.rows.map(order => ({
        id: order.id,
        status: order.status,
        agreedAmount: order.agreed_amount,
        startTime: order.start_time,
        endTime: order.end_time,
        createdAt: order.created_at,
        task: {
          id: order.task_id,
          title: order.title,
          address: order.address,
          budget: {
            fixed: order.budget_fixed,
            min: order.budget_min,
            max: order.budget_max,
          },
          images: order.task_images || [],
        },
        employer: {
          id: order.employer_id,
          name: order.employer_name,
          avatar: order.employer_avatar,
        },
        worker: {
          id: order.worker_id,
          name: order.worker_name,
          avatar: order.worker_avatar,
        },
      })),
      page: parseInt(page as string),
      limit: parseInt(limit as string),
    });
  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({ error: '获取订单列表失败' });
  }
});

// 接受申请（雇主选择工人）
router.post('/accept-application/:applicationId', authenticate, async (req: any, res) => {
  try {
    if (req.user.userType !== 'employer') {
      return res.status(403).json({ error: '只有雇主可以选择工人' });
    }

    const { applicationId } = req.params;
    const { agreedAmount } = req.body;

    // 获取申请信息
    const appResult = await pool.query(
      `SELECT ta.*, t.employer_id, t.budget_fixed, t.budget_min, t.budget_max
       FROM task_applications ta
       LEFT JOIN tasks t ON ta.task_id = t.id
       WHERE ta.id = $1`,
      [applicationId]
    );

    if (appResult.rows.length === 0) {
      return res.status(404).json({ error: '申请不存在' });
    }

    const application = appResult.rows[0];

    if (application.employer_id !== req.user.userId) {
      return res.status(403).json({ error: '无权操作' });
    }

    if (application.status !== 'pending') {
      return res.status(400).json({ error: '申请已处理' });
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // 更新申请状态
      await client.query(
        'UPDATE task_applications SET status = $1 WHERE id = $2',
        ['accepted', applicationId]
      );

      // 创建订单
      const orderResult = await client.query(
        `INSERT INTO orders (task_id, worker_id, employer_id, agreed_amount, status)
         VALUES ($1, $2, $3, $4, 'accepted')
         RETURNING *`,
        [
          application.task_id,
          application.worker_id,
          application.employer_id,
          agreedAmount || application.proposed_amount || application.budget_fixed,
        ]
      );

      // 更新任务状态
      await client.query(
        'UPDATE tasks SET status = $1 WHERE id = $2',
        ['assigned', application.task_id]
      );

      await client.query('COMMIT');
      res.status(201).json(orderResult.rows[0]);
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Accept application error:', error);
    res.status(500).json({ error: '接受申请失败' });
  }
});

// 开始工作（工人）
router.post('/:id/start', authenticate, async (req: any, res) => {
  try {
    if (req.user.userType !== 'worker') {
      return res.status(403).json({ error: '只有工人可以开始工作' });
    }

    const { id } = req.params;

    const result = await pool.query(
      `UPDATE orders 
       SET status = 'in_progress', start_time = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
       WHERE id = $1 AND worker_id = $2 AND status = 'accepted'
       RETURNING *`,
      [id, req.user.userId]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({ error: '订单状态不正确' });
    }

    // 更新任务状态
    await pool.query(
      'UPDATE tasks SET status = $1 WHERE id = $2',
      ['in_progress', result.rows[0].task_id]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Start work error:', error);
    res.status(500).json({ error: '开始工作失败' });
  }
});

// 完成工作（工人提交）
router.post('/:id/complete', authenticate, async (req: any, res) => {
  try {
    if (req.user.userType !== 'worker') {
      return res.status(403).json({ error: '只有工人可以提交完成' });
    }

    const { id } = req.params;
    const { completionPhotos } = req.body;

    const result = await pool.query(
      `UPDATE orders 
       SET completion_photos = $1, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2 AND worker_id = $3 AND status = 'in_progress'
       RETURNING *`,
      [completionPhotos || [], id, req.user.userId]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({ error: '订单状态不正确' });
    }

    res.json({ message: '已提交完成申请，等待雇主确认' });
  } catch (error) {
    console.error('Complete work error:', error);
    res.status(500).json({ error: '提交失败' });
  }
});

// 确认完成（雇主）
router.post('/:id/confirm', authenticate, async (req: any, res) => {
  try {
    if (req.user.userType !== 'employer') {
      return res.status(403).json({ error: '只有雇主可以确认完成' });
    }

    const { id } = req.params;

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const orderResult = await client.query(
        `UPDATE orders 
         SET status = 'completed', end_time = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
         WHERE id = $1 AND employer_id = $2 AND status = 'in_progress'
         RETURNING *`,
        [id, req.user.userId]
      );

      if (orderResult.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(400).json({ error: '订单状态不正确' });
      }

      const order = orderResult.rows[0];

      // 更新任务状态
      await client.query(
        'UPDATE tasks SET status = $1 WHERE id = $2',
        ['completed', order.task_id]
      );

      // 更新工人信息
      await client.query(
        `UPDATE users 
         SET total_orders = total_orders + 1,
             completed_orders = completed_orders + 1,
             balance = balance + $1
         WHERE id = $2`,
        [order.agreed_amount * 0.9, order.worker_id] // 假设平台抽成10%
      );

      // 创建交易记录
      await client.query(
        `INSERT INTO wallet_transactions (user_id, order_id, type, amount, balance_after, description)
         SELECT $1, $2, 'income', $3, balance, $4
         FROM users WHERE id = $1`,
        [
          order.worker_id,
          order.id,
          order.agreed_amount * 0.9,
          `完成任务收入（订单ID: ${order.id}）`,
        ]
      );

      await client.query('COMMIT');
      res.json({ message: '订单已完成' });
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Confirm order error:', error);
    res.status(500).json({ error: '确认失败' });
  }
});

// 取消订单（包含退款逻辑）
router.post('/:id/cancel', authenticate, async (req: any, res) => {
  try {
    const { id } = req.params;
    const { reason, cancelledBy } = req.body;

    const orderResult = await pool.query(
      'SELECT o.*, t.title as task_title, t.employer_id as task_employer_id FROM orders o LEFT JOIN tasks t ON o.task_id = t.id WHERE o.id = $1',
      [id]
    );

    if (orderResult.rows.length === 0) {
      return res.status(404).json({ error: '订单不存在' });
    }

    const order = orderResult.rows[0];

    // 验证权限
    if (order.worker_id !== req.user.userId && order.employer_id !== req.user.userId) {
      return res.status(403).json({ error: '无权操作' });
    }

    // 检查订单状态是否可取消
    if (!['accepted', 'in_progress'].includes(order.status)) {
      return res.status(400).json({ error: '当前订单状态无法取消' });
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // 更新订单状态
      await client.query(
        `UPDATE orders 
         SET status = 'cancelled', 
             cancellation_reason = $1, 
             cancelled_by = $2,
             cancelled_at = CURRENT_TIMESTAMP,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $3`,
        [reason, req.user.userId, id]
      );

      // 更新任务状态为open（重新发布）
      await client.query(
        'UPDATE tasks SET status = $1 WHERE id = $2',
        ['open', order.task_id]
      );

      // 退款逻辑：如果是雇主取消，需要将已支付金额退还给雇主
      // 当前设计：订单完成后才结算给工人，所以取消时雇主没有预付款
      // 但如果未来有预付款机制，这里需要添加退款逻辑
      
      // 如果需要给工人补偿（比如雇主无理由取消）
      // 这里可以根据取消原因和时间计算补偿金额
      
      // 创建取消记录
      await client.query(
        `INSERT INTO order_cancellations (order_id, cancelled_by, reason, refund_amount)
         VALUES ($1, $2, $3, 0)`,
        [id, req.user.userId, reason]
      );

      await client.query('COMMIT');
      
      res.json({ 
        success: true,
        message: '订单已取消',
        data: {
          orderId: id,
          status: 'cancelled',
        }
      });
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Cancel order error:', error);
    res.status(500).json({ error: '取消失败' });
  }
});

// 提交评价
router.post('/:id/review', authenticate, async (req: any, res) => {
  try {
    const { id } = req.params;
    const { rating, comment } = req.body;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ error: '请选择1-5星评分' });
    }

    const orderResult = await pool.query(
      'SELECT * FROM orders WHERE id = $1 AND status = $2',
      [id, 'completed']
    );

    if (orderResult.rows.length === 0) {
      return res.status(404).json({ error: '订单不存在或未完成' });
    }

    const order = orderResult.rows[0];

    // 确定被评价人
    const revieweeId = req.user.userId === order.worker_id ? order.employer_id : order.worker_id;

    // 检查是否已评价
    const existingReview = await pool.query(
      'SELECT id FROM reviews WHERE order_id = $1 AND reviewer_id = $2',
      [id, req.user.userId]
    );

    if (existingReview.rows.length > 0) {
      return res.status(400).json({ error: '您已评价过该订单' });
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // 创建评价
      await client.query(
        `INSERT INTO reviews (order_id, reviewer_id, reviewee_id, rating, comment)
         VALUES ($1, $2, $3, $4, $5)`,
        [id, req.user.userId, revieweeId, rating, comment]
      );

      // 更新被评价人的平均评分
      await client.query(
        `UPDATE users 
         SET rating = (
           SELECT AVG(rating) FROM reviews WHERE reviewee_id = $1
         )
         WHERE id = $1`,
        [revieweeId]
      );

      await client.query('COMMIT');
      res.status(201).json({ message: '评价成功' });
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Submit review error:', error);
    res.status(500).json({ error: '评价失败' });
  }
});

/**
 * 工人上报位置
 * POST /api/v1/orders/:id/worker-location
 * Body: latitude, longitude
 */
router.post('/:id/worker-location', authenticate, async (req: any, res) => {
  try {
    if (req.user.userType !== 'worker') {
      return res.status(403).json({ error: '只有工人可以上报位置' });
    }

    const { id } = req.params;
    const { latitude, longitude } = req.body;

    if (!latitude || !longitude) {
      return res.status(400).json({ error: '位置信息不完整' });
    }

    // 验证订单归属和状态
    const orderResult = await pool.query(
      `SELECT id, status FROM orders WHERE id = $1 AND worker_id = $2`,
      [id, req.user.userId]
    );

    if (orderResult.rows.length === 0) {
      return res.status(404).json({ error: '订单不存在或无权操作' });
    }

    const order = orderResult.rows[0];

    // 只有进行中的订单才能上报位置
    if (order.status !== 'in_progress' && order.status !== 'accepted') {
      return res.status(400).json({ error: '当前订单状态不支持位置上报' });
    }

    // 更新工人位置
    await pool.query(
      `UPDATE orders 
       SET worker_location_latitude = $1,
           worker_location_longitude = $2,
           worker_location_updated_at = CURRENT_TIMESTAMP,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $3`,
      [latitude, longitude, id]
    );

    res.json({ 
      success: true, 
      message: '位置上报成功',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Update worker location error:', error);
    res.status(500).json({ error: '位置上报失败' });
  }
});

/**
 * 获取工人实时位置（雇主调用）
 * GET /api/v1/orders/:id/worker-location
 */
router.get('/:id/worker-location', authenticate, async (req: any, res) => {
  try {
    const { id } = req.params;

    // 验证订单归属
    const orderResult = await pool.query(
      `SELECT 
        o.id, o.status, o.worker_id, o.employer_id,
        o.worker_location_latitude, o.worker_location_longitude, o.worker_location_updated_at,
        u.nickname as worker_name, u.avatar_url as worker_avatar
       FROM orders o
       LEFT JOIN users u ON o.worker_id = u.id
       WHERE o.id = $1`,
      [id]
    );

    if (orderResult.rows.length === 0) {
      return res.status(404).json({ error: '订单不存在' });
    }

    const order = orderResult.rows[0];

    // 验证权限（雇主或工人自己都可以查看）
    if (order.worker_id !== req.user.userId && order.employer_id !== req.user.userId) {
      return res.status(403).json({ error: '无权查看该订单' });
    }

    // 如果没有位置信息
    if (!order.worker_location_latitude || !order.worker_location_longitude) {
      return res.json({
        hasLocation: false,
        message: '工人暂未上报位置',
        worker: {
          id: order.worker_id,
          name: order.worker_name,
          avatar: order.worker_avatar,
        },
        orderStatus: order.status,
      });
    }

    res.json({
      hasLocation: true,
      location: {
        latitude: parseFloat(order.worker_location_latitude),
        longitude: parseFloat(order.worker_location_longitude),
        updatedAt: order.worker_location_updated_at,
      },
      worker: {
        id: order.worker_id,
        name: order.worker_name,
        avatar: order.worker_avatar,
      },
      orderStatus: order.status,
    });
  } catch (error) {
    console.error('Get worker location error:', error);
    res.status(500).json({ error: '获取位置失败' });
  }
});

/**
 * 获取合作过的工人列表（雇主调用）
 * GET /api/v1/orders/my-workers
 */
router.get('/my-workers', authenticate, async (req: any, res) => {
  try {
    if (req.user.userType !== 'employer') {
      return res.status(403).json({ error: '只有雇主可以查看' });
    }

    const result = await pool.query(
      `SELECT DISTINCT ON (u.id)
        u.id,
        u.nickname as name,
        u.avatar_url as avatar,
        u.rating,
        u.skills,
        u.total_orders,
        u.completed_orders,
        MAX(o.end_time) as last_order_date,
        COUNT(o.id) as cooperation_count
       FROM orders o
       LEFT JOIN users u ON o.worker_id = u.id
       WHERE o.employer_id = $1 AND o.status = 'completed'
       GROUP BY u.id, u.nickname, u.avatar_url, u.rating, u.skills, u.total_orders, u.completed_orders
       ORDER BY u.id, MAX(o.end_time) DESC`,
      [req.user.userId]
    );

    res.json(result.rows.map(worker => ({
      id: worker.id,
      name: worker.name,
      avatar: worker.avatar,
      rating: parseFloat(worker.rating) || 5.0,
      skills: worker.skills || [],
      totalOrders: worker.total_orders || 0,
      completedOrders: worker.completed_orders || 0,
      cooperationCount: parseInt(worker.cooperation_count) || 0,
      lastOrderDate: worker.last_order_date,
    })));
  } catch (error) {
    console.error('Get my workers error:', error);
    res.status(500).json({ error: '获取工人列表失败' });
  }
});

// 获取订单详情
router.get('/:id', authenticate, async (req: any, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `SELECT 
        o.*,
        t.title, t.description, t.address, t.latitude, t.longitude,
        t.budget_fixed, t.budget_min, t.budget_max, t.images as task_images,
        employer.id as employer_id, employer.nickname as employer_name, 
        employer.avatar_url as employer_avatar, employer.phone as employer_phone,
        worker.id as worker_id, worker.nickname as worker_name,
        worker.avatar_url as worker_avatar, worker.phone as worker_phone
       FROM orders o
       LEFT JOIN tasks t ON o.task_id = t.id
       LEFT JOIN users employer ON o.employer_id = employer.id
       LEFT JOIN users worker ON o.worker_id = worker.id
       WHERE o.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: '订单不存在' });
    }

    const order = result.rows[0];

    // 验证权限
    if (order.worker_id !== req.user.userId && order.employer_id !== req.user.userId) {
      return res.status(403).json({ error: '无权查看该订单' });
    }

    res.json({
      id: order.id,
      status: order.status,
      agreedAmount: order.agreed_amount,
      startTime: order.start_time,
      endTime: order.end_time,
      completionPhotos: order.completion_photos || [],
      cancellationReason: order.cancellation_reason,
      createdAt: order.created_at,
      updatedAt: order.updated_at,
      task: {
        id: order.task_id,
        title: order.title,
        description: order.description,
        address: order.address,
        latitude: order.latitude,
        longitude: order.longitude,
        budget: {
          fixed: order.budget_fixed,
          min: order.budget_min,
          max: order.budget_max,
        },
        images: order.task_images || [],
      },
      employer: {
        id: order.employer_id,
        name: order.employer_name,
        avatar: order.employer_avatar,
        phone: order.employer_phone,
      },
      worker: {
        id: order.worker_id,
        name: order.worker_name,
        avatar: order.worker_avatar,
        phone: order.worker_phone,
        location: {
          latitude: order.worker_location_latitude,
          longitude: order.worker_location_longitude,
        },
      },
    });
  } catch (error) {
    console.error('Get order detail error:', error);
    res.status(500).json({ error: '获取订单详情失败' });
  }
});

/**
 * 取消订单
 * POST /api/v1/orders/:id/cancel
 * Body: reason
 */
router.post('/:id/cancel', authenticate, async (req: any, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    // 获取订单信息
    const orderResult = await pool.query(
      `SELECT id, status, worker_id, employer_id, task_id FROM orders WHERE id = $1`,
      [id]
    );

    if (orderResult.rows.length === 0) {
      return res.status(404).json({ error: '订单不存在' });
    }

    const order = orderResult.rows[0];

    // 验证权限
    if (order.worker_id !== req.user.userId && order.employer_id !== req.user.userId) {
      return res.status(403).json({ error: '无权操作该订单' });
    }

    // 验证状态（只有待接单和已接单状态可以取消）
    if (order.status !== 'pending' && order.status !== 'accepted') {
      return res.status(400).json({ error: '当前订单状态不可取消' });
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // 更新订单状态
      await client.query(
        `UPDATE orders 
         SET status = 'cancelled', 
             cancellation_reason = $1,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $2`,
        [reason || '', id]
      );

      // 更新任务状态回开放
      await client.query(
        `UPDATE tasks SET status = 'open' WHERE id = $1`,
        [order.task_id]
      );

      await client.query('COMMIT');
      res.json({ message: '订单已取消' });
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Cancel order error:', error);
    res.status(500).json({ error: '取消订单失败' });
  }
});

export default router;
