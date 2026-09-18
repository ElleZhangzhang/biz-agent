import { Router } from "express";
import { register, login } from "@/auth.js";
import { requireAuth } from "@/middleware/auth.js";

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

// 校验 token 还有效：解析交给 requireAuth，本路由只管把用户回给前端
router.get('/me', requireAuth, (_req, res) => {
    res.status(200).json({ ok: true, data: { username: res.locals.username } });
});

export default router;
