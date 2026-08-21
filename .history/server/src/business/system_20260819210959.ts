import { Order, OrderStatus, OrderItem, Product } from "@/business/types.js";
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

    let lowStockProducts = products.filter(p => p.stock < p.restockThreshold
    );

    return {
        totalOrders: orders.length,  // orders-订单总数
        byStatus,  // orders-5种状态各有多少单
        lowStockProducts,  // product-库存不足的商品
    };
}

// #region 订单查询两大件
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
    return orders.find(o => o.id === orderId);
}
//#endregion

// 创建订单
export function createOrder(
    customerName: string,
    items: { productId: string; qty: number }[]
): { ok: true; order: Order } | { ok: false; error: string } {
    const orderItems: OrderItem[] = [];
    const toDeduct: { product: Product; qty: number }[] = []; // 待扣库存的商品
    let totalAmount = 0;

    // 第一遍：只校验 + 记账，绝不碰状态
    for (const item of items) {
        const product = products.find(p => p.id === item.productId);
        if (!product) return { ok: false, error: `商品不存在: ${item.productId}` };
        if (item.qty <= 0) return { ok: false, error: `购买数量必须大于 0: ${product.name}` };
        if (product.stock < item.qty) return { ok: false, error: `库存不足: ${product.name}（仅剩 ${product.stock} 件）` };

        orderItems.push({
            productId: product.id,
            name: product.name,
            qty: item.qty,
            price: product.price, // 下单时的价格快照，以后改价不影响这笔订单
        });
        toDeduct.push({ product, qty: item.qty });
        totalAmount += product.price * item.qty;
    }

    // 第二遍：全部校验通过，才允许扣库存
    for (const d of toDeduct) d.product.stock -= d.qty;

    const order: Order = {
        id: 'o' + nextOrderId++,
        customerName,
        items: orderItems,
        totalAmount,
        status: 'pending',
        riskLevel: totalAmount >= 5000 ? 'high' : totalAmount >= 1000 ? 'medium' : 'low',
        createdAt: new Date().toISOString(),
    };
    orders.push(order);
    return { ok: true, order };
}