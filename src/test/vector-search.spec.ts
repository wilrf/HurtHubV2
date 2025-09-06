import { describe, it, expect } from "vitest";
import { createClient } from "@supabase/supabase-js";
import OpenAI from "openai";

// Environment prerequisites: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, OPENAI_API_KEY
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

describe("pgvector semantic_business_search()", () => {
  it(
    "returns at least one row with similarity > 0.30 for a sample query",
    async () => {
      const query = "financial companies in Charlotte";

      const embedResp = await openai.embeddings.create({
        model: "text-embedding-3-small",
        input: query,
        encoding_format: "float",
      });
      const queryEmbedding = embedResp.data[0].embedding;

      const { data, error } = await supabase.rpc("semantic_business_search", {
        query_embedding: queryEmbedding,
        similarity_threshold: 0.3,
        match_count: 5,
      });
      if (error) throw error;

      expect(data.length).toBeGreaterThan(0);
      expect(data[0].similarity).toBeGreaterThan(0.3);
    },
    20_000,
  );
});
