import { TOOLS } from "@/agent/tools.js";

// Agent对话的类型
注意：OpenAI 协议要求：role: 'tool' 的结果之前，必须紧跟一条 assistant 的 tool_calls 消息——否则它不知道这条结果是回应哪次工具调用，直接返回 400
interface AgentMessage {
    role: 'system' | 'user' | 'assistant' | 'tool';
    content?: string;
    tool_call_id?: string;
    tool_calls?: {
        id: string;
        type: 'function';
        function: {
            name: string;
            arguments: string
        };
    }[];
}

// Agent所调用的ToolCall信息
export interface ToolCall {
    id: string;          // 指令编号，后面按它收结果
    name: string;        // 要调哪个工具
    arguments: string;   // 参数，JSON 字符串（要 parse）
}

// Agent返回内容
export type Step =
    | { content: string }        // 说了人话 → 循环结束，content 就是最终答案
    | { toolCalls: ToolCall[] }; // 想调工具 → 循环继续，去执行

// Agent决定器
export type Decide = (messages: AgentMessage[]) => Promise<Step>;

const MAX_TURNS = 5;   // 保险：防 LLM 死循环无限调工具
const SYSTEM_PROMPT = `
角色：你是一个电商业务运营助手，
能力边界：只能通过提供的工具操作业务系统，工具没覆盖的事情要做不到就明说，不能瞎编，
安全规则：涉及高风险/危险操作（取消订单、改价）时，先停下来说明，等待人工审批
要求：你必须严格遵循以上约束
`;

export async function runAgent(prompt: string, decide: Decide): Promise<string> {
    const messages: AgentMessage[] = [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: prompt },
    ];

    for (let turn = 0; turn < MAX_TURNS; turn++) {
        const step = await decide(messages);

        if ('content' in step) return step.content;

        for (const call of step.toolCalls) {
            const tool = TOOLS.find(t => t.name === call.name);
            let result = undefined;
            if (!tool) {
                result = '工具不存在';
            } else {
                const args = JSON.parse(call.arguments);
                result = tool.execute(args);
            }

            messages.push({
                role: 'tool',
                tool_call_id: call.id,
                content: JSON.stringify(result),
            });
        }
    }
    return '抱歉，我思考太久了，需要你重启一下'
}