/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_OPENAI_API_KEY: string;
  readonly VITE_SENTRY_DSN: string;
  readonly VITE_ENABLE_SENTRY: string;
  readonly VITE_APP_NAME: string;
  readonly VITE_APP_VERSION: string;
  readonly VITE_API_URL: string;
  readonly VITE_API_TIMEOUT: string;
  readonly VITE_ENABLE_AI_CHAT: string;
  readonly VITE_ENABLE_ANALYTICS: string;
  readonly VITE_ENABLE_DEMO_MODE: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
