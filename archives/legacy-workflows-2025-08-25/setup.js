#!/usr/bin/env node

/**
 * GX Multi-Agent Platform Setup Script
 * This script sets up the platform with minimal configuration to get it running
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const execAsync = promisify(exec);
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Color codes for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  blue: '\x1b[34m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function checkPrerequisites() {
  log('\n🔍 Checking prerequisites...', 'blue');
  
  // Check Node.js version
  const nodeVersion = process.version;
  const majorVersion = parseInt(nodeVersion.split('.')[0].substring(1));
  
  if (majorVersion < 18) {
    throw new Error(`Node.js version 18+ required. Current: ${nodeVersion}`);
  }
  log(`✅ Node.js ${nodeVersion}`, 'green');
  
  // Check pnpm
  try {
    const { stdout } = await execAsync('pnpm --version');
    log(`✅ pnpm ${stdout.trim()}`, 'green');
  } catch {
    log('⚠️  pnpm not found. Installing...', 'yellow');
    await execAsync('npm install -g pnpm@8.15.1');
    log('✅ pnpm installed', 'green');
  }
  
  // Check if .env exists
  const envPath = path.join(__dirname, '.env');
  try {
    await fs.access(envPath);
    log('✅ .env file found', 'green');
  } catch {
    log('⚠️  .env file not found. Creating from template...', 'yellow');
    const envExample = await fs.readFile(path.join(__dirname, '.env.example'), 'utf-8');
    await fs.writeFile(envPath, envExample);
    log('✅ .env file created (please update with your actual values)', 'green');
  }
}

async function installDependencies() {
  log('\n📦 Installing dependencies...', 'blue');
  
  try {
    await execAsync('pnpm install', { cwd: __dirname });
    log('✅ Dependencies installed', 'green');
  } catch (error) {
    log(`⚠️  Some dependencies failed to install: ${error.message}`, 'yellow');
  }
}

async function setupRedis() {
  log('\n🔧 Checking Redis...', 'blue');
  
  try {
    // Try to connect to Redis
    const Redis = (await import('ioredis')).default;
    const redis = new Redis({
      host: 'localhost',
      port: 6379,
      lazyConnect: true,
      connectTimeout: 1000
    });
    
    await redis.connect();
    await redis.ping();
    await redis.quit();
    log('✅ Redis is running', 'green');
    return true;
  } catch {
    log('⚠️  Redis is not running', 'yellow');
    log('   Please install and start Redis:', 'yellow');
    log('   - Windows: Download from https://github.com/microsoftarchive/redis/releases', 'yellow');
    log('   - Or use Docker: docker run -d -p 6379:6379 redis', 'yellow');
    return false;
  }
}

async function setupPostgreSQL() {
  log('\n🔧 Checking PostgreSQL...', 'blue');
  
  try {
    // Try to connect to PostgreSQL
    const pg = (await import('pg')).default;
    const client = new pg.Client({
      connectionString: process.env.DATABASE_URL || 'postgresql://localhost:5432/gx_platform'
    });
    
    await client.connect();
    await client.query('SELECT NOW()');
    await client.end();
    log('✅ PostgreSQL is running', 'green');
    return true;
  } catch {
    log('⚠️  PostgreSQL is not running', 'yellow');
    log('   Please install and start PostgreSQL:', 'yellow');
    log('   - Windows: Download from https://www.postgresql.org/download/windows/', 'yellow');
    log('   - Or use Docker: docker run -d -p 5432:5432 -e POSTGRES_PASSWORD=gxpass postgres', 'yellow');
    return false;
  }
}

async function createStartupScript() {
  log('\n📝 Creating startup script...', 'blue');
  
  const startScript = `#!/usr/bin/env node

import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

console.log('🚀 Starting GX Multi-Agent Platform...');

// Start the orchestrator in development mode
const orchestrator = spawn('node', [
  '--experimental-specifier-resolution=node',
  path.join(__dirname, 'orchestrator', 'cli', 'index.js'),
  'demo'
], {
  cwd: __dirname,
  stdio: 'inherit',
  env: {
    ...process.env,
    NODE_ENV: 'development'
  }
});

orchestrator.on('error', (err) => {
  console.error('Failed to start orchestrator:', err);
});

orchestrator.on('exit', (code) => {
  console.log(\`Orchestrator exited with code \${code}\`);
  process.exit(code);
});

// Handle Ctrl+C
process.on('SIGINT', () => {
  orchestrator.kill('SIGINT');
  process.exit();
});
`;

  const startPath = path.join(__dirname, 'start.js');
  await fs.writeFile(startPath, startScript);
  await fs.chmod(startPath, '755');
  log('✅ Created start.js', 'green');
}

async function createDockerCompose() {
  log('\n🐳 Creating Docker Compose configuration...', 'blue');
  
  const dockerCompose = `version: '3.8'

services:
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 5s
      timeout: 3s
      retries: 5

  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_USER: gxuser
      POSTGRES_PASSWORD: gxpass
      POSTGRES_DB: gx_platform
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U gxuser -d gx_platform"]
      interval: 5s
      timeout: 3s
      retries: 5

volumes:
  redis_data:
  postgres_data:
`;

  const dockerPath = path.join(__dirname, 'docker-compose.yml');
  await fs.writeFile(dockerPath, dockerCompose);
  log('✅ Created docker-compose.yml', 'green');
}

async function showSummary(redisOk, postgresOk) {
  log('\n' + '='.repeat(60), 'bright');
  log('📋 GX Multi-Agent Platform Setup Summary', 'bright');
  log('='.repeat(60), 'bright');
  
  log('\n✅ Completed:', 'green');
  log('  - Prerequisites checked', 'green');
  log('  - Dependencies installed', 'green');
  log('  - Environment file created', 'green');
  log('  - Startup script created', 'green');
  log('  - Docker Compose file created', 'green');
  
  if (!redisOk || !postgresOk) {
    log('\n⚠️  Required Services:', 'yellow');
    if (!redisOk) {
      log('  - Redis needs to be installed and running', 'yellow');
    }
    if (!postgresOk) {
      log('  - PostgreSQL needs to be installed and running', 'yellow');
    }
    
    log('\n🐳 Quick Start with Docker:', 'blue');
    log('  docker-compose up -d', 'blue');
  }
  
  log('\n📝 Next Steps:', 'blue');
  log('  1. Update .env file with your actual API keys', 'blue');
  log('  2. Ensure Redis and PostgreSQL are running', 'blue');
  log('  3. Run: node start.js', 'blue');
  
  log('\n🎮 Available Commands:', 'blue');
  log('  node orchestrator/cli/index.js plan <prompt>  - Create a plan', 'blue');
  log('  node orchestrator/cli/index.js run <planId>   - Execute a plan', 'blue');
  log('  node orchestrator/cli/index.js status         - Check system status', 'blue');
  log('  node orchestrator/cli/index.js demo           - Run demo scenario', 'blue');
  
  log('\n' + '='.repeat(60), 'bright');
}

async function main() {
  try {
    log('🚀 GX Multi-Agent Platform Setup', 'bright');
    log('='.repeat(40), 'bright');
    
    await checkPrerequisites();
    await installDependencies();
    const redisOk = await setupRedis();
    const postgresOk = await setupPostgreSQL();
    await createStartupScript();
    await createDockerCompose();
    
    await showSummary(redisOk, postgresOk);
    
    log('\n✨ Setup completed successfully!', 'green');
    
  } catch (error) {
    log(`\n❌ Setup failed: ${error.message}`, 'red');
    process.exit(1);
  }
}

// Run setup
main().catch(console.error);