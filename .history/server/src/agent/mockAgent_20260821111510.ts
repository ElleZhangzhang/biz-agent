import { Decide } from "@/agent/agentLoop.js";

export function createMockDecide(): Decide {
    return async (messages) => {
        // 判断依据：只看 messages（真实 LLM 也只"看"messages）
        const hasToolResult = messages.some(m => m.role === 'tool');

        // 需要调overview的两种情况
        // 初始分支
        if (!hasToolResult && messages[messages.length - 1].content?.includes('总览')) {
            return {
                toolCalls: [{ id: 'call_1', name: 'get_overview', arguments: '{}' }],
            };
        }

        // 总结分支
        if (hasToolResult) {
            const toolMsg = messages.find(m => m.role === 'tool')!;
            return { content: `（mock 总结）我查了业务总览，看到的数据是：${toolMsg.content}` };
        }

        // 兜底：既没触发工具也没结果 → 明说自己能力有限
        return { content: '我是 mock Agent，只能演示总览查询。试试问"查看总览"。' };
    };
}