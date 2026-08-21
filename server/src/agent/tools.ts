import { overview, getOrder } from "@/business/system.js";

export interface Tool {
    name: string;
    description: string;
    parameters: {
        type: 'object';
        properties: Record<string, { type: string; description?: string }>;
        required: string[];
    };
    execute: (args: any) => unknown;
}

export const TOOLS: Tool[] = [
    {
        name: 'get_overview',
        description: '获取业务总览：订单总数、各状态订单数、低库存商品',
        parameters: {
            type: 'object',
            properties: {},
            required: [],
        },
        execute: () => overview(),
    },
    {
        name: 'get_order',
        description: '按订单 ID 查询单个订单详情，当用户询问某笔具体订单时使用',
        parameters: {
            type: 'object',
            properties: {
                orderId: {
                    type: 'string',
                    description: '订单 ID'
                },
            },
            required: ['orderId'],
        },
        execute: (args) => getOrder(args.orderId),
    },
];
