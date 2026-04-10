import express, { type Request, type Response } from 'express';
import { body, param, query, validationResult } from 'express-validator';
import jwt from 'jsonwebtoken';
import pool from '../db';
import { JWT_SECRET } from '../config/auth';
import { rechargeLimiter } from '../middleware/rateLimit';
import { 
  alipayQrCodePay, 
  wechatQrCodePay, 
  queryAlipayTrade, 
  queryWechatTrade,
  isPaymentConfigured 
} from '../services/payment';

const router = express.Router();

// JWT 认证中间件
const authMiddleware = async (req: Request, res: Response, next: express.NextFunction) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ error: '请先登录' });
    }

    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    (req as any).userId = decoded.userId;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'token无效' });
  }
};

// 生成订单号
const generateOrderNo = () => {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `KG${timestamp}${random}`;
};

// 生成交易号
const generateTransactionNo = () => {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 10).toUpperCase();
  return `TXN${timestamp}${random}`;
};

// 获取或创建用户钱包
async function getOrCreateWallet(userId: string) {
  let result = await pool.query('SELECT * FROM wallets WHERE user_id = $1', [userId]);
  
  if (result.rows.length === 0) {
    result = await pool.query(
      'INSERT INTO wallets (user_id, balance) VALUES ($1, 0.00) RETURNING *',
      [userId]
    );
  }
  
  return result.rows[0];
}

/**
 * 获取钱包余额
 * GET /api/v1/payments/wallet
 * Header: Authorization: Bearer <token>
 */
router.get('/wallet', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    
    if (!userId) {
      return res.status(401).json({ error: '请先登录' });
    }

    const wallet = await getOrCreateWallet(userId);

    // 获取最近交易记录
    const transactionsResult = await pool.query(
      `SELECT id, transaction_no, type, amount, balance_after, status, 
              payment_method, description, created_at
       FROM transactions 
       WHERE wallet_id = $1 
       ORDER BY created_at DESC 
       LIMIT 20`,
      [wallet.id]
    );

    res.json({
      balance: parseFloat(wallet.balance),
      frozenAmount: parseFloat(wallet.frozen_amount),
      transactions: transactionsResult.rows.map(t => ({
        id: t.id,
        transactionNo: t.transaction_no,
        type: t.type,
        amount: parseFloat(t.amount),
        balanceAfter: parseFloat(t.balance_after),
        status: t.status,
        paymentMethod: t.payment_method,
        description: t.description,
        createdAt: t.created_at,
      })),
    });
  } catch (error) {
    console.error('Get wallet error:', error);
    res.status(500).json({ error: '获取钱包信息失败' });
  }
});

/**
 * 创建充值订单
 * POST /api/v1/payments/recharge
 * Header: Authorization: Bearer <token>
 * Body: amount: number, paymentMethod: 'wechat' | 'alipay'
 */
router.post('/recharge', rechargeLimiter, authMiddleware, [
  body('amount').isFloat({ min: 1, max: 50000 }).withMessage('充值金额需在1-50000元之间'),
  body('paymentMethod').isIn(['wechat', 'alipay']).withMessage('请选择支付方式'),
], async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const userId = (req as any).userId;
    
    if (!userId) {
      return res.status(401).json({ error: '请先登录' });
    }

    const { amount, paymentMethod } = req.body;
    const orderNo = generateOrderNo();

    // 创建支付订单
    const orderResult = await pool.query(
      `INSERT INTO payment_orders (user_id, order_no, amount, payment_method, status, expire_at)
       VALUES ($1, $2, $3, $4, 'pending', NOW() + INTERVAL '30 minutes')
       RETURNING *`,
      [userId, orderNo, amount, paymentMethod]
    );

    const order = orderResult.rows[0];
    const subject = '快工APP充值';

    // 根据支付方式调用对应支付
    if (paymentMethod === 'alipay') {
      // 支付宝扫码支付
      const alipayResult = await alipayQrCodePay(orderNo, amount, subject);
      
      if (alipayResult.success && alipayResult.qrCode) {
        // 更新订单状态
        await pool.query(
          `UPDATE payment_orders SET status = 'processing', payment_trade_no = $1 WHERE id = $2`,
          [orderNo, order.id]
        );
        
        res.json({
          orderId: order.id,
          orderNo: order.order_no,
          amount: parseFloat(order.amount),
          paymentMethod: 'alipay',
          status: 'processing',
          expireAt: order.expire_at,
          // 返回支付宝二维码链接（前端需生成二维码）
          qrCode: alipayResult.qrCode,
          payUrl: alipayResult.qrCode, // 兼容字段
        });
      } else {
        // 支付宝未配置或调用失败，返回模拟支付信息
        console.warn('[支付宝] 支付创建失败:', alipayResult.message);
        res.json({
          orderId: order.id,
          orderNo: order.order_no,
          amount: parseFloat(order.amount),
          paymentMethod: 'alipay',
          status: order.status,
          expireAt: order.expire_at,
          mockPayment: true,
          message: '支付宝支付配置中，请使用模拟支付',
        });
      }
    } else if (paymentMethod === 'wechat') {
      // 微信扫码支付
      const wechatResult = await wechatQrCodePay(orderNo, amount, subject);
      
      if (wechatResult.success && wechatResult.codeUrl) {
        // 更新订单状态
        await pool.query(
          `UPDATE payment_orders SET status = 'processing', payment_trade_no = $1 WHERE id = $2`,
          [orderNo, order.id]
        );
        
        res.json({
          orderId: order.id,
          orderNo: order.order_no,
          amount: parseFloat(order.amount),
          paymentMethod: 'wechat',
          status: 'processing',
          expireAt: order.expire_at,
          // 返回微信支付二维码链接
          codeUrl: wechatResult.codeUrl,
          qrCode: wechatResult.codeUrl, // 兼容字段
        });
      } else {
        // 微信支付未配置或调用失败，返回模拟支付信息
        console.warn('[微信支付] 支付创建失败:', wechatResult.message);
        res.json({
          orderId: order.id,
          orderNo: order.order_no,
          amount: parseFloat(order.amount),
          paymentMethod: 'wechat',
          status: order.status,
          expireAt: order.expire_at,
          mockPayment: true,
          message: '微信支付配置中，请使用模拟支付',
        });
      }
    }
  } catch (error) {
    console.error('Create recharge order error:', error);
    res.status(500).json({ error: '创建充值订单失败' });
  }
});

