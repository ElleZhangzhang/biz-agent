export type ApprovalStatus = 'pending' | 'approved' | 'rejected';

export interface ApprovalRequest {
    id: string;
    toolName: string;                      // 人要看到：哪个工具想干嘛
    args: Record<string, unknown>;         // 参数快照
    status: ApprovalStatus;
    createdAt: string;
    decidedAt?: string;                    // 处理时间
}