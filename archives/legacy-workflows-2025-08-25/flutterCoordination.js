// Flutter Coordination System - Advanced Flutter App Management
import fs from 'fs/promises';
import path from 'path';
import { spawn } from 'child_process';
import chalk from 'chalk';
import { FlutterTemplateGenerator } from '../services/flutterTemplateGenerator.js';

export class FlutterCoordinationSystem {
  constructor(logger) {
    this.logger = logger;
    this.initialized = false;
    this.flutterApps = new Map();
    this.sharedLibraries = new Map();
    this.buildQueue = [];
    this.testSuites = new Map();
    this.templateGenerator = new FlutterTemplateGenerator(logger);
    
    // Flutter project detection patterns
    this.flutterPatterns = {
      pubspecYaml: 'pubspec.yaml',
      libDirectory: 'lib',
      mainDart: 'lib/main.dart',
      testDirectory: 'test',
      androidDirectory: 'android',
      iosDirectory: 'ios'
    };
    
    // Supported Flutter project types
    this.projectTypes = {
      GAME: 'game',
      CHAT: 'chat',
      ECOMMERCE: 'ecommerce',
      ADMIN: 'admin',
      SHARED_LIB: 'shared_lib'
    };
  }

  async initialize() {
    this.logger.info(chalk.blue('📱 Initializing Flutter Coordination System...'));
    
    try {
      // Check Flutter installation
      await this.verifyFlutterInstallation();
      
      // Scan for existing Flutter apps
      await this.scanFlutterApps();
      
      // Initialize shared libraries
      await this.initializeSharedLibraries();
      
      // Set up build monitoring
      this.setupBuildMonitoring();
      
      this.initialized = true;
      this.logger.info(chalk.green('✅ Flutter Coordination System initialized'));
      
      return {
        initialized: true,
        appsFound: this.flutterApps.size,
        sharedLibraries: this.sharedLibraries.size
      };
    } catch (error) {
      this.logger.error(chalk.red('❌ Flutter Coordination System initialization failed:'), error);
      throw error;
    }
  }

  async verifyFlutterInstallation() {
    return new Promise((resolve, reject) => {
      const flutter = spawn('flutter', ['--version'], { shell: true });
      let output = '';
      
      flutter.stdout.on('data', (data) => {
        output += data.toString();
      });
      
      flutter.on('close', (code) => {
        if (code === 0) {
          this.flutterVersion = output.split('\n')[0];
          this.logger.info(chalk.green(`✅ Flutter detected: ${this.flutterVersion}`));
          resolve(true);
        } else {
          reject(new Error('Flutter not found. Please install Flutter SDK'));
        }
      });
    });
  }

  async scanFlutterApps() {
    const basePath = './flutter-apps';
    
    try {
      const dirs = await fs.readdir(basePath);
      
      for (const dir of dirs) {
        const appPath = path.join(basePath, dir);
        const stats = await fs.stat(appPath);
        
        if (stats.isDirectory()) {
          const appInfo = await this.analyzeFlutterApp(appPath, dir);
          if (appInfo) {
            this.flutterApps.set(dir, appInfo);
            this.logger.info(chalk.blue(`📱 Found Flutter app: ${chalk.cyan(dir)} (${appInfo.type})`));
          }
        }
      }
    } catch (error) {
      this.logger.warn(chalk.yellow('⚠️ Flutter apps directory not found, creating...'));
      await fs.mkdir(basePath, { recursive: true });
    }
  }

