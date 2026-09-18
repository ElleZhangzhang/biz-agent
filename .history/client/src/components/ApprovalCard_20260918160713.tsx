import { decideApproval, type ApprovalDecision } from "@/api/agent";
import { useState } from "react";
import { Card, Button, Tag } from 'antd';

function ApprovalCard({ approvalId, toolName, args, onError }: {
    approvalId: string;
    toolName: string;
    args: Record<string, unknown>;
    onError: (text: string) => void;
}) {
    const [result, setResult] = useState<'pending' | ApprovalDecision>('pending');   // 真实状态：请求成功后落定
    const [phase, addOptimistic] = useOptimistic(result, (_cur, next: ApprovalDecision) => next);  // 展示状态
    const [, startTransition] = useTransition();   // 提供"过渡期"：addOptimistic 的合法容器

    function handleDecide(decision: ApprovalDecision) {
        if (phase !== 'pending') return;
        startTransition(async () => {
            addOptimistic(decision);            // ① 立刻显示"已同意/已拒绝"
            try {
                await decideApproval(approvalId, decision);
                setResult(decision);            // ② 真实状态落定 → 乐观值无缝衔接，不会闪回
            } catch (e) {
                onError(e instanceof Error ? e.message : String(e));
                // ③ 不 setResult：transition 结束 → 自动回滚成 pending
            }
        });
    }
    return (
        <Card size="small" style={{ marginBottom: 8, borderColor: '#faad14' }}>
            ⏸ 需要人工审批 <Tag color="orange">{toolName}</Tag>
            <pre style={{ margin: '8px 0 0', fontSize: 12 }}>
                {JSON.stringify(args, null, 2)}
            </pre>
            <div style={{ marginTop: 8, display: 'flex', gap: 8 }}>
                <Button size="small" type="primary" disabled={phase !== 'pending'} onClick={() => handleDecide('approved')}>
                    同意
                </Button>
                <Button size="small" danger disabled={phase !== 'pending'} onClick={() => handleDecide('rejected')}>
                    拒绝
                </Button>
                {phase === 'approved' && <Tag color="green">已同意</Tag>}
                {phase === 'rejected' && <Tag color="red">已拒绝</Tag>}
            </div>
        </Card>
    )
}
export default ApprovalCard;