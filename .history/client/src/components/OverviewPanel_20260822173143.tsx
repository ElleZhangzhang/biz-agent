import { useEffect, useState } from 'react';
import { Alert, Card, Col, Empty, List, Row, Spin, Statistic, Tag } from 'antd';
import { getOverview, type OrderStatus, type Overview } from '@/api/business';
import { STATUS_LABEL } from '@/api/business'

// 后端存英文枚举，前端负责翻译展示
const STATUS_LABEL: Record<OrderStatus, string> = {
    pending: '待处理',
    processing: '处理中',
    shipped: '已发货',
    completed: '已完成',
    cancelled: '已取消',
};

export default function OverviewPanel() {
    const [data, setData] = useState<Overview | null>(null);
    const [error, setError] = useState('');

    useEffect(() => {
        getOverview()
            .then((data: Overview) => setData(data))
            .catch((e: Error) => setError(e.message));
    }, []);

    if (error) return <Alert type="error" message={`加载失败：${error}`} />;
    if (!data) return <Spin style={{ display: 'block', margin: '40px auto' }} />;

    return (
        <Row gutter={[16, 16]}>
            {/* 订单总数 + 五种状态各几单 */}
            <Col span={8}>
                <Card><Statistic title="订单总数" value={data.totalOrders} /></Card>
            </Col>
            {(Object.keys(STATUS_LABEL) as OrderStatus[]).map((status) => (
                <Col span={8} key={status}>
                    <Card><Statistic title={STATUS_LABEL[status]} value={data.byStatus[status]} /></Card>
                </Col>
            ))}
            {/* 低库存商品 */}
            <Col span={24}>
                <Card title="低库存商品">
                    {data.lowStockProducts.length === 0 ? (
                        <Empty description="库存都充足" />
                    ) : (
                        <List
                            dataSource={data.lowStockProducts}
                            renderItem={(p) => (
                                <List.Item>
                                    <span>{p.name}</span>
                                    <Tag color="red">仅剩 {p.stock} 件（阈值 {p.restockThreshold}）</Tag>
                                </List.Item>
                            )}
                        />
                    )}
                </Card>
            </Col>
        </Row>
    );
}