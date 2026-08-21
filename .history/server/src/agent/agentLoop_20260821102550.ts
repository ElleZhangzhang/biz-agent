interface AgentMessage {
    role: 'system' | 'user' | 'assistant' | 'tool';
    content?: string;
    tool_call_id?: string;
}
export interface ToolCall {
    id: string;          // 指令编号，后面按它收结果
    name: string;        // 要调哪个工具
    arguments: string;   // 参数，JSON 字符串（要 parse）
}
export type Step =
    | { content: string }        // ① 说了人话 → 循环结束，content 就是最终答案
    | { toolCalls: ToolCall[] }; // ② 想调工具 → 循环继续，去执行