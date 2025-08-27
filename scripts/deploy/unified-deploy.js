#!/usr/bin/env node
/**
 * Unified Deployment Script
 * Consolidates all deployment functionality into a single, robust solution
 * Prioritizes Appwrite Sites over legacy deployment methods
 */

const fs = require('fs');
const path = require('path');
const { execSync, spawn } = require('child_process');

class UnifiedDeployer {
    constructor() {
        this.config = {
            environments: ['development', 'staging', 'production'],
            platforms: ['sites', 'functions', 'database'],
            supportedProjects: ['archon', 'claude-code-remote', 'super-console', 'trading-post']
        };
        this.logs = [];
        this.errors = [];
    }

    log(message, level = 'info') {
        const timestamp = new Date().toISOString();
        const logEntry = `[${timestamp}] ${level.toUpperCase()}: ${message}`;
        console.log(logEntry);
        this.logs.push(logEntry);
    }

    error(message, shouldExit = false) {
        this.log(message, 'error');
        this.errors.push(message);
        if (shouldExit) {
            process.exit(1);
        }
    }

    // Parse command line arguments
    parseArgs() {
        const args = process.argv.slice(2);
        const options = {
            environment: 'production',
            platform: 'sites',
            project: null,
            dryRun: false,
            force: false,
            help: false
        };

        for (let i = 0; i < args.length; i++) {
            const arg = args[i];
            
            switch (arg) {
                case '--env':
                case '--environment':
                    options.environment = args[++i];
                    break;
                case '--platform':
                case '--type':
                    options.platform = args[++i];
                    break;
                case '--project':
                    options.project = args[++i];
                    break;
                case '--dry-run':
                    options.dryRun = true;
                    break;
                case '--force':
                    options.force = true;
                    break;
                case '--help':
                case '-h':
                    options.help = true;
                    break;
            }
        }

        return options;
    }

    // Show help information
    showHelp() {
        console.log(`
🚀 Unified Deployment Script

Usage: node unified-deploy.js [options]

Options:
  --env <environment>     Target environment (development|staging|production)
  --platform <platform>   Deployment platform (sites|functions|database)
  --project <project>     Specific project to deploy
  --dry-run              Show what would be deployed without executing
  --force                Force deployment even with warnings
  --help, -h             Show this help message

Examples:
  node unified-deploy.js --env production --platform sites
  node unified-deploy.js --project archon --env staging --dry-run
  node unified-deploy.js --platform functions --force

Supported Projects: ${this.config.supportedProjects.join(', ')}
Supported Platforms: ${this.config.platforms.join(', ')}
Supported Environments: ${this.config.environments.join(', ')}
`);
    }

    // Detect project type from current directory
    detectProject() {
        const cwd = process.cwd();
        const packageJson = path.join(cwd, 'package.json');
        
        if (fs.existsSync(packageJson)) {
            try {
                const pkg = JSON.parse(fs.readFileSync(packageJson, 'utf8'));
                
                // Check project name patterns
                if (pkg.name) {
                    for (const project of this.config.supportedProjects) {
                        if (pkg.name.toLowerCase().includes(project.toLowerCase())) {
                            return project;
                        }
                    }
                }
            } catch (error) {
                this.log(`Warning: Could not parse package.json: ${error.message}`, 'warn');
            }
        }

        // Check directory name
        const dirName = path.basename(cwd).toLowerCase();
        for (const project of this.config.supportedProjects) {
            if (dirName.includes(project.toLowerCase())) {
                return project;
            }
        }

        return null;
    }

    // Load environment variables
    loadEnvironment(environment, project) {
        const envFiles = [
            `.env.${environment}`,
            `.env.${environment}.local`,
            '.env',
            '.env.local'
        ];

        const envVars = {};

        for (const envFile of envFiles) {
            if (fs.existsSync(envFile)) {
                try {
                    const content = fs.readFileSync(envFile, 'utf8');
                    const lines = content.split('\n');
                    
                    for (const line of lines) {
                        const trimmed = line.trim();
                        if (trimmed && !trimmed.startsWith('#')) {
                            const [key, ...valueParts] = trimmed.split('=');
                            if (key && valueParts.length > 0) {
                                envVars[key.trim()] = valueParts.join('=').trim();
                            }
                        }
                    }
                    
                    this.log(`Loaded environment from ${envFile}`);
                } catch (error) {
                    this.log(`Warning: Could not load ${envFile}: ${error.message}`, 'warn');
                }
            }
        }

        return envVars;
    }

