/**
 * Event handler for when the bot is ready
 */
const { Events } = require('discord.js');
const { getDatabase } = require('../database/connection');

module.exports = {
  name: Events.ClientReady,
  once: true,
  async execute(client) {
    console.log(`🚀 Ready! Logged in as ${client.user.tag}`);
    
    try {
      // Update bot status
      client.user.setActivity('with slash commands', { type: 'PLAYING' });
      
      // Log bot statistics
      console.log(`Bot is in ${client.guilds.cache.size} servers`);
      
      // Store guild information in database
      const db = getDatabase();
      for (const guild of client.guilds.cache.values()) {
        try {
          await db.query(
            'INSERT INTO guilds (id, name) VALUES (?, ?) ON DUPLICATE KEY UPDATE name = ?',
            [guild.id, guild.name, guild.name]
          );
        } catch (error) {
          console.error(`Failed to store guild ${guild.id}:`, error);
        }
      }
    } catch (error) {
      console.error('Error in ready event:', error);
    }
  },
};
