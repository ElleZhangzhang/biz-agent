import { Router } from "express";
import OpenAI from "openai";
import { AgentEvent, runAgent } from "@/agent/agentLoop.js";
import { createMockDecide } from "@/agent/mockAgent.js";
import { createLLMDecide } from '@/agent/llmAgent.js';

const router = Router();

const client = new OpenAI({
    baseURL: process.env.LLM_BASE_URL ?? 'https://open.bigmodel.cn/api/paas/v4',
    apiKey: process.env.LLM_API_KEY,
});

const decide = process.env.LLM_API_KEY
    ? createLLMDecide(client, process.env.LLM_MODEL ?? 'deepseek-chat')
    : createMockDecide();
// const decide = createMockDecide();

router.post('/run', async (req, res) => {
    const prompt = req.body?.prompt;
    if (!prompt) return res.status(400).json({ ok: false, error: '缺少 prompt' });

    // SSE 三件套 + 立刻推响应头
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    const send = (frame: AgentEvent) => res.write(`data: ${JSON.stringify(frame)}\n\n`)

    try {
        // loop过程
        const answer = await runAgent(prompt, decide, (event) => send(event)
        );
        // http:本轮结束
        send({
            type: 'done',
            content: answer
        });
        res.end();
        // BUG 所有都write完才res.end()
    } catch (err) {
        // http:出错
        send({ type: 'error', error: err instanceof Error ? err.message : 'Agent 执行出错' });
        res.end();
    }
});

export default router;
