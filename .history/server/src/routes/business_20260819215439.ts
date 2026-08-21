import { Router } from "express";
import { overview, listOrders, getOrder, createOrder, updateOrderStatus } from "@/business/system.js";

const router = Router();
// ...5 个路由...

router.post("/orders", (req, res) => {
    const r = createOrder(req.body.customerName, req.body.items);
    // ok 是翻译官：成功 201，失败 400，JSON 原样透传
    res.status(r.ok ? 201 : 400).json(r);
});

export default router;