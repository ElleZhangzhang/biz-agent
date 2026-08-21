import { Order } from "@/business/types.js";
import { seedProducts } from "@/business/seed.js";

const products = seedProducts();
const orders: Order[] = [];
let nextOrderId = 1;

export function overview() {
    return {
        totalOrders: orders.length,          // 订单总数
        byStatus: Record<OrderStatus, number>,  // 5 种状态各有多少单
        lowStockProducts: Product[],  // 库存不足的商品
    };
}