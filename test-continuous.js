#!/usr/bin/env node

/**
 * CONTINUOUS AI DATABASE CONNECTION TESTER
 * Runs tests repeatedly until the AI is properly connected to the database
 *
 * Usage: node test-continuous.js [URL] [interval-seconds]
 * Example: node test-continuous.js https://hurt-hub-v2.vercel.app 30
 */

const API_URL = process.argv[2] || "https://hurt-hub-v2.vercel.app";
const TEST_INTERVAL = (parseInt(process.argv[3]) || 30) * 1000; // Default 30 seconds
const SUCCESS_THRESHOLD = 80; // Stop when we reach 80% success rate

// Colors
const colors = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  blue: "\x1b[36m",
  magenta: "\x1b[35m",
  bold: "\x1b[1m",
  dim: "\x1b[2m",
  clear: "\x1b[2J\x1b[H",
};

// Sound alerts (Windows)
const beep = () => process.stdout.write("\x07");
const successSound = () => {
  beep();
  setTimeout(beep, 200);
  setTimeout(beep, 400);
};

// Test state
let testRun = 0;
let bestScore = 0;
let lastResults = [];
let isConnected = false;

// Database truth for validation
const EXPECTED_DATA = {
  companies: [
    "Lowe's",
    "Bank of America",
    "Honeywell",
    "Duke Energy",
    "Sonic Automotive",
  ],
  revenues: [96250000000, 94950000000, 34392000000, 25097000000, 11898000000],
  employees: [300000, 213000, 113000, 28000, 10000],
};

// Quick validation tests
const QUICK_TESTS = [
  {
    name: "Honeywell Check",
    question: "What is Honeywell revenue?",
    validate: (r) => r.includes("34") && r.includes("392"),
  },
  {
    name: "Company Count",
    question: "How many companies total?",
    validate: (r) => r.includes("5") || r.includes("five"),
  },
  {
    name: "Top Company",
    question: "Which company has the highest revenue?",
    validate: (r) => r.toLowerCase().includes("lowe"),
  },
  {
    name: "BofA Employees",
    question: "How many employees does Bank of America have?",
    validate: (r) => r.includes("213") || r.includes("213,000"),
  },
  {
    name: "Total Revenue",
    question: "What is the combined revenue of all companies?",
    validate: (r) => r.includes("262") || r.includes("263"),
  },
];

// API call with timeout
async function testAPI(question, timeout = 10000) {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    const response = await fetch(`${API_URL}/api/ai-chat-simple`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages: [{ role: "user", content: question }],
        module: "business-intelligence",
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) return null;
    const data = await response.json();
    return data.content || null;
  } catch (error) {
    return null;
  }
}

