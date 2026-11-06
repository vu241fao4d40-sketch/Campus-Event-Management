const mysql = require('mysql2/promise');
const dotenv = require('dotenv');

dotenv.config();

// Create connection pool
const pool = mysql.createPool({
  host: process.env.DB_HOST || process.env.MYSQLHOST || 'localhost',
  port: parseInt(process.env.DB_PORT || process.env.MYSQLPORT, 10) || 3306,
  user: process.env.DB_USER || process.env.MYSQLUSER || 'root',
  password: process.env.DB_PASSWORD || process.env.MYSQLPASSWORD || '',
  database: process.env.DB_NAME || process.env.MYSQLDATABASE || 'campus_event_management',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  dateStrings: true,
  charset: 'utf8mb4'
});

// Helper to test database connection
async function testConnection() {
  try {
    const connection = await pool.getConnection();
    const databaseName = process.env.DB_NAME || process.env.MYSQLDATABASE || 'campus_event_management';
    console.log(`Connected to MySQL database [${databaseName}] successfully!`);
    connection.release();
  } catch (error) {
    console.error('MySQL Connection Error:', error.message);
  }
}

module.exports = {
  pool,
  testConnection
};
