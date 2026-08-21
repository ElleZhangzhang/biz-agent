// 商品信息
export interface Product {
    id: string,
    name: string,
    category: string,
    price: number,
    stock: number,
    restockThreshold: number
};

// 订单状态
export type OrderStatus = 'pending' | 'processing' | 'shipped' | 'completed' | 'cancelled';

// 风险等级
export type RiskLevel = 'low' | 'medium' | 'high';

// 订单内的商品信息
export interface OrderItem {
    productId: string;
    name: string;
    qty: number;
    price: number; // 下单时的价格快照
}

// 订单信息
export interface Order {
    id: string;
    customerName: string;
    items: OrderItem[];
    totalAmount: number;
    status: OrderStatus;
    riskLevel: RiskLevel;
    note?: string;
    createdAt: string;
}