  async analyzeFlutterApp(appPath, appName) {
    try {
      // Check if it's a valid Flutter project
      await fs.access(path.join(appPath, this.flutterPatterns.pubspecYaml));
      await fs.access(path.join(appPath, this.flutterPatterns.libDirectory));
      
      // Read pubspec.yaml for project info
      const pubspecContent = await fs.readFile(
        path.join(appPath, this.flutterPatterns.pubspecYaml), 
        'utf8'
      );
      
      // Determine project type based on dependencies and structure
      const projectType = this.detectProjectType(pubspecContent, appName);
      
      // Check for main.dart
      const hasMain = await this.fileExists(path.join(appPath, this.flutterPatterns.mainDart));
      
      // Analyze dependencies
      const dependencies = this.extractDependencies(pubspecContent);
      
      // Check build status
      const buildStatus = await this.checkBuildStatus(appPath);
      
      return {
        name: appName,
        path: appPath,
        type: projectType,
        hasMain,
        dependencies,
        buildStatus,
        lastAnalyzed: new Date().toISOString(),
        platforms: await this.detectSupportedPlatforms(appPath),
        testCoverage: await this.analyzeTestCoverage(appPath)
      };
    } catch (error) {
      this.logger.debug(chalk.gray(`Skipping ${appName}: not a valid Flutter project`));
      return null;
    }
  }

  detectProjectType(pubspecContent, appName) {
    const lowerName = appName.toLowerCase();
    const lowerContent = pubspecContent.toLowerCase();
    
    // Game detection
    if (lowerName.includes('slum') || lowerName.includes('game') || lowerName.includes('arpg') ||
        lowerContent.includes('bonfire') || lowerContent.includes('flame')) {
      return this.projectTypes.GAME;
    }
    
    // Chat detection
    if (lowerName.includes('chat') || lowerName.includes('recursion') ||
        lowerContent.includes('websocket') || lowerContent.includes('socket_io')) {
      return this.projectTypes.CHAT;
    }
    
    // E-commerce detection
    if (lowerName.includes('trading') || lowerName.includes('marketplace') || lowerName.includes('shop') ||
        lowerContent.includes('stripe') || lowerContent.includes('payment')) {
      return this.projectTypes.ECOMMERCE;
    }
    
    // Admin detection
    if (lowerName.includes('admin') || lowerName.includes('console') ||
        lowerContent.includes('admin') || lowerContent.includes('dashboard')) {
      return this.projectTypes.ADMIN;
    }
    
    // Shared library detection
    if (lowerName.includes('shared') || lowerName.includes('common')) {
      return this.projectTypes.SHARED_LIB;
    }
    
    return 'unknown';
  }

  extractDependencies(pubspecContent) {
    const dependencies = [];
    const lines = pubspecContent.split('\n');
    let inDependencies = false;
    
    for (const line of lines) {
      if (line.trim() === 'dependencies:') {
        inDependencies = true;
        continue;
      }
      
      if (inDependencies && line.startsWith('dev_dependencies:')) {
        break;
      }
      
      if (inDependencies && line.trim() && !line.startsWith('#')) {
        const match = line.match(/^\s+([^:]+):\s*(.+)$/);
        if (match) {
          dependencies.push({
            name: match[1].trim(),
            version: match[2].trim()
          });
        }
      }
    }
    
    return dependencies;
  }

  async detectSupportedPlatforms(appPath) {
    const platforms = [];
    
    const platformChecks = [
      { name: 'android', dir: 'android' },
      { name: 'ios', dir: 'ios' },
      { name: 'web', dir: 'web' },
      { name: 'windows', dir: 'windows' },
      { name: 'macos', dir: 'macos' },
      { name: 'linux', dir: 'linux' }
    ];
    
    for (const platform of platformChecks) {
      if (await this.fileExists(path.join(appPath, platform.dir))) {
        platforms.push(platform.name);
      }
    }
    
    return platforms;
  }

  async checkBuildStatus(appPath) {
    try {
      // Check if build directory exists
      const buildPath = path.join(appPath, 'build');
      await fs.access(buildPath);
      
      // Get build timestamp
      const stats = await fs.stat(buildPath);
      
      return {
        status: 'built',
        lastBuild: stats.mtime.toISOString(),
        buildPath
      };
    } catch (error) {
      return {
        status: 'not_built',
        lastBuild: null,
        buildPath: null
      };
    }
  }

