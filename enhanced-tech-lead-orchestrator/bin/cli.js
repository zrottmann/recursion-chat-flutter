#!/usr/bin/env node

// CLI Binary for Enhanced Tech-Lead Orchestrator
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Get the directory of this binary
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Import and run the main CLI
const { spawn } = await import('child_process');

const scriptPath = join(__dirname, '..', 'src', 'index.js');
const args = process.argv.slice(2);

const child = spawn('node', [scriptPath, ...args], {
  stdio: 'inherit',
  shell: process.platform === 'win32'
});

child.on('exit', (code) => {
  process.exit(code);
});

child.on('error', (error) => {
  console.error('Failed to start orchestrator:', error.message);
  process.exit(1);
});