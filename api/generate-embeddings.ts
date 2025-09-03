import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient } from "@supabase/supabase-js";
import OpenAI from "openai";

export const config = {
  maxDuration: 300, // 5 minutes for embedding generation
};

interface EmbeddingRequest {
  batchSize?: number;
  forceRegenerate?: boolean;
  companyIds?: string[];
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // Initialize clients
  let supabase;
  let openai;

  try {
    // Initialize Supabase
    const supabaseUrl = process.env.SUPABASE_URL;
    if (!supabaseUrl) {
      throw new Error("SUPABASE_URL environment variable is required");
    }

    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseKey) {
      throw new Error(
        "SUPABASE_SERVICE_ROLE_KEY environment variable is required",
      );
    }

    supabase = createClient(supabaseUrl.trim(), supabaseKey.trim());

    // Initialize OpenAI
    const openaiApiKey = process.env.OPENAI_API_KEY?.trim();
    if (!openaiApiKey) {
      throw new Error("OPENAI_API_KEY not configured");
    }

    openai = new OpenAI({
      apiKey: openaiApiKey,
      maxRetries: 3,
      timeout: 30000,
    });
  } catch (error: any) {
    console.error("Client initialization failed:", error.message);
    return res.status(500).json({
      error: "Service configuration error",
      details: error.message,
    });
  }

  try {
    const {
      batchSize = 20,
      forceRegenerate = false,
      companyIds,
    } = req.body as EmbeddingRequest;

    console.log("Starting embedding generation:", {
      batchSize,
      forceRegenerate,
      companyIds,
    });

    // Get companies that need embeddings
    const companies = await getCompaniesNeedingEmbeddings(
      supabase,
      forceRegenerate,
      companyIds,
    );

    if (companies.length === 0) {
      return res.status(200).json({
        message: "All companies already have embeddings",
        processed: 0,
        skipped: 0,
        errors: [],
      });
    }

    console.log(`Found ${companies.length} companies needing embeddings`);

    // Process in batches to avoid timeout
    const results = {
      processed: 0,
      skipped: 0,
      errors: [] as string[],
    };

    // Process companies in batches
    for (let i = 0; i < companies.length; i += batchSize) {
      const batch = companies.slice(i, i + batchSize);
      console.log(
        `Processing batch ${Math.floor(i / batchSize) + 1}: ${batch.length} companies`,
      );

      const batchResults = await processBatch(batch, openai, supabase);
      results.processed += batchResults.processed;
      results.skipped += batchResults.skipped;
      results.errors.push(...batchResults.errors);

      // Add small delay between batches to avoid rate limits
      if (i + batchSize < companies.length) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }

    return res.status(200).json({
      message: `Embedding generation completed`,
      totalCompanies: companies.length,
      ...results,
    });
  } catch (error: any) {
    console.error("Embedding generation error:", error);
    return res.status(500).json({
      error: "Failed to generate embeddings",
      details: error.message,
    });
  }
}

async function getCompaniesNeedingEmbeddings(
  supabase: any,
  forceRegenerate: boolean,
  companyIds?: string[],
) {
  let query = supabase
    .from("companies")
    .select("id, name, industry, description, headquarters, sector")
    .eq("status", "active");

  if (!forceRegenerate) {
    // Only get companies without embeddings
    query = query.is("embedding", null);
  }

  if (companyIds && companyIds.length > 0) {
    query = query.in("id", companyIds);
  }

  const { data, error } = await query.limit(500); // Reasonable limit

  if (error) {
    throw new Error(`Failed to fetch companies: ${error.message}`);
  }

  return data || [];
}

async function processBatch(companies: any[], openai: OpenAI, supabase: any) {
  const results = {
    processed: 0,
    skipped: 0,
    errors: [] as string[],
  };

  // Generate embeddings for all companies in batch
  const embeddingPromises = companies.map(async (company) => {
    try {
      // Create descriptive text for embedding
      const embeddingText = createEmbeddingText(company);

      // Generate embedding
      const embedding = await generateEmbedding(embeddingText, openai);

      // Update company with embedding
      const { error } = await supabase
        .from("companies")
        .update({
          embedding: embedding,
          updated_at: new Date().toISOString(),
        })
        .eq("id", company.id);

      if (error) {
        throw new Error(
          `Failed to update company ${company.name}: ${error.message}`,
        );
      }

      // Track the embedding update
      await supabase.from("embedding_updates").insert({
        table_name: "companies",
        record_id: company.id,
        model_used: "text-embedding-3-small",
      });

      console.log(`✅ Generated embedding for: ${company.name}`);
      results.processed++;
    } catch (error: any) {
      console.error(`❌ Failed to process ${company.name}:`, error.message);
      results.errors.push(`${company.name}: ${error.message}`);
    }
  });

  // Execute all embedding generations in parallel
  await Promise.allSettled(embeddingPromises);

  return results;
}

function createEmbeddingText(company: any): string {
  const parts = [];

  // Company name (most important)
  if (company.name) {
    parts.push(company.name);
  }

  // Industry information
  if (company.industry) {
    parts.push(`Industry: ${company.industry}`);
  }
  if (company.sector) {
    parts.push(`Sector: ${company.sector}`);
  }

  // Location
  if (company.headquarters) {
    parts.push(`Location: ${company.headquarters}`);
  }

  // Description
  if (company.description) {
    // Limit description to avoid token limits
    const description =
      company.description.length > 500
        ? company.description.substring(0, 500) + "..."
        : company.description;
    parts.push(`Description: ${description}`);
  }

  return parts.join(". ");
}

async function generateEmbedding(
  text: string,
  openai: OpenAI,
): Promise<number[]> {
  try {
    const response = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: text,
      encoding_format: "float",
    });

    return response.data[0].embedding;
  } catch (error: any) {
    if (error.status === 429) {
      // Rate limit - wait and retry once
      console.log("Rate limited, waiting 2 seconds...");
      await new Promise((resolve) => setTimeout(resolve, 2000));

      const response = await openai.embeddings.create({
        model: "text-embedding-3-small",
        input: text,
        encoding_format: "float",
      });

      return response.data[0].embedding;
    }

    throw error;
  }
}