  async analyzeTestCoverage(appPath) {
    try {
      const testDir = path.join(appPath, 'test');
      await fs.access(testDir);
      
      const testFiles = await this.findFiles(testDir, '.dart');
      const libFiles = await this.findFiles(path.join(appPath, 'lib'), '.dart');
      
      const coverage = testFiles.length > 0 ? (testFiles.length / libFiles.length) * 100 : 0;
      
      return {
        hasTests: testFiles.length > 0,
        testFiles: testFiles.length,
        sourceFiles: libFiles.length,
        coverage: Math.min(100, coverage)
      };
    } catch (error) {
      return {
        hasTests: false,
        testFiles: 0,
        sourceFiles: 0,
        coverage: 0
      };
    }
  }

  async initializeSharedLibraries() {
    const sharedPath = './flutter-apps/shared';
    
    try {
      await fs.access(sharedPath);
      const sharedInfo = await this.analyzeFlutterApp(sharedPath, 'shared');
      if (sharedInfo) {
        this.sharedLibraries.set('shared', sharedInfo);
        this.logger.info(chalk.green('✅ Shared Flutter library detected'));
      }
    } catch (error) {
      this.logger.info(chalk.blue('📚 Creating shared Flutter library structure...'));
      await this.createSharedLibrary();
    }
  }

  async createSharedLibrary() {
    const sharedPath = './flutter-apps/shared';
    
    await fs.mkdir(path.join(sharedPath, 'lib', 'services'), { recursive: true });
    await fs.mkdir(path.join(sharedPath, 'lib', 'utils'), { recursive: true });
    await fs.mkdir(path.join(sharedPath, 'lib', 'widgets'), { recursive: true });
    
    // Create basic pubspec.yaml for shared library
    const pubspecContent = `name: shared_flutter_lib
description: Shared Flutter components and utilities
version: 1.0.0

environment:
  sdk: ">=3.0.0 <4.0.0"
  flutter: ">=3.0.0"

dependencies:
  flutter:
    sdk: flutter
  provider: ^6.0.5
  http: ^1.1.0
  shared_preferences: ^2.2.2
  appwrite: ^11.0.0

dev_dependencies:
  flutter_test:
    sdk: flutter
  flutter_lints: ^3.0.1
`;
    
    await fs.writeFile(path.join(sharedPath, 'pubspec.yaml'), pubspecContent);
    this.logger.info(chalk.green('✅ Shared Flutter library created'));
  }

  setupBuildMonitoring() {
    this.buildMonitor = setInterval(async () => {
      // Monitor build queue and process builds
      if (this.buildQueue.length > 0) {
        const buildJob = this.buildQueue.shift();
        await this.processBuild(buildJob);
      }
    }, 5000);
  }

  async buildFlutterApp(appName, platform = 'web', options = {}) {
    const app = this.flutterApps.get(appName);
    if (!app) {
      throw new Error(`Flutter app '${appName}' not found`);
    }

    this.logger.info(chalk.blue(`🔨 Building ${appName} for ${platform}...`));
    
    const buildJob = {
      appName,
      app,
      platform,
      options,
      timestamp: Date.now()
    };
    
    this.buildQueue.push(buildJob);
    
    return new Promise((resolve, reject) => {
      buildJob.resolve = resolve;
      buildJob.reject = reject;
    });
  }

