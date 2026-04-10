/**
 * 客服消息路由
 * 支持用户发送消息和机器人自动回复
 */

import express, { type Request, type Response } from 'express';
import jwt from 'jsonwebtoken';
import { LLMClient, Config } from 'coze-coding-dev-sdk';
import pool from '../db';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'quick-work-secret-key-2024';

// 认证中间件
const authenticate = (req: any, res: any, next: any) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) {
    return res.status(401).json({ error: '未登录' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ error: 'token无效' });
  }
};

// 客服机器人系统提示词
const CUSTOMER_SERVICE_SYSTEM_PROMPT = `你是"快工"平台的智能客服助手，专门为零工经济平台的用户提供服务。

你的职责：
1. 解答用户关于平台使用的问题（发布任务、接单、支付、提现等）
2. 处理用户投诉和纠纷咨询
3. 提供账户相关帮助（实名认证、银行卡绑定等）
4. 介绍平台规则和政策

回答风格：
- 友好、专业、简洁
- 使用中文回答
- 如果不确定的问题，建议用户联系人工客服
- 对于投诉类问题，保持中立态度，记录详细信息

常见问题参考：
- 发布任务：雇主可以在首页点击"发布任务"，填写任务详情、预算、地点等信息
- 接单：工人可以浏览任务列表，选择合适的任务申请接单
- 支付：支持微信支付、支付宝，雇主确认完成后自动打款给工人
- 提现：工人可以在钱包中申请提现，绑定银行卡后1-3个工作日到账
- 实名认证：在"我的"页面进行实名认证，需要上传身份证照片
- 纠纷处理：如有争议，可在订单详情页申请平台介入

请根据用户的问题提供帮助。`;

/**
 * 获取消息历史
 * GET /api/v1/customer-service/messages
 */
router.get('/messages', authenticate, async (req: any, res) => {
  try {
    const { limit = 50 } = req.query;
    const userId = req.user.userId;

    const result = await pool.query(
      `SELECT id, message, sender_type, created_at
       FROM customer_service_messages
       WHERE user_id = $1
       ORDER BY created_at ASC
       LIMIT $2`,
      [userId, parseInt(limit as string)]
    );

    res.json({
      messages: result.rows.map(msg => ({
        id: msg.id,
        content: msg.message,
        senderType: msg.sender_type,
        createdAt: msg.created_at,
      })),
    });
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ error: '获取消息失败' });
  }
});

/**
 * 发送消息并获取机器人回复（流式）
 * POST /api/v1/customer-service/chat
 */
