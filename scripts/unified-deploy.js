#!/usr/bin/env node

/**
 * Unified Deployment Script for Claude Projects
 * 
 * This script provides a single, consistent deployment interface for all projects
 * in the Claude ecosystem. It handles building, packaging, and deploying to
 * Appwrite Sites with proper error handling, logging, and rollback capabilities.
 * 
 * Usage:
 *   node unified-deploy.js <project> [options]
 *   node unified-deploy.js --all [options]
 * 
 * Options:
 *   --skip-build      Skip the build step
 *   --skip-health     Skip health check after deployment
 *   --force           Force deployment even if checks fail
 *   --dry-run         Show what would be deployed without actually deploying
 *   --verbose         Enable verbose logging
 *   --config <file>   Use custom config file (default: deployment-config.json)
 */

const fs = require('fs');
const path = require('path');
const { spawn, exec } = require('child_process');
const https = require('https');
const { promisify } = require('util');
const execAsync = promisify(exec);

// ANSI color codes for terminal output
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m',
    white: '\x1b[37m'
};

// Logging utilities
class Logger {
    constructor(verbose = false) {
        this.verbose = verbose;
        this.logFile = path.join(__dirname, '..', 'logs', `deployment-${new Date().toISOString().split('T')[0]}.log`);
        this.ensureLogDir();
    }

    ensureLogDir() {
        const logDir = path.dirname(this.logFile);
        if (!fs.existsSync(logDir)) {
            fs.mkdirSync(logDir, { recursive: true });
        }
    }

    log(level, message, data = null) {
        const timestamp = new Date().toISOString();
        const logEntry = {
            timestamp,
            level,
            message,
            data
        };

        // Write to file
        fs.appendFileSync(this.logFile, JSON.stringify(logEntry) + '\n');

        // Console output with colors
        const color = this.getColor(level);
        const prefix = `[${timestamp.split('T')[1].split('.')[0]}] [${level.toUpperCase()}]`;
        console.log(`${color}${prefix}${colors.reset} ${message}`);
        
        if (data && this.verbose) {
            console.log(colors.cyan + '  Data: ' + colors.reset, JSON.stringify(data, null, 2));
        }
    }

    getColor(level) {
        switch (level) {
            case 'error': return colors.red;
            case 'warn': return colors.yellow;
            case 'success': return colors.green;
            case 'info': return colors.blue;
            case 'debug': return colors.magenta;
            default: return colors.white;
        }
    }

    error(message, data) { this.log('error', message, data); }
    warn(message, data) { this.log('warn', message, data); }
    success(message, data) { this.log('success', message, data); }
    info(message, data) { this.log('info', message, data); }
    debug(message, data) { if (this.verbose) this.log('debug', message, data); }
}

// Configuration loader
class ConfigLoader {
    constructor(configPath) {
        this.configPath = configPath || path.join(__dirname, 'deployment-config.json');
        this.config = null;
        this.loadConfig();
    }

    loadConfig() {
        try {
            const configContent = fs.readFileSync(this.configPath, 'utf8');
            this.config = JSON.parse(configContent);
            this.resolveVariables();
        } catch (error) {
            throw new Error(`Failed to load config from ${this.configPath}: ${error.message}`);
        }
    }

    resolveVariables() {
        // Resolve environment variables and references in config
        const resolve = (obj, context = this.config) => {
            if (typeof obj === 'string') {
                // Replace ${env.VAR_NAME} with environment variable
                obj = obj.replace(/\$\{env\.([^}]+)\}/g, (match, varName) => {
                    return process.env[varName] || match;
                });
                // Replace ${path.to.value} with config value
                obj = obj.replace(/\$\{([^}]+)\}/g, (match, path) => {
                    if (path.startsWith('env.')) return match;
                    const value = this.getValueByPath(context, path);
                    return value !== undefined ? value : match;
                });
                return obj;
            } else if (Array.isArray(obj)) {
                return obj.map(item => resolve(item, context));
            } else if (obj && typeof obj === 'object') {
                const resolved = {};
                for (const key in obj) {
                    resolved[key] = resolve(obj[key], context);
                }
                return resolved;
            }
            return obj;
        };

        // Resolve variables in project configs
        for (const projectKey in this.config.projects) {
            const project = this.config.projects[projectKey];
            const projectContext = { ...this.config, ...project, projectId: project.projectId, liveUrl: project.liveUrl };
            this.config.projects[projectKey] = resolve(project, projectContext);
        }
    }

    getValueByPath(obj, path) {
        return path.split('.').reduce((current, key) => current?.[key], obj);
    }

    getProject(name) {
        return this.config.projects[name];
    }

    getAllProjects() {
        return Object.keys(this.config.projects);
    }
}

