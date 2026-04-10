import express, { type Request, type Response } from 'express';
import { body, validationResult } from 'express-validator';
import jwt from 'jsonwebtoken';
import pool from '../db';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'quick-work-secret-key-2024';

// 认证中间件
const authMiddleware = async (req: Request, res: Response, next: express.NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: '请先登录' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    (req as any).userId = decoded.userId;
    next();
  } catch (error) {
    return res.status(401).json({ error: '登录已过期，请重新登录' });
  }
};

// 银行列表
const BANK_LIST = [
  { code: 'ICBC', name: '中国工商银行', icon: '🏦' },
  { code: 'ABC', name: '中国农业银行', icon: '🌾' },
  { code: 'BOC', name: '中国银行', icon: '🏛️' },
  { code: 'CCB', name: '中国建设银行', icon: '🏗️' },
  { code: 'COMM', name: '交通银行', icon: '🚗' },
  { code: 'PSBC', name: '中国邮政储蓄银行', icon: '📮' },
  { code: 'CMB', name: '招商银行', icon: '💳' },
  { code: 'CITIC', name: '中信银行', icon: '🏦' },
  { code: 'CEB', name: '中国光大银行', icon: '☀️' },
  { code: 'HXB', name: '华夏银行', icon: '🐉' },
  { code: 'CMBC', name: '中国民生银行', icon: '👨‍👩‍👧‍👦' },
  { code: 'GDB', name: '广发银行', icon: '🌍' },
  { code: 'PAB', name: '平安银行', icon: '🍎' },
  { code: 'CIB', name: '兴业银行', icon: '🏭' },
  { code: 'SPDB', name: '上海浦东发展银行', icon: '🌃' },
];

// 根据卡号识别银行
function identifyBank(cardNumber: string): { code: string; name: string } | null {
  const bin = cardNumber.replace(/\s/g, '').substring(0, 6);
  
  // 银行卡BIN码映射（部分常用）
  const binMap: Record<string, string> = {
    '622202': 'ICBC', '622203': 'ICBC', '622200': 'ICBC', '622208': 'ICBC',
    '622848': 'ABC', '622849': 'ABC', '622845': 'ABC',
    '621660': 'BOC', '621661': 'BOC', '621662': 'BOC',
    '621700': 'CCB', '436742': 'CCB', '436743': 'CCB',
    '622260': 'COMM', '622261': 'COMM',
    '622188': 'PSBC', '621799': 'PSBC',
    '622580': 'CMB', '622581': 'CMB', '622582': 'CMB',
    '622690': 'CITIC', '622691': 'CITIC',
    '622662': 'CEB', '622663': 'CEB',
    '622630': 'HXB', '622631': 'HXB',
    '622615': 'CMBC', '622617': 'CMBS',
    '622568': 'GDB', '622560': 'GDB',
    '622155': 'PAB', '622156': 'PAB',
    '622908': 'CIB', '622909': 'CIB',
    '622518': 'SPDB', '622521': 'SPDB',
  };

  const bankCode = binMap[bin];
  if (bankCode) {
    const bank = BANK_LIST.find(b => b.code === bankCode);
    return bank ? { code: bank.code, name: bank.name } : null;
  }
  return null;
}

// 验证银行卡号（Luhn算法）
function validateCardNumber(cardNumber: string): boolean {
  const digits = cardNumber.replace(/\s/g, '');
  if (!/^\d{16,19}$/.test(digits)) return false;

  let sum = 0;
  let isEven = false;
  
  for (let i = digits.length - 1; i >= 0; i--) {
    let digit = parseInt(digits[i], 10);
    
    if (isEven) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    
    sum += digit;
    isEven = !isEven;
  }
  
  return sum % 10 === 0;
}

// 隐藏卡号中间部分
function maskCardNumber(cardNumber: string): string {
  const digits = cardNumber.replace(/\s/g, '');
  return digits.substring(0, 4) + ' **** **** ' + digits.substring(digits.length - 4);
}

