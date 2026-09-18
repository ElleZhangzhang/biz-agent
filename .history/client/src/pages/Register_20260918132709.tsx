import { useActionState } from 'react';
import { Button, Card, Input, Typography, message } from 'antd';
import { Link, useNavigate } from 'react-router-dom';
import { register } from '@/api/auth';

function Register() {
    const navigate = useNavigate();

    const [state, formAction, isPending] = useActionState(
        async (prevState: object, formData: FormData) => {
            const username = String(formData.get('username') ?? '').trim();
            const password = String(formData.get('password') ?? '');

            if (!username || !password) return { ...prevState, error: '请输入用户名和密码' }

            try {
                await register(username, password);
                message.success('注册成功，请登录');
                navigate('/login');
                return { error: null };
            } catch (e) {
                return { error: e instanceof Error ? e.message : '注册失败' };
            }
        },
        { error: null },   // 初始 state：还没提交过，无错误
    );

    return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
            <Card style={{ width: 360 }}>
                <Typography.Title level={4}>注册</Typography.Title>
                <form action={formAction} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <div>
                        <div style={{ marginBottom: 4 }}>用户名</div>
                        <Input name="username" placeholder="用户名" style={{ width: '100%' }} />
                    </div>
                    <div>
                        <div style={{ marginBottom: 4 }}>密码</div>
                        <Input.Password name="password" placeholder="密码" style={{ width: '100%' }} />
                    </div>
                    {state.error && <Typography.Text type="danger">{state.error}</Typography.Text>}
                    <Button type="primary" htmlType="submit" block loading={isPending}>注册</Button>
                    <div style={{ textAlign: 'center' }}>
                        已有账号？<Link to="/login">去登录</Link>
                    </div>
                </form>
            </Card>
        </div>
    );
}

export default Register;
