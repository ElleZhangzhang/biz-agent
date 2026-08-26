import { randomBytes, scryptSync } from 'node:crypto';

// 用户存储：暂时内存（server 重启即失），下一格迁移到 MySQL
const users = new Map<string, {
    username: string;
    passwordHash: string;
    salt: string;
    createdAt: string;
}>();

// token 存储：7 天有效期，过期即删
const TOKEN_TTL = 7 * 24 * 60 * 60 * 1000;   // 7 天，毫秒
const tokens = new Map<string, { username: string; expiresAt: number }>();

export function register(
    username: string,
    password: string
): { ok: true } | { ok: false; error: string } {
    if (users.has(username)) return { ok: false, error: '用户名已存在' };

    // 密码绝不明文存：scrypt 加盐哈希（Node 内置，抗 GPU 爆破）
    const salt = randomBytes(16).toString('hex');
    const passwordHash = scryptSync(password, salt, 64).toString('hex');

    users.set(username, {
        username,
        passwordHash,
        salt,
        createdAt: new Date().toISOString(),
    });
    return { ok: true };
}

export function login(
    username: string,
    password: string
): { ok: true; data: { token: string; username: string } } | { ok: false; error: string } {
    const user = users.get(username);
    if (!user) return { ok: false, error: '用户名或密码错误' };

    const hash = scryptSync(password, user.salt, 64).toString('hex');
    if (hash !== user.passwordHash) return { ok: false, error: '用户名或密码错误' };

    const token = randomBytes(32).toString('hex');
    tokens.set(token, { username, expiresAt: Date.now() + TOKEN_TTL });
    return { ok: true, data: { token, username } };
}

// 按 token 找回用户名；不存在或过期返回 null
export function getUserByToken(token: string): string | null {
    const t = tokens.get(token);
    if (!t) return null;
    if (Date.now() > t.expiresAt) {
        tokens.delete(token);   // 过期即清理
        return null;
    }
    return t.username;
}
