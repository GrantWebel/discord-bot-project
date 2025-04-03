/**
 * Event handler for when an interaction is created
 */
const { Events } = require('discord.js');
const { getDatabase } = require('../database/connection');
const config = require('../../config');

module.exports = {
  name: Events.InteractionCreate,
  async execute(interaction) {
    // Store user information in database
    try {
      const db = getDatabase();
      await db.query(
        'INSERT INTO users (id, username, discriminator) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE username = ?, discriminator = ?',
        [
          interaction.user.id,
          interaction.user.username,
          interaction.user.discriminator || '0000', // Discord is moving away from discriminators
          interaction.user.username,
          interaction.user.discriminator || '0000'
        ]
      );
    } catch (error) {
      console.error('Error storing user information:', error);
    }

    // Handle slash commands
    if (interaction.isChatInputCommand()) {
      const command = interaction.client.commands.get(interaction.commandName);

      if (!command) {
        console.error(`No command matching ${interaction.commandName} was found.`);
        return;
      }
      
      // Check if restricted to owner only
      if (config.restrictToOwner) {
        const ownerId = config.ownerId;
        if (interaction.user.id !== ownerId) {
          return interaction.reply({ 
            content: 'This bot is currently in development mode and only responds to its owner.', 
            ephemeral: true 
          });
        }
      }

      try {
        // Log command usage
        try {
          const db = getDatabase();
          await db.query(
            'INSERT INTO command_usage (command_name, user_id, guild_id) VALUES (?, ?, ?)',
            [interaction.commandName, interaction.user.id, interaction.guild?.id]
          );
        } catch (dbError) {
          console.error('Error logging command usage:', dbError);
        }

        // Execute the command
        await command.execute(interaction);
      } catch (error) {
        console.error(`Error executing ${interaction.commandName}`);
        console.error(error);

        const errorMessage = { content: 'There was an error while executing this command!', ephemeral: true };
        
        if (interaction.replied || interaction.deferred) {
          await interaction.followUp(errorMessage);
        } else {
          await interaction.reply(errorMessage);
        }
      }
    }
  },
};
