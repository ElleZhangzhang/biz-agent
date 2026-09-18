import { useActionState } from 'react';
import { Button, Card, Input, Typography, message } from 'antd';
import { Link, useNavigate } from 'react-router-dom';
import { login } from '@/api/auth';
import { useAuthStore } from '@/stores/authStore';

function Login() {
    const [state, formAction, isPending] = useActionState(
        async (prevState, formData: FormData) => {
            // 记得 String() 包一层 + trim()，因为可能返回 null
            const username = formData.get('username');
            const password = formData.get('password');

            // —— 你填：空值校验，校验不过 return { error: '请输入用户名和密码' } ——
            if (!username || !password) return { error: '请输入用户名和密码' }

            try {
                // —— 你填：调 login()，成功就 loginStore + message.success + navigate ——
                // 成功后别忘了 return { error: null }
            } catch (e) {
                // —— 你填：错误信息装进 state 返回，不要 throw ——
            }
        },
        { error: null },   // 初始 state：还没提交过，无错误
    );
    return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
            <Card style={{ width: 360 }}>
                <Typography.Title level={4}>登录</Typography.Title>
                <form action={formAction}>
                    用户名：<input type="text" name="username" />
                    密码：<input type="password" name="password" />
                    <button type='submit'>登录</button>
                    <div style={{ marginTop: 12, textAlign: 'center' }}>
                        还没有账号？<Link to="/register">去注册</Link>
                    </div>
                </form>
            </Card>
        </div>
    );
}

export default Login;
