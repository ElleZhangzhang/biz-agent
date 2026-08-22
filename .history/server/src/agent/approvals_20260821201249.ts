export type ApprovalStatus = 'pending' | 'approved' | 'rejected';

export interface ApprovalRequest {
    id: string;
    toolName: string;                 // 人要看到：哪个工具想干嘛
    args: Record<string, unknown>;    // 参数快照
    status: ApprovalStatus;
    createdAt: string;
    decidedAt?: string;               // 处理时间
}

// 仓库
const requests: ApprovalRequest[] = [];
let nextId = 1;

export function createApproval(toolName: string, args: Record<string, unknown>): ApprovalRequest {
    const request: ApprovalRequest = {
        id: 'a' + nextId++,
        toolName,
        args,
        status: 'pending',
        createdAt: new Date().toISOString(),
    };
    requests.push(request);
    return request;
}

export function getApproval(id: string): ApprovalRequest | undefined {
    return requests.find(r => r.id === id);
}

export function listApprovals(): ApprovalRequest[] {
    return requests;
}