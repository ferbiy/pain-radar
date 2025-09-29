/**
 * Environment Configuration
 * Centralized configuration for all environment variables
 */

// Validate required environment variables
function validateEnvVar(name: string, value: string | undefined): string {
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

// Optional environment variable with default
function optionalEnvVar(name: string, defaultValue: string): string {
  return process.env[name] || defaultValue;
}

export const env = {
  // Supabase Configuration
  supabase: {
    url: validateEnvVar(
      "NEXT_PUBLIC_SUPABASE_URL",
      process.env.NEXT_PUBLIC_SUPABASE_URL
    ),
    anonKey: validateEnvVar(
      "NEXT_PUBLIC_SUPABASE_ANON_KEY",
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    ),
    serviceKey: validateEnvVar(
      "SUPABASE_SERVICE_KEY",
      process.env.SUPABASE_SERVICE_KEY
    ),
  },

  // OpenAI Configuration
  openai: {
    apiKey: validateEnvVar("OPENAI_API_KEY", process.env.OPENAI_API_KEY),
    model: optionalEnvVar("OPENAI_MODEL", "gpt-4o-mini"), // Default to GPT-4o-mini
  },

  // Reddit API Configuration (for backend data fetching only)
  reddit: {
    clientId: validateEnvVar("REDDIT_CLIENT_ID", process.env.REDDIT_CLIENT_ID),
    clientSecret: validateEnvVar(
      "REDDIT_CLIENT_SECRET",
      process.env.REDDIT_CLIENT_SECRET
    ),
    userAgent: validateEnvVar(
      "REDDIT_USER_AGENT",
      process.env.REDDIT_USER_AGENT
    ),
    username: validateEnvVar("REDDIT_USERNAME", process.env.REDDIT_USERNAME),
    password: validateEnvVar("REDDIT_PASSWORD", process.env.REDDIT_PASSWORD),
  },

  // Email Service Configuration (Resend)
  resend: {
    apiKey: validateEnvVar("RESEND_API_KEY", process.env.RESEND_API_KEY),
    fromEmail: optionalEnvVar("RESEND_FROM_EMAIL", "noreply@painradar.com"),
  },

  // Application Configuration
  app: {
    url: optionalEnvVar("NEXT_PUBLIC_APP_URL", "http://localhost:3000"),
    environment: optionalEnvVar("NODE_ENV", "development"),
  },

  // Cron Job Security
  cron: {
    secret: validateEnvVar("CRON_SECRET", process.env.CRON_SECRET),
  },

  // Development flags
  dev: {
    isProduction: process.env.NODE_ENV === "production",
    isDevelopment: process.env.NODE_ENV === "development",
    enableLogging: optionalEnvVar("ENABLE_LOGGING", "true") === "true",
  },
} as const;

// Export individual configurations for convenience
export const { supabase, openai, reddit, resend, app, cron, dev } = env;

// Validate all required environment variables on import
// This will throw an error if any required variables are missing
try {
  // Test access to all required variables to ensure they're accessible
  void [
    env.supabase.url,
    env.supabase.anonKey,
    env.supabase.serviceKey,
    env.openai.apiKey,
    env.reddit.clientId,
    env.reddit.clientSecret,
    env.reddit.userAgent,
    env.reddit.username,
    env.reddit.password,
    env.resend.apiKey,
    env.cron.secret,
  ];

  console.log("[Config] Environment variables validated successfully");
} catch (error) {
  if (env.dev.isDevelopment) {
    console.warn(
      "[Config] Some environment variables are missing. Please check your .env.local file."
    );
    console.warn(
      "[Config] Error:",
      error instanceof Error ? error.message : "Unknown error"
    );
  } else {
    // In production, we want to fail fast
    throw error;
  }
}
