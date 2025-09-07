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
  businessIds?: string[];
  tableName?: 'companies' | 'businesses'; // Support both tables during migration
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
      batchSize = 10, // Reduced to avoid rate limits
      forceRegenerate = false,
      companyIds,
      businessIds,
      tableName = 'businesses', // Default to businesses table
    } = req.body as EmbeddingRequest;

    console.log("Starting embedding generation:", {
      tableName,
      batchSize,
      forceRegenerate,
      companyIds,
      businessIds,
    });

    // Get records that need embeddings
    const records = tableName === 'businesses'
      ? await getBusinessesNeedingEmbeddings(supabase, forceRegenerate, businessIds)
      : await getCompaniesNeedingEmbeddings(supabase, forceRegenerate, companyIds);

    if (records.length === 0) {
      return res.status(200).json({
        message: `All ${tableName} already have embeddings`,
        processed: 0,
        skipped: 0,
        errors: [],
      });
    }

    console.log(`Found ${records.length} ${tableName} needing embeddings`);

    // Process in batches to avoid timeout
    const results = {
      processed: 0,
      skipped: 0,
      errors: [] as string[],
    };

    // Process records in batches
    for (let i = 0; i < records.length; i += batchSize) {
      const batch = records.slice(i, i + batchSize);
      const batchNum = Math.floor(i / batchSize) + 1;
      const totalBatches = Math.ceil(records.length / batchSize);
      console.log(
        `Processing batch ${batchNum}/${totalBatches}: ${batch.length} ${tableName}`,
      );

      const batchResults = await processBatch(batch, openai, supabase, tableName);
      results.processed += batchResults.processed;
      results.skipped += batchResults.skipped;
      results.errors.push(...batchResults.errors);

      // Add delay between batches to avoid OpenAI rate limits (60/min)
      if (i + batchSize < records.length) {
        await new Promise((resolve) => setTimeout(resolve, 2000)); // 2 sec delay
      }
    }

    return res.status(200).json({
      message: `Embedding generation completed`,
      tableName,
      totalRecords: records.length,
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

async function getBusinessesNeedingEmbeddings(
  supabase: any,
  forceRegenerate: boolean,
  businessIds?: string[]
) {
  let query = supabase
    .from("businesses")
    .select("id, name, industry, naics, parent_company_id, neighborhood, city, state, business_type, year_established, revenue, employees");

  if (!forceRegenerate) {
    // Only get businesses without embeddings
    query = query.is("embedding", null);
  }

  if (businessIds && businessIds.length > 0) {
    query = query.in("id", businessIds);
  }

  const { data, error } = await query.limit(500); // Reasonable limit

  if (error) {
    throw new Error(`Failed to fetch businesses: ${error.message}`);
  }

  return data || [];
}

async function processBatch(records: any[], openai: OpenAI, supabase: any, tableName: string = 'companies') {
  const results = {
    processed: 0,
    skipped: 0,
    errors: [] as string[],
  };

  // Generate embeddings for all records in batch
  const embeddingPromises = records.map(async (record) => {
    try {
      // Create descriptive text for embedding
      const embeddingText = createEmbeddingText(record);

      // Generate embedding
      const embedding = await generateEmbedding(embeddingText, openai);

      // Update record with embedding
      const { error } = await supabase
        .from(tableName)
        .update({
          embedding: embedding,
          updated_at: new Date().toISOString(),
        })
        .eq("id", record.id);

      if (error) {
        throw new Error(
          `Failed to update ${tableName} record ${record.name}: ${error.message}`,
        );
      }

      // Track the embedding update  
      try {
        await supabase.from("embedding_updates").insert({
          table_name: tableName,
          record_id: record.id,
          model_used: "text-embedding-3-small",
        });
      } catch (trackError: any) {
        // Log but don't fail if tracking table doesn't exist
        console.warn(`Could not track embedding update: ${trackError.message}`);
      }

      console.log(`✅ Generated embedding for: ${record.name}`);
      results.processed++;
    } catch (error: any) {
      console.error(`❌ Failed to process ${record.name}:`, error.message);
      results.errors.push(`${record.name}: ${error.message}`);
    }
  });

  // Execute all embedding generations in parallel
  await Promise.allSettled(embeddingPromises);

  return results;
}

function createEmbeddingText(record: any): string {
  const parts = [];

  // Name (most important for both companies and businesses)
  if (record.name) {
    parts.push(record.name);
  }

  // Industry information
  if (record.industry) {
    parts.push(`Industry: ${record.industry}`);
  }
  if (record.sector) {
    parts.push(`Sector: ${record.sector}`);
  }
  
  // NAICS code (for businesses)
  if (record.naics) {
    parts.push(`NAICS: ${record.naics}`);
  }

  // Business type (for businesses)
  if (record.business_type) {
    parts.push(`Type: ${record.business_type}`);
  }

  // Location
  if (record.headquarters) {
    parts.push(`Location: ${record.headquarters}`);
  } else if (record.neighborhood || record.city) {
    // For businesses table
    const location = [record.neighborhood, record.city, record.state].filter(Boolean).join(", ");
    if (location) parts.push(`Location: ${location}`);
  }

  // Parent company (for businesses)
  if (record.parent_company_id) {
    parts.push(`Parent Company ID: ${record.parent_company_id}`);
  }

  // Year established (for businesses)
  if (record.year_established) {
    parts.push(`Established: ${record.year_established}`);
  }

  // Size information
  if (record.employees) {
    parts.push(`Employees: ${record.employees}`);
  }
  if (record.revenue) {
    parts.push(`Revenue: ${record.revenue}`);
  }

  // Description
  if (record.description) {
    // Limit description to avoid token limits
    const description =
      record.description.length > 500
        ? record.description.substring(0, 500) + "..."
        : record.description;
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
