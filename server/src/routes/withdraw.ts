/**
 * 提现功能路由
 * 支持用户将钱包余额提现到银行卡
 */

import express, { type Request, type Response } from 'express';
import { body, query, validationResult } from 'express-validator';
import jwt from 'jsonwebtoken';
import pool from '../db';
import { JWT_SECRET } from '../config/auth';
import { withdrawLimiter, rechargeLimiter } from '../middleware/rateLimit';

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

// 生成提现单号
const generateWithdrawNo = () => {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `WD${timestamp}${random}`;
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
 * 获取提现记录列表
 * GET /api/v1/withdraw/list
 * Query: status?, page?, limit?
 */
router.get('/list', authMiddleware, [
  query('status').optional().isIn(['pending', 'processing', 'success', 'failed']),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 50 }),
], async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const userId = (req as any).userId;
    const { status, page = 1, limit = 20 } = req.query;

    let queryStr = 'SELECT * FROM withdrawals WHERE user_id = $1';
    const params: any[] = [userId];
    let paramIndex = 2;

    if (status) {
      queryStr += ` AND status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    queryStr += ` ORDER BY created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, (parseInt(page as string) - 1) * parseInt(limit as string));

    const result = await pool.query(queryStr, params);

    // 获取总数
    let countQuery = 'SELECT COUNT(*) FROM withdrawals WHERE user_id = $1';
    const countParams: any[] = [userId];
    if (status) {
      countQuery += ' AND status = $2';
      countParams.push(status);
    }
    const countResult = await pool.query(countQuery, countParams);
    const total = parseInt(countResult.rows[0].count);

    res.json({
      withdrawals: result.rows.map(w => ({
        id: w.id,
        withdrawNo: w.withdraw_no,
        amount: parseFloat(w.amount),
        fee: parseFloat(w.fee),
        actualAmount: parseFloat(w.actual_amount),
        status: w.status,
        bankName: w.bank_name,
        cardNumberLast4: w.card_number_last4,
        cardHolder: w.card_holder,
        rejectReason: w.reject_reason,
        processedAt: w.processed_at,
        createdAt: w.created_at,
      })),
      pagination: {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        total,
        totalPages: Math.ceil(total / parseInt(limit as string)),
      },
    });
  } catch (error) {
    console.error('Get withdrawals error:', error);
    res.status(500).json({ error: '获取提现记录失败' });
  }
});

/**
 * 申请提现
 * POST /api/v1/withdraw/apply
 * Body: { amount: number, bankCardId: string }
 */
