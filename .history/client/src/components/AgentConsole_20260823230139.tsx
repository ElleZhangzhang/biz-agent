type ConsoleMsg =
    | { kind: 'user'; text: string }
    | { kind: 'answer'; text: string }
    | { kind: 'tool_call'; name: string; arguments: string }
    | { kind: 'tool_result'; name: string; result: unknown }
    | { kind: 'approval_required'; approvalId: string; toolName: string; args: Record<string, unknown> }
    | { kind: 'error'; text: string };