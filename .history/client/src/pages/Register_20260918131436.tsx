import { useActionState, useState } from 'react';
import { Button, Card, Form, Input, Typography, message } from 'antd';
import { Link, useNavigate } from 'react-router-dom';
import { register } from '@/api/auth';

function Register() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);

    async function handleFinish({ username, password }: { username: string; password: string }) {
        setLoading(true);
        try {
            await register(username, password);
            message.success('注册成功，请登录');
            navigate('/login');
        } catch (e) {
            message.error(e instanceof Error ? e.message : String(e));
        } finally {
            setLoading(false);
        }
    }

    const [state, formAction, isPending] = useActionState(
        async () => {

        },
        { error: null }
    )

    return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
            <Card style={{ width: 360 }}>
                <Typography.Title level={4}>注册</Typography.Title>
                <Form onFinish={handleFinish} layout="vertical">
                    <Form.Item name="username" label="用户名" rules={[{ required: true, message: '请输入用户名' }]}>
                        <Input placeholder="用户名" />
                    </Form.Item>
                    <Form.Item name="password" label="密码" rules={[{ required: true, message: '请输入密码' }]}>
                        <Input.Password placeholder="密码" />
                    </Form.Item>
                    <Button type="primary" htmlType="submit" block loading={loading}>注册</Button>
                    <div style={{ marginTop: 12, textAlign: 'center' }}>
                        已有账号？<Link to="/login">去登录</Link>
                    </div>
                </Form>
                <Form action={formAction}>

                </Form>
            </Card>
        </div>
    );
}

export default Register;
