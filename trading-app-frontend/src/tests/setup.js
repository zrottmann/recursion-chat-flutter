/**
 * Jest Test Setup
 * 
 * Global test configuration and mocks for the AI matching engine test suite.
 */

import '@testing-library/jest-dom';

// Mock performance API if not available
if (!global.performance) {
  global.performance = {
    now: jest.fn(() => Date.now()),
    memory: {
      usedJSHeapSize: 1000000,
      totalJSHeapSize: 2000000,
      jsHeapSizeLimit: 4000000
    },
    getEntriesByType: jest.fn(() => []),
    mark: jest.fn(),
    measure: jest.fn()
  };
}

// Mock fetch globally
global.fetch = jest.fn(() =>
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
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
  length: 0,
  key: jest.fn()
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
global.IntersectionObserver = jest.fn(() => ({
  observe: jest.fn(),
  disconnect: jest.fn(),
  unobserve: jest.fn()
}));

// Mock ResizeObserver
global.ResizeObserver = jest.fn(() => ({
  observe: jest.fn(),
  disconnect: jest.fn(),
  unobserve: jest.fn()
}));

// Mock requestAnimationFrame
global.requestAnimationFrame = jest.fn(cb => setTimeout(cb, 16));
global.cancelAnimationFrame = jest.fn(id => clearTimeout(id));

// Mock geolocation
global.navigator.geolocation = {
  getCurrentPosition: jest.fn((success) => 
    success({
      coords: {
        latitude: 40.7128,
        longitude: -74.0060,
        accuracy: 100
      }
    })
  ),
  watchPosition: jest.fn(),
  clearWatch: jest.fn()
};

// Mock crypto for ID generation
global.crypto = {
  getRandomValues: jest.fn((array) => {
    for (let i = 0; i < array.length; i++) {
      array[i] = Math.floor(Math.random() * 256);
    }
    return array;
  }),
  randomUUID: jest.fn(() => 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  }))
};

// Mock WebSocket
global.WebSocket = jest.fn(() => ({
  send: jest.fn(),
  close: jest.fn(),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  readyState: 1
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
  jest.clearAllMocks();
  
  // Reset fetch mock
  fetch.mockClear();
  
  // Reset localStorage
  localStorage.clear();
  
  // Reset performance mock
  performance.now.mockReturnValue(Date.now());
});

afterEach(() => {
  // Clean up any timers
  jest.clearAllTimers();
  
  // Clear all mocks
  jest.restoreAllMocks();
});

// Global error handling for tests
window.addEventListener('error', (event) => {
  console.error('Test error:', event.error);
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason);
});

// Add custom matchers
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

console.log('🧪 Test environment setup complete');