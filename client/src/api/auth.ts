import { request } from '@/api/http';

export interface AuthResult {
    token: string;
    username: string;
}

export function login(username: string, password: string): Promise<AuthResult> {
    return request<AuthResult>('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
    });
}

export function register(username: string, password: string): Promise<void> {
    return request<void>('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
    });
}

// 校验 token 还有效，返回用户名（过期会 401，由请求层统一接管）
// token 现在由 request() 自动附带，不用再当参数传
export function me(): Promise<{ username: string }> {
    return request<{ username: string }>('/api/auth/me');
}
