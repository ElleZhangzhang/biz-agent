export function seedProducts(): Product[] {
    return [
        {
            id: 'p1', name: '无线机械键盘', category: '数码', price: 299, stock: 120, restockThreshold: 30
        },
        {
            id: 'p2', name: '27寸4K显示器', category: '数码', price: 1899, stock: 40, restockThreshold: 10
        },
        {
            id: "p3", name: "人体工学椅", category: "家居", price: 1299, stock: 25, restockThreshold: 8,
        },
        {
            id: "p4", name: "桌面升降桌", category: "家居", price: 2199, stock: 12, restockThreshold: 5,
        },
        {
            id: "p5", name: "主动降噪耳机", category: "数码", price: 899, stock: 80, restockThreshold: 20,
        },
        {
            id: "p6", name: "便携咖啡机", category: "家电", price: 449, stock: 6, restockThreshold: 10,
        },
        {
            id: "p7", name: "空气净化器", category: "家电", price: 1599, stock: 18, restockThreshold: 6,
        },
        {
            id: "p8", name: "智能台灯", category: "家居", price: 259, stock: 200, restockThreshold: 50,
        }
    ];
}