/**
 * 查询充值订单状态
 * GET /api/v1/payments/order/:orderNo
 * Header: Authorization: Bearer <token>
 */
router.get('/order/:orderNo', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const orderNo = String(req.params.orderNo);

    // 查询订单
    const orderResult = await pool.query(
      `SELECT * FROM payment_orders WHERE order_no = $1 AND user_id = $2`,
      [orderNo, userId]
    );

    if (orderResult.rows.length === 0) {
      return res.status(404).json({ error: '订单不存在' });
    }

    const order = orderResult.rows[0];

    // 如果订单状态为processing，查询支付平台状态
    let paymentStatus = order.status;
    if (order.status === 'processing') {
      if (order.payment_method === 'alipay') {
        const result = await queryAlipayTrade(orderNo);
        if (result.success) {
          if (result.status === 'TRADE_SUCCESS' || result.status === 'TRADE_FINISHED') {
            paymentStatus = 'success';
            // 更新订单状态
            await pool.query(
              `UPDATE payment_orders SET status = 'success', paid_at = NOW() WHERE id = $1`,
              [order.id]
            );
          }
        }
      } else if (order.payment_method === 'wechat') {
        const result = await queryWechatTrade(orderNo);
        if (result.success) {
          if (result.status === 'SUCCESS') {
            paymentStatus = 'success';
            await pool.query(
              `UPDATE payment_orders SET status = 'success', paid_at = NOW() WHERE id = $1`,
              [order.id]
            );
          }
        }
      }
    }

    res.json({
      orderId: order.id,
      orderNo: order.order_no,
      amount: parseFloat(order.amount),
      paymentMethod: order.payment_method,
      status: paymentStatus,
      paidAt: order.paid_at,
      expireAt: order.expire_at,
    });
  } catch (error) {
    console.error('Query order error:', error);
    res.status(500).json({ error: '查询订单失败' });
  }
});

/**
 * 获取支付配置状态
 * GET /api/v1/payments/config-status
 */
router.get('/config-status', async (req: Request, res: Response) => {
  const config = isPaymentConfigured();
  res.json({
    alipay: {
      configured: config.alipay,
      message: config.alipay ? '已配置' : '未配置支付宝支付参数',
    },
    wechat: {
      configured: config.wechat,
      message: config.wechat ? '已配置' : '未配置微信支付参数',
    },
  });
});

/**
 * 模拟支付确认（仅用于测试环境）
 * POST /api/v1/payments/mock-pay
 * Header: Authorization: Bearer <token>
 * Body: orderNo: string
 * 注意：生产环境应禁用此接口
 */
