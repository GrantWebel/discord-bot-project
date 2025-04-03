/**
 * Database connection module using MySQL
 */
const mysql = require('mysql2/promise');
const config = require('../../config');

let pool = null;

/**
 * Initialize database connection pool
 * @returns {Promise<mysql.Pool>} MySQL connection pool
 */
async function initDatabase() {
  if (pool) {
    return pool;
  }

  try {
    pool = mysql.createPool(config.database);
    
    // Test the connection
    const connection = await pool.getConnection();
    console.log(`Connected to MySQL database: ${config.database.database}`);
    connection.release();
    
    // Create tables if they don't exist
    await initTables();
    
    return pool;
  } catch (error) {
    console.error('Database connection error:', error);
    throw error;
  }
}

/**
 * Get the database connection pool
 * @returns {mysql.Pool} MySQL connection pool
 */
function getDatabase() {
  if (!pool) {
    throw new Error('Database not initialized. Call initDatabase() first.');
  }
  return pool;
}

/**
 * Initialize database tables
 */
async function initTables() {
  const db = getDatabase();
  
  try {
    // Create guilds table
    await db.query(`
      CREATE TABLE IF NOT EXISTS guilds (
        id VARCHAR(20) PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        prefix VARCHAR(10) DEFAULT '!',
        joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Create users table
    await db.query(`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(20) PRIMARY KEY,
        username VARCHAR(100) NOT NULL,
        discriminator VARCHAR(4),
        first_interaction TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        last_interaction TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    
    // Create command_usage table
    await db.query(`
      CREATE TABLE IF NOT EXISTS command_usage (
        id INT AUTO_INCREMENT PRIMARY KEY,
        command_name VARCHAR(100) NOT NULL,
        user_id VARCHAR(20) NOT NULL,
        guild_id VARCHAR(20),
        used_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (guild_id) REFERENCES guilds(id)
      )
    `);
    
    console.log('Database tables initialized successfully');
  } catch (error) {
    console.error('Error initializing database tables:', error);
    throw error;
  }
}

module.exports = {
  initDatabase,
  getDatabase
};
