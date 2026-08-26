import { Router } from "express";
import OpenAI from "openai";
import { runAgent } from "@/agent/agentLoop.js";
// import { createLLMDecide } from "@/agent/llmAgent.js";
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

    try {
        // onEvent 接到 SSE 帧：每广播一次，就写一帧
        const answer = await runAgent(prompt, decide, (event) => {
            res.write(`data: ${JSON.stringify(event)}\n\n`);
        });
        // 收尾：done 帧带最终答案，然后关连接
        res.write(`data: ${JSON.stringify({
            type: 'done',
            content: answer
        })}\n\n`);
        res.end();
    } catch (err) {
        // 异常也按 SSE 帧发，前端能统一解析
        res.write(`data: ${JSON.stringify({ type: 'error', error: 'Agent 执行出错' })}\n\n`);
        res.end();
    }
});

export default router;
