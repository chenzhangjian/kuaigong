/**
 * 服务入口文件
 * 
 * 注意：ES Module 模式下，所有静态 import 会在代码执行前执行。
 * 为了确保环境变量在所有模块加载前可用，我们使用动态导入。
 */

// 第一步：加载环境变量
import { config } from 'dotenv';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import type { Request, Response, NextFunction } from 'express';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 加载 .env 文件（多种路径尝试，优先级从高到低）
// 1. dist/.env（生产环境打包后的位置）
// 2. server/.env（开发环境和生产环境）
// 3. 默认路径（当前工作目录）
config({ path: join(__dirname, '.env') });
config({ path: join(__dirname, '../.env') });
config();

// 第二步：动态导入其他模块（确保环境变量已加载）
const startServer = async () => {
  const [
    { default: express },
    { default: cors },
    { default: compression },
    { default: authRoutes },
    { default: taskRoutes },
    { default: orderRoutes },
    { default: paymentRoutes },
    { default: locationRoutes },
    { default: verificationRoutes },
    { default: bankCardRoutes },
    { default: customerServiceRoutes },
    { default: certificateRoutes },
    { default: onlineStatusRoutes },
    { default: adminRoutes },
    { default: adminAuthRoutes },
    { default: withdrawRoutes },
    { apiLimiter }
  ] = await Promise.all([
    import('express'),
    import('cors'),
    import('compression'),
    import('./routes/auth'),
    import('./routes/tasks'),
    import('./routes/orders'),
    import('./routes/payments'),
    import('./routes/location'),
    import('./routes/verification'),
    import('./routes/bank-cards'),
    import('./routes/customer-service'),
    import('./routes/certificates'),
    import('./routes/online-status'),
    import('./routes/admin'),
    import('./routes/admin-auth'),
    import('./routes/withdraw'),
    import('./middleware/rateLimit')
  ]);

  const app = express();
  const port = process.env.PORT || 9091;

  // 信任代理服务器（部署环境需要）
  app.set('trust proxy', 1);

  // Middleware
  app.use(cors());
  app.use(compression()); // 启用gzip压缩
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ limit: '50mb', extended: true }));

  // 全局API频率限制
  app.use('/api/v1', apiLimiter);

  // Health check
  app.get('/api/v1/health', (req, res) => {
    console.log('Health check success');
    res.status(200).json({ status: 'ok' });
  });

  // Routes
  app.use('/api/v1/auth', authRoutes);
  app.use('/api/v1/tasks', taskRoutes);
  app.use('/api/v1/orders', orderRoutes);
  app.use('/api/v1/payments', paymentRoutes);
  app.use('/api/v1/location', locationRoutes);
  app.use('/api/v1/verification', verificationRoutes);
  app.use('/api/v1/bank-cards', bankCardRoutes);
  app.use('/api/v1/customer-service', customerServiceRoutes);
  app.use('/api/v1/certificates', certificateRoutes);
  app.use('/api/v1/online-status', onlineStatusRoutes);
  app.use('/api/v1/admin', adminRoutes);
  app.use('/api/v1/admin', adminAuthRoutes);
  app.use('/api/v1/withdraw', withdrawRoutes);

  // Admin Panel (SPA) - 必须在 API 路由之后
  const adminPath = join(__dirname, '../public/admin');
  app.use('/admin', express.static(adminPath));
  // SPA fallback - 所有 /admin/* 路由返回 index.html
  app.get('/admin/*', (req, res) => {
    res.sendFile(join(adminPath, 'index.html'));
  });

  // Error handling
  app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    console.error('Error:', err);
    res.status(500).json({ error: '服务器内部错误' });
  });

  app.listen(port, () => {
    console.log(`Server listening at http://localhost:${port}/`);
  });
};

// 启动服务
startServer().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
