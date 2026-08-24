import { useEffect, useState } from 'react';
import { Alert, Card, Col, Empty, List, Row, Spin, Statistic, Tag } from 'antd';
import { getOverview, type OrderStatus, type Overview } from '@/api/business';

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
}

useEffect(() => {
    getOverview()
        .then((data: Overview) => setData(data))
        .catch((e: Error) => setError(e.message));
}, []);

if (error) return <Alert type="error" message={`加载失败：${error}`} />;
if (!data) return <Spin style={{ display: 'block', margin: '40px auto' }} />;