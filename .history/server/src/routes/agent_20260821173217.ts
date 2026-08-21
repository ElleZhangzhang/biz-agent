const decide = process.env.LLM_API_KEY
    ? createLLMDecide(client, process.env.LLM_MODEL)
    : createMockDecide();