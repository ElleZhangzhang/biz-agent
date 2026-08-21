import OpenAI from "openai";
import { Decide } from "@/agent/agentLoop.js";
import { TOOLS } from "@/agent/tools.js";

export function createLLMDecide(client: OpenAI, model: string): Decide {
    return async (messages) => {
        const result = await client.chat.completions.create({
            model,
            messages,        // 直接传！我们刚改的 message 形状和 OpenAI 兼容
            tools: TOOLS.map(t => ({
                type: 'function',
                function: {
                    name: t.name,
                    description: t.description,
                    parameters: t.parameters
                },
            })),
            tool_choice: 'auto',   // 让模型自己决定调不调工具
        });

        const msg = result.choices[0].message;

        // 分支一：模型想调工具
        if (msg.tool_calls?.length) {
            return {
                toolCalls: msg.tool_calls.map(tc => ({
                    id: tc.id,
                    name: tc.function.name,
                    arguments: tc.function.arguments,   // 已经是 JSON 字符串，直接用
                })),
            };
        }

        // 分支二：模型直接说了人话
        return {
            content: msg.content ?? ''
        };
    };
}