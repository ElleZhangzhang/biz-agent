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
        const err = await res.json().catch(() => null);
        throw new Error(err?.error ?? 'Agent 请求失败');
    }
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        let sep = buffer.indexOf('\n\n');
        while (sep !== -1) {
            const frame = buffer.slice(0, sep).trim();
            buffer = buffer.slice(sep + 2);
            if (frame.startsWith('data: ')) {
                onEvent(JSON.parse(frame.slice(6)) as AgentEvent);
            }
        }
    }
}
