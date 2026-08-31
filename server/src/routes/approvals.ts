import { Router } from "express";
import { listApprovals, decideApproval, ApprovalDecision } from '@/agent/approvals.js';

const router = Router();

router.get('/', async (_req, res) => {
    const data = await listApprovals();
    res.status(200).json({ ok: true, data });
})

router.post('/:id/decide', async (req, res) => {
    const { decision } = req.body as { decision?: ApprovalDecision };
    if (decision !== 'approved' && decision !== 'rejected') {
        return res.status(400).json({ ok: false, error: 'decision 必须是 approved 或 rejected' });
    }

    const result = await decideApproval(req.params.id, decision);

    if (!result.ok) {
        return res.status(400).json(result);
    }

    res.status(200).json(result);
})

export default router;
