#!/usr/bin/env node

/**
 * Test script to verify AI improvements
 * Tests database connectivity, health check, and data querying capabilities
 */

const https = require("https");
const http = require("http");

const BASE_URL = process.env.VERCEL_URL 
  ? `https://${process.env.VERCEL_URL}`
  : process.argv[2] || "https://hurt-hub-v2.vercel.app";

async function makeRequest(endpoint, options = {}) {
  return new Promise((resolve, reject) => {
    const url = `${BASE_URL}/api/${endpoint}`;
    const requestOptions = {
      method: options.method || "GET",
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
    };

    const req = https.request(url, requestOptions, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        try {
          const result = JSON.parse(data);
          resolve({ status: res.statusCode, data: result });
        } catch (e) {
          resolve({ status: res.statusCode, data });
        }
      });
    });

    req.on("error", reject);

    if (options.body) {
      req.write(JSON.stringify(options.body));
    }

    req.end();
  });
}

async function testHealthCheck() {
  console.log("\n🔍 Testing Database Health Check...");

  try {
    const response = await makeRequest("health-check");

    if (response.status === 200) {
      console.log("✅ Health check endpoint accessible");
      console.log(`📊 Database status: ${response.data.status}`);
      console.log(
        `🔗 Connection: ${response.data.database.connected ? "Connected" : "Disconnected"}`,
      );
      console.log(
        `📈 Tables available: ${Object.values(response.data.tables).filter(Boolean).length}/5`,
      );
      console.log(
        `📊 Data records: ${Object.values(response.data.dataCounts).reduce((a, b) => a + b, 0)}`,
      );
      return true;
    } else {
      console.log("❌ Health check failed:", response.status);
      return false;
    }
  } catch (error) {
    console.log("❌ Health check error:", error.message);
    return false;
  }
}

async function testDataQuery() {
  console.log("\n📊 Testing Data Query API...");

  const testQueries = [
    { query: "companies", type: "companies" },
    { query: "economic data", type: "economic" },
    { query: "business developments", type: "developments" },
  ];

  let successCount = 0;

  for (const test of testQueries) {
    try {
      const response = await makeRequest("data-query", {
        method: "POST",
        body: {
          query: test.query,
          type: test.type,
        },
      });

      if (response.status === 200) {
        const resultCount = response.data.metadata?.resultCount || 0;
        console.log(`✅ ${test.type} query successful: ${resultCount} results`);
        successCount++;
      } else {
        console.log(`❌ ${test.type} query failed: ${response.status}`);
      }
    } catch (error) {
      console.log(`❌ ${test.type} query error:`, error.message);
    }
  }

  return successCount === testQueries.length;
}

async function testChatAPI() {
  console.log("\n💬 Testing Chat API...");

  try {
    const response = await makeRequest("chat", {
      method: "POST",
      body: {
        messages: [
          {
            role: "user",
            content: "Hello, can you analyze Charlotte business data?",
          },
        ],
        model: "gpt-5",
        temperature: 0.7,
      },
    });

    if (response.status === 200) {
      console.log("✅ Chat API accessible");
      console.log(
        `🤖 Response received: ${response.data.content?.substring(0, 100)}...`,
      );
      return true;
    } else {
      console.log("❌ Chat API failed:", response.status);
      return false;
    }
  } catch (error) {
    console.log("❌ Chat API error:", error.message);
    return false;
  }
}

async function testContextAPI() {
  console.log("\n🧠 Testing Context API...");

  try {
    const response = await makeRequest("context", {
      method: "POST",
      body: {
        action: "search",
        query: "test query",
      },
    });

    if (response.status === 200) {
      console.log("✅ Context API accessible");
      console.log(
        `🔍 Search results: ${response.data.results?.length || 0} found`,
      );
      return true;
    } else {
      console.log("❌ Context API failed:", response.status);
      return false;
    }
  } catch (error) {
    console.log("❌ Context API error:", error.message);
    return false;
  }
}

async function runTests() {
  console.log("🚀 Starting AI Improvements Test Suite");
  console.log("=".repeat(50));

  const results = {
    healthCheck: await testHealthCheck(),
    dataQuery: await testDataQuery(),
    chatAPI: await testChatAPI(),
    contextAPI: await testContextAPI(),
  };

  console.log("\n" + "=".repeat(50));
  console.log("📋 TEST RESULTS SUMMARY");
  console.log("=".repeat(50));

  const passed = Object.values(results).filter(Boolean).length;
  const total = Object.keys(results).length;

  Object.entries(results).forEach(([test, passed]) => {
    const icon = passed ? "✅" : "❌";
    console.log(`${icon} ${test}: ${passed ? "PASSED" : "FAILED"}`);
  });

  console.log(`\n🎯 Overall: ${passed}/${total} tests passed`);

  if (passed === total) {
    console.log("🎉 All tests passed! AI improvements are working correctly.");
  } else {
    console.log("⚠️  Some tests failed. Check the output above for details.");
  }

  console.log("\n💡 Next steps:");
  console.log(
    "1. Access /ai-system-check in your browser for visual diagnostics",
  );
  console.log("2. Test the AI chat with business-related questions");
  console.log("3. Verify database connectivity in production");

  process.exit(passed === total ? 0 : 1);
}

// Run tests
runTests().catch(console.error);
