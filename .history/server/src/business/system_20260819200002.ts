import { Order, OrderStatus } from "@/business/types.js";
import { seedProducts } from "@/business/seed.js";

const products = seedProducts();
const orders: Order[] = [];
let nextOrderId = 1;

export function overview() {
    const byStatus: Record<OrderStatus, number> = {
        'pending': 0
    }
    return {
        totalOrders: orders.length,          // 订单总数
        byStatus: byStatus,  // 5 种状态各有多少单
        lowStockProducts: Product[],  // 库存不足的商品
    };
}