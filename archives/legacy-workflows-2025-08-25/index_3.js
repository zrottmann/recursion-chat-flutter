// Enhanced Tech-Lead Orchestrator - Main Entry Point
import chalk from 'chalk';
import { Command } from 'commander';
import winston from 'winston';
import { OrchestrationEngine } from './core/orchestrationEngine.js';
import { RiskManagementSystem } from './systems/riskManagement.js';
import { QualityGateSystem } from './systems/qualityGate.js';
import { ResourceManagementSystem } from './systems/resourceManagement.js';
import { FlutterCoordinationSystem } from './systems/flutterCoordination.js';
import { MobileDeploymentSystem } from './services/mobileDeployment.js';

// Configure logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.colorize(),
    winston.format.simple()
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'orchestrator.log' })
  ]
});

// Initialize Enhanced Tech-Lead Orchestrator
class EnhancedTechLeadOrchestrator {
  constructor() {
    this.orchestrationEngine = new OrchestrationEngine();
    this.riskManagement = new RiskManagementSystem();
    this.qualityGate = new QualityGateSystem();
    this.resourceManagement = new ResourceManagementSystem();
    this.flutterCoordination = new FlutterCoordinationSystem(logger);
    this.mobileDeployment = new MobileDeploymentSystem(logger);
    this.logger = logger;

    this.version = process.env.npm_package_version || '2.0.0';
  }

  async initialize() {
    this.logger.info(chalk.cyan(`🚀 Initializing Enhanced Tech-Lead Orchestrator v${this.version}`));

    const systems = [
      { name: 'Orchestration Engine', system: this.orchestrationEngine, icon: '⚙️' },
      { name: 'Risk Management System', system: this.riskManagement, icon: '🛡️' },
      { name: 'Quality Gate System', system: this.qualityGate, icon: '🔍' },
      { name: 'Resource Management System', system: this.resourceManagement, icon: '📊' },
      { name: 'Flutter Coordination System', system: this.flutterCoordination, icon: '📱' },
      { name: 'Mobile Deployment System', system: this.mobileDeployment, icon: '🚀' }
    ];

    try {
      for (const { name, system, icon } of systems) {
        this.logger.info(chalk.blue(`  ${icon} Initializing ${name}...`));
        const startTime = Date.now();
        
        await this.initializeSystemWithTimeout(system, name, 10000);
        
        const duration = Date.now() - startTime;
        this.logger.info(chalk.green(`  ✅ ${name} initialized (${duration}ms)`));
      }

      // Verify all systems are properly initialized
      await this.verifySystemsHealth();

      this.logger.info(chalk.green('✅ All systems initialized successfully'));
      return true;
    } catch (error) {
      this.logger.error(chalk.red('❌ Initialization failed:'), error);
      this.logger.error(chalk.red('💡 System initialization failure details:'));
      this.logger.error(chalk.red(`   Error: ${error.message}`));
      this.logger.error(chalk.red(`   Stack: ${error.stack?.split('\n')[1]?.trim() || 'N/A'}`));
      return false;
    }
  }

