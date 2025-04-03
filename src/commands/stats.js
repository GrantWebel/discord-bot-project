/**
 * Command to show bot statistics
 */
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getDatabase } = require('../database/connection');
const { getCommandStats } = require('../database/queryHelper');
const os = require('os');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('stats')
    .setDescription('Display bot statistics and system information'),
  
  async execute(interaction) {
    await interaction.deferReply();
    
    try {
      const client = interaction.client;
      
      // Get uptime
      const uptimeSeconds = Math.floor(client.uptime / 1000);
      const days = Math.floor(uptimeSeconds / 86400);
      const hours = Math.floor((uptimeSeconds % 86400) / 3600);
      const minutes = Math.floor((uptimeSeconds % 3600) / 60);
      const seconds = uptimeSeconds % 60;
      
      const uptime = `${days}d ${hours}h ${minutes}m ${seconds}s`;
      
      // Get command usage statistics
      const commandStats = await getCommandStats(null, null, 5);
      
      // System stats
      const memoryUsage = process.memoryUsage();
      const systemInfo = {
        os: `${os.type()} ${os.release()}`,
        memory: `${Math.round(memoryUsage.rss / 1024 / 1024)} MB`,
        cpu: os.cpus()[0].model,
        node: process.version,
      };
      
      // Create embed for stats
      const embed = new EmbedBuilder()
        .setColor(0x0099FF)
        .setTitle('Bot Statistics')
        .addFields(
          { name: 'Uptime', value: uptime, inline: true },
          { name: 'Servers', value: client.guilds.cache.size.toString(), inline: true },
          { name: 'Users', value: client.users.cache.size.toString(), inline: true },
          { name: 'Memory Usage', value: systemInfo.memory, inline: true },
          { name: 'Node.js Version', value: systemInfo.node, inline: true },
          { name: 'OS', value: systemInfo.os, inline: true }
        );
      
      // Add command usage stats if available
      if (commandStats.length > 0) {
        const statsField = commandStats.map(row => `/${row.command_name}: ${row.count} uses`).join('\n');
        embed.addFields({ name: 'Top Commands', value: statsField, inline: false });
      }
      
      await interaction.editReply({ embeds: [embed] });
    } catch (error) {
      console.error('Error fetching bot stats:', error);
      await interaction.editReply('Failed to fetch bot statistics. Please try again later.');
    }
  },
  
  // Specify command category
  category: 'Utility'
};
