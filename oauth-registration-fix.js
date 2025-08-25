#!/usr/bin/env node

/**
 * OAuth Registration Fix for Trading Post
 * Checks and provides exact instructions for OAuth platform registration
 */

const CONFIG = {
  DOMAIN: 'tradingpost.appwrite.network',
  PROJECT_ID: '689bdee000098bd9d55c',
  OAUTH_CALLBACK: 'https://tradingpost.appwrite.network/auth/callback',
  OAUTH_ERROR: 'https://tradingpost.appwrite.network/auth/error'
};

function log(level, message) {
  const colors = {
    INFO: '\x1b[36m',
    SUCCESS: '\x1b[32m',
    WARNING: '\x1b[33m',
    ERROR: '\x1b[31m',
    RESET: '\x1b[0m'
  };
  console.log(`${colors[level]}${message}${colors.RESET}`);
}

function printSolution() {
  log('ERROR', '🚨 OAUTH PLATFORM REGISTRATION ISSUE DETECTED');
  log('INFO', '');
  log('INFO', '📋 ERROR ANALYSIS:');
  log('INFO', `   Domain: ${CONFIG.DOMAIN}`);
  log('INFO', `   Error: "Register your new client as a new Web platform"`);
  log('INFO', `   Issue: OAuth callbacks not registered for this domain`);
  log('INFO', '');
  
  log('SUCCESS', '🔧 EXACT SOLUTION:');
  log('INFO', '');
  log('INFO', '1️⃣ APPWRITE CONSOLE - PLATFORM REGISTRATION:');
  log('INFO', '   🔗 Go to: https://cloud.appwrite.io/console');
  log('INFO', `   📂 Select Project: ${CONFIG.PROJECT_ID}`);
  log('INFO', '   ⚙️ Navigate: Settings → Platforms');
  log('INFO', '   ➕ Click: "Add Platform" → "Web App"');
  log('INFO', '   📝 Enter:');
  log('INFO', `      • Name: "Trading Post - OAuth"`);
  log('INFO', `      • Hostname: "${CONFIG.DOMAIN}"`);
  log('INFO', '      • ✅ Enable all OAuth options');
  log('INFO', '');
  
  log('INFO', '2️⃣ GOOGLE CLOUD CONSOLE - OAUTH SETTINGS:');
  log('INFO', '   🔗 Go to: https://console.cloud.google.com/apis/credentials');
  log('INFO', '   🔍 Find: Your OAuth 2.0 Client ID');
  log('INFO', '   ✏️ Edit and add:');
  log('INFO', '   📍 Authorized JavaScript origins (NO PATHS):');
  log('INFO', `      • https://${CONFIG.DOMAIN}`);
  log('INFO', '   📍 Authorized redirect URIs (FULL PATHS OK):');
  log('INFO', `      • ${CONFIG.OAUTH_CALLBACK}`);
  log('INFO', `      • ${CONFIG.OAUTH_ERROR}`);
  log('WARNING', '   ⚠️ CRITICAL: Origins = domain only, Redirect URIs = full paths');
  log('INFO', '');
  
  log('INFO', '3️⃣ VERIFICATION URLS:');
  log('INFO', `   🧪 Test CORS: https://${CONFIG.DOMAIN}/test-cors.html`);
  log('INFO', `   🔐 Test OAuth: https://${CONFIG.DOMAIN}/login`);
  log('INFO', '');
  
  log('WARNING', '⏱️ PROPAGATION TIME:');
  log('INFO', '   • Appwrite changes: Immediate');
  log('INFO', '   • Google OAuth changes: Up to 5 minutes');
  log('INFO', '');
  
  log('SUCCESS', '✅ AFTER COMPLETION:');
  log('INFO', '   1. Clear browser cache');
  log('INFO', '   2. Try OAuth login again');
  log('INFO', '   3. Error should be resolved');
  log('INFO', '');
  
  log('INFO', '🎯 ROOT CAUSE:');
  log('INFO', '   The domain is registered for basic CORS but NOT for OAuth callbacks.');
  log('INFO', '   OAuth requires explicit platform registration with callback URLs.');
}

function checkCurrentConfig() {
  log('INFO', '🔍 CURRENT CONFIGURATION CHECK:');
  log('INFO', '');
  log('INFO', '📋 Expected OAuth URLs:');
  log('INFO', `   Callback: ${CONFIG.OAUTH_CALLBACK}`);
  log('INFO', `   Error: ${CONFIG.OAUTH_ERROR}`);
  log('INFO', '');
  log('INFO', '❓ VERIFICATION QUESTIONS:');
  log('INFO', `   1. Is "${CONFIG.DOMAIN}" registered as Web Platform in Appwrite?`);
  log('INFO', `   2. Are OAuth URLs registered in Google Cloud Console?`);
  log('INFO', `   3. Are OAuth providers enabled in Appwrite Auth settings?`);
  log('INFO', '');
}

async function main() {
  log('INFO', '🚀 OAUTH REGISTRATION FIX - Trading Post');
  log('INFO', '==========================================');
  
  checkCurrentConfig();
  printSolution();
  
  log('SUCCESS', '🎉 Instructions provided! Follow steps above to fix OAuth issue.');
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { printSolution, checkCurrentConfig };