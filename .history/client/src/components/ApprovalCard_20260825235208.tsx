import { useState } from "react";

function ApprovalCard({ approvalId, toolName, args, onError }: {
    approvalId: string;
    toolName: string;
    args: Record<string, unknown>;
    onError: (text: string) => void;
}) {
    const [phase, setPhase] = useState<'pending' | 'deciding' | 'approved' | 'rejected'>('pending');
    return (
        <></>
    )
}
export default ApprovalCard;