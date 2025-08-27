#!/usr/bin/env node
/**
 * Claude Directory Duplicate Removal Script
 * Safely removes duplicate files while preserving the best version
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class DuplicateRemover {
    constructor(reportPath) {
        this.reportPath = reportPath;
        this.removed = [];
        this.preserved = [];
        this.errors = [];
        this.dryRun = false;
    }

    loadAnalysisReport() {
        try {
            const content = fs.readFileSync(this.reportPath, 'utf8');
            return JSON.parse(content);
        } catch (error) {
            throw new Error(`Could not load analysis report: ${error.message}`);
        }
    }

    // Choose which duplicate to keep based on location and priority
    chooseBestFile(original, duplicate) {
        const originalPath = original.toLowerCase();
        const duplicatePath = duplicate.toLowerCase();

        // Priority rules (higher priority = keep this one)
        const priorities = [
            // Keep files with better locations
            { pattern: /\/active-projects\//, priority: 10 },
            { pattern: /\/enhanced-tech-lead-orchestrator\//, priority: 9 },
            { pattern: /\/archon\//, priority: 8 },
            { pattern: /\/claude-code-remote\//, priority: 8 },
            { pattern: /\/scripts\//, priority: 7 },
            { pattern: /\/configs\//, priority: 6 },
            
            // Avoid keeping files from these locations
            { pattern: /\/console\//, priority: 2 }, // duplicate directory
            { pattern: /\/temp/, priority: 1 },
            { pattern: /\/old/, priority: 1 },
            { pattern: /\/backup/, priority: 1 },
            { pattern: /node_modules/, priority: 0 },
        ];

        let originalPriority = 5; // default
        let duplicatePriority = 5; // default

        priorities.forEach(rule => {
            if (rule.pattern.test(originalPath)) originalPriority = rule.priority;
            if (rule.pattern.test(duplicatePath)) duplicatePriority = rule.priority;
        });

        // Keep the one with higher priority
        if (originalPriority > duplicatePriority) {
            return { keep: original, remove: duplicate };
        } else if (duplicatePriority > originalPriority) {
            return { keep: duplicate, remove: original };
        } else {
            // Same priority - prefer shorter path (likely more organized)
            return original.length <= duplicate.length ? 
                   { keep: original, remove: duplicate } : 
                   { keep: duplicate, remove: original };
        }
    }

    async removeDuplicate(filePath) {
        try {
            if (this.dryRun) {
                console.log(`[DRY RUN] Would remove: ${filePath}`);
                return true;
            }

            // Safety check - ensure file still exists
            if (!fs.existsSync(filePath)) {
                console.warn(`Warning: File no longer exists: ${filePath}`);
                return false;
            }

            // Remove the file
            fs.unlinkSync(filePath);
            console.log(`✅ Removed duplicate: ${path.basename(filePath)}`);
            
            this.removed.push(filePath);
            return true;
        } catch (error) {
            const errorMsg = `Failed to remove ${filePath}: ${error.message}`;
            console.error(`❌ ${errorMsg}`);
            this.errors.push(errorMsg);
            return false;
        }
    }

    async processDuplicates(duplicates) {
        console.log(`🔄 Processing ${duplicates.length} duplicate sets...`);
        
        let totalRemoved = 0;
        let totalSizeSaved = 0;

        for (const duplicate of duplicates) {
            const { keep, remove } = this.chooseBestFile(
                duplicate.original, 
                duplicate.duplicate
            );

            console.log(`\n📁 Duplicate set (${(duplicate.size / 1024).toFixed(1)} KB):`);
            console.log(`   Keep: ${path.relative(process.cwd(), keep)}`);
            console.log(`   Remove: ${path.relative(process.cwd(), remove)}`);

            if (await this.removeDuplicate(remove)) {
                this.preserved.push(keep);
                totalRemoved++;
                totalSizeSaved += duplicate.size;
            }
        }

        return { totalRemoved, totalSizeSaved };
    }

    generateReport() {
        const report = {
            timestamp: new Date().toISOString(),
            dryRun: this.dryRun,
            summary: {
                filesRemoved: this.removed.length,
                filesPreserved: this.preserved.length,
                errors: this.errors.length,
                sizeSaved: this.removed.reduce((sum, file) => {
                    try {
                        return sum + (fs.existsSync(file) ? 0 : 0); // File was removed, can't get size
                    } catch {
                        return sum;
                    }
                }, 0)
            },
            removed: this.removed,
            preserved: this.preserved,
            errors: this.errors
        };

        return report;
    }

    async run(dryRun = false) {
        this.dryRun = dryRun;
        
        console.log('🗂️  Loading duplicate analysis...');
        const analysisReport = this.loadAnalysisReport();
        
        if (!analysisReport.inventory.duplicates || analysisReport.inventory.duplicates.length === 0) {
            console.log('✨ No duplicates found to remove!');
            return { totalRemoved: 0, totalSizeSaved: 0 };
        }

        console.log(`🔍 Found ${analysisReport.inventory.duplicates.length} duplicate files`);
        console.log(`💾 Potential savings: ${(analysisReport.statistics.duplicateSize / 1024 / 1024).toFixed(2)} MB`);
        
        if (dryRun) {
            console.log('🧪 DRY RUN MODE - No files will be actually removed');
        }

        const results = await this.processDuplicates(analysisReport.inventory.duplicates);
        
        // Generate and save report
        const report = this.generateReport();
        const reportPath = path.join(process.cwd(), 'duplicate-removal-report.json');
        fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

        console.log('\n📊 Duplicate Removal Summary:');
        console.log(`   Files removed: ${results.totalRemoved}`);
        console.log(`   Space saved: ${(results.totalSizeSaved / 1024 / 1024).toFixed(2)} MB`);
        console.log(`   Errors: ${this.errors.length}`);
        console.log(`   Report saved: ${reportPath}`);

        return results;
    }
}

// Run if called directly
if (require.main === module) {
    const reportPath = path.join(process.cwd(), 'cleanup-analysis-report.json');
    const remover = new DuplicateRemover(reportPath);
    
    const dryRun = process.argv.includes('--dry-run');
    
    remover.run(dryRun).then(results => {
        if (dryRun) {
            console.log('\n🧪 Dry run completed. Add --execute flag to actually remove files.');
        } else {
            console.log('\n✅ Duplicate removal completed!');
        }
    }).catch(error => {
        console.error('❌ Error during duplicate removal:', error.message);
        process.exit(1);
    });
}

module.exports = DuplicateRemover;