  async processBuild(buildJob) {
    const { app, platform, options, resolve, reject } = buildJob;
    
    try {
      const buildArgs = ['build', platform];
      
      if (options.release) {
        buildArgs.push('--release');
      }
      
      if (options.webRenderer) {
        buildArgs.push('--web-renderer', options.webRenderer);
      }
      
      const flutter = spawn('flutter', buildArgs, {
        cwd: app.path,
        shell: true
      });
      
      let output = '';
      let errorOutput = '';
      
      flutter.stdout.on('data', (data) => {
        output += data.toString();
        this.logger.debug(data.toString().trim());
      });
      
      flutter.stderr.on('data', (data) => {
        errorOutput += data.toString();
        this.logger.debug(chalk.yellow(data.toString().trim()));
      });
      
      flutter.on('close', (code) => {
        if (code === 0) {
          this.logger.info(chalk.green(`✅ Build successful: ${app.name}`));
          resolve({
            success: true,
            output,
            buildTime: Date.now() - buildJob.timestamp
          });
        } else {
          this.logger.error(chalk.red(`❌ Build failed: ${app.name}`));
          reject(new Error(`Build failed with code ${code}: ${errorOutput}`));
        }
      });
      
    } catch (error) {
      reject(error);
    }
  }

  async runFlutterTests(appName) {
    const app = this.flutterApps.get(appName);
    if (!app) {
      throw new Error(`Flutter app '${appName}' not found`);
    }

    if (!app.testCoverage.hasTests) {
      this.logger.warn(chalk.yellow(`⚠️ No tests found for ${appName}`));
      return { skipped: true, reason: 'No tests found' };
    }

    this.logger.info(chalk.blue(`🧪 Running tests for ${appName}...`));
    
    return new Promise((resolve, reject) => {
      const flutter = spawn('flutter', ['test'], {
        cwd: app.path,
        shell: true
      });
      
      let output = '';
      let errorOutput = '';
      
      flutter.stdout.on('data', (data) => {
        output += data.toString();
        this.logger.debug(data.toString().trim());
      });
      
      flutter.stderr.on('data', (data) => {
        errorOutput += data.toString();
      });
      
      flutter.on('close', (code) => {
        if (code === 0) {
          this.logger.info(chalk.green(`✅ Tests passed: ${appName}`));
          resolve({
            success: true,
            output,
            testsRun: this.extractTestCount(output)
          });
        } else {
          this.logger.error(chalk.red(`❌ Tests failed: ${appName}`));
          reject(new Error(`Tests failed with code ${code}: ${errorOutput}`));
        }
      });
    });
  }

  extractTestCount(output) {
    const match = output.match(/(\d+) tests? passed/);
    return match ? parseInt(match[1]) : 0;
  }

  async generateFlutterProject(projectName, template = 'app', options = {}) {
    this.logger.info(chalk.blue(`🎨 Generating Flutter project: ${projectName}`));
    
    // Check if it's a custom template
    const customTemplates = this.templateGenerator.getAvailableTemplates().map(t => t.id);
    
    if (customTemplates.includes(template)) {
      // Use our custom template generator
      const result = await this.templateGenerator.generateProject(template, projectName, options);
      
      // Analyze the new project
      const appInfo = await this.analyzeFlutterApp(result.projectPath, projectName);
      if (appInfo) {
        this.flutterApps.set(projectName, appInfo);
      }
      
      return result;
    } else {
      // Use standard Flutter CLI
      const projectPath = `./flutter-apps/${projectName}`;
      
      return new Promise((resolve, reject) => {
        const args = ['create'];
        
        if (template === 'plugin') {
          args.push('--template=plugin');
        } else if (template === 'package') {
          args.push('--template=package');
        }
        
        if (options.org) {
          args.push(`--org=${options.org}`);
        }
        
        if (options.platforms) {
          args.push(`--platforms=${options.platforms.join(',')}`);
        }
        
        args.push(projectName);
        
        const flutter = spawn('flutter', args, {
          cwd: './flutter-apps',
          shell: true
        });
        
        let output = '';
        
        flutter.stdout.on('data', (data) => {
          output += data.toString();
          this.logger.debug(data.toString().trim());
        });
        
        flutter.on('close', async (code) => {
          if (code === 0) {
            this.logger.info(chalk.green(`✅ Flutter project created: ${projectName}`));
            
            // Analyze the new project
            const appInfo = await this.analyzeFlutterApp(projectPath, projectName);
            if (appInfo) {
              this.flutterApps.set(projectName, appInfo);
            }
            
            resolve({
              success: true,
              projectPath,
              output
            });
          } else {
            reject(new Error(`Project creation failed with code ${code}`));
          }
        });
      });
    }
  }

