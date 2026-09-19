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

router.post('/run', async (req, res) => {
    const prompt = req.body?.prompt;
    if (!prompt) return res.status(400).json({ ok: false, error: '缺少 prompt' });

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    // 客户端断开（用户点停止/关页面）后：不要再往已关闭的连接写帧，也别让循环继续跑
    let cancelled = false;
    res.on('close', () => { cancelled = true; });

    const send = (frame: AgentEvent) => {
        if (!cancelled) res.write(`data: ${JSON.stringify(frame)}\n\n`);
    }

    // 接下来是请求大模型，然后将结果发给前端
    try {
        // loop过程:answer_delta/tool_call/approval_required/tool_result
        const answer = await runAgent(prompt, decide, (event) => send(event), () => cancelled);

        // http:done
        send({
            type: 'done',
            content: answer
        });
        res.end();
        // BUG 所有都write完才res.end()
    } catch (err) {
        // http:error
        send({ type: 'error', error: err instanceof Error ? err.message : 'Agent 执行出错' });
        res.end();
    }
});

export default router;
