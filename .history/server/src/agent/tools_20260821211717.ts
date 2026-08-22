import { overview, getOrder, updateOrderStatus } from "@/business/system.js";

export interface Tool {
    name: string;
    description: string;
    parameters: {
        type: 'object';
        properties: Record<string, { type: string; description?: string }>;
        required: string[];
    };
    requiresApproval?: boolean;
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
    {
        name: 'cancel_order',
        description: '取消一笔订单（仅 pending/processing 状态可取消，取消会退还库存）。这是危险操作，需要人工审批。',
        parameters: {
            type: 'object',
            properties: {
                orderId: {
                    type: 'string',
                    description: '订单 ID'
                }
            },
            required: ['orderId'],
        },
        requiresApproval: true,
        execute: (args) => updateOrderStatus(args.orderId, 'cancelled'),
    }
];
