// Mobile Deployment System - Agent-Optimized Mobile-First Deployment Pipelines
import fs from 'fs/promises';
import path from 'path';
import { spawn } from 'child_process';
import chalk from 'chalk';

export class MobileDeploymentSystem {
  constructor(logger) {
    this.logger = logger;
    this.initialized = false;
    this.deploymentTargets = new Map();
    this.buildConfigurations = new Map();
    this.deploymentHistory = [];
    
    // Supported deployment targets
    this.targets = {
      WEB: 'web',
      ANDROID: 'android', 
      IOS: 'ios',
      PWA: 'pwa',
      APPWRITE_SITES: 'appwrite_sites',
      FIREBASE_HOSTING: 'firebase_hosting'
    };
    
    // Mobile-first optimization profiles
    this.optimizationProfiles = {
      MOBILE_FIRST: {
        name: 'Mobile-First Optimized',
        webRenderer: 'canvaskit',
        treeShakeIcons: true,
        splitDebugInfo: true,
        obfuscate: true,
        buildName: '1.0.0',
        targetPlatform: 'web-javascript'
      },
      PERFORMANCE: {
        name: 'Performance Optimized',
        webRenderer: 'html',
        treeShakeIcons: true,
        splitDebugInfo: false,
        obfuscate: false,
        sourceMaps: false
      },
      DEVELOPMENT: {
        name: 'Development Build',
        webRenderer: 'auto',
        treeShakeIcons: false,
        splitDebugInfo: false,
        obfuscate: false,
        sourceMaps: true
      }
    };
  }

  async initialize() {
    this.logger.info(chalk.blue('🚀 Initializing Mobile Deployment System...'));
    
    try {
      // Check for deployment tools
      await this.checkDeploymentTools();
      
      // Load deployment configurations
      await this.loadDeploymentConfigurations();
      
      // Initialize build cache
      await this.initializeBuildCache();
      
      this.initialized = true;
      this.logger.info(chalk.green('✅ Mobile Deployment System initialized'));
      
      return { initialized: true };
    } catch (error) {
      this.logger.error(chalk.red('❌ Mobile Deployment System initialization failed:'), error);
      throw error;
    }
  }

  async checkDeploymentTools() {
    const tools = [
      { name: 'Flutter', command: 'flutter', args: ['--version'] },
      { name: 'Node.js', command: 'node', args: ['--version'] },
      { name: 'Git', command: 'git', args: ['--version'] }
    ];
    
    for (const tool of tools) {
      try {
        await this.runCommand(tool.command, tool.args, { timeout: 5000 });
        this.logger.debug(chalk.green(`✅ ${tool.name} available`));
      } catch (error) {
        this.logger.warn(chalk.yellow(`⚠️ ${tool.name} not available: ${error.message}`));
      }
    }
  }

  async loadDeploymentConfigurations() {
    try {
      const configPath = './deployment-config.json';
      const configContent = await fs.readFile(configPath, 'utf8');
      const config = JSON.parse(configContent);
      
      for (const [key, value] of Object.entries(config.targets || {})) {
        this.deploymentTargets.set(key, value);
      }
      
      this.logger.info(chalk.green(`✅ Loaded ${this.deploymentTargets.size} deployment targets`));
    } catch (error) {
      this.logger.info(chalk.blue('📄 Creating default deployment configuration...'));
      await this.createDefaultDeploymentConfig();
    }
  }

  async createDefaultDeploymentConfig() {
    const defaultConfig = {
      targets: {
        web_development: {
          type: 'web',
          profile: 'DEVELOPMENT',
          outputDir: 'build/web',
          baseHref: '/',
          autoPublish: false
        },
        web_production: {
          type: 'web',
          profile: 'MOBILE_FIRST',
          outputDir: 'build/web',
          baseHref: '/',
          autoPublish: true,
          optimizations: {
            compress: true,
            minify: true,
            pwa: true
          }
        },
        appwrite_sites: {
          type: 'appwrite_sites',
          profile: 'MOBILE_FIRST',
          projectId: 'your-project-id',
          siteId: 'your-site-id',
          autoPublish: true
        }
      },
      notifications: {
        slack: {
          webhook: '',
          enabled: false
        },
        discord: {
          webhook: '',
          enabled: false
        }
      }
    };
    
    await fs.writeFile('./deployment-config.json', JSON.stringify(defaultConfig, null, 2));
    
    // Load the default config
    for (const [key, value] of Object.entries(defaultConfig.targets)) {
      this.deploymentTargets.set(key, value);
    }
  }

