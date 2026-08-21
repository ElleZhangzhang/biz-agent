import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // 前端 /api 请求转发到后端，避免开发期跨域
      '/api': 'http://localhost:3001'
    }
  },
  resolve: {
    alias: {
      // 将 '@' 映射到项目根目录下的 src 文件夹
      '@': path.resolve(__dirname, './src'),
    },
  },
})
