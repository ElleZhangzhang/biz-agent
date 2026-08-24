async function get<T>(url: string): Promise<T> {
    const res = await fetch(url);
    const json = await res.json();
    if (!json.ok) throw new Error(json.error ?? '请求失败');
    return json.data as T;
}

// Overview
export type OrderStatus = 'pending' | 'processing' | 'shipped' | 'completed' | 'cancelled';

export interface Overview {
    totalOrders: number;
    byStatus: Record<OrderStatus, number>;
    lowStockProducts: {
        id: string;
        name: string;
        category: string;
        price: number;
        stock: number;
        restockThreshold: number;
    }[];
}

export function getOverview(): Promise<Overview> {
    return get<Overview>('/api/business/overview');
}

export type RiskLevel = 'low' | 'medium' | 'high';

export interface OrderItem {
    productId: string;
    name: string;
    qty: number;
    price: number;   // 下单时的价格快照
}

export interface Order {
    id: string;
    customerName: string;
    items: OrderItem[];
    totalAmount: number;
    status: OrderStatus;
    riskLevel: RiskLevel;
    note?: string;          // 后端有可选字段，前端也要可空
    createdAt: string;      // ISO 字符串
}

export function getOrders(): Promise<Order[]> {
    return get<Order[]>('/api/business/orders');
}
