import { Router } from "express";
import { listApprovals, decideApproval } from '@/agent/approvals.js';
import { ApprovalDecision } from '@/agent/approvals.js'

const router = Router();

router.get('/', (req, res) => {
    const data = listApprovals();
    res.status(200).json({ ok: true, data });
})

router.post('/:id/decide', (req, res) => {
    const { decision } = req.body as { dicision?: ApprovalDecision };
    const data = decideApproval(req.params.id, decision);
    if (data.ok) {
        res.status(200).json({ ok: true, data });
    }
    res.status(400).json({ ok: false, error: '该次审批不合理' });
})

export default router;