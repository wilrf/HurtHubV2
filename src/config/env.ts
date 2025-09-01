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

  // External Services
  OPENAI_API_KEY?: string;
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
  MOCK_API: boolean;
  SHOW_DEV_TOOLS: boolean;
}

class Environment {
  private config: EnvConfig;

  constructor() {
    this.config = this.loadConfig();
    this.validateConfig();
  }

  private loadConfig(): EnvConfig {
    return {
      // Application
      APP_NAME:
        import.meta.env.VITE_APP_NAME ||
        "Charlotte Economic Development Platform",
      APP_VERSION: import.meta.env.VITE_APP_VERSION || "1.0.0",
      APP_ENV: (import.meta.env.VITE_APP_ENV ||
        "development") as EnvConfig["APP_ENV"],

      // API
      API_BASE_URL:
        import.meta.env.VITE_API_BASE_URL || "http://localhost:3001/api/v1",
      WEBSOCKET_URL:
        import.meta.env.VITE_WEBSOCKET_URL || "ws://localhost:3001",

      // External Services
      OPENAI_API_KEY: import.meta.env.VITE_OPENAI_API_KEY,
      MAPBOX_ACCESS_TOKEN: import.meta.env.VITE_MAPBOX_ACCESS_TOKEN,
      GOOGLE_ANALYTICS_ID: import.meta.env.VITE_GOOGLE_ANALYTICS_ID,
      SENTRY_DSN: import.meta.env.VITE_SENTRY_DSN,
      HOTJAR_ID: import.meta.env.VITE_HOTJAR_ID,

      // Feature Flags
      ENABLE_AI_FEATURES: this.parseBoolean(
        import.meta.env.VITE_ENABLE_AI_FEATURES,
        false,
      ),
      ENABLE_REAL_TIME: this.parseBoolean(
        import.meta.env.VITE_ENABLE_REAL_TIME,
        true,
      ),
      ENABLE_ANALYTICS: this.parseBoolean(
        import.meta.env.VITE_ENABLE_ANALYTICS,
        false,
      ),
      ENABLE_EXPORT: this.parseBoolean(
        import.meta.env.VITE_ENABLE_EXPORT,
        true,
      ),

      // Development
      DEBUG_MODE: this.parseBoolean(import.meta.env.VITE_DEBUG_MODE, false),
      MOCK_API: this.parseBoolean(import.meta.env.VITE_MOCK_API, true),
      SHOW_DEV_TOOLS: this.parseBoolean(
        import.meta.env.VITE_SHOW_DEV_TOOLS,
        false,
      ),
    };
  }

  private parseBoolean(
    value: string | undefined,
    defaultValue: boolean,
  ): boolean {
    if (value === undefined) return defaultValue;
    // Trim whitespace and remove any quotes or special characters
    const cleanValue = value
      .trim()
      .replace(/["'\r\n]/g, "")
      .toLowerCase();
    return cleanValue === "true";
  }

  private validateConfig(): void {
    const errors: string[] = [];

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
    if (this.config.ENABLE_AI_FEATURES && !this.config.OPENAI_API_KEY) {
      console.warn("⚠️ AI features are enabled but OPENAI_API_KEY is not set");
    }

    if (this.config.ENABLE_ANALYTICS && !this.config.GOOGLE_ANALYTICS_ID) {
      console.warn(
        "⚠️ Analytics are enabled but GOOGLE_ANALYTICS_ID is not set",
      );
    }

    if (errors.length > 0) {
      const errorMessage = `Environment configuration errors:\n${errors.join("\n")}`;
      if (this.isProduction()) {
        throw new Error(errorMessage);
      } else {
        console.error(errorMessage);
      }
    }

    // Development warnings
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
      console.log(
        `📊 Mock API: ${this.config.MOCK_API ? "enabled" : "disabled"}`,
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

  get openaiApiKey(): string | undefined {
    return this.config.OPENAI_API_KEY;
  }

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

  get mockApi(): boolean {
    return this.config.MOCK_API;
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
