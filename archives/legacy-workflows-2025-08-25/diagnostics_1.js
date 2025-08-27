/**
 * Diagnostic Logger for GitHub CLI Function
 * Provides comprehensive debugging information for troubleshooting
 */

export class DiagnosticLogger {
  constructor() {
    this.logs = [];
    this.startTime = Date.now();
  }

  log(category, message, data = {}) {
    const entry = {
      timestamp: new Date().toISOString(),
      elapsed: Date.now() - this.startTime,
      category,
      message,
      data
    };
    
    this.logs.push(entry);
    console.log(`[${category}] ${message}`, data);
    
    return entry;
  }

  // System environment diagnostics
  async checkEnvironment() {
    const diagnostics = {
      runtime: {},
      environment: {},
      paths: {},
      authentication: {},
      dependencies: {}
    };

    // Runtime information
    diagnostics.runtime = {
      nodeVersion: process.version,
      platform: process.platform,
      arch: process.arch,
      pid: process.pid,
      uptime: process.uptime(),
      memoryUsage: process.memoryUsage(),
      cwd: process.cwd(),
      execPath: process.execPath
    };
    this.log('RUNTIME', 'Runtime environment checked', diagnostics.runtime);

    // Environment variables check
    diagnostics.environment = {
      hasGitHubToken: !!process.env.GITHUB_TOKEN,
      tokenLength: process.env.GITHUB_TOKEN?.length || 0,
      tokenPrefix: process.env.GITHUB_TOKEN?.substring(0, 4) || 'none',
      nodeEnv: process.env.NODE_ENV,
      path: process.env.PATH,
      home: process.env.HOME,
      appwriteFunction: process.env.APPWRITE_FUNCTION_ID,
      appwriteRuntime: process.env.APPWRITE_RUNTIME_NAME
    };
    this.log('ENVIRONMENT', 'Environment variables checked', diagnostics.environment);

    // Path checks
    diagnostics.paths = {
      currentDir: process.cwd(),
      scriptDir: import.meta.url,
      tempDir: process.env.TEMP || process.env.TMP || '/tmp',
      canWriteTemp: await this.checkWritePermission(process.env.TEMP || '/tmp')
    };
    this.log('PATHS', 'Path configuration checked', diagnostics.paths);

    // Authentication diagnostics
    if (process.env.GITHUB_TOKEN) {
      try {
        const response = await fetch('https://api.github.com/user', {
          headers: {
            'Authorization': `token ${process.env.GITHUB_TOKEN}`,
            'Accept': 'application/vnd.github.v3+json'
          }
        });
        
        if (response.ok) {
          const user = await response.json();
          diagnostics.authentication = {
            valid: true,
            user: user.login,
            scopes: response.headers.get('x-oauth-scopes'),
            rateLimit: response.headers.get('x-ratelimit-remaining'),
            tokenType: 'personal-access-token'
          };
          this.log('AUTH', 'GitHub authentication successful', diagnostics.authentication);
        } else {
          diagnostics.authentication = {
            valid: false,
            status: response.status,
            error: response.statusText
          };
          this.log('AUTH', 'GitHub authentication failed', diagnostics.authentication);
        }
      } catch (error) {
        diagnostics.authentication = {
          valid: false,
          error: error.message,
          type: 'network-error'
        };
        this.log('AUTH', 'Authentication check failed', diagnostics.authentication);
      }
    } else {
      diagnostics.authentication = {
        valid: false,
        error: 'GITHUB_TOKEN not found in environment variables'
      };
      this.log('AUTH', 'No GitHub token found', diagnostics.authentication);
    }

    // Check for CLI tools (even though we don't use them)
    diagnostics.dependencies = {
      fetch: typeof fetch !== 'undefined',
      gitInstalled: await this.checkCommand('git --version'),
      ghInstalled: await this.checkCommand('gh --version'),
      npmInstalled: await this.checkCommand('npm --version'),
      nodeModules: await this.checkNodeModules()
    };
    this.log('DEPENDENCIES', 'Dependencies checked', diagnostics.dependencies);

    return diagnostics;
  }

