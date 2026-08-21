import { Router } from "express";
import { overview, listOrders, getOrder, createOrder, updateOrderStatus } from "@/business/system.js";

const router = Router();
// ...5 个路由...

export default router;