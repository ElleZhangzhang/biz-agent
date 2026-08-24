export type AgentEvent =
    | { type: 'tool_call'; name: string; arguments: string }
    | { type: 'tool_result'; name: string; result: unknown }
    | { type: 'approval_required'; approvalId: string; toolName: string; args: Record<string, unknown> }
    | { type: 'done'; content: string }
    | { type: 'error'; error: string };