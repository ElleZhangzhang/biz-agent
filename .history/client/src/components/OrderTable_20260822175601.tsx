import { Spin, Alert, Table } from 'antd';
import { useEffect, useState } from 'react';
import { type Order, getOrders } from '@/api/business'

function OrderTable() {
    const [data, setData] = useState<Order[] | null>(null);
    const [error, setError] = useState('');

    useEffect(() => {
        getOrders()
            .then((data) => setData(data))
    }, [])

    return (

    )
}
export default OrderTable;