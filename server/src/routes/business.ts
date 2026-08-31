import { Router } from "express";
import { overview, listOrders, getOrder, createOrder, updateOrderStatus } from "@/business/system.js";
import { OrderStatus } from "@/business/types.js";

const router = Router();

router.get('/overview', async (_req, res) => {
    const ov = await overview();
    res.status(200).json({ ok: true, data: ov });
});

router.get('/orders', async (req, res) => {
    const status = req.query.status as OrderStatus | undefined;
    const orders = await listOrders(status);
    res.status(200).json({ ok: true, data: orders });
});

router.get('/orders/:id', async (req, res) => {
    const data = await getOrder(req.params.id);
    if (!data) return res.status(404).json({ ok: false, error: '订单不存在' });
    res.status(200).json({ ok: true, data });
});

router.post("/orders", async (req, res) => {
    if (!req.body?.customerName) return res.status(400).json({ ok: false, error: '缺少 customerName' })

    const r = await createOrder(req.body.customerName, req.body.items);

    res.status(r.ok ? 201 : 400).json(r);
});

router.patch('/orders/:id/status', async (req, res) => {
    const { status } = req.body as { status?: OrderStatus };
    if (!status) return res.status(400).json({ ok: false, error: '缺少 status' });
    const r = await updateOrderStatus(req.params.id, status);
    res.status(r.ok ? 200 : 400).json(r);
});

export default router;
