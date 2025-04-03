/**
 * Configuration loader that selects the appropriate config based on NODE_ENV
 */
require('dotenv').config();

const env = process.env.NODE_ENV || 'development';
let config;

try {
  config = require(`./${env}`);
  console.log(`Loaded ${env} configuration`);
} catch (error) {
  console.error(`Failed to load ${env} configuration, falling back to development`);
  config = require('./development');
}

module.exports = config;
