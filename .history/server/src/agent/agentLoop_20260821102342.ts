interface AgentMessage {
    role: 'system' | 'user' | 'assistant' | 'tool';
    content?: string; tool_call_id?: string;
}