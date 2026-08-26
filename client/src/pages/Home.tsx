import { Button, Card, Space, Typography } from 'antd';
import { Link } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';

function Home() {
    const username = useAuthStore((s) => s.username);

    return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
            <Card style={{ width: 420, textAlign: 'center' }}>
                <Typography.Title level={3}>biz-agent 业务运营系统</Typography.Title>
                {username ? (
                    <Space>
                        <span>你好，{username}</span>
                        <Button type="primary"><Link to="/app/overview">进入系统</Link></Button>
                    </Space>
                ) : (
                    <Space>
                        <Button type="primary"><Link to="/login">登录</Link></Button>
                        <Button><Link to="/register">注册</Link></Button>
                    </Space>
                )}
            </Card>
        </div>
    );
}

export default Home;