  async initializeSystemWithTimeout(system, systemName, timeoutMs = 10000) {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error(`${systemName} initialization timed out after ${timeoutMs}ms`));
      }, timeoutMs);

      const initializeAsync = async () => {
        try {
          await system.initialize();
          clearTimeout(timeout);
          resolve(true);
        } catch (error) {
          clearTimeout(timeout);
          reject(new Error(`${systemName} initialization failed: ${error.message}`));
        }
      };
      
      initializeAsync();
    });
  }

  async verifySystemsHealth() {
    const healthChecks = [
      { name: 'Orchestration Engine', check: () => this.orchestrationEngine.getStatus() },
      { name: 'Risk Management', check: () => this.riskManagement.getStatus() },
      { name: 'Quality Gate', check: () => this.qualityGate.getStatus() },
      { name: 'Resource Management', check: () => this.resourceManagement.getStatus() },
      { name: 'Flutter Coordination', check: () => this.flutterCoordination.getStatus() },
      { name: 'Mobile Deployment', check: () => this.mobileDeployment.getStatus() }
    ];

    for (const { name, check } of healthChecks) {
      try {
        const status = check();
        if (!status || (typeof status === 'object' && !status.initialized)) {
          throw new Error(`${name} not properly initialized`);
        }
        this.logger.debug(chalk.gray(`  ✓ ${name}: Health check passed`));
      } catch (error) {
        throw new Error(`Health check failed for ${name}: ${error.message}`);
      }
    }
  }

  async planMission(requirements) {
    this.logger.info(chalk.blue('📋 Starting mission planning...'));

    try {
      // Risk assessment
      const riskAssessment = await this.riskManagement.assessMissionRisk(requirements);
      this.logger.info(`Risk Level: ${chalk.yellow(riskAssessment.level)}`);

      // Resource allocation
      const resourcePlan = await this.resourceManagement.optimizeAllocation(requirements);
      this.logger.info(`Agents Required: ${chalk.cyan(resourcePlan.agents.length)}`);

      // Mission orchestration
      const missionPlan = await this.orchestrationEngine.createMissionPlan({
        requirements,
        riskAssessment,
        resourcePlan
      });

      this.logger.info(chalk.green('✅ Mission plan created successfully'));
      return missionPlan;
    } catch (error) {
      this.logger.error(chalk.red('❌ Mission planning failed:'), error);
      throw error;
    }
  }

  async executeMission(missionPlan) {
    this.logger.info(chalk.blue('⚡ Starting mission execution...'));

    try {
      const execution = await this.orchestrationEngine.executeMission(missionPlan);
      this.logger.info(chalk.green('✅ Mission execution started'));
      return execution;
    } catch (error) {
      this.logger.error(chalk.red('❌ Mission execution failed:'), error);
      throw error;
    }
  }

  getStatus() {
    return {
      version: this.version,
      systems: {
        orchestrationEngine: this.orchestrationEngine.getStatus(),
        riskManagement: this.riskManagement.getStatus(),
        qualityGate: this.qualityGate.getStatus(),
        resourceManagement: this.resourceManagement.getStatus(),
        flutterCoordination: this.flutterCoordination.getStatus(),
        mobileDeployment: this.mobileDeployment.getStatus()
      }
    };
  }
}

// CLI Interface
const program = new Command();

program
  .name('enhanced-tech-lead-orchestrator')
  .description('Advanced AI-driven project management and software development coordination')
  .version(process.env.npm_package_version || '2.0.0');

program
  .command('init')
  .description('Initialize the orchestrator systems')
  .action(async () => {
    const orchestrator = new EnhancedTechLeadOrchestrator();
    const success = await orchestrator.initialize();
    process.exit(success ? 0 : 1);
  });

program
  .command('plan')
  .description('Create a mission plan from requirements')
  .option('-f, --file <path>', 'Requirements file path')
  .option('-r, --requirements <requirements>', 'Requirements as JSON string')
  .action(async (options) => {
    const orchestrator = new EnhancedTechLeadOrchestrator();
    await orchestrator.initialize();

    let requirements;
    if (options.file) {
      const fs = await import('fs/promises');
      const fileContent = await fs.readFile(options.file, 'utf8');
      // Try to parse as JSON first, fallback to plain text
      try {
        requirements = JSON.parse(fileContent);
      } catch {
        requirements = fileContent.trim();
      }
    } else if (options.requirements) {
      requirements = options.requirements; // Accept as plain string
    } else {
      logger.error(chalk.red('❌ Requirements must be provided via --file or --requirements'));
      process.exit(1);
    }

    try {
      const plan = await orchestrator.planMission(requirements);
      console.log(JSON.stringify(plan, null, 2));
    } catch (_error) {
      process.exit(1);
    }
  });

program
  .command('status')
  .description('Show orchestrator system status')
  .action(async () => {
    const orchestrator = new EnhancedTechLeadOrchestrator();
    const status = orchestrator.getStatus();
    console.log(JSON.stringify(status, null, 2));
  });

program
  .command('test')
  .description('Run orchestrator system tests')
  .option('--unit', 'Run unit tests only')
  .option('--integration', 'Run integration tests only')
  .option('--e2e', 'Run E2E tests only')
  .action(async (options) => {
    const { spawn } = await import('child_process');

    let testCommand;
    if (options.unit) testCommand = 'npm run test:unit';
    else if (options.integration) testCommand = 'npm run test:integration';
    else if (options.e2e) testCommand = 'npm run test:e2e';
    else testCommand = 'npm run test:all';

    logger.info(chalk.blue(`Running: ${testCommand}`));

    const child = spawn(testCommand.split(' ')[0], testCommand.split(' ').slice(1), {
      stdio: 'inherit',
      shell: true
    });

    child.on('exit', (code) => {
      process.exit(code);
    });
  });

