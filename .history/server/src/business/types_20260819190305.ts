export interface Product {
    id: string,
    name: string,
    category: string,
    price: number,
    stock: number,
    restockThreshold: number
};

export type OrderStatus = 'pending' | 'processing' | 'shipped' | 'completed' | 'cancelled';

export type RiskLevel = 'low' | 'medium' | 'high';