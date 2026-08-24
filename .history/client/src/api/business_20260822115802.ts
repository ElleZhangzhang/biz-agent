export type OrderStatus = 'pending' | 'processing' | 'shipped' | 'completed' | 'cancelled';

export interface Overview {
    totalOrders: number;
    byStatus: Record<OrderStatus, number>;
    lowStockProducts: {
        id: string; name: string; category: string; price: number;
        stock: number; restockThreshold: number;
    }[];
}