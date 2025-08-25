/**
 * Vitest Test Setup
 * 
 * Global test configuration and mocks for the trading post application test suite.
 * Converted from Jest to Vitest for better Vite integration.
 */

import '@testing-library/jest-dom';
import { expect, beforeEach, afterEach, vi } from 'vitest';

// Mock performance API if not available
if (!global.performance) {
  global.performance = {
    now: vi.fn(() => Date.now()),
    memory: {
      usedJSHeapSize: 1000000,
      totalJSHeapSize: 2000000,
      jsHeapSizeLimit: 4000000
    },
    getEntriesByType: vi.fn(() => []),
    mark: vi.fn(),
    measure: vi.fn()
  };
}

// Mock fetch globally
global.fetch = vi.fn(() =>
  Promise.resolve({
    ok: true,
    status: 200,
    json: () => Promise.resolve({ data: [] }),
    text: () => Promise.resolve(''),
    headers: new Map()
  })
);

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
  length: 0,
  key: vi.fn()
};
global.localStorage = localStorageMock;

// Mock sessionStorage
global.sessionStorage = localStorageMock;

// Mock console methods for cleaner test output
const originalError = console.error;
const originalWarn = console.warn;

console.error = (...args) => {
  if (args[0]?.includes?.('Warning:') || args[0]?.includes?.('React')) {
    return;
  }
  originalError(...args);
};

console.warn = (...args) => {
  if (args[0]?.includes?.('Warning:') || args[0]?.includes?.('React')) {
    return;
  }
  originalWarn(...args);
};

// Mock intersection observer
global.IntersectionObserver = vi.fn(() => ({
  observe: vi.fn(),
  disconnect: vi.fn(),
  unobserve: vi.fn()
}));

// Mock ResizeObserver
global.ResizeObserver = vi.fn(() => ({
  observe: vi.fn(),
  disconnect: vi.fn(),
  unobserve: vi.fn()
}));

// Mock requestAnimationFrame
global.requestAnimationFrame = vi.fn(cb => setTimeout(cb, 16));
global.cancelAnimationFrame = vi.fn(id => clearTimeout(id));

// Mock geolocation (safely)
Object.defineProperty(global.navigator, 'geolocation', {
  value: {
    getCurrentPosition: vi.fn((success) => 
      success({
        coords: {
          latitude: 40.7128,
          longitude: -74.0060,
          accuracy: 100
        }
      })
    ),
    watchPosition: vi.fn(),
    clearWatch: vi.fn()
  },
  writable: true
});

// Mock crypto for ID generation (safely)
Object.defineProperty(global, 'crypto', {
  value: {
    getRandomValues: vi.fn((array) => {
      for (let i = 0; i < array.length; i++) {
        array[i] = Math.floor(Math.random() * 256);
      }
      return array;
    }),
    randomUUID: vi.fn(() => 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    }))
  },
  writable: true
});

// Mock WebSocket
global.WebSocket = vi.fn(() => ({
  send: vi.fn(),
  close: vi.fn(),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  readyState: 1
}));

// Mock Appwrite SDK
vi.mock('appwrite', () => ({
  Client: vi.fn(() => ({
    setEndpoint: vi.fn().mockReturnThis(),
    setProject: vi.fn().mockReturnThis()
  })),
  Account: vi.fn(() => ({
    get: vi.fn().mockResolvedValue({ $id: 'test-user', email: 'test@example.com' }),
    create: vi.fn().mockResolvedValue({ $id: 'test-user' }),
    createEmailSession: vi.fn().mockResolvedValue({ userId: 'test-user' }),
    deleteSession: vi.fn().mockResolvedValue({}),
    createOAuth2Session: vi.fn()
  })),
  Databases: vi.fn(() => ({
    listDocuments: vi.fn().mockResolvedValue({ documents: [] }),
    createDocument: vi.fn().mockResolvedValue({ $id: 'test-doc' }),
    getDocument: vi.fn().mockResolvedValue({ $id: 'test-doc' })
  })),
  ID: {
    unique: () => 'test-id-' + Math.random().toString(36).substr(2, 9)
  }
}));

