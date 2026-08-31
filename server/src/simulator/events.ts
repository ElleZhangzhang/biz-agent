import type { Response } from 'express';

// SSE 广播中心：所有订阅的 EventSource 客户端
// 和 agent 的 SSE 不一样：agent 是"客户端拉"（fetch 读响应流），
// 这里要"服务端主动推"（EventSource 订阅），所以维护一个在线客户端集合
const clients = new Set<Response>();

// 最近事件历史（环形缓冲，上限 50 条）：
// 新打开页面的客户端先拉历史再订阅 SSE，实时流不用每次从 0 开始
// （只存内存：重启后清空没关系，订单本体在 MySQL 里）
const HISTORY_LIMIT = 50;
const history: unknown[] = [];

export function subscribe(res: Response) {
    clients.add(res);
    // 用户关页面 → 连接断开 → 从集合踢出，别往死连接上写数据
    res.on('close', () => { clients.delete(res); });
}

export function broadcast(event: unknown) {
    history.push(event);
    if (history.length > HISTORY_LIMIT) history.shift();
    const frame = `data: ${JSON.stringify(event)}\n\n`;
    for (const res of clients) res.write(frame);
}

export function getRecentEvents(): unknown[] {
    return [...history];
}
