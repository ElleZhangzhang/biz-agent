import { Router } from "express";
import { listApprovals, decideApproval } from '@/agent/approvals.js';

const router = Router();

router.get('/', (req, res) => {
    const data = listApprovals();
    res.status(200).json({ ok: true, data });
})

router.post('/:id/decide', (req, res) => {
    const data = decideApproval(req.params.id, req.query.decide);
})

export default router;