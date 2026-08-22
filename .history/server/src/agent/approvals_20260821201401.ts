export type ApprovalStatus = 'pending' | 'approved' | 'rejected';

export interface ApprovalRequest {
    id: string;
    toolName: string;                 // 人要看到：哪个工具想干嘛
    args: Record<string, unknown>;    // 参数快照
    status: ApprovalStatus;
    createdAt: string;
    decidedAt?: string;               // 处理时间
}

// #region 仓库
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
//#endregion

// 机关
const waiters = new Map<string, (r: ApprovalRequest) => void>();

export function decideApproval(
    id: string,
    decision: ApprovalDecision
): { ok: true; request: ApprovalRequest } | { ok: false; error: string } {
    const request = getApproval(id);
    if (!request) return { ok: false, error: `审批单不存在: ${id}` };
    if (request.status !== 'pending') return { ok: false, error: '该审批单已处理' };

    request.status = decision;
    request.decidedAt = new Date().toISOString();

    // ★ 机关：处理完，通知等在门口的人
    waiters.get(id)?.(request);   // 找到等这张单的人，把结果塞给它
    waiters.delete(id);           // 通知完了，把留言板上号码擦掉

    return { ok: true, request };
}

export function waitForApproval(id: string): Promise<ApprovalRequest> {
    return new Promise((resolve) => { waiters.set(id, resolve); });
}
