/**
 * Diagnostic Logger for Claude CLI Function
 * Provides debugging for template generation issues
 */

export class ClaudeDiagnostics {
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
    console.log(`[${category}] ${message}`, JSON.stringify(data, null, 2));
    
    return entry;
  }

  async checkEnvironment() {
    const diagnostics = {
      runtime: {},
      modules: {},
      filesystem: {},
      templates: {}
    };

    // Runtime check
    diagnostics.runtime = {
      nodeVersion: process.version,
      platform: process.platform,
      cwd: process.cwd(),
      memory: process.memoryUsage(),
      moduleType: 'module', // ES6 modules
      appwriteFunction: process.env.APPWRITE_FUNCTION_ID
    };
    this.log('RUNTIME', 'Runtime environment', diagnostics.runtime);

    // Check required modules
    diagnostics.modules = {
      fs: await this.checkModule('fs/promises'),
      path: await this.checkModule('path'),
      generators: await this.checkModule('./generators/projectGenerator.js'),
      validators: await this.checkModule('./validators/codeValidator.js'),
      templates: await this.checkModule('./templates/templateManager.js')
    };
    this.log('MODULES', 'Module availability', diagnostics.modules);

    // File system checks
    diagnostics.filesystem = {
      canWriteTemp: await this.checkWritePermission('/tmp'),
      canWriteCwd: await this.checkWritePermission(process.cwd()),
      tempDir: process.env.TEMP || process.env.TMP || '/tmp'
    };
    this.log('FILESYSTEM', 'File system access', diagnostics.filesystem);

    // Template availability
    try {
      const templates = ['react', 'vue', 'express', 'static'];
      diagnostics.templates = {};
      for (const template of templates) {
        diagnostics.templates[template] = await this.checkTemplate(template);
      }
      this.log('TEMPLATES', 'Template availability', diagnostics.templates);
    } catch (error) {
      diagnostics.templates = { error: error.message };
      this.log('TEMPLATES', 'Template check failed', diagnostics.templates);
    }

    return diagnostics;
  }

  async checkModule(modulePath) {
    try {
      if (modulePath.startsWith('./')) {
        // Local module - check if file exists
        const fs = await import('fs/promises');
        const path = await import('path');
        const fullPath = path.join(process.cwd(), modulePath);
        await fs.access(fullPath);
        return { available: true, path: fullPath };
      } else {
        // Node module - try to import
        await import(modulePath);
        return { available: true };
      }
    } catch (error) {
      return { 
        available: false, 
        error: error.message,
        type: error.code 
      };
    }
  }

  async checkTemplate(templateName) {
    try {
      // Check if template function exists
      const templateManager = await import('./templates/templateManager.js');
      if (templateManager.getTemplate) {
        return { available: true, type: 'function' };
      }
      return { available: false, error: 'No getTemplate function' };
    } catch (error) {
      return { available: false, error: error.message };
    }
  }

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

  diagnoseError(error) {
    const diagnosis = {
      error: error.message,
      type: error.constructor.name,
      diagnostics: []
    };

    // Module import errors
    if (error.message.includes('Cannot find module') || error.message.includes('MODULE_NOT_FOUND')) {
      const moduleName = error.message.match(/Cannot find module '(.+)'/)?.[1];
      diagnosis.diagnostics.push({
        issue: `Module '${moduleName}' not found`,
        possibleCauses: [
          'Module file missing',
          'Incorrect import path',
          'ES6/CommonJS mismatch',
          'Module not uploaded with function'
        ],
        solutions: [
          'Ensure all files are included in deployment',
          'Check import paths are correct',
          'Use ES6 imports consistently',
          'Include all subdirectories in deployment'
        ]
      });
    }

    // Syntax errors
    if (error.message.includes('SyntaxError') || error.message.includes('Unexpected')) {
      diagnosis.diagnostics.push({
        issue: 'JavaScript syntax error',
        possibleCauses: [
          'ES6 syntax not supported',
          'Invalid JSON',
          'Missing semicolon or bracket',
          'Template string error'
        ],
        solutions: [
          'Check function runtime supports ES6',
          'Validate JSON structures',
          'Review recent code changes',
          'Use a linter to find syntax issues'
        ]
      });
    }

    // Type errors
    if (error.message.includes('TypeError')) {
      diagnosis.diagnostics.push({
        issue: 'Type error in code',
        possibleCauses: [
          'Undefined variable accessed',
          'Function not imported correctly',
          'Null/undefined reference',
          'Incorrect function signature'
        ],
        solutions: [
          'Check all imports are correct',
          'Validate function parameters',
          'Add null checks',
          'Review function call signatures'
        ]
      });
    }

    // File system errors
    if (error.message.includes('ENOENT') || error.message.includes('no such file')) {
      diagnosis.diagnostics.push({
        issue: 'File not found',
        possibleCauses: [
          'File not included in deployment',
          'Incorrect file path',
          'Case sensitivity issue',
          'File in wrong directory'
        ],
        solutions: [
          'Verify all files are deployed',
          'Check file paths are correct',
          'Ensure correct case in filenames',
          'Use relative paths correctly'
        ]
      });
    }

    this.log('DIAGNOSIS', 'Error diagnosed', diagnosis);
    return diagnosis;
  }

  generateReport() {
    const report = {
      summary: {
        totalLogs: this.logs.length,
        duration: Date.now() - this.startTime,
        errors: this.logs.filter(l => l.category.includes('ERROR')).length,
        warnings: this.logs.filter(l => l.category.includes('WARNING')).length
      },
      categories: {},
      logs: this.logs,
      recommendations: []
    };

    // Count by category
    this.logs.forEach(log => {
      report.categories[log.category] = (report.categories[log.category] || 0) + 1;
    });

    // Generate recommendations
    const hasModuleError = this.logs.some(l => 
      l.category === 'MODULES' && 
      Object.values(l.data).some(m => !m.available)
    );

    const hasFileSystemError = this.logs.some(l => 
      l.category === 'FILESYSTEM' && 
      (!l.data.canWriteTemp || !l.data.canWriteCwd)
    );

    if (hasModuleError) {
      report.recommendations.push({
        priority: 'HIGH',
        issue: 'Missing required modules',
        action: 'Ensure all module files are included in deployment'
      });
    }

    if (hasFileSystemError) {
      report.recommendations.push({
        priority: 'MEDIUM',
        issue: 'File system write permission issues',
        action: 'Use /tmp directory for temporary files or avoid file operations'
      });
    }

    return report;
  }
}

export default ClaudeDiagnostics;