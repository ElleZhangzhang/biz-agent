import { useEffect, type ReactNode } from 'react';
import { BrowserRouter, Navigate, Route, Routes, useNavigate } from 'react-router-dom';
import { message } from 'antd';
import Home from '@/pages/Home';
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import MainLayout from '@/components/MainLayout';
import { useAuthStore } from '@/stores/authStore';
import { setUnauthorizedHandler } from '@/api/http';

// 用途：防止直接输入url访问主页面这种老六行为
function RequireAuth({ children }: { children: ReactNode }) {
    const token = useAuthStore((s) => s.token);
    return token ? children : <Navigate to="/login" replace />;
}

// 前端发送请求→后端鉴权→跳转回登录页
function UnauthorizedWatcher() {
    const navigate = useNavigate();
    useEffect(() => {
        setUnauthorizedHandler(() => {
            message.warning('登录已过期，请重新登录');
            navigate('/login', { replace: true });
        });
    }, [navigate]);
    return null;
}

function App() {
    return (
        <BrowserRouter>
            <UnauthorizedWatcher />
            <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                {/* 登录后的主框架。overview / orders 只声明路径、不挂 element：
                    两个页面由 MainLayout 用 <Activity> 保活渲染（不再是 Outlet 的"卸载式"切换） */}
                <Route path="/app" element={<RequireAuth><MainLayout /></RequireAuth>}>
                    <Route index element={<Navigate to="/app/overview" replace />} />
                    <Route path="overview" />
                    <Route path="orders" />
                </Route>
                {/* 兜底：未知路径回首页 */}
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </BrowserRouter>
    );
}

export default App;