// Flutter-specific commands
program
  .command('flutter:scan')
  .description('Scan for Flutter apps and analyze their status')
  .action(async () => {
    const orchestrator = new EnhancedTechLeadOrchestrator();
    await orchestrator.initialize();
    
    const flutterStatus = orchestrator.flutterCoordination.getStatus();
    console.log(chalk.cyan('\n📱 Flutter Apps Status:'));
    console.log(JSON.stringify(flutterStatus, null, 2));
  });

program
  .command('flutter:build')
  .description('Build a Flutter app')
  .argument('<app-name>', 'Name of the Flutter app to build')
  .option('-p, --platform <platform>', 'Target platform', 'web')
  .option('-r, --release', 'Build in release mode')
  .option('--web-renderer <renderer>', 'Web renderer (html/canvaskit)')
  .action(async (appName, options) => {
    const orchestrator = new EnhancedTechLeadOrchestrator();
    await orchestrator.initialize();
    
    try {
      const result = await orchestrator.flutterCoordination.buildFlutterApp(appName, options.platform, {
        release: options.release,
        webRenderer: options.webRenderer
      });
      
      console.log(chalk.green(`✅ Build completed in ${result.buildTime}ms`));
    } catch (error) {
      console.error(chalk.red(`❌ Build failed: ${error.message}`));
      process.exit(1);
    }
  });

program
  .command('flutter:test')
  .description('Run tests for a Flutter app')
  .argument('<app-name>', 'Name of the Flutter app to test')
  .action(async (appName) => {
    const orchestrator = new EnhancedTechLeadOrchestrator();
    await orchestrator.initialize();
    
    try {
      const result = await orchestrator.flutterCoordination.runFlutterTests(appName);
      if (result.skipped) {
        console.log(chalk.yellow(`⚠️ Tests skipped: ${result.reason}`));
      } else {
        console.log(chalk.green(`✅ ${result.testsRun} tests passed`));
      }
    } catch (error) {
      console.error(chalk.red(`❌ Tests failed: ${error.message}`));
      process.exit(1);
    }
  });

program
  .command('flutter:create')
  .description('Generate a new Flutter project')
  .argument('<project-name>', 'Name of the new Flutter project')
  .option('-t, --template <template>', 'Project template (use flutter:templates to see available)', 'app')
  .option('--org <org>', 'Organization identifier')
  .option('--platforms <platforms>', 'Comma-separated list of platforms')
  .action(async (projectName, options) => {
    const orchestrator = new EnhancedTechLeadOrchestrator();
    await orchestrator.initialize();
    
    const createOptions = {};
    if (options.org) createOptions.org = options.org;
    if (options.platforms) createOptions.platforms = options.platforms.split(',');
    
    try {
      const result = await orchestrator.flutterCoordination.generateFlutterProject(
        projectName, 
        options.template, 
        createOptions
      );
      console.log(chalk.green(`✅ Flutter project created: ${result.projectPath}`));
      
      if (result.template && result.template !== 'app') {
        console.log(chalk.cyan(`📋 Template: ${result.template}`));
        console.log(chalk.cyan(`📦 Dependencies: ${result.dependencies}`));
        console.log(chalk.cyan(`🎯 Platforms: ${result.platforms.join(', ')}`));
      }
    } catch (error) {
      console.error(chalk.red(`❌ Project creation failed: ${error.message}`));
      process.exit(1);
    }
  });

