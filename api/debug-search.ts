import type { VercelRequest, VercelResponse } from "@vercel/node";

// In-memory storage for recent searches (resets on cold start)
let recentSearches: any[] = [];
const MAX_SEARCHES = 50;

// Store search activity
export function logSearchActivity(activity: any) {
  recentSearches.unshift({
    ...activity,
    timestamp: new Date().toISOString(),
  });
  
  // Keep only the most recent searches
  if (recentSearches.length > MAX_SEARCHES) {
    recentSearches = recentSearches.slice(0, MAX_SEARCHES);
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // Optional: Add basic auth or check for admin role
  // For now, we'll make it accessible for debugging
  
  const limit = parseInt(req.query.limit as string) || 10;
  const includeDetails = req.query.details === "true";
  
  try {
    const recentActivity = recentSearches.slice(0, limit);
    
    // Calculate statistics
    const stats = {
      totalSearches: recentSearches.length,
      averageResponseTime: calculateAverageResponseTime(),
      commonQueries: getCommonQueries(),
      searchMethods: getSearchMethodStats(),
      errorRate: calculateErrorRate(),
    };
    
    return res.status(200).json({
      success: true,
      stats,
      recentActivity: includeDetails ? recentActivity : recentActivity.map(summarizeActivity),
      message: "Debug endpoint - Remove in production or add authentication",
    });
  } catch (error: any) {
    console.error("Debug endpoint error:", error);
    return res.status(500).json({
      error: "Failed to retrieve debug information",
      details: error.message,
    });
  }
}

function summarizeActivity(activity: any) {
  return {
    timestamp: activity.timestamp,
    query: activity.query?.substring(0, 50),
    resultsCount: activity.resultsCount,
    duration: activity.duration,
    method: activity.method,
    success: activity.success,
  };
}

function calculateAverageResponseTime() {
  if (recentSearches.length === 0) return 0;
  const validSearches = recentSearches.filter(s => s.duration);
  if (validSearches.length === 0) return 0;
  
  const total = validSearches.reduce((sum, s) => sum + (parseInt(s.duration) || 0), 0);
  return Math.round(total / validSearches.length);
}

function getCommonQueries() {
  const queries: { [key: string]: number } = {};
  
  recentSearches.forEach(search => {
    if (search.query) {
      const normalized = search.query.toLowerCase().trim();
      queries[normalized] = (queries[normalized] || 0) + 1;
    }
  });
  
  return Object.entries(queries)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([query, count]) => ({ query, count }));
}

function getSearchMethodStats() {
  const methods: { [key: string]: number } = {
    semantic: 0,
    keyword: 0,
    hybrid: 0,
  };
  
  recentSearches.forEach(search => {
    if (search.semanticCount > 0 && search.keywordCount > 0) {
      methods.hybrid++;
    } else if (search.semanticCount > 0) {
      methods.semantic++;
    } else if (search.keywordCount > 0) {
      methods.keyword++;
    }
  });
  
  return methods;
}

function calculateErrorRate() {
  if (recentSearches.length === 0) return 0;
  const errors = recentSearches.filter(s => !s.success).length;
  return Math.round((errors / recentSearches.length) * 100);
}

// Export the logging function for use in other endpoints
export { recentSearches };