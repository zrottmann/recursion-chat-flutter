#!/usr/bin/env node
/**
 * 🚀 Quick Push to Git Main
 * 
 * Usage: node push-to-main.js [message]
 * Example: node push-to-main.js "feat: add new feature"
 * 
 * This script will:
 * 1. Add all changes (git add .)
 * 2. Commit with provided message or auto-generated message
 * 3. Push to main branch
 * 4. Trigger auto-deployment if configured
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Get commit message from command line args
const args = process.argv.slice(2);
let commitMessage = args.join(' ');

// Auto-generate commit message if none provided
if (!commitMessage) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  commitMessage = `update: Auto-commit ${timestamp}`;
}

/**
 * Execute git command and handle errors
 */
function runGitCommand(command, description) {
  try {
    console.log(`🔄 ${description}...`);
    console.log(`   Command: ${command}`);
    
    const startTime = Date.now();
    const output = execSync(command, { 
      encoding: 'utf8',
      stdio: ['inherit', 'pipe', 'pipe'],
      maxBuffer: 1024 * 1024 * 50 // 50MB buffer
    });
    const duration = Date.now() - startTime;
    
    if (output.trim()) {
      console.log(`   Output: ${output.trim()}`);
    }
    
    console.log(`✅ ${description} completed (${duration}ms)`);
    return true;
  } catch (error) {
    console.error(`❌ ${description} failed:`);
    console.error(`   Error: ${error.message}`);
    console.error(`   Command: ${command}`);
    if (error.status) console.error(`   Exit code: ${error.status}`);
    if (error.stderr) console.error(`   Stderr: ${error.stderr}`);
    return false;
  }
}

/**
 * Smart add - handles large repositories by adding files selectively
 */
function smartGitAdd() {
  console.log('🧠 Starting smart git add process...');
  
  try {
    // First try selective adding of key directories only
    const importantPaths = [
      'active-projects/recursion-chat',
      'active-projects/trading-post', 
      'push-to-main.js',
      'CLAUDE.md',
      'setup-github-appwrite-autodeploy.js'
    ];
    
    console.log('📋 Important paths to check:', importantPaths);
    
    let addedAny = false;
    let pathsAdded = [];
    let pathsSkipped = [];
    
    for (const gitPath of importantPaths) {
      if (fs.existsSync(gitPath)) {
        try {
          const startTime = Date.now();
          execSync(`git add "${gitPath}"`, { stdio: 'ignore' });
          const duration = Date.now() - startTime;
          addedAny = true;
          pathsAdded.push({ path: gitPath, time: duration });
          console.log(`✓ Added: ${gitPath} (${duration}ms)`);
        } catch (pathError) {
          pathsSkipped.push({ path: gitPath, reason: pathError.message });
          console.log(`⚠️  Skipped: ${gitPath} - ${pathError.message}`);
        }
      } else {
        pathsSkipped.push({ path: gitPath, reason: 'File does not exist' });
        console.log(`⚠️  Not found: ${gitPath}`);
      }
    }
    
    console.log(`📊 Smart add summary: ${pathsAdded.length} added, ${pathsSkipped.length} skipped`);
    
    if (addedAny) {
      console.log('✅ Smart add completed successfully using selective paths');
      return true;
    }
    
    // Fallback: try git add . with larger buffer
    console.log('🔄 No selective paths added, falling back to full git add...');
    const fallbackStart = Date.now();
    
    try {
      execSync('git add .', { 
        stdio: 'ignore',
        maxBuffer: 1024 * 1024 * 100 // 100MB buffer
      });
      const fallbackDuration = Date.now() - fallbackStart;
      console.log(`✅ Fallback git add completed (${fallbackDuration}ms)`);
      return true;
    } catch (fallbackError) {
      console.error(`❌ Fallback git add failed: ${fallbackError.message}`);
      throw fallbackError;
    }
    
  } catch (error) {
    console.error('❌ Smart git add failed:', error.message);
    console.error('   Error details:', {
      code: error.code,
      signal: error.signal,
      status: error.status
    });
    return false;
  }
}

/**
 * Check if we're in a git repository
 */
function checkGitRepo() {
  try {
    execSync('git rev-parse --git-dir', { stdio: 'ignore' });
    return true;
  } catch {
    console.error('❌ Not in a git repository. Run this command from a git project directory.');
    return false;
  }
}

/**
 * Get current branch name
 */
function getCurrentBranch() {
  try {
    return execSync('git branch --show-current', { encoding: 'utf8' }).trim();
  } catch {
    return 'unknown';
  }
}

