/**
 * Environment configuration with validation and type safety
 * Centralized access to environment variables
 */

interface EnvConfig {
  // Application
  APP_NAME: string;
  APP_VERSION: string;
  APP_ENV: "development" | "staging" | "production";

  // API
  API_BASE_URL: string;
  WEBSOCKET_URL: string;

  // External Services (client-side only)
  MAPBOX_ACCESS_TOKEN?: string;
  GOOGLE_ANALYTICS_ID?: string;
  SENTRY_DSN?: string;
  HOTJAR_ID?: string;

  // Feature Flags
  ENABLE_AI_FEATURES: boolean;
  ENABLE_REAL_TIME: boolean;
  ENABLE_ANALYTICS: boolean;
  ENABLE_EXPORT: boolean;

  // Development
  DEBUG_MODE: boolean;
  SHOW_DEV_TOOLS: boolean;
}

class Environment {
  private config: EnvConfig;

  constructor() {
    this.config = this.loadConfig();
    this.validateConfig();
  }

  private loadConfig(): EnvConfig {
    // Required environment variables  
    const requiredVars = {
      VITE_API_BASE_URL: import.meta.env.VITE_API_BASE_URL,
      VITE_WEBSOCKET_URL: import.meta.env.VITE_WEBSOCKET_URL,
      VITE_VERCEL_URL: import.meta.env.VITE_VERCEL_URL,
      VITE_VERCEL_GIT_COMMIT_SHA: import.meta.env.VITE_VERCEL_GIT_COMMIT_SHA,
      VITE_VERCEL_ENV: import.meta.env.VITE_VERCEL_ENV,
      VITE_ENABLE_AI_FEATURES: import.meta.env.VITE_ENABLE_AI_FEATURES,
      VITE_ENABLE_REAL_TIME: import.meta.env.VITE_ENABLE_REAL_TIME,
      VITE_ENABLE_ANALYTICS: import.meta.env.VITE_ENABLE_ANALYTICS,
      VITE_ENABLE_EXPORT: import.meta.env.VITE_ENABLE_EXPORT,
      VITE_DEBUG_MODE: import.meta.env.VITE_DEBUG_MODE,
      VITE_SHOW_DEV_TOOLS: import.meta.env.VITE_SHOW_DEV_TOOLS,
    };

    // Check for missing required vars
    const missing = Object.entries(requiredVars)
      .filter(([_, value]) => !value)
      .map(([key, _]) => key);

    if (missing.length > 0) {
      throw new Error(`Missing required environment variables: ${missing.join(', ')}. Please check your .env file.`);
    }

    return {
      // Application (Vercel-based)
      APP_NAME: this.getAppName(),
      APP_VERSION: this.getAppVersion(),
      APP_ENV: this.getAppEnv(),

      // API (required)
      API_BASE_URL: import.meta.env.VITE_API_BASE_URL,
      WEBSOCKET_URL: import.meta.env.VITE_WEBSOCKET_URL,

      // External Services (client-side only)
      MAPBOX_ACCESS_TOKEN: import.meta.env.VITE_MAPBOX_ACCESS_TOKEN,
      GOOGLE_ANALYTICS_ID: import.meta.env.VITE_GOOGLE_ANALYTICS_ID,
      SENTRY_DSN: import.meta.env.VITE_SENTRY_DSN,
      HOTJAR_ID: import.meta.env.VITE_HOTJAR_ID,

      // Feature Flags (required)
      ENABLE_AI_FEATURES: this.parseBoolean(import.meta.env.VITE_ENABLE_AI_FEATURES),
      ENABLE_REAL_TIME: this.parseBoolean(import.meta.env.VITE_ENABLE_REAL_TIME),
      ENABLE_ANALYTICS: this.parseBoolean(import.meta.env.VITE_ENABLE_ANALYTICS),
      ENABLE_EXPORT: this.parseBoolean(import.meta.env.VITE_ENABLE_EXPORT),

      // Development (required)
      DEBUG_MODE: this.parseBoolean(import.meta.env.VITE_DEBUG_MODE),
      SHOW_DEV_TOOLS: this.parseBoolean(import.meta.env.VITE_SHOW_DEV_TOOLS),
    };
  }

  private getAppName(): string {
    const vercelUrl = import.meta.env.VITE_VERCEL_URL;
    if (!vercelUrl) {
      throw new Error('VITE_VERCEL_URL is required. This should be automatically provided by Vercel.');
    }
    return vercelUrl.replace('.vercel.app', '');
  }

  private getAppVersion(): string {
    const gitSha = import.meta.env.VITE_VERCEL_GIT_COMMIT_SHA;
    if (!gitSha) {
      throw new Error('VITE_VERCEL_GIT_COMMIT_SHA is required. This should be automatically provided by Vercel.');
    }
    return gitSha.slice(0, 7); // Short commit hash
  }

  private getAppEnv(): EnvConfig["APP_ENV"] {
    const vercelEnv = import.meta.env.VITE_VERCEL_ENV;
    if (!vercelEnv) {
      throw new Error('VITE_VERCEL_ENV is required. This should be automatically provided by Vercel.');
    }
    if (vercelEnv === 'production') return 'production';
    if (vercelEnv === 'preview') return 'staging';
    return 'development';
  }

