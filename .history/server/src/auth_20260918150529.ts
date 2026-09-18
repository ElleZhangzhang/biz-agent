import { randomBytes, scryptSync } from 'node:crypto'; // nodeJS特有库
import jwt from 'jsonwebtoken';
import pool from '@/db.js';

// token 有效期：7 天（写进 JWT 的 exp 声明，服务端不再存任何东西）
const TOKEN_TTL = '7d';

function requireSecret(): string {
    const secret = process.env.JWT_SECRET;
    if (!secret) throw new Error('缺少 JWT_SECRET，请在 server/.env 中配置');
    return secret;
}
const JWT_SECRET = requireSecret();

// 注册：
// 1. 生成随机盐 randomBytes(16).toString('hex');
// 2. 密码+随机盐=加盐哈希密码1 scryptSync(password, salt, 64).toString('hex');
// 3. 将加盐哈希密码insert库
export async function register(
    username: string,
    password: string
): Promise<{ ok: true } | { ok: false; error: string }> {
    const [exists] = await pool.query('SELECT id FROM users WHERE username = ?', [username]); // pool.query - nodeJS
    if ((exists as any[]).length > 0) return { ok: false, error: '用户名已存在' };

    const salt = randomBytes(16).toString('hex');
    const passwordHash = scryptSync(password, salt, 64).toString('hex');

    await pool.query(
        'INSERT INTO users (username, password_hash, salt, created_at) VALUES (?, ?, ?, ?)',
        [username, passwordHash, salt, new Date()]
    );
    return { ok: true };
}

// 登录：
// 1. 通过username拿到user
// 2. 生成加盐哈希密码2 scryptSync(password, user.salt, 64).toString('hex');
// 3. 对比 1 和 2，成功则签发 JWT（不再写库：有效期在签名里）
export async function login(
    username: string,
    password: string
): Promise<{ ok: true; data: { token: string; username: string } } | { ok: false; error: string }> {
    const [rows] = await pool.query('SELECT password_hash, salt FROM users WHERE username = ?', [username]);
    const user = (rows as any[])[0];
    if (!user) return { ok: false, error: '用户名或密码错误' };

    const hash = scryptSync(password, user.salt, 64).toString('hex');
    if (hash !== user.password_hash) return { ok: false, error: '用户名或密码错误' };

    return { ok: true, data: { token: signToken(username), username } };
}

export function signToken(username: string): string {
    return jwt.sign({ username }, JWT_SECRET, { expiresIn: TOKEN_TTL });
}

export function verifyToken(token: string): string | null {
    try {
        const payload = jwt.verify(token, JWT_SECRET);
        if (typeof payload === 'object' && typeof payload.username === 'string') return payload.username;
        return null;
    } catch {
        return null;
    }
}
