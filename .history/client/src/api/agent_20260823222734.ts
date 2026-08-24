export type AgentEvent =
    | { type: 'tool_call'; name: string; arguments: string }
    | { type: 'tool_result'; name: string; result: unknown }
    | { type: 'approval_required'; approvalId: string; toolName: string; args: Record<string, unknown> }
    | { type: 'done'; content: string }
    | { type: 'error'; error: string };

export async function runAgentStream(
    prompt: string,
    onEvent: (event: AgentEvent) => void,
): Promise<void> {
    const res = await fetch('/api/agent/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
    });
    if (!res.ok || !res.body) {
        // 请求没进 SSE（比如缺 prompt 的 400）：后端返回的是普通 JSON
        const err = await res.json().catch(() => null);
        throw new Error(err?.error ?? 'Agent 请求失败');
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';          // 网络包是随机切的，要用 buffer 攒着凑完整帧

    while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });  // 字节 → 字符串

        // 帧之间以空行 \n\n 分隔；一帧 = "data: {...}"
        let sep = buffer.indexOf('\n\n');
        while (sep !== -1) {
            const frame = buffer.slice(0, sep).trim();
            buffer = buffer.slice(sep + 2);          // 消费掉这一帧
            if (frame.startsWith('data: ')) {
                onEvent(JSON.parse(frame.slice(6)) as AgentEvent);
            }
            sep = buffer.indexOf('\n\n');
        }
    }
}
