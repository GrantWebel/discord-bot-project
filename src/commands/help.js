/**
 * Help command that lists all available bot commands
 */
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('help')
    .setDescription('List all available commands')
    .addStringOption(option => 
      option.setName('command')
        .setDescription('Get detailed help for a specific command')
        .setRequired(false)),
  
  async execute(interaction) {
    const client = interaction.client;
    const specificCommand = interaction.options.getString('command');
    
    // If a specific command is requested
    if (specificCommand) {
      const command = client.commands.get(specificCommand);
      
      if (!command) {
        return interaction.reply({ 
          content: `I couldn't find any command called \`${specificCommand}\``, 
          ephemeral: true 
        });
      }
      
      const embed = new EmbedBuilder()
        .setColor(0x0099FF)
        .setTitle(`Command: /${command.data.name}`)
        .setDescription(command.data.description || 'No description available')
        .addFields(
          { name: 'Usage', value: `/${command.data.name} ${getCommandOptions(command)}` },
        );
        
      // Add options if they exist
      if (command.data.options && command.data.options.length > 0) {
        const optionsField = command.data.options.map(opt => {
          const required = opt.required ? '(required)' : '(optional)';
          return `\`${opt.name}\` ${required}: ${opt.description}`;
        }).join('\n');
        
        embed.addFields({ name: 'Options', value: optionsField });
      }
      
      return interaction.reply({ embeds: [embed], ephemeral: true });
    }
    
    // Otherwise list all commands
    const embed = new EmbedBuilder()
      .setColor(0x0099FF)
      .setTitle('Available Commands')
      .setDescription('Here are all the commands you can use. Type `/help [command]` for more details about a specific command.')
      .setFooter({ text: 'Use the command name as an argument to get detailed help' });
    
    // Sort commands by name
    const commands = Array.from(client.commands.values())
      .sort((a, b) => a.data.name.localeCompare(b.data.name));
    
    // Group commands by category (using folder name as fallback)
    const categories = {};
    
    for (const command of commands) {
      const category = command.category || 'Uncategorized';
      
      if (!categories[category]) {
        categories[category] = [];
      }
      
      categories[category].push(command);
    }
    
    // Add fields for each category
    for (const [category, categoryCommands] of Object.entries(categories)) {
      const value = categoryCommands.map(cmd => {
        return `\`/${cmd.data.name}\` - ${cmd.data.description}`;
      }).join('\n');
      
      embed.addFields({ name: category, value: value });
    }
    
    return interaction.reply({ embeds: [embed], ephemeral: true });
  },
  
  // Specify command category
  category: 'Utility'
};

/**
 * Helper function to format command options
 * @param {Object} command The command object
 * @returns {string} Formatted option string
 */
function getCommandOptions(command) {
  if (!command.data.options || command.data.options.length === 0) {
    return '';
  }
  
  return command.data.options.map(opt => {
    if (opt.required) {
      return `<${opt.name}>`;
    } else {
      return `[${opt.name}]`;
    }
  }).join(' ');
}
