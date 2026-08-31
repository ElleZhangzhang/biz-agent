import { Alert, Button, Card, Empty, List, Space, Tag, Typography } from 'antd';
import { useEffect, useState } from 'react';
import {
    getSimulatorStatus, getSimOrderHistory, startSimulator, stopSimulator, subscribeSimEvents,
    type SimulatorStatus, type SimEvent,
} from '@/api/simulator';
import { STATUS_LABEL, type Order } from '@/api/business';

// 实时流里的一条：下单成功 / 库存不足被拒
type FeedItem =
    | { kind: 'created'; at: string; order: Order }
    | { kind: 'rejected'; at: string; customerName: string; error: string };

// 传输层事件 → 展示层条目（历史拉取和实时订阅共用同一映射，别写两份）
function toFeedItem(event: SimEvent): FeedItem {
    return event.type === 'order_created'
        ? { kind: 'created', at: event.at, order: event.order }
        : { kind: 'rejected', at: event.at, customerName: event.customerName, error: event.error };
}

// 「顾客订单」页：模拟顾客开关 + 实时订单流（SSE 服务端推送，拒绝轮询）
function OrdersPage() {
    const [status, setStatus] = useState<SimulatorStatus | null>(null);
    const [feed, setFeed] = useState<FeedItem[]>([]);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');

    // 初次加载：拉当前状态 + 最近订单流历史（先有历史，实时流不用从 0 开始）
    useEffect(() => {
        getSimulatorStatus()
            .then(setStatus)
            .catch((e: Error) => setError(e.message));
        getSimOrderHistory()
            .then((events) => setFeed(events.map(toFeedItem)))
            .catch((e: Error) => setError(e.message));
    }, []);

    // 订阅 SSE：新单到达实时上屏（只留最近 50 条，别让页面无限长）
    useEffect(() => {
        return subscribeSimEvents((event) => {
            setStatus((s) => (s ? { ...s, orderCount: s.orderCount + 1 } : s));
            setFeed((f) => [toFeedItem(event), ...f].slice(0, 50));
        });
    }, []);

    async function toggle() {
        if (!status || busy) return;
        setBusy(true);
        try {
            setStatus(status.running ? await stopSimulator() : await startSimulator());
        } catch (e) {
            setError(e instanceof Error ? e.message : String(e));
        } finally {
            setBusy(false);
        }
    }

    return (
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* 模拟控制卡片 */}
            <Card title="模拟顾客控制台" size="small">
                <Space size="large">
                    <span>
                        状态：
                        <Tag color={status?.running ? 'green' : 'default'}>
                            {status?.running ? '营业中' : '已打烊'}
                        </Tag>
                    </span>
                    <span>已生成订单：{status?.orderCount ?? '…'}</span>
                    <Button
                        type={status?.running ? 'default' : 'primary'}
                        loading={busy}
                        disabled={!status}
                        onClick={toggle}
                    >
                        {status?.running ? '停止模拟' : '开始模拟'}
                    </Button>
                </Space>
                <Typography.Paragraph type="secondary" style={{ margin: '12px 0 0', fontSize: 12 }}>
                    模拟顾客每 1~120 秒随机来一位，随机挑 1~3 种商品下单（小概率买超库存被拒）；
                    下单走真实 createOrder 链路（校验 + 扣库存 + 落库），产生的订单 Agent 可以直接处理。
                </Typography.Paragraph>
            </Card>

            {/* 实时订单流 */}
            <Card
                title="实时订单流"
                size="small"
                styles={{ body: { height: 'calc(100vh - 320px)', overflowY: 'auto' } }}
            >
                {feed.length === 0
                    ? <Empty description="还没顾客来…点「开始模拟」开门营业" style={{ marginTop: 48 }} />
                    : <List size="small" dataSource={feed} renderItem={(item) => <FeedRow item={item} />} />}
            </Card>

            {error && <Alert type="error" message={error} closable onClose={() => setError('')} />}
        </div>
    );
}

// 一条实时记录
function FeedRow({ item }: { item: FeedItem }) {
    const at = new Date(item.at).toLocaleTimeString('zh-CN');

    if (item.kind === 'rejected') {
        return (
            <List.Item>
                <Space wrap>
                    <Tag color="red">拒单</Tag>
                    <span style={{ color: '#999' }}>{at}</span>
                    <span>{item.customerName}</span>
                    <span style={{ color: '#ff4d4f' }}>下单失败：{item.error}</span>
                </Space>
            </List.Item>
        );
    }

    const { order } = item;
    return (
        <List.Item>
            <Space wrap>
                <Tag color="green">新单</Tag>
                <span style={{ color: '#999' }}>{at}</span>
                <span>{order.customerName}</span>
                <span style={{ color: '#666' }}>
                    {order.items.map((i) => `${i.name}×${i.qty}`).join('、')}
                </span>
                <b>¥{order.totalAmount.toFixed(2)}</b>
                <Tag color="gold">{STATUS_LABEL[order.status]}</Tag>
            </Space>
        </List.Item>
    );
}

export default OrdersPage;
