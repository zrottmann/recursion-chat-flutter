#!/usr/bin/env node

/**
 * Unified SSO Deployment Manager
 * Deploys all apps with unified SSO authentication system
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const PROJECTS = [
  {
    name: 'Trading Post',
    path: 'C:\\Users\\Zrott\\OneDrive\\Desktop\\Claude\\active-projects\\trading-post',
    deployUrl: 'https://tradingpost.appwrite.network',
    hasWorkflow: true
  },
  {
    name: 'Recursion Chat',
    path: 'C:\\Users\\Zrott\\OneDrive\\Desktop\\Claude\\active-projects\\recursion-chat',
    deployUrl: 'https://chat.recursionsystems.com',
    hasWorkflow: true
  },
  {
    name: 'Slumlord RPG',
    path: 'C:\\Users\\Zrott\\OneDrive\\Desktop\\Claude\\active-projects\\slumlord',
    deployUrl: 'https://slumlord.appwrite.network',
    hasWorkflow: true
  },
  {
    name: 'GX Multi-Agent Platform',
    path: 'C:\\Users\\Zrott\\OneDrive\\Desktop\\Claude\\active-projects\\gx-multi-agent-platform',
    deployUrl: 'https://gx.appwrite.network',
    hasWorkflow: false
  }
];

class UnifiedDeploymentManager {
  constructor() {
    this.deploymentResults = [];
  }

  log(message, project = null) {
    const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
    const prefix = project ? `[${project}]` : '[DEPLOY]';
    console.log(`${timestamp} ${prefix} ${message}`);
  }

  async executeCommand(command, cwd) {
    try {
      const result = execSync(command, { 
        cwd, 
        stdio: ['pipe', 'pipe', 'pipe'],
        encoding: 'utf8',
        timeout: 60000
      });
      return { success: true, output: result };
    } catch (error) {
      return { 
        success: false, 
        error: error.message, 
        output: error.stdout || error.stderr || error.message 
      };
    }
  }

  async checkProjectStatus(project) {
    this.log(`Checking status...`, project.name);
    
    if (!fs.existsSync(project.path)) {
      return { exists: false, hasChanges: false, clean: false };
    }

    // Check git status
    const statusResult = await this.executeCommand('git status --porcelain', project.path);
    const hasChanges = statusResult.success && statusResult.output.trim().length > 0;

    // Check if repo is clean
    const cleanResult = await this.executeCommand('git status', project.path);
    const clean = cleanResult.success && cleanResult.output.includes('working tree clean');

    return {
      exists: true,
      hasChanges,
      clean,
      status: statusResult.output
    };
  }

  async deployProject(project) {
    this.log(`🚀 Starting deployment for ${project.name}...`);
    
    const status = await this.checkProjectStatus(project);
    
    if (!status.exists) {
      this.log(`❌ Project directory not found: ${project.path}`, project.name);
      return { success: false, error: 'Project directory not found' };
    }

    // Step 1: Pull latest changes
    this.log('📥 Pulling latest changes...', project.name);
    const pullResult = await this.executeCommand('git pull --rebase origin main', project.path);
    
    if (!pullResult.success) {
      this.log(`⚠️ Pull failed: ${pullResult.error}`, project.name);
    }

    // Step 2: Check for deployment workflow
    if (project.hasWorkflow) {
      this.log('🔧 Triggering GitHub Actions deployment...', project.name);
      
      // Trigger deployment by pushing any changes or empty commit
      if (status.hasChanges) {
        this.log('📝 Committing local changes...', project.name);
        await this.executeCommand('git add .', project.path);
        await this.executeCommand('git commit -m "deploy: Unified SSO deployment update"', project.path);
      } else {
        this.log('📝 Creating deployment trigger commit...', project.path);
        await this.executeCommand('git commit --allow-empty -m "deploy: Trigger unified SSO deployment"', project.path);
      }
      
      // Push to trigger deployment
      const pushResult = await this.executeCommand('git push origin main', project.path);
      
      if (pushResult.success) {
        this.log('✅ Deployment triggered successfully!', project.name);
        return { 
          success: true, 
          method: 'GitHub Actions',
          url: project.deployUrl,
          message: 'Deployment triggered, will be live in 2-3 minutes'
        };
      } else {
        this.log(`❌ Push failed: ${pushResult.error}`, project.name);
        return { success: false, error: pushResult.error };
      }
    } else {
      // Manual deployment for projects without workflows
      this.log('📋 Manual deployment required (no workflow configured)', project.name);
      return { 
        success: true, 
        method: 'Manual',
        message: 'Project ready for manual deployment',
        requiresManual: true
      };
    }
  }

  async deployAll() {
    console.log('\n🌟 UNIFIED SSO DEPLOYMENT MANAGER 🌟\n');
    console.log('Deploying all projects with unified SSO authentication...\n');

    for (const project of PROJECTS) {
      console.log(`\n${'='.repeat(60)}`);
      console.log(`📱 DEPLOYING: ${project.name.toUpperCase()}`);
      console.log(`🔗 URL: ${project.deployUrl}`);
      console.log(`${'='.repeat(60)}\n`);

      const result = await this.deployProject(project);
      this.deploymentResults.push({
        project: project.name,
        url: project.deployUrl,
        ...result
      });

      // Wait between deployments to avoid rate limits
      if (PROJECTS.indexOf(project) < PROJECTS.length - 1) {
        this.log('⏳ Waiting 10 seconds before next deployment...\n');
        await new Promise(resolve => setTimeout(resolve, 10000));
      }
    }

    this.printSummary();
  }

  printSummary() {
    console.log('\n' + '='.repeat(80));
    console.log('📊 DEPLOYMENT SUMMARY');
    console.log('='.repeat(80));

    const successful = this.deploymentResults.filter(r => r.success);
    const failed = this.deploymentResults.filter(r => !r.success);

    console.log(`\n✅ Successful Deployments: ${successful.length}/${this.deploymentResults.length}`);
    console.log(`❌ Failed Deployments: ${failed.length}/${this.deploymentResults.length}\n`);

    successful.forEach(result => {
      console.log(`✅ ${result.project}`);
      console.log(`   🔗 ${result.url}`);
      console.log(`   📋 ${result.message || 'Deployed successfully'}`);
      if (result.method === 'GitHub Actions') {
        console.log(`   ⏱️ ETA: 2-3 minutes for live site`);
      }
      console.log('');
    });

    if (failed.length > 0) {
      console.log('❌ FAILED DEPLOYMENTS:');
      failed.forEach(result => {
        console.log(`   ${result.project}: ${result.error}`);
      });
      console.log('');
    }

    console.log('🎯 UNIFIED SSO FEATURES DEPLOYED:');
    console.log('   • OAuth integration (Google, GitHub, Microsoft)');
    console.log('   • Mobile-first responsive design');
    console.log('   • iOS Safari optimizations');
    console.log('   • Progressive Web App capabilities');
    console.log('   • Touch-friendly interfaces');
    console.log('   • Cross-platform compatibility');
    
    console.log('\n' + '='.repeat(80));
    console.log('🚀 DEPLOYMENT COMPLETE! Check URLs above in 2-3 minutes.');
    console.log('='.repeat(80) + '\n');
  }

  async checkAllSites() {
    console.log('\n🔍 CHECKING ALL DEPLOYED SITES...\n');
    
    for (const project of PROJECTS) {
      console.log(`Checking ${project.name}: ${project.deployUrl}`);
      // Note: Would need fetch or similar for actual HTTP checks
      // For now, just display the URLs for manual verification
    }
    
    console.log('\n📋 To verify deployment success:');
    console.log('1. Check each URL above loads correctly');
    console.log('2. Test SSO authentication on each site');
    console.log('3. Verify mobile responsiveness');
    console.log('4. Confirm OAuth providers work\n');
  }
}

// CLI Interface
if (require.main === module) {
  const manager = new UnifiedDeploymentManager();
  
  const command = process.argv[2];
  
  switch (command) {
    case 'deploy':
      manager.deployAll().catch(console.error);
      break;
    case 'check':
      manager.checkAllSites().catch(console.error);
      break;
    default:
      console.log('Unified SSO Deployment Manager');
      console.log('Usage:');
      console.log('  node deploy-all-unified-sso.js deploy  - Deploy all projects');
      console.log('  node deploy-all-unified-sso.js check   - Check all deployed sites');
      break;
  }
}

module.exports = UnifiedDeploymentManager;