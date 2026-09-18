import { useAuthStore } from '@/stores/authStore';

export class ApiError extends Error {
    status: number;
    constructor(message: string, status: number) {
        super(message);
        this.name = 'ApiError';
        this.status = status;
    }
}

let onUnauthorized: (() => void) | null = null;
export function setUnauthorizedHandler(fn: () => void) {
    onUnauthorized = fn;
}

export function handleUnauthorized() {
    const { token, logout } = useAuthStore.getState();

    // 防止并发请求都返回401而多次执行logout/跳转
    if (!token) return;

    logout(); // localStorage.removeItem
    onUnauthorized?.(); // 跳转至登录页
}

export function authHeaders(extra?: HeadersInit): Headers {
    const headers = new Headers(extra);
    const token = useAuthStore.getState().token;
    if (token) headers.set('Authorization', `Bearer ${token}`);
    return headers;
}

export async function request<T>(url: string, init?: RequestInit): Promise<T> {
    let res: Response;
    try {
        res = await fetch(url, { ...init, headers: authHeaders(init?.headers) });
    } catch {
        throw new ApiError('网络异常，请检查网络连接', 0);
    }

    if (res.status === 401) handleUnauthorized();

    const body = (await res.json().catch(() => null)) as
        { ok?: boolean; error?: string; data?: unknown } | null;

    if (!res.ok) throw new ApiError(body?.error ?? `请求失败（${res.status}）`, res.status);
    if (body?.ok === false) throw new ApiError(body.error ?? '操作失败', res.status);

    return (body && 'data' in body ? body.data : body) as T;
}
