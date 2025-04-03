/**
 * Command to get information about the server (Admin only)
 */
const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const { getDatabase } = require('../database/connection');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('server')
    .setDescription('Provides information about the server'),
  
  async execute(interaction) {
    // If not in a guild, return error
    if (!interaction.guild) {
      return interaction.reply({ content: 'This command can only be used in a server!', ephemeral: true });
    }
    
    // Check if user has admin permissions
    if (!await hasAdminPermission(interaction)) {
      return interaction.reply({
        content: 'You do not have permission to use this command. Admin role required.',
        ephemeral: true
      });
    }
    
    await interaction.deferReply();
    
    try {
      const guild = interaction.guild;
      
      // Fetch guild information from database
      const db = getDatabase();
      const [rows] = await db.query(
        'SELECT * FROM guilds WHERE id = ?',
        [guild.id]
      );
      
      // Get command usage statistics for this guild
      const [usageStats] = await db.query(
        'SELECT command_name, COUNT(*) as count FROM command_usage WHERE guild_id = ? GROUP BY command_name ORDER BY count DESC LIMIT 5',
        [guild.id]
      );
      
      // Create embed for server info
      const embed = new EmbedBuilder()
        .setColor(0x0099FF)
        .setTitle(`Server Info - ${guild.name}`)
        .setThumbnail(guild.iconURL({ dynamic: true }))
        .addFields(
          { name: 'Server Name', value: guild.name, inline: true },
          { name: 'Server ID', value: guild.id, inline: true },
          { name: 'Owner', value: `<@${guild.ownerId}>`, inline: true },
          { name: 'Created', value: `<t:${Math.floor(guild.createdTimestamp / 1000)}:R>`, inline: true },
          { name: 'Members', value: guild.memberCount.toString(), inline: true },
          { name: 'Channels', value: guild.channels.cache.size.toString(), inline: true },
          { name: 'Roles', value: guild.roles.cache.size.toString(), inline: true }
        );
      
      // Add database info if available
      if (rows.length > 0) {
        const guildData = rows[0];
        embed.addFields(
          { name: 'Bot joined', value: `<t:${Math.floor(new Date(guildData.joined_at).getTime() / 1000)}:R>`, inline: true }
        );
      }
      
      // Add command usage stats if available
      if (usageStats.length > 0) {
        const statsField = usageStats.map(row => `/${row.command_name}: ${row.count} uses`).join('\n');
        embed.addFields({ name: 'Top Commands', value: statsField, inline: false });
      }
      
      await interaction.editReply({ embeds: [embed] });
    } catch (error) {
      console.error('Error fetching server info:', error);
      await interaction.editReply('Failed to fetch server information. Please try again later.');
    }
  },
  
  // Specify command category
  category: 'Admin'
};

/**
 * Check if user has permission to use admin commands
 */
async function hasAdminPermission(interaction) {
  // Allow server administrators
  if (interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
    return true;
  }
  
  // Define authorized role names (convert to lowercase for case-insensitive comparison)
  const authorizedRoles = ['leadership', 'admin', 'r4+'];
  
  // Check if user has any of the authorized roles
  return interaction.member.roles.cache.some(role => 
    authorizedRoles.includes(role.name.toLowerCase())
  );
}
