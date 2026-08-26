import { Alert, Card, Input, Tag } from 'antd';
import { useState } from 'react';
import { runAgentStream, type AgentEvent } from '@/api/agent';

type ConsoleMsg =
    | { kind: 'user'; text: string }
    | { kind: 'answer'; text: string }
    | { kind: 'tool_call'; name: string; arguments: string }
    | { kind: 'tool_result'; name: string; result: unknown }
    | { kind: 'approval_required'; approvalId: string; toolName: string; args: Record<string, unknown> }
    | { kind: 'error'; text: string };

// AgentEvent（传输层，后端发来的）→ ConsoleMsg（展示层，前端自己的）
function toConsoleMsg(event: AgentEvent): ConsoleMsg {
    switch (event.type) {
        case 'tool_call':
            return { kind: 'tool_call', name: event.name, arguments: event.arguments };
        case 'tool_result':
            return { kind: 'tool_result', name: event.name, result: event.result };
        case 'approval_required':
            return { kind: 'approval_required', approvalId: event.approvalId, toolName: event.toolName, args: event.args };
        case 'done':
            return { kind: 'answer', text: event.content };   // 最终回答
        case 'error':
            return { kind: 'error', text: event.error };
    }
}

// 每种消息长什么样，抽成纯展示组件，主组件只管"列表+输入框"
function Message({ m }: { m: ConsoleMsg; onError: (text: string) => void }) {
    switch (m.kind) {
        case 'user':
            return (
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 8 }}>
                    <div style={{ background: '#1677ff', color: '#fff', borderRadius: 8, padding: '8px 12px', maxWidth: '70%' }}>
                        {m.text}
                    </div>
                </div>
            );
        case 'answer':
            return (
                <div style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: 8 }}>
                    <div style={{ background: '#f5f5f5', borderRadius: 8, padding: '8px 12px', maxWidth: '70%' }}>
                        {m.text}
                    </div>
                </div>
            );
        case 'tool_call':
            return (
                <Card size="small" style={{ marginBottom: 8, background: '#fafafa' }}>
                    🔧 调用工具 <Tag color="blue">{m.name}</Tag>
                    <pre style={{ margin: '8px 0 0', fontSize: 12 }}>
                        {JSON.stringify(JSON.parse(m.arguments), null, 2)}
                    </pre>
                </Card>
            );
        case 'tool_result':
            return (
                <Card size="small" style={{ marginBottom: 8, background: '#fafafa' }}>
                    📦 工具结果 <Tag color="green">{m.name}</Tag>
                    <pre style={{ margin: '8px 0 0', fontSize: 12 }}>
                        {JSON.stringify(m.result, null, 2)}
                    </pre>
                </Card>
            );
        case 'approval_required':
            return (
                <Card size="small" style={{ marginBottom: 8, borderColor: '#faad14' }}>
                    ⏸ 需要人工审批 <Tag color="orange">{m.toolName}</Tag>
                    <pre style={{ margin: '8px 0 0', fontSize: 12 }}>
                        {JSON.stringify(m.args, null, 2)}
                    </pre>
                </Card>
            );
        case 'error':
            return <Alert type="error" message={m.text} style={{ marginBottom: 8 }} />;
    }
}

function AgentConsole() {
    const [input, setInput] = useState('');
    const [messages, setMessages] = useState<ConsoleMsg[]>([]);
    const [streaming, setStreaming] = useState(false);

    async function handleSend() {
        const prompt = input.trim();
        if (!prompt || streaming) return;
        setInput('');
        setMessages((m) => [...m, { kind: 'user', text: prompt }]);
        setStreaming(true);

        try {
            await runAgentStream(prompt, (event) => {
                setMessages((m) => [...m, toConsoleMsg(event)]);
            })
        } catch (e) {
            setMessages((m) => [...m, { kind: 'error', text: e instanceof Error ? e.message : String(e) }])
        } finally {
            setStreaming(false);
        }
    }

    return (
        <div>
            {/* 消息列表：固定高度 + 内部滚动 */}
            <div style={{ maxHeight: 480, overflowY: 'auto', marginBottom: 12 }}>
                {messages.map((m, i) => <Message key={i} m={m} />)}
            </div>
            {/* 输入区：回车或点按钮发送，streaming 时禁用 */}
            <Input.Search
                placeholder="跟 Agent 说点什么…"
                enterButton="发送"
                value={input}
                loading={streaming}
                onChange={(e) => setInput(e.target.value)}
                onSearch={handleSend}
            />
        </div>
    );
}

export default AgentConsole;
