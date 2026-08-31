import { Router } from 'express';
import { start, stop, isRunning, getOrderCount } from '@/simulator/buyerSimulator.js';
import { subscribe, getRecentEvents } from '@/simulator/events.js';

const router = Router();

// 状态 / 开关：前端控制卡片调用
router.get('/status', (_req, res) => {
    res.json({ ok: true, data: { running: isRunning(), orderCount: getOrderCount() } });
});

// 最近订单流历史：页面打开时先拉这个，再订阅 SSE 接后续新单
router.get('/history', (_req, res) => {
    res.json({ ok: true, data: getRecentEvents() });
});

router.post('/start', (_req, res) => {
    start();
    res.json({ ok: true, data: { running: isRunning(), orderCount: getOrderCount() } });
});

router.post('/stop', (_req, res) => {
    stop();
    res.json({ ok: true, data: { running: isRunning(), orderCount: getOrderCount() } });
});

// SSE：服务端主动推送（EventSource 订阅，不是 fetch 读流）
router.get('/events', (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();
    subscribe(res);
    // 心跳：30s 一帧注释行，防止代理误判连接超时
    const heartbeat = setInterval(() => res.write(': ping\n\n'), 30_000);
    res.on('close', () => clearInterval(heartbeat));
});

export default router;
