/**
 * Production environment configuration
 */
module.exports = {
  database: {
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || '3306'),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME || 'discord_bot_prod',
    waitForConnections: true,
    connectionLimit: 20,
    queueLimit: 0
  },
  discord: {
    token: process.env.BOT_TOKEN,
    clientId: process.env.CLIENT_ID,
    registerCommandsGlobally: true // In production, we register commands globally
  },
  // Owner restriction settings
  restrictToOwner: process.env.RESTRICT_TO_OWNER === 'true',
  ownerId: process.env.OWNER_ID,
  logLevel: 'warn'
};