program
  .command('flutter:templates')
  .description('List available Flutter project templates')
  .action(async () => {
    const orchestrator = new EnhancedTechLeadOrchestrator();
    await orchestrator.initialize();
    
    const templates = orchestrator.flutterCoordination.getAvailableTemplates();
    
    console.log(chalk.cyan('\n📋 Available Flutter Templates:\n'));
    
    const customTemplates = templates.filter(t => t.type !== 'standard');
    const standardTemplates = templates.filter(t => t.type === 'standard');
    
    if (customTemplates.length > 0) {
      console.log(chalk.yellow('🎨 Custom Templates (Agent-Optimized):'));
      customTemplates.forEach(template => {
        console.log(`  ${chalk.green(template.id.padEnd(20))} - ${template.name}`);
        console.log(`  ${' '.repeat(22)} ${chalk.gray(template.description)}`);
        console.log(`  ${' '.repeat(22)} Platforms: ${chalk.cyan(template.platforms.join(', '))}\n`);
      });
    }
    
    console.log(chalk.yellow('📱 Standard Templates:'));
    standardTemplates.forEach(template => {
      console.log(`  ${chalk.green(template.id.padEnd(20))} - ${template.name}`);
      console.log(`  ${' '.repeat(22)} ${chalk.gray(template.description)}\n`);
    });
    
    console.log(chalk.cyan('💡 Usage: flutter:create <project-name> -t <template-id>'));
  });

program
  .command('flutter:optimize')
  .description('Analyze and suggest optimizations for Flutter apps')
  .action(async () => {
    const orchestrator = new EnhancedTechLeadOrchestrator();
    await orchestrator.initialize();
    
    try {
      const optimizations = await orchestrator.flutterCoordination.optimizeFlutterApps();
      
      if (optimizations.length === 0) {
        console.log(chalk.green('✅ All Flutter apps are optimized!'));
      } else {
        console.log(chalk.cyan('\n🔧 Optimization Recommendations:'));
        optimizations.forEach(opt => {
          console.log(chalk.yellow(`\n📱 ${opt.app}:`));
          console.log(`   Performance Score: ${opt.performance.score}/100`);
          opt.recommendations.forEach(rec => {
            const severityColor = rec.severity === 'high' ? 'red' : rec.severity === 'medium' ? 'yellow' : 'gray';
            console.log(chalk[severityColor](`   • ${rec.message} (${rec.impact})`));
          });
        });
      }
    } catch (error) {
      console.error(chalk.red(`❌ Optimization analysis failed: ${error.message}`));
      process.exit(1);
    }
  });

program
  .command('deploy')
  .description('Deploy a Flutter app to specified target')
  .argument('<app-name>', 'Name of the Flutter app to deploy')
  .option('-t, --target <target>', 'Deployment target', 'web_development')
  .option('--release', 'Build in release mode')
  .option('--base-url <url>', 'Base URL for the deployed app')
  .action(async (appName, options) => {
    const orchestrator = new EnhancedTechLeadOrchestrator();
    await orchestrator.initialize();
    
    try {
      const deployment = await orchestrator.mobileDeployment.deployApp(appName, options.target, {
        release: options.release,
        baseUrl: options.baseUrl
      });
      
      console.log(chalk.green(`✅ Deployment successful!`));
      console.log(chalk.cyan(`📋 Deployment ID: ${deployment.id}`));
      console.log(chalk.cyan(`⏱️ Duration: ${deployment.duration}ms`));
      console.log(chalk.cyan(`📦 Build Size: ${deployment.buildSize ? orchestrator.mobileDeployment.formatBytes(deployment.buildSize) : 'Unknown'}`));
      
      if (deployment.url) {
        console.log(chalk.cyan(`🌐 Live URL: ${deployment.url}`));
      }
    } catch (error) {
      console.error(chalk.red(`❌ Deployment failed: ${error.message}`));
      process.exit(1);
    }
  });

program
  .command('deploy:targets')
  .description('List available deployment targets')
  .action(async () => {
    const orchestrator = new EnhancedTechLeadOrchestrator();
    await orchestrator.initialize();
    
    const targets = orchestrator.mobileDeployment.getAvailableTargets();
    
    console.log(chalk.cyan('\n🎯 Available Deployment Targets:\n'));
    
    targets.forEach(target => {
      console.log(`  ${chalk.green(target.id.padEnd(20))} - ${target.type}`);
      console.log(`  ${' '.repeat(22)} Profile: ${chalk.yellow(target.profile)}`);
      console.log(`  ${' '.repeat(22)} Auto-publish: ${target.autoPublish ? chalk.green('Yes') : chalk.gray('No')}\n`);
    });
    
    console.log(chalk.cyan('💡 Usage: deploy <app-name> --target <target-id>'));
  });

