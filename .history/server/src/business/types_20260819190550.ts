// 商品信息
xport interface Product {
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

export interface OrderItem {
    productId: string;
    name: string;
    qty: number;
    price: number; // 下单时的价格快照
}