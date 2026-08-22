import { Router } from "express";
import { listApprovals, decideApproval } from '@/agent/approvals.js';
import { ApprovalDecision } from '@/agent/approvals.js'

const router = Router();

router.get('/', (req, res) => {
    const data = listApprovals();
    res.status(200).json({ ok: true, data });
})

router.post('/:id/decide', (req, res) => {
    const { decision } = req.body as { decision?: ApprovalDecision };

    if (decision !== 'approved' && decision !== 'rejected') {
        return res.status(400).json({ ok: false, error: 'decision 必须是 approved 或 rejected' });
    }

    const data = decideApproval(req.params.id, decision);

    if (!data.ok) {
        return res.status(400).json({ ok: false, error: '该次审批不合理' });
    }
    res.status(200).json(data);
})

export default router;