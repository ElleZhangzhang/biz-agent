export interface AuthResult {
    token: string;
    username: string;
}

export async function login(username: string, password: string): Promise<AuthResult> {
    const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
    });
    if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.error ?? '登录失败');
    }
    return (await res.json()).data;
}

export async function register(username: string, password: string): Promise<void> {
    const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
    });
    if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.error ?? '注册失败');
    }
}

// 校验 token 还有效，返回用户名（过期会 401）
export async function me(token: string): Promise<{ username: string }> {
    const res = await fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.error ?? '会话已失效');
    }
    return (await res.json()).data;
}
