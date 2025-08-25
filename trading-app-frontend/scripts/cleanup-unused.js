#!/usr/bin/env node
/**
 * Script to clean up common unused imports and variables
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Common unused imports to remove
const _unusedImports = [
  // React imports that are unused (using jsx-runtime)
  /^import React from ['"]react['"];?\s*$/gm,
  
  // Bootstrap components that are imported but never used
  /import\s+\{[^}]*Card[^}]*\}\s+from\s+['"]react-bootstrap['"];?\s*$/gm,
  /import\s+\{[^}]*Modal[^}]*\}\s+from\s+['"]react-bootstrap['"];?\s*$/gm,
  /import\s+\{[^}]*Alert[^}]*\}\s+from\s+['"]react-bootstrap['"];?\s*$/gm,
];

// Files to process
const srcDir = path.join(__dirname, '..', 'src');

function processFile(filePath) {
  if (!filePath.endsWith('.jsx') && !filePath.endsWith('.js')) {
    return;
  }
  
  if (filePath.includes('test') || filePath.includes('spec')) {
    return; // Skip test files
  }

  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;

    // Remove unused React imports
    if (content.includes('import React from') && !content.includes('React.')) {
      content = content.replace(/^import React from ['"]react['"];?\s*\n/gm, '');
      modified = true;
    }

    // Clean up unused variables with underscore prefix
    content = content.replace(/(\w+)(\s*=\s*[^;]+;)/g, (match, varName, assignment) => {
      if (varName && !varName.startsWith('_') && assignment) {
        // Check if variable is used elsewhere
        const regex = new RegExp(`\\b${varName}\\b`, 'g');
        const matches = content.match(regex);
        if (matches && matches.length === 1) {
          // Only one match means it's only declared, never used
          return `_${varName}${assignment}`;
        }
      }
      return match;
    });

    // Save if modified
    if (modified) {
      fs.writeFileSync(filePath, content);
      console.log(`Cleaned up: ${path.relative(srcDir, filePath)}`);
    }
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error.message);
  }
}

function walkDirectory(dir) {
  const files = fs.readdirSync(dir);
  
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      walkDirectory(filePath);
    } else {
      processFile(filePath);
    }
  }
}

console.log('Starting cleanup of unused imports...');
walkDirectory(srcDir);
console.log('Cleanup complete!');