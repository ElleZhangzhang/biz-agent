import { ApiError, authHeaders, handleUnauthorized, request } from '@/api/http';

export type AgentEvent =
    | { type: 'tool_call'; name: string; arguments: string }
    | { type: 'tool_result'; name: string; result: unknown }
    | { type: 'approval_required'; approvalId: string; toolName: string; args: Record<string, unknown> }
    | { type: 'answer_delta'; content: string }
    | { type: 'done'; content: string }
    | { type: 'error'; error: string };

export type ApprovalDecision = 'approved' | 'rejected';

// SSE 流式请求：不能走 request()（它是"等整个 JSON 回来"的模型），
// 所以这里手动对齐同一套策略：自动带 token + 401 统一收口 + 错误文案优先取后端 error
// TODO AbortController停止生成
export async function runAgentStream(
    prompt: string,
    onEvent: (event: AgentEvent) => void,
): Promise<void> {
    const res = await fetch('/api/agent/run', {
        method: 'POST',
        headers: authHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ prompt }),
    });

    if (res.status === 401) handleUnauthorized();
    if (!res.ok || !res.body) {
        const err = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new ApiError(err?.error ?? 'Agent 请求失败', res.status);
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    const processFrame = () => {
        let sep = buffer.indexOf('\n\n');
        while (sep !== -1) {
            const frame = buffer.slice(0, sep).trim();
            buffer = buffer.slice(sep + 2);
            if (frame.startsWith('data: ')) {
                onEvent(JSON.parse(frame.slice(6)) as AgentEvent);
            }
            sep = buffer.indexOf('\n\n');
        }
    }
    while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        // 1. 二进制 → 字符串
        // 2. {stream:true} 能凑齐的解码，不能凑成字的先存着
        processFrame();
    }
    // 无参冲刷
    buffer += decoder.decode();
    processFrame();
}

export function decideApproval(approvalId: string, decision: ApprovalDecision): Promise<void> {
    return request<void>(`/api/approvals/${approvalId}/decide`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ decision }),
    });
}