    // Validate deployment prerequisites
    validatePrerequisites(options, envVars) {
        const issues = [];

        // Check required environment variables
        const requiredVars = [
            'APPWRITE_PROJECT_ID',
            'APPWRITE_ENDPOINT',
            'APPWRITE_API_KEY'
        ];

        for (const varName of requiredVars) {
            if (!envVars[varName] && !process.env[varName]) {
                issues.push(`Missing required environment variable: ${varName}`);
            }
        }

        // Check if project has build script
        const packageJson = path.join(process.cwd(), 'package.json');
        if (fs.existsSync(packageJson)) {
            try {
                const pkg = JSON.parse(fs.readFileSync(packageJson, 'utf8'));
                if (options.platform === 'sites' && !pkg.scripts?.build) {
                    issues.push('No build script found in package.json');
                }
            } catch (error) {
                issues.push('Could not read package.json');
            }
        }

        // Check Appwrite CLI availability
        try {
            execSync('appwrite --version', { stdio: 'ignore' });
            this.log('Appwrite CLI available');
        } catch (error) {
            issues.push('Appwrite CLI not installed or not in PATH');
        }

        return issues;
    }

    // Execute command with proper error handling
    async executeCommand(command, description, options = {}) {
        this.log(`Executing: ${description}`);
        this.log(`Command: ${command}`);

        if (options.dryRun) {
            this.log('[DRY RUN] Command would be executed');
            return { success: true, output: 'DRY RUN - not executed' };
        }

        return new Promise((resolve, reject) => {
            const child = spawn(command, { shell: true, stdio: 'pipe' });
            let stdout = '';
            let stderr = '';

            child.stdout.on('data', (data) => {
                const output = data.toString();
                stdout += output;
                console.log(output.trim());
            });

            child.stderr.on('data', (data) => {
                const output = data.toString();
                stderr += output;
                console.error(output.trim());
            });

            child.on('close', (code) => {
                if (code === 0) {
                    this.log(`✅ ${description} completed successfully`);
                    resolve({ success: true, output: stdout, error: stderr });
                } else {
                    this.error(`❌ ${description} failed with code ${code}`);
                    resolve({ success: false, output: stdout, error: stderr });
                }
            });

            child.on('error', (error) => {
                this.error(`❌ ${description} failed: ${error.message}`);
                resolve({ success: false, error: error.message });
            });
        });
    }

    // Deploy to Appwrite Sites
    async deploySites(options, envVars) {
        this.log('🌐 Deploying to Appwrite Sites...');

        const steps = [
            {
                command: 'npm install',
                description: 'Install dependencies',
                required: true
            },
            {
                command: 'npm run build',
                description: 'Build project',
                required: true
            },
            {
                command: `appwrite deploy collection --all`,
                description: 'Deploy collections (if any)',
                required: false
            },
            {
                command: `appwrite deploy function --all`,
                description: 'Deploy functions (if any)', 
                required: false
            }
        ];

        // Determine build output directory
        const buildDirs = ['dist', 'build', 'out', '.next'];
        let buildDir = null;
        
        for (const dir of buildDirs) {
            if (fs.existsSync(dir)) {
                buildDir = dir;
                break;
            }
        }

        if (!buildDir) {
            this.error('No build output directory found', true);
        }

        for (const step of steps) {
            const result = await this.executeCommand(step.command, step.description, options);
            
            if (!result.success && step.required) {
                this.error(`Required step failed: ${step.description}`, true);
            }
        }

        // Deploy to Appwrite Sites
        const deployCommand = `appwrite deploy bucket --all`;
        await this.executeCommand(deployCommand, 'Deploy to Appwrite Sites', options);

        this.log('✅ Sites deployment completed');
    }

