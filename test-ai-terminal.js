#!/usr/bin/env node

/**
 * AI Database Connection Test - Terminal Version
 * With detailed error codes and diagnostics
 *
 * Usage: node test-ai-terminal.js [URL]
 * Example: node test-ai-terminal.js https://hurt-hub-v2.vercel.app
 */

const API_URL = process.argv[2] || "https://hurt-hub-v2.vercel.app";

// Color codes for terminal output
const colors = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  blue: "\x1b[36m",
  magenta: "\x1b[35m",
  bold: "\x1b[1m",
  dim: "\x1b[2m",
};

// Error codes for specific failures
const ERROR_CODES = {
  // Connection errors (1xx)
  E101: "API endpoint not reachable",
  E102: "API returned non-200 status",
  E103: "API response missing content field",
  E104: "API timeout (>10 seconds)",

  // Data accuracy errors (2xx)
  E201: "Wrong company name (hallucinated data)",
  E202: "Wrong revenue amount",
  E203: "Wrong employee count",
  E204: "Missing company that should exist",
  E205: "Company mentioned that doesn't exist in database",

  // Calculation errors (3xx)
  E301: "Incorrect revenue per employee calculation",
  E302: "Incorrect total/sum calculation",
  E303: "Incorrect percentage calculation",
  E304: "Wrong ranking/ordering",

  // Database query errors (4xx)
  E401: "Not querying companies table",
  E402: "Not querying developments table",
  E403: "Not querying economic_indicators table",
  E404: "Using stale/cached data instead of live query",

  // Response quality errors (5xx)
  E501: "Generic response without specific data",
  E502: "Response doesn't answer the question",
  E503: "Response contains placeholder text",
  E504: "Response is too vague",
};

// Expected database content
const DATABASE_TRUTH = {
  companies: {
    "Lowe's": {
      revenue: 96250000000,
      employees: 300000,
      industry: "Retail",
      revenue_per_employee: 320833,
    },
    "Bank of America": {
      revenue: 94950000000,
      employees: 213000,
      industry: "Financial Services",
      revenue_per_employee: 445774,
    },
    Honeywell: {
      revenue: 34392000000,
      employees: 113000,
      industry: "Technology",
      revenue_per_employee: 304354,
    },
    "Duke Energy": {
      revenue: 25097000000,
      employees: 28000,
      industry: "Utilities",
      revenue_per_employee: 896321,
    },
    "Sonic Automotive": {
      revenue: 11898000000,
      employees: 10000,
      industry: "Automotive",
      revenue_per_employee: 1189800,
    },
  },
  totals: {
    companies: 5,
    total_revenue: 262587000000,
    total_employees: 664000,
    avg_revenue_per_employee: 395390,
  },
};

