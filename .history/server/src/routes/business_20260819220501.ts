import { Router } from "express";
import { overview, listOrders, getOrder, createOrder, updateOrderStatus } from "@/business/system.js";

const router = Router();
// ...5 个路由...

router.get('/overview', (req, res) => { });
router.get('/orders', (req, res) => { })
router.get('/orders/:id', (req, res) => { })

router.post("/orders", (req, res) => {
    if (!req.body?.customerName) return res.status(400).json({ ok: false, error: '缺少 customerName' })

    const r = createOrder(req.body.customerName, req.body.items);

    res.status(r.ok ? 201 : 400).json(r);
});

router.patch('/orders/:id/status', (req, res) => { })

export default router;