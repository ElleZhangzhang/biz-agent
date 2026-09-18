import { request } from '@/api/http';
import { useAuthStore } from '@/stores/authStore';
import type { Order } from '@/api/business';

// #region 模拟顾客控制
export interface SimulatorStatus {
    running: boolean;
    orderCount: number;
}

export function getSimulatorStatus() { return request<SimulatorStatus>('/api/simulator/status'); }
export function startSimulator() { return request<SimulatorStatus>('/api/simulator/start', { method: 'POST' }); }
export function stopSimulator() { return request<SimulatorStatus>('/api/simulator/stop', { method: 'POST' }); }
//#endregion

// 最近订单流历史（服务端内存缓冲）：页面打开先拉这个，实时流不用从 0 开始
export function getSimOrderHistory(): Promise<SimEvent[]> {
    return request<SimEvent[]>('/api/simulator/history');
}

// SSE 推送的事件（服务端广播）
export type SimEvent =
    | { type: 'order_created'; at: string; order: Order }
    | { type: 'order_rejected'; at: string; customerName: string; error: string };

// 订阅新单广播：页面挂载时调用，返回清理函数（卸载时 close 连接）
// 断线 EventSource 会自动重连，不用手动处理
export function subscribeSimEvents(onEvent: (event: SimEvent) => void): () => void {
    // 原生 EventSource 不能自定义请求头（这正是很多 AI 项目改用 fetch 读流的原因），
    // 所以 token 只能走 query 交给后端中间件——代价是它会出现在 URL/访问日志里
    const token = useAuthStore.getState().token ?? '';
    const es = new EventSource(`/api/simulator/events?token=${encodeURIComponent(token)}`);
    es.onmessage = (e) => {
        try {
            onEvent(JSON.parse(e.data) as SimEvent);
        } catch {
            // 坏帧直接忽略，别让一条脏数据炸掉整个页面
        }
    };
    return () => es.close();
}
