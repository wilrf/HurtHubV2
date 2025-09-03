import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient } from "@supabase/supabase-js";

// Validate environment variables
const supabaseUrl = process.env.SUPABASE_URL;
if (!supabaseUrl) {
  throw new Error("SUPABASE_URL environment variable is required");
}

const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!supabaseKey) {
  throw new Error("SUPABASE_SERVICE_ROLE_KEY environment variable is required");
}

const supabase = createClient(supabaseUrl, supabaseKey);

interface DataQueryRequest {
  query: string;
  type: "companies" | "developments" | "economic" | "comprehensive" | "search";
  filters?: {
    industry?: string;
    sector?: string;
    companyId?: string;
    dateRange?: { start: string; end: string };
    limit?: number;
  };
  context?: string;
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

  try {
    const { query, type, filters = {}, context }: DataQueryRequest = req.body;

    const data = await fetchBusinessData(query, type, filters, context);

    return res.status(200).json({
      success: true,
      query,
      type,
      data,
      timestamp: new Date().toISOString(),
      metadata: {
        queryType: type,
        filters: filters,
        resultCount: getResultCount(data),
      },
    });
  } catch (error: any) {
    console.error("Data query error:", error);
    return res.status(500).json({
      error: "Failed to query business data",
      details: error.message,
      timestamp: new Date().toISOString(),
    });
  }
}

async function fetchBusinessData(
  query: string,
  type: string,
  filters: any,
  context?: string,
) {
  const results: any = {};

  switch (type) {
    case "companies":
      results.companies = await queryCompanies(query, filters);
      break;

    case "developments":
      results.developments = await queryDevelopments(query, filters);
      break;

    case "economic":
      results.economicIndicators = await queryEconomicIndicators(
        query,
        filters,
      );
      break;

    case "comprehensive":
      results.companies = await queryCompanies(query, filters);
      results.developments = await queryDevelopments(query, filters);
      results.economicIndicators = await queryEconomicIndicators(
        query,
        filters,
      );
      results.marketSummary = await generateMarketSummary(results);
      break;

    case "search":
      results.searchResults = await performIntelligentSearch(
        query,
        filters,
        context,
      );
      break;

    default:
      throw new Error(`Unknown query type: ${type}`);
  }

  return results;
}

async function queryCompanies(query: string, filters: any) {
  let supabaseQuery = supabase
    .from("companies")
    .select("*")
    .eq("status", "active");

  // Apply filters
  if (filters.industry) {
    supabaseQuery = supabaseQuery.ilike("industry", `%${filters.industry}%`);
  }

  if (filters.sector) {
    supabaseQuery = supabaseQuery.ilike("sector", `%${filters.sector}%`);
  }

  if (filters.limit) {
    supabaseQuery = supabaseQuery.limit(filters.limit);
  } else {
    supabaseQuery = supabaseQuery.limit(50);
  }

  // Add search functionality
  if (query && query !== "all") {
    supabaseQuery = supabaseQuery.or(
      `name.ilike.%${query}%,description.ilike.%${query}%,industry.ilike.%${query}%`,
    );
  }

  const { data, error } = await supabaseQuery.order("revenue", {
    ascending: false,
  });

  if (error) throw error;

  return data || [];
}

async function queryDevelopments(query: string, filters: any) {
  let supabaseQuery = supabase.from("developments").select(`
      *,
      companies:company_id (
        name,
        industry,
        sector
      )
    `);

  // Apply date range filter
  if (filters.dateRange) {
    supabaseQuery = supabaseQuery
      .gte("published_at", filters.dateRange.start)
      .lte("published_at", filters.dateRange.end);
  }

  if (filters.companyId) {
    supabaseQuery = supabaseQuery.eq("company_id", filters.companyId);
  }

  // Add search functionality
  if (query && query !== "all") {
    supabaseQuery = supabaseQuery.or(
      `title.ilike.%${query}%,content.ilike.%${query}%,source.ilike.%${query}%`,
    );
  }

  if (filters.limit) {
    supabaseQuery = supabaseQuery.limit(filters.limit);
  } else {
    supabaseQuery = supabaseQuery.limit(20);
  }

  const { data, error } = await supabaseQuery.order("published_at", {
    ascending: false,
  });

  if (error) throw error;

  return data || [];
}

