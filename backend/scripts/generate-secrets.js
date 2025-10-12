#!/usr/bin/env node
/**
 * Generate secure secrets for JWT and other security features
 * Usage: node scripts/generate-secrets.js
 */

const crypto = require('crypto');

console.log('🔐 Generating Secure Secrets for Jewgo Backend\n');
console.log(
  'Copy these values to your hosting platform environment variables:\n',
);
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

// Generate JWT Secret
const jwtSecret = crypto.randomBytes(64).toString('hex');
console.log('JWT_SECRET=');
console.log(jwtSecret);
console.log();

// Generate JWT Refresh Secret
const jwtRefreshSecret = crypto.randomBytes(64).toString('hex');
console.log('JWT_REFRESH_SECRET=');
console.log(jwtRefreshSecret);
console.log();

// Generate Session Secret (if needed)
const sessionSecret = crypto.randomBytes(32).toString('hex');
console.log('SESSION_SECRET=');
console.log(sessionSecret);
console.log();

// Generate API Key (if needed)
const apiKey = crypto.randomBytes(32).toString('hex');
console.log('API_KEY=');
console.log(apiKey);
console.log();

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
console.log(
  '⚠️  IMPORTANT: Keep these secrets secure and never commit them to git!\n',
);
console.log('📋 Add these to your hosting platform:');
console.log('   • Railway: Project → Variables');
console.log('   • Render: Service → Environment');
console.log('   • Heroku: heroku config:set JWT_SECRET=...\n');
