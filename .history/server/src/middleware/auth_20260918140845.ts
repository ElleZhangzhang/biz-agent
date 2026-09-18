import type { RequestHandler } from 'express';
import { getUserByToken } from '@/auth.js';

// 登录态校验中间件：从 Authorization: Bearer xxx 或 ?token=xxx 取 token，查库（含 7 天过期）
// 为什么也支持 query token：原生 EventSource 不能自定义请求头（模拟顾客的 SSE 用它订阅）
// 代价：token 会出现在 URL 里（可能进访问日志），生产更推荐 fetch 读流或一次性票据
export const requireAuth: RequestHandler = async (req, res, next) => {
    const auth = req.headers.authorization ?? '';
    const headerToken = auth.startsWith('Bearer ') ? auth.slice(7) : '';
    const queryToken = typeof req.query.token === 'string' ? req.query.token : '';

    let username: string | null = null;
    try {
        username = await getUserByToken(headerToken || queryToken);
    } catch {
        return res.status(500).json({ ok: false, error: '鉴权服务异常' });
    }

    if (!username) return res.status(401).json({ ok: false, error: '登录已过期，请重新登录' });

    res.locals.username = username;   // 挂给下游路由用（如 /api/auth/me）
    next();
};
