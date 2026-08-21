import { Router } from "express";
import { overview, listOrders, getOrder, createOrder, updateOrderStatus } from "@/business/system.js";

const router = Router();
// ...5 个路由...

router.post("/orders", (req, res) => {
    const r = createOrder(req.body.customerName, req.body.items);

    res.status(r.ok ? 201 : 400).json(r);
});

export default router;