const mysql = require('mysql2/promise');
const dotenv = require('dotenv');

dotenv.config();

// Create connection pool
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT, 10) || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'campus_event_management',
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
    console.log(`Connected to MySQL database [${process.env.DB_NAME || 'campus_event_management'}] successfully!`);
    connection.release();
  } catch (error) {
    console.error('MySQL Connection Error:', error.message);
  }
}

module.exports = {
  pool,
  testConnection
};
