import type { RequestHandler } from 'express';
import { verifyToken } from '@/auth.js';

export const requireAuth: RequestHandler = (req, res, next) => {
    const auth = req.headers.authorization ?? '';
    const headerToken = auth.startsWith('Bearer ') ? auth.slice(7) : '';
    const queryToken = typeof req.query.token === 'string' ? req.query.token : '';

    const username = verifyToken(headerToken || queryToken);
    if (!username) return res.status(401).json({ ok: false, error: '登录已过期，请重新登录' });

    res.locals.username = username;   // 挂给下游路由用（如 /api/auth/me）
    next();
};
