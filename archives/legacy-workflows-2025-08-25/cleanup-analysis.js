#!/usr/bin/env node
/**
 * Claude Directory Cleanup Analysis Script
 * Analyzes directory structure and creates inventory for optimization
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

class ClaudeAnalyzer {
    constructor(basePath) {
        this.basePath = basePath;
        this.fileInventory = {
            docs: [],
            scripts: [],
            configs: [],
            tests: [],
            projects: [],
            assets: [],
            duplicates: [],
            secrets: [],
            archives: []
        };
        this.stats = {
            totalFiles: 0,
            totalSize: 0,
            duplicateCount: 0,
            duplicateSize: 0
        };
        this.hashes = new Map();
    }

    // Get file hash for duplicate detection
    getFileHash(filePath) {
        try {
            const content = fs.readFileSync(filePath);
            return crypto.createHash('md5').update(content).digest('hex');
        } catch (error) {
            console.warn(`Warning: Could not hash ${filePath}: ${error.message}`);
            return null;
        }
    }

    // Check if file contains potential secrets
    checkForSecrets(filePath, content = null) {
        const secretPatterns = [
            /api[_-]?key[s]?\s*[:=]\s*['"][^'"]+['"]/gi,
            /secret[_-]?key[s]?\s*[:=]\s*['"][^'"]+['"]/gi,
            /password[s]?\s*[:=]\s*['"][^'"]+['"]/gi,
            /token[s]?\s*[:=]\s*['"][^'"]+['"]/gi,
            /access[_-]?token[s]?\s*[:=]\s*['"][^'"]+['"]/gi,
            /APPWRITE_[A-Z_]+\s*[:=]\s*['"][^'"]+['"]/gi,
            /DATABASE_URL\s*[:=]\s*['"][^'"]+['"]/gi,
            /NEXT_PUBLIC_[A-Z_]+\s*[:=]\s*['"][^'"]+['"]/gi
        ];

        try {
            if (!content) {
                content = fs.readFileSync(filePath, 'utf8');
            }
            
            const foundSecrets = [];
            secretPatterns.forEach((pattern, index) => {
                const matches = content.match(pattern);
                if (matches) {
                    foundSecrets.push(...matches);
                }
            });

            return foundSecrets;
        } catch (error) {
            return [];
        }
    }

    // Classify file based on extension and content
    classifyFile(filePath, stats) {
        const ext = path.extname(filePath).toLowerCase();
        const basename = path.basename(filePath).toLowerCase();
        const dirname = path.dirname(filePath);

        // Check for secrets first
        const secrets = this.checkForSecrets(filePath);
        if (secrets.length > 0) {
            this.fileInventory.secrets.push({
                path: filePath,
                size: stats.size,
                secrets: secrets,
                type: 'secret'
            });
        }

        // Documentation files
        if (ext === '.md' || basename.includes('readme')) {
            this.fileInventory.docs.push({
                path: filePath,
                size: stats.size,
                type: 'documentation',
                priority: this.getDocPriority(filePath)
            });
        }
        // Script files
        else if (['.js', '.cjs', '.mjs', '.ts', '.bat', '.ps1', '.sh'].includes(ext)) {
            this.fileInventory.scripts.push({
                path: filePath,
                size: stats.size,
                type: 'script',
                priority: this.getScriptPriority(filePath)
            });
        }
        // Configuration files
        else if (['.json', '.env', '.yaml', '.yml', '.config'].includes(ext) || 
                 basename.includes('config') || basename.includes('tsconfig')) {
            this.fileInventory.configs.push({
                path: filePath,
                size: stats.size,
                type: 'config',
                priority: this.getConfigPriority(filePath)
            });
        }
        // Test files
        else if (basename.includes('test') || dirname.includes('test') || 
                 basename.includes('spec') || ext === '.test.js') {
            this.fileInventory.tests.push({
                path: filePath,
                size: stats.size,
                type: 'test'
            });
        }
        // Asset files
        else if (['.png', '.jpg', '.jpeg', '.svg', '.ico', '.mp3', '.wav'].includes(ext)) {
            this.fileInventory.assets.push({
                path: filePath,
                size: stats.size,
                type: 'asset'
            });
        }
        // Project files (in specific directories)
        else if (dirname.includes('active-projects') || dirname.includes('enhanced-tech-lead') ||
                 dirname.includes('super-console') || dirname.includes('archon')) {
            this.fileInventory.projects.push({
                path: filePath,
                size: stats.size,
                type: 'project',
                project: this.extractProjectName(dirname)
            });
        }
        // Archive candidates (old, temp, deprecated files)
        else if (basename.includes('temp') || basename.includes('old') || 
                 basename.includes('backup') || basename.includes('deprecated') ||
                 ext === '.tar.gz' || ext === '.zip') {
            this.fileInventory.archives.push({
                path: filePath,
                size: stats.size,
                type: 'archive'
            });
        }
    }

    // Priority scoring for different file types
    getDocPriority(filePath) {
        const content = path.basename(filePath).toLowerCase();
        if (content.includes('appwrite') && content.includes('sso')) return 10; // High priority - modern
        if (content.includes('deployment') || content.includes('guide')) return 8;
        if (content.includes('mobile') || content.includes('fix')) return 7;
        if (content.includes('digitalocean') || content.includes('localhost')) return 2; // Low priority - old
        if (content.includes('supabase')) return 1; // Lowest priority - deprecated
        return 5; // Default
    }

    getScriptPriority(filePath) {
        const content = path.basename(filePath).toLowerCase();
        if (content.includes('appwrite') && (content.includes('deploy') || content.includes('sso'))) return 10;
        if (content.includes('unified') || content.includes('enhanced')) return 8;
        if (content.includes('deploy') && content.includes('fixed')) return 7;
        if (content.includes('slumlord') && content.includes('old')) return 2;
        if (content.includes('digitalocean') || content.includes('localhost')) return 1;
        return 5;
    }

    getConfigPriority(filePath) {
        const content = path.basename(filePath).toLowerCase();
        if (content.includes('appwrite') && !content.includes('old')) return 10;
        if (content.includes('package.json') && !path.dirname(filePath).includes('old')) return 8;
        if (content.includes('env') && content.includes('template')) return 7;
        if (content.includes('digitalocean') || content.includes('localhost')) return 1;
        return 5;
    }

    extractProjectName(dirname) {
        const parts = dirname.split(/[/\\]/);
        const projectNames = ['archon', 'enhanced-tech-lead', 'super-console', 'claude-code-remote', 'grok-api'];
        for (const part of parts) {
            for (const project of projectNames) {
                if (part.toLowerCase().includes(project.toLowerCase())) {
                    return project;
                }
            }
        }
        return 'unknown';
    }

    // Recursive directory analysis
    analyzeDirectory(dirPath) {
        try {
            const items = fs.readdirSync(dirPath);
            
            for (const item of items) {
                const fullPath = path.join(dirPath, item);
                
                try {
                    const stats = fs.statSync(fullPath);
                    
                    if (stats.isDirectory()) {
                        // Skip node_modules and .git
                        if (!item.startsWith('.git') && item !== 'node_modules') {
                            this.analyzeDirectory(fullPath);
                        }
                    } else {
                        this.stats.totalFiles++;
                        this.stats.totalSize += stats.size;
                        
                        // Check for duplicates
                        const hash = this.getFileHash(fullPath);
                        if (hash) {
                            if (this.hashes.has(hash)) {
                                const existing = this.hashes.get(hash);
                                this.fileInventory.duplicates.push({
                                    original: existing.path,
                                    duplicate: fullPath,
                                    size: stats.size,
                                    hash: hash
                                });
                                this.stats.duplicateCount++;
                                this.stats.duplicateSize += stats.size;
                            } else {
                                this.hashes.set(hash, { path: fullPath, size: stats.size });
                            }
                        }
                        
                        // Classify file
                        this.classifyFile(fullPath, stats);
                    }
                } catch (error) {
                    console.warn(`Warning: Could not process ${fullPath}: ${error.message}`);
                }
            }
        } catch (error) {
            console.warn(`Warning: Could not read directory ${dirPath}: ${error.message}`);
        }
    }

    // Generate analysis report
    generateReport() {
        const report = {
            timestamp: new Date().toISOString(),
            statistics: {
                ...this.stats,
                duplicatePercentage: ((this.stats.duplicateSize / this.stats.totalSize) * 100).toFixed(2),
                estimatedSavings: this.calculateEstimatedSavings()
            },
            inventory: this.fileInventory,
            recommendations: this.generateRecommendations()
        };

        return report;
    }

    calculateEstimatedSavings() {
        let savings = {
            duplicateRemoval: this.stats.duplicateSize,
            documentMerging: 0,
            scriptConsolidation: 0,
            archiveCompression: 0
        };

        // Estimate documentation merging savings (assume 70% reduction)
        const docSize = this.fileInventory.docs.reduce((sum, doc) => sum + doc.size, 0);
        savings.documentMerging = Math.floor(docSize * 0.7);

        // Estimate script consolidation savings (assume 50% reduction)
        const scriptSize = this.fileInventory.scripts.reduce((sum, script) => sum + script.size, 0);
        savings.scriptConsolidation = Math.floor(scriptSize * 0.5);

        // Estimate archive compression savings (assume 80% compression)
        const archiveSize = this.fileInventory.archives.reduce((sum, archive) => sum + archive.size, 0);
        savings.archiveCompression = Math.floor(archiveSize * 0.8);

        savings.total = Object.values(savings).reduce((sum, value) => sum + value, 0);
        savings.percentage = ((savings.total / this.stats.totalSize) * 100).toFixed(2);

        return savings;
    }

    generateRecommendations() {
        return {
            duplicates: `Remove ${this.stats.duplicateCount} duplicate files to save ${(this.stats.duplicateSize / 1024 / 1024).toFixed(2)} MB`,
            documentation: `Merge ${this.fileInventory.docs.length} documentation files by priority and topic`,
            scripts: `Consolidate ${this.fileInventory.scripts.length} scripts into unified deployment system`,
            secrets: `Secure ${this.fileInventory.secrets.length} files containing potential secrets`,
            oldWorkflows: `Archive old DigitalOcean/localhost workflows, prioritize Appwrite solutions`,
            projectOrganization: `Reorganize ${this.fileInventory.projects.length} project files into structured hierarchy`
        };
    }

    // Run complete analysis
    run() {
        console.log('🔍 Starting Claude directory analysis...');
        console.log(`📁 Analyzing: ${this.basePath}`);
        
        this.analyzeDirectory(this.basePath);
        
        const report = this.generateReport();
        
        // Save report
        fs.writeFileSync(
            path.join(this.basePath, 'cleanup-analysis-report.json'), 
            JSON.stringify(report, null, 2)
        );
        
        console.log('📊 Analysis complete!');
        console.log(`📄 Total files: ${this.stats.totalFiles}`);
        console.log(`💾 Total size: ${(this.stats.totalSize / 1024 / 1024).toFixed(2)} MB`);
        console.log(`🔄 Duplicates: ${this.stats.duplicateCount} files (${(this.stats.duplicateSize / 1024 / 1024).toFixed(2)} MB)`);
        console.log(`🔐 Secrets found: ${this.fileInventory.secrets.length} files`);
        console.log(`💡 Estimated savings: ${report.statistics.estimatedSavings.percentage}% (${(report.statistics.estimatedSavings.total / 1024 / 1024).toFixed(2)} MB)`);
        
        return report;
    }
}

// Run analysis if called directly
if (require.main === module) {
    const analyzer = new ClaudeAnalyzer(process.cwd());
    analyzer.run();
}

module.exports = ClaudeAnalyzer;