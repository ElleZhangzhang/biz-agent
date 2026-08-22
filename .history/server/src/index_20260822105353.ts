import 'dotenv/config';  // 加载 .env 到 process.env，必须在读环境变量之前
import express from "express";
import businessRouter from '@/routes/business.js'
import agentRouter from '@/routes/agent.js';
import approvalRouter from '@/routes/approvals.js'

const app = express();
const PORT = 3001;

app.use(express.json()); // 允许路由能读到req.body

app.get('/api/health', (_req, res) => {
    res.json({
        ok: true
    });
});

app.use('/api/business', businessRouter);
app.use('/api/agent', agentRouter);
app.use('/api/approvals', approvalRouter);

app.listen(PORT, () => {
    console.log('biz-agent server listening on http://localhost:' + PORT);
});