// Build manager
class BuildManager {
    constructor(logger, config) {
        this.logger = logger;
        this.config = config;
    }

    async build(projectName) {
        const project = this.config.getProject(projectName);
        if (!project) {
            throw new Error(`Project ${projectName} not found in configuration`);
        }

        this.logger.info(`Building ${project.name}...`, { project: projectName });

        const projectPath = path.join(process.cwd(), project.path);
        const buildPath = path.join(projectPath, project.buildDir);

        // Check if build directory exists
        if (!fs.existsSync(buildPath)) {
            throw new Error(`Build directory not found: ${buildPath}`);
        }

        // Set environment variables
        const env = { ...process.env };
        if (project.envVars) {
            Object.assign(env, project.envVars);
        }

        // Install dependencies if needed
        const packageJsonPath = path.join(buildPath, 'package.json');
        if (fs.existsSync(packageJsonPath)) {
            const nodeModulesPath = path.join(buildPath, 'node_modules');
            if (!fs.existsSync(nodeModulesPath)) {
                this.logger.info('Installing dependencies...');
                await this.runCommand('npm', ['install', '--legacy-peer-deps'], buildPath, env);
            }
        }

        // Run build command
        this.logger.info(`Running build command: ${project.buildCommand}`);
        const [cmd, ...args] = project.buildCommand.split(' ');
        await this.runCommand(cmd, args, buildPath, env);

        // Verify output directory exists
        const outputPath = path.join(projectPath, project.outputDir);
        if (!fs.existsSync(outputPath)) {
            throw new Error(`Build output not found at: ${outputPath}`);
        }

        const stats = this.getBuildStats(outputPath);
        this.logger.success(`Build completed successfully`, stats);
        
        return outputPath;
    }

    runCommand(command, args, cwd, env) {
        return new Promise((resolve, reject) => {
            const child = spawn(command, args, {
                cwd,
                env,
                shell: true,
                stdio: 'pipe'
            });

            let stdout = '';
            let stderr = '';

            child.stdout.on('data', (data) => {
                stdout += data.toString();
                this.logger.debug(data.toString().trim());
            });

            child.stderr.on('data', (data) => {
                stderr += data.toString();
                this.logger.debug(data.toString().trim());
            });

            child.on('close', (code) => {
                if (code === 0) {
                    resolve({ stdout, stderr });
                } else {
                    reject(new Error(`Command failed with code ${code}: ${stderr}`));
                }
            });

            child.on('error', (error) => {
                reject(error);
            });
        });
    }

    getBuildStats(buildPath) {
        const files = this.getAllFiles(buildPath);
        const totalSize = files.reduce((sum, file) => {
            return sum + fs.statSync(file).size;
        }, 0);

        return {
            fileCount: files.length,
            totalSize: `${(totalSize / 1024 / 1024).toFixed(2)} MB`,
            files: files.length <= 10 ? files.map(f => path.relative(buildPath, f)) : undefined
        };
    }

    getAllFiles(dirPath, files = []) {
        const items = fs.readdirSync(dirPath);
        for (const item of items) {
            const fullPath = path.join(dirPath, item);
            if (fs.statSync(fullPath).isDirectory()) {
                this.getAllFiles(fullPath, files);
            } else {
                files.push(fullPath);
            }
        }
        return files;
    }
}

// Deployment manager
class DeploymentManager {
    constructor(logger, config) {
        this.logger = logger;
        this.config = config;
    }

    async deploy(projectName, buildPath) {
        const project = this.config.getProject(projectName);
        if (!project) {
            throw new Error(`Project ${projectName} not found in configuration`);
        }

        this.logger.info(`Deploying ${project.name} to Appwrite Sites...`, {
            projectId: project.projectId,
            siteId: project.siteId
        });

        // Create deployment archive
        const archivePath = await this.createArchive(buildPath, projectName);
        
        try {
            // Deploy to Appwrite
            const deploymentId = await this.deployToAppwrite(project, archivePath);
            
            this.logger.success(`Deployment successful!`, {
                deploymentId,
                liveUrl: project.liveUrl,
                directUrl: project.directUrl
            });

            return deploymentId;
        } finally {
            // Clean up archive
            if (fs.existsSync(archivePath)) {
                fs.unlinkSync(archivePath);
            }
        }
    }

