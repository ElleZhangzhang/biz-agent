import OpenAI from "openai";
import type { ChatCompletionMessageParam } from "openai/resources/chat/completions/completions.js";
import { Decide } from "@/agent/agentLoop.js";
import { TOOLS } from "@/agent/tools.js";

export function createLLMDecide(client: OpenAI, model: string): Decide {
    return async (messages, onText) => {
        // 流式请求：模型每生成一段，SDK 的 stream 就吐一片 chunk
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
            stream: true,          // ★ 关键：开启流式
        });

        // 流式响应是"碎片"，要自己攒回完整结构，不能再等整包返回
        let content = '';
        // tool_calls 的碎片按 index 归位：id/name 只出现在第一片，arguments 会被拆成很多小片，只能拼
        const toolCalls: { id: string; name: string; arguments: string }[] = [];

        for await (const chunk of stream) {
            const delta = chunk.choices[0]?.delta;
            if (!delta) continue;

            // 内容文字：一边转发给前端打字机，一边自己攒全量
            if (delta.content) {
                content += delta.content;
                onText(delta.content);
            }

            // 工具调用碎片：只攒不转发，等流结束后统一二选一
            for (const piece of delta.tool_calls ?? []) {
                const slot = (toolCalls[piece.index] ??= { id: '', name: '', arguments: '' });
                if (piece.id) slot.id = piece.id;
                if (piece.function?.name) slot.name = piece.function.name;
                if (piece.function?.arguments) slot.arguments += piece.function.arguments;
            }
        }

        // 攒齐后，和原来的逻辑一样二选一
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