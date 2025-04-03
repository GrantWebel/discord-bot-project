/**
 * Admin command to manage the Weekly Form link and settings
 * Restricted to authorized roles only
 */
const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const { getDatabase } = require('../database/connection');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('edit-wk-form')
    .setDescription('Manage the Weekly Form (Authorized roles only)')
    .addSubcommand(subcommand =>
      subcommand
        .setName('set')
        .setDescription('Set the form link and expiration date')
        .addStringOption(option => 
          option.setName('url')
            .setDescription('The Google Form URL')
            .setRequired(true))
        .addStringOption(option => 
          option.setName('expires')
            .setDescription('Expiration date (YYYY-MM-DD HH:MM)')
            .setRequired(true))
        .addStringOption(option => 
          option.setName('title')
            .setDescription('Title for the form')
            .setRequired(false))
        .addStringOption(option => 
          option.setName('description')
            .setDescription('Description for the form')
            .setRequired(false)))
    .addSubcommand(subcommand =>
      subcommand
        .setName('status')
        .setDescription('Check the current form status')),
  
  async execute(interaction) {
    // Check if user has permission to use this command
    if (!await hasFormAdminPermission(interaction)) {
      return interaction.reply({
        content: 'You do not have permission to manage the form. This command requires an authorized role.',
        ephemeral: true
      });
    }
    
    // Set up the database table if it doesn't exist
    await setupDatabase();
    
    const subcommand = interaction.options.getSubcommand();
    
    switch(subcommand) {
      case 'set':
        return handleSetForm(interaction);
      case 'status':
        return handleFormStatus(interaction);
    }
  },
  
  // Specify command category
  category: 'Admin'
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
        expires_at DATETIME NOT NULL,
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
 * Handle setting a new form link and expiration date
 */
async function handleSetForm(interaction) {
  const url = interaction.options.getString('url');
  const expiresInput = interaction.options.getString('expires');
  const title = interaction.options.getString('title') || 'Weekly Form';
  const description = interaction.options.getString('description') || 'Please fill out this form by the deadline.';
  
  try {
    // Validate URL
    new URL(url);
    
    // Validate and parse expiration date
    // Allow both formats: "YYYY-MM-DD" and "YYYY-MM-DD HH:MM"
    let expiresDate;
    if (expiresInput.includes(':')) {
      // Format with time component
      expiresDate = new Date(expiresInput);
    } else {
      // Format without time (set default to end of day - 11:59 PM)
      expiresDate = new Date(`${expiresInput} 23:59:00`);
    }
    
    if (isNaN(expiresDate.getTime())) {
      return interaction.reply({
        content: 'Invalid date/time format. Please use YYYY-MM-DD or YYYY-MM-DD HH:MM.',
        ephemeral: true
      });
    }
    
    // Format date for MySQL (YYYY-MM-DD HH:MM:SS)
    const formattedDate = expiresDate.toISOString().slice(0, 19).replace('T', ' ');
    
    // Save to database
    const db = getDatabase();
    await db.query(`
      INSERT INTO form_links (guild_id, form_url, expires_at, title, description, created_by)
      VALUES (?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        form_url = VALUES(form_url),
        expires_at = VALUES(expires_at),
        title = VALUES(title),
        description = VALUES(description),
        created_by = VALUES(created_by),
        created_at = CURRENT_TIMESTAMP
    `, [
      interaction.guild.id,
      url,
      formattedDate,
      title,
      description,
      interaction.user.id
    ]);
    
    // Confirm success
    // Format for user display in their local timezone
    const expiresDisplay = `<t:${Math.floor(expiresDate.getTime() / 1000)}:F>`;
    
    await interaction.reply({
      content: `✅ Form link set successfully! Expires: ${expiresDisplay}`,
      ephemeral: true
    });
  } catch (error) {
    console.error('Error setting form link:', error);
    
    if (error instanceof TypeError) {
      await interaction.reply({
        content: 'Please provide a valid URL including the protocol (e.g., https://docs.google.com/forms/...)',
        ephemeral: true
      });
    } else {
      await interaction.reply({
        content: 'An error occurred while setting the form link.',
        ephemeral: true
      });
    }
  }
}

/**
 * Handle checking the form status
 */
async function handleFormStatus(interaction) {
  try {
    // Get the current form from the database
    const db = getDatabase();
    const [rows] = await db.query(`
      SELECT * FROM form_links WHERE guild_id = ?
    `, [interaction.guild.id]);
    
    if (rows.length === 0) {
      return interaction.reply({
        content: 'No form has been set up yet.',
        ephemeral: true
      });
    }
    
    const formData = rows[0];
    const expiresDate = new Date(formData.expires_at);
    const now = new Date();
    const createdBy = await interaction.client.users.fetch(formData.created_by).catch(() => null);
    
    // Check if form is expired
    const isExpired = expiresDate < now;
    const daysRemaining = Math.ceil((expiresDate - now) / (1000 * 60 * 60 * 24));
    
    // Format for user display in their local timezone using Discord timestamp format
    const expiresTimestamp = Math.floor(expiresDate.getTime() / 1000);
    const createdTimestamp = Math.floor(new Date(formData.created_at).getTime() / 1000);
    
    // Create embed with detailed status
    const embed = new EmbedBuilder()
      .setColor(isExpired ? 0xFF0000 : daysRemaining <= 1 ? 0xFFA500 : 0x00FF00)
      .setTitle('Form Status')
      .addFields(
        { name: 'Title', value: formData.title, inline: false },
        { name: 'URL', value: formData.form_url, inline: false },
        { name: 'Expires', value: `<t:${expiresTimestamp}:F> (${isExpired ? 'EXPIRED' : `${daysRemaining} days remaining`})`, inline: true },
        { name: 'Created By', value: createdBy ? createdBy.tag : 'Unknown User', inline: true },
        { name: 'Created At', value: `<t:${createdTimestamp}:F>`, inline: true },
        { name: 'Status', value: isExpired ? '❌ Expired' : '✅ Active', inline: true }
      );
    
    // Send response
    await interaction.reply({
      embeds: [embed],
      ephemeral: true
    });
  } catch (error) {
    console.error('Error checking form status:', error);
    await interaction.reply({
      content: 'An error occurred while checking the form status.',
      ephemeral: true
    });
  }
}

/**
 * Check if user has permission to manage forms
 */
async function hasFormAdminPermission(interaction) {
  // Allow server administrators
  if (interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
    return true;
  }
  
  // Define authorized role names (convert to lowercase for case-insensitive comparison)
  const authorizedRoles = ['leadership', 'admin', 'R4+'];
  
  // Check if user has any of the authorized roles
  return interaction.member.roles.cache.some(role => 
    authorizedRoles.includes(role.name.toLowerCase())
  );
}