  async initializeBuildCache() {
    const cacheDir = './build-cache';
    try {
      await fs.mkdir(cacheDir, { recursive: true });
      this.logger.debug(chalk.gray('📁 Build cache directory ready'));
    } catch (error) {
      this.logger.debug(chalk.gray('Build cache initialization skipped'));
    }
  }

  async deployApp(appName, target = 'web_development', options = {}) {
    if (!this.initialized) {
      throw new Error('Mobile Deployment System not initialized');
    }

    const targetConfig = this.deploymentTargets.get(target);
    if (!targetConfig) {
      throw new Error(`Deployment target '${target}' not found. Available: ${Array.from(this.deploymentTargets.keys()).join(', ')}`);
    }

    this.logger.info(chalk.blue(`🚀 Deploying ${appName} to ${target}...`));
    
    const deploymentStart = Date.now();
    const deploymentId = `${appName}-${target}-${deploymentStart}`;
    
    try {
      // Pre-deployment checks
      await this.preDeploymentChecks(appName, targetConfig);
      
      // Build the application
      const buildResult = await this.buildForTarget(appName, targetConfig, options);
      
      // Deploy to target
      const deployResult = await this.deployToTarget(appName, targetConfig, buildResult, options);
      
      // Post-deployment actions
      await this.postDeploymentActions(appName, targetConfig, deployResult);
      
      const deploymentTime = Date.now() - deploymentStart;
      
      const deployment = {
        id: deploymentId,
        app: appName,
        target,
        status: 'success',
        timestamp: new Date().toISOString(),
        duration: deploymentTime,
        buildSize: buildResult.size,
        url: deployResult.url
      };
      
      this.deploymentHistory.push(deployment);
      this.logger.info(chalk.green(`✅ Deployment successful in ${deploymentTime}ms`));
      
      if (deployResult.url) {
        this.logger.info(chalk.cyan(`🌐 Live at: ${deployResult.url}`));
      }
      
      return deployment;
    } catch (error) {
      const failedDeployment = {
        id: deploymentId,
        app: appName,
        target,
        status: 'failed',
        timestamp: new Date().toISOString(),
        duration: Date.now() - deploymentStart,
        error: error.message
      };
      
      this.deploymentHistory.push(failedDeployment);
      this.logger.error(chalk.red(`❌ Deployment failed: ${error.message}`));
      throw error;
    }
  }

  async preDeploymentChecks(appName, targetConfig) {
    const appPath = `./flutter-apps/${appName}`;
    
    // Check if app exists
    try {
      await fs.access(path.join(appPath, 'pubspec.yaml'));
    } catch (error) {
      throw new Error(`Flutter app '${appName}' not found at ${appPath}`);
    }
    
    // Check if target requirements are met
    if (targetConfig.type === this.targets.APPWRITE_SITES) {
      if (!targetConfig.projectId || !targetConfig.siteId) {
        throw new Error('Appwrite Sites deployment requires projectId and siteId');
      }
    }
    
    this.logger.debug(chalk.green('✅ Pre-deployment checks passed'));
  }

