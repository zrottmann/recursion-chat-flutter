// Global test setup for all Vitest tests
import { beforeAll, afterAll, beforeEach, afterEach, vi } from 'vitest';
import '@testing-library/jest-dom';

// Mock external services before any imports
vi.mock('../src/services/appwriteIntegration.js', () => ({
  appwriteIntegration: {
    executeFunction: vi.fn().mockResolvedValue({ success: true }),
    getFunction: vi.fn().mockResolvedValue({ status: 'active' }),
    listExecutions: vi.fn().mockResolvedValue([]),
    callGrokAPI: vi.fn().mockResolvedValue({ 
      success: true, 
      data: { 
        explanation: 'Mock analysis',
        commands: [] 
      }
    })
  }
}));

vi.mock('../src/services/diagnostics.js', () => ({
  diagnostics: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
    success: vi.fn(),
    getMetrics: vi.fn().mockReturnValue({
      totalMissions: 0,
      activeMissions: 0,
      memoryUsage: 100
    })
  }
}));

// Global test environment setup
beforeAll(() => {
  // Mock console methods to reduce noise in tests (unless specifically testing them)
  if (!process.env.DEBUG_TESTS) {
    global.console = {
      ...console,
      log: vi.fn(),
      debug: vi.fn(),
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn()
    };
  }

  // Set test environment variables
  process.env.NODE_ENV = 'test';
  process.env.TEST_MODE = 'true';

  // Don't use fake timers globally - causes test timeouts
  // vi.useFakeTimers();
});

afterAll(() => {
  // Restore all mocks
  vi.restoreAllMocks();
  // vi.useRealTimers();
});

beforeEach(() => {
  // Clear all mocks before each test
  vi.clearAllMocks();

  // Reset timers if using fake timers
  // vi.clearAllTimers();
});

afterEach(() => {
  // Clean up after each test
  vi.resetAllMocks();
});

// E2E utilities for browser-based tests
global.e2eUtils = {
  // Create a new page for testing
  async createPage() {
    if (global.browser) {
      const page = await global.browser.newPage();
      await page.setViewport({ width: 1280, height: 720 });
      return page;
    }
    throw new Error('Browser not available. Make sure E2E global setup is running.');
  },

  // Screenshot utility for debugging
  async screenshot(page, name) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `tests/e2e/screenshots/${name}-${timestamp}.png`;
    
    // Ensure screenshots directory exists
    const fs = await import('fs');
    const fsPromises = fs.promises;
    try {
      await fsPromises.mkdir('tests/e2e/screenshots', { recursive: true });
    } catch (error) {
      // Directory might already exist
    }
    
    await page.screenshot({ path: filename, fullPage: true });
    return filename;
  },

  // Mock orchestrator dashboard
  async mockOrchestratorDashboard(page) {
    // Simple mock for testing - just add to page context
    await page.evaluateOnNewDocument(() => {
      window.mockOrchestratorData = {
        status: 'operational',
        agents: 5,
        missions: 2
      };
    });
  }
};

// Global test utilities
global.testUtils = {
  // Mock orchestrator agent
  mockAgent: (name, capabilities = []) => ({
    name,
    id: `agent-${name}-${Date.now()}`,
    capabilities,
    status: 'available',
    currentTask: null,
    performance: {
      successRate: 0.95,
      averageTime: 120,
      qualityScore: 88
    }
  }),

  // Mock mission
  mockMission: (complexity = 'medium') => ({
    id: `mission-${Date.now()}`,
    name: 'Test Mission',
    complexity,
    requirements: ['requirement1', 'requirement2'],
    estimatedTime: complexity === 'simple' ? 4 : complexity === 'medium' ? 24 : 168,
    riskLevel: complexity === 'simple' ? 'low' : complexity === 'medium' ? 'medium' : 'high',
    qualityGates: ['code-quality', 'security-audit', 'performance-test']
  }),

  // Wait utility for async tests
  wait: (ms = 0) => new Promise(resolve => setTimeout(resolve, ms)),

  // Mock quality gate result
  mockQualityGate: (passed = true, score = 85) => ({
    passed,
    score,
    criteria: [
      { name: 'code-coverage', passed: score >= 80, score: score - 5 },
      { name: 'security-scan', passed: score >= 75, score: score + 5 },
      { name: 'performance', passed: score >= 70, score }
    ],
    timestamp: new Date().toISOString()
  }),

  // Mock risk assessment
  mockRiskAssessment: (level = 'medium') => ({
    level,
    factors: [
      { type: 'technical', level: level === 'low' ? 'low' : 'medium', impact: 0.3 },
      { type: 'resource', level: 'low', impact: 0.2 },
      { type: 'timeline', level: level === 'high' ? 'high' : 'low', impact: 0.4 }
    ],
    mitigations: ['mitigation1', 'mitigation2'],
    overallScore: level === 'low' ? 0.2 : level === 'medium' ? 0.5 : 0.8
  })
};

// Custom matchers for orchestrator-specific testing
import { expect } from 'vitest';

expect.extend({
  toBeValidAgent(received) {
    const pass = received &&
      typeof received.name === 'string' &&
      typeof received.id === 'string' &&
      Array.isArray(received.capabilities) &&
      ['available', 'busy', 'offline'].includes(received.status);

    return {
      pass,
      message: () => pass
        ? `Expected ${received} not to be a valid agent`
        : `Expected ${received} to be a valid agent with name, id, capabilities, and status`
    };
  },

  toBeValidMission(received) {
    const pass = received &&
      typeof received.id === 'string' &&
      typeof received.name === 'string' &&
      ['simple', 'medium', 'complex'].includes(received.complexity) &&
      (received.timeline?.estimatedDays !== undefined || received.estimatedTime !== undefined) &&
      (received.riskAssessment?.overall || received.riskLevel);

    return {
      pass,
      message: () => pass
        ? `Expected ${received} not to be a valid mission`
        : `Expected ${received} to be a valid mission with id, name, complexity, timeline/estimatedTime, and riskAssessment/riskLevel`
    };
  },

  toPassQualityGate(received, minimumScore = 80) {
    const pass = received &&
      received.passed === true &&
      typeof received.score === 'number' &&
      received.score >= minimumScore;

    return {
      pass,
      message: () => pass
        ? `Expected quality gate not to pass with score ${received?.score}`
        : `Expected quality gate to pass with score >= ${minimumScore}, got ${received?.score}`
    };
  }
});
