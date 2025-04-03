/**
 * Script to create the required databases
 * Run with: node src/create-db.js
 */
require('dotenv').config();
const mysql = require('mysql2/promise');

async function createDatabases() {
  // Create a config without a specific database
  const config = {
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || '3306'),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD
  };

  console.log('Attempting to connect to MySQL with these settings:');
  console.log(`- Host: ${config.host}`);
  console.log(`- Port: ${config.port}`);
  console.log(`- User: ${config.user}`);
  
  try {
    // Connect without specifying a database
    const connection = await mysql.createConnection(config);
    console.log('✅ Connected to MySQL server!');
    
    // Database names based on environment
    const dbNames = [
      process.env.DB_NAME, // Current environment DB (from .env)
      'discord_sock_bot_dev',
      'discord_sock_bot_test',
      'discord_sock_bot_prod'
    ];

    // Remove duplicates
    const uniqueDbNames = [...new Set(dbNames)];
    
    // Create each database
    for (const dbName of uniqueDbNames) {
      try {
        console.log(`Creating database '${dbName}'...`);
        await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\``);
        console.log(`✅ Database '${dbName}' created or already exists`);
      } catch (error) {
        console.error(`❌ Error creating database '${dbName}':`, error);
      }
    }
    
    console.log('\nVerifying user privileges...');
    for (const dbName of uniqueDbNames) {
      try {
        console.log(`Granting privileges on '${dbName}' to '${config.user}'@'localhost'...`);
        await connection.query(
          `GRANT ALL PRIVILEGES ON \`${dbName}\`.* TO '${config.user}'@'localhost'`
        );
        console.log(`✅ Privileges granted on '${dbName}'`);
      } catch (error) {
        console.error(`❌ Error granting privileges on '${dbName}':`, error);
      }
    }
    
    // Apply privileges
    await connection.query('FLUSH PRIVILEGES');
    console.log('✅ Privileges applied');
    
    console.log('\n✅ Database setup completed successfully!');
    console.log('You can now run the test-db-connection.js script to verify and create tables');
    
    // Close connection
    await connection.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Failed to connect to MySQL server:');
    console.error(error);
    
    if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.error('The username or password is incorrect.');
    } else if (error.code === 'ECONNREFUSED') {
      console.error('Could not connect to the MySQL server. Is it running?');
    }
    
    process.exit(1);
  }
}

createDatabases();
