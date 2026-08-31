import { Order, OrderStatus, OrderItem, Product } from "@/business/types.js";
import { seedProducts } from "@/business/seed.js";
import pool from '@/db.js';

// 总览
export async function overview() {
    // 各状态订单数：GROUP BY 聚合，让数据库数数（只出现有单的状态，先预填 0）
    const [rows] = await pool.query('SELECT status, COUNT(*) AS cnt FROM orders GROUP BY status');
    const byStatus: Record<OrderStatus, number> = {
        'pending': 0,
        'processing': 0,
        'completed': 0,
        'cancelled': 0,
    };
    for (const r of rows as any[]) byStatus[r.status as OrderStatus] = r.cnt;
    const totalOrders = Object.values(byStatus).reduce((a, b) => a + b, 0);

    // 低库存：条件直接放 SQL，顺带消灭内存版"必须执行 overview 才能刷新"的老 bug
    const [lowRows] = await pool.query('SELECT * FROM products WHERE stock < restock_threshold');
    const lowStockProducts = (lowRows as any[]).map(mapRowToProduct);

    return {
        totalOrders,  // orders-订单总数
        byStatus,  // orders-各状态订单数
        lowStockProducts,  // product-库存不足的商品
    };
}

// 启动时幂等 seed：products 表空才写入（重跑安全，重复启动不重复插）
export async function seedProductsIfEmpty() {
    const [rows] = await pool.query('SELECT COUNT(*) AS cnt FROM products');
    if (((rows as any[])[0]?.cnt ?? 0) > 0) return;
    for (const p of seedProducts()) {
        await pool.query(
            'INSERT INTO products (id, name, category, price, stock, restock_threshold) VALUES (?, ?, ?, ?, ?, ?)',
            [p.id, p.name, p.category, p.price, p.stock, p.restockThreshold]
        );
    }
    console.log(`🌱 已写入 ${seedProducts().length} 件商品`);
}

// 数据库行 → Product 类型（snake_case → 驼峰）
function mapRowToProduct(row: any): Product {
    return {
        id: row.id,
        name: row.name,
        category: row.category,
        price: Number(row.price),          // DECIMAL 字符串 → number
        stock: row.stock,
        restockThreshold: row.restock_threshold,
    };
}

// 全部商品：模拟顾客下单前先"逛店"选品
export async function listProducts(): Promise<Product[]> {
    const [rows] = await pool.query('SELECT * FROM products ORDER BY id');
    return (rows as any[]).map(mapRowToProduct);
}

// #region 订单查询两大件

// 数据库映射为order
function mapRowToOrder(row: any): Order {
    return {
        id: row.id,
        customerName: row.customer_name,
        totalAmount: Number(row.total_amount),
        status: row.status,
        riskLevel: row.risk_level,
        createdAt: row.created_at.toISOString(),
        items: [],
    };
}

// BUG 解决 client-Agent控制台 中商品数为0的bug
export async function listOrders(status?: OrderStatus): Promise<Order[]> {
    // #region sql
    // 解决方法:分为两步,LEFT JOIN + JS Map
    // 1. LEFT JOIN通过平铺查询组合订单和订单中的商品明细
    const sql = status
        ? `SELECT o.id, o.customer_name, o.total_amount, o.status, o.risk_level, o.created_at,
                  oi.product_id, oi.name AS item_name, oi.qty, oi.price
           FROM orders o LEFT JOIN order_items oi ON oi.order_id = o.id
           WHERE o.status = ?
           ORDER BY o.created_at DESC`
        : `SELECT o.id, o.customer_name, o.total_amount, o.status, o.risk_level, o.created_at,
                  oi.product_id, oi.name AS item_name, oi.qty, oi.price
           FROM orders o LEFT JOIN order_items oi ON oi.order_id = o.id
           ORDER BY o.created_at DESC`;
    //#endregion

    // 2. JS Map合并属于同一个order的items到对应order
    // 1. + 2. 便可以保证order的商品数为items.length
    const [rows] = await pool.query(sql, status ? [status] : []);
    const orderMap = new Map<string, Order>();
    for (const r of rows as any[]) {
        let order = orderMap.get(r.id);
        if (!order) {
            order = mapRowToOrder(r);
            orderMap.set(r.id, order);
        }
        if (r.product_id) {
            order.items.push({
                productId: r.product_id,
                name: r.item_name,
                qty: r.qty,
                price: Number(r.price),
            });
        }
    }
    return [...orderMap.values()];
}

// 2.
export async function getOrder(orderId: string): Promise<Order | undefined> {
    const [rows] = await pool.query('SELECT * FROM orders WHERE id = ?', [orderId]);
    if ((rows as any[]).length === 0) return undefined;
    const order = mapRowToOrder((rows as any[])[0]);

    const [itemRows] = await pool.query('SELECT * FROM order_items WHERE order_id = ?', [orderId]);
    order.items = (itemRows as any[]).map(r => ({
        productId: r.product_id,
        name: r.name,
        qty: r.qty,
        price: Number(r.price),
    }));
    return order;
}
//#endregion

