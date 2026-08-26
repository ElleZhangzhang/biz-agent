import { decideApproval, type ApprovalDecision } from "@/api/agent";
import { useState } from "react";

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
        }
    }
    return (
        <></>
    )
}
export default ApprovalCard;