// Test cases with detailed validation
const TEST_SUITE = [
  {
    id: "T001",
    name: "Exact Company Data Retrieval",
    question: "What is the exact revenue and employee count for Honeywell?",
    validate: (response) => {
      const errors = [];
      const warnings = [];
      const passes = [];

      const lower = response.toLowerCase();

      // Check for Honeywell mention
      if (!lower.includes("honeywell")) {
        errors.push({
          code: "E204",
          detail: "Honeywell not mentioned in response",
        });
      } else {
        passes.push("Company name correctly identified");
      }

      // Check revenue (various formats)
      const revenueFormats = ["34,392", "34.392", "34392", "34.4"];
      const hasRevenue = revenueFormats.some((format) =>
        response.includes(format),
      );

      if (!hasRevenue) {
        errors.push({
          code: "E202",
          detail: `Wrong revenue for Honeywell. Expected: $34.392B, Found: none`,
        });
      } else {
        passes.push("Revenue correctly stated as $34.392B");
      }

      // Check employee count
      if (!response.includes("113,000") && !response.includes("113000")) {
        errors.push({
          code: "E203",
          detail: `Wrong employee count. Expected: 113,000, Found: none`,
        });
      } else {
        passes.push("Employee count correctly stated as 113,000");
      }

      // Check for hallucinated data
      const fakeCompanies = [
        "microsoft",
        "google",
        "amazon",
        "wells fargo",
        "jpmorgan",
      ];
      fakeCompanies.forEach((fake) => {
        if (lower.includes(fake)) {
          errors.push({
            code: "E205",
            detail: `Mentioned ${fake} which doesn't exist in Charlotte database`,
          });
        }
      });

      return { errors, warnings, passes };
    },
  },
  {
    id: "T002",
    name: "Revenue Ranking Test",
    question: "List all 5 companies ranked by revenue from highest to lowest",
    validate: (response) => {
      const errors = [];
      const warnings = [];
      const passes = [];

      const lower = response.toLowerCase();

      // Check correct ordering
      const companies = [
        "lowe's",
        "bank of america",
        "honeywell",
        "duke energy",
        "sonic automotive",
      ];
      let lastIndex = -1;
      let correctOrder = true;

      companies.forEach((company, idx) => {
        const index = lower.indexOf(company);
        if (index === -1) {
          errors.push({
            code: "E204",
            detail: `Missing ${company} in ranking`,
          });
          correctOrder = false;
        } else if (index < lastIndex) {
          errors.push({
            code: "E304",
            detail: `Wrong order: ${company} appears before ${companies[idx - 1]}`,
          });
          correctOrder = false;
        }
        lastIndex = index;
      });

      if (correctOrder && lastIndex !== -1) {
        passes.push("All companies listed in correct revenue order");
      }

      // Check for specific revenue values
      const revenueChecks = [
        { company: "Lowe's", value: "96" },
        { company: "Bank of America", value: "94" },
        { company: "Honeywell", value: "34" },
        { company: "Duke Energy", value: "25" },
        { company: "Sonic", value: "11" },
      ];

      revenueChecks.forEach((check) => {
        if (!response.includes(check.value)) {
          warnings.push(`Revenue for ${check.company} might be incorrect`);
        }
      });

      // Check if response mentions it's from database
      if (
        lower.includes("database") ||
        lower.includes("our data") ||
        lower.includes("records")
      ) {
        passes.push("Response indicates data source");
      } else {
        warnings.push("Response doesn't indicate data is from database");
      }

      return { errors, warnings, passes };
    },
  },
  {
    id: "T003",
    name: "Revenue Per Employee Calculation",
    question:
      "Calculate the revenue per employee for Duke Energy and Sonic Automotive",
    validate: (response) => {
      const errors = [];
      const warnings = [];
      const passes = [];

      // Duke Energy: $25.097B / 28,000 = $896,321
      const dukeValues = ["896,321", "896321", "896.3", "896"];
      const hasDukeCalc = dukeValues.some((v) => response.includes(v));

      if (!hasDukeCalc) {
        errors.push({
          code: "E301",
          detail: "Duke Energy revenue/employee wrong. Expected: $896,321",
        });
      } else {
        passes.push("Duke Energy calculation correct: $896,321/employee");
      }

      // Sonic: $11.898B / 10,000 = $1,189,800
      const sonicValues = ["1,189,800", "1189800", "1.19", "1,190", "1190"];
      const hasSonicCalc = sonicValues.some((v) => response.includes(v));

      if (!hasSonicCalc) {
        errors.push({
          code: "E301",
          detail:
            "Sonic Automotive revenue/employee wrong. Expected: $1,189,800",
        });
      } else {
        passes.push(
          "Sonic Automotive calculation correct: $1,189,800/employee",
        );
      }

      // Check if both companies are mentioned
      if (!response.toLowerCase().includes("duke")) {
        errors.push({ code: "E204", detail: "Duke Energy not mentioned" });
      }
      if (!response.toLowerCase().includes("sonic")) {
        errors.push({ code: "E204", detail: "Sonic Automotive not mentioned" });
      }

      return { errors, warnings, passes };
    },
  },
  {
    id: "T004",
    name: "Industry Filter Test",
    question:
      "How many companies are in the Technology industry and what is their total revenue?",
    validate: (response) => {
      const errors = [];
      const warnings = [];
      const passes = [];

      const lower = response.toLowerCase();

      // Should identify Honeywell as the only tech company
      if (lower.includes("honeywell")) {
        passes.push("Correctly identified Honeywell");
      } else {
        errors.push({
          code: "E204",
          detail: "Failed to identify Honeywell as Technology company",
        });
      }

      // Should state there's 1 technology company
      if (lower.includes("1") || lower.includes("one")) {
        passes.push("Correct count: 1 technology company");
      } else {
        errors.push({
          code: "E302",
          detail: "Wrong count of technology companies (should be 1)",
        });
      }

      // Should NOT mention other companies as tech
      if (lower.includes("bank of america") && lower.includes("tech")) {
        errors.push({
          code: "E201",
          detail: "Incorrectly classified Bank of America as Technology",
        });
      }

      // Revenue should be $34.392B
      if (response.includes("34.39") || response.includes("34,392")) {
        passes.push("Correct technology sector revenue: $34.392B");
      } else {
        warnings.push("Technology sector revenue not clearly stated");
      }

      return { errors, warnings, passes };
    },
  },
  {
    id: "T005",
    name: "Database Completeness Check",
    question:
      "How many total companies are in the database and what is their combined revenue and total employees?",
    validate: (response) => {
      const errors = [];
      const warnings = [];
      const passes = [];

      // Check company count (5)
      if (response.includes("5") || response.includes("five")) {
        passes.push("Correct company count: 5");
      } else {
        errors.push({
          code: "E302",
          detail: "Wrong company count (should be 5)",
        });
      }

      // Check total revenue (~$262.587B)
      const revenueVariants = ["262", "263", "262.5", "262.6"];
      if (revenueVariants.some((v) => response.includes(v))) {
        passes.push("Correct total revenue: ~$262.6B");
      } else {
        errors.push({
          code: "E302",
          detail: "Wrong total revenue. Expected: $262.587B",
        });
      }

      // Check total employees (664,000)
      const employeeVariants = ["664,000", "664000", "664"];
      if (employeeVariants.some((v) => response.includes(v))) {
        passes.push("Correct total employees: 664,000");
      } else {
        errors.push({
          code: "E302",
          detail: "Wrong total employees. Expected: 664,000",
        });
      }

      // Bonus: Check if it lists company names
      const companies = [
        "lowe's",
        "bank of america",
        "honeywell",
        "duke energy",
        "sonic",
      ];
      const mentionedCompanies = companies.filter((c) =>
        response.toLowerCase().includes(c),
      );

      if (mentionedCompanies.length === 5) {
        passes.push("All 5 companies mentioned by name");
      } else if (mentionedCompanies.length > 0) {
        warnings.push(
          `Only ${mentionedCompanies.length}/5 companies mentioned`,
        );
      }

      return { errors, warnings, passes };
    },
  },
];