export async function createOrder(
    customerName: string,
    items: { productId: string; qty: number }[]
): Promise<{ ok: true; order: Order } | { ok: false; error: string }> {
    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();

        // 1. 确保所买物品存在 + 库存充足
        const orderItems: OrderItem[] = [];
        let totalAmount = 0;
        for (const item of items) {
            const [rows] = await conn.query(
                'SELECT id, name, price, stock FROM products WHERE id = ? FOR UPDATE',
                [item.productId]
            );
            const product = (rows as any[])[0];
            if (!product) { await conn.rollback(); return { ok: false, error: `商品不存在: ${item.productId}` }; }
            if (item.qty <= 0) { await conn.rollback(); return { ok: false, error: `购买数量必须大于 0: ${product.name}` }; }
            if (product.stock < item.qty) { await conn.rollback(); return { ok: false, error: `库存不足: ${product.name}（仅剩 ${product.stock} 件）` }; }

            orderItems.push({
                productId: product.id,
                name: product.name,
                qty: item.qty,
                price: Number(product.price),   // DECIMAL 读出是字符串，转 number
            });
            totalAmount += Number(product.price) * item.qty;
        }

        const [idRows] = await conn.query('SELECT MAX(CAST(SUBSTRING(id, 2) AS UNSIGNED)) AS maxNum FROM orders');
        const nextNum = ((idRows as any[])[0]?.maxNum ?? 0) + 1;
        const orderId = 'o' + nextNum;

        // 2. 扣库存
        for (const item of items) {
            await conn.query('UPDATE products SET stock = stock - ? WHERE id = ?', [item.qty, item.productId]);
        }

        // 3. 插入订单 + 订单项
        const order: Order = {
            id: orderId,
            customerName,
            items: orderItems,
            totalAmount,
            status: 'pending',
            riskLevel: totalAmount >= 5000 ? 'high' : totalAmount >= 1000 ? 'medium' : 'low',
            createdAt: new Date().toISOString(),
        };
        await conn.query(
            'INSERT INTO orders (id, customer_name, total_amount, status, risk_level, created_at) VALUES (?, ?, ?, ?, ?, ?)',
            [order.id, order.customerName, order.totalAmount, order.status, order.riskLevel, new Date()]
        );
        for (const item of orderItems) {
            await conn.query(
                'INSERT INTO order_items (order_id, product_id, name, qty, price) VALUES (?, ?, ?, ?, ?)',
                [order.id, item.productId, item.name, item.qty, item.price]
            );
        }

        await conn.commit();
        return { ok: true, order };
    } catch (e) {
        await conn.rollback();   // 出错：撤销一切
        throw e;
    } finally {
        conn.release();          // 归还连接
    }
}

// 更新订单状态
const NEXT_STATUS: Record<OrderStatus, OrderStatus[]> = {
    pending: ['processing', 'cancelled'],
    processing: ['completed', 'cancelled'],
    completed: [],
    cancelled: [],
};
export async function updateOrderStatus(
    orderId: string,
    nextStatus: OrderStatus
): Promise<{ ok: true; order: Order } | { ok: false; error: string }> {
    // 校验
    const order = await getOrder(orderId);
    if (!order) return { ok: false, error: '订单不存在' };
    if (!NEXT_STATUS[order.status].includes(nextStatus)) return { ok: false, error: `不允许从 ${order.status} 流转到 ${nextStatus}` };

    // 3. 如果目标是 'cancelled' → 退还库存（createOrder 扣库存的镜像操作）
    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();

        if (nextStatus === 'cancelled') {
            for (const item of order.items) {
                await conn.query('UPDATE products SET stock = stock + ? WHERE id = ?', [item.qty, item.productId]);
            }
        }

        await conn.query('UPDATE orders SET status = ? WHERE id = ?', [nextStatus, orderId]);
        order.status = nextStatus;
        await conn.commit();
    } catch (err) {
        await conn.rollback();
        throw err;
    } finally {
        conn.release();
    }

    return { ok: true, order };
}

// 处理订单
export async function processOrder(orderId: string) {
    const order = await getOrder(orderId);
    if (!order) return { ok: false, error: '该订单不存在' };
    if (order.status !== 'pending') return { ok: false, error: `当前订单的状态已为${order.status}，无法处理。` }

    const res1 = await updateOrderStatus(orderId, 'processing');
    if (!res1.ok) return res1;

    const lowStockProducts: Product[] = [];

    for (let item of order.items) {
        const [rows] = await pool.query('SELECT * FROM products WHERE id = ?', [item.productId]);
        const product = (rows as any[])[0];
        if (!product) return { ok: false, error: `未找到商品：${item.name}` }

        // 注意：SQL 行是 snake_case（restock_threshold），且要映射成 Product 类型再返回
        if (product.stock < product.restock_threshold) {
            lowStockProducts.push(mapRowToProduct(product));
        }
    }

    const res2 = await updateOrderStatus(orderId, 'completed');
    if (!res2.ok) return res2;

    if (lowStockProducts.length === 0) return res2;
    // 注意：order 是开头 getOrder 的旧快照（pending），必须用 res2.order（已 completed）
    return { ok: true, order: res2.order, lowStockWarnings: lowStockProducts }
}

// 补货
function isPositiveInteger(num: number): boolean {
    return /^[1-9]\d*$/.test(String(num));
}

export async function restockProduct(productId: string, qty: number) {
    if (!isPositiveInteger(qty)) return { ok: false, error: '补货数量应为正整数' };

    // 先 SELECT 校验存在（UPDATE 不存在的行也"成功"，不能靠它判断）
    const [rows] = await pool.query('SELECT * FROM products WHERE id = ?', [productId]);
    const product = (rows as any[])[0];
    if (!product) return { ok: false, error: '该商品不存在' };

    await pool.query('UPDATE products SET stock = stock + ? WHERE id = ?', [qty, productId]);

    // UPDATE 不返回新值：手动算（原库存 + qty）填进返回
    return { ok: true, product: { ...mapRowToProduct(product), stock: product.stock + qty } };
}

// TODO 调价，该功能和补货写法的逻辑十分类似，很容易写