  getAvailableTemplates() {
    const customTemplates = this.templateGenerator.getAvailableTemplates();
    const standardTemplates = [
      { id: 'app', name: 'Standard Flutter App', description: 'Basic Flutter application', type: 'standard' },
      { id: 'plugin', name: 'Flutter Plugin', description: 'Plugin package for Flutter', type: 'standard' },
      { id: 'package', name: 'Dart Package', description: 'Dart package', type: 'standard' }
    ];
    
    return [...customTemplates, ...standardTemplates];
  }

  async getFlutterAppStatus(appName) {
    const app = this.flutterApps.get(appName);
    if (!app) {
      return null;
    }
    
    // Refresh build status
    app.buildStatus = await this.checkBuildStatus(app.path);
    
    return {
      name: app.name,
      type: app.type,
      buildStatus: app.buildStatus.status,
      lastBuild: app.buildStatus.lastBuild,
      platforms: app.platforms,
      testCoverage: app.testCoverage.coverage,
      dependencies: app.dependencies.length,
      hasTests: app.testCoverage.hasTests
    };
  }

  async optimizeFlutterApps() {
    const optimizations = [];
    
    for (const [name, app] of this.flutterApps) {
      const analysis = await this.analyzeAppOptimization(app);
      if (analysis.recommendations.length > 0) {
        optimizations.push({
          app: name,
          ...analysis
        });
      }
    }
    
    return optimizations;
  }

  async analyzeAppOptimization(app) {
    const recommendations = [];
    const performance = { score: 100 };
    
    // Check for unused dependencies
    if (app.dependencies.length > 20) {
      recommendations.push({
        type: 'dependencies',
        severity: 'medium',
        message: 'Consider reviewing dependencies for unused packages',
        impact: 'Bundle size optimization'
      });
      performance.score -= 10;
    }
    
    // Check test coverage
    if (app.testCoverage.coverage < 50) {
      recommendations.push({
        type: 'testing',
        severity: 'high',
        message: 'Low test coverage detected',
        impact: 'Code quality and reliability'
      });
      performance.score -= 20;
    }
    
    // Check build status
    if (app.buildStatus.status !== 'built') {
      recommendations.push({
        type: 'build',
        severity: 'high',
        message: 'App has not been built recently',
        impact: 'Deployment readiness'
      });
      performance.score -= 15;
    }
    
    return {
      performance,
      recommendations
    };
  }

  // Utility methods
  async fileExists(filePath) {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  async findFiles(directory, extension) {
    const files = [];
    
    try {
      const items = await fs.readdir(directory);
      
      for (const item of items) {
        const fullPath = path.join(directory, item);
        const stats = await fs.stat(fullPath);
        
        if (stats.isDirectory()) {
          const subFiles = await this.findFiles(fullPath, extension);
          files.push(...subFiles);
        } else if (item.endsWith(extension)) {
          files.push(fullPath);
        }
      }
    } catch (error) {
      // Directory doesn't exist or can't be read
    }
    
    return files;
  }

  getStatus() {
    return {
      initialized: this.initialized,
      flutterVersion: this.flutterVersion,
      apps: Array.from(this.flutterApps.keys()),
      totalApps: this.flutterApps.size,
      sharedLibraries: Array.from(this.sharedLibraries.keys()),
      buildQueueLength: this.buildQueue.length,
      lastScan: this.lastScan
    };
  }

  async dispose() {
    if (this.buildMonitor) {
      clearInterval(this.buildMonitor);
    }
    
    this.flutterApps.clear();
    this.sharedLibraries.clear();
    this.buildQueue = [];
    this.initialized = false;
    
    this.logger.info(chalk.blue('📱 Flutter Coordination System disposed'));
  }
}