import { Router } from "express";
import { listApprovals } from '@/agent/approvals.js';

const router = Router();

router.get('/', (req, res) => {
    const data = listApprovals();
    res.status(200).json({ ok: true, data });
})

export default router;