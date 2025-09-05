/**
 * AI Database Connection Test - Browser Console Version
 * Copy and paste this entire script into browser console (F12)
 *
 * This test will verify if your AI is properly connected to the database
 * with detailed error codes and diagnostics
 */

(async function () {
  "use strict";

  // Configuration
  const API_ENDPOINT = window.location.origin + "/api/ai-chat-simple";

  // Styling for console output
  const styles = {
    header:
      "background: linear-gradient(90deg, #667eea 0%, #764ba2 100%); color: white; font-size: 14px; padding: 8px; font-weight: bold;",
    subheader:
      "background: #4a5568; color: white; font-size: 12px; padding: 6px; font-weight: bold;",
    pass: "color: #48bb78; font-weight: bold;",
    error: "color: #f56565; font-weight: bold;",
    warning: "color: #ed8936; font-weight: bold;",
    info: "color: #4299e1;",
    dim: "color: #a0aec0; font-style: italic;",
    code: "background: #2d3748; color: #90cdf4; padding: 2px 6px; border-radius: 3px; font-family: monospace;",
  };

  // Error code definitions
  const ERROR_CODES = {
    // Connection errors (1xx)
    E101: "API endpoint not reachable",
    E102: "API returned non-200 status",
    E103: "API response missing content field",
    E104: "API timeout (>10 seconds)",
    E105: "CORS error - API not accessible from browser",

    // Data accuracy errors (2xx)
    E201: "Wrong company name (hallucinated data)",
    E202: "Wrong revenue amount",
    E203: "Wrong employee count",
    E204: "Missing company that should exist",
    E205: "Company mentioned that doesn't exist in database",
    E206: "Wrong industry classification",

    // Calculation errors (3xx)
    E301: "Incorrect revenue per employee calculation",
    E302: "Incorrect total/sum calculation",
    E303: "Incorrect percentage calculation",
    E304: "Wrong ranking/ordering",
    E305: "Mathematical error in response",

    // Database query errors (4xx)
    E401: "Not querying companies table",
    E402: "Not querying developments table",
    E403: "Not querying economic_indicators table",
    E404: "Using stale/cached data instead of live query",
    E405: "Query returned wrong number of results",

    // Response quality errors (5xx)
    E501: "Generic response without specific data",
    E502: "Response doesn't answer the question",
    E503: "Response contains placeholder text",
    E504: "Response is too vague",
    E505: "Response contradicts itself",
  };

  // Database ground truth
  const DATABASE = {
    companies: [
      {
        name: "Lowe's",
        revenue: 96250000000,
        employees: 300000,
        industry: "Retail",
      },
      {
        name: "Bank of America",
        revenue: 94950000000,
        employees: 213000,
        industry: "Financial Services",
      },
      {
        name: "Honeywell",
        revenue: 34392000000,
        employees: 113000,
        industry: "Technology",
      },
      {
        name: "Duke Energy",
        revenue: 25097000000,
        employees: 28000,
        industry: "Utilities",
      },
      {
        name: "Sonic Automotive",
        revenue: 11898000000,
        employees: 10000,
        industry: "Automotive",
      },
    ],
    stats: {
      total_companies: 5,
      total_revenue: 262587000000,
      total_employees: 664000,
    },
  };

  // Test suite
  const TESTS = [
    {
      id: "T001",
      name: "Specific Company Query",
      question: "What is Honeywell's exact revenue and employee count?",
      validate: (response) => {
        const errors = [];
        const passes = [];
        const details = {};

        // Check Honeywell mention
        if (!response.toLowerCase().includes("honeywell")) {
          errors.push({ code: "E204", msg: "Honeywell not found in response" });
        } else {
          passes.push("Found Honeywell");
        }

        // Check revenue ($34.392B)
        const hasRevenue = response.match(/34[,.]?3|34[,.]?392/);
        if (!hasRevenue) {
          errors.push({
            code: "E202",
            msg: "Wrong revenue (expected $34.392B)",
          });
          details.revenue = "NOT FOUND";
        } else {
          passes.push("Correct revenue: $34.392B");
          details.revenue = hasRevenue[0];
        }

        // Check employees (113,000)
        const hasEmployees = response.match(/113[,.]?000|113k/i);
        if (!hasEmployees) {
          errors.push({
            code: "E203",
            msg: "Wrong employee count (expected 113,000)",
          });
          details.employees = "NOT FOUND";
        } else {
          passes.push("Correct employees: 113,000");
          details.employees = hasEmployees[0];
        }

        return { errors, passes, details };
      },
    },
    {
      id: "T002",
      name: "Top Companies Ranking",
      question: "List the top 3 companies by revenue with exact amounts",
      validate: (response) => {
        const errors = [];
        const passes = [];
        const details = { found_companies: [] };

        // Check for top 3 in order
        const expected = [
          { name: "Lowe's", revenue: "96" },
          { name: "Bank of America", revenue: "94" },
          { name: "Honeywell", revenue: "34" },
        ];

        expected.forEach((company, idx) => {
          const regex = new RegExp(company.name, "i");
          if (response.match(regex)) {
            details.found_companies.push(company.name);

            // Check if revenue is mentioned
            if (response.includes(company.revenue)) {
              passes.push(`${company.name} with correct revenue`);
            } else {
              errors.push({
                code: "E202",
                msg: `${company.name} has wrong revenue`,
              });
            }
          } else {
            errors.push({
              code: "E204",
              msg: `Missing #${idx + 1} company: ${company.name}`,
            });
          }
        });

        // Check ordering
        const lowerResponse = response.toLowerCase();
        const lowePos = lowerResponse.indexOf("lowe");
        const boaPos = lowerResponse.indexOf("bank of america");
        const honeyPos = lowerResponse.indexOf("honeywell");

        if (lowePos > -1 && boaPos > -1 && lowePos > boaPos) {
          errors.push({
            code: "E304",
            msg: "Wrong order: Bank of America before Lowe's",
          });
        }

        return { errors, passes, details };
      },
    },
    {
      id: "T003",
      name: "Calculation Test",
      question: "What is the revenue per employee for Duke Energy?",
      validate: (response) => {
        const errors = [];
        const passes = [];
        const details = {};

        // Duke Energy: $25.097B / 28,000 = $896,321
        const expected = 896321;

        // Check various formats
        const patterns = [/896[,.]?321/, /896[,.]?3/, /\$896k/i, /896[,.]?000/];

        let found = false;
        for (const pattern of patterns) {
          const match = response.match(pattern);
          if (match) {
            found = true;
            details.calculated_value = match[0];
            passes.push(`Correct calculation: $896,321 per employee`);
            break;
          }
        }

        if (!found) {
          errors.push({
            code: "E301",
            msg: `Wrong calculation (expected $896,321)`,
          });

          // Try to extract what they calculated
          const numbers = response.match(/\$?[\d,]+(?:\.\d+)?(?:k|m|b)?/gi);
          details.found_numbers = numbers || [];
        }

        // Check if Duke Energy is mentioned
        if (!response.toLowerCase().includes("duke")) {
          errors.push({ code: "E204", msg: "Duke Energy not mentioned" });
        }

        return { errors, passes, details };
      },
    },
    {
      id: "T004",
      name: "Database Statistics",
      question:
        "How many total companies are in the database and what is their combined revenue?",
      validate: (response) => {
        const errors = [];
        const passes = [];
        const details = {};

        // Check company count (5)
        if (response.match(/\b5\b|five/i)) {
          passes.push("Correct count: 5 companies");
          details.company_count = "5";
        } else {
          errors.push({
            code: "E302",
            msg: "Wrong company count (expected 5)",
          });
          const countMatch = response.match(/\b\d+\b\s*compan/i);
          details.company_count = countMatch ? countMatch[0] : "NOT FOUND";
        }

        // Check total revenue ($262.587B)
        const revenuePatterns = [/262/, /263/, /\$262\.?\d*b/i];
        let foundRevenue = false;

        for (const pattern of revenuePatterns) {
          if (response.match(pattern)) {
            foundRevenue = true;
            passes.push("Correct total revenue: ~$262.6B");
            details.total_revenue = response.match(pattern)[0];
            break;
          }
        }

        if (!foundRevenue) {
          errors.push({
            code: "E302",
            msg: "Wrong total revenue (expected $262.6B)",
          });
        }

        return { errors, passes, details };
      },
    },
    {
      id: "T005",
      name: "Industry Filter",
      question: "List all companies in the Financial Services industry",
      validate: (response) => {
        const errors = [];
        const passes = [];
        const details = { found: [], incorrect: [] };

        // Should find Bank of America only
        if (response.toLowerCase().includes("bank of america")) {
          passes.push("Found Bank of America");
          details.found.push("Bank of America");
        } else {
          errors.push({ code: "E204", msg: "Missing Bank of America" });
        }

        // Should NOT list others as Financial Services
        const others = ["Lowe's", "Honeywell", "Duke Energy", "Sonic"];
        others.forEach((company) => {
          if (response.includes(company)) {
            errors.push({
              code: "E206",
              msg: `${company} incorrectly listed as Financial Services`,
            });
            details.incorrect.push(company);
          }
        });

        // Check if it mentions only 1 company
        if (response.match(/\b1\b|one|single/i)) {
          passes.push("Correctly identified only 1 financial services company");
        }

        return { errors, passes, details };
      },
    },
  ];

  // API call function
  async function callAPI(question) {
    const startTime = performance.now();

    try {
      const response = await fetch(API_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: [{ role: "user", content: question }],
          module: "business-intelligence",
        }),
      });

      const responseTime = performance.now() - startTime;

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
          detail: "No content in response",
          responseTime,
        };
      }

      return {
        success: true,
        content: data.content,
        responseTime: Math.round(responseTime),
      };
    } catch (error) {
      if (
        error.name === "TypeError" &&
        error.message.includes("Failed to fetch")
      ) {
        return {
          success: false,
          error: "E105",
          detail: "CORS error or network failure",
          responseTime: 0,
        };
      }

      return {
        success: false,
        error: "E101",
        detail: error.message,
        responseTime: 0,
      };
    }
  }

  // Main test execution
  console.clear();
  console.log(
    "%c🧪 AI DATABASE CONNECTION TEST - BROWSER CONSOLE",
    styles.header,
  );
  console.log("%cEndpoint: " + API_ENDPOINT, styles.dim);
  console.log("%cTimestamp: " + new Date().toISOString(), styles.dim);
  console.log("");

  const results = {
    passed: 0,
    failed: 0,
    errors: [],
    responseTimes: [],
  };

  // Run tests
  for (const test of TESTS) {
    console.group(`%c[${test.id}] ${test.name}`, styles.subheader);
    console.log(
      '%cQuestion: "%c' + test.question + '%c"',
      styles.dim,
      styles.info,
      styles.dim,
    );

    const apiResponse = await callAPI(test.question);
    results.responseTimes.push(apiResponse.responseTime || 0);

    if (!apiResponse.success) {
      console.log(
        `%c✗ API Error [${apiResponse.error}]: ${ERROR_CODES[apiResponse.error]}`,
        styles.error,
      );
      console.log("%cDetails: " + apiResponse.detail, styles.dim);
      results.failed++;
      results.errors.push(apiResponse.error);
      console.groupEnd();
      continue;
    }

    console.log(
      `%c✓ Response received in ${apiResponse.responseTime}ms`,
      styles.pass,
    );

    const validation = test.validate(apiResponse.content);

    // Show errors
    if (validation.errors.length > 0) {
      console.group("%cErrors:", styles.error);
      validation.errors.forEach((err) => {
        console.log(`%c[${err.code}] ${ERROR_CODES[err.code]}`, styles.error);
        console.log(`%c  └─ ${err.msg}`, styles.dim);
        results.errors.push(err.code);
      });
      console.groupEnd();
      results.failed += validation.errors.length;
    }

    // Show passes
    if (validation.passes.length > 0) {
      console.group("%cPasses:", styles.pass);
      validation.passes.forEach((pass) => {
        console.log(`%c✓ ${pass}`, styles.pass);
      });
      console.groupEnd();
      results.passed += validation.passes.length;
    }

    // Show details
    if (Object.keys(validation.details).length > 0) {
      console.group("%cExtracted Data:", styles.info);
      console.table(validation.details);
      console.groupEnd();
    }

    console.groupEnd();
  }

  // Summary
  console.log("");
  console.log("%c📊 TEST SUMMARY", styles.header);

  const total = results.passed + results.failed;
  const successRate =
    total > 0 ? Math.round((results.passed / total) * 100) : 0;
  const avgResponseTime =
    results.responseTimes.length > 0
      ? Math.round(
          results.responseTimes.reduce((a, b) => a + b, 0) /
            results.responseTimes.length,
        )
      : 0;

  console.table({
    "Passed Checks": results.passed,
    "Failed Checks": results.failed,
    "Success Rate": successRate + "%",
    "Avg Response Time": avgResponseTime + "ms",
    "Total Tests": TESTS.length,
  });

  // Error frequency
  if (results.errors.length > 0) {
    const errorFreq = {};
    results.errors.forEach((code) => {
      errorFreq[code] = (errorFreq[code] || 0) + 1;
    });

    console.log("%cError Codes Encountered:", styles.error);
    Object.entries(errorFreq).forEach(([code, count]) => {
      console.log(
        `  %c[${code}]%c ${ERROR_CODES[code]} (${count}x)`,
        styles.code,
        styles.dim,
      );
    });
  }

  // Diagnosis
  console.log("");
  console.log("%c🔍 DIAGNOSIS", styles.header);

  if (successRate >= 90) {
    console.log(
      "%c✅ EXCELLENT: AI is properly connected to database!",
      styles.pass,
    );
  } else if (successRate >= 70) {
    console.log(
      "%c✅ GOOD: AI has database access with minor issues",
      styles.pass,
    );
  } else if (successRate >= 50) {
    console.log("%c⚠️ PARTIAL: Limited database connectivity", styles.warning);
  } else if (successRate >= 20) {
    console.log("%c❌ POOR: Mostly generic responses", styles.error);
  } else {
    console.log("%c❌ FAILED: No database connection detected", styles.error);
  }

  // Specific problems
  const problemCodes = {
    E10: "Connection/API issues - check server",
    E20: "Data accuracy issues - wrong or hallucinated data",
    E30: "Calculation errors - math problems",
    E40: "Database query issues - not fetching real data",
    E50: "Response quality - too generic or vague",
  };

  const categorizedErrors = {};
  results.errors.forEach((code) => {
    const category = code.substring(0, 3);
    categorizedErrors[category] = (categorizedErrors[category] || 0) + 1;
  });

  if (Object.keys(categorizedErrors).length > 0) {
    console.log("%cMain Issues:", styles.warning);
    Object.entries(categorizedErrors).forEach(([cat, count]) => {
      if (problemCodes[cat]) {
        console.log(`  • ${problemCodes[cat]} (${count} errors)`);
      }
    });
  }

  // Database reference
  console.log("");
  console.log("%cExpected Database Content:", styles.info);
  console.table(
    DATABASE.companies.map((c) => ({
      Company: c.name,
      Revenue: "$" + (c.revenue / 1e9).toFixed(2) + "B",
      Employees: c.employees.toLocaleString(),
      Industry: c.industry,
    })),
  );

  console.log("%cTo run again, refresh and paste this script", styles.dim);
  console.log(
    "%cSave as bookmark: javascript:(function(){...script...})();",
    styles.dim,
  );
})();
