import 'dotenv/config';  // 加载 .env 到 process.env，必须在读环境变量之前
import express from "express";
import businessRouter from '@/routes/business.js'
import agentRouter from '@/routes/agent.js';
import approvalRouter from '@/routes/approvals.js'
import authRouter from '@/routes/auth.js';
import simulatorRouter from '@/routes/simulator.js';
import { requireAuth } from '@/middleware/auth.js'
import { testConnection } from '@/db.js'
import { seedProductsIfEmpty } from '@/business/system.js'

const app = express();
const PORT = 3001;

app.use(express.json()); // 允许路由能读到req.body

app.get('/api/health', (_req, res) => {
    res.json({
        ok: true
    });
});

// 除 /api/health 和 /api/auth（登录/注册本身）外，全部要求有效 token
app.use('/api/business', requireAuth, businessRouter);
app.use('/api/agent', requireAuth, agentRouter);
app.use('/api/approvals', requireAuth, approvalRouter);
app.use('/api/auth', authRouter);
app.use('/api/simulator', requireAuth, simulatorRouter);

await testConnection();
await seedProductsIfEmpty();   // products 表空才写入 seed 商品（幂等）

app.listen(PORT, () => {
    console.log('biz-agent server listening on http://localhost:' + PORT);
});
