import { Decide } from "@/agent/agentLoop.js";

export function createMockDecide(): Decide {
    return async (messages) => {
        // 判断依据：只看 messages（真实 LLM 也只"看"messages）
        const hasToolResult = messages.some(m => m.role === 'tool');

        // 分支一：还没调过工具 + 用户问了"总览" → 决定调 get_overview
        if (!hasToolResult && messages[messages.length - 1].content?.includes('总览')) {
            return {
                toolCalls: [{ id: 'call_1', name: 'get_overview', arguments: '{}' }],
            };
        }

        // 分支二：已经拿到工具结果（messages 里有 role:'tool'）→ mock"看完后"总结

        return { content: `（mock 总结）我查了业务总览，看到的数据是：${toolMsg.content}` };
    }

    // 兜底：既没触发工具也没结果 → 明说自己能力有限
    return { content: '我是 mock Agent，只能演示总览查询。试试问"查看总览"。' };
};
}