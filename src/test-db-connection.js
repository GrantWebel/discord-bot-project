/**
 * Script to test database connection
 * Run with: node src/test-db-connection.js
 */
require('dotenv').config();
const mysql = require('mysql2/promise');
const config = require('../config');

async function testConnection() {
  console.log('Testing database connection with these settings:');
  console.log(`- Host: ${config.database.host}`);
  console.log(`- Port: ${config.database.port}`);
  console.log(`- User: ${config.database.user}`);
  console.log(`- Database: ${config.database.database}`);
  
  try {
    // Create a connection pool
    const pool = mysql.createPool(config.database);
    
    // Get a connection from the pool
    console.log('Attempting to connect to the database...');
    const connection = await pool.getConnection();
    console.log('✅ Successfully connected to the database!');
    
    // Test database query
    console.log('Testing a simple query...');
    const [rows] = await connection.query('SELECT 1 + 1 AS solution');
    console.log(`✅ Query successful! Result: ${rows[0].solution}`);
    
    // Check if specified database exists
    console.log(`Checking if database '${config.database.database}' exists...`);
    const [databases] = await connection.query('SHOW DATABASES');
    const databaseExists = databases.some(db => db.Database === config.database.database);
    
    if (databaseExists) {
      console.log(`✅ Database '${config.database.database}' exists!`);
      
      // If database exists, create the tables using our schema
      console.log('Would you like to create the required tables now? [y/n]');
      
      // Create tables conditionally (when manually approved)
      process.stdin.once('data', async (data) => {
        const response = data.toString().trim().toLowerCase();
        
        if (response === 'y' || response === 'yes') {
          try {
            console.log('Creating tables...');
            
            // Create guilds table
            await connection.query(`
              CREATE TABLE IF NOT EXISTS guilds (
                id VARCHAR(20) PRIMARY KEY,
                name VARCHAR(100) NOT NULL,
                prefix VARCHAR(10) DEFAULT '!',
                joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
              )
            `);
            console.log('✅ Created guilds table');
            
            // Create users table
            await connection.query(`
              CREATE TABLE IF NOT EXISTS users (
                id VARCHAR(20) PRIMARY KEY,
                username VARCHAR(100) NOT NULL,
                discriminator VARCHAR(4),
                first_interaction TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                last_interaction TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
              )
            `);
            console.log('✅ Created users table');
            
            // Create command_usage table
            await connection.query(`
              CREATE TABLE IF NOT EXISTS command_usage (
                id INT AUTO_INCREMENT PRIMARY KEY,
                command_name VARCHAR(100) NOT NULL,
                user_id VARCHAR(20) NOT NULL,
                guild_id VARCHAR(20),
                used_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                INDEX (user_id),
                INDEX (guild_id)
              )
            `);
            console.log('✅ Created command_usage table');
            
            console.log('✅ All tables created successfully!');
          } catch (error) {
            console.error('❌ Error creating tables:', error);
          }
        } else {
          console.log('Skipping table creation.');
        }
        
        // Release the connection
        connection.release();
        process.exit(0);
      });
    } else {
      console.error(`❌ Database '${config.database.database}' does not exist!`);
      console.log(`Please create the database with: CREATE DATABASE ${config.database.database};`);
      connection.release();
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Database connection failed!');
    console.error(error);
    
    if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.error('The username or password is incorrect.');
    } else if (error.code === 'ECONNREFUSED') {
      console.error('Could not connect to the MySQL server. Is it running?');
    } else if (error.code === 'ER_BAD_DB_ERROR') {
      console.error(`The database '${config.database.database}' does not exist.`);
      console.log(`Please create it with: CREATE DATABASE ${config.database.database};`);
    }
    
    process.exit(1);
  }
}

testConnection();
