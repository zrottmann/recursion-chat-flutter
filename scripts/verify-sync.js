#!/usr/bin/env node

/**
 * Verify that MCP server and auto-approve.js have synchronized patterns
 */

const fs = require('fs');
const path = require('path');

// Load auto-approve.js patterns
const AutoApprover = require('./auto-approve.js');
const approver = new AutoApprover();

// Load MCP configuration
const claudeConfigPath = path.join(process.env.APPDATA, 'Claude', 'claude_desktop_config.json');
const claudeConfig = JSON.parse(fs.readFileSync(claudeConfigPath, 'utf8'));

console.log('🔍 SYNCHRONIZATION VERIFICATION');
console.log('================================\n');

// Test sample commands
const testCommands = [
  'ls', 'git status', 'npm run build', 'python app.py', 'flutter run',
  'docker ps', 'kubectl get pods', 'terraform plan', 'aws s3 ls',
  'curl https://example.com', 'echo hello', 'whoami', 'date'
];

const dangerousCommands = [
  'rm -rf /', 'del /f /s /q c:\\\\', 'format c:', 'shutdown /s', 'chmod 777'
];

console.log('📋 Local auto-approve.js patterns:');
console.log(`   • ${approver.safeCommands.length} safe command patterns`);
console.log(`   • ${approver.dangerousPatterns.length} dangerous patterns`);

console.log('\n📋 MCP server configuration:');
console.log(`   • ${claudeConfig.autoapprove.length} auto-approve patterns`);
console.log(`   • ${claudeConfig.autoblock.length} auto-block patterns`);
console.log(`   • MCP server: ${claudeConfig.mcpServers['claude-autoapprove'] ? '✅ Configured' : '❌ Missing'}`);

console.log('\n🧪 Testing command approval consistency:');
console.log('\nSafe commands (should all be APPROVED):');
let safeMatches = 0;
for (const cmd of testCommands) {
  const localResult = approver.shouldAutoApprove(cmd);
  const bashCmd = `Bash:${cmd}`;
  const mcpHasBash = claudeConfig.autoapprove.includes('Bash:' + cmd.split(' ')[0]);
  const mcpHasExact = claudeConfig.autoapprove.includes(bashCmd);
  
  if (localResult && (mcpHasBash || mcpHasExact)) {
    console.log(`   ✅ ${cmd}: Both approve`);
    safeMatches++;
  } else if (localResult && !mcpHasBash && !mcpHasExact) {
    console.log(`   ⚠️  ${cmd}: Local approves, MCP may not`);
  } else if (!localResult && (mcpHasBash || mcpHasExact)) {
    console.log(`   ⚠️  ${cmd}: MCP approves, local may not`);
  } else {
    console.log(`   ❌ ${cmd}: Neither approves (unexpected)`);
  }
}

console.log('\nDangerous commands (should all be BLOCKED):');
let dangerMatches = 0;
for (const cmd of dangerousCommands) {
  const localResult = !approver.shouldAutoApprove(cmd); // Should be blocked
  const mcpBlocks = claudeConfig.autoblock.some(pattern => 
    cmd.toLowerCase().includes(pattern.toLowerCase().replace('bash:', ''))
  );
  
  if (localResult && mcpBlocks) {
    console.log(`   ✅ ${cmd}: Both block`);
    dangerMatches++;
  } else if (localResult && !mcpBlocks) {
    console.log(`   ⚠️  ${cmd}: Local blocks, MCP may not`);
  } else if (!localResult && mcpBlocks) {
    console.log(`   ⚠️  ${cmd}: MCP blocks, local may not`);
  } else {
    console.log(`   ❌ ${cmd}: Neither blocks (DANGER!)`);
  }
}

console.log('\n📊 SYNCHRONIZATION SUMMARY');
console.log('==========================');
console.log(`Safe command consistency: ${safeMatches}/${testCommands.length} matches`);
console.log(`Dangerous command consistency: ${dangerMatches}/${dangerousCommands.length} matches`);

const syncScore = ((safeMatches + dangerMatches) / (testCommands.length + dangerousCommands.length) * 100).toFixed(1);
console.log(`Overall synchronization: ${syncScore}%`);

if (syncScore >= 90) {
  console.log('\n🎉 EXCELLENT: Both systems are well synchronized!');
} else if (syncScore >= 70) {
  console.log('\n✅ GOOD: Systems are mostly synchronized with minor differences');
} else {
  console.log('\n⚠️  NEEDS WORK: Systems have significant differences');
}

console.log('\n🚀 Next Steps:');
console.log('1. Restart Claude Desktop to load MCP configuration');
console.log('2. Test within Claude Desktop interface');
console.log('3. Monitor logs for both systems');
console.log(`4. Local logs: ${path.join(__dirname, 'auto-approve.log')}`);
console.log('5. MCP logs: Check Claude Desktop logs');