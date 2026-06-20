require("dotenv").config();

const mysql = require("mysql2/promise");

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

(async () => {
    try {
        const conn = await pool.getConnection();
        console.log("✅ Database pool connected successfully!");
        conn.release();
    } catch (err) {
        console.error("❌ Database Connection Error:", err.message);
    }
})();

module.exports = pool;