    // Deploy functions
    async deployFunctions(options, envVars) {
        this.log('⚡ Deploying Appwrite Functions...');

        const functionsDir = path.join(process.cwd(), 'functions');
        if (!fs.existsSync(functionsDir)) {
            this.error('No functions directory found', true);
        }

        const deployCommand = `appwrite deploy function --all`;
        const result = await this.executeCommand(deployCommand, 'Deploy functions', options);

        if (!result.success) {
            this.error('Function deployment failed', true);
        }

        this.log('✅ Functions deployment completed');
    }

    // Deploy database schema
    async deployDatabase(options, envVars) {
        this.log('🗄️ Deploying database schema...');

        const schemaCommand = `appwrite deploy collection --all`;
        const result = await this.executeCommand(schemaCommand, 'Deploy database collections', options);

        if (!result.success) {
            this.error('Database deployment failed', true);
        }

        this.log('✅ Database deployment completed');
    }

    // Main deployment orchestration
    async deploy(options) {
        this.log('🚀 Starting unified deployment...');
        this.log(`Environment: ${options.environment}`);
        this.log(`Platform: ${options.platform}`);
        this.log(`Project: ${options.project || 'auto-detected'}`);
        this.log(`Dry run: ${options.dryRun}`);

        // Detect project if not specified
        if (!options.project) {
            options.project = this.detectProject();
            if (options.project) {
                this.log(`Auto-detected project: ${options.project}`);
            } else {
                this.log('Could not auto-detect project, using generic deployment', 'warn');
            }
        }

        // Load environment variables
        const envVars = this.loadEnvironment(options.environment, options.project);
        
        // Validate prerequisites
        const issues = this.validatePrerequisites(options, envVars);
        if (issues.length > 0) {
            this.log('❌ Validation failed:', 'error');
            issues.forEach(issue => this.log(`  - ${issue}`, 'error'));
            
            if (!options.force) {
                this.error('Deployment aborted due to validation issues. Use --force to override.', true);
            } else {
                this.log('⚠️ Proceeding with warnings (--force enabled)', 'warn');
            }
        }

        // Execute platform-specific deployment
        try {
            switch (options.platform) {
                case 'sites':
                    await this.deploySites(options, envVars);
                    break;
                case 'functions':
                    await this.deployFunctions(options, envVars);
                    break;
                case 'database':
                    await this.deployDatabase(options, envVars);
                    break;
                default:
                    this.error(`Unsupported platform: ${options.platform}`, true);
            }

            this.log('🎉 Deployment completed successfully!');
            
            // Save deployment log
            this.saveDeploymentLog(options);
            
        } catch (error) {
            this.error(`Deployment failed: ${error.message}`, true);
        }
    }

    // Save deployment log
    saveDeploymentLog(options) {
        const logData = {
            timestamp: new Date().toISOString(),
            options,
            logs: this.logs,
            errors: this.errors,
            success: this.errors.length === 0
        };

        const logPath = path.join(process.cwd(), 'deployment.log.json');
        fs.writeFileSync(logPath, JSON.stringify(logData, null, 2));
        this.log(`Deployment log saved: ${logPath}`);
    }

    // Run the deployment
    async run() {
        const options = this.parseArgs();

        if (options.help) {
            this.showHelp();
            return;
        }

        // Validate options
        if (!this.config.environments.includes(options.environment)) {
            this.error(`Invalid environment: ${options.environment}. Must be one of: ${this.config.environments.join(', ')}`, true);
        }

        if (!this.config.platforms.includes(options.platform)) {
            this.error(`Invalid platform: ${options.platform}. Must be one of: ${this.config.platforms.join(', ')}`, true);
        }

        await this.deploy(options);
    }
}

// Run if called directly
if (require.main === module) {
    const deployer = new UnifiedDeployer();
    deployer.run().catch(error => {
        console.error('Fatal error:', error.message);
        process.exit(1);
    });
}

module.exports = UnifiedDeployer;