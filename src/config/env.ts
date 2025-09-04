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

  // Supabase Configuration
  VITE_SUPABASE_URL?: string;
  VITE_SUPABASE_ANON_KEY?: string;

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

    // Validate Supabase configuration
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error(
        "Supabase configuration missing. " +
          "VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY required. " +
          "Add to Vercel Dashboard → Environment Variables.",
      );
    }

    // Feature flags with defaults
    const enableAI = this.parseBoolean(
      import.meta.env.VITE_ENABLE_AI_FEATURES,
      true,
    );
    const enableRealTime = this.parseBoolean(
      import.meta.env.VITE_ENABLE_REAL_TIME,
      true,
    );
    const enableAnalytics = this.parseBoolean(
      import.meta.env.VITE_ENABLE_ANALYTICS,
      false,
    );
    const enableExport = this.parseBoolean(
      import.meta.env.VITE_ENABLE_EXPORT,
      true,
    );
    const debugMode = this.parseBoolean(
      import.meta.env.VITE_DEBUG_MODE,
      false,
    );
    const showDevTools = this.parseBoolean(
      import.meta.env.VITE_SHOW_DEV_TOOLS,
      false,
    );

    return {
      // Application (Vercel-based)
      APP_NAME: this.getAppName(),
      APP_VERSION: this.getAppVersion(),
      APP_ENV: this.getAppEnv(),

      // API (dynamically constructed from Vercel URL)
      API_BASE_URL: this.getApiBaseUrl(),
      WEBSOCKET_URL: this.getWebSocketUrl(),

      // External Services (client-side only)
      MAPBOX_ACCESS_TOKEN: import.meta.env.VITE_MAPBOX_ACCESS_TOKEN,
      GOOGLE_ANALYTICS_ID: import.meta.env.VITE_GOOGLE_ANALYTICS_ID,
      SENTRY_DSN: import.meta.env.VITE_SENTRY_DSN,
      HOTJAR_ID: import.meta.env.VITE_HOTJAR_ID,

      // Supabase Configuration
      VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL,
      VITE_SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY,

      // Feature Flags (with sensible defaults)
      ENABLE_AI_FEATURES: enableAI,
      ENABLE_REAL_TIME: enableRealTime,
      ENABLE_ANALYTICS: enableAnalytics,
      ENABLE_EXPORT: enableExport,

      // Development (auto-configured based on environment)
      DEBUG_MODE: debugMode,
      SHOW_DEV_TOOLS: showDevTools,
    };
  }

  private getAppName(): string {
    const vercelUrl = import.meta.env.VITE_VERCEL_URL;
    if (vercelUrl) {
      return vercelUrl.replace(".vercel.app", "");
    }
    return "Hurt Hub V2";
  }

  private getApiBaseUrl(): string {
    const vercelUrl = import.meta.env.VITE_VERCEL_URL;
    if (vercelUrl) {
      return `https://${vercelUrl}`;
    }
    // Fallback for local development or when VITE_VERCEL_URL is not set
    return window.location.origin;
  }

  private getWebSocketUrl(): string {
    const vercelUrl = import.meta.env.VITE_VERCEL_URL;
    if (vercelUrl) {
      return `wss://${vercelUrl}/ws`;
    }
    // Fallback for local development or when VITE_VERCEL_URL is not set
    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    return `${wsProtocol}//${window.location.host}/ws`;
  }

  private getAppVersion(): string {
    const gitSha = import.meta.env.VITE_VERCEL_GIT_COMMIT_SHA;
    if (!gitSha) {
      console.warn("VITE_VERCEL_GIT_COMMIT_SHA not available, using timestamp");
      return new Date().toISOString().slice(0, 10);
    }
    return gitSha.slice(0, 7); // Short commit hash
  }

  private getAppEnv(): EnvConfig["APP_ENV"] {
    const vercelEnv = import.meta.env.VITE_VERCEL_ENV;
    if (vercelEnv === "production") return "production";
    if (vercelEnv === "preview") return "staging";
    // Default to development when VITE_VERCEL_ENV is not available
    return "development";
  }

  private parseBoolean(
    value: string | undefined,
    defaultValue: boolean = false,
  ): boolean {
    if (value === undefined) {
      return defaultValue;
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
        throw new Error(
          `Environment configuration failed in production: ${errorMessage}`,
        );
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

  get supabase(): { url: string; anonKey: string } {
    const url = this.config.VITE_SUPABASE_URL;
    const anonKey = this.config.VITE_SUPABASE_ANON_KEY;

    if (!url || !anonKey) {
      throw new Error(
        "VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are required. " +
          "Configure in Vercel Dashboard → Environment Variables.",
      );
    }

    return { url, anonKey };
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

  // Vercel-only API helpers
  /**
   * Construct API endpoint paths
   * @param endpoint - The API endpoint (with or without leading slash)
   * @returns Full URL to the API endpoint
   */
  apiPath(endpoint: string): string {
    const cleanEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
    return `${this.config.API_BASE_URL}/api${cleanEndpoint}`;
  }

  /**
   * Get deployment environment (Vercel-specific)
   */
  get vercelEnvironment(): "production" | "preview" {
    return this.config.APP_ENV === "production" ? "production" : "preview";
  }

  /**
   * Check if running in Vercel preview environment
   */
  get isVercelPreview(): boolean {
    return this.vercelEnvironment === "preview";
  }

  /**
   * Get deployment metadata
   */
  get deploymentInfo() {
    return {
      environment: this.vercelEnvironment,
      url: this.config.API_BASE_URL,
      appName: this.config.APP_NAME,
      version: this.config.APP_VERSION,
      isProduction: this.isProduction(),
      isPreview: this.isVercelPreview,
    };
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
