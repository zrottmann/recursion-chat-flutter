import { defineConfig } from 'vitest/config';
import baseConfig from './vitest.config.js';

export default defineConfig({
  ...baseConfig,
  test: {
    ...baseConfig.test,
    
    // Integration test specific settings
    name: 'integration',
    
    // Only include integration tests
    include: [
      'tests/integration/**/*.{test,spec}.{js,jsx,ts,tsx}',
      'src/**/*.integration.{test,spec}.{js,jsx,ts,tsx}'
    ],
    
    // Longer timeouts for integration tests
    testTimeout: 30000,
    hookTimeout: 15000,
    
    // Sequential execution for integration tests to avoid conflicts
    pool: 'forks',
    poolOptions: {
      forks: {
        minForks: 1,
        maxForks: 1
      }
    },
    
    // Integration test specific coverage
    coverage: {
      ...baseConfig.test.coverage,
      reportsDirectory: './coverage/integration',
      thresholds: {
        global: {
          branches: 75,
          functions: 75,
          lines: 75,
          statements: 75
        }
      }
    },
    
    // Reporter for integration tests
    reporter: ['verbose', 'json'],
    outputFile: {
      json: './test-results/integration.json'
    }
  }
});