# Discord Bot Project

A modular Discord bot with MySQL database integration, created using discord.js.

## Features

- Modular command system for easy addition/removal of commands
- MySQL database integration for persistent storage
- Support for multiple environments (development, testing, production)
- Slash command support
- Easy-to-use command handler

## Prerequisites

- [Node.js](https://nodejs.org/) (v16.9.0 or newer)
- [MySQL](https://www.mysql.com/) server
- Discord account with a server where you have admin permissions

## Setup

### 1. Create a Discord Application

1. Go to the [Discord Developer Portal](https://discord.com/developers/applications)
2. Click "New Application" and give it a name
3. Go to the "Bot" tab and click "Add Bot"
4. Under the "Privileged Gateway Intents" section, enable:
   - Server Members Intent
   - Message Content Intent
5. Save changes
6. Click "Reset Token" and copy the new token (you'll need this later)
7. Go to the "OAuth2" tab, then "URL Generator"
8. Select the following scopes:
   - `bot`
   - `applications.commands`
9. Select the following bot permissions:
   - "Send Messages"
   - "Read Messages/View Channels"
   - "Use Slash Commands"
   - "Add any other permissions your bot might need"
10. Copy the generated URL at the bottom
11. Open the URL in your browser and invite the bot to your server

### 2. Configure the Environment

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
2. Edit `.env` with your:
   - Discord Bot Token (from step 1.6)
   - Client ID (your application ID from the Discord Developer Portal)
   - Guild ID (right-click your server in Discord, "Copy ID" - requires developer mode)
   - Database credentials

### 3. Install Dependencies

```bash
npm install
```

### 4. Set Up the Database

Make sure your MySQL server is running and you've created databases for each environment:

```sql
CREATE DATABASE discord_bot_dev;
CREATE DATABASE discord_bot_test;
CREATE DATABASE discord_bot_prod;

-- Create a user for the bot (or use an existing one)
CREATE USER 'dbuser'@'localhost' IDENTIFIED BY 'dbpassword';
GRANT ALL PRIVILEGES ON discord_bot_dev.* TO 'dbuser'@'localhost';
GRANT ALL PRIVILEGES ON discord_bot_test.* TO 'dbuser'@'localhost';
GRANT ALL PRIVILEGES ON discord_bot_prod.* TO 'dbuser'@'localhost';
FLUSH PRIVILEGES;
```

### 5. Deploy Commands

```bash
node src/deploy-commands.js
```

### 6. Start the Bot

Development mode:
```bash
npm run dev
```

Production mode:
```bash
npm run prod
```

Test mode:
```bash
npm run test
```

## Available Commands

- `/ping` - Check bot latency
- `/user [target]` - Get information about yourself or another user
- `/server` - Get information about the current server

## Adding New Commands

1. Create a new file in the `src/commands` directory
2. Use the following template:

```javascript
const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('commandname')
    .setDescription('Command description'),
  
  async execute(interaction) {
    // Your command logic here
    await interaction.reply('Command response');
  },
};
```

3. Run `node src/deploy-commands.js` to register the new command

## License

This project is licensed under the MIT License - see the LICENSE file for details.
