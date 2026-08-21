import { Router } from "express";
import OpenAI from "openai";
import { runAgent } from "@/agent/agentLoop.js";
import { createLLMDecide } from "@/agent/llmAgent.js";
import { createMockDecide } from "@/agent/mockAgent.js";

const router = Router();

const client = new OpenAI({
    baseURL: process.env.LLM_BASE_URL ?? 'https://api.deepseek.com',
    apiKey: process.env.LLM_API_KEY,
});

// 有 key 用真大脑，没 key 用 mock —— 一个接口，两种大脑无缝切换
const decide = process.env.LLM_API_KEY
    ? createLLMDecide(client, process.env.LLM_MODEL ?? 'deepseek-chat')
    : createMockDecide();

router.post('/run', async (req, res) => {
    const prompt = req.body?.prompt;
    if (!prompt) return res.status(400).json({ ok: false, error: '缺少 prompt' });

    try {
        const answer = await runAgent(prompt, decide);
        res.json({ ok: true, data: { answer } });
    } catch (err) {
        console.error('Agent 执行出错', err);
        res.status(500).json({ ok: false, error: 'Agent 执行出错，请稍后再试' });
    }
});

export default router;