  private parseBoolean(value: string | undefined): boolean {
    if (value === undefined) {
      throw new Error('Boolean environment variable is required but not provided');
    }
    // Trim whitespace and remove any quotes or special characters
    const cleanValue = value
      .trim()
      .replace(/["'\r\n]/g, "")
      .toLowerCase();
    return cleanValue === "true";
  }

  private validateConfig(): void {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Required in production
    if (this.isProduction()) {
      if (!this.config.API_BASE_URL.startsWith("https://")) {
        errors.push("API_BASE_URL must use HTTPS in production");
      }

      if (!this.config.WEBSOCKET_URL.startsWith("wss://")) {
        errors.push("WEBSOCKET_URL must use WSS in production");
      }
    }

    // Feature-specific validation
    if (this.config.ENABLE_AI_FEATURES) {
      console.log("✅ AI features are enabled - API key handled server-side");
    }

    if (this.config.ENABLE_ANALYTICS && !this.config.GOOGLE_ANALYTICS_ID) {
      warnings.push(
        "⚠️ Analytics are enabled but GOOGLE_ANALYTICS_ID is not set",
      );
    }

    // Log warnings (non-blocking)
    warnings.forEach((warning) => console.warn(warning));

    // Handle errors
    if (errors.length > 0) {
      const errorMessage = `Environment configuration errors:\n${errors.join("\n")}`;

      if (this.isProduction()) {
        // In production, try to recover gracefully instead of crashing
        console.error("🚨 PRODUCTION CONFIG ERROR:", errorMessage);
        throw new Error(`Environment configuration failed in production: ${errorMessage}`);
      } else {
        console.error(errorMessage);
      }
    }

    // Environment status logging
    if (this.isDevelopment()) {
      console.log("🔧 Development environment loaded");
      console.log(`📡 API: ${this.config.API_BASE_URL}`);
      console.log(`🔌 WebSocket: ${this.config.WEBSOCKET_URL}`);
      console.log(
        `🤖 AI Features: ${this.config.ENABLE_AI_FEATURES ? "enabled" : "disabled"}`,
      );
      console.log(
        `⚡ Real-time: ${this.config.ENABLE_REAL_TIME ? "enabled" : "disabled"}`,
      );
    } else if (this.isProduction()) {
      console.log("🚀 Production environment initialized");
      console.log(`📡 API: ${this.config.API_BASE_URL}`);
      console.log(`🔌 WebSocket: ${this.config.WEBSOCKET_URL}`);
      console.log(
        `🤖 AI Features: ${this.config.ENABLE_AI_FEATURES ? "enabled" : "disabled"}`,
      );
    }
  }

  // Getters
  get appName(): string {
    return this.config.APP_NAME;
  }

  get appVersion(): string {
    return this.config.APP_VERSION;
  }

  get appEnv(): EnvConfig["APP_ENV"] {
    return this.config.APP_ENV;
  }

  get apiBaseUrl(): string {
    return this.config.API_BASE_URL;
  }

  get websocketUrl(): string {
    return this.config.WEBSOCKET_URL;
  }

  // OpenAI API key removed - handled server-side only for security

  get mapboxAccessToken(): string | undefined {
    return this.config.MAPBOX_ACCESS_TOKEN;
  }

  get googleAnalyticsId(): string | undefined {
    return this.config.GOOGLE_ANALYTICS_ID;
  }

  get sentryDsn(): string | undefined {
    return this.config.SENTRY_DSN;
  }

  // Feature flags
  get enableAIFeatures(): boolean {
    return this.config.ENABLE_AI_FEATURES;
  }

  get enableRealTime(): boolean {
    return this.config.ENABLE_REAL_TIME;
  }

  get enableAnalytics(): boolean {
    return this.config.ENABLE_ANALYTICS;
  }

  get enableExport(): boolean {
    return this.config.ENABLE_EXPORT;
  }

  // Development settings
  get debugMode(): boolean {
    return this.config.DEBUG_MODE;
  }


  get showDevTools(): boolean {
    return this.config.SHOW_DEV_TOOLS;
  }

  // Environment checks
  isDevelopment(): boolean {
    return this.config.APP_ENV === "development";
  }

  isStaging(): boolean {
    return this.config.APP_ENV === "staging";
  }

  isProduction(): boolean {
    return this.config.APP_ENV === "production";
  }

  // Service availability checks
  hasOpenAI(): boolean {
    return this.config.ENABLE_AI_FEATURES;
  }

  hasMapbox(): boolean {
    return Boolean(this.config.MAPBOX_ACCESS_TOKEN);
  }

  hasAnalytics(): boolean {
    return (
      Boolean(this.config.GOOGLE_ANALYTICS_ID) && this.config.ENABLE_ANALYTICS
    );
  }

  hasSentry(): boolean {
    return Boolean(this.config.SENTRY_DSN);
  }

  // Get full config (for debugging)
  getConfig(): Readonly<EnvConfig> {
    return Object.freeze({ ...this.config });
  }

  // Update feature flags at runtime (for testing)
  updateFeatureFlag<
    K extends keyof Pick<
      EnvConfig,
      | "ENABLE_AI_FEATURES"
      | "ENABLE_REAL_TIME"
      | "ENABLE_ANALYTICS"
      | "ENABLE_EXPORT"
    >,
  >(flag: K, value: boolean): void {
    if (this.isDevelopment()) {
      this.config[flag] = value;
      console.log(`🚩 Feature flag updated: ${flag} = ${value}`);
    } else {
      console.warn("Feature flags can only be updated in development mode");
    }
  }
}

// Export singleton instance
export const env = new Environment();

// Export type for external use
export type { EnvConfig };
