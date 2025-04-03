/**
 * Helper utilities for database operations
 */
const { getDatabase } = require('./connection');

/**
 * Get a user from the database, creating if not exists
 * @param {string} userId Discord user ID
 * @param {Object} userData User data to insert if not exists
 * @returns {Promise<Object>} The user data
 */
async function getOrCreateUser(userId, userData = {}) {
  const db = getDatabase();
  
  // Get existing user
  const [rows] = await db.query('SELECT * FROM users WHERE id = ?', [userId]);
  
  if (rows.length > 0) {
    return rows[0];
  }
  
  // Create new user
  const defaultUserData = {
    id: userId,
    username: userData.username || 'Unknown',
    discriminator: userData.discriminator || '0000'
  };
  
  await db.query(
    'INSERT INTO users (id, username, discriminator) VALUES (?, ?, ?)',
    [defaultUserData.id, defaultUserData.username, defaultUserData.discriminator]
  );
  
  // Get the newly created user
  const [newUser] = await db.query('SELECT * FROM users WHERE id = ?', [userId]);
  return newUser[0];
}

/**
 * Get a guild from the database, creating if not exists
 * @param {string} guildId Discord guild ID
 * @param {Object} guildData Guild data to insert if not exists
 * @returns {Promise<Object>} The guild data
 */
async function getOrCreateGuild(guildId, guildData = {}) {
  const db = getDatabase();
  
  // Get existing guild
  const [rows] = await db.query('SELECT * FROM guilds WHERE id = ?', [guildId]);
  
  if (rows.length > 0) {
    return rows[0];
  }
  
  // Create new guild
  const defaultGuildData = {
    id: guildId,
    name: guildData.name || 'Unknown Server',
    prefix: guildData.prefix || '!'
  };
  
  await db.query(
    'INSERT INTO guilds (id, name, prefix) VALUES (?, ?, ?)',
    [defaultGuildData.id, defaultGuildData.name, defaultGuildData.prefix]
  );
  
  // Get the newly created guild
  const [newGuild] = await db.query('SELECT * FROM guilds WHERE id = ?', [guildId]);
  return newGuild[0];
}

/**
 * Log command usage
 * @param {string} commandName The command name
 * @param {string} userId User ID who used the command
 * @param {string|null} guildId Guild ID where command was used (null for DMs)
 * @returns {Promise<void>}
 */
async function logCommandUsage(commandName, userId, guildId = null) {
  const db = getDatabase();
  
  // Ensure user exists
  await getOrCreateUser(userId);
  
  // If guild is provided, ensure it exists
  if (guildId) {
    await getOrCreateGuild(guildId);
  }
  
  // Log the command usage
  await db.query(
    'INSERT INTO command_usage (command_name, user_id, guild_id) VALUES (?, ?, ?)',
    [commandName, userId, guildId]
  );
}

/**
 * Get command usage statistics
 * @param {string} [guildId] Optional guild ID to filter by
 * @param {string} [userId] Optional user ID to filter by
 * @param {number} [limit=10] Limit number of results
 * @returns {Promise<Array>} Command usage statistics
 */
async function getCommandStats(guildId = null, userId = null, limit = 10) {
  const db = getDatabase();
  
  let query = 'SELECT command_name, COUNT(*) as count FROM command_usage';
  const params = [];
  
  // Add WHERE clauses as needed
  const whereConditions = [];
  
  if (guildId) {
    whereConditions.push('guild_id = ?');
    params.push(guildId);
  }
  
  if (userId) {
    whereConditions.push('user_id = ?');
    params.push(userId);
  }
  
  if (whereConditions.length > 0) {
    query += ' WHERE ' + whereConditions.join(' AND ');
  }
  
  // Group by command and order by count
  query += ' GROUP BY command_name ORDER BY count DESC LIMIT ?';
  params.push(limit);
  
  const [rows] = await db.query(query, params);
  return rows;
}

module.exports = {
  getOrCreateUser,
  getOrCreateGuild,
  logCommandUsage,
  getCommandStats
};
