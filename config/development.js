/**
 * Development environment configuration
 */
module.exports = {
  database: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306'),
    user: process.env.DB_USER || 'dbuser',
    password: process.env.DB_PASSWORD || 'dbpassword',
    database: process.env.DB_NAME || 'discord_bot_dev',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
  },
  discord: {
    token: process.env.BOT_TOKEN,
    clientId: process.env.CLIENT_ID,
    guildId: process.env.GUILD_ID, // For dev, we register commands to a specific guild for instant updates
    registerCommandsGlobally: false
  },
  // Owner restriction settings
  restrictToOwner: process.env.RESTRICT_TO_OWNER === 'true',
  ownerId: process.env.OWNER_ID,
  logLevel: 'debug'
};
