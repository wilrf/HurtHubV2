import '@testing-library/jest-dom'
import { cleanup } from '@testing-library/react'
import { expect, afterEach, vi } from 'vitest'

// Cleanup after each test case
afterEach(() => {
  cleanup()
})

// Mock environment variables for testing
vi.mock('../config/env', () => ({
  env: {
    appName: 'Charlotte Economic Development Platform',
    appVersion: '1.0.0',
    appEnv: 'test',
    apiBaseUrl: 'http://localhost:3001/api/v1',
    websocketUrl: 'ws://localhost:3001',
    enableAIFeatures: false,
    enableRealTime: true,
    enableAnalytics: false,
    enableExport: true,
    debugMode: true,
    mockApi: true,
    showDevTools: false,
    isDevelopment: () => false,
    isStaging: () => false,
    isProduction: () => false,
    hasOpenAI: () => false,
    hasMapbox: () => false,
    hasAnalytics: () => false,
    hasSentry: () => false,
  },
}))

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {}

  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value.toString()
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key]
    }),
    clear: vi.fn(() => {
      store = {}
    }),
  }
})()

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
})

// Mock sessionStorage
const sessionStorageMock = (() => {
  let store: Record<string, string> = {}

  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value.toString()
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key]
    }),
    clear: vi.fn(() => {
      store = {}
    }),
  }
})()

Object.defineProperty(window, 'sessionStorage', {
  value: sessionStorageMock,
})

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})

// Mock IntersectionObserver
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}))

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}))

// Mock crypto.randomUUID
Object.defineProperty(global, 'crypto', {
  value: {
    randomUUID: vi.fn(() => `test-uuid-${  Math.random().toString(36).substr(2, 9)}`),
  },
})

// Mock console methods in test environment
if (import.meta.env.MODE === 'test') {
  global.console = {
    ...console,
    log: vi.fn(),
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  }
}

// Custom matchers
expect.extend({
  toBeInTheDocument: (received) => {
    const pass = received && received.ownerDocument && received.ownerDocument === document
    return {
      message: () => `expected element ${pass ? 'not ' : ''}to be in the document`,
      pass,
    }
  },
})

// Global test utilities
global.testUtils = {
  // Helper to wait for next tick
  waitForNextTick: () => new Promise(resolve => setTimeout(resolve, 0)),
  
  // Helper to create mock company data
  createMockCompany: (overrides = {}) => ({
    id: `test-company-${  Math.random().toString(36).substr(2, 9)}`,
    name: 'Test Company',
    industry: 'Technology',
    location: {
      headquarters: {
        street: '123 Test St',
        city: 'Charlotte',
        state: 'NC',
        zipCode: '28202',
        country: 'USA',
      },
    },
    metrics: {
      employeeCount: 100,
    },
    contact: {},
    tags: [],
    verified: false,
    publiclyTraded: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  }),
  
  // Helper to create mock user data
  createMockUser: (overrides = {}) => ({
    id: `test-user-${  Math.random().toString(36).substr(2, 9)}`,
    email: 'test@example.com',
    firstName: 'Test',
    lastName: 'User',
    role: 'user',
    permissions: [],
    preferences: {
      theme: 'light' as const,
      notifications: {
        email: true,
        push: false,
        inApp: true,
      },
      dashboard: {
        layout: 'grid' as const,
        compactMode: false,
      },
    },
    ...overrides,
  }),
}