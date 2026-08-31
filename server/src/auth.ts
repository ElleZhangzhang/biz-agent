import { randomBytes, scryptSync } from 'node:crypto';
import pool from '@/db.js';

// token 有效期：7 天（毫秒）
const TOKEN_TTL = 7 * 24 * 60 * 60 * 1000;

export async function register(
    username: string,
    password: string
): Promise<{ ok: true } | { ok: false; error: string }> {
    // 查重：username 列有唯一键，但先查一次给友好错误（不依赖数据库异常翻译）
    const [exists] = await pool.query('SELECT id FROM users WHERE username = ?', [username]);
    if ((exists as any[]).length > 0) return { ok: false, error: '用户名已存在' };

    // 密码绝不明文存：scrypt 加盐哈希（Node 内置，抗 GPU 爆破）
    const salt = randomBytes(16).toString('hex');
    const passwordHash = scryptSync(password, salt, 64).toString('hex');

    await pool.query(
        'INSERT INTO users (username, password_hash, salt, created_at) VALUES (?, ?, ?, ?)',
        [username, passwordHash, salt, new Date()]
    );
    return { ok: true };
}

export async function login(
    username: string,
    password: string
): Promise<{ ok: true; data: { token: string; username: string } } | { ok: false; error: string }> {
    const [rows] = await pool.query('SELECT password_hash, salt FROM users WHERE username = ?', [username]);
    const user = (rows as any[])[0];
    if (!user) return { ok: false, error: '用户名或密码错误' };

    const hash = scryptSync(password, user.salt, 64).toString('hex');
    if (hash !== user.password_hash) return { ok: false, error: '用户名或密码错误' };

    // 生成 token 并落库（重启不掉线，前端 7 天内不用重登）
    const token = randomBytes(32).toString('hex');
    await pool.query(
        'INSERT INTO tokens (token, username, expires_at) VALUES (?, ?, ?)',
        [token, username, new Date(Date.now() + TOKEN_TTL)]
    );
    return { ok: true, data: { token, username } };
}

// 按 token 找回用户名；不存在或过期返回 null（过期判断直接放 SQL，代码里不用比日期）
export async function getUserByToken(token: string): Promise<string | null> {
    const [rows] = await pool.query(
        'SELECT username FROM tokens WHERE token = ? AND expires_at > NOW()',
        [token]
    );
    return (rows as any[])[0]?.username ?? null;
}