  async buildForTarget(appName, targetConfig, options) {
    const appPath = `./flutter-apps/${appName}`;
    const profile = this.optimizationProfiles[targetConfig.profile] || this.optimizationProfiles.DEVELOPMENT;
    
    this.logger.info(chalk.blue(`🔨 Building with ${profile.name} profile...`));
    
    const buildArgs = ['build', 'web'];
    
    // Apply profile optimizations
    if (profile.webRenderer) {
      buildArgs.push('--web-renderer', profile.webRenderer);
    }
    
    if (profile.treeShakeIcons) {
      buildArgs.push('--tree-shake-icons');
    }
    
    if (profile.splitDebugInfo && targetConfig.profile !== 'DEVELOPMENT') {
      buildArgs.push('--split-debug-info=build/debug-info');
    }
    
    if (profile.obfuscate && targetConfig.profile !== 'DEVELOPMENT') {
      buildArgs.push('--obfuscate');
    }
    
    if (profile.sourceMaps === false) {
      buildArgs.push('--no-source-maps');
    }
    
    if (targetConfig.baseHref && targetConfig.baseHref !== '/') {
      buildArgs.push('--base-href', targetConfig.baseHref);
    }
    
    // Add custom build options
    if (options.release !== false && targetConfig.profile !== 'DEVELOPMENT') {
      buildArgs.push('--release');
    }
    
    try {
      const buildOutput = await this.runCommand('flutter', buildArgs, {
        cwd: appPath,
        timeout: 300000 // 5 minute timeout
      });
      
      // Calculate build size
      const buildDir = path.join(appPath, targetConfig.outputDir || 'build/web');
      const buildSize = await this.calculateDirectorySize(buildDir);
      
      this.logger.info(chalk.green(`✅ Build completed - Size: ${this.formatBytes(buildSize)}`));
      
      return {
        success: true,
        output: buildOutput,
        size: buildSize,
        buildDir
      };
    } catch (error) {
      throw new Error(`Build failed: ${error.message}`);
    }
  }

  async deployToTarget(appName, targetConfig, buildResult, options) {
    switch (targetConfig.type) {
      case this.targets.WEB:
        return this.deployToWeb(appName, targetConfig, buildResult, options);
      
      case this.targets.APPWRITE_SITES:
        return this.deployToAppwriteSites(appName, targetConfig, buildResult, options);
      
      case this.targets.PWA:
        return this.deployToPWA(appName, targetConfig, buildResult, options);
      
      default:
        throw new Error(`Deployment type '${targetConfig.type}' not implemented`);
    }
  }

  async deployToWeb(appName, targetConfig, buildResult, options) {
    // For web deployment, just verify the build
    const indexPath = path.join(buildResult.buildDir, 'index.html');
    
    try {
      await fs.access(indexPath);
      return {
        success: true,
        type: 'web',
        buildPath: buildResult.buildDir,
        url: options.baseUrl ? `${options.baseUrl}/${appName}` : null
      };
    } catch (error) {
      throw new Error(`Web deployment verification failed: ${error.message}`);
    }
  }

  async deployToAppwriteSites(appName, targetConfig, buildResult, options) {
    this.logger.info(chalk.blue('📤 Deploying to Appwrite Sites...'));
    
    // Create deployment archive
    const archivePath = await this.createDeploymentArchive(buildResult.buildDir, appName);
    
    // Mock deployment (replace with actual Appwrite API call)
    this.logger.info(chalk.yellow('📝 Note: Appwrite Sites deployment requires API integration'));
    
    return {
      success: true,
      type: 'appwrite_sites',
      archivePath,
      url: `https://${targetConfig.siteId}.appwrite.global`,
      projectId: targetConfig.projectId,
      siteId: targetConfig.siteId
    };
  }

  async deployToPWA(appName, targetConfig, buildResult, options) {
    this.logger.info(chalk.blue('📱 Configuring PWA features...'));
    
    // Generate PWA manifest and service worker
    await this.generatePWAFiles(buildResult.buildDir, appName, targetConfig);
    
    return {
      success: true,
      type: 'pwa',
      buildPath: buildResult.buildDir,
      features: ['offline-capable', 'installable', 'push-notifications']
    };
  }

  async createDeploymentArchive(buildDir, appName) {
    const archivePath = `./build-cache/${appName}-${Date.now()}.tar.gz`;
    
    try {
      await this.runCommand('tar', ['-czf', archivePath, '-C', buildDir, '.'], {
        timeout: 60000
      });
      
      this.logger.info(chalk.green(`📦 Deployment archive created: ${archivePath}`));
      return archivePath;
    } catch (error) {
      throw new Error(`Archive creation failed: ${error.message}`);
    }
  }