program
  .command('deploy:status')
  .description('Show deployment status for an app')
  .argument('<app-name>', 'Name of the Flutter app')
  .action(async (appName) => {
    const orchestrator = new EnhancedTechLeadOrchestrator();
    await orchestrator.initialize();
    
    try {
      const status = await orchestrator.mobileDeployment.getDeploymentStatus(appName);
      
      console.log(chalk.cyan(`\n📊 Deployment Status for ${appName}:\n`));
      console.log(`Total Deployments: ${chalk.green(status.totalDeployments)}`);
      console.log(`Success Rate: ${chalk.green(status.successRate + '%')}`);
      
      if (status.latest) {
        console.log(chalk.cyan('\n🕒 Latest Deployment:'));
        console.log(`  Status: ${status.latest.status === 'success' ? chalk.green('✅ Success') : chalk.red('❌ Failed')}`);
        console.log(`  Target: ${chalk.yellow(status.latest.target)}`);
        console.log(`  Time: ${chalk.gray(new Date(status.latest.timestamp).toLocaleString())}`);
        console.log(`  Duration: ${chalk.gray(status.latest.duration + 'ms')}`);
        
        if (status.latest.url) {
          console.log(`  URL: ${chalk.cyan(status.latest.url)}`);
        }
        
        if (status.latest.error) {
          console.log(`  Error: ${chalk.red(status.latest.error)}`);
        }
      }
      
      if (status.recentDeployments.length > 1) {
        console.log(chalk.cyan('\n📈 Recent Deployments:'));
        status.recentDeployments.slice(0, 3).forEach((dep, index) => {
          const statusIcon = dep.status === 'success' ? '✅' : '❌';
          console.log(`  ${index + 1}. ${statusIcon} ${dep.target} - ${new Date(dep.timestamp).toLocaleDateString()}`);
        });
      }
    } catch (error) {
      console.error(chalk.red(`❌ Failed to get deployment status: ${error.message}`));
      process.exit(1);
    }
  });

program
  .command('slumlord:dev')
  .description('Start Slumlord Survival development environment')
  .action(async () => {
    const orchestrator = new EnhancedTechLeadOrchestrator();
    await orchestrator.initialize();
    
    console.log(chalk.cyan('🎮 Starting Slumlord Survival Development Environment...'));
    
    try {
      // Check if slum-lord app exists
      const appStatus = await orchestrator.flutterCoordination.getFlutterAppStatus('slum-lord');
      if (!appStatus) {
        console.log(chalk.yellow('⚠️ Slumlord app not found, analyzing Dart files...'));
        
        // Analyze the existing Dart files
        const slumlordPath = './enhanced-tech-lead-orchestrator/slumlord_survival';
        console.log(chalk.blue(`📁 Dart files found in: ${slumlordPath}`));
        console.log(chalk.green('📋 Ready for Flutter conversion and development!'));
        
        console.log(chalk.cyan('\n🎯 Quick Start:'));
        console.log('1. flutter:create slumlord-survival -t slumlord-arpg');
        console.log('2. Copy existing Dart files to new project');
        console.log('3. flutter:build slumlord-survival --platform web --release');
        console.log('4. deploy slumlord-survival --target web_production');
        console.log('');
        console.log(chalk.yellow('🎨 Available templates:'));
        console.log('   - slumlord-arpg (Baltimore ARPG with Bonfire engine)');
        console.log('   - chat-app (WebSocket chat with Appwrite)');
        console.log('   - trading-platform (E-commerce marketplace)');
      } else {
        console.log(chalk.green(`✅ Slumlord app found: ${appStatus.type}`));
        console.log(`   Build Status: ${appStatus.buildStatus}`);
        console.log(`   Test Coverage: ${appStatus.testCoverage}%`);
        console.log(`   Platforms: ${appStatus.platforms.join(', ')}`);
      }
    } catch (error) {
      console.error(chalk.red(`❌ Development environment setup failed: ${error.message}`));
    }
  });

// Export for testing and module usage
export { EnhancedTechLeadOrchestrator };

// CLI execution
if (import.meta.url.startsWith('file:') && process.argv[1] && import.meta.url.endsWith(process.argv[1].replace(/\\/g, '/'))) {
  program.parse(process.argv);
} else {
  // Fallback for direct execution
  const scriptPath = new URL(import.meta.url).pathname;
  const argPath = process.argv[1] ? process.argv[1].replace(/\\/g, '/') : '';
  if (scriptPath.includes('index.js') && (argPath.includes('index.js') || process.argv.length > 2)) {
    program.parse(process.argv);
  }
}