/**
 * GET /api/v1/bank-cards/banks
 * 获取支持的银行列表
 */
router.get('/banks', (req: Request, res: Response) => {
  res.json(BANK_LIST);
});

/**
 * GET /api/v1/bank-cards
 * 获取当前用户的银行卡列表
 */
router.get('/', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;

    const result = await pool.query(
      `SELECT id, bank_name, bank_code, card_number, card_holder, card_type, is_default, status, created_at
       FROM bank_cards 
       WHERE user_id = $1 AND status != 'deleted'
       ORDER BY is_default DESC, created_at DESC`,
      [userId]
    );

    res.json({
      cards: result.rows.map(card => ({
        id: card.id,
        bankName: card.bank_name,
        bankCode: card.bank_code,
        cardNumber: maskCardNumber(card.card_number),
        cardNumberLast4: card.card_number.slice(-4),
        cardHolder: card.card_holder,
        cardType: card.card_type,
        isDefault: card.is_default,
        status: card.status,
        createdAt: card.created_at,
      })),
    });
  } catch (error) {
    console.error('Get bank cards error:', error);
    res.status(500).json({ error: '获取银行卡列表失败' });
  }
});

/**
 * POST /api/v1/bank-cards
 * 绑定银行卡
 */
router.post('/', [
  authMiddleware,
  body('cardNumber').trim().notEmpty().withMessage('请输入银行卡号')
    .matches(/^\d{16,19}$/).withMessage('银行卡号格式不正确'),
  body('cardHolder').trim().notEmpty().withMessage('请输入持卡人姓名')
    .isLength({ min: 2, max: 20 }).withMessage('持卡人姓名长度应在2-20个字符之间'),
  body('bankCode').optional().trim(),
  body('bankName').optional().trim(),
], async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const userId = (req as any).userId;
    const { cardNumber, cardHolder, bankCode, bankName } = req.body;

    // 验证银行卡号
    if (!validateCardNumber(cardNumber)) {
      return res.status(400).json({ error: '银行卡号格式不正确' });
    }

    // 检查用户是否已实名认证
    const verificationResult = await pool.query(
      `SELECT real_name, status FROM verifications WHERE user_id = $1`,
      [userId]
    );

    if (verificationResult.rows.length === 0 || verificationResult.rows[0].status !== 'approved') {
      return res.status(400).json({ error: '请先完成实名认证' });
    }

    // 验证持卡人姓名与实名认证姓名一致
    const realName = verificationResult.rows[0].real_name;
    if (cardHolder !== realName) {
      return res.status(400).json({ error: '持卡人姓名需与实名认证姓名一致' });
    }

    // 检查是否已绑定此卡
    const existingCard = await pool.query(
      'SELECT id FROM bank_cards WHERE user_id = $1 AND card_number = $2 AND status != $3',
      [userId, cardNumber, 'deleted']
    );

    if (existingCard.rows.length > 0) {
      return res.status(400).json({ error: '该银行卡已绑定' });
    }

    // 识别银行
    let bankInfo: { code: string; name: string } | null = null;
    if (bankCode && bankName) {
      bankInfo = { code: bankCode, name: bankName };
    } else {
      bankInfo = identifyBank(cardNumber);
      if (!bankInfo) {
        return res.status(400).json({ error: '无法识别银行卡所属银行，请手动选择银行' });
      }
    }

    // 检查用户银行卡数量限制
    const countResult = await pool.query(
      'SELECT COUNT(*) as count FROM bank_cards WHERE user_id = $1 AND status != $2',
      [userId, 'deleted']
    );

    if (parseInt(countResult.rows[0].count) >= 5) {
      return res.status(400).json({ error: '最多绑定5张银行卡' });
    }

    // 判断是否为第一张卡（自动设为默认）
    const isFirstCard = parseInt(countResult.rows[0].count) === 0;

    // 插入银行卡记录
    const insertResult = await pool.query(
      `INSERT INTO bank_cards (user_id, bank_name, bank_code, card_number, card_holder, is_default, status)
       VALUES ($1, $2, $3, $4, $5, $6, 'active')
       RETURNING *`,
      [userId, bankInfo.name, bankInfo.code, cardNumber, cardHolder, isFirstCard]
    );

    const newCard = insertResult.rows[0];

    res.json({
      success: true,
      message: '银行卡绑定成功',
      card: {
        id: newCard.id,
        bankName: newCard.bank_name,
        bankCode: newCard.bank_code,
        cardNumber: maskCardNumber(newCard.card_number),
        cardNumberLast4: newCard.card_number.slice(-4),
        cardHolder: newCard.card_holder,
        isDefault: newCard.is_default,
      },
    });
  } catch (error) {
    console.error('Add bank card error:', error);
    res.status(500).json({ error: '绑定银行卡失败' });
  }
});

