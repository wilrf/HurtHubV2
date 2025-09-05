#!/usr/bin/env node

/**
 * AI Database Connection Test Script
 * Run this to verify the AI is using real database data
 *
 * Usage: node test-ai-database.js
 */

const API_URL = process.argv[2] || "http://localhost:3004";

// Color codes for terminal output
const colors = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  blue: "\x1b[36m",
  bold: "\x1b[1m",
};

// Known companies in your database
const KNOWN_COMPANIES = {
  "Lowe's": { revenue: 96250000000, employees: 300000 },
  "Bank of America": { revenue: 94950000000, employees: 213000 },
  Honeywell: { revenue: 34392000000, employees: 113000 },
  "Duke Energy": { revenue: 25097000000, employees: 28000 },
  "Sonic Automotive": { revenue: 11898000000, employees: 10000 },
};

// Test questions designed to verify database connectivity
const TEST_QUESTIONS = [
  {
    question:
      "List the top 3 companies by revenue with their exact revenue numbers",
    validateResponse: (response) => {
      const checks = [];

      // Check for Lowe's (highest revenue)
      if (
        (response.includes("Lowe's") && response.includes("96,250")) ||
        response.includes("96250")
      ) {
        checks.push({
          pass: true,
          message: "✓ Found Lowe's with correct revenue",
        });
      } else {
        checks.push({
          pass: false,
          message: "✗ Missing Lowe's or incorrect revenue (should be $96.25B)",
        });
      }

      // Check for Bank of America
      if (
        response.includes("Bank of America") &&
        (response.includes("94,950") || response.includes("94950"))
      ) {
        checks.push({
          pass: true,
          message: "✓ Found Bank of America with correct revenue",
        });
      } else {
        checks.push({
          pass: false,
          message:
            "✗ Missing Bank of America or incorrect revenue (should be $94.95B)",
        });
      }

      // Check for Honeywell
      if (
        response.includes("Honeywell") &&
        (response.includes("34,392") || response.includes("34392"))
      ) {
        checks.push({
          pass: true,
          message: "✓ Found Honeywell with correct revenue",
        });
      } else {
        checks.push({
          pass: false,
          message:
            "✗ Missing Honeywell or incorrect revenue (should be $34.39B)",
        });
      }

      return checks;
    },
  },
  {
    question:
      "How many companies are in the database and what is their combined revenue?",
    validateResponse: (response) => {
      const checks = [];

      // Should mention 5 companies
      if (response.includes("5") || response.includes("five")) {
        checks.push({ pass: true, message: "✓ Correct company count (5)" });
      } else {
        checks.push({
          pass: false,
          message: "✗ Incorrect company count (should be 5)",
        });
      }

      // Combined revenue should be around $262.587B
      if (response.includes("262") || response.includes("263")) {
        checks.push({
          pass: true,
          message: "✓ Correct combined revenue calculation",
        });
      } else {
        checks.push({
          pass: false,
          message: "✗ Incorrect combined revenue (should be ~$262.6B)",
        });
      }

      return checks;
    },
  },
  {
    question:
      "What company has exactly 113,000 employees and what industry are they in?",
    validateResponse: (response) => {
      const checks = [];

      if (response.includes("Honeywell")) {
        checks.push({
          pass: true,
          message: "✓ Correctly identified Honeywell",
        });
      } else {
        checks.push({ pass: false, message: "✗ Failed to identify Honeywell" });
      }

      if (response.toLowerCase().includes("technology")) {
        checks.push({ pass: true, message: "✓ Correct industry (Technology)" });
      } else {
        checks.push({
          pass: false,
          message: "✗ Incorrect industry (should be Technology)",
        });
      }

      return checks;
    },
  },
];

async function testAIEndpoint(questionObj) {
  try {
    const response = await fetch(`${API_URL}/api/ai-chat-simple`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages: [{ role: "user", content: questionObj.question }],
        module: "business-intelligence",
      }),
    });

    if (!response.ok) {
      throw new Error(`API returned ${response.status}`);
    }

    const data = await response.json();
    return data.content || "";
  } catch (error) {
    return null;
  }
}

