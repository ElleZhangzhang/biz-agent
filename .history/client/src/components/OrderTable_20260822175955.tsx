import { Spin, Alert, Table } from 'antd';
import { useEffect, useState } from 'react';
import { type Order, getOrders } from '@/api/business'

function OrderTable() {
    const [data, setData] = useState<Order[] | null>(null);
    const [error, setError] = useState('');

    useEffect(() => {
        getOrders()
            .then((data) => setData(data))
            .catch(error => setError(error));
    }, [])

    if (error) return <Alert type='error' message={= `加载失败：${error}`}></Alert>
    if (!data) return <Spin style={{ display: 'block', margin: '40px auto' }}></Spin>

    return (

    )
}
export default OrderTable;