import OpenAI from "openai";
import type { ChatCompletionMessageParam, ChatCompletionMessageFunctionToolCall } from "openai/resources/chat/completions/completions.js";
import { Decide } from "@/agent/agentLoop.js";
import { TOOLS } from "@/agent/tools.js";

export function createLLMDecide(client: OpenAI, model: string): Decide {
    return async (messages, onText) => {
        const result = await client.chat.completions.create({
            model,
            messages: messages as ChatCompletionMessageParam[],   // 手写类型更宽松，只在边界层收窄
            tools: TOOLS.map(t => ({
                type: 'function',
                function: {
                    name: t.name,
                    description: t.description,
                    parameters: t.parameters
                },
            })),
            tool_choice: 'auto',   // 让模型自己决定调不调工具
            stream: true,
        });

        let content = '';
        const toolCalls: { id: string; name: string; arguments: string }[] = [];
        const msg = result.choices[0].message;

        // 分支一：ToolCalls
        if (msg.tool_calls?.length) {
            return {
                toolCalls: msg.tool_calls
                    .filter((tc): tc is ChatCompletionMessageFunctionToolCall => tc.type === 'function')
                    .map(tc => ({
                        id: tc.id,
                        name: tc.function.name,
                        arguments: tc.function.arguments,
                    })),
            };
        }

        // 分支二：content
        return {
            content: msg.content ?? ''
        };
    };
}