router.post('/mock-pay', [
  authMiddleware,
  body('orderNo').notEmpty().withMessage('订单号不能为空'),
], async (req: Request, res: Response) => {
  const client = await pool.connect();
  
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const userId = (req as any).userId;
    const { orderNo } = req.body;

    // 验证环境：生产环境禁用mock支付
    if (process.env.NODE_ENV === 'production') {
      return res.status(403).json({ error: '生产环境不支持模拟支付' });
    }

    await client.query('BEGIN');

    // 查询订单并验证归属
    const orderResult = await client.query(
      'SELECT * FROM payment_orders WHERE order_no = $1 AND user_id = $2 AND status = $3 FOR UPDATE',
      [orderNo, userId, 'pending']
    );

    if (orderResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: '订单不存在、已支付或无权操作' });
    }

    const order = orderResult.rows[0];

    // 检查是否过期
    if (new Date() > new Date(order.expire_at)) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: '订单已过期' });
    }

    // 更新订单状态
    await client.query(
      'UPDATE payment_orders SET status = $1, paid_at = NOW(), transaction_id = $2 WHERE id = $3',
      ['paid', `MOCK${Date.now()}`, order.id]
    );

    // 获取或创建钱包
    const wallet = await getOrCreateWallet(order.user_id);
    const newBalance = parseFloat(wallet.balance) + parseFloat(order.amount);

    // 创建交易记录
    await client.query(
      `INSERT INTO transactions (wallet_id, transaction_no, type, amount, balance_after, status, payment_method, description)
       VALUES ($1, $2, 'recharge', $3, $4, 'success', $5, '充值')`,
      [wallet.id, generateTransactionNo(), order.amount, newBalance, order.payment_method]
    );

    // 更新钱包余额
    await client.query(
      'UPDATE wallets SET balance = $1, updated_at = NOW() WHERE id = $2',
      [newBalance, wallet.id]
    );

    await client.query('COMMIT');

    res.json({
      success: true,
      message: '支付成功',
      balance: newBalance,
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Mock pay error:', error);
    res.status(500).json({ error: '支付处理失败' });
  } finally {
    client.release();
  }
});

/**
 * 微信支付回调（真实环境）
 * POST /api/v1/payments/callback/wechat
 */
router.post('/callback/wechat', async (req: Request, res: Response) => {
  const client = await pool.connect();
  
  try {
    // ==========================================
    // 微信支付回调验签与解析（真实环境）
    // ==========================================
    // const signature = req.headers['wechatpay-signature'];
    // const timestamp = req.headers['wechatpay-timestamp'];
    // const nonce = req.headers['wechatpay-nonce'];
    // const serial = req.headers['wechatpay-serial'];
    // 
    // const wechatPay = new WechatPay({...});
    // const verified = await wechatPay.verifySignature({
    //   signature, timestamp, nonce, serial, body: req.body
    // });
    // 
    // if (!verified) {
    //   return res.status(401).send('FAIL');
    // }
    // 
    // const { out_trade_no, transaction_id, trade_state } = req.body;
    // ==========================================

    // 模拟处理
    const { out_trade_no, transaction_id, trade_state } = req.body;

    if (!out_trade_no) {
      return res.status(400).send('FAIL');
    }

    await client.query('BEGIN');

    const orderResult = await client.query(
      'SELECT * FROM payment_orders WHERE order_no = $1 FOR UPDATE',
      [out_trade_no]
    );

    if (orderResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).send('FAIL');
    }

    const order = orderResult.rows[0];

    if (order.status === 'paid') {
      await client.query('ROLLBACK');
      return res.send('SUCCESS'); // 已处理过
    }

    if (trade_state === 'SUCCESS') {
      // 更新订单状态
      await client.query(
        'UPDATE payment_orders SET status = $1, paid_at = NOW(), transaction_id = $2 WHERE id = $3',
        ['paid', transaction_id, order.id]
      );

      // 获取钱包
      const wallet = await getOrCreateWallet(order.user_id);
      const newBalance = parseFloat(wallet.balance) + parseFloat(order.amount);

      // 创建交易记录
      await client.query(
        `INSERT INTO transactions (wallet_id, transaction_no, type, amount, balance_after, status, payment_method, description)
         VALUES ($1, $2, 'recharge', $3, $4, 'success', 'wechat', '充值')`,
        [wallet.id, generateTransactionNo(), order.amount, newBalance]
      );

      // 更新钱包余额
      await client.query(
        'UPDATE wallets SET balance = $1, updated_at = NOW() WHERE id = $2',
        [newBalance, wallet.id]
      );
    } else {
      // 支付失败
      await client.query(
        'UPDATE payment_orders SET status = $1 WHERE id = $2',
        ['failed', order.id]
      );
    }

    await client.query('COMMIT');
    res.send('SUCCESS');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Wechat callback error:', error);
    res.status(500).send('FAIL');
  } finally {
    client.release();
  }
});

/**
 * 支付宝支付回调（真实环境）
 * POST /api/v1/payments/callback/alipay
 */
