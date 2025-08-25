/**
 * Vitest Setup Verification Test
 * 
 * Comprehensive test suite to verify Vitest + Happy-DOM + React Testing Library
 * integration is working properly in the Trading Post application.
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import userEvent from '@testing-library/user-event';

// Simple test component
const TestComponent = ({ onClick, initialValue = 0 }) => {
  const [count, setCount] = React.useState(initialValue);
  
  const handleClick = () => {
    setCount(prev => prev + 1);
    onClick?.(count + 1);
  };

  return (
    <div>
      <h1 data-testid="title">Trading Post Test</h1>
      <p data-testid="count">Count: {count}</p>
      <button 
        data-testid="increment-btn"
        onClick={handleClick}
        type="button"
      >
        Increment
      </button>
      <input 
        data-testid="test-input"
        placeholder="Test input"
        defaultValue="initial"
      />
    </div>
  );
};

// Async component for testing async operations
const AsyncComponent = () => {
  const [data, setData] = React.useState(null);
  const [loading, setLoading] = React.useState(false);

  const fetchData = async () => {
    setLoading(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 100));
    setData('Fetched data');
    setLoading(false);
  };

  return (
    <div>
      <button 
        data-testid="fetch-btn"
        onClick={fetchData}
        disabled={loading}
      >
        {loading ? 'Loading...' : 'Fetch Data'}
      </button>
      {data && <p data-testid="fetched-data">{data}</p>}
    </div>
  );
};

describe('Vitest Setup Verification', () => {
  beforeEach(() => {
    // Setup before each test
    vi.clearAllMocks();
  });

  afterEach(() => {
    // Cleanup after each test
    vi.restoreAllMocks();
  });

  describe('Basic Environment Tests', () => {
    it('should have working test environment', () => {
      expect(true).toBe(true);
      expect(1 + 1).toBe(2);
    });

    it('should have access to DOM APIs via Happy-DOM', () => {
      expect(document).toBeDefined();
      expect(window).toBeDefined();
      expect(localStorage).toBeDefined();
      expect(sessionStorage).toBeDefined();
    });

    it('should have working custom matchers', () => {
      expect(0.5).toBeWithinRange(0, 1);
      
      const mockMatch = {
        overall_score: 0.85,
        confidence: 0.9
      };
      expect(mockMatch).toHaveValidMatchScore();
    });
  });

  describe('React Component Testing', () => {
    it('should render React components', () => {
      render(<TestComponent />);
      
      expect(screen.getByTestId('title')).toBeInTheDocument();
      expect(screen.getByText('Trading Post Test')).toBeInTheDocument();
    });

    it('should handle user interactions', async () => {
      const mockOnClick = vi.fn();
      render(<TestComponent onClick={mockOnClick} />);
      
      const button = screen.getByTestId('increment-btn');
      const countDisplay = screen.getByTestId('count');
      
      expect(countDisplay).toHaveTextContent('Count: 0');
      
      await userEvent.click(button);
      
      expect(countDisplay).toHaveTextContent('Count: 1');
      expect(mockOnClick).toHaveBeenCalledWith(1);
    });

    it('should handle form inputs', async () => {
      render(<TestComponent />);
      
      const input = screen.getByTestId('test-input');
      
      expect(input).toHaveValue('initial');
      
      await userEvent.clear(input);
      await userEvent.type(input, 'new value');
      
      expect(input).toHaveValue('new value');
    });

    it('should work with props', () => {
      render(<TestComponent initialValue={5} />);
      
      expect(screen.getByTestId('count')).toHaveTextContent('Count: 5');
    });
  });

  describe('Async Operations Testing', () => {
    it('should handle async operations', async () => {
      render(<AsyncComponent />);
      
      const fetchButton = screen.getByTestId('fetch-btn');
      
      expect(fetchButton).toHaveTextContent('Fetch Data');
      expect(screen.queryByTestId('fetched-data')).not.toBeInTheDocument();
      
      fireEvent.click(fetchButton);
      
      // Button should show loading state
      expect(fetchButton).toHaveTextContent('Loading...');
      expect(fetchButton).toBeDisabled();
      
      // Wait for async operation to complete
      await waitFor(() => {
        expect(screen.getByTestId('fetched-data')).toBeInTheDocument();
      });
      
      expect(screen.getByText('Fetched data')).toBeInTheDocument();
      expect(fetchButton).toHaveTextContent('Fetch Data');
      expect(fetchButton).not.toBeDisabled();
    });
  });

  describe('Mock Functions Testing', () => {
    it('should work with vi.fn() mocks', () => {
      const mockFn = vi.fn();
      
      mockFn('test argument');
      
      expect(mockFn).toHaveBeenCalledTimes(1);
      expect(mockFn).toHaveBeenCalledWith('test argument');
    });

    it('should work with return value mocks', () => {
      const mockFn = vi.fn().mockReturnValue('mocked value');
      
      expect(mockFn()).toBe('mocked value');
    });

    it('should work with resolved promise mocks', async () => {
      const mockAsyncFn = vi.fn().mockResolvedValue('async result');
      
      const result = await mockAsyncFn();
      expect(result).toBe('async result');
    });
  });

  describe('Global Test Helpers', () => {
    it('should have access to global test helpers', () => {
      expect(global.testHelpers).toBeDefined();
      expect(typeof global.testHelpers.createMockUser).toBe('function');
      expect(typeof global.testHelpers.createMockItem).toBe('function');
    });

    it('should work with test helper functions', () => {
      const mockUser = global.testHelpers.createMockUser({
        name: 'Custom Test User'
      });
      
      expect(mockUser).toEqual({
        id: 'test-user-123',
        name: 'Custom Test User',
        email: 'test@example.com',
        preferences: {
          preferred_categories: ['Electronics'],
          max_distance_km: 50,
          max_value_difference_percent: 20
        }
      });
    });

    it('should work with async test helpers', async () => {
      await global.testHelpers.waitFor(10);
      // If we get here without timeout, waitFor works
      expect(true).toBe(true);
    });
  });

  describe('Environment Configuration', () => {
    it('should have test configuration available', () => {
      expect(global.TEST_CONFIG).toBeDefined();
      expect(global.TEST_CONFIG.TEST_USER_ID).toBe('test-user-123');
      expect(global.TEST_CONFIG.TEST_TIMEOUT).toBe(30000);
    });

    it('should have mocked global APIs', () => {
      expect(global.fetch).toBeDefined();
      expect(global.localStorage).toBeDefined();
      expect(global.WebSocket).toBeDefined();
      expect(global.crypto.randomUUID).toBeDefined();
    });

    it('should work with performance API', () => {
      const timing = global.testHelpers.mockPerformanceTiming(500);
      
      expect(timing.duration).toBe(500);
      expect(timing.end - timing.start).toBe(500);
    });
  });

  describe('Error Handling', () => {
    it('should handle component errors gracefully', () => {
      const ThrowingComponent = () => {
        throw new Error('Test error');
      };
      
      // This should not crash the test
      expect(() => {
        render(<ThrowingComponent />);
      }).toThrow('Test error');
    });

    it('should handle async errors', async () => {
      const failingAsyncFn = vi.fn().mockRejectedValue(new Error('Async error'));
      
      await expect(failingAsyncFn()).rejects.toThrow('Async error');
    });
  });
});

describe('Trading Post Specific Tests', () => {
  describe('Appwrite Mocking', () => {
    it('should have Appwrite SDK mocked', async () => {
      const { Account } = await import('appwrite');
      const account = new Account();
      
      const user = await account.get();
      expect(user).toEqual({ $id: 'test-user', email: 'test@example.com' });
    });
  });

  describe('Component Integration', () => {
    // Test a simple component that might exist in your app
    it('should be ready for real component testing', () => {
      // This test verifies the setup is ready for your actual components
      const mockProps = {
        user: global.testHelpers.createMockUser(),
        items: [global.testHelpers.createMockItem()],
        onUserUpdate: vi.fn()
      };
      
      expect(mockProps.user.id).toBe('test-user-123');
      expect(mockProps.items).toHaveLength(1);
      expect(mockProps.onUserUpdate).toBeTypeOf('function');
    });
  });
});