import { createLLMDecide } from "@/agent/llmAgent.js";
import { createMockDecide } from "@/agent/mockAgent.js";
import { Router } from "express";


const decide = process.env.LLM_API_KEY
    ? createLLMDecide(client, process.env.LLM_MODEL)
    : createMockDecide();