async function queryEconomicIndicators(query: string, filters: any) {
  let supabaseQuery = supabase.from("economic_indicators").select("*");

  // Apply date range filter
  if (filters.dateRange) {
    supabaseQuery = supabaseQuery
      .gte("date", filters.dateRange.start)
      .lte("date", filters.dateRange.end);
  }

  if (filters.limit) {
    supabaseQuery = supabaseQuery.limit(filters.limit);
  } else {
    supabaseQuery = supabaseQuery.limit(12); // Last 12 months
  }

  const { data, error } = await supabaseQuery.order("date", {
    ascending: false,
  });

  if (error) throw error;

  return data || [];
}

async function performIntelligentSearch(
  query: string,
  filters: any,
  context?: string,
) {
  const results = {
    companies: [] as any[],
    developments: [] as any[],
    economic: [] as any[],
    relevance: {} as any,
  };

  // Search companies
  const companies = await queryCompanies(query, { ...filters, limit: 5 });
  results.companies = companies;

  // Search developments
  const developments = await queryDevelopments(query, { ...filters, limit: 5 });
  results.developments = developments;

  // Search economic indicators (if query mentions economic terms)
  if (
    query.toLowerCase().includes("economic") ||
    query.toLowerCase().includes("gdp") ||
    query.toLowerCase().includes("unemployment") ||
    query.toLowerCase().includes("growth")
  ) {
    const economic = await queryEconomicIndicators(query, {
      ...filters,
      limit: 3,
    });
    results.economic = economic;
  }

  // Calculate relevance scores
  results.relevance = {
    totalResults:
      companies.length + developments.length + results.economic.length,
    queryTerms: query.toLowerCase().split(" "),
    context: context,
    topMatches: [
      ...companies
        .slice(0, 3)
        .map((c) => ({ type: "company", name: c.name, relevance: 0.9 })),
      ...developments
        .slice(0, 3)
        .map((d) => ({ type: "development", title: d.title, relevance: 0.8 })),
    ],
  };

  return results;
}

async function generateMarketSummary(data: any) {
  const { companies, developments, economicIndicators } = data;

  return {
    overview: {
      totalCompanies: companies?.length || 0,
      totalDevelopments: developments?.length || 0,
      latestEconomicData: economicIndicators?.[0] || null,
    },
    insights: {
      topIndustries: companies ? getTopIndustries(companies) : [],
      recentActivity: developments ? getRecentActivity(developments) : [],
      economicTrends: economicIndicators
        ? analyzeEconomicTrends(economicIndicators)
        : {},
    },
  };
}

function getTopIndustries(companies: any[]) {
  const industryCount: { [key: string]: number } = {};

  companies.forEach((company) => {
    const industry = company.industry || "Unknown";
    industryCount[industry] = (industryCount[industry] || 0) + 1;
  });

  return Object.entries(industryCount)
    .sort(([, a], [, b]) => (b as number) - (a as number))
    .slice(0, 5)
    .map(([industry, count]) => ({ industry, count }));
}

function getRecentActivity(developments: any[]) {
  return developments
    .filter((d) => d.published_at)
    .sort(
      (a, b) =>
        new Date(b.published_at).getTime() - new Date(a.published_at).getTime(),
    )
    .slice(0, 3)
    .map((d) => ({
      title: d.title,
      company: d.companies?.name,
      date: d.published_at,
      category: d.category,
    }));
}

function analyzeEconomicTrends(indicators: any[]) {
  if (indicators.length < 2) return {};

  const latest = indicators[0];
  const previous = indicators[1];

  return {
    unemploymentChange: latest.unemployment_rate - previous.unemployment_rate,
    gdpGrowth: latest.gdp_growth,
    jobGrowth: latest.job_growth,
    retailSalesGrowth: latest.retail_sales_growth,
    trend: latest.gdp_growth > 0 ? "positive" : "negative",
  };
}

function getResultCount(data: any): number {
  let count = 0;

  if (data.companies) count += data.companies.length;
  if (data.developments) count += data.developments.length;
  if (data.economicIndicators) count += data.economicIndicators.length;
  if (data.searchResults) {
    count +=
      (data.searchResults.companies?.length || 0) +
      (data.searchResults.developments?.length || 0) +
      (data.searchResults.economic?.length || 0);
  }

  return count;
}