// Run a single test cycle
async function runTestCycle() {
  testRun++;
  const results = {
    passed: 0,
    failed: 0,
    tests: [],
  };

  console.log(
    `${colors.clear}${colors.bold}${colors.blue}🔄 CONTINUOUS AI DATABASE TESTER${colors.reset}`,
  );
  console.log(`${colors.dim}URL: ${API_URL}${colors.reset}`);
  console.log(
    `${colors.dim}Run #${testRun} | Best Score: ${bestScore}% | Interval: ${TEST_INTERVAL / 1000}s${colors.reset}\n`,
  );

  // Progress bar
  const progressBar = (current, total) => {
    const filled = Math.round((current / total) * 20);
    const bar = "█".repeat(filled) + "░".repeat(20 - filled);
    return `[${bar}] ${current}/${total}`;
  };

  // Run each test
  for (let i = 0; i < QUICK_TESTS.length; i++) {
    const test = QUICK_TESTS[i];
    process.stdout.write(
      `\r${progressBar(i, QUICK_TESTS.length)} Testing: ${test.name}...`,
    );

    const response = await testAPI(test.question, 5000);

    if (!response) {
      results.failed++;
      results.tests.push({
        name: test.name,
        passed: false,
        reason: "No response",
      });
    } else {
      const passed = test.validate(response);
      if (passed) {
        results.passed++;
        results.tests.push({ name: test.name, passed: true });
      } else {
        results.failed++;
        results.tests.push({
          name: test.name,
          passed: false,
          reason: "Wrong data",
        });
      }
    }
  }

  // Clear progress line
  process.stdout.write("\r" + " ".repeat(60) + "\r");

  // Calculate success rate
  const total = results.passed + results.failed;
  const successRate = Math.round((results.passed / total) * 100);

  // Display results
  console.log(`${colors.bold}Test Results:${colors.reset}`);
  results.tests.forEach((test) => {
    const icon = test.passed ? `${colors.green}✓` : `${colors.red}✗`;
    const status = test.passed ? `${colors.green}PASS` : `${colors.red}FAIL`;
    console.log(
      `  ${icon} ${test.name.padEnd(20)} ${status}${colors.reset} ${test.reason ? `(${test.reason})` : ""}`,
    );
  });

  console.log(
    `\n${colors.bold}Score: ${successRate >= SUCCESS_THRESHOLD ? colors.green : successRate >= 50 ? colors.yellow : colors.red}${successRate}%${colors.reset} (${results.passed}/${total} passed)`,
  );

  // Track best score
  if (successRate > bestScore) {
    bestScore = successRate;
    console.log(`${colors.green}📈 New best score!${colors.reset}`);
  }

  // Status message
  if (successRate >= SUCCESS_THRESHOLD) {
    isConnected = true;
    console.log(
      `\n${colors.green}${colors.bold}🎉 SUCCESS! AI IS CONNECTED TO DATABASE!${colors.reset}`,
    );
    console.log(
      `${colors.green}The AI is now properly querying your Supabase database.${colors.reset}`,
    );
    successSound();
    return true;
  } else if (successRate >= 60) {
    console.log(
      `\n${colors.yellow}⚠️  PARTIAL CONNECTION - Getting closer...${colors.reset}`,
    );
  } else if (successRate >= 20) {
    console.log(
      `\n${colors.yellow}⚠️  WEAK CONNECTION - Some progress detected${colors.reset}`,
    );
  } else {
    console.log(
      `\n${colors.red}❌ NOT CONNECTED - AI using generic responses${colors.reset}`,
    );
  }

  // Show what the AI should be finding
  if (successRate < 50) {
    console.log(
      `\n${colors.dim}Expected data the AI should return:${colors.reset}`,
    );
    console.log(
      `${colors.dim}  • Lowe's: $96.25B revenue, 300K employees${colors.reset}`,
    );
    console.log(
      `${colors.dim}  • Bank of America: $94.95B revenue, 213K employees${colors.reset}`,
    );
    console.log(
      `${colors.dim}  • Honeywell: $34.39B revenue, 113K employees${colors.reset}`,
    );
    console.log(
      `${colors.dim}  • Duke Energy: $25.10B revenue, 28K employees${colors.reset}`,
    );
    console.log(
      `${colors.dim}  • Sonic Automotive: $11.90B revenue, 10K employees${colors.reset}`,
    );
  }

  // History tracking
  lastResults.push(successRate);
  if (lastResults.length > 10) lastResults.shift();

  // Show trend
  if (lastResults.length > 1) {
    const trend =
      lastResults[lastResults.length - 1] - lastResults[lastResults.length - 2];
    if (trend > 0) {
      console.log(`${colors.green}↑ Improving (+${trend}%)${colors.reset}`);
    } else if (trend < 0) {
      console.log(`${colors.red}↓ Degrading (${trend}%)${colors.reset}`);
    } else {
      console.log(`${colors.yellow}→ No change${colors.reset}`);
    }
  }

  // Show history graph
  if (lastResults.length > 3) {
    console.log(
      `\n${colors.dim}Recent scores: ${lastResults.map((s) => s + "%").join(" → ")}${colors.reset}`,
    );
  }

  return false;
}

// Main loop
async function startContinuousTesting() {
  console.log(
    `${colors.bold}${colors.magenta}Starting continuous testing...${colors.reset}`,
  );
  console.log(
    `${colors.dim}Will test every ${TEST_INTERVAL / 1000} seconds until ${SUCCESS_THRESHOLD}% success${colors.reset}`,
  );
  console.log(`${colors.dim}Press Ctrl+C to stop${colors.reset}\n`);

  // Initial test
  const connected = await runTestCycle();

  if (!connected) {
    // Set up interval for continuous testing
    const interval = setInterval(async () => {
      const connected = await runTestCycle();

      if (connected) {
        clearInterval(interval);
        console.log(
          `\n${colors.green}${colors.bold}Testing complete! Your AI is now connected.${colors.reset}`,
        );
        console.log(
          `${colors.dim}Achieved ${bestScore}% success rate after ${testRun} test runs${colors.reset}`,
        );
        process.exit(0);
      }

      // Show countdown to next test
      let countdown = TEST_INTERVAL / 1000;
      const countdownInterval = setInterval(() => {
        countdown--;
        if (countdown > 0) {
          process.stdout.write(
            `\r${colors.dim}Next test in ${countdown} seconds...${colors.reset}  `,
          );
        } else {
          process.stdout.write("\r" + " ".repeat(40) + "\r");
          clearInterval(countdownInterval);
        }
      }, 1000);

      // Clear countdown when next test starts
      setTimeout(() => clearInterval(countdownInterval), TEST_INTERVAL - 1000);
    }, TEST_INTERVAL);

    // Handle Ctrl+C gracefully
    process.on("SIGINT", () => {
      console.log(`\n\n${colors.yellow}Stopped by user${colors.reset}`);
      console.log(`Final stats: ${testRun} runs, best score: ${bestScore}%`);
      process.exit(0);
    });
  }
}

// Error handler
process.on("uncaughtException", (error) => {
  console.error(`${colors.red}Error: ${error.message}${colors.reset}`);
  process.exit(1);
});

// Start testing
startContinuousTesting();
