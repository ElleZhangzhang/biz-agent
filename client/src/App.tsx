import type { ReactNode } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import Home from '@/pages/Home';
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import MainLayout from '@/components/MainLayout';
import OverviewPage from '@/pages/OverviewPage';
import OrdersPage from '@/pages/OrdersPage';
import { useAuthStore } from '@/stores/authStore';

// 路由守卫：没登录一律踢回登录页
function RequireAuth({ children }: { children: ReactNode }) {
    const token = useAuthStore((s) => s.token);
    return token ? children : <Navigate to="/login" replace />;
}

function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                {/* 登录后的主框架，下面挂两个页面 */}
                <Route path="/app" element={<RequireAuth><MainLayout /></RequireAuth>}>
                    <Route index element={<Navigate to="/app/overview" replace />} />
                    <Route path="overview" element={<OverviewPage />} />
                    <Route path="orders" element={<OrdersPage />} />
                </Route>
                {/* 兜底：未知路径回首页 */}
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </BrowserRouter>
    );
}

export default App;
