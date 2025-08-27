const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Deploying Claude Code UI via GitHub Actions...');

// Change to the Claude Code Remote project directory
const projectDir = 'C:/Users/Zrott/OneDrive/Desktop/Claude/active-projects/Claude-Code-Remote';
process.chdir(projectDir);
console.log('📂 Working in:', process.cwd());

try {
  // Check git status
  console.log('📋 Git Status:');
  execSync('git status', { stdio: 'inherit' });
  
  // Update deployment trigger file to ensure GitHub Actions detects changes
  const deploymentDir = 'appwrite-deployment';
  const triggerFile = path.join(deploymentDir, 'package.json');
  
  if (fs.existsSync(triggerFile)) {
    console.log('🔄 Updating package.json version to trigger deployment...');
    const packageData = JSON.parse(fs.readFileSync(triggerFile, 'utf8'));
    
    // Increment patch version
    const versionParts = packageData.version.split('.');
    versionParts[2] = (parseInt(versionParts[2]) + 1).toString();
    packageData.version = versionParts.join('.');
    
    fs.writeFileSync(triggerFile, JSON.stringify(packageData, null, 2));
    console.log('✅ Updated version to:', packageData.version);
  } else {
    console.log('⚠️ Package.json not found, creating deployment trigger...');
    const triggerContent = {
      "name": "claude-code-ui-remote",
      "version": "1.0." + Date.now(),
      "description": "Claude Code UI deployed via GitHub Actions"
    };
    fs.writeFileSync(triggerFile, JSON.stringify(triggerContent, null, 2));
  }
  
  // Add changes to git
  console.log('📝 Adding changes to git...');
  execSync('git add appwrite-deployment/', { stdio: 'inherit' });
  
  // Commit changes
  const commitMessage = `deploy: Claude Code UI update ${new Date().toISOString()}`;
  console.log('💾 Committing changes...');
  execSync(`git commit -m "${commitMessage}"`, { stdio: 'inherit' });
  
  // Push to trigger GitHub Actions
  console.log('🚀 Pushing to trigger GitHub Actions deployment...');
  execSync('git push', { stdio: 'inherit' });
  
  console.log('');
  console.log('✅ GitHub Actions deployment initiated!');
  console.log('🔗 Check deployment status at: https://github.com/zrottmann/Claude-Code-Remote/actions');
  console.log('📱 Site will be live at: https://remote.appwrite.network');
  
} catch (error) {
  console.log('❌ Deployment failed:', error.message);
  process.exit(1);
}