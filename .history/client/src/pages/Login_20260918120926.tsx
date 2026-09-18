import { useActionState } from 'react';
import { Button, Card, Input, Typography } from 'antd';
import { Link, useNavigate } from 'react-router-dom';
import { login } from '@/api/auth';
import { useAuthStore } from '@/stores/authStore';

function Login() {
    const navigate = useNavigate();
    const loginStore = useAuthStore(s => s.login);

    const [state, formAction, isPending] = useActionState(
        async (prevState, formData: FormData) => {
            // 记得 String() 包一层 + trim()，因为可能返回 null
            const username = String(formData.get('username')).trim();
            const password = String(formData.get('password')).trim();

            if (!username || !password) return { ...prevState, error: '请输入用户名和密码' }

            try {
                await login(username, password);
                return { error: null };
            } catch (e) {
                return { error: e instanceof Error ? e.message : '登录失败' };
            }
        },
        { error: null },   // 初始 state：还没提交过，无错误
    );
    return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
            <Card style={{ width: 360 }}>
                <Typography.Title level={4}>登录</Typography.Title>
                <form action={formAction} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <div>
                        <div style={{ marginBottom: 4 }}>用户名</div>
                        <Input name="username" placeholder="用户名" style={{ width: '100%' }} />
                    </div>
                    <div>
                        <div style={{ marginBottom: 4 }}>密码</div>
                        <Input.Password name="password" placeholder="密码" style={{ width: '100%' }} />
                    </div>
                    {state.error && <Typography.Text type='danger' ></Typography.Text>}
                    <Button type="primary" htmlType="submit" block loading={isPending}>登录</Button>
                    <div style={{ textAlign: 'center' }}>
                        还没有账号？<Link to="/register">去注册</Link>
                    </div>
                </form>
            </Card>
        </div>
    );
}

export default Login;
