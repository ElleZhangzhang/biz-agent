import { decideApproval, type ApprovalDecision } from "@/api/agent";
import { useState } from "react";
import { Card, Button, Tag } from 'antd';

function ApprovalCard({ approvalId, toolName, args, onError }: {
    approvalId: string;
    toolName: string;
    args: Record<string, unknown>;
    onError: (text: string) => void;
}) {
    const [phase, setPhase] = useState<'pending' | 'deciding' | 'approved' | 'rejected'>('pending');

    async function handleDecide(decision: ApprovalDecision) {
        setPhase('deciding');
        try {
            await decideApproval(approvalId, decision);
            setPhase(decision);
        } catch (e) {
            onError(e instanceof Error ? e.message : String(e));
            setPhase('pending');
        }
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