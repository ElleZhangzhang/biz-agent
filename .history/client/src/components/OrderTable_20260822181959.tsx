import { Spin, Alert, Table, Tag } from 'antd';
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

    if (error) return <Alert type='error' message={`加载失败：${error}`}></Alert>
    if (!data) return <Spin style={{ display: 'block', margin: '40px auto' }}></Spin>

    const columns = [
        { title: '订单号', dataIndex: 'id', key: 'id' },
        { title: '客户', dataIndex: 'customerName', key: 'customerName' },
        {
            title: '金额', dataIndex: 'totalAmount', key: 'totalAmount',
            render: (totalAmount) => (
                
            )
        },
        {
            title: '商品数', dataIndex: 'items', key: 'items',
            render: (items) => {

            }
        },
        {
            title: '风险', dataIndex: 'riskLevel', key: 'riskLevel',
            render: (riskLevel) => (
                <Tag color={riskLevel ===='low'?'green': riskLevel=== 'medium' ? 'orange' : 'red'
}></Tag >
            )
        },
{ title: '状态', dataIndex: 'status', key: 'status' },
{ title: '下单时间', dataIndex: 'createdAt', key: 'createdAt' },
    ]

return (
    <Table dataSource={data} columns={columns} rowKey='id'>

    </Table>
)
}
export default OrderTable;