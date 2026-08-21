import { Decide } from "@/agent/agentLoop.js";

export function createMockDecide(): Decide {
    return async (messages) => {
        // 判断依据：只看 messages（真实 LLM 也只"看"messages）
        const hasToolResult = messages.some(m => m.role === 'tool');

        // 需要调overview的两种情况：
        // (1)初始分支
        if (!hasToolResult) {
            // 打分：每个工具数一数自己的触发词命中了几个，命中最多 = 用户意图
            let best: (typeof RULES)[number] | null = null;
            let bestScore = 0;
            for (const rule of RULES) {
                const score = rule.keywords.filter(k => text.includes(k)).length;
                if (score > bestScore) { best = rule; bestScore = score; }
            }
            if (best) return { toolCalls: [{ id: 'call_1', name: best.name, arguments: '{}' }] };
            return { content: '我暂时只会查总览和订单，换个说法试试。' };
        }

        // (2)总结分支
        if (hasToolResult) {
            const toolMsg = messages.find(m => m.role === 'tool')!;
            return { content: `（mock 总结）我查了业务总览，看到的数据是：${toolMsg.content}` };
        }

        // 不需要调overview的情况
        return { content: '我是 mock Agent，只能演示总览查询。试试问"查看总览"。' };
    };
}