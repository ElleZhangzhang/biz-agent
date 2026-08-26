import { useState } from 'react';
import { Button, Card, Form, Input, Typography, message } from 'antd';
import { Link, useNavigate } from 'react-router-dom';
import { login } from '@/api/auth';
import { useAuthStore } from '@/stores/authStore';

function Login() {
    const navigate = useNavigate();
    const loginStore = useAuthStore((s) => s.login);
    const [loading, setLoading] = useState(false);

    async function handleFinish({ username, password }: { username: string; password: string }) {
        setLoading(true);
        try {
            const result = await login(username, password);
            loginStore(result.username, result.token);   // 存 localStorage + 进 store
            message.success('登录成功');
            navigate('/app/overview');
        } catch (e) {
            message.error(e instanceof Error ? e.message : String(e));
        } finally {
            setLoading(false);
        }
    }

    return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
            <Card style={{ width: 360 }}>
                <Typography.Title level={4}>登录</Typography.Title>
                <Form onFinish={handleFinish} layout="vertical">
                    <Form.Item name="username" label="用户名" rules={[{ required: true, message: '请输入用户名' }]}>
                        <Input placeholder="用户名" />
                    </Form.Item>
                    <Form.Item name="password" label="密码" rules={[{ required: true, message: '请输入密码' }]}>
                        <Input.Password placeholder="密码" />
                    </Form.Item>
                    <Button type="primary" htmlType="submit" block loading={loading}>登录</Button>
                    <div style={{ marginTop: 12, textAlign: 'center' }}>
                        还没有账号？<Link to="/register">去注册</Link>
                    </div>
                </Form>
            </Card>
        </div>
    );
}

export default Login;
