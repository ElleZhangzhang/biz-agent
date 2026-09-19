import OpenAI from "openai";
import type { ChatCompletionMessageParam } from "openai/resources/chat/completions/completions.js";
import { Decide } from "@/agent/agentLoop.js";
import { TOOLS } from "@/agent/tools.js";

export function createLLMDecide(client: OpenAI, model: string): Decide {
    return async (messages, onText) => {
        const stream = await client.chat.completions.create({
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

        for await (const chunk of stream) {
            const delta = chunk.choices[0]?.delta;
            if (!delta) continue;

            if (delta.content) {
                content += delta.content;
                onText(delta.content);
            }

            // 流式的工具调用是结构化的JSON，name一片，参数一片，所以需要用index进行合并。
            // 每个 delta.tool_calls 碎片都带有一个 index 索引，你需要用这个索引把属于同一个工具调用的碎片归拢到一起
            for (const piece of delta.tool_calls ?? []) {
                const slot = (toolCalls[piece.index] ??= { id: '', name: '', arguments: '' });
                if (piece.id) slot.id = piece.id;
                if (piece.function?.name) slot.name = piece.function.name;
                if (piece.function?.arguments) slot.arguments += piece.function.arguments;
            }
        }

        if (toolCalls.length) {
            return {
                toolCalls: toolCalls
                    .filter(tc => tc.name)   // 防模型只发了半截碎片
                    .map(tc => ({
                        id: tc.id,
                        name: tc.name,
                        arguments: tc.arguments,
                    })),
            };
        }

        return {
            content
        };
    };
}