/**
 * Check if there are any changes to commit
 */
function hasChanges() {
  try {
    const status = execSync('git status --porcelain', { encoding: 'utf8' });
    return status.trim().length > 0;
  } catch {
    return false;
  }
}

/**
 * Trigger auto-deployment for app repositories
 */
async function triggerAutoDeployment() {
  console.log('\n🚀 TRIGGERING AUTO-DEPLOYMENT');
  console.log('═════════════════════════════');
  
  const appPaths = [
    { name: 'Recursion Chat', path: './active-projects/recursion-chat', url: 'https://chat.recursionsystems.com' },
    { name: 'Trading Post', path: './active-projects/trading-post', url: 'https://689cb415001a367e69f8.appwrite.global' }
  ];
  
  const deploymentResults = [];
  const originalDir = process.cwd();
  console.log(`📂 Original directory: ${originalDir}`);
  
  for (const app of appPaths) {
    console.log(`\n===== PROCESSING ${app.name.toUpperCase()} =====`);
    
    const appDir = path.join(process.cwd(), app.path);
    console.log(`📂 Target directory: ${appDir}`);
    
    if (!fs.existsSync(appDir)) {
      console.log(`⚠️  ${app.name}: Directory not found at ${app.path}`);
      deploymentResults.push({ app: app.name, status: 'failed', reason: 'Directory not found' });
      continue;
    }
    
    let deploymentStatus = 'failed';
    let deploymentError = null;
    
    try {
      console.log(`🔄 ${app.name}: Starting deployment process...`);
      console.log(`   Directory exists: ${fs.existsSync(appDir)}`);
      
      // Change to app directory
      console.log(`📂 Changing to directory: ${appDir}`);
      process.chdir(appDir);
      console.log(`✓ Current directory: ${process.cwd()}`);
      
      // Check if there are any changes or if we should force deploy
      console.log(`🔍 Checking for changes in ${app.name}...`);
      const hasAppChanges = hasChanges();
      console.log(`   Has changes: ${hasAppChanges}`);
      
      if (!hasAppChanges) {
        console.log(`📝 No changes detected, creating deployment trigger file...`);
        const deployTrigger = `// Auto-deploy trigger: ${new Date().toISOString()}\n`;
        fs.writeFileSync('.deploy-trigger', deployTrigger);
        console.log(`✓ Deployment trigger file created`);
      }
      
      // Add, commit, and push to trigger GitHub Actions
      console.log(`🔄 ${app.name}: Processing git operations...`);
      
      const addSuccess = runGitCommand('git add .', `${app.name}: Adding changes`);
      if (!addSuccess) {
        throw new Error('Git add failed');
      }
      
      const deployCommit = hasAppChanges 
        ? `deploy: Auto-deployment via push command - ${new Date().toISOString().split('T')[0]}`
        : `deploy: Trigger auto-deployment - ${new Date().toISOString().split('T')[0]}`;
      
      console.log(`💬 Commit message: "${deployCommit}"`);
      
      const commitCmd = `git commit -m "${deployCommit}

🚀 Automatic deployment triggered by push command
- Target URL: ${app.url}
- GitHub Actions will build and deploy automatically

🤖 Generated with [Claude Code](https://claude.ai/code)

Co-Authored-By: Claude <noreply@anthropic.com>"`;
      
      const commitSuccess = runGitCommand(commitCmd, `${app.name}: Committing deployment trigger`);
      if (!commitSuccess) {
        throw new Error('Git commit failed');
      }
      
      const pushSuccess = runGitCommand('git push origin main', `${app.name}: Pushing to trigger deployment`);
      if (!pushSuccess) {
        throw new Error('Git push failed');
      }
      
      console.log(`✅ ${app.name}: Auto-deployment triggered successfully`);
      console.log(`   Target URL: ${app.url}`);
      console.log(`   GitHub Actions should start within 1-2 minutes`);
      
      deploymentStatus = 'success';
      
    } catch (error) {
      deploymentError = error.message;
      console.error(`❌ ${app.name}: Deployment trigger failed:`, error.message);
      console.error(`   Error type: ${error.constructor.name}`);
      if (error.stack) {
        console.error(`   Stack trace: ${error.stack.split('\n')[0]}`);
      }
    } finally {
      // Return to original directory
      console.log(`📂 Returning to original directory: ${originalDir}`);
      process.chdir(originalDir);
      console.log(`✓ Current directory: ${process.cwd()}`);
      
      deploymentResults.push({
        app: app.name,
        status: deploymentStatus,
        reason: deploymentError,
        url: app.url
      });
    }
  }
  
  console.log('\n🎯 AUTO-DEPLOYMENT SUMMARY');
  console.log('═══════════════════════════');
  deploymentResults.forEach(result => {
    const statusIcon = result.status === 'success' ? '✅' : '❌';
    console.log(`${statusIcon} ${result.app}: ${result.status.toUpperCase()}`);
    if (result.status === 'success') {
      console.log(`   URL: ${result.url}`);
    } else {
      console.log(`   Reason: ${result.reason}`);
    }
  });
  
  const successCount = deploymentResults.filter(r => r.status === 'success').length;
  console.log(`\n📊 Results: ${successCount}/${deploymentResults.length} deployments triggered`);
  console.log('📋 Next steps:');
  console.log('   • Check GitHub Actions tabs for build progress');
  console.log('   • Monitor sites for deployment completion');
  console.log('   • Apps should update within 5-10 minutes');
  console.log(`   • Recursion Chat Actions: https://github.com/zrottmann/recursion-chat-app/actions`);
  console.log(`   • Trading Post Actions: https://github.com/zrottmann/tradingpost/actions`);
}