/**
 * PUT /api/v1/bank-cards/:id/default
 * 设置默认银行卡
 */
router.put('/:id/default', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { id } = req.params;

    // 检查银行卡是否存在且属于当前用户
    const cardResult = await pool.query(
      'SELECT id FROM bank_cards WHERE id = $1 AND user_id = $2 AND status = $3',
      [id, userId, 'active']
    );

    if (cardResult.rows.length === 0) {
      return res.status(404).json({ error: '银行卡不存在' });
    }

    // 取消其他默认卡
    await pool.query(
      'UPDATE bank_cards SET is_default = FALSE WHERE user_id = $1',
      [userId]
    );

    // 设置新的默认卡
    await pool.query(
      'UPDATE bank_cards SET is_default = TRUE WHERE id = $1',
      [id]
    );

    res.json({
      success: true,
      message: '已设置为默认银行卡',
    });
  } catch (error) {
    console.error('Set default card error:', error);
    res.status(500).json({ error: '设置默认银行卡失败' });
  }
});

/**
 * DELETE /api/v1/bank-cards/:id
 * 删除银行卡
 */
router.delete('/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { id } = req.params;

    // 检查银行卡是否存在且属于当前用户
    const cardResult = await pool.query(
      'SELECT id, is_default FROM bank_cards WHERE id = $1 AND user_id = $2 AND status != $3',
      [id, userId, 'deleted']
    );

    if (cardResult.rows.length === 0) {
      return res.status(404).json({ error: '银行卡不存在' });
    }

    // 软删除
    await pool.query(
      'UPDATE bank_cards SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      ['deleted', id]
    );

    // 如果删除的是默认卡，自动设置另一张为默认
    if (cardResult.rows[0].is_default) {
      const otherCard = await pool.query(
        'SELECT id FROM bank_cards WHERE user_id = $1 AND status = $2 ORDER BY created_at DESC LIMIT 1',
        [userId, 'active']
      );

      if (otherCard.rows.length > 0) {
        await pool.query(
          'UPDATE bank_cards SET is_default = TRUE WHERE id = $1',
          [otherCard.rows[0].id]
        );
      }
    }

    res.json({
      success: true,
      message: '银行卡已删除',
    });
  } catch (error) {
    console.error('Delete bank card error:', error);
    res.status(500).json({ error: '删除银行卡失败' });
  }
});

/**
 * POST /api/v1/bank-cards/identify
 * 识别银行卡所属银行
 */
router.post('/identify', [
  body('cardNumber').trim().notEmpty().withMessage('请输入银行卡号'),
], (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { cardNumber } = req.body;
    const bankInfo = identifyBank(cardNumber);

    if (!bankInfo) {
      return res.json({
        success: false,
        message: '无法识别银行卡所属银行',
        bank: null,
      });
    }

    res.json({
      success: true,
      bank: bankInfo,
    });
  } catch (error) {
    console.error('Identify bank error:', error);
    res.status(500).json({ error: '识别银行卡失败' });
  }
});

export default router;
