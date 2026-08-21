import { overview } from "@/business/system.js";
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