// Default test configuration
global.TEST_CONFIG = {
  API_BASE_URL: 'http://localhost:3000/api',
  TEST_USER_ID: 'test-user-123',
  TEST_TIMEOUT: 30000,
  PERFORMANCE_THRESHOLDS: {
    MATCHING_RESPONSE_TIME: 5000,
    ACCEPTANCE_RATE: 0.85,
    USER_SATISFACTION: 4.5
  }
};

// Helper functions for tests
global.testHelpers = {
  // Create mock user
  createMockUser: (overrides = {}) => ({
    id: 'test-user-123',
    name: 'Test User',
    email: 'test@example.com',
    preferences: {
      preferred_categories: ['Electronics'],
      max_distance_km: 50,
      max_value_difference_percent: 20
    },
    ...overrides
  }),

  // Create mock item
  createMockItem: (overrides = {}) => ({
    id: 'test-item-123',
    title: 'Test Item',
    description: 'Test item description',
    category: 'Electronics',
    estimated_value: 100,
    condition: 'good',
    user_id: 'test-user-456',
    ...overrides
  }),

  // Create mock match
  createMockMatch: (overrides = {}) => ({
    id: 'test-match-123',
    overall_score: 0.8,
    confidence_level: 0.9,
    value_score: 0.85,
    location_score: 0.7,
    category_score: 0.9,
    distance_km: 15,
    created_at: new Date().toISOString(),
    ...overrides
  }),

  // Wait for async operations
  waitFor: (ms = 100) => new Promise(resolve => setTimeout(resolve, ms)),

  // Mock API response
  mockApiResponse: (data, status = 200) => ({
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(data),
    text: () => Promise.resolve(JSON.stringify(data))
  }),

  // Mock performance timing
  mockPerformanceTiming: (duration = 1000) => {
    const start = performance.now();
    return {
      start,
      end: start + duration,
      duration
    };
  }
};

// Test environment setup
beforeEach(() => {
  // Clear all mocks before each test
  vi.clearAllMocks();
  
  // Reset fetch mock
  fetch.mockClear();
  
  // Reset localStorage
  localStorage.clear();
  
  // Reset performance mock
  if (performance.now.mockReturnValue) {
    performance.now.mockReturnValue(Date.now());
  }
});

afterEach(() => {
  // Clean up any timers
  vi.clearAllTimers();
  
  // Restore all mocks
  vi.restoreAllMocks();
});

// Global error handling for tests
window.addEventListener('error', (event) => {
  console.error('Test error:', event.error);
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason);
});

// Add custom matchers for Vitest
expect.extend({
  toBeWithinRange(received, floor, ceiling) {
    const pass = received >= floor && received <= ceiling;
    if (pass) {
      return {
        message: () => `expected ${received} not to be within range ${floor} - ${ceiling}`,
        pass: true
      };
    } else {
      return {
        message: () => `expected ${received} to be within range ${floor} - ${ceiling}`,
        pass: false
      };
    }
  },

  toHaveValidMatchScore(received) {
    const hasScore = received.hasOwnProperty('optimized_score') || 
                    received.hasOwnProperty('overall_score') || 
                    received.hasOwnProperty('ai_score');
    
    if (!hasScore) {
      return {
        message: () => `expected object to have a valid match score property`,
        pass: false
      };
    }

    const score = received.optimized_score || received.overall_score || received.ai_score;
    const isValidRange = score >= 0 && score <= 1;

    return {
      message: () => isValidRange ? 
        `expected score ${score} not to be in valid range 0-1` :
        `expected score ${score} to be in valid range 0-1`,
      pass: isValidRange
    };
  }
});

console.log('🧪 Vitest environment setup complete');