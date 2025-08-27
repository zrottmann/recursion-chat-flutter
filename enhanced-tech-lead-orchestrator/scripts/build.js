#!/usr/bin/env node

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import chalk from 'chalk';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, '..');

console.log(chalk.cyan('🏗️  Building Enhanced Tech-Lead Orchestrator...'));

async function build() {
  try {
    // Create build directory
    const buildDir = path.join(rootDir, 'dist');
    await fs.mkdir(buildDir, { recursive: true });
    
    // Copy source files
    const srcDir = path.join(rootDir, 'src');
    await copyDirectory(srcDir, path.join(buildDir, 'src'));
    
    // Copy package.json
    const packageJson = JSON.parse(await fs.readFile(path.join(rootDir, 'package.json'), 'utf8'));
    delete packageJson.devDependencies;
    delete packageJson.scripts.test;
    delete packageJson.scripts['test:watch'];
    delete packageJson.scripts['test:ui'];
    delete packageJson.scripts['test:coverage'];
    delete packageJson.scripts['test:e2e'];
    delete packageJson.scripts['test:unit'];
    delete packageJson.scripts['test:integration'];
    delete packageJson.scripts['test:all'];
    delete packageJson.scripts['test:ci'];
    delete packageJson.scripts.lint;
    delete packageJson.scripts['lint:fix'];
    delete packageJson.scripts.format;
    delete packageJson.scripts.validate;
    
    await fs.writeFile(
      path.join(buildDir, 'package.json'),
      JSON.stringify(packageJson, null, 2)
    );
    
    // Copy README
    try {
      await fs.copyFile(
        path.join(rootDir, 'README.md'),
        path.join(buildDir, 'README.md')
      );
    } catch (err) {
      console.log(chalk.yellow('⚠️  README.md not found, skipping...'));
    }
    
    console.log(chalk.green('✅ Build completed successfully!'));
    console.log(chalk.blue(`📦 Output directory: ${buildDir}`));
    
  } catch (error) {
    console.error(chalk.red('❌ Build failed:'), error);
    process.exit(1);
  }
}

async function copyDirectory(src, dest) {
  await fs.mkdir(dest, { recursive: true });
  const entries = await fs.readdir(src, { withFileTypes: true });
  
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    
    if (entry.isDirectory()) {
      await copyDirectory(srcPath, destPath);
    } else {
      await fs.copyFile(srcPath, destPath);
    }
  }
}

// Run build
build();