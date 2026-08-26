import { create } from 'zustand';

// 会话持久化到 localStorage：刷新页面不丢，token 有效期 7 天由后端把关
const TOKEN_KEY = 'biz_token';
const USERNAME_KEY = 'biz_username';

interface AuthState {
    token: string | null;
    username: string | null;
    login: (username: string, token: string) => void;
    logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
    // 初始化时从 localStorage 恢复会话（刷新页面仍保持登录）
    token: localStorage.getItem(TOKEN_KEY),
    username: localStorage.getItem(USERNAME_KEY),
    login: (username, token) => {
        localStorage.setItem(TOKEN_KEY, token);
        localStorage.setItem(USERNAME_KEY, username);
        set({ token, username });
    },
    logout: () => {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USERNAME_KEY);
        set({ token: null, username: null });
    },
}));