// API testing function
async function testAPI(endpoint, question) {
  const startTime = Date.now();

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages: [{ role: "user", content: question }],
        module: "business-intelligence",
      }),
      signal: controller.signal,
    });

    clearTimeout(timeout);
    const responseTime = Date.now() - startTime;

    if (!response.ok) {
      return {
        success: false,
        error: "E102",
        detail: `HTTP ${response.status}`,
        responseTime,
      };
    }

    const data = await response.json();

    if (!data.content) {
      return {
        success: false,
        error: "E103",
        detail: "Response missing content field",
        responseTime,
      };
    }

    return {
      success: true,
      content: data.content,
      responseTime,
    };
  } catch (error) {
    if (error.name === "AbortError") {
      return {
        success: false,
        error: "E104",
        detail: "Request timeout (>10s)",
        responseTime: 10000,
      };
    }

    return {
      success: false,
      error: "E101",
      detail: error.message,
      responseTime: Date.now() - startTime,
    };
  }
}

// Main test runner
async function runTests() {
  console.log(
    `\n${colors.bold}${colors.blue}╔════════════════════════════════════════════════════════════════╗${colors.reset}`,
  );
  console.log(
    `${colors.bold}${colors.blue}║           AI DATABASE CONNECTION TEST - TERMINAL              ║${colors.reset}`,
  );
  console.log(
    `${colors.bold}${colors.blue}╚════════════════════════════════════════════════════════════════╝${colors.reset}`,
  );
  console.log(
    `${colors.dim}Endpoint: ${API_URL}/api/ai-chat-simple${colors.reset}`,
  );
  console.log(
    `${colors.dim}Time: ${new Date().toISOString()}${colors.reset}\n`,
  );

  const results = {
    tests: [],
    totalErrors: 0,
    totalWarnings: 0,
    totalPasses: 0,
    errorCodes: new Set(),
    avgResponseTime: 0,
  };

  // Run each test
  for (const test of TEST_SUITE) {
    console.log(`${colors.bold}[${test.id}] ${test.name}${colors.reset}`);
    console.log(`${colors.dim}Question: "${test.question}"${colors.reset}`);

    const apiResult = await testAPI(
      `${API_URL}/api/ai-chat-simple`,
      test.question,
    );

    if (!apiResult.success) {
      console.log(
        `${colors.red}✗ API Error [${apiResult.error}]: ${ERROR_CODES[apiResult.error]}${colors.reset}`,
      );
      console.log(`${colors.red}  Detail: ${apiResult.detail}${colors.reset}`);
      results.errorCodes.add(apiResult.error);
      results.totalErrors++;
      results.tests.push({ ...test, failed: true, error: apiResult.error });
    } else {
      console.log(
        `${colors.green}✓ Response received (${apiResult.responseTime}ms)${colors.reset}`,
      );

      const validation = test.validate(apiResult.content);

      // Display errors
      if (validation.errors.length > 0) {
        console.log(`${colors.red}  Errors:${colors.reset}`);
        validation.errors.forEach((err) => {
          console.log(
            `${colors.red}    [${err.code}] ${ERROR_CODES[err.code]}${colors.reset}`,
          );
          console.log(`${colors.red}      └─ ${err.detail}${colors.reset}`);
          results.errorCodes.add(err.code);
        });
      }

      // Display warnings
      if (validation.warnings.length > 0) {
        console.log(`${colors.yellow}  Warnings:${colors.reset}`);
        validation.warnings.forEach((warn) => {
          console.log(`${colors.yellow}    ⚠ ${warn}${colors.reset}`);
        });
      }

      // Display passes
      if (validation.passes.length > 0) {
        console.log(`${colors.green}  Passes:${colors.reset}`);
        validation.passes.forEach((pass) => {
          console.log(`${colors.green}    ✓ ${pass}${colors.reset}`);
        });
      }

      results.totalErrors += validation.errors.length;
      results.totalWarnings += validation.warnings.length;
      results.totalPasses += validation.passes.length;
      results.avgResponseTime += apiResult.responseTime;

      results.tests.push({
        ...test,
        errors: validation.errors.length,
        warnings: validation.warnings.length,
        passes: validation.passes.length,
      });
    }

    console.log("");
  }

  // Calculate averages
  results.avgResponseTime = Math.round(
    results.avgResponseTime / TEST_SUITE.length,
  );

  // Display summary
  console.log(
    `${colors.bold}${colors.blue}╔════════════════════════════════════════════════════════════════╗${colors.reset}`,
  );
  console.log(
    `${colors.bold}${colors.blue}║                         TEST SUMMARY                          ║${colors.reset}`,
  );
  console.log(
    `${colors.bold}${colors.blue}╚════════════════════════════════════════════════════════════════╝${colors.reset}`,
  );

  const total =
    results.totalErrors + results.totalWarnings + results.totalPasses;
  const successRate =
    total > 0 ? Math.round((results.totalPasses / total) * 100) : 0;

  console.log(`\n${colors.bold}Overall Results:${colors.reset}`);
  console.log(
    `  ${colors.green}Passes:   ${results.totalPasses}${colors.reset}`,
  );
  console.log(
    `  ${colors.yellow}Warnings: ${results.totalWarnings}${colors.reset}`,
  );
  console.log(`  ${colors.red}Errors:   ${results.totalErrors}${colors.reset}`);
  console.log(
    `  Success Rate: ${successRate >= 80 ? colors.green : successRate >= 50 ? colors.yellow : colors.red}${successRate}%${colors.reset}`,
  );
  console.log(`  Avg Response Time: ${results.avgResponseTime}ms`);

  if (results.errorCodes.size > 0) {
    console.log(`\n${colors.bold}Error Codes Encountered:${colors.reset}`);
    Array.from(results.errorCodes)
      .sort()
      .forEach((code) => {
        console.log(
          `  ${colors.red}[${code}]${colors.reset} ${ERROR_CODES[code]}`,
        );
      });
  }

  // Diagnosis
  console.log(`\n${colors.bold}${colors.magenta}DIAGNOSIS:${colors.reset}`);

  if (successRate >= 90) {
    console.log(
      `${colors.green}${colors.bold}✓ EXCELLENT: AI is properly connected to database!${colors.reset}`,
    );
  } else if (successRate >= 70) {
    console.log(
      `${colors.green}${colors.bold}✓ GOOD: AI has database access but needs minor improvements${colors.reset}`,
    );
  } else if (successRate >= 50) {
    console.log(
      `${colors.yellow}${colors.bold}⚠ PARTIAL: AI has limited database connectivity${colors.reset}`,
    );
  } else if (successRate >= 20) {
    console.log(
      `${colors.red}${colors.bold}✗ POOR: AI is mostly using generic responses${colors.reset}`,
    );
  } else {
    console.log(
      `${colors.red}${colors.bold}✗ FAILED: AI is not connected to database at all${colors.reset}`,
    );
  }

  // Specific problem identification
  if (results.errorCodes.has("E101") || results.errorCodes.has("E102")) {
    console.log(
      `${colors.red}\nProblem: API endpoint not accessible${colors.reset}`,
    );
    console.log(`  → Check if server is running`);
    console.log(`  → Verify URL: ${API_URL}`);
  }

  if (results.errorCodes.has("E201") || results.errorCodes.has("E205")) {
    console.log(
      `${colors.red}\nProblem: AI is hallucinating company data${colors.reset}`,
    );
    console.log(`  → Not querying real database`);
    console.log(`  → Using generic LLM knowledge instead`);
  }

  if (results.errorCodes.has("E202") || results.errorCodes.has("E203")) {
    console.log(`${colors.red}\nProblem: Incorrect data values${colors.reset}`);
    console.log(`  → Database might be queried but data is wrong`);
    console.log(`  → Check data mapping in API endpoint`);
  }

  if (results.errorCodes.has("E301") || results.errorCodes.has("E302")) {
    console.log(`${colors.red}\nProblem: Calculation errors${colors.reset}`);
    console.log(`  → AI might have data but can't calculate correctly`);
    console.log(`  → Consider pre-calculating in API`);
  }

  console.log(
    `\n${colors.dim}Run again: node test-ai-terminal.js ${API_URL}${colors.reset}`,
  );
  console.log(
    `${colors.dim}Database truth: 5 companies, $262.6B total revenue, 664K employees${colors.reset}\n`,
  );
}

// Execute tests
runTests().catch((error) => {
  console.error(`${colors.red}Fatal error: ${error.message}${colors.reset}`);
  process.exit(1);
});
