import { Activity, useEffect } from 'react';
import { Button, Layout, Menu, Typography } from 'antd';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { me } from '@/api/auth';
import OverviewPage from '@/pages/OverviewPage';
import OrdersPage from '@/pages/OrdersPage';

// 登录后的主框架：顶部栏（用户名 + 退出）+ 左侧栏（两个菜单项）+ 内容区
function MainLayout() {
    const navigate = useNavigate();
    const location = useLocation();
    const { username, logout } = useAuthStore();

    useEffect(() => {
        me().catch(() => { });
    }, []);

    const onOrders = location.pathname.startsWith('/app/orders');

    return (
        <Layout style={{ minHeight: '100vh' }}>
            <Layout.Header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography.Text style={{ color: '#fff', fontSize: 16 }}>biz-agent</Typography.Text>
                <span style={{ color: '#fff' }}>
                    {username}
                    <Button
                        size="small"
                        style={{ marginLeft: 12 }}
                        onClick={() => { logout(); navigate('/login'); }}
                    >
                        退出
                    </Button>
                </span>
            </Layout.Header>
            <Layout>
                <Layout.Sider width={200} theme="light">
                    <Menu
                        mode="inline"
                        selectedKeys={[location.pathname]}
                        items={[
                            { key: '/app/overview', label: <Link to="/app/overview">Agent控制台</Link> },
                            { key: '/app/orders', label: <Link to="/app/orders">顾客订单</Link> },
                        ]}
                    />
                </Layout.Sider>
                {/* 内容区高度固定 = 视口剩余空间（Header 64px），页面内部各自滚动 */}
                <Layout.Content style={{ padding: 24, height: 'calc(100vh - 64px)', overflow: 'auto' }}>
                    <Activity mode={onOrders ? 'hidden' : 'visible'}>
                        <OverviewPage />
                    </Activity>
                    <Activity mode={onOrders ? 'visible' : 'hidden'}>
                        <OrdersPage />
                    </Activity>
                </Layout.Content>
            </Layout>
        </Layout>
    );
}

export default MainLayout;
