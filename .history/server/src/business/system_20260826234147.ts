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
        'completed': 0,
        'cancelled': 0,
    }
    for (const o of orders) {
        byStatus[o.status]++;
    }

    // bug：必须执行overview才能刷新低于库存的商品
    const lowStockProducts = products.filter(p => p.stock < p.restockThreshold
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

    // 第一遍：校验 + 记账
    for (const item of items) {
        const product = products.find(p => p.id === item.productId);
        if (!product) return { ok: false, error: `商品不存在: ${item.productId}` };
        if (item.qty <= 0) return { ok: false, error: `购买数量必须大于 0: ${product.name}` };
        if (product.stock < item.qty) return { ok: false, error: `库存不足: ${product.name}（仅剩 ${product.stock} 件）` };

        orderItems.push({
            productId: product.id,
            name: product.name,
            qty: item.qty,
            price: product.price,
        });
        toDeduct.push({ product, qty: item.qty });
        totalAmount += product.price * item.qty;
    }

    // 第二遍：扣库存
    for (const d of toDeduct) d.product.stock -= d.qty;

    // 生成订单
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

// 更新订单状态
const NEXT_STATUS: Record<OrderStatus, OrderStatus[]> = {
    pending: ['processing', 'cancelled'],
    processing: ['completed', 'cancelled'],
    completed: [],
    cancelled: [],
};
export function updateOrderStatus(
    orderId: string,
    nextStatus: OrderStatus
): { ok: true; order: Order } | { ok: false; error: string } {
    // 校验
    const order = orders.find(o => o.id === orderId);
    if (!order) return { ok: false, error: '订单不存在' };
    if (!NEXT_STATUS[order.status].includes(nextStatus)) return { ok: false, error: `不允许从 ${order.status} 流转到 ${nextStatus}` };

    // 3. 如果目标是 'cancelled' → 退还库存（createOrder 扣库存的镜像操作）
    if (nextStatus === 'cancelled') {
        for (const item of order.items) {
            const product = products.find(p => p.id === item.productId);
            product!.stock += item.qty;
        }
    }

    order.status = nextStatus;
    return { ok: true, order };
}

// 处理订单
export function processOrder(orderId: string) {
    const order = orders.find(o => o.id === orderId);
    if (!order) return { ok: false, error: '该订单不存在' };

    const res1 = updateOrderStatus(orderId, 'processing');
    if (!res1.ok) return res1;

    const lowStockProducts: Product[] = [];
    order.items.forEach(item => {
        const product = products.find(p => p.name === item.name);
        if (!product) return { ok: false, error: `未找到商品：${item.name}` }

        if (product?.stock < product.restockThreshold) {
            lowStockProducts.push(product);
        }
    })

    for (let item of order.items) {
        const product = products.find(p => p.name === item.name);
        if (!product) return { ok: false, error: `未找到商品：${item.name}` }

        if (product?.stock < product.restockThreshold) {
            lowStockProducts.push(product);
        }
    }

    const res2 = updateOrderStatus(orderId, 'completed');
    if (!res2.ok) return res2;

    if (lowStockProducts.length === 0) return res2;
    return { ok: true, order, lowStockWarnings: lowStockProducts }
}