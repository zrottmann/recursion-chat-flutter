import { defineConfig } from 'vitest/config';
import baseConfig from './vitest.config.js';

export default defineConfig({
  ...baseConfig,
  test: {
    ...baseConfig.test,
    
    // Unit test specific settings
    name: 'unit',
    
    // Only include unit tests
    include: [
      'tests/unit/**/*.{test,spec}.{js,jsx,ts,tsx}',
      'src/**/*.unit.{test,spec}.{js,jsx,ts,tsx}'
    ],
    
    // Fast execution for unit tests
    pool: 'threads',
    poolOptions: {
      threads: {
        minThreads: 1,
        maxThreads: 2
      }
    },
    
    // Faster timeout for unit tests
    testTimeout: 5000,
    hookTimeout: 5000,
    
    // Unit test specific coverage
    coverage: {
      ...baseConfig.test.coverage,
      reportsDirectory: './coverage/unit',
      thresholds: {
        global: {
          branches: 85,
          functions: 85,
          lines: 85,
          statements: 85
        }
      }
    },
    
    // Reporter for unit tests
    reporter: ['verbose'],
    
    // Mock external dependencies for unit tests
    deps: {
      external: ['puppeteer']
    }
  }
});