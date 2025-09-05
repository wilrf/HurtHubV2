import type { VercelRequest, VercelResponse } from "@vercel/node";
import OpenAI from "openai";
import { createClient } from "@supabase/supabase-js";

export const config = {
  maxDuration: 30,
};

interface DiagnosticReport {
  timestamp: string;
  environment: {
    platform: string;
    region?: string;
    env?: string;
    url?: string;
    nodeVersion: string;
  };
  checks: {
    openai: {
      hasKey: boolean;
      keyLength: number;
      expectedLength: number;
      lengthValid: boolean;
      format?: string;
      isProjectKey: boolean;
      needsTrim?: boolean;
      validation?: any;
    };
    supabase: {
      hasUrl: boolean;
      hasAnonKey: boolean;
      hasServiceKey: boolean;
      urlValue?: string;
      connection?: {
        success: boolean;
        error?: string;
        companyCount?: number;
      };
    };
    openaiConnection?: {
      success: boolean;
      response?: string;
      model?: string;
      error?: string;
    };
  };
  recommendations: string[];
  status: "healthy" | "degraded" | "critical";
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  const report: DiagnosticReport = {
    timestamp: new Date().toISOString(),
    environment: {
      platform: "Vercel",
      region: process.env.VERCEL_REGION,
      env: process.env.VERCEL_ENV,
      url: process.env.VERCEL_URL,
      nodeVersion: process.version,
    },
    checks: {
      openai: {
        hasKey: false,
        keyLength: 0,
        expectedLength: 164,
        lengthValid: false,
        isProjectKey: false,
      },
      supabase: {
        hasUrl: false,
        hasAnonKey: false,
        hasServiceKey: false,
      },
    },
    recommendations: [],
    status: "healthy",
  };

  // Check 1: OpenAI Key Configuration
  const openaiKey = process.env.OPENAI_API_KEY;
  const openaiKeyTrimmed = openaiKey?.trim();

  report.checks.openai = {
    hasKey: !!openaiKey,
    keyLength: openaiKey?.length || 0,
    expectedLength: openaiKeyTrimmed?.startsWith("sk-proj-") ? 164 : 51,
    lengthValid: false,
    format: openaiKey ? `${openaiKey.substring(0, 12)}...` : undefined,
    isProjectKey: openaiKeyTrimmed?.startsWith("sk-proj-") || false,
    needsTrim: openaiKey !== openaiKeyTrimmed,
  };

  if (openaiKeyTrimmed) {
    report.checks.openai.lengthValid =
      openaiKeyTrimmed.length === report.checks.openai.expectedLength;
  }

  // Get validation from singleton
  // Inline validation since singleton import is not working
  try {
    const apiKey = process.env.OPENAI_API_KEY?.trim();
    const isProjectKey = apiKey?.startsWith("sk-proj-") || false;
    const expectedLength = isProjectKey ? 164 : 51;

    report.checks.openai.validation = {
      isValid: !!apiKey && apiKey.startsWith("sk-"),
      hasKey: !!apiKey,
      keyLength: apiKey?.length || 0,
      isProjectKey,
      expectedLength,
      error: !apiKey
        ? "OPENAI_API_KEY not found"
        : !apiKey.startsWith("sk-")
          ? "Invalid key format"
          : undefined,
    };
  } catch (error: any) {
    report.checks.openai.validation = {
      isValid: false,
      hasKey: false,
      keyLength: 0,
      isProjectKey: false,
      expectedLength: 164,
      error: error.message,
    };
  }