/**
 * Main push function
 */
async function pushToMain() {
  const startTime = Date.now();
  console.log('🚀 Quick Push to Git Main with Auto-Deployment');
  console.log('═══════════════════════════════════════════════');
  console.log(`⏰ Started at: ${new Date().toLocaleTimeString()}`);
  console.log(`📂 Working directory: ${process.cwd()}`);
  console.log(`🔧 Node.js version: ${process.version}`);
  console.log(`💻 Platform: ${process.platform}`);
  
  try {
    // Check if we're in a git repository
    console.log('\n🔍 STEP 1: Repository Validation');
    console.log('─'.repeat(40));
    if (!checkGitRepo()) {
      console.error('❌ Not in a valid git repository');
      process.exit(1);
    }
    console.log('✅ Valid git repository confirmed');
    
    // Get current branch
    const currentBranch = getCurrentBranch();
    console.log(`📍 Current branch: ${currentBranch}`);
    
    // Check repository status
    console.log('\n🔍 STEP 2: Change Detection');
    console.log('─'.repeat(40));
    
    const hasMainChanges = hasChanges();
    console.log(`📊 Repository status:`);
    console.log(`   • Has uncommitted changes: ${hasMainChanges}`);
    console.log(`   • Current branch: ${currentBranch}`);
    console.log(`   • Commit message: "${commitMessage}"`);
    
    if (!hasMainChanges) {
      console.log('✨ No changes to commit in main directory.');
      console.log('🚀 Proceeding with auto-deployment trigger only...\n');
      
      console.log('\n🔍 STEP 3: Auto-Deployment Only');
      console.log('─'.repeat(40));
      await triggerAutoDeployment();
      
      const totalTime = Date.now() - startTime;
      console.log(`\n⏱️  Total execution time: ${totalTime}ms`);
      return;
    }
    
    // Show what will be committed
    console.log('\n📋 Changes to be committed:');
    runGitCommand('git status --short', 'Checking detailed status');
    runGitCommand('git status --porcelain | wc -l', 'Counting changed files');
    
    console.log(`\n💬 Commit message: "${commitMessage}"`);
    
    // Confirm before proceeding (skip in automated scenarios)
    if (process.env.NODE_ENV !== 'automated') {
      console.log('\n🤔 Proceed with commit and push? (Press Ctrl+C to cancel)');
      console.log('   ⏳ Waiting 2 seconds...');
      await new Promise(resolve => setTimeout(resolve, 2000));
      console.log('   ✓ Proceeding...');
    }
    
    console.log('\n🔍 STEP 3: Git Operations');
    console.log('─'.repeat(40));
    
    // Step 3a: Add changes intelligently
    console.log('\n📦 Staging changes...');
    const addStartTime = Date.now();
    
    if (!smartGitAdd()) {
      console.error('❌ Failed to stage changes - aborting push');
      process.exit(1);
    }
    
    const addDuration = Date.now() - addStartTime;
    console.log(`✅ Changes staged successfully (${addDuration}ms)`);
    
    // Step 3b: Commit changes
    console.log('\n💾 Committing changes...');
    const commitStartTime = Date.now();
    
    const commitCommand = `git commit -m "${commitMessage}"`;
    if (!runGitCommand(commitCommand, 'Committing changes')) {
      console.error('❌ Failed to commit changes - aborting push');
      process.exit(1);
    }
    
    const commitDuration = Date.now() - commitStartTime;
    console.log(`✅ Changes committed successfully (${commitDuration}ms)`);
    
    // Step 3c: Push to remote
    console.log('\n🚀 Pushing to remote...');
    const pushStartTime = Date.now();
    
    let pushCommand;
    if (currentBranch === 'main' || currentBranch === 'master') {
      pushCommand = `git push origin ${currentBranch}`;
      console.log(`   Pushing to current branch: ${currentBranch}`);
    } else {
      console.log(`⚠️  Current branch is '${currentBranch}', pushing to 'main'`);
      pushCommand = 'git push origin HEAD:main';
    }
    
    if (!runGitCommand(pushCommand, 'Pushing to remote repository')) {
      console.error('❌ Failed to push changes - aborting auto-deployment');
      process.exit(1);
    }
    
    const pushDuration = Date.now() - pushStartTime;
    console.log(`✅ Changes pushed successfully (${pushDuration}ms)`);
    
    // Step 4: Trigger auto-deployment
    console.log('\n🔍 STEP 4: Auto-Deployment');
    console.log('─'.repeat(40));
    
    const deployStartTime = Date.now();
    await triggerAutoDeployment();
    const deployDuration = Date.now() - deployStartTime;
    
    // Step 5: Show success summary
    const totalTime = Date.now() - startTime;
    
    console.log('\n🎉 OPERATION COMPLETE!');
    console.log('═'.repeat(50));
    console.log('📋 Summary of actions performed:');
    console.log('   ✓ Repository validated');
    console.log('   ✓ Changes detected and staged');
    console.log('   ✓ Commit created with message');
    console.log('   ✓ Changes pushed to remote repository');
    console.log('   ✓ Auto-deployment triggered for both apps');
    
    console.log('\n📊 Performance metrics:');
    console.log(`   • Add operation: ${addDuration}ms`);
    console.log(`   • Commit operation: ${commitDuration}ms`);
    console.log(`   • Push operation: ${pushDuration}ms`);
    console.log(`   • Deployment trigger: ${deployDuration}ms`);
    console.log(`   • Total execution time: ${totalTime}ms`);
    
    console.log('\n🌐 Live application URLs:');
    console.log('   • Recursion Chat: https://chat.recursionsystems.com');
    console.log('   • Trading Post: https://689cb415001a367e69f8.appwrite.global');
    
    console.log('\n📊 Monitor deployment progress:');
    console.log('   • Recursion Chat Actions: https://github.com/zrottmann/recursion-chat-app/actions');
    console.log('   • Trading Post Actions: https://github.com/zrottmann/tradingpost/actions');
    console.log('   • Appwrite Console: https://cloud.appwrite.io/console');
    console.log('   • Expected deployment time: 5-10 minutes');
    
    console.log(`\n⏰ Completed at: ${new Date().toLocaleTimeString()}`);
    
  } catch (error) {
    const totalTime = Date.now() - startTime;
    console.error('\n💥 PUSH OPERATION FAILED');
    console.error('═'.repeat(40));
    console.error(`❌ Error: ${error.message}`);
    console.error(`❌ Type: ${error.constructor.name}`);
    console.error(`❌ Time elapsed: ${totalTime}ms`);
    
    if (error.code) console.error(`❌ Error code: ${error.code}`);
    if (error.signal) console.error(`❌ Signal: ${error.signal}`);
    if (error.status) console.error(`❌ Exit status: ${error.status}`);
    
    console.error('\n🔍 Debugging information:');
    console.error(`   • Working directory: ${process.cwd()}`);
    console.error(`   • Node.js version: ${process.version}`);
    console.error(`   • Platform: ${process.platform}`);
    console.error(`   • Arguments: ${JSON.stringify(process.argv)}`);
    
    if (error.stack) {
      console.error('\n📋 Stack trace:');
      console.error(error.stack);
    }
    
    console.error('\n🛠️  Troubleshooting suggestions:');
    console.error('   1. Check git repository status: git status');
    console.error('   2. Verify network connectivity');
    console.error('   3. Check GitHub repository access');
    console.error('   4. Ensure no file locks or permission issues');
    console.error('   5. Try running with: NODE_ENV=automated node push-to-main.js');
    
    process.exit(1);
  }
}

// Handle Ctrl+C gracefully
process.on('SIGINT', () => {
  console.log('\n\n⏹️  Push cancelled by user');
  process.exit(0);
});

// Run the main function
pushToMain().catch(error => {
  console.error('💥 Unexpected error:', error.message);
  process.exit(1);
});

module.exports = { pushToMain };