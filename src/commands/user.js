/**
 * Command to get information about a user
 */
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getDatabase } = require('../database/connection');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('user')
    .setDescription('Provides information about the user')
    .addUserOption(option => 
      option.setName('target')
        .setDescription('The user to get information about')
        .setRequired(false)),
  
  async execute(interaction) {
    await interaction.deferReply();
    
    // Get the target user - if not specified, use the command invoker
    const targetUser = interaction.options.getUser('target') || interaction.user;
    const member = interaction.guild ? await interaction.guild.members.fetch(targetUser.id).catch(() => null) : null;
    
    try {
      // Get user information from database
      const db = getDatabase();
      const [rows] = await db.query(
        'SELECT * FROM users WHERE id = ?',
        [targetUser.id]
      );
      
      // Create rich embed for user info
      const embed = new EmbedBuilder()
        .setColor(0x0099FF)
        .setTitle(`User Info - ${targetUser.username}`)
        .setThumbnail(targetUser.displayAvatarURL({ dynamic: true }))
        .addFields(
          { name: 'Username', value: targetUser.username, inline: true },
          { name: 'User ID', value: targetUser.id, inline: true }
        );
      
      // Add guild-specific info if available
      if (member) {
        embed.addFields(
          { name: 'Joined Server', value: `<t:${Math.floor(member.joinedTimestamp / 1000)}:R>`, inline: true },
          { name: 'Roles', value: member.roles.cache.size > 1 
            ? member.roles.cache.filter(r => r.id !== interaction.guild.id).map(r => r.toString()).join(', ')
            : 'No roles', inline: false }
        );
      }
      
      // Add database info if available
      if (rows.length > 0) {
        const userData = rows[0];
        embed.addFields(
          { name: 'First Interaction', value: `<t:${Math.floor(new Date(userData.first_interaction).getTime() / 1000)}:R>`, inline: true },
          { name: 'Last Interaction', value: `<t:${Math.floor(new Date(userData.last_interaction).getTime() / 1000)}:R>`, inline: true }
        );
        
        // Get command usage count
        const [usageRows] = await db.query(
          'SELECT COUNT(*) as count FROM command_usage WHERE user_id = ?',
          [targetUser.id]
        );
        
        if (usageRows.length > 0) {
          embed.addFields({ name: 'Commands Used', value: usageRows[0].count.toString(), inline: true });
        }
      } else {
        embed.addFields({ name: 'Database Info', value: 'No database records found for this user', inline: false });
      }
      
      await interaction.editReply({ embeds: [embed] });
    } catch (error) {
      console.error('Error fetching user info:', error);
      await interaction.editReply('Failed to fetch user information. Please try again later.');
    }
  },
};
