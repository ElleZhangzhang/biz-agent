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

async function get<T>(url: string): Promise<T> {
    const res = await fetch(url);
    const json = await res.json();
    if (!json.ok) throw new Error(json.error ?? '请求失败');
    return json.data as T;
}

export function getOverview(): Promise<Overview> {
    return get<Overview>('/api/business/overview');
}
