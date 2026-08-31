import mysql from 'mysql2/promise';

const pool = mysql.createPool({
    host: process.env.DB_HOST || "localhost",
    port: parseInt(process.env.DB_PORT || "3306"),
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "biz-agent",
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
})

// 测试连接
async function testConnection() {
    try {
        const connection = await pool.getConnection();
        console.log('✅ 数据库连接成功');
        connection.release();
    } catch (err) {
        if (err instanceof Error) {
            console.error('❌ 数据库连接失败:', err.message);
        }
    }
}
testConnection();