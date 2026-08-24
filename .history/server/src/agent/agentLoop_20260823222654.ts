import { TOOLS } from "@/agent/tools.js";
import { createApproval, waitForApproval } from "@/agent/approvals.js";

// Agent对话的类型
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
    name: string;
    arguments: string;   // 参数，JSON 字符串（要 parse）
}

// Agent返回内容
export type Step =
    | { content: string }
    | { toolCalls: ToolCall[] };

// Agent决定器
export type Decide = (messages: AgentMessage[]) => Promise<Step>;

const MAX_TURNS = 5;   // 保险：防 LLM 死循环无限调工具
const SYSTEM_PROMPT = `
角色：你是一个电商业务运营助手，
能力边界：只能通过提供的工具操作业务系统，工具没覆盖的事情要做不到就明说，不能瞎编，
安全规则：所有业务操作都直接调用对应工具；危险操作（取消订单、改价）系统会自动请求人工审批，无需自行拦阻
`;

// 广播的事件类型：(1)ToolCalls (2)content
export type AgentEvent =
    | {
        type: 'tool_result';
        name: string;
        result: unknown
    }
    | {
        type: 'tool_call';
        name: string;
        arguments: string
    }
    | {
        type: 'approval_required';
        approvalId: string;   // 审批单号，前端拿它调 decide 接口
        toolName: string;
        args: Record<string, unknown>;  // 参数快照：前端展示"要取消订单 o1？"
    }
    | { type: 'done'; content: string }
    | { type: 'error'; error: string };

export async function runAgent(
    prompt: string,
    decide: Decide,
    onEvent?: (event: AgentEvent) => void,
): Promise<string> {
    const messages: AgentMessage[] = [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: prompt },
    ];

    for (let turn = 0; turn < MAX_TURNS; turn++) {
        const step = await decide(messages);

        if ('content' in step) return step.content;

        // OpenAI 协议：tool 结果前，必须先有 assistant 的 tool_calls 消息
        messages.push({
            role: 'assistant',
            content: '',
            tool_calls: step.toolCalls.map(call => ({
                id: call.id,
                type: 'function',
                function: {
                    name: call.name,
                    arguments: call.arguments
                },
            })),
        });
        for (const call of step.toolCalls) {
            // 广播：ToolCalls
            onEvent?.({
                type: 'tool_call',
                name: call.name,
                arguments: call.arguments
            });

            const tool = TOOLS.find(t => t.name === call.name);
            let result = undefined;
            if (!tool) {
                result = '工具不存在';
            } else {
                const args = JSON.parse(call.arguments);
                // 分支一：需要“审批”，先问再执行
                if (tool.requiresApproval) {
                    // 1. 创建工单
                    const approval = createApproval(tool.name, args);
                    onEvent?.({
                        type: 'approval_required',
                        approvalId: approval.id,
                        toolName: tool.name,
                        args,
                    });                                          // 2. 广播"请审批"
                    const decision = await waitForApproval(approval.id);
                    // 3. 根据“审批”结果执行
                    result = decision.status === 'approved'
                        ? tool.execute(args)
                        : { rejected: true, message: `操作被拒绝: ${tool.name}` };
                } else {
                    // 分支二：不需要，直接执行即可
                    result = tool.execute(args);
                }
            }
            // 广播：content
            onEvent?.({
                type: 'tool_result',
                name: call.name,
                result
            });

            messages.push({
                role: 'tool',
                tool_call_id: call.id,
                content: JSON.stringify(result),
            });
        }
    }
    return '抱歉，我思考太久了，需要你重启一下';
}