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