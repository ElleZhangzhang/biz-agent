import express from "express";
import businessRouter from '@/routes/business.js'

const app = express();
const PORT = 3001;

app.get('/api/health', (_req, res) => {
    res.json({
        ok: true
    })
})
app.listen(PORT, () => {
    console.log('biz-agent server listening on http://localhost:' + PORT);
})

app.use(express.json()) // 允许路由能读到req.body