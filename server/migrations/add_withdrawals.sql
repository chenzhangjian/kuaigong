-- 提现记录表
CREATE TABLE IF NOT EXISTS withdrawals (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  withdraw_no VARCHAR(32) NOT NULL UNIQUE,
  amount DECIMAL(12, 2) NOT NULL,
  fee DECIMAL(12, 2) NOT NULL DEFAULT 0,
  actual_amount DECIMAL(12, 2) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending', -- pending, processing, success, failed, cancelled
  bank_card_id INTEGER REFERENCES bank_cards(id),
  bank_name VARCHAR(50) NOT NULL,
  card_number VARCHAR(32) NOT NULL,
  card_number_last4 VARCHAR(4) NOT NULL,
  card_holder VARCHAR(50) NOT NULL,
  reject_reason TEXT,
  processed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_withdrawals_user_id ON withdrawals(user_id);
CREATE INDEX IF NOT EXISTS idx_withdrawals_status ON withdrawals(status);
CREATE INDEX IF NOT EXISTS idx_withdrawals_withdraw_no ON withdrawals(withdraw_no);

-- 添加注释
COMMENT ON TABLE withdrawals IS '用户提现记录表';
COMMENT ON COLUMN withdrawals.user_id IS '用户ID';
COMMENT ON COLUMN withdrawals.withdraw_no IS '提现单号';
COMMENT ON COLUMN withdrawals.amount IS '提现金额';
COMMENT ON COLUMN withdrawals.fee IS '手续费';
COMMENT ON COLUMN withdrawals.actual_amount IS '实际到账金额';
COMMENT ON COLUMN withdrawals.status IS '状态: pending-待处理, processing-处理中, success-成功, failed-失败, cancelled-已取消';
COMMENT ON COLUMN withdrawals.bank_card_id IS '银行卡ID';
COMMENT ON COLUMN withdrawals.bank_name IS '银行名称';
COMMENT ON COLUMN withdrawals.card_number IS '银行卡号（加密存储）';
COMMENT ON COLUMN withdrawals.card_number_last4 IS '银行卡号后4位';
COMMENT ON COLUMN withdrawals.card_holder IS '持卡人姓名';
COMMENT ON COLUMN withdrawals.reject_reason IS '拒绝原因';
COMMENT ON COLUMN withdrawals.processed_at IS '处理时间';
