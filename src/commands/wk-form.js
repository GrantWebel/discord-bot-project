/**
 * Command to display the Weekly Form link to users
 */
const { SlashCommandBuilder, EmbedBuilder, ButtonBuilder, ActionRowBuilder, ButtonStyle } = require('discord.js');
const { getDatabase } = require('../database/connection');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('wk-form')
    .setDescription('Display the Bi-Weekly WK Form link'),
  
  async execute(interaction) {
    // Set up the database table if it doesn't exist
    await setupDatabase();
    
    // Display the form to the user
    return handleShowForm(interaction);
  },
  
  // Specify command category
  category: 'Utility'
};

/**
 * Ensure the required database table exists
 */
async function setupDatabase() {
  try {
    const db = getDatabase();
    await db.query(`
      CREATE TABLE IF NOT EXISTS form_links (
        id INT AUTO_INCREMENT PRIMARY KEY,
        guild_id VARCHAR(20) NOT NULL,
        form_url TEXT NOT NULL,
        expires_at DATE NOT NULL,
        title VARCHAR(255),
        description TEXT,
        created_by VARCHAR(20) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY guild_unique (guild_id)
      )
    `);
  } catch (error) {
    console.error('Error setting up form_links table:', error);
  }
}



/**
 * Handle displaying the form link to users
 */
async function handleShowForm(interaction) {
  try {
    // Get the current form from the database
    const db = getDatabase();
    const [rows] = await db.query(`
      SELECT * FROM form_links WHERE guild_id = ?
    `, [interaction.guild.id]);
    
    if (rows.length === 0) {
      return interaction.reply({
        content: 'No form has been added for this rotation. Please ask Alpha or an R4 to set up the form.',
        ephemeral: true
      });
    }
    
    const formData = rows[0];
    const expiresDate = new Date(formData.expires_at);
    const now = new Date();
    
    // Check if form is expired
    if (expiresDate < now) {
      return interaction.reply({
        content: 'This form has expired and is no longer available for submissions.',
        ephemeral: true
      });
    }
    
    // Format expiration countdown
    const daysRemaining = Math.ceil((expiresDate - now) / (1000 * 60 * 60 * 24));
    let expiresText;
    
    if (daysRemaining <= 0) {
      expiresText = 'Expires today!';
    } else if (daysRemaining === 1) {
      expiresText = 'Expires tomorrow!';
    } else {
      expiresText = `Expires in ${daysRemaining} days`;
    }
    
    // Format timestamp for Discord to show in user's local timezone
    const expiresTimestamp = Math.floor(expiresDate.getTime() / 1000);
    
    // Create button for the form
    const button = new ButtonBuilder()
      .setLabel('Open Form')
      .setURL(formData.form_url)
      .setStyle(ButtonStyle.Link);
    
    const row = new ActionRowBuilder().addComponents(button);
    
    // Create embed
    const embed = new EmbedBuilder()
      .setColor(daysRemaining <= 1 ? 0xFF0000 : daysRemaining <= 3 ? 0xFFA500 : 0x00FF00)
      .setTitle(formData.title)
      .setDescription(formData.description)
      .addFields(
        { name: 'Deadline', value: `<t:${expiresTimestamp}:F> (${expiresText})`, inline: true }
      )
      .setFooter({ text: 'Click the button below to open the form' })
      .setTimestamp();
    
    // Send response
    await interaction.reply({
      embeds: [embed],
      components: [row]
    });
  } catch (error) {
    console.error('Error displaying form:', error);
    await interaction.reply({
      content: 'An error occurred while retrieving the form.',
      ephemeral: true
    });
  }
}