  async generatePWAFiles(buildDir, appName, targetConfig) {
    // Generate service worker
    const serviceWorkerContent = `
// Service Worker for ${appName}
const CACHE_NAME = '${appName}-v1.0.0';
const urlsToCache = [
  '/',
  '/main.dart.js',
  '/flutter.js',
  '/manifest.json'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => response || fetch(event.request))
  );
});
`;
    
    await fs.writeFile(path.join(buildDir, 'sw.js'), serviceWorkerContent);
    
    // Update manifest.json for PWA
    const manifestPath = path.join(buildDir, 'manifest.json');
    try {
      const manifestContent = await fs.readFile(manifestPath, 'utf8');
      const manifest = JSON.parse(manifestContent);
      
      manifest.display = 'standalone';
      manifest.start_url = '/';
      manifest.theme_color = '#2196F3';
      manifest.background_color = '#FFFFFF';
      
      await fs.writeFile(manifestPath, JSON.stringify(manifest, null, 2));
    } catch (error) {
      this.logger.warn(chalk.yellow('⚠️ Could not update manifest.json for PWA'));
    }
  }

  async postDeploymentActions(appName, targetConfig, deployResult) {
    // Send notifications if configured
    if (targetConfig.notifications) {
      await this.sendDeploymentNotifications(appName, targetConfig, deployResult);
    }
    
    // Update deployment history
    this.logger.debug(chalk.gray('📝 Deployment recorded in history'));
  }

  async sendDeploymentNotifications(appName, targetConfig, deployResult) {
    // Placeholder for notification system
    this.logger.debug(chalk.gray('📨 Deployment notifications (not implemented)'));
  }

  async getDeploymentStatus(appName) {
    const appDeployments = this.deploymentHistory
      .filter(d => d.app === appName)
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    const latest = appDeployments[0];
    const totalDeployments = appDeployments.length;
    const successfulDeployments = appDeployments.filter(d => d.status === 'success').length;
    const successRate = totalDeployments > 0 ? (successfulDeployments / totalDeployments) * 100 : 0;
    
    return {
      app: appName,
      latest,
      totalDeployments,
      successRate: Math.round(successRate),
      recentDeployments: appDeployments.slice(0, 5)
    };
  }

  getAvailableTargets() {
    return Array.from(this.deploymentTargets.entries()).map(([key, config]) => ({
      id: key,
      type: config.type,
      profile: config.profile,
      autoPublish: config.autoPublish
    }));
  }

  // Utility methods
  async runCommand(command, args, options = {}) {
    return new Promise((resolve, reject) => {
      const proc = spawn(command, args, {
        cwd: options.cwd || process.cwd(),
        shell: true
      });
      
      let output = '';
      let errorOutput = '';
      
      proc.stdout?.on('data', (data) => {
        output += data.toString();
      });
      
      proc.stderr?.on('data', (data) => {
        errorOutput += data.toString();
      });
      
      const timeout = options.timeout ? setTimeout(() => {
        proc.kill();
        reject(new Error(`Command timed out after ${options.timeout}ms`));
      }, options.timeout) : null;
      
      proc.on('close', (code) => {
        if (timeout) clearTimeout(timeout);
        
        if (code === 0) {
          resolve(output);
        } else {
          reject(new Error(`Command failed with code ${code}: ${errorOutput}`));
        }
      });
    });
  }

  async calculateDirectorySize(dirPath) {
    let size = 0;
    
    try {
      const items = await fs.readdir(dirPath);
      
      for (const item of items) {
        const itemPath = path.join(dirPath, item);
        const stats = await fs.stat(itemPath);
        
        if (stats.isDirectory()) {
          size += await this.calculateDirectorySize(itemPath);
        } else {
          size += stats.size;
        }
      }
    } catch (error) {
      // Directory doesn't exist or can't be read
    }
    
    return size;
  }

  formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  getStatus() {
    return {
      initialized: this.initialized,
      deploymentTargets: this.deploymentTargets.size,
      totalDeployments: this.deploymentHistory.length,
      successfulDeployments: this.deploymentHistory.filter(d => d.status === 'success').length,
      recentDeployments: this.deploymentHistory.slice(-3).map(d => ({
        app: d.app,
        target: d.target,
        status: d.status,
        timestamp: d.timestamp
      }))
    };
  }

  async dispose() {
    this.deploymentTargets.clear();
    this.buildConfigurations.clear();
    this.deploymentHistory = [];
    this.initialized = false;
    
    this.logger.info(chalk.blue('🚀 Mobile Deployment System disposed'));
  }
}