router.post('/callback/alipay', async (req: Request, res: Response) => {
  const client = await pool.connect();
  
  try {
    // ==========================================
    // 支付宝回调验签与解析（真实环境）
    // ==========================================
    // const alipay = new AlipaySdk({...});
    // const verified = alipay.checkNotifySign(req.body);
    // 
    // if (!verified) {
    //   return res.send('fail');
    // }
    // 
    // const { out_trade_no, trade_no, trade_status } = req.body;
    // ==========================================

    const { out_trade_no, trade_no, trade_status } = req.body;

    if (!out_trade_no) {
      return res.send('fail');
    }

    await client.query('BEGIN');

    const orderResult = await client.query(
      'SELECT * FROM payment_orders WHERE order_no = $1 FOR UPDATE',
      [out_trade_no]
    );

    if (orderResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.send('fail');
    }

    const order = orderResult.rows[0];

    if (order.status === 'paid') {
      await client.query('ROLLBACK');
      return res.send('success');
    }

    if (trade_status === 'TRADE_SUCCESS' || trade_status === 'TRADE_FINISHED') {
      await client.query(
        'UPDATE payment_orders SET status = $1, paid_at = NOW(), transaction_id = $2 WHERE id = $3',
        ['paid', trade_no, order.id]
      );

      const wallet = await getOrCreateWallet(order.user_id);
      const newBalance = parseFloat(wallet.balance) + parseFloat(order.amount);

      await client.query(
        `INSERT INTO transactions (wallet_id, transaction_no, type, amount, balance_after, status, payment_method, description)
         VALUES ($1, $2, 'recharge', $3, $4, 'success', 'alipay', '充值')`,
        [wallet.id, generateTransactionNo(), order.amount, newBalance]
      );

      await client.query(
        'UPDATE wallets SET balance = $1, updated_at = NOW() WHERE id = $2',
        [newBalance, wallet.id]
      );
    } else {
      await client.query(
        'UPDATE payment_orders SET status = $1 WHERE id = $2',
        ['failed', order.id]
      );
    }

    await client.query('COMMIT');
    res.send('success');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Alipay callback error:', error);
    res.send('fail');
  } finally {
    client.release();
  }
});

/**
 * 查询支付订单状态
 * GET /api/v1/payments/order/:orderNo
 */
router.get('/order/:orderNo', [
  param('orderNo').notEmpty().withMessage('订单号不能为空'),
], async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { orderNo } = req.params;
    const userId = (req as any).userId || req.headers['x-user-id'];

    const result = await pool.query(
      'SELECT * FROM payment_orders WHERE order_no = $1',
      [orderNo]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: '订单不存在' });
    }

    const order = result.rows[0];

    // 验证用户
    if (userId && order.user_id !== parseInt(userId)) {
      return res.status(403).json({ error: '无权查看此订单' });
    }

    res.json({
      id: order.id,
      orderNo: order.order_no,
      amount: parseFloat(order.amount),
      paymentMethod: order.payment_method,
      status: order.status,
      transactionId: order.transaction_id,
      paidAt: order.paid_at,
      createdAt: order.created_at,
    });
  } catch (error) {
    console.error('Get order error:', error);
    res.status(500).json({ error: '查询订单失败' });
  }
});

/**
 * 查询交易记录
 * GET /api/v1/payments/transactions
 * Query: type?, page?, limit?
 */
router.get('/transactions', authMiddleware, [
  query('type').optional().isIn(['recharge', 'withdraw', 'payment', 'income', 'refund']),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 50 }),
], async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const userId = (req as any).userId;
    
    if (!userId) {
      return res.status(401).json({ error: '请先登录' });
    }

    const { type, page = 1, limit = 20 } = req.query;

    const wallet = await getOrCreateWallet(userId);
    
    let query = 'SELECT * FROM transactions WHERE wallet_id = $1';
    const params: any[] = [wallet.id];

    if (type) {
      query += ' AND type = $2';
      params.push(type);
    }

    query += ' ORDER BY created_at DESC LIMIT $' + (params.length + 1) + ' OFFSET $' + (params.length + 2);
    params.push(limit, (parseInt(page as string) - 1) * parseInt(limit as string));

    const result = await pool.query(query, params);

    // 获取总数
    let countQuery = 'SELECT COUNT(*) FROM transactions WHERE wallet_id = $1';
    const countParams: any[] = [wallet.id];
    
    if (type) {
      countQuery += ' AND type = $2';
      countParams.push(type);
    }

    const countResult = await pool.query(countQuery, countParams);
    const total = parseInt(countResult.rows[0].count);

    res.json({
      transactions: result.rows.map(t => ({
        id: t.id,
        transactionNo: t.transaction_no,
        type: t.type,
        amount: parseFloat(t.amount),
        balanceAfter: parseFloat(t.balance_after),
        status: t.status,
        paymentMethod: t.payment_method,
        description: t.description,
        createdAt: t.created_at,
      })),
      pagination: {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        total,
        totalPages: Math.ceil(total / parseInt(limit as string)),
      },
    });
  } catch (error) {
    console.error('Get transactions error:', error);
    res.status(500).json({ error: '获取交易记录失败' });
  }
});

export default router;
