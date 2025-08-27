#!/usr/bin/env node
/**
 * Secrets Management Script
 * Scans for secrets, manages .gitignore, and helps with security
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const crypto = require('crypto');

class SecretsManager {
    constructor(basePath) {
        this.basePath = basePath;
        this.secretsPath = path.join(basePath, 'secrets');
        this.foundSecrets = [];
        this.gitignoreEntries = [];
        this.errors = [];
        
        // Secret patterns to detect
        this.secretPatterns = [
            // API Keys
            { name: 'API Key', pattern: /(?:api[_-]?key|apikey)\s*[:=]\s*['"`]([a-zA-Z0-9_\-]{20,})['"]/gi, severity: 'high' },
            
            // Appwrite specific
            { name: 'Appwrite Project ID', pattern: /APPWRITE_PROJECT_ID\s*[:=]\s*['"`]([a-zA-Z0-9_\-]{20,})['"]/gi, severity: 'medium' },
            { name: 'Appwrite API Key', pattern: /APPWRITE_API_KEY\s*[:=]\s*['"`]([a-zA-Z0-9_\-]{40,})['"]/gi, severity: 'high' },
            { name: 'Appwrite Endpoint', pattern: /APPWRITE_ENDPOINT\s*[:=]\s*['"`](https?:\/\/[^'"]+)['"]/gi, severity: 'low' },
            
            // Generic secrets
            { name: 'Secret Key', pattern: /(?:secret[_-]?key|secretkey)\s*[:=]\s*['"`]([a-zA-Z0-9_\-]{16,})['"]/gi, severity: 'high' },
            { name: 'Password', pattern: /password\s*[:=]\s*['"`]([^'"]{6,})['"]/gi, severity: 'high' },
            { name: 'Token', pattern: /(?:access[_-]?token|token)\s*[:=]\s*['"`]([a-zA-Z0-9_\-\.]{20,})['"]/gi, severity: 'high' },
            
            // Database URLs
            { name: 'Database URL', pattern: /DATABASE_URL\s*[:=]\s*['"`]([^'"]+)['"]/gi, severity: 'high' },
            { name: 'MongoDB URI', pattern: /MONGODB?_URI\s*[:=]\s*['"`](mongodb[^'"]+)['"]/gi, severity: 'high' },
            
            // OAuth & Auth
            { name: 'OAuth Client Secret', pattern: /(?:client[_-]?secret|oauth[_-]?secret)\s*[:=]\s*['"`]([a-zA-Z0-9_\-]{16,})['"]/gi, severity: 'high' },
            { name: 'JWT Secret', pattern: /JWT_SECRET\s*[:=]\s*['"`]([a-zA-Z0-9_\-]{16,})['"]/gi, severity: 'high' },
            
            // Cloud provider keys
            { name: 'AWS Access Key', pattern: /AWS_ACCESS_KEY_ID\s*[:=]\s*['"`]([A-Z0-9]{20})['"]/gi, severity: 'high' },
            { name: 'AWS Secret Key', pattern: /AWS_SECRET_ACCESS_KEY\s*[:=]\s*['"`]([a-zA-Z0-9\/+]{40})['"]/gi, severity: 'high' },
            
            // Private keys
            { name: 'Private Key', pattern: /-----BEGIN[A-Z\s]*PRIVATE KEY-----/gi, severity: 'critical' },
            
            // Email & Communication
            { name: 'Email Password', pattern: /(?:email[_-]?password|smtp[_-]?password)\s*[:=]\s*['"`]([^'"]{6,})['"]/gi, severity: 'medium' }
        ];
    }

    log(message, level = 'info') {
        const colors = {
            info: '\x1b[36m',    // cyan
            warn: '\x1b[33m',    // yellow
            error: '\x1b[31m',   // red
            success: '\x1b[32m', // green
            critical: '\x1b[41m\x1b[37m' // white on red
        };
        const reset = '\x1b[0m';
        console.log(`${colors[level] || ''}${message}${reset}`);
    }

    // Scan directory for secrets
    scanForSecrets(dirPath = this.basePath, level = 0) {
        if (level > 5) return; // Prevent deep recursion

        try {
            const items = fs.readdirSync(dirPath);
            
            for (const item of items) {
                const itemPath = path.join(dirPath, item);
                
                // Skip common non-secret directories
                if (item.startsWith('.') && !item.endsWith('.env') && item !== '.env') continue;
                if (['node_modules', 'dist', 'build', '.git', 'archives'].includes(item)) continue;

                const stats = fs.statSync(itemPath);
                
                if (stats.isDirectory()) {
                    this.scanForSecrets(itemPath, level + 1);
                } else {
                    this.scanFile(itemPath);
                }
            }
        } catch (error) {
            this.errors.push(`Cannot scan directory ${dirPath}: ${error.message}`);
        }
    }

    // Scan individual file for secrets
    scanFile(filePath) {
        try {
            const content = fs.readFileSync(filePath, 'utf8');
            const relativePath = path.relative(this.basePath, filePath);
            
            for (const patternDef of this.secretPatterns) {
                const matches = content.matchAll(patternDef.pattern);
                
                for (const match of matches) {
                    this.foundSecrets.push({
                        file: relativePath,
                        line: this.getLineNumber(content, match.index),
                        type: patternDef.name,
                        severity: patternDef.severity,
                        value: this.maskSecret(match[1]),
                        fullMatch: match[0],
                        position: match.index
                    });
                }
            }
        } catch (error) {
            // Skip binary files or unreadable files
            if (!error.message.includes('invalid character')) {
                this.errors.push(`Cannot scan file ${filePath}: ${error.message}`);
            }
        }
    }

    // Get line number for a position in text
    getLineNumber(text, position) {
        return text.substring(0, position).split('\n').length;
    }

    // Mask secret values for display
    maskSecret(secret) {
        if (!secret) return '[EMPTY]';
        if (secret.length <= 8) {
            return '*'.repeat(secret.length);
        }
        const start = secret.substring(0, 4);
        const end = secret.substring(secret.length - 4);
        return `${start}${'*'.repeat(secret.length - 8)}${end}`;
    }

    // Create secure .gitignore entries
    updateGitignore() {
        this.log('\n🔒 Updating .gitignore for security...');
        
        const gitignorePath = path.join(this.basePath, '.gitignore');
        let gitignoreContent = '';
        
        // Read existing .gitignore
        if (fs.existsSync(gitignorePath)) {
            gitignoreContent = fs.readFileSync(gitignorePath, 'utf8');
        }

        // Essential security entries
        const securityEntries = [
            '# Security - Environment Variables',
            '*.env',
            '.env*',
            '!.env.example',
            '!.env.template',
            '',
            '# Security - Secrets and Keys',
            '/secrets/',
            '*.key',
            '*.pem',
            '*.p12',
            '*.pfx',
            'id_rsa*',
            'id_dsa*',
            'id_ed25519*',
            'id_ecdsa*',
            '',
            '# Security - Logs and Temp Files',
            '*.log',
            'npm-debug.log*',
            'yarn-debug.log*',
            'yarn-error.log*',
            '*.tmp',
            '*.temp',
            '',
            '# Security - OS and Editor Files',
            '.DS_Store',
            'Thumbs.db',
            '*~',
            '.vscode/settings.json',
            '.idea/',
            '',
            '# Security - Build and Deploy Artifacts',
            'deployment.log.json',
            'cleanup-*.json',
            'build-secrets.json'
        ];

        // Check which entries are missing
        const newEntries = [];
        for (const entry of securityEntries) {
            if (entry.startsWith('#') || entry === '') {
                continue; // Skip comments and empty lines for checking
            }
            
            if (!gitignoreContent.includes(entry)) {
                newEntries.push(entry);
            }
        }

        if (newEntries.length > 0) {
            gitignoreContent += '\n\n# Added by Claude Secrets Manager\n';
            gitignoreContent += securityEntries.join('\n');
            
            fs.writeFileSync(gitignorePath, gitignoreContent);
            this.log(`✅ Updated .gitignore with ${newEntries.length} new security entries`);
            
            this.gitignoreEntries = newEntries;
        } else {
            this.log('✅ .gitignore is already secure');
        }
    }

    // Create secrets directory with templates
    createSecretsDirectory() {
        this.log('\n📁 Setting up secrets directory...');

        if (!fs.existsSync(this.secretsPath)) {
            fs.mkdirSync(this.secretsPath, { recursive: true });
        }

        // Create .env template
        const envTemplate = `# Environment Variables Template
# Copy this file to .env and fill in your actual values
# NEVER commit .env files to version control

# Appwrite Configuration
APPWRITE_PROJECT_ID=your_project_id_here
APPWRITE_ENDPOINT=https://nyc.cloud.appwrite.io/v1
APPWRITE_API_KEY=your_api_key_here

# Database Configuration (if needed)
# DATABASE_URL=your_database_url_here

# OAuth Configuration (if needed)
# OAUTH_CLIENT_ID=your_client_id_here
# OAUTH_CLIENT_SECRET=your_client_secret_here

# Custom API Keys (if needed)
# CUSTOM_API_KEY=your_custom_api_key_here

# Last updated: ${new Date().toISOString().split('T')[0]}
`;

        const templatePath = path.join(this.secretsPath, '.env.template');
        if (!fs.existsSync(templatePath)) {
            fs.writeFileSync(templatePath, envTemplate);
            this.log('✅ Created .env.template');
        }

        // Create secrets management guide
        const secretsGuide = `# Secrets Management Guide

## Quick Start

1. **Copy template**: \`cp secrets/.env.template .env\`
2. **Fill in values**: Edit .env with your actual secrets
3. **Never commit**: .env is in .gitignore - never commit secrets
4. **Rotate regularly**: Change API keys periodically

## Common Fixes

### If Secrets Are Leaked
1. **Rotate immediately**: Change all exposed keys/passwords
2. **Check git history**: \`git log --all --grep="api"\` 
3. **Clean history**: Use \`git filter-branch\` if needed
4. **Update .gitignore**: Ensure .env files are ignored

### Environment Setup
- **Development**: Use .env.development
- **Staging**: Use .env.staging  
- **Production**: Use .env.production or environment variables

### Appwrite Secrets
- Get Project ID from Appwrite Console → Settings
- Create API Key with appropriate scopes
- Use environment-specific endpoints

## Security Best Practices

1. **Use environment variables** in production
2. **Rotate keys regularly** (every 90 days)
3. **Limit key permissions** to minimum required
4. **Monitor key usage** in service dashboards
5. **Use different keys** for different environments

## Emergency Procedures

If secrets are compromised:
1. Rotate all affected keys immediately
2. Check application logs for suspicious activity
3. Review git history for leaked credentials
4. Update team about the incident

---
*Last updated: ${new Date().toISOString().split('T')[0]}*
`;

        const guidePath = path.join(this.secretsPath, 'SECRETS_MANAGEMENT.md');
        fs.writeFileSync(guidePath, secretsGuide);
        this.log('✅ Created secrets management guide');
    }

    // Generate security report
    generateReport() {
        const report = {
            timestamp: new Date().toISOString(),
            summary: {
                totalSecrets: this.foundSecrets.length,
                criticalSecrets: this.foundSecrets.filter(s => s.severity === 'critical').length,
                highRiskSecrets: this.foundSecrets.filter(s => s.severity === 'high').length,
                mediumRiskSecrets: this.foundSecrets.filter(s => s.severity === 'medium').length,
                lowRiskSecrets: this.foundSecrets.filter(s => s.severity === 'low').length,
                filesScanned: new Set(this.foundSecrets.map(s => s.file)).size,
                gitignoreUpdated: this.gitignoreEntries.length > 0,
                errors: this.errors.length
            },
            secrets: this.foundSecrets.map(secret => ({
                ...secret,
                fullMatch: undefined // Remove full match for security
            })),
            gitignoreEntries: this.gitignoreEntries,
            errors: this.errors,
            recommendations: this.generateRecommendations()
        };

        const reportPath = path.join(this.basePath, 'security-scan-report.json');
        fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

        return { report, reportPath };
    }

    generateRecommendations() {
        const recommendations = [];

        if (this.foundSecrets.length > 0) {
            recommendations.push('🔴 CRITICAL: Secrets found in code. Move to environment variables immediately.');
        }

        const criticalCount = this.foundSecrets.filter(s => s.severity === 'critical').length;
        if (criticalCount > 0) {
            recommendations.push(`🔴 ${criticalCount} critical secrets found. These must be removed immediately.`);
        }

        const highCount = this.foundSecrets.filter(s => s.severity === 'high').length;
        if (highCount > 0) {
            recommendations.push(`🟡 ${highCount} high-risk secrets found. Consider rotating these keys.`);
        }

        if (this.foundSecrets.some(s => s.file.includes('.env') && !s.file.includes('template'))) {
            recommendations.push('⚠️ Secrets found in .env files. Ensure these files are in .gitignore.');
        }

        if (!fs.existsSync(path.join(this.basePath, '.gitignore'))) {
            recommendations.push('🔴 No .gitignore file found. Create one to prevent secret leaks.');
        }

        if (recommendations.length === 0) {
            recommendations.push('✅ No major security issues found. Continue following security best practices.');
        }

        return recommendations;
    }

    // Check git for leaked secrets
    checkGitHistory() {
        this.log('\n🔍 Checking git history for leaked secrets...');
        
        try {
            // Check if we're in a git repository
            execSync('git rev-parse --git-dir', { stdio: 'ignore' });
            
            // Check recent commits for potential secrets
            const gitLog = execSync('git log --oneline -10', { encoding: 'utf8' });
            const suspiciousKeywords = ['key', 'secret', 'password', 'token', 'api'];
            
            const suspiciousCommits = gitLog.split('\n').filter(line => 
                suspiciousKeywords.some(keyword => line.toLowerCase().includes(keyword))
            );

            if (suspiciousCommits.length > 0) {
                this.log('⚠️ Found potentially suspicious commits:', 'warn');
                suspiciousCommits.forEach(commit => this.log(`  ${commit}`, 'warn'));
                this.log('  Consider reviewing these commits for leaked secrets', 'warn');
            } else {
                this.log('✅ No suspicious commits found in recent history');
            }
        } catch (error) {
            this.log('ℹ️ Not a git repository or git not available', 'info');
        }
    }

    // Main execution
    async run() {
        this.log('🔐 Starting comprehensive security scan...\n');

        // Scan for secrets
        this.log('🔍 Scanning for secrets in codebase...');
        this.scanForSecrets();

        // Update .gitignore
        this.updateGitignore();

        // Create secrets directory
        this.createSecretsDirectory();

        // Check git history
        this.checkGitHistory();

        // Generate report
        this.log('\n📊 Generating security report...');
        const { report, reportPath } = this.generateReport();

        // Display results
        this.log('\n🔐 Security Scan Results:');
        this.log(`   Total secrets found: ${report.summary.totalSecrets}`);
        this.log(`   Critical: ${report.summary.criticalSecrets}`);
        this.log(`   High risk: ${report.summary.highRiskSecrets}`);
        this.log(`   Medium risk: ${report.summary.mediumRiskSecrets}`);
        this.log(`   Low risk: ${report.summary.lowRiskSecrets}`);
        this.log(`   Files with secrets: ${report.summary.filesScanned}`);

        if (report.summary.totalSecrets > 0) {
            this.log('\n🔍 Found secrets by file:', 'warn');
            const secretsByFile = {};
            this.foundSecrets.forEach(secret => {
                if (!secretsByFile[secret.file]) {
                    secretsByFile[secret.file] = [];
                }
                secretsByFile[secret.file].push(secret);
            });

            Object.entries(secretsByFile).forEach(([file, secrets]) => {
                this.log(`   ${file}:`, 'warn');
                secrets.forEach(secret => {
                    const severity = secret.severity.toUpperCase();
                    const severityColor = {
                        'CRITICAL': 'critical',
                        'HIGH': 'error', 
                        'MEDIUM': 'warn',
                        'LOW': 'info'
                    }[severity] || 'info';
                    
                    this.log(`     Line ${secret.line}: ${secret.type} (${severity}) - ${secret.value}`, severityColor);
                });
            });
        }

        this.log('\n📋 Recommendations:');
        report.recommendations.forEach(rec => this.log(`   ${rec}`));

        this.log(`\n📄 Full report saved: ${reportPath}`);

        if (report.summary.criticalSecrets > 0 || report.summary.highRiskSecrets > 0) {
            this.log('\n🚨 ACTION REQUIRED: Critical or high-risk secrets found!', 'critical');
            this.log('1. Move secrets to .env files', 'critical');
            this.log('2. Add .env to .gitignore', 'critical');
            this.log('3. Rotate exposed API keys', 'critical');
            this.log('4. Remove secrets from version control', 'critical');
        } else {
            this.log('\n✅ Security scan completed successfully!', 'success');
        }

        return report;
    }
}

// Run if called directly
if (require.main === module) {
    const manager = new SecretsManager(process.cwd());
    manager.run().catch(error => {
        console.error('Fatal error:', error.message);
        process.exit(1);
    });
}

module.exports = SecretsManager;