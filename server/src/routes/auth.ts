import { Router } from "express";
import { register, login, getUserByToken } from "@/auth.js";

const router = Router();

router.post('/register', async (req, res) => {
    const { username, password } = req.body ?? {};
    if (typeof username !== 'string' || typeof password !== 'string' || !username || !password) {
        return res.status(400).json({ ok: false, error: '用户名和密码不能为空' });
    }

    const r = await register(username, password);
    res.status(r.ok ? 201 : 409).json(r);
});

router.post('/login', async (req, res) => {
    const { username, password } = req.body ?? {};
    if (typeof username !== 'string' || typeof password !== 'string' || !username || !password) {
        return res.status(400).json({ ok: false, error: '用户名和密码不能为空' });
    }

    const r = await login(username, password);
    res.status(r.ok ? 200 : 401).json(r);
});

router.get('/me', async (req, res) => {
    const auth = req.headers.authorization ?? '';
    const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';
    const username = await getUserByToken(token);
    if (!username) return res.status(401).json({ ok: false, error: '登录已过期，请重新登录' });

    res.status(200).json({ ok: true, data: { username } });
});

export default router;
