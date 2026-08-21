import { Order, OrderStatus } from "@/business/types.js";
import { seedProducts } from "@/business/seed.js";

const products = seedProducts();
const orders: Order[] = [];
let nextOrderId = 1;

// 总览购物车
export function overview() {
    const byStatus: Record<OrderStatus, number> = {
        'pending': 0,
        'processing': 0,
        'shipped': 0,
        'completed': 0,
        'cancelled': 0,
    }
    for (const o of orders) {
        byStatus[o.status]++;
    }

    let lowStockProducts = products.filter(p => {
        p.stock < p.restockThreshold
    });

    return {
        totalOrders: orders.length,  // orders-订单总数
        byStatus,  // orders-5种状态各有多少单
        lowStockProducts,  // product-库存不足的商品
    };
}

// 订单查询两大件
// 1.
export function listOrders(status?: OrderStatus) {
    // 不带 status：返回全部订单
    if (!status) return orders;

    // 带 status：只返回该状态的订单
    return orders.filter(o => o.status === status);
}

// 2.
export function getOrder(orderId: string) {
    // 找到返回该订单，找不到返回 undefined
    return orders.find(o => o.id === orderId)
}