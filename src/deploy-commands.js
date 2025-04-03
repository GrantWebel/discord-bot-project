/**
 * Script to deploy slash commands to Discord
 * Run this whenever you add, update, or remove commands
 */
const { REST, Routes } = require('discord.js');
const fs = require('fs');
const path = require('path');
const config = require('../config');

const commands = [];
// Get all command files
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

// Grab the SlashCommandBuilder#toJSON() output of each command
for (const file of commandFiles) {
  const command = require(path.join(commandsPath, file));
  commands.push(command.data.toJSON());
}

// Create and configure REST client
const rest = new REST({ version: '10' }).setToken(config.discord.token);

// Deploy commands
(async () => {
  try {
    console.log(`Started refreshing ${commands.length} application (/) commands.`);

    let data;
    
    if (config.discord.registerCommandsGlobally) {
      // Global commands - slower to update (up to 1 hour) but available in all guilds
      data = await rest.put(
        Routes.applicationCommands(config.discord.clientId),
        { body: commands },
      );
      console.log(`Successfully registered ${data.length} global commands.`);
    } else {
      // Guild commands - instant update but only for specific guild
      data = await rest.put(
        Routes.applicationGuildCommands(config.discord.clientId, config.discord.guildId),
        { body: commands },
      );
      console.log(`Successfully registered ${data.length} commands for guild ${config.discord.guildId}.`);
    }
  } catch (error) {
    console.error(error);
  }
})();
