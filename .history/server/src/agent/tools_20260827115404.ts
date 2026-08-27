import { overview, getOrder, updateOrderStatus, processOrder, restockProduct } from "@/business/system.js";

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
        description: '获取业务总览：订单总数、各状态订单数、低库存商品。不需要人工审批',
        parameters: {
            type: 'object',
            properties: {},
            required: [],
        },
        execute: () => overview(),
    },
    {
        name: 'get_order',
        description: '按订单 ID 查询单个订单详情，当用户询问某笔具体订单时使用。不需要人工审批',
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
        requiresApproval: true, // 纵深防御——闸门兜底
        execute: (args) => updateOrderStatus(args.orderId, 'cancelled'),
    },
    {
        name: 'process_order',
        description: '帮用户处理一笔订单，用于完成订单处理过程、修改订单状态，不需要人工审批。',
        parameters: {
            type: 'object',
            properties: {
                orderId: {
                    type: 'string',
                    description: '商品 ID'
                }
            },
            required: ['orderId'],
        },
        execute: (args) => processOrder(args.orderId),
    },
    {
        name: 'restock',
        description: '补货，增加库存中某件商品的数量。不需要人工审批',
        parameters: {
            type: 'object',
            properties: {
                productId: {
                    type: 'string',
                    description: '商品 ID'
                },
                qty: {
                    type: 'number',
                    description: '补货数量'
                }
            },
            required: ['productId', 'qty'],
        },
        execute: (args) => restockProduct(args.productId, args.qty),
    },
];
