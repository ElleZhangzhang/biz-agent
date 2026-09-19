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

// Agetool_resultnt所调用的ToolCall信息
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
export type Decide = (messages: AgentMessage[], onText: (text: string) => void) => Promise<Step>;

const MAX_TURNS = 5;   // 保险：防 LLM 死循环无限调工具

// BUG 测试过程中换了测试数据并再次发出总览请求，但模型记得之前的总览导致它选择将之前的测试数据直接返回了
// 解决：在提示词中添加特别注意，让模型忘记之前的一切调用，只做纯粹的业务处理
const SYSTEM_PROMPT = `
角色：你是一个电商业务运营助手，
能力边界：只能通过提供的工具操作业务系统，工具没覆盖的事情要做不到就明说，不能瞎编，
安全规则：所有业务操作都直接调用对应工具；危险操作（取消订单、改价）系统会自动请求人工审批，无需自行拦阻，
特殊情况时的必加内容：如果操作为处理订单并发现了低于库存最低阈值的物品，请在最后总结的时候以表格的形式输出这些物品，
特别注意：你没有记忆，你要将用户每次发的信息都当成第一次去听、去执行，执行完忘掉即可
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
    | {
        type: 'answer_delta';
        content: string;   // LLM 生成过程中的一段文字，实时推到前端
    }
    | { type: 'done'; content: string }
    | { type: 'error'; error: string };

// TODO SSE事件 id/Last-Event-ID 断点续传
// LIGHT 设计"LLM 决策 → 工具执行 → 结果回注"的 Agent 循环
// 1. decide 决策，拿到决策结果
// 2. step 根据step执行循环
//     (1)content 返回最终总结
//     (2)toolcalls 遍历执行callbacks，并将每个执行结果回注到messages 

// LIGHT 广播
// 1. 广播调用工具
// 2. 广播某调用工具的调用结果
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
        // LLM决策
        const step = await decide(messages, (text) => {
            onEvent?.({ type: 'answer_delta', content: text });
        }); // decide就是createDecide的返回结果，用来向模型发送请求

        if ('content' in step) return step.content;

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

        // 工具执行
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
                    const approval = await createApproval(tool.name, args);
                    onEvent?.({
                        type: 'approval_required',
                        approvalId: approval.id,
                        toolName: tool.name,
                        args,
                    });                                          // 2. 广播"请审批"
                    const decision = await waitForApproval(approval.id);
                    // 3. 根据“审批”结果执行
                    result = decision.status === 'approved'
                        ? await tool.execute(args)
                        : { rejected: true, message: `操作被拒绝: ${tool.name}` };
                } else {
                    // 分支二：不需要，直接执行即可
                    result = await tool.execute(args);
                }
            }
            // 结果回注
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