  // Check if a command exists
  async checkCommand(command) {
    try {
      const { exec } = await import('child_process');
      const { promisify } = await import('util');
      const execAsync = promisify(exec);
      
      const result = await execAsync(command);
      return {
        available: true,
        output: result.stdout.trim().substring(0, 50)
      };
    } catch (error) {
      return {
        available: false,
        error: error.message
      };
    }
  }

  // Check write permissions
  async checkWritePermission(path) {
    try {
      const fs = await import('fs/promises');
      const testFile = `${path}/test-${Date.now()}.txt`;
      await fs.writeFile(testFile, 'test');
      await fs.unlink(testFile);
      return true;
    } catch (error) {
      return false;
    }
  }

  // Check node_modules
  async checkNodeModules() {
    try {
      const fs = await import('fs/promises');
      const path = await import('path');
      const modulesPath = path.join(process.cwd(), 'node_modules');
      const stats = await fs.stat(modulesPath);
      return {
        exists: true,
        isDirectory: stats.isDirectory()
      };
    } catch (error) {
      return {
        exists: false,
        error: error.message
      };
    }
  }

  // Diagnose specific error
  diagnoseError(error) {
    const diagnosis = {
      error: error.message,
      type: error.constructor.name,
      stack: error.stack,
      diagnostics: []
    };

    // Common error patterns
    if (error.message.includes('not found')) {
      diagnosis.diagnostics.push({
        issue: 'Command or module not found',
        possibleCauses: [
          'CLI tool not installed',
          'Module not in node_modules',
          'Incorrect path'
        ],
        solutions: [
          'Use REST API instead of CLI',
          'Check node_modules installation',
          'Verify import paths'
        ]
      });
    }

    if (error.message.includes('401') || error.message.includes('Unauthorized')) {
      diagnosis.diagnostics.push({
        issue: 'Authentication failed',
        possibleCauses: [
          'Invalid GitHub token',
          'Token expired',
          'Missing token scopes',
          'Token not in environment variables'
        ],
        solutions: [
          'Check GITHUB_TOKEN in function environment variables',
          'Verify token has correct scopes',
          'Generate new token if expired'
        ]
      });
    }

    if (error.message.includes('EACCES') || error.message.includes('permission')) {
      diagnosis.diagnostics.push({
        issue: 'Permission denied',
        possibleCauses: [
          'No write permission in directory',
          'Function sandbox restrictions',
          'File system read-only'
        ],
        solutions: [
          'Use temp directory for file operations',
          'Avoid file system operations',
          'Use in-memory operations'
        ]
      });
    }

    if (error.message.includes('Cannot find module')) {
      const moduleName = error.message.match(/Cannot find module '(.+)'/)?.[1];
      diagnosis.diagnostics.push({
        issue: `Module '${moduleName}' not found`,
        possibleCauses: [
          'Module not installed',
          'Incorrect import path',
          'ES6/CommonJS mismatch'
        ],
        solutions: [
          'Check package.json dependencies',
          'Verify import uses correct path',
          'Check module type (ES6 vs CommonJS)'
        ]
      });
    }

    if (error.message.includes('fetch')) {
      diagnosis.diagnostics.push({
        issue: 'Network request failed',
        possibleCauses: [
          'Network connectivity issue',
          'GitHub API down',
          'Rate limiting',
          'Invalid URL'
        ],
        solutions: [
          'Check network connectivity',
          'Verify API endpoint',
          'Check rate limit status',
          'Validate request format'
        ]
      });
    }

    this.log('ERROR_DIAGNOSIS', 'Error diagnosed', diagnosis);
    return diagnosis;
  }

  // Generate summary report
  generateReport() {
    return {
      summary: {
        totalLogs: this.logs.length,
        duration: Date.now() - this.startTime,
        categories: this.logs.reduce((acc, log) => {
          acc[log.category] = (acc[log.category] || 0) + 1;
          return acc;
        }, {}),
        errors: this.logs.filter(l => l.category === 'ERROR').length,
        warnings: this.logs.filter(l => l.category === 'WARNING').length
      },
      logs: this.logs,
      timestamp: new Date().toISOString()
    };
  }
}

// Export for use in main function
export default DiagnosticLogger;