/**
 * Application constants
 * 
 * Note: APP_NAME and APP_VERSION are now handled by env.ts using Vercel variables
 * Use env.appName and env.appVersion instead
 */

export const APP_DESCRIPTION =
  "Real-time economic intelligence and business analytics for Charlotte";

// API Configuration is handled by env.ts - use env.apiBaseUrl and env.websocketUrl

// Pagination
export const DEFAULT_PAGE_SIZE = 25;
export const MAX_PAGE_SIZE = 100;

// Geographic
export const CHARLOTTE_COORDINATES = {
  lat: 35.2271,
  lng: -80.8431,
} as const;

export const CHARLOTTE_METRO_BOUNDS = {
  north: 35.5,
  south: 34.9,
  east: -80.5,
  west: -81.2,
} as const;

// Industries (based on NAICS codes)
export const MAJOR_INDUSTRIES = [
  "Technology",
  "Financial Services",
  "Healthcare",
  "Manufacturing",
  "Real Estate",
  "Professional Services",
  "Retail Trade",
  "Transportation",
  "Construction",
  "Energy",
  "Education",
  "Hospitality",
] as const;

// Company size ranges
export const EMPLOYEE_RANGES = [
  { value: "1-10", label: "1-10 employees" },
  { value: "11-50", label: "11-50 employees" },
  { value: "51-200", label: "51-200 employees" },
  { value: "201-500", label: "201-500 employees" },
  { value: "501-1000", label: "501-1,000 employees" },
  { value: "1001-5000", label: "1,001-5,000 employees" },
  { value: "5000+", label: "5,000+ employees" },
] as const;

// Revenue ranges
export const REVENUE_RANGES = [
  { value: "under-1m", label: "Under $1M" },
  { value: "1m-5m", label: "$1M - $5M" },
  { value: "5m-10m", label: "$5M - $10M" },
  { value: "10m-50m", label: "$10M - $50M" },
  { value: "50m-100m", label: "$50M - $100M" },
  { value: "100m-500m", label: "$100M - $500M" },
  { value: "500m-1b", label: "$500M - $1B" },
  { value: "over-1b", label: "Over $1B" },
] as const;

// Investment round types
export const INVESTMENT_ROUNDS = [
  "pre-seed",
  "seed",
  "series-a",
  "series-b",
  "series-c",
  "series-d",
  "bridge",
  "ipo",
  "acquisition",
  "other",
] as const;

// Development types
export const DEVELOPMENT_TYPES = [
  "new-business",
  "expansion",
  "relocation",
  "investment",
  "partnership",
  "acquisition",
  "closure",
  "infrastructure",
  "policy",
  "other",
] as const;

// Chart colors
export const CHART_COLORS = {
  primary: "#3b82f6",
  secondary: "#64748b",
  success: "#22c55e",
  warning: "#f59e0b",
  danger: "#ef4444",
  accent: "#ec4899",
} as const;

// Animation durations
export const ANIMATION_DURATION = {
  fast: 150,
  normal: 300,
  slow: 500,
} as const;

// Breakpoints (matching Tailwind)
export const BREAKPOINTS = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  "2xl": 1536,
} as const;

// Local storage keys
export const STORAGE_KEYS = {
  USER_PREFERENCES: "charlotte-econdev-preferences",
  AUTH_TOKEN: "charlotte-econdev-token",
  RECENT_SEARCHES: "charlotte-econdev-recent-searches",
  DASHBOARD_LAYOUT: "charlotte-econdev-dashboard-layout",
} as const;

// Error messages
export const ERROR_MESSAGES = {
  NETWORK_ERROR: "Network error. Please check your connection.",
  UNAUTHORIZED: "Unauthorized. Please log in again.",
  FORBIDDEN: "You do not have permission to perform this action.",
  NOT_FOUND: "The requested resource was not found.",
  SERVER_ERROR: "Server error. Please try again later.",
  VALIDATION_ERROR: "Please check your input and try again.",
} as const;

// Success messages
export const SUCCESS_MESSAGES = {
  COMPANY_CREATED: "Company created successfully",
  COMPANY_UPDATED: "Company updated successfully",
  COMPANY_DELETED: "Company deleted successfully",
  SEARCH_SAVED: "Search saved successfully",
  EXPORT_COMPLETED: "Export completed successfully",
} as const;
