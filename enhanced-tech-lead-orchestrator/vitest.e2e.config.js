import { defineConfig } from 'vitest/config';
import baseConfig from './vitest.config.js';

export default defineConfig({
  ...baseConfig,
  test: {
    ...baseConfig.test,
    
    // E2E test specific settings
    name: 'e2e',
    
    // Use JSDOM for more complete browser-like environment in E2E
    environment: 'jsdom',
    
    // Only include E2E tests
    include: [
      'tests/e2e/**/*.{test,spec}.{js,jsx,ts,tsx}',
      'src/**/*.e2e.{test,spec}.{js,jsx,ts,tsx}'
    ],
    
    // Much longer timeouts for E2E tests
    testTimeout: 60000,
    hookTimeout: 30000,
    
    // Sequential execution for E2E tests
    pool: 'forks',
    poolOptions: {
      forks: {
        minForks: 1,
        maxForks: 1
      }
    },
    
    // E2E specific setup
    setupFiles: ['./tests/setup.js', './tests/e2e/setup.js'],
    
    // E2E test specific coverage (lower thresholds as E2E focuses on integration)
    coverage: {
      ...baseConfig.test.coverage,
      reportsDirectory: './coverage/e2e',
      thresholds: {
        global: {
          branches: 60,
          functions: 60,
          lines: 60,
          statements: 60
        }
      }
    },
    
    // Reporter for E2E tests
    reporter: ['verbose', 'json'],
    outputFile: {
      json: './test-results/e2e.json'
    },
    
    // Allow longer global setup for Puppeteer
    globalSetup: './tests/e2e/globalSetup.js',
    globalTeardown: './tests/e2e/globalTeardown.js'
  }
});