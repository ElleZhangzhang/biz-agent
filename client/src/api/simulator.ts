import type { Order } from '@/api/business';

// #region 模拟顾客控制
export interface SimulatorStatus {
    running: boolean;
    orderCount: number;
}

async function request(url: string, method: 'GET' | 'POST' = 'GET'): Promise<SimulatorStatus> {
    const res = await fetch(url, { method });
    const json = await res.json();
    if (!json.ok) throw new Error(json.error ?? '请求失败');
    return json.data as SimulatorStatus;
}

export function getSimulatorStatus() { return request('/api/simulator/status'); }
export function startSimulator() { return request('/api/simulator/start', 'POST'); }
export function stopSimulator() { return request('/api/simulator/stop', 'POST'); }
//#endregion

// 最近订单流历史（服务端内存缓冲）：页面打开先拉这个，实时流不用从 0 开始
export function getSimOrderHistory(): Promise<SimEvent[]> {
    return fetch('/api/simulator/history')
        .then((res) => res.json())
        .then((json) => {
            if (!json.ok) throw new Error(json.error ?? '获取订单流失败');
            return json.data as SimEvent[];
        });
}

// SSE 推送的事件（服务端广播）
export type SimEvent =
    | { type: 'order_created'; at: string; order: Order }
    | { type: 'order_rejected'; at: string; customerName: string; error: string };

// 订阅新单广播：页面挂载时调用，返回清理函数（卸载时 close 连接）
// 断线 EventSource 会自动重连，不用手动处理
export function subscribeSimEvents(onEvent: (event: SimEvent) => void): () => void {
    const es = new EventSource('/api/simulator/events');
    es.onmessage = (e) => {
        try {
            onEvent(JSON.parse(e.data) as SimEvent);
        } catch {
            // 坏帧直接忽略，别让一条脏数据炸掉整个页面
        }
    };
    return () => es.close();
}
