import { useAuthStore } from '@/stores/authStore';

export class ApiError extends Error {
    status: number;
    constructor(message: string, status: number) {
        super(message);
        this.name = 'ApiError';
        this.status = status;
    }
}

// 401 之后该做什么（跳登录页）由 React 层注册进来：
// api 层不认识 router，也不该认识——依赖倒置
let onUnauthorized: (() => void) | null = null;
export function setUnauthorizedHandler(fn: () => void) {
    onUnauthorized = fn;
}

// 401 统一收口：清会话 + 通知上层跳转。SSE 那种自己管 fetch 的地方也复用这个
export function handleUnauthorized() {
    useAuthStore.getState().logout();
    onUnauthorized?.();
}

/**
 * 普通接口的统一入口，三层错误分层：
 * 1. 网络层：fetch reject（断网/DNS）→ ApiError(status 0)
 * 2. HTTP 层：非 2xx → ApiError(status = 4xx/5xx)，文案优先用后端给的 error
 * 3. 业务层：HTTP 200 但 { ok: false } → ApiError(status 200)
 * 成功统一返回 data；没有 data 字段时返回整个 body（兼容 register 这种 { ok: true } 响应）
 */
export async function request<T>(url: string, init?: RequestInit): Promise<T> {
    let res: Response;
    try {
        res = await fetch(url, init);
    } catch {
        throw new ApiError('网络异常，请检查网络连接', 0);
    }

    if (res.status === 401) handleUnauthorized();

    // body 可能不是 JSON（网关/代理返回 HTML 错误页），解析失败按 null 处理
    const body = (await res.json().catch(() => null)) as
        { ok?: boolean; error?: string; data?: unknown } | null;

    if (!res.ok) throw new ApiError(body?.error ?? `请求失败（${res.status}）`, res.status);
    if (body?.ok === false) throw new ApiError(body.error ?? '操作失败', res.status);

    return (body && 'data' in body ? body.data : body) as T;
}
