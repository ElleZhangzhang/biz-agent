import { Spin, Alert, Table } from 'antd';
import { useState } from 'react';
import { type Order } from '@/api/business'

function OrderTable() {
    const [data, setData] = useState<Order>(null);
    const [error, setError] = useState('');

    return (

    )
}
export default OrderTable;