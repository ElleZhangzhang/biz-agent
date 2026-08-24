import { runAgentStream } from "@/api/agent";
import { useState } from "react";

type ConsoleMsg =
    | { kind: 'user'; text: string }
    | { kind: 'answer'; text: string }
    | { kind: 'tool_call'; name: string; arguments: string }
    | { kind: 'tool_result'; name: string; result: unknown }
    | { kind: 'approval_required'; approvalId: string; toolName: string; args: Record<string, unknown> }
    | { kind: 'error'; text: string };

function AgentConsole() {

    const [input, setInput] = useState('');
    const [messages, setMessages] = useState<ConsoleMsg[] | []>([]);
    const [streaming, setStreaming] = useState(false);

    async function handleSend() {
        const text = input.trim();
        if (!text || streaming) return;
        setInput('');
        setMessages((m) => [...m, { kind: 'user', text }]);
        setStreaming(true);

        try {
            await runAgentStream(text, (event) => {
                setMessages((m) => [...m, { toConsoleMsg(event) }]);
            })
        }
    }

    return (
        <></>
    )
}
export default AgentConsole;