import { Router } from "express";
import { overview, listOrders, getOrder, createOrder, updateOrderStatus } from "@/business/system.js";
import { OrderStatus } from "@/business/types.js";

const router = Router();
// ...5 个路由...

router.get('/overview', (req, res) => {
    const ov = overview();
    res.status(200).json({ ok: true, data: ov })
});

router.get('/orders', (req, res) => {
    const orders = listOrders(req.body.status);
    res.status(200).json({ ok: true, data: orders });
})
router.get('/orders/:id', (req, res) => { })

router.post("/orders", (req, res) => {
    if (!req.body?.customerName) return res.status(400).json({ ok: false, error: '缺少 customerName' })

    const r = createOrder(req.body.customerName, req.body.items);

    res.status(r.ok ? 201 : 400).json(r);
});

router.patch('/orders/:id/status', (req, res) => {
    const status: OrderStatus = req.query.status
    const result = updateOrderStatus(req.params.id, status);
    res.status
})

export default router;