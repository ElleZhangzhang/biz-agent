import { fakerZH_CN } from '@faker-js/faker';
import { createOrder, listProducts } from '@/business/system.js';
import { broadcast } from '@/simulator/events.js';

// 模拟顾客引擎：随机间隔来客下单，只造数据不碰 Agent 逻辑
// 关键设计：顾客走 createOrder —— 和真实顾客同一条业务链路（校验+扣库存+落库），
// 所以模拟产生的订单就是真订单，Agent 可以直接处理

// 来客间隔：10~60s 随机（可用环境变量调快，演示/测试时方便）
const MIN_DELAY = Number(process.env.SIM_MIN_DELAY ?? 10_000);
const MAX_DELAY = Number(process.env.SIM_MAX_DELAY ?? 60_000);

let timer: NodeJS.Timeout | null = null;
let running = false;
let orderCount = 0;

export function isRunning() { return running; }
export function getOrderCount() { return orderCount; }

function randomInt(min: number, max: number) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

// 单次"来客"：挑商品 → 定数量 → 下单 → 广播
async function oneCustomer() {
    const products = await listProducts();
    if (products.length === 0) return;   // 店是空的，闭门歇业

    // 随机挑 1~3 种商品，一张单内不重复
    const picked = [...products].sort(() => Math.random() - 0.5).slice(0, randomInt(1, 3));

    const items = picked.map((p) => {
        // ~15% 概率"冲动消费"买超库存 → createOrder 拒绝，正好演示校验失败
        const overbuy = Math.random() < 0.15;
        const qty = overbuy ? p.stock + randomInt(1, 10) : randomInt(1, 5);
        return { productId: p.id, qty };
    });

    const name = fakerZH_CN.person.fullName();
    const r = await createOrder(name, items);
    orderCount++;
    broadcast(r.ok
        ? { type: 'order_created', at: new Date().toISOString(), order: r.order }
        : { type: 'order_rejected', at: new Date().toISOString(), customerName: name, error: r.error });
}

// setTimeout 链：每次执行完再排下一次，间隔每次都重新随机
// （不能用 setInterval：间隔是固定的，做不到"每次随机"）
function scheduleNext() {
    if (!running) return;
    timer = setTimeout(async () => {
        try {
            await oneCustomer();
        } catch (err) {
            console.error('模拟顾客下单出错:', err);
        }
        scheduleNext();
    }, randomInt(MIN_DELAY, MAX_DELAY));
}

export function start() {
    if (running) return;   // 幂等：已经在跑了就不重复起
    running = true;
    scheduleNext();
    console.log('🎭 模拟顾客开始营业');
}

export function stop() {
    running = false;
    if (timer) clearTimeout(timer);
    timer = null;
    console.log('🎭 模拟顾客打烊');
}
