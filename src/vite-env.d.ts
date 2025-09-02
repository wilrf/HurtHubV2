/// <reference types="vite/client" />

interface ImportMetaEnv {
  // Vercel automatic variables (injected by Vercel, required)
  readonly VITE_VERCEL_URL: string;
  readonly VITE_VERCEL_GIT_COMMIT_SHA: string;
  readonly VITE_VERCEL_ENV: string;
  
  // Required API configuration
  readonly VITE_API_BASE_URL: string;
  readonly VITE_WEBSOCKET_URL: string;
  
  // Required feature flags
  readonly VITE_ENABLE_AI_FEATURES: string;
  readonly VITE_ENABLE_REAL_TIME: string;
  readonly VITE_ENABLE_ANALYTICS: string;
  readonly VITE_ENABLE_EXPORT: string;
  
  // Required development settings  
  readonly VITE_DEBUG_MODE: string;
  readonly VITE_SHOW_DEV_TOOLS: string;
  
  // Optional external services
  readonly VITE_MAPBOX_ACCESS_TOKEN?: string;
  readonly VITE_GOOGLE_ANALYTICS_ID?: string;
  readonly VITE_SENTRY_DSN?: string;
  readonly VITE_HOTJAR_ID?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
