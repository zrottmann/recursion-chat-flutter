import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "happy-dom",
    globals: true,
    setupFiles: ["./tests/setup.js"],
    include: ["tests/**/*.test.js"],
    exclude: ["node_modules/**", "dist/**"],
    // E2E test configuration
    globalSetup: ["./tests/e2e/globalSetup.js"],
    globalTeardown: ["./tests/e2e/globalTeardown.js"],
    // Increase timeout for E2E tests that involve browser operations
    testTimeout: 30000,
    hookTimeout: 10000
  }
});
