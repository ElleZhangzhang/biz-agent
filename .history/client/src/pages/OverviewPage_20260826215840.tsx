import { Card, Tabs } from 'antd';
import OverviewPanel from '@/components/OverviewPanel';
import OrderTable from '@/components/OrderTable';
import AgentConsole from '@/components/AgentConsole';

// 「业务总览」视图：左板块（2/3）顶部选择栏切换两个子视图，右板块（1/3）常驻 Agent 控制台
// 两个板块高度 = 视口剩余空间（MainLayout 已固定 calc(100vh - 64px)），内容各自内部滚动
function OverviewPage() {
    return (
        <div style={{ height: '100%', maxWidth: 1200, margin: '0 auto', display: 'flex', gap: 16 }}>
            {/* 左板块 2/3：选择栏在顶部，业务总览 / 订单列表 二选一 */}
            <div className="overview-tabs" style={{ flex: 3, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
                <Tabs
                    style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}
                    items={[
                        {
                            key: 'overview',
                            label: '业务总览',
                            children: (
                                <div style={{ height: '100%', overflowY: 'auto' }}>
                                    <OverviewPanel />
                                </div>
                            ),
                        },
                        {
                            key: 'orders',
                            label: '订单列表',
                            children: (
                                <div style={{ height: '100%', overflowY: 'auto' }}>
                                    <OrderTable />
                                </div>
                            ),
                        },
                    ]}
                />
            </div>
            {/* 右板块 1/3：Agent 控制台常驻，发送框固定在底部 */}
            <div style={{ flex: 2, minWidth: 0, height: '100%' }}>
                <Card
                    title="Agent 控制台"
                    style={{ height: '100%', display: 'flex', flexDirection: 'column' }}
                    styles={{ body: { flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' } }}
                >
                    <AgentConsole />
                </Card>
            </div>
        </div>
    );
}

export default OverviewPage;