  // Check 2: Supabase Configuration
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  // Fail-fast validation
  if (!supabaseUrl) {
    throw new Error("SUPABASE_URL environment variable is required");
  }
  if (!supabaseServiceKey) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY environment variable is required",
    );
  }

  report.checks.supabase = {
    hasUrl: !!supabaseUrl,
    hasAnonKey: !!supabaseAnonKey,
    hasServiceKey: !!supabaseServiceKey,
    urlValue: supabaseUrl ? supabaseUrl.substring(0, 50) : undefined,
  };

  // Check 3: Test Supabase Connection
  if (supabaseUrl && supabaseServiceKey) {
    try {
      const supabase = createClient(
        supabaseUrl.trim(),
        supabaseServiceKey.trim(),
      );

      // First try a simple connection test
      const { data: _testData, error: testError } = await supabase
        .from("companies")
        .select("id")
        .limit(1);

      if (testError) {
        report.checks.supabase.connection = {
          success: false,
          error: `Connection test failed: ${testError.message || JSON.stringify(testError)}`,
          companyCount: 0,
        };
      } else {
        // If connection works, get the count
        const { count, error } = await supabase
          .from("companies")
          .select("*", { count: "exact", head: true })
          .eq("status", "active");

        report.checks.supabase.connection = {
          success: !error,
          error:
            error?.message ||
            (error ? JSON.stringify(error) : "No error details"),
          companyCount: count || 0,
        };
      }
    } catch (error: any) {
      report.checks.supabase.connection = {
        success: false,
        error: error.message,
      };
    }
  }

  // Check 4: Test OpenAI Connection
  if (openaiKeyTrimmed && openaiKeyTrimmed.startsWith("sk-")) {
    try {
      // Inline test since singleton import is not working
      try {
        const openai = new OpenAI({
          apiKey: openaiKeyTrimmed,
          maxRetries: 3,
          timeout: 30000,
        });

        const completion = await openai.chat.completions.create({
          model: "gpt-4o-mini",
          messages: [{ role: "user", content: "Say OK in one word" }],
          max_tokens: 5,
        });

        report.checks.openaiConnection = {
          success: true,
          response: completion.choices[0]?.message?.content || "OK",
          model: completion.model,
        };
      } catch (testError: any) {
        report.checks.openaiConnection = {
          success: false,
          error: testError.message,
        };
      }
    } catch (error: any) {
      report.checks.openaiConnection = {
        success: false,
        error: error.message,
      };
    }
  }

  // Generate Recommendations
  const recommendations: string[] = [];

  // OpenAI recommendations
  if (!report.checks.openai.hasKey) {
    recommendations.push(
      "❌ CRITICAL: Add OPENAI_API_KEY to Vercel environment variables",
    );
    report.status = "critical";
  } else if (report.checks.openai.needsTrim) {
    recommendations.push(
      "⚠️ WARNING: OpenAI key has whitespace - code handles trimming but check Vercel dashboard",
    );
    if (report.status === "healthy") report.status = "degraded";
  } else if (!report.checks.openai.lengthValid) {
    recommendations.push(
      `⚠️ WARNING: OpenAI key length (${report.checks.openai.keyLength}) doesn't match expected (${report.checks.openai.expectedLength})`,
    );
    if (report.status === "healthy") report.status = "degraded";
  }

  if (
    report.checks.openaiConnection &&
    !report.checks.openaiConnection.success
  ) {
    if (report.checks.openaiConnection.error?.includes("401")) {
      recommendations.push(
        "❌ CRITICAL: OpenAI key is invalid - verify key in OpenAI dashboard",
      );
      report.status = "critical";
    } else {
      recommendations.push(
        `⚠️ WARNING: OpenAI connection failed: ${report.checks.openaiConnection.error}`,
      );
      if (report.status === "healthy") report.status = "degraded";
    }
  }

  // Supabase recommendations
  if (!report.checks.supabase.hasUrl) {
    recommendations.push(
      "❌ CRITICAL: Supabase URL not found - check environment variables",
    );
    report.status = "critical";
  }

  if (!report.checks.supabase.hasServiceKey) {
    recommendations.push("❌ CRITICAL: Supabase service role key not found");
    report.status = "critical";
  }

  if (
    report.checks.supabase.connection &&
    !report.checks.supabase.connection.success
  ) {
    recommendations.push(
      `⚠️ WARNING: Supabase connection failed: ${report.checks.supabase.connection.error}`,
    );
    if (report.status === "healthy") report.status = "degraded";
  } else if (report.checks.supabase.connection?.companyCount === 0) {
    recommendations.push("⚠️ INFO: No companies found in database");
  }

  // Success messages
  if (report.checks.openaiConnection?.success) {
    recommendations.push("✅ OpenAI API connection successful");
  }

  if (report.checks.supabase.connection?.success) {
    recommendations.push(
      `✅ Supabase connected (${report.checks.supabase.connection.companyCount} companies)`,
    );
  }

  if (recommendations.length === 0) {
    recommendations.push("✅ All systems operational");
  }

  report.recommendations = recommendations;

  // Return appropriate status code based on health
  const statusCode =
    report.status === "critical"
      ? 500
      : report.status === "degraded"
        ? 503
        : 200;

  return res.status(statusCode).json(report);
}
