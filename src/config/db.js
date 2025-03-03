const mysql = require('mysql2/promise');

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT,
    waitForConnections: true,
    connectionLimit: 10, // Try increasing this
    queueLimit: 0,
    connectTimeout: 60000,  // Increase timeout to 60s
    acquireTimeout: 60000   // Increase timeout for acquiring connections
});

module.exports = pool;
