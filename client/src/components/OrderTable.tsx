import { Spin, Alert, Table, Tag, type TableColumnsType } from 'antd';
import { useEffect, useState } from 'react';
import {
    getOrders, STATUS_LABEL, RISK_LABEL,
    type Order, type OrderStatus, type RiskLevel,
} from '@/api/business';
import { subscribeSimEvents } from '@/api/simulator';

// 颜色也是"翻译"，跟文案一样用映射表，别写一长串三元
const STATUS_COLOR: Record<OrderStatus, string> = {
    pending: 'gold',
    processing: 'blue',
    completed: 'green',
    cancelled: 'red',
};

const RISK_COLOR: Record<RiskLevel, string> = {
    low: 'green',
    medium: 'orange',
    high: 'red',
};

function OrderTable() {
    const [data, setData] = useState<Order[] | null>(null);
    const [error, setError] = useState('');

    useEffect(() => {
        getOrders()
            .then((data) => setData(data))
            .catch((e: Error) => setError(e.message));
    }, []);

    // 新单到达（SSE 广播）→ 自动重新拉列表，演示时不用手动刷新（拒绝轮询）
    useEffect(() => {
        return subscribeSimEvents(() => {
            getOrders().then(setData).catch(() => { /* 拉取失败不打断现有列表 */ });
        });
    }, []);

    if (error) return <Alert type="error" message={`加载失败：${error}`} />;
    if (!data) return <Spin style={{ display: 'block', margin: '40px auto' }} />;

    const columns: TableColumnsType<Order> = [
        { title: '订单号', dataIndex: 'id', key: 'id' },
        { title: '客户', dataIndex: 'customerName', key: 'customerName' },
        {
            title: '金额',
            dataIndex: 'totalAmount',
            key: 'totalAmount',
            render: (_, record) => `¥${record.totalAmount.toFixed(2)}`,
        },
        {
            title: '商品数',
            dataIndex: 'items',
            key: 'items',
            render: (_, record) => `${record.items.length} 件`,
        },
        {
            title: '风险',
            dataIndex: 'riskLevel',
            key: 'riskLevel',
            render: (riskLevel: RiskLevel) => (
                <Tag color={RISK_COLOR[riskLevel]}>{RISK_LABEL[riskLevel]}</Tag>
            ),
        },
        {
            title: '状态',
            dataIndex: 'status',
            key: 'status',
            render: (status: OrderStatus) => (
                <Tag color={STATUS_COLOR[status]}>{STATUS_LABEL[status]}</Tag>
            ),
        },
        {
            title: '下单时间',
            dataIndex: 'createdAt',
            key: 'createdAt',
            render: (createdAt) => new Date(createdAt).toLocaleString('zh-CN'),
        },
    ];

    return <Table dataSource={data} columns={columns} rowKey="id" />;
}

export default OrderTable;
