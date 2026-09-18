import { Alert, Card, Input, Tag, Button } from 'antd';
import type { InputRef } from 'antd';
import { useActionState, useEffect, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { runAgentStream, type AgentEvent } from '@/api/agent';
import ApprovalCard from '@/components/ApprovalCard';

type ConsoleMsg =
    | { kind: 'user'; text: string }
    | { kind: 'answer'; text: string }
    | { kind: 'answer_stream'; text: string }
    | { kind: 'tool_call'; name: string; arguments: string }
    | { kind: 'tool_result'; name: string; result: unknown }
    | { kind: 'approval_required'; approvalId: string; toolName: string; args: Record<string, unknown> }
    | { kind: 'error'; text: string };

function toConsoleMsg(event: Exclude<AgentEvent, { type: 'answer_delta' } | { type: 'done' }>): ConsoleMsg {
    switch (event.type) {
        case 'tool_call':
            return { kind: 'tool_call', name: event.name, arguments: event.arguments };
        case 'tool_result':
            return { kind: 'tool_result', name: event.name, result: event.result };
        case 'approval_required':
            return { kind: 'approval_required', approvalId: event.approvalId, toolName: event.toolName, args: event.args };
        case 'error':
            return { kind: 'error', text: event.error };
    }
}

// 每种消息长什么样，抽成纯展示组件，主组件只管"列表+输入框"
function Message({ m, onError }: { m: ConsoleMsg; onError: (text: string) => void }) {
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
                        <ReactMarkdown
                            remarkPlugins={[remarkGfm]}
                            components={{
                                p: ({ children }) => <p style={{ margin: '4px 0' }}>{children}</p>,
                                ul: ({ children }) => <ul style={{ margin: '4px 0', paddingLeft: 20 }}>{children}</ul>,
                                ol: ({ children }) => <ol style={{ margin: '4px 0', paddingLeft: 20 }}>{children}</ol>,
                                li: ({ children }) => <li style={{ margin: '2px 0' }}>{children}</li>,
                                table: ({ children }) => <table style={{ borderCollapse: 'collapse', margin: '8px 0', fontSize: 13 }}>{children}</table>,
                                th: ({ children }) => <th style={{ border: '1px solid #d9d9d9', padding: '4px 8px' }}>{children}</th>,
                                td: ({ children }) => <td style={{ border: '1px solid #d9d9d9', padding: '4px 8px' }}>{children}</td>,
                            }}
                        >
                            {m.text}
                        </ReactMarkdown>
                    </div>
                </div>
            );
        case 'answer_stream':
            return (
                <div style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: 8 }}>
                    <div style={{ background: '#f5f5f5', borderRadius: 8, padding: '8px 12px', maxWidth: '70%' }}>
                        {m.text}
                        <span style={{ color: '#999' }}>▍</span>
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
                <ApprovalCard
                    approvalId={m.approvalId}
                    toolName={m.toolName}
                    args={m.args}
                    onError={onError}
                />
            );
        case 'error':
            return <Alert type="error" message={m.text} style={{ marginBottom: 8 }} />;
    }
}

function AgentConsole() {
    const [messages, setMessages] = useState<ConsoleMsg[]>([]);

    const formRef = useRef<HTMLFormElement | null>(null);
    const inputRef = useRef<InputRef | null>(null);
    // const [input, setInput] = useState('');
    // const [streaming, setStreaming] = useState(false);




    const [, sendAction, isPending] = useActionState(
        async (_prev: null, formData: FormData) => {
            const prompt = String(formData.get('prompt') ?? '').trim();
            if (!prompt) return null;
        }
    )




    const charQueueRef = useRef<string[]>([]);   // 字符队列
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

    function startTyping() {
        if (timerRef.current) return;
        timerRef.current = setInterval(() => {
            const chars = charQueueRef.current.splice(0, 2);
            if (!chars.length) return;
            const piece = chars.join('');
            setMessages((messages) => {
                const last = messages[messages.length - 1];
                if (last?.kind === 'answer_stream') {
                    return [...messages.slice(0, -1), { kind: 'answer_stream', text: last.text + piece }];
                }
                return [...messages, { kind: 'answer_stream', text: piece }];
            });
        }, 30);
    }

    function stopTyping() {
        if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    }

    // 组件卸载时清计时器，防止泄漏
    useEffect(() => () => stopTyping(), []);

    const pushError = (text: string) => setMessages((m) => [...m, { kind: 'error', text }]);

    async function handleSend() {
        const prompt = input.trim();
        if (!prompt || streaming) return;
        setInput('');
        setMessages((prev) => prev.filter((m) => m.kind !== 'answer_stream'));
        stopTyping();
        charQueueRef.current = [];
        setStreaming(true);

        try {
            await runAgentStream(prompt, (event) => {
                if (event.type === 'answer_delta') {
                    charQueueRef.current.push(...Array.from(event.content));
                    startTyping();
                } else if (event.type === 'done') {

                    stopTyping();
                    charQueueRef.current = [];

                    setMessages((messages) => {
                        const last = messages[messages.length - 1];
                        if (last?.kind === 'answer_stream') {
                            return [...messages.slice(0, -1), { kind: 'answer', text: event.content }];
                        }
                        return [...messages, {
                            kind: 'answer',
                            text: event.content
                        }];
                    });
                } else {
                    setMessages((m) => [...m, toConsoleMsg(event)]);
                }
            })
        } catch (e) {
            setMessages((m) => [...m, {
                kind: 'error',
                text: e instanceof Error ? e.message : String(e)
            }])
        } finally {
            setStreaming(false);
        }

    }

    return (
        <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
            {/* 消息列表：占满剩余空间，内部滚动 */}
            <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', marginBottom: 12 }}>
                {messages.map((m, i) => <Message key={i} m={m} onError={pushError} />)}
            </div>
            {/* 输入区：固定在板块底部，回车或点按钮发送，streaming 时禁用 */}
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