router.post('/apply', withdrawLimiter, authMiddleware, [
  body('amount').isFloat({ min: 10, max: 50000 }).withMessage('提现金额需在10-50000元之间'),
  body('bankCardId').isInt({ min: 1 }).withMessage('请选择银行卡'),
], async (req: Request, res: Response) => {
  const client = await pool.connect();
  
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const userId = (req as any).userId;
    const { amount, bankCardId } = req.body;

    await client.query('BEGIN');

    // 检查用户是否已实名认证
    const verificationResult = await client.query(
      'SELECT status FROM verifications WHERE user_id = $1',
      [userId]
    );

    if (verificationResult.rows.length === 0 || verificationResult.rows[0].status !== 'approved') {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: '请先完成实名认证' });
    }

    // 获取银行卡信息
    const cardResult = await client.query(
      'SELECT * FROM bank_cards WHERE id = $1 AND user_id = $2 AND status = $3',
      [bankCardId, userId, 'active']
    );

    if (cardResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: '银行卡不存在或已禁用' });
    }

    const card = cardResult.rows[0];

    // 获取钱包信息
    const wallet = await getOrCreateWallet(userId);
    const balance = parseFloat(wallet.balance);

    // 计算手续费（固定0.1%，最低1元，最高50元）
    let fee = amount * 0.001;
    if (fee < 1) fee = 1;
    if (fee > 50) fee = 50;
    const actualAmount = amount - fee;

    // 检查余额是否足够
    if (amount > balance) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: '余额不足' });
    }

    // 冻结余额
    await client.query(
      'UPDATE wallets SET balance = balance - $1, frozen_amount = frozen_amount + $1 WHERE id = $2',
      [amount, wallet.id]
    );

    // 创建提现记录
    const withdrawNo = generateWithdrawNo();
    const withdrawResult = await client.query(
      `INSERT INTO withdrawals 
       (user_id, withdraw_no, amount, fee, actual_amount, status, bank_card_id, bank_name, card_number, card_number_last4, card_holder)
       VALUES ($1, $2, $3, $4, $5, 'pending', $6, $7, $8, $9, $10)
       RETURNING *`,
      [userId, withdrawNo, amount, fee, actualAmount, bankCardId, card.bank_name, card.card_number, card.card_number_last4, card.card_holder]
    );

    // 创建交易记录
    await client.query(
      `INSERT INTO transactions (wallet_id, transaction_no, type, amount, balance_after, status, description)
       SELECT $1, $2, 'withdraw', $3, balance - $3, 'pending', $4
       FROM wallets WHERE id = $1`,
      [wallet.id, withdrawNo, amount, `提现申请 - ${card.bank_name}尾号${card.card_number_last4}`]
    );

    await client.query('COMMIT');

    res.json({
      success: true,
      message: '提现申请已提交，预计1-3个工作日到账',
      withdrawal: {
        id: withdrawResult.rows[0].id,
        withdrawNo: withdrawResult.rows[0].withdraw_no,
        amount: parseFloat(withdrawResult.rows[0].amount),
        fee: parseFloat(withdrawResult.rows[0].fee),
        actualAmount: parseFloat(withdrawResult.rows[0].actual_amount),
        status: withdrawResult.rows[0].status,
      },
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Apply withdraw error:', error);
    res.status(500).json({ error: '提现申请失败，请重试' });
  } finally {
    client.release();
  }
});

/**
 * 取消提现（仅pending状态可取消）
 * POST /api/v1/withdraw/cancel/:id
 */
router.post('/cancel/:id', authMiddleware, async (req: Request, res: Response) => {
  const client = await pool.connect();
  
  try {
    const userId = (req as any).userId;
    const { id } = req.params;

    await client.query('BEGIN');

    // 查询提现记录
    const withdrawResult = await client.query(
      'SELECT * FROM withdrawals WHERE id = $1 AND user_id = $2 FOR UPDATE',
      [id, userId]
    );

    if (withdrawResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: '提现记录不存在' });
    }

    const withdrawal = withdrawResult.rows[0];

    if (withdrawal.status !== 'pending') {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: '当前状态无法取消' });
    }

    // 更新提现状态为已取消
    await client.query(
      'UPDATE withdrawals SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      ['cancelled', id]
    );

    // 解冻余额
    await client.query(
      'UPDATE wallets SET balance = balance + $1, frozen_amount = frozen_amount - $1 WHERE user_id = $2',
      [withdrawal.amount, userId]
    );

    // 更新交易记录状态
    await client.query(
      'UPDATE transactions SET status = $1 WHERE transaction_no = $2',
      ['cancelled', withdrawal.withdraw_no]
    );

    await client.query('COMMIT');

    res.json({
      success: true,
      message: '提现已取消，金额已返还至账户余额',
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Cancel withdraw error:', error);
    res.status(500).json({ error: '取消提现失败' });
  } finally {
    client.release();
  }
});

/**
 * 获取提现详情
 * GET /api/v1/withdraw/:id
 */
router.get('/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { id } = req.params;

    const result = await pool.query(
      'SELECT * FROM withdrawals WHERE id = $1 AND user_id = $2',
      [id, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: '提现记录不存在' });
    }

    const w = result.rows[0];

    res.json({
      id: w.id,
      withdrawNo: w.withdraw_no,
      amount: parseFloat(w.amount),
      fee: parseFloat(w.fee),
      actualAmount: parseFloat(w.actual_amount),
      status: w.status,
      bankName: w.bank_name,
      cardNumberLast4: w.card_number_last4,
      cardHolder: w.card_holder,
      rejectReason: w.reject_reason,
      processedAt: w.processed_at,
      createdAt: w.created_at,
    });
  } catch (error) {
    console.error('Get withdraw detail error:', error);
    res.status(500).json({ error: '获取提现详情失败' });
  }
});

export default router;
