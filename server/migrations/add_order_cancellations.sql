-- 订单取消记录表
CREATE TABLE IF NOT EXISTS order_cancellations (
  id SERIAL PRIMARY KEY,
  order_id INTEGER NOT NULL REFERENCES orders(id),
  cancelled_by INTEGER NOT NULL REFERENCES users(id),
  reason TEXT,
  refund_amount DECIMAL(12, 2) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 为orders表添加取消相关字段
ALTER TABLE orders ADD COLUMN IF NOT EXISTS cancelled_by INTEGER REFERENCES users(id);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMP;

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_order_cancellations_order_id ON order_cancellations(order_id);
CREATE INDEX IF NOT EXISTS idx_order_cancellations_cancelled_by ON order_cancellations(cancelled_by);

-- 添加注释
COMMENT ON TABLE order_cancellations IS '订单取消记录表';
COMMENT ON COLUMN order_cancellations.order_id IS '订单ID';
COMMENT ON COLUMN order_cancellations.cancelled_by IS '取消人ID';
COMMENT ON COLUMN order_cancellations.reason IS '取消原因';
COMMENT ON COLUMN order_cancellations.refund_amount IS '退款金额';