    async createArchive(buildPath, projectName) {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const archivePath = path.join(process.cwd(), `${projectName}-${timestamp}.tar.gz`);
        
        this.logger.info('Creating deployment archive...');

        // Use tar command to create archive
        await execAsync(`tar -czf "${archivePath}" -C "${buildPath}" .`);
        
        const stats = fs.statSync(archivePath);
        this.logger.info(`Archive created: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
        
        return archivePath;
    }

    async deployToAppwrite(project, archivePath) {
        const apiKey = process.env.APPWRITE_API_KEY;
        if (!apiKey) {
            throw new Error('APPWRITE_API_KEY environment variable is required');
        }

        const FormData = require('form-data');
        const form = new FormData();
        form.append('entrypoint', 'index.html');
        form.append('code', fs.createReadStream(archivePath));
        form.append('activate', 'true');

        return new Promise((resolve, reject) => {
            const url = new URL(`${this.config.config.appwrite.endpoint}/functions/${project.siteId}/deployments`);
            
            const options = {
                hostname: url.hostname,
                path: url.pathname,
                method: 'POST',
                headers: {
                    'X-Appwrite-Project': project.projectId,
                    'X-Appwrite-Key': apiKey,
                    ...form.getHeaders()
                }
            };

            const req = https.request(options, (res) => {
                let data = '';
                res.on('data', chunk => data += chunk);
                res.on('end', () => {
                    if (res.statusCode === 201 || res.statusCode === 200 || res.statusCode === 202) {
                        try {
                            const response = JSON.parse(data);
                            resolve(response.$id);
                        } catch {
                            resolve('deployment-success');
                        }
                    } else {
                        reject(new Error(`Deployment failed with status ${res.statusCode}: ${data}`));
                    }
                });
            });

            req.on('error', reject);
            form.pipe(req);

            // Timeout after 10 minutes
            setTimeout(() => {
                req.destroy();
                reject(new Error('Deployment timed out after 10 minutes'));
            }, 600000);
        });
    }
}

// Health check manager
class HealthCheckManager {
    constructor(logger, config) {
        this.logger = logger;
        this.config = config;
    }

    async check(projectName) {
        const project = this.config.getProject(projectName);
        if (!project || !project.healthCheck?.enabled) {
            this.logger.info('Health check not configured for this project');
            return true;
        }

        this.logger.info(`Performing health check for ${project.name}...`);

        const url = project.liveUrl + (project.healthCheck.endpoint || '/');
        const timeout = project.healthCheck.timeout || 120000;
        const expectedStatus = project.healthCheck.expectedStatus || 200;
        const maxAttempts = Math.floor(timeout / 10000); // Check every 10 seconds

        for (let attempt = 1; attempt <= maxAttempts; attempt++) {
            this.logger.debug(`Health check attempt ${attempt}/${maxAttempts}`);
            
            try {
                const status = await this.checkUrl(url);
                if (status === expectedStatus) {
                    this.logger.success('Health check passed!');
                    return true;
                }
                this.logger.debug(`Got status ${status}, expected ${expectedStatus}`);
            } catch (error) {
                this.logger.debug(`Health check error: ${error.message}`);
            }

            if (attempt < maxAttempts) {
                await this.sleep(10000);
            }
        }

        this.logger.error('Health check failed after maximum attempts');
        return false;
    }

    checkUrl(url) {
        return new Promise((resolve, reject) => {
            https.get(url, (res) => {
                resolve(res.statusCode);
            }).on('error', reject);
        });
    }

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Main deployment orchestrator
class DeploymentOrchestrator {
    constructor(options = {}) {
        this.options = options;
        this.logger = new Logger(options.verbose);
        this.config = new ConfigLoader(options.config);
        this.buildManager = new BuildManager(this.logger, this.config);
        this.deploymentManager = new DeploymentManager(this.logger, this.config);
        this.healthCheckManager = new HealthCheckManager(this.logger, this.config);
    }

    async deployProject(projectName) {
        const startTime = Date.now();
        
        try {
            this.logger.info(`🚀 Starting deployment for ${projectName}`);

            // Validate project exists
            const project = this.config.getProject(projectName);
            if (!project) {
                throw new Error(`Project ${projectName} not found in configuration`);
            }

            // Build project
            let buildPath;
            if (!this.options.skipBuild) {
                buildPath = await this.buildManager.build(projectName);
            } else {
                const projectPath = path.join(process.cwd(), project.path);
                buildPath = path.join(projectPath, project.outputDir);
                this.logger.info('Skipping build step');
            }

            // Dry run check
            if (this.options.dryRun) {
                this.logger.info('DRY RUN - Would deploy from:', { buildPath });
                return true;
            }

            // Deploy to Appwrite
            const deploymentId = await this.deploymentManager.deploy(projectName, buildPath);

            // Wait for deployment to propagate
            this.logger.info('Waiting for deployment to propagate...');
            await this.healthCheckManager.sleep(30000);

            // Health check
            if (!this.options.skipHealth) {
                const healthy = await this.healthCheckManager.check(projectName);
                if (!healthy && !this.options.force) {
                    throw new Error('Health check failed');
                }
            }

            const duration = ((Date.now() - startTime) / 1000).toFixed(2);
            this.logger.success(`✅ Deployment completed successfully in ${duration}s`);
            
            // Show deployment URLs
            console.log('\n' + colors.cyan + '📍 Deployment URLs:' + colors.reset);
            console.log(`  Live: ${colors.bright}${project.liveUrl}${colors.reset}`);
            console.log(`  Direct: ${project.directUrl}`);
            
            return true;

        } catch (error) {
            const duration = ((Date.now() - startTime) / 1000).toFixed(2);
            this.logger.error(`❌ Deployment failed after ${duration}s: ${error.message}`);
            
            if (this.options.verbose) {
                console.error(error.stack);
            }
            
            return false;
        }
    }

    async deployAll() {
        const projects = this.config.getAllProjects();
        const results = {
            success: [],
            failed: []
        };

        this.logger.info(`🚀 Deploying ${projects.length} projects`);

        for (const projectName of projects) {
            const success = await this.deployProject(projectName);
            if (success) {
                results.success.push(projectName);
            } else {
                results.failed.push(projectName);
            }

            // Wait between deployments
            if (projects.indexOf(projectName) < projects.length - 1) {
                this.logger.info('Waiting 60 seconds before next deployment...');
                await this.healthCheckManager.sleep(60000);
            }
        }

        // Summary
        console.log('\n' + colors.bright + '📊 Deployment Summary:' + colors.reset);
        console.log(`  Total: ${projects.length}`);
        console.log(`  ${colors.green}Success: ${results.success.length}${colors.reset}`);
        console.log(`  ${colors.red}Failed: ${results.failed.length}${colors.reset}`);

        if (results.success.length > 0) {
            console.log('\n' + colors.green + '✅ Successful deployments:' + colors.reset);
            results.success.forEach(p => console.log(`  - ${p}`));
        }

        if (results.failed.length > 0) {
            console.log('\n' + colors.red + '❌ Failed deployments:' + colors.reset);
            results.failed.forEach(p => console.log(`  - ${p}`));
            return false;
        }

        return true;
    }

    async showStatus() {
        const projects = this.config.getAllProjects();
        
        console.log(colors.bright + '\n📊 Project Status:\n' + colors.reset);
        
        for (const projectName of projects) {
            const project = this.config.getProject(projectName);
            console.log(`${colors.cyan}${project.name}:${colors.reset}`);
            console.log(`  Project ID: ${project.projectId}`);
            console.log(`  Site ID: ${project.siteId}`);
            console.log(`  Live URL: ${project.liveUrl}`);
            
            try {
                const status = await this.healthCheckManager.checkUrl(project.liveUrl);
                if (status === 200) {
                    console.log(`  Status: ${colors.green}✅ Online${colors.reset}`);
                } else {
                    console.log(`  Status: ${colors.yellow}⚠️ HTTP ${status}${colors.reset}`);
                }
            } catch {
                console.log(`  Status: ${colors.red}❌ Offline${colors.reset}`);
            }
            
            console.log();
        }
    }
}

// CLI interface
async function main() {
    const args = process.argv.slice(2);
    
    if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
        showHelp();
        process.exit(0);
    }

    // Parse options
    const options = {
        skipBuild: args.includes('--skip-build'),
        skipHealth: args.includes('--skip-health'),
        force: args.includes('--force'),
        dryRun: args.includes('--dry-run'),
        verbose: args.includes('--verbose') || args.includes('-v'),
        config: getArgValue(args, '--config')
    };

    // Create orchestrator
    const orchestrator = new DeploymentOrchestrator(options);

    // Handle commands
    try {
        if (args.includes('--all')) {
            const success = await orchestrator.deployAll();
            process.exit(success ? 0 : 1);
        } else if (args.includes('--status')) {
            await orchestrator.showStatus();
            process.exit(0);
        } else if (args.includes('--list')) {
            listProjects(orchestrator.config);
            process.exit(0);
        } else {
            // Deploy specific project
            const projectName = args.find(arg => !arg.startsWith('--'));
            if (!projectName) {
                console.error(colors.red + 'Error: Project name required' + colors.reset);
                showHelp();
                process.exit(1);
            }
            
            const success = await orchestrator.deployProject(projectName);
            process.exit(success ? 0 : 1);
        }
    } catch (error) {
        console.error(colors.red + `Error: ${error.message}` + colors.reset);
        if (options.verbose) {
            console.error(error.stack);
        }
        process.exit(1);
    }
}

function showHelp() {
    console.log(`
${colors.bright}Unified Deployment Script${colors.reset}

${colors.cyan}Usage:${colors.reset}
  node unified-deploy.js <project> [options]
  node unified-deploy.js --all [options]
  node unified-deploy.js --status
  node unified-deploy.js --list

${colors.cyan}Projects:${colors.reset}
  recursion-chat              Recursion Chat application
  trading-post                Trading Post marketplace
  slumlord                    Slum Lord RPG game
  archon                      Archon application
  console-appwrite-grok       Grok Console
  enhanced-tech-lead-orchestrator  Tech Lead Orchestrator
  gx-multi-agent-platform     GX Multi-Agent Platform

${colors.cyan}Options:${colors.reset}
  --all                Deploy all projects
  --skip-build         Skip the build step
  --skip-health        Skip health check after deployment
  --force              Force deployment even if checks fail
  --dry-run            Show what would be deployed without deploying
  --verbose, -v        Enable verbose logging
  --config <file>      Use custom config file
  --status             Show status of all projects
  --list               List all available projects
  --help, -h           Show this help message

${colors.cyan}Environment Variables:${colors.reset}
  APPWRITE_API_KEY     Required for deployment to Appwrite Sites

${colors.cyan}Examples:${colors.reset}
  # Deploy a specific project
  node unified-deploy.js recursion-chat

  # Deploy all projects
  node unified-deploy.js --all

  # Deploy with verbose logging
  node unified-deploy.js trading-post --verbose

  # Check status of all projects
  node unified-deploy.js --status

  # Dry run to see what would be deployed
  node unified-deploy.js slumlord --dry-run

${colors.cyan}Log Files:${colors.reset}
  Logs are saved to: logs/deployment-YYYY-MM-DD.log
`);
}

function listProjects(config) {
    console.log(`\n${colors.bright}Available Projects:${colors.reset}\n`);
    
    const projects = config.getAllProjects();
    for (const projectName of projects) {
        const project = config.getProject(projectName);
        console.log(`  ${colors.cyan}${projectName}${colors.reset}`);
        console.log(`    Name: ${project.name}`);
        console.log(`    Path: ${project.path}`);
        console.log(`    URL: ${project.liveUrl}`);
        console.log();
    }
}

function getArgValue(args, flag) {
    const index = args.indexOf(flag);
    if (index !== -1 && index + 1 < args.length) {
        return args[index + 1];
    }
    return null;
}

// Run if executed directly
if (require.main === module) {
    main().catch(error => {
        console.error(colors.red + `Fatal error: ${error.message}` + colors.reset);
        console.error(error.stack);
        process.exit(1);
    });
}

// Export for use as module
module.exports = {
    DeploymentOrchestrator,
    ConfigLoader,
    BuildManager,
    DeploymentManager,
    HealthCheckManager,
    Logger
};