async function runTests() {
  console.log(
    `${colors.bold}${colors.blue}═══════════════════════════════════════════════════════${colors.reset}`,
  );
  console.log(
    `${colors.bold}${colors.blue}       AI DATABASE CONNECTION TEST SUITE${colors.reset}`,
  );
  console.log(
    `${colors.bold}${colors.blue}═══════════════════════════════════════════════════════${colors.reset}`,
  );
  console.log(
    `${colors.yellow}Testing API: ${API_URL}/api/ai-chat-simple${colors.reset}\n`,
  );

  let totalPassed = 0;
  let totalFailed = 0;

  for (let i = 0; i < TEST_QUESTIONS.length; i++) {
    const test = TEST_QUESTIONS[i];
    console.log(`${colors.bold}Test ${i + 1}:${colors.reset} ${test.question}`);
    console.log(`${colors.blue}Sending request...${colors.reset}`);

    const response = await testAIEndpoint(test);

    if (!response) {
      console.log(
        `${colors.red}✗ Failed to get response from AI (API might be down)${colors.reset}\n`,
      );
      totalFailed++;
      continue;
    }

    console.log(
      `${colors.blue}Response received. Validating...${colors.reset}`,
    );

    const checks = test.validateResponse(response);
    const passed = checks.filter((c) => c.pass).length;
    const failed = checks.filter((c) => !c.pass).length;

    checks.forEach((check) => {
      if (check.pass) {
        console.log(`  ${colors.green}${check.message}${colors.reset}`);
      } else {
        console.log(`  ${colors.red}${check.message}${colors.reset}`);
      }
    });

    totalPassed += passed;
    totalFailed += failed;

    console.log(
      `${colors.yellow}Test ${i + 1} Result: ${passed}/${checks.length} checks passed${colors.reset}\n`,
    );
  }

  // Final Summary
  console.log(
    `${colors.bold}${colors.blue}═══════════════════════════════════════════════════════${colors.reset}`,
  );
  console.log(
    `${colors.bold}${colors.blue}                    TEST SUMMARY${colors.reset}`,
  );
  console.log(
    `${colors.bold}${colors.blue}═══════════════════════════════════════════════════════${colors.reset}`,
  );

  const percentage = Math.round(
    (totalPassed / (totalPassed + totalFailed)) * 100,
  );

  if (percentage === 100) {
    console.log(
      `${colors.green}${colors.bold}✓ ALL TESTS PASSED! (${totalPassed}/${totalPassed + totalFailed})${colors.reset}`,
    );
    console.log(
      `${colors.green}${colors.bold}Your AI is properly connected to the database!${colors.reset}`,
    );
  } else if (percentage > 50) {
    console.log(
      `${colors.yellow}${colors.bold}⚠ PARTIAL SUCCESS: ${totalPassed}/${totalPassed + totalFailed} checks passed (${percentage}%)${colors.reset}`,
    );
    console.log(
      `${colors.yellow}AI has some database connectivity but needs improvement${colors.reset}`,
    );
  } else {
    console.log(
      `${colors.red}${colors.bold}✗ TESTS FAILED: ${totalPassed}/${totalPassed + totalFailed} checks passed (${percentage}%)${colors.reset}`,
    );
    console.log(
      `${colors.red}AI is NOT using your database - using generic responses${colors.reset}`,
    );
  }

  console.log(`\n${colors.blue}Known companies in database:${colors.reset}`);
  Object.entries(KNOWN_COMPANIES).forEach(([name, data]) => {
    console.log(
      `  • ${name}: $${(data.revenue / 1000000000).toFixed(2)}B revenue, ${data.employees.toLocaleString()} employees`,
    );
  });

  console.log(
    `\n${colors.yellow}Run this test again with: node test-ai-database.js${colors.reset}`,
  );
  console.log(
    `${colors.yellow}Or test against production: node test-ai-database.js https://your-app.vercel.app${colors.reset}`,
  );
}

// Run the tests
console.log(
  `${colors.yellow}Starting AI Database Connection Test...${colors.reset}\n`,
);
runTests().catch((error) => {
  console.error(`${colors.red}Test suite error:`, error, colors.reset);
});
