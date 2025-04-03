/**
 * Command that provides random outputs based on user selection
 */
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('random')
    .setDescription('Generate various random outputs')
    .addSubcommand(subcommand =>
      subcommand
        .setName('number')
        .setDescription('Generate a random number')
        .addIntegerOption(option => 
          option.setName('min')
            .setDescription('Minimum value (default: 1)')
            .setRequired(false))
        .addIntegerOption(option => 
          option.setName('max')
            .setDescription('Maximum value (default: 100)')
            .setRequired(false)))
    .addSubcommand(subcommand =>
      subcommand
        .setName('coin')
        .setDescription('Flip a coin'))
    .addSubcommand(subcommand =>
      subcommand
        .setName('dice')
        .setDescription('Roll a dice')
        .addIntegerOption(option => 
          option.setName('sides')
            .setDescription('Number of sides on the dice (default: 6)')
            .setRequired(false)
            .setMinValue(2))),
  
  async execute(interaction) {
    const subcommand = interaction.options.getSubcommand();
    
    switch (subcommand) {
      case 'number': {
        const min = interaction.options.getInteger('min') ?? 1;
        const max = interaction.options.getInteger('max') ?? 100;
        
        if (min >= max) {
          return interaction.reply({ 
            content: 'The minimum value must be less than the maximum value.', 
            ephemeral: true 
          });
        }
        
        const randomNumber = Math.floor(Math.random() * (max - min + 1)) + min;
        
        return interaction.reply(`🎲 Random number between ${min} and ${max}: **${randomNumber}**`);
      }
      
      case 'coin': {
        const result = Math.random() < 0.5 ? 'Heads' : 'Tails';
        const emoji = result === 'Heads' ? '🪙' : '💿';
        
        const embed = new EmbedBuilder()
          .setColor(0x0099FF)
          .setTitle('Coin Flip')
          .setDescription(`${emoji} The coin landed on: **${result}**`);
        
        return interaction.reply({ embeds: [embed] });
      }
      
      case 'dice': {
        const sides = interaction.options.getInteger('sides') ?? 6;
        const result = Math.floor(Math.random() * sides) + 1;
        
        let diceEmoji = '🎲';
        // Use specific dice emoji for standard dice
        if (sides === 6) {
          const diceEmojis = ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];
          diceEmoji = diceEmojis[result - 1];
        }
        
        const embed = new EmbedBuilder()
          .setColor(0x0099FF)
          .setTitle(`Dice Roll (d${sides})`)
          .setDescription(`${diceEmoji} You rolled: **${result}**`);
        
        return interaction.reply({ embeds: [embed] });
      }
    }
  },
  
  // Specify command category
  category: 'Fun'
};
