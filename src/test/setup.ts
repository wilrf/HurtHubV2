import "@testing-library/jest-dom";
import { cleanup } from "@testing-library/react";
import { expect, afterEach, vi } from "vitest";

// Ensure `window` exists when tests run in Node environment
// Vitest default setup may execute this file even for node environment.
if (typeof globalThis.window === "undefined") {
  // Minimal stub that can accept properties later
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  globalThis.window = {};
}

// Cleanup after each test case
afterEach(() => {
  cleanup();
});

// Mock Vercel environment variables for local tooling
process.env.VITE_VERCEL_URL = "test-app.vercel.app";
process.env.VITE_VERCEL_ENV = "preview";
process.env.VITE_VERCEL_GIT_COMMIT_SHA = "abc1234";
process.env.VITE_SUPABASE_URL = "https://test.supabase.co";
process.env.VITE_SUPABASE_ANON_KEY = "test-anon-key";
process.env.VITE_ENABLE_AI_FEATURES = "true";
process.env.VITE_ENABLE_REAL_TIME = "true";
process.env.VITE_ENABLE_ANALYTICS = "false";
process.env.VITE_ENABLE_EXPORT = "true";
process.env.VITE_DEBUG_MODE = "true";
process.env.VITE_SHOW_DEV_TOOLS = "true";

// Mock environment variables for testing
vi.mock("../config/env", () => ({
  env: {
    appName: "test-app",
    appVersion: "abc1234",
    appEnv: "staging",
    apiBaseUrl: "https://test-app.vercel.app",
    websocketUrl: "wss://test-app.vercel.app/ws",
    enableAIFeatures: true,
    enableRealTime: true,
    enableAnalytics: false,
    enableExport: true,
    debugMode: true,
    showDevTools: true,

    // Environment checks
    isDevelopment: () => false,
    isStaging: () => true,
    isProduction: () => false,

    // Vercel-specific methods
    vercelEnvironment: "preview",
    isVercelPreview: true,
    apiPath: (endpoint: string) =>
      `https://test-app.vercel.app/api${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`,

    // Service availability
    hasOpenAI: () => true,
    hasMapbox: () => false,
    hasAnalytics: () => false,
    hasSentry: () => false,

    // Deployment info
    deploymentInfo: {
      environment: "preview",
      url: "https://test-app.vercel.app",
      appName: "test-app",
      version: "abc1234",
      isProduction: false,
      isPreview: true,
    },

    // Config access
    getConfig: () => ({
      APP_NAME: "test-app",
      APP_VERSION: "abc1234",
      APP_ENV: "staging",
      API_BASE_URL: "https://test-app.vercel.app",
      WEBSOCKET_URL: "wss://test-app.vercel.app/ws",
      ENABLE_AI_FEATURES: true,
      ENABLE_REAL_TIME: true,
      ENABLE_ANALYTICS: false,
      ENABLE_EXPORT: true,
      DEBUG_MODE: true,
      SHOW_DEV_TOOLS: true,
    }),
  },
}));

// Mock fetch for API calls in tests
global.fetch = vi.fn();

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value.toString();
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
  };
})();

Object.defineProperty(window, "localStorage", {
  value: localStorageMock,
});

// Mock sessionStorage
const sessionStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value.toString();
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
  };
})();

Object.defineProperty(window, "sessionStorage", {
  value: sessionStorageMock,
});

// Mock window.matchMedia
Object.defineProperty(window, "matchMedia", {
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
});

// Mock IntersectionObserver
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock crypto.randomUUID
Object.defineProperty(global, "crypto", {
  value: {
    randomUUID: vi.fn(
      () => `test-uuid-${Math.random().toString(36).substr(2, 9)}`,
    ),
  },
});

// Mock import.meta.env for components that access it directly
if (typeof window !== "undefined") {
  (window as any).import = {
    meta: {
      env: {
        VITE_VERCEL_URL: "test-app.vercel.app",
        VITE_VERCEL_ENV: "preview",
        VITE_VERCEL_GIT_COMMIT_SHA: "abc1234",
        VITE_SUPABASE_URL: "https://test.supabase.co",
        VITE_SUPABASE_ANON_KEY: "test-anon-key",
        VITE_ENABLE_AI_FEATURES: "true",
        VITE_ENABLE_REAL_TIME: "true",
        VITE_ENABLE_ANALYTICS: "false",
        VITE_ENABLE_EXPORT: "true",
        VITE_DEBUG_MODE: "true",
        VITE_SHOW_DEV_TOOLS: "true",
        MODE: "test",
      },
    },
  };
}

// Mock console methods in test environment
if (import.meta.env.MODE === "test") {
  global.console = {
    ...console,
    log: vi.fn(),
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  };
}

// Custom matchers
(expect as any).extend({
  toBeInTheDocument: (received: any) => {
    const pass =
      received && received.ownerDocument && received.ownerDocument === document;
    return {
      message: () =>
        `expected element ${pass ? "not " : ""}to be in the document`,
      pass,
    };
  },
});

// Global test utilities
(globalThis as any).testUtils = {
  // Helper to wait for next tick
  waitForNextTick: () => new Promise((resolve) => setTimeout(resolve, 0)),

  // Helper to create mock company data
  createMockCompany: (overrides = {}) => ({
    id: `test-company-${Math.random().toString(36).substr(2, 9)}`,
    name: "Test Company",
    industry: "Technology",
    location: {
      headquarters: {
        street: "123 Test St",
        city: "Charlotte",
        state: "NC",
        zipCode: "28202",
        country: "USA",
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
    id: `test-user-${Math.random().toString(36).substr(2, 9)}`,
    email: "test@example.com",
    firstName: "Test",
    lastName: "User",
    role: "user",
    permissions: [],
    preferences: {
      theme: "light" as const,
      notifications: {
        email: true,
        push: false,
        inApp: true,
      },
      dashboard: {
        layout: "grid" as const,
        compactMode: false,
      },
    },
    ...overrides,
  }),
};
