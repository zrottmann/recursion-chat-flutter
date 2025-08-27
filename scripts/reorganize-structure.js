#!/usr/bin/env node
/**
 * Claude Directory Structure Reorganization Script
 * Creates organized folder structure and moves files accordingly
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class StructureReorganizer {
    constructor(basePath) {
        this.basePath = basePath;
        this.targetStructure = {
            'docs': {
                'deployment': [],
                'mobile': [],
                'tests': [],
                'guides': [],
                'fixes': []
            },
            'scripts': {
                'deploy': [],
                'test': [],
                'utils': []
            },
            'configs': {
                'github': [],
                'appwrite': [],
                'environments': []
            },
            'tests': [],
            'knowledge': {
                'fixes': [],
                'functions': []
            },
            'secrets': [],
            'projects': {
                'active': [],
                'archived': []
            },
            'assets': {
                'images': [],
                'sounds': [],
                'icons': []
            },
            'archives': []
        };
        this.moved = [];
        this.created = [];
        this.errors = [];
    }

    // Create directory structure
    createDirectories() {
        console.log('📁 Creating organized directory structure...');
        
        const createDir = (dirPath) => {
            if (!fs.existsSync(dirPath)) {
                fs.mkdirSync(dirPath, { recursive: true });
                this.created.push(dirPath);
                console.log(`✅ Created: ${path.relative(this.basePath, dirPath)}`);
            }
        };

        // Main directories
        Object.keys(this.targetStructure).forEach(mainDir => {
            const mainPath = path.join(this.basePath, mainDir);
            createDir(mainPath);

            // Subdirectories
            if (typeof this.targetStructure[mainDir] === 'object' && !Array.isArray(this.targetStructure[mainDir])) {
                Object.keys(this.targetStructure[mainDir]).forEach(subDir => {
                    const subPath = path.join(mainPath, subDir);
                    createDir(subPath);
                });
            }
        });
    }

    // Move file safely
    moveFile(src, dest) {
        try {
            const destDir = path.dirname(dest);
            if (!fs.existsSync(destDir)) {
                fs.mkdirSync(destDir, { recursive: true });
            }

            // Handle conflicts
            if (fs.existsSync(dest)) {
                const basename = path.basename(dest, path.extname(dest));
                const ext = path.extname(dest);
                let counter = 1;
                let newDest;
                do {
                    newDest = path.join(destDir, `${basename}_${counter}${ext}`);
                    counter++;
                } while (fs.existsSync(newDest));
                dest = newDest;
            }

            fs.renameSync(src, dest);
            this.moved.push({ from: src, to: dest });
            console.log(`📦 Moved: ${path.basename(src)} → ${path.relative(this.basePath, dest)}`);
            return true;
        } catch (error) {
            this.errors.push(`Failed to move ${src} to ${dest}: ${error.message}`);
            console.error(`❌ Error moving ${path.basename(src)}: ${error.message}`);
            return false;
        }
    }

    // Classify and move files
    organizeFiles() {
        console.log('\n📋 Organizing files into new structure...');
        
        const processDirectory = (dirPath, level = 0) => {
            if (level > 3) return; // Prevent infinite recursion

            try {
                const items = fs.readdirSync(dirPath);
                
                for (const item of items) {
                    const itemPath = path.join(dirPath, item);
                    const relativePath = path.relative(this.basePath, itemPath);
                    
                    // Skip if it's one of our new organized directories
                    if (this.isNewStructureDir(relativePath)) {
                        continue;
                    }

                    const stats = fs.statSync(itemPath);
                    
                    if (stats.isDirectory()) {
                        // Handle special directories
                        if (this.shouldMoveDirectory(item, itemPath)) {
                            this.moveDirectory(itemPath);
                        } else {
                            processDirectory(itemPath, level + 1);
                        }
                    } else {
                        this.classifyAndMoveFile(itemPath);
                    }
                }
            } catch (error) {
                console.warn(`Warning: Could not process directory ${dirPath}: ${error.message}`);
            }
        };

        processDirectory(this.basePath);
    }

    isNewStructureDir(relativePath) {
        const topLevel = relativePath.split(path.sep)[0];
        return Object.keys(this.targetStructure).includes(topLevel);
    }

    shouldMoveDirectory(dirName, dirPath) {
        // Move specific project directories
        const projectDirs = [
            'active-projects', 'enhanced-tech-lead-orchestrator', 
            'super-console', 'grok-api-integration', 'awesome-claude-code'
        ];
        
        return projectDirs.some(name => dirName.toLowerCase().includes(name.toLowerCase()));
    }

    moveDirectory(srcDir) {
        const dirName = path.basename(srcDir);
        let targetDir;

        // Determine target location
        if (dirName.includes('active-projects') || dirName.includes('enhanced-tech-lead') || 
            dirName.includes('super-console') || dirName.includes('archon')) {
            targetDir = path.join(this.basePath, 'projects', 'active', dirName);
        } else {
            targetDir = path.join(this.basePath, 'projects', 'archived', dirName);
        }

        try {
            if (!fs.existsSync(path.dirname(targetDir))) {
                fs.mkdirSync(path.dirname(targetDir), { recursive: true });
            }
            fs.renameSync(srcDir, targetDir);
            console.log(`📁 Moved directory: ${dirName} → projects/`);
            this.moved.push({ from: srcDir, to: targetDir });
        } catch (error) {
            console.error(`❌ Failed to move directory ${dirName}: ${error.message}`);
            this.errors.push(`Failed to move directory ${srcDir}: ${error.message}`);
        }
    }

    classifyAndMoveFile(filePath) {
        const basename = path.basename(filePath).toLowerCase();
        const ext = path.extname(filePath).toLowerCase();
        const relativePath = path.relative(this.basePath, filePath);

        // Skip cleanup scripts and reports
        if (basename.includes('cleanup') || basename.includes('remove-duplicates')) {
            return;
        }

        let targetPath = null;

        // Documentation files
        if (ext === '.md' || basename.includes('readme')) {
            if (basename.includes('deployment') || basename.includes('deploy')) {
                targetPath = path.join(this.basePath, 'docs', 'deployment', path.basename(filePath));
            } else if (basename.includes('mobile')) {
                targetPath = path.join(this.basePath, 'docs', 'mobile', path.basename(filePath));
            } else if (basename.includes('test')) {
                targetPath = path.join(this.basePath, 'docs', 'tests', path.basename(filePath));
            } else if (basename.includes('guide') || basename.includes('installation') || basename.includes('migration')) {
                targetPath = path.join(this.basePath, 'docs', 'guides', path.basename(filePath));
            } else if (basename.includes('fix') || basename.includes('emergency') || basename.includes('error')) {
                targetPath = path.join(this.basePath, 'docs', 'fixes', path.basename(filePath));
            } else {
                targetPath = path.join(this.basePath, 'docs', path.basename(filePath));
            }
        }
        // Script files
        else if (['.js', '.cjs', '.mjs', '.ts', '.bat', '.ps1', '.sh'].includes(ext)) {
            if (basename.includes('deploy')) {
                targetPath = path.join(this.basePath, 'scripts', 'deploy', path.basename(filePath));
            } else if (basename.includes('test')) {
                targetPath = path.join(this.basePath, 'scripts', 'test', path.basename(filePath));
            } else if (basename.includes('push') || basename.includes('set-env') || basename.includes('quick-install')) {
                targetPath = path.join(this.basePath, 'scripts', 'utils', path.basename(filePath));
            } else {
                targetPath = path.join(this.basePath, 'scripts', path.basename(filePath));
            }
        }
        // Configuration files
        else if (['.json', '.env', '.yaml', '.yml'].includes(ext) || basename.includes('config') || basename.includes('tsconfig')) {
            if (basename.includes('github') || basename.includes('workflow')) {
                targetPath = path.join(this.basePath, 'configs', 'github', path.basename(filePath));
            } else if (basename.includes('appwrite')) {
                targetPath = path.join(this.basePath, 'configs', 'appwrite', path.basename(filePath));
            } else if (ext === '.env' || basename.includes('env')) {
                targetPath = path.join(this.basePath, 'configs', 'environments', path.basename(filePath));
            } else {
                targetPath = path.join(this.basePath, 'configs', path.basename(filePath));
            }
        }
        // Asset files
        else if (['.png', '.jpg', '.jpeg', '.svg', '.ico'].includes(ext)) {
            if (basename.includes('icon')) {
                targetPath = path.join(this.basePath, 'assets', 'icons', path.basename(filePath));
            } else {
                targetPath = path.join(this.basePath, 'assets', 'images', path.basename(filePath));
            }
        }
        else if (['.mp3', '.wav', '.ogg'].includes(ext)) {
            targetPath = path.join(this.basePath, 'assets', 'sounds', path.basename(filePath));
        }
        // Archive files
        else if (['.tar.gz', '.zip', '.7z'].includes(ext) || basename.includes('old') || basename.includes('temp')) {
            targetPath = path.join(this.basePath, 'archives', path.basename(filePath));
        }

        if (targetPath && targetPath !== filePath) {
            this.moveFile(filePath, targetPath);
        }
    }

    // Create index files for directories
    createIndexFiles() {
        console.log('\n📝 Creating index files...');
        
        const createIndex = (dirPath, title, description) => {
            const indexPath = path.join(dirPath, 'INDEX.md');
            if (!fs.existsSync(indexPath)) {
                const content = `# ${title}

${description}

## Contents

${this.getDirectoryContents(dirPath)}

Last updated: ${new Date().toISOString().split('T')[0]}
`;
                fs.writeFileSync(indexPath, content);
                console.log(`📝 Created index: ${path.relative(this.basePath, indexPath)}`);
            }
        };

        // Create main indexes
        createIndex(
            path.join(this.basePath, 'docs'), 
            'Documentation Index', 
            'All documentation files organized by category.'
        );
        
        createIndex(
            path.join(this.basePath, 'scripts'), 
            'Scripts Index', 
            'Automation scripts organized by function.'
        );
        
        createIndex(
            path.join(this.basePath, 'projects', 'active'), 
            'Active Projects Index', 
            'Currently active projects and their status.'
        );

        // Create subdirectory indexes
        const subdirs = [
            { path: path.join(this.basePath, 'docs', 'deployment'), title: 'Deployment Documentation' },
            { path: path.join(this.basePath, 'docs', 'mobile'), title: 'Mobile-Related Documentation' },
            { path: path.join(this.basePath, 'docs', 'fixes'), title: 'Error Fixes and Solutions' },
            { path: path.join(this.basePath, 'scripts', 'deploy'), title: 'Deployment Scripts' },
            { path: path.join(this.basePath, 'scripts', 'utils'), title: 'Utility Scripts' }
        ];

        subdirs.forEach(dir => {
            if (fs.existsSync(dir.path)) {
                createIndex(dir.path, dir.title, `Files in the ${dir.title.toLowerCase()} category.`);
            }
        });
    }

    getDirectoryContents(dirPath) {
        try {
            const items = fs.readdirSync(dirPath)
                .filter(item => item !== 'INDEX.md')
                .map(item => {
                    const itemPath = path.join(dirPath, item);
                    const stats = fs.statSync(itemPath);
                    const type = stats.isDirectory() ? '📁' : '📄';
                    return `- ${type} ${item}`;
                })
                .join('\n');
            
            return items || '*(No files yet)*';
        } catch (error) {
            return '*(Error reading directory)*';
        }
    }

    // Generate reorganization report
    generateReport() {
        const report = {
            timestamp: new Date().toISOString(),
            summary: {
                directoriesCreated: this.created.length,
                filesMoved: this.moved.length,
                errors: this.errors.length
            },
            created: this.created,
            moved: this.moved,
            errors: this.errors
        };

        const reportPath = path.join(this.basePath, 'reorganization-report.json');
        fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
        
        console.log('\n📊 Reorganization Summary:');
        console.log(`   Directories created: ${this.created.length}`);
        console.log(`   Files moved: ${this.moved.length}`);
        console.log(`   Errors: ${this.errors.length}`);
        console.log(`   Report saved: ${reportPath}`);

        return report;
    }

    async run() {
        console.log('🏗️  Starting directory reorganization...');
        
        this.createDirectories();
        this.organizeFiles();
        this.createIndexFiles();
        
        const report = this.generateReport();
        
        console.log('\n✅ Directory reorganization completed!');
        return report;
    }
}

// Run if called directly
if (require.main === module) {
    const reorganizer = new StructureReorganizer(process.cwd());
    
    reorganizer.run().then(report => {
        console.log('\n🎉 Reorganization successful!');
        console.log('New structure created with organized folders and index files.');
    }).catch(error => {
        console.error('❌ Error during reorganization:', error.message);
        process.exit(1);
    });
}

module.exports = StructureReorganizer;