router.post('/chat', authenticate, async (req: any, res) => {
  try {
    const { message } = req.body;
    const userId = req.user.userId;

    if (!message || !message.trim()) {
      return res.status(400).json({ error: '消息内容不能为空' });
    }

    // 保存用户消息
    await pool.query(
      `INSERT INTO customer_service_messages (user_id, message, sender_type)
       VALUES ($1, $2, 'user')`,
      [userId, message.trim()]
    );

    // 更新会话
    await pool.query(
      `INSERT INTO customer_service_sessions (user_id, last_message_at)
       VALUES ($1, CURRENT_TIMESTAMP)
       ON CONFLICT (user_id) 
       DO UPDATE SET last_message_at = CURRENT_TIMESTAMP, status = 'active'`,
      [userId]
    );

    // 获取历史消息作为上下文（最近10条）
    const historyResult = await pool.query(
      `SELECT message, sender_type FROM customer_service_messages
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT 10`,
      [userId]
    );

    // 构建消息上下文
    const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
      { role: 'system', content: CUSTOMER_SERVICE_SYSTEM_PROMPT },
    ];

    // 添加历史消息（倒序变正序）
    const history = historyResult.rows.reverse();
    for (const msg of history) {
      if (msg.sender_type === 'user') {
        messages.push({ role: 'user', content: msg.message });
      } else {
        messages.push({ role: 'assistant', content: msg.message });
      }
    }

    // 设置SSE响应头
    res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache, no-store, no-transform, must-revalidate');
    res.setHeader('Connection', 'keep-alive');

    // 初始化LLM客户端
    const config = new Config();
    const client = new LLMClient(config);

    // 流式调用LLM
    let botResponse = '';
    const stream = client.stream(messages, {
      model: 'doubao-seed-1-6-lite-251015', // 使用轻量模型，快速响应
      temperature: 0.7,
    });

    for await (const chunk of stream) {
      if (chunk.content) {
        const text = chunk.content.toString();
        botResponse += text;
        // 发送SSE事件
        res.write(`data: ${JSON.stringify({ content: text })}\n\n`);
      }
    }

    // 保存机器人回复
    await pool.query(
      `INSERT INTO customer_service_messages (user_id, message, sender_type)
       VALUES ($1, $2, 'bot')`,
      [userId, botResponse]
    );

    // 发送结束标记
    res.write('data: [DONE]\n\n');
    res.end();
  } catch (error) {
    console.error('Chat error:', error);
    // 如果响应头还没发送，返回JSON错误
    if (!res.headersSent) {
      res.status(500).json({ error: '发送消息失败' });
    } else {
      // 如果已经开始流式传输，发送错误事件
      res.write(`data: ${JSON.stringify({ error: '服务器错误' })}\n\n`);
      res.end();
    }
  }
});

/**
 * 发送消息并获取机器人回复（非流式，备用）
 * POST /api/v1/customer-service/chat-sync
 */
router.post('/chat-sync', authenticate, async (req: any, res) => {
  try {
    const { message } = req.body;
    const userId = req.user.userId;

    if (!message || !message.trim()) {
      return res.status(400).json({ error: '消息内容不能为空' });
    }

    // 保存用户消息
    await pool.query(
      `INSERT INTO customer_service_messages (user_id, message, sender_type)
       VALUES ($1, $2, 'user')`,
      [userId, message.trim()]
    );

    // 获取历史消息作为上下文
    const historyResult = await pool.query(
      `SELECT message, sender_type FROM customer_service_messages
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT 10`,
      [userId]
    );

    // 构建消息上下文
    const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
      { role: 'system', content: CUSTOMER_SERVICE_SYSTEM_PROMPT },
    ];

    const history = historyResult.rows.reverse();
    for (const msg of history) {
      if (msg.sender_type === 'user') {
        messages.push({ role: 'user', content: msg.message });
      } else {
        messages.push({ role: 'assistant', content: msg.message });
      }
    }

    // 初始化LLM客户端
    const config = new Config();
    const client = new LLMClient(config);

    // 调用LLM
    const response = await client.invoke(messages, {
      model: 'doubao-seed-1-6-lite-251015',
      temperature: 0.7,
    });

    const botResponse = response.content;

    // 保存机器人回复
    await pool.query(
      `INSERT INTO customer_service_messages (user_id, message, sender_type)
       VALUES ($1, $2, 'bot')`,
      [userId, botResponse]
    );

    res.json({
      userMessage: message.trim(),
      botResponse,
    });
  } catch (error) {
    console.error('Chat sync error:', error);
    res.status(500).json({ error: '发送消息失败' });
  }
});

/**
 * 清除聊天历史
 * DELETE /api/v1/customer-service/messages
 */
router.delete('/messages', authenticate, async (req: any, res) => {
  try {
    const userId = req.user.userId;

    await pool.query(
      'DELETE FROM customer_service_messages WHERE user_id = $1',
      [userId]
    );

    await pool.query(
      'DELETE FROM customer_service_sessions WHERE user_id = $1',
      [userId]
    );

    res.json({ success: true, message: '聊天记录已清除' });
  } catch (error) {
    console.error('Clear messages error:', error);
    res.status(500).json({ error: '清除失败' });
  }
});

export default router;
