import { Decide } from "@/agent/agentLoop.js";

const RULES = [
    // 以后加工具 = 在这里加一行，不碰循环
    {
        name: 'restock',
        keywords: ['补货', '进货', '补充库存', '补充']
    },
    {
        name: 'get_overview',
        keywords: ['总览', '概览', '生意', '经营', '库存', '订单情况', '怎么样', '数据', '看看', '最近'],
    },
    {
        name: 'cancel_order',
        keywords: ['取消', '退单', '撤销'],
    },
    {
        name: 'process_order',
        keywords: ['处理', '接单', '完成']
    },
    {
        name: 'get_order',
        keywords: ['订单', '查单', '查询'],
    },
];

export function createMockDecide(): Decide {
    return async (messages) => {
        // 判断依据：只看 messages（真实 LLM 也只"看"messages）
        const hasToolResult = messages.some(m => m.role === 'tool');

        // (1)初始分支
        if (!hasToolResult) {
            let best: (typeof RULES)[number] | null = null;
            let bestScore = 0;
            for (const rule of RULES) {
                const score = rule.keywords.filter(k => messages[messages.length - 1].content?.includes(k)).length;
                if (score > bestScore) {
                    best = rule;
                    bestScore = score;
                }
            }
            if (best) {
                let args = '{}';

                // 参数提取：从用户原话里抠订单号（"取消订单 o1" → "o1"）
                const text = messages[messages.length - 1].content ?? '';

                if (best.name === 'cancel_order' || best.name === 'get_order' || best.name === 'process_order') {
                    const orderId = text.match(/o\d+/)?.[0];
                    if (!orderId) {
                        return { content: `请告诉我要${best.name === 'cancel_order' ? '取消' : best.name === 'process_order' ? '处理' : '查询'}哪个订单（订单号类似 o1）。` };
                    }
                    args = JSON.stringify({ orderId });
                }

                if (best.name === 'restock') {
                    const productId = text.match(/p\d+/)?.[0];
                    text.replace(/p\d+/g, '');
                    const qty = Number(text.match(/(\d+)\s*(?:个|件)/)?.[1] ?? text.match(/\d+/g)?.at(-1));
                    if (!productId || !qty) return { content: '请告诉我要给哪个商品补多少货（例如：给p6补货20个）。' }
                    args = JSON.stringify({ productId, qty });
                }

                if (best.name === 'get_overview') {
                    args = '{}';
                }

                return {
                    toolCalls: [
                        {
                            id: 'call_1',
                            name: best.name,
                            arguments: args
                        }
                    ]
                };
            }
            return {
                content: '我暂时只会查询总览/查询某订单/取消某订单/处理某订单/为某件商品补货，换个说法试试。'
            };
        }

        // (2)总结分支
        if (hasToolResult) {
            const toolMsg = messages.find(m => m.role === 'tool')!;
            // 从 assistant 消息里取刚调用的工具名（真实 LLM 也是这么"回忆"的）
            const toolName = messages
                .find(m => m.role === 'assistant')?.tool_calls?.[0]?.function?.name ?? '工具';
            return {
                content: `（mock 总结）我执行了 ${toolName}，结果是：${toolMsg.content}`
            };
        }

        // 兜底
        return {
            content: '我是 mock Agent，只能演示总览查询。试试问"查看总览"。'
        };
    };
}