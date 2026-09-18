import { randomBytes, scryptSync } from 'node:crypto';
import pool from '@/db.js';

const TOKEN_TTL = 7 * 24 * 60 * 60 * 1000;

// 注册：
// 1. 生成随机盐 randomBytes(16).toString('hex');
// 2. 密码+随机盐=加盐哈希密码1 scryptSync(password, salt, 64).toString('hex');
// 3. 将加盐哈希密码insert库
export async function register(
    username: string,
    password: string
): Promise<{ ok: true } | { ok: false; error: string }> {
    const [exists] = await pool.query('SELECT id FROM users WHERE username = ?', [username]);
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
// 3. 对比 1 和 2，成功则生成token randomBytes(32).toString('hex');
export async function login(
    username: string,
    password: string
): Promise<{ ok: true; data: { token: string; username: string } } | { ok: false; error: string }> {
    const [rows] = await pool.query('SELECT password_hash, salt FROM users WHERE username = ?', [username]);
    const user = (rows as any[])[0];
    if (!user) return { ok: false, error: '用户名错误' };

    const hash = scryptSync(password, user.salt, 64).toString('hex');
    if (hash !== user.password_hash) return { ok: false, error: '用户名或密码错误' };

    const token = randomBytes(32).toString('hex');
    await pool.query(
        'INSERT INTO tokens (token, username, expires_at) VALUES (?, ?, ?)',
        [token, username, new Date(Date.now() + TOKEN_TTL)]
    );
    return { ok: true, data: { token, username } };
}

export async function getUserByToken(token: string): Promise<string | null> {
    const [rows] = await pool.query(
        'SELECT username FROM tokens WHERE token = ? AND expires_at > NOW()',
        [token]
    );
    return (rows as any[])[0]?.username ?? null;
}
