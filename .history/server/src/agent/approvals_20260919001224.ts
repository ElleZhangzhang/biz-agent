import pool from '@/db.js';

export type ApprovalDecision = 'approved' | 'rejected';
export type ApprovalStatus = 'pending' | ApprovalDecision;

export interface ApprovalRequest {
    id: string;
    toolName: string;                 // 人要看到：哪个工具想干嘛
    args: Record<string, unknown>;    // 参数快照
    status: ApprovalStatus;
    createdAt: string;
    decidedAt?: string;               // 处理时间
}

// 数据库行 → 接口形状（action → toolName，params → args，resolved_at → decidedAt）
function mapRowToApproval(row: any): ApprovalRequest {
    return {
        id: row.id,
        toolName: row.action,
        args: row.params,
        status: row.status,
        createdAt: row.created_at instanceof Date ? row.created_at.toISOString() : row.created_at,
        ...(row.resolved_at ? { decidedAt: row.resolved_at instanceof Date ? row.resolved_at.toISOString() : row.resolved_at } : {}),
    };
}

// #region 仓库（落库）
export async function createApproval(toolName: string, args: Record<string, unknown>): Promise<ApprovalRequest> {
    // 审批 id：'a' + 现有最大数字 + 1（和订单 id 同一套路）
    const [idRows] = await pool.query('SELECT MAX(CAST(SUBSTRING(id, 2) AS UNSIGNED)) AS maxNum FROM approvals');
    const id = 'a' + (((idRows as any[])[0]?.maxNum ?? 0) + 1);

    const request: ApprovalRequest = {
        id,
        toolName,
        args,
        status: 'pending',
        createdAt: new Date().toISOString(),
    };
    await pool.query(
        'INSERT INTO approvals (id, action, description, requester, params, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [id, toolName, null, null, JSON.stringify(args), 'pending', new Date()]
    );
    return request;
}

export async function getApproval(id: string): Promise<ApprovalRequest | undefined> {
    const [rows] = await pool.query('SELECT * FROM approvals WHERE id = ?', [id]);
    const row = (rows as any[])[0];
    return row ? mapRowToApproval(row) : undefined;
}

export async function listApprovals(): Promise<ApprovalRequest[]> {
    const [rows] = await pool.query('SELECT * FROM approvals ORDER BY created_at DESC');
    return (rows as any[]).map(mapRowToApproval);
}
//#endregion

// 机关（必须留在内存）：数据库存不了 Promise——这是"挂起的审批在等回调"，
// 跨 HTTP 请求靠共享模块内存的 waiters Map 传递结果，重启后挂起审批丢失可接受
const waiters = new Map<string, (r: ApprovalRequest) => void>();


// LIGHT 人工审批机制：总的来讲是用 await Promise + map 实现的
// 1. requireApproval为true → 创建订单 → 人工审批
// 2. 调用人工审批函数，此函数会返回一个promise，并会将订单号放入map中，以订单号为key，以对应的resolve为value
// 3. 当用户提交 同意/拒绝 的选择，会调用resolve传出选择结果，再根据结果决定是否执行函数
export async function decideApproval(
    id: string,
    decision: ApprovalDecision
): Promise<{ ok: true; request: ApprovalRequest } | { ok: false; error: string }> {
    const request = await getApproval(id);
    if (!request) return { ok: false, error: `审批单不存在: ${id}` };
    if (request.status !== 'pending') return { ok: false, error: '该审批单已处理' };

    await pool.query(
        'UPDATE approvals SET status = ?, decided_by = ?, resolved_at = ? WHERE id = ?',
        [decision, 'user', new Date(), id]
    );
    request.status = decision;
    request.decidedAt = new Date().toISOString();

    waiters.get(id)?.(request);
    waiters.delete(id);

    return { ok: true, request };
}

// HACK 审批超时自动拒绝
export function waitForApproval(id: string): Promise<ApprovalRequest> {
    return new Promise((resolve) => { waiters.set(id, resolve); });
}
