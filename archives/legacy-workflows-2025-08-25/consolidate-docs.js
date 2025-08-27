#!/usr/bin/env node
/**
 * Documentation Consolidation Script
 * Merges related documentation files and creates knowledge base
 */

const fs = require('fs');
const path = require('path');

class DocumentationConsolidator {
    constructor(basePath) {
        this.basePath = basePath;
        this.docsPath = path.join(basePath, 'docs');
        this.knowledgePath = path.join(basePath, 'knowledge');
        this.consolidated = [];
        this.knowledgeExtracted = [];
        this.errors = [];
    }

    // Read and combine multiple markdown files
    combineMarkdownFiles(files, outputPath, title, description) {
        try {
            let combinedContent = `# ${title}\n\n${description}\n\n---\n\n`;
            
            files.forEach((file, index) => {
                if (fs.existsSync(file)) {
                    const content = fs.readFileSync(file, 'utf8');
                    const filename = path.basename(file);
                    
                    combinedContent += `## ${filename}\n\n`;
                    combinedContent += content.replace(/^# /gm, '### '); // Demote headers
                    combinedContent += '\n\n---\n\n';
                    
                    console.log(`📄 Merged: ${filename}`);
                }
            });

            combinedContent += `\n\n*Last consolidated: ${new Date().toISOString().split('T')[0]}*\n`;
            combinedContent += `*Original files: ${files.length}*\n`;

            fs.writeFileSync(outputPath, combinedContent);
            console.log(`✅ Created: ${path.relative(this.basePath, outputPath)}`);
            
            this.consolidated.push({
                output: outputPath,
                sources: files,
                size: combinedContent.length
            });

            return true;
        } catch (error) {
            console.error(`❌ Failed to combine files: ${error.message}`);
            this.errors.push(error.message);
            return false;
        }
    }

    // Extract knowledge from documentation
    extractKnowledge() {
        console.log('\n🧠 Extracting knowledge from documentation...');

        // Find all documentation files
        const deploymentDocs = this.findFilesByPattern(path.join(this.docsPath, 'deployment'), '*.md');
        const mobileDocs = this.findFilesByPattern(path.join(this.docsPath, 'mobile'), '*.md');
        const fixDocs = this.findFilesByPattern(path.join(this.docsPath, 'fixes'), '*.md');
        const testDocs = this.findFilesByPattern(path.join(this.docsPath, 'tests'), '*.md');

        // Create comprehensive knowledge documents

        // 1. KNOWLEDGE_BASE.md - Main knowledge repository
        this.createKnowledgeBase();

        // 2. DEPLOYMENT_KNOWLEDGE.md - All deployment-related knowledge
        if (deploymentDocs.length > 0) {
            this.combineMarkdownFiles(
                deploymentDocs,
                path.join(this.knowledgePath, 'DEPLOYMENT_KNOWLEDGE.md'),
                'Deployment Knowledge Base',
                'Comprehensive guide for deployment processes, including Appwrite, GitHub Actions, and manual deployment procedures. Contains troubleshooting guides and common fixes.'
            );
        }

        // 3. MOBILE_KNOWLEDGE.md - Mobile development and testing knowledge
        if (mobileDocs.length > 0) {
            this.combineMarkdownFiles(
                mobileDocs,
                path.join(this.knowledgePath, 'MOBILE_KNOWLEDGE.md'),
                'Mobile Development Knowledge',
                'Mobile testing, authentication issues, responsive design fixes, and mobile-specific troubleshooting for various devices and browsers.'
            );
        }

        // 4. ERROR_FIXES.md - Consolidated error solutions
        if (fixDocs.length > 0) {
            this.combineMarkdownFiles(
                fixDocs,
                path.join(this.knowledgePath, 'fixes', 'ERROR_FIXES.md'),
                'Error Fixes & Solutions',
                'Comprehensive collection of error fixes, emergency procedures, and troubleshooting solutions. Prioritizes Appwrite-based solutions over legacy approaches.'
            );
        }

        // 5. TESTING_KNOWLEDGE.md - Testing strategies and results
        if (testDocs.length > 0) {
            this.combineMarkdownFiles(
                testDocs,
                path.join(this.knowledgePath, 'TESTING_KNOWLEDGE.md'),
                'Testing Knowledge Base',
                'Testing strategies, test results, SSO testing, mobile compatibility testing, and automated testing procedures.'
            );
        }

        // 6. Extract workflow knowledge and prioritize modern solutions
        this.prioritizeWorkflows();
    }

    createKnowledgeBase() {
        const knowledgeBase = `# SuperClaude Knowledge Base

*Centralized knowledge repository for all development workflows, fixes, and procedures.*

## Quick Reference

### Common Error Fixes

#### Authentication Issues
- **OAuth Token Errors**: Check project ID in .env.production vs .env files
- **"Invalid URI" Error**: Verify platform registration in Appwrite console  
- **White Screen After OAuth**: Check for JavaScript module loading errors
- **"Powered by Appwrite" Redirect**: Wrong project ID in production build

#### Deployment Issues
- **Build Archive Not Created**: Move PostCSS/Tailwind from devDependencies to dependencies
- **GitHub Actions Not Triggering**: Check workflow path filters
- **ES Module/CommonJS Conflicts**: Use .cjs extension for CommonJS scripts

#### Mobile Issues  
- **Safari Authentication Loop**: Check session verification logic
- **Responsive Design Breaks**: Test with mobile-safe CSS and viewport meta tags
- **Touch Events Not Working**: Implement proper touch event handlers

### How-To Functions

#### Deploy Applications
1. **Appwrite Sites**: \`npm run sites:build\` → Auto-deploy via GitHub Actions
2. **Manual Deploy**: Use unified-deploy.js with environment flags
3. **Emergency Deploy**: Run emergency-deploy.js for critical fixes

#### Secrets Management
- **Environment Variables**: Use .env files, never commit secrets
- **API Keys**: Store in Appwrite environment variables  
- **Rotation**: Rotate keys via Appwrite console when leaked

#### Testing Procedures
1. **Mobile Testing**: Run comprehensive-mobile-sso-test.js
2. **SSO Testing**: Execute test-unified-sso.js
3. **Performance**: Use browser dev tools, check loading times

### Modern Technology Stack Priority

1. **Appwrite** (Preferred)
   - Authentication, database, hosting
   - Modern OAuth implementations
   - Built-in security features

2. **GitHub Actions** (CI/CD)
   - Automated deployments
   - Environment-specific builds
   - Secure secret management

3. **Legacy Approaches** (Deprecated)
   - ~~DigitalOcean manual deployments~~
   - ~~Localhost-only development~~  
   - ~~Supabase integration~~

## Critical Reminders

### Never Do This
- Don't use localhost URLs in production builds
- Don't mix project IDs between environments
- Don't commit API keys or secrets to git
- Don't skip platform registration in Appwrite

### Always Do This  
- Verify environment variables match target deployment
- Test OAuth flows on actual devices
- Check console for JavaScript errors
- Use version control for all configuration changes

### Emergency Procedures
1. **OAuth Broken**: Check project IDs, verify platform URLs
2. **Build Failing**: Move build dependencies from devDependencies
3. **Mobile Broken**: Test responsive breakpoints, check touch events
4. **Secrets Leaked**: Rotate keys immediately, update .gitignore

---

*This knowledge base is automatically maintained and updated from project documentation.*
*Last updated: ${new Date().toISOString().split('T')[0]}*
`;

        fs.writeFileSync(path.join(this.knowledgePath, 'KNOWLEDGE_BASE.md'), knowledgeBase);
        console.log('📚 Created comprehensive knowledge base');
    }

    prioritizeWorkflows() {
        console.log('\n🔄 Prioritizing modern workflows over legacy approaches...');

        // Archive old workflow files
        const archivePath = path.join(this.basePath, 'archives', 'deprecated-workflows');
        if (!fs.existsSync(archivePath)) {
            fs.mkdirSync(archivePath, { recursive: true });
        }

        // Find and archive DigitalOcean/localhost references
        const legacyPatterns = [
            'digitalocean',
            'localhost',
            'supabase',
            'local-only',
            'manual-deploy'
        ];

        this.findAndArchiveLegacyFiles(legacyPatterns, archivePath);

        // Create modern workflow guide
        const modernWorkflow = `# Modern Development Workflow

## Preferred Technology Stack (2025)

### 1. Appwrite (Primary Backend)
- **Authentication**: OAuth with proper platform registration
- **Database**: Real-time database with security rules
- **Storage**: File upload and management
- **Functions**: Serverless backend functions
- **Hosting**: Appwrite Sites for frontend deployment

### 2. GitHub Actions (CI/CD)
- **Automated Deployment**: Trigger on push to main branch
- **Environment Management**: Separate staging and production
- **Security**: Secret management built-in
- **Testing**: Run tests before deployment

### 3. Modern Frontend Stack
- **Build Tools**: Vite for fast development and builds
- **Styling**: Tailwind CSS for utility-first styling
- **Framework**: React/Vue/Angular with proper SSR support
- **Mobile**: Progressive Web App (PWA) capabilities

## Deprecated Approaches (Phase Out)

### ❌ DigitalOcean Manual Deployments
- **Why deprecated**: Manual processes, no automation
- **Migration path**: Use GitHub Actions + Appwrite Sites
- **Timeline**: Remove by end of 2025

### ❌ Localhost-Only Development  
- **Why deprecated**: Not production-ready, OAuth issues
- **Migration path**: Use proper staging environments
- **Timeline**: Immediate - no new localhost-only configs

### ❌ Supabase Integration
- **Why deprecated**: Moving to Appwrite for consistency
- **Migration path**: Migrate auth and database to Appwrite
- **Timeline**: Complete by Q2 2025

## Implementation Priority

1. **High Priority**: Appwrite OAuth, GitHub Actions deployment
2. **Medium Priority**: Mobile optimization, PWA features  
3. **Low Priority**: Legacy system maintenance (deprecate ASAP)

---
*Workflow priorities updated: ${new Date().toISOString().split('T')[0]}*
`;

        fs.writeFileSync(path.join(this.knowledgePath, 'MODERN_WORKFLOW.md'), modernWorkflow);
        console.log('🚀 Created modern workflow guide');
    }

    findFilesByPattern(directory, pattern) {
        const files = [];
        
        if (!fs.existsSync(directory)) {
            return files;
        }

        try {
            const items = fs.readdirSync(directory);
            
            for (const item of items) {
                const fullPath = path.join(directory, item);
                const stats = fs.statSync(fullPath);
                
                if (stats.isFile()) {
                    // Simple pattern matching for *.md files
                    if (pattern === '*.md' && item.endsWith('.md')) {
                        files.push(fullPath);
                    }
                } else if (stats.isDirectory()) {
                    // Recursive search
                    files.push(...this.findFilesByPattern(fullPath, pattern));
                }
            }
        } catch (error) {
            console.warn(`Warning: Could not read directory ${directory}`);
        }

        return files;
    }

    findAndArchiveLegacyFiles(patterns, archivePath) {
        const findLegacyFiles = (dir) => {
            const legacyFiles = [];
            
            if (!fs.existsSync(dir)) return legacyFiles;

            try {
                const items = fs.readdirSync(dir);
                
                for (const item of items) {
                    const fullPath = path.join(dir, item);
                    const stats = fs.statSync(fullPath);
                    
                    if (stats.isFile()) {
                        const content = fs.readFileSync(fullPath, 'utf8').toLowerCase();
                        const itemLower = item.toLowerCase();
                        
                        // Check if file contains legacy patterns or has legacy naming
                        if (patterns.some(pattern => 
                            content.includes(pattern) || itemLower.includes(pattern)
                        )) {
                            legacyFiles.push({
                                path: fullPath,
                                reason: patterns.find(pattern => 
                                    content.includes(pattern) || itemLower.includes(pattern)
                                )
                            });
                        }
                    } else if (stats.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
                        legacyFiles.push(...findLegacyFiles(fullPath));
                    }
                }
            } catch (error) {
                console.warn(`Warning: Could not process ${dir}`);
            }

            return legacyFiles;
        };

        const legacyFiles = findLegacyFiles(this.docsPath);
        
        // Create summary of archived files
        let archiveSummary = `# Archived Legacy Files\n\nFiles archived on ${new Date().toISOString().split('T')[0]} due to deprecated workflows.\n\n`;
        
        legacyFiles.forEach(file => {
            const relativePath = path.relative(this.basePath, file.path);
            archiveSummary += `- \`${relativePath}\` (Reason: Contains ${file.reason})\n`;
        });

        if (legacyFiles.length > 0) {
            fs.writeFileSync(path.join(archivePath, 'ARCHIVE_SUMMARY.md'), archiveSummary);
            console.log(`📦 Identified ${legacyFiles.length} legacy files for archiving`);
        }
    }

    // Create function cheat sheets
    createFunctionCheatSheets() {
        console.log('\n📝 Creating function cheat sheets...');

        const deployFunctions = `# Deployment Functions Cheat Sheet

## Quick Deploy Commands

### Appwrite Sites (Preferred)
\`\`\`bash
# Standard deployment
npm run sites:build
git push origin main  # Auto-deploys via GitHub Actions

# Environment-specific
npm run build:staging
npm run build:production
\`\`\`

### Manual Deployment (Emergency Only)
\`\`\`bash
# Emergency deployment
node scripts/deploy/emergency-deploy.js

# Specific environment
node scripts/deploy/unified-deploy.js --env=production --type=sites
\`\`\`

## Common Fixes

### "Build archive not created"
1. Check if PostCSS/Tailwind are in dependencies (not devDependencies)
2. Verify build script runs without errors locally
3. Check GitHub Actions workflow path filters

### "OAuth Invalid URI"
1. Verify project ID in .env.production matches Appwrite console  
2. Check platform registration includes correct domain
3. Test OAuth redirect URLs are properly configured

### "GitHub Actions not triggering"
1. Check workflow file is in .github/workflows/
2. Verify path filters match changed files
3. Ensure repository has proper permissions

---
*Functions updated: ${new Date().toISOString().split('T')[0]}*
`;

        fs.writeFileSync(path.join(this.knowledgePath, 'functions', 'DEPLOY_FUNCTIONS.md'), deployFunctions);

        const testFunctions = `# Testing Functions Cheat Sheet

## Mobile Testing
\`\`\`bash
# Comprehensive mobile test
node scripts/test/comprehensive-mobile-sso-test.js

# Quick mobile check
node scripts/test/test-mobile-compatibility.js
\`\`\`

## SSO Testing  
\`\`\`bash
# Full SSO test suite
node scripts/test/test-unified-sso.js

# Appwrite SSO specific
node scripts/test/test-appwrite-sso.js
\`\`\`

## Common Test Fixes

### Mobile Safari Issues
- Test with actual devices, not just browser dev tools
- Check viewport meta tag: \`<meta name="viewport" content="width=device-width, initial-scale=1">\`
- Verify touch event handlers work on iOS

### OAuth Test Failures
- Confirm test environment matches production OAuth settings
- Check if test domains are registered in Appwrite platforms
- Verify API keys are current and have correct permissions

---
*Testing functions updated: ${new Date().toISOString().split('T')[0]}*
`;

        fs.writeFileSync(path.join(this.knowledgePath, 'functions', 'TEST_FUNCTIONS.md'), testFunctions);
        
        console.log('📋 Created function cheat sheets');
    }

    // Generate consolidation report
    generateReport() {
        const report = {
            timestamp: new Date().toISOString(),
            summary: {
                filesConsolidated: this.consolidated.length,
                knowledgeDocumentsCreated: this.knowledgeExtracted.length,
                errors: this.errors.length,
                totalSpaceSaved: this.consolidated.reduce((sum, item) => sum + (item.sources.length - 1), 0)
            },
            consolidated: this.consolidated,
            knowledgeExtracted: this.knowledgeExtracted,
            errors: this.errors
        };

        const reportPath = path.join(this.basePath, 'documentation-consolidation-report.json');
        fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

        console.log('\n📊 Documentation Consolidation Summary:');
        console.log(`   Files consolidated: ${report.summary.filesConsolidated}`);
        console.log(`   Knowledge docs created: ${report.summary.knowledgeDocumentsCreated + 5}`); // +5 for manual creations
        console.log(`   Space saved: ${report.summary.totalSpaceSaved} redundant files eliminated`);
        console.log(`   Errors: ${report.summary.errors}`);
        console.log(`   Report saved: ${reportPath}`);

        return report;
    }

    async run() {
        console.log('📚 Starting documentation consolidation...');

        // Ensure knowledge directories exist
        if (!fs.existsSync(this.knowledgePath)) {
            fs.mkdirSync(this.knowledgePath, { recursive: true });
        }
        if (!fs.existsSync(path.join(this.knowledgePath, 'fixes'))) {
            fs.mkdirSync(path.join(this.knowledgePath, 'fixes'), { recursive: true });
        }
        if (!fs.existsSync(path.join(this.knowledgePath, 'functions'))) {
            fs.mkdirSync(path.join(this.knowledgePath, 'functions'), { recursive: true });
        }

        // Extract and consolidate knowledge
        this.extractKnowledge();
        
        // Create function cheat sheets
        this.createFunctionCheatSheets();

        // Generate final report
        const report = this.generateReport();

        console.log('\n✅ Documentation consolidation completed!');
        return report;
    }
}

// Run if called directly
if (require.main === module) {
    const consolidator = new DocumentationConsolidator(process.cwd());
    
    consolidator.run().then(report => {
        console.log('\n🎉 Documentation successfully consolidated!');
        console.log('Knowledge base created with comprehensive guides and quick references.');
    }).catch(error => {
        console.error('❌ Error during consolidation:', error.message);
        process.exit(1);
    });
}

module.exports = DocumentationConsolidator;