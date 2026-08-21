import { overview, getOrder } from "@/business/system.js";
export interface Tool {
    name: 'get_order';
    description: string;
    parameters: {
        type: 'object';
        properties: Record<string, { type: string; description?: string }>;
        required: string[];
    };
    execute: (args: any) => getOrder(args.orderId);
}