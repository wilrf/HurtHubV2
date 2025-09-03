import React from "react";
import ReactDOM from "react-dom/client";
import { env } from "@/config/env";

import App from "./App";
import "@/styles/globals.css";

// Vercel deployment verification with user-friendly error
try {
  // This will throw immediately if not on Vercel
  const deploymentInfo = env.deploymentInfo;
  
  console.log(`🚀 Running on Vercel ${deploymentInfo.environment} environment`);
  console.log(`📡 API Base: ${deploymentInfo.url}`);
  console.log(`🔧 Version: ${deploymentInfo.version}`);
  
  // Environment variable testing in development/preview
  if (!deploymentInfo.isProduction) {
    import("./utils/env-test").then(({ testEnvironmentVariables }) => {
      testEnvironmentVariables();
    }).catch(() => {
      // Silently fail if env-test doesn't exist
    });
  }
} catch (_error) {
  // Show friendly error page for local access attempts
  const rootElement = document.getElementById('root');
  if (rootElement) {
    rootElement.innerHTML = `
      <div style="
        min-height: 100vh;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
        background: linear-gradient(135deg, #0070f3 0%, #00dfd8 100%);
        color: white;
        text-align: center;
        padding: 2rem;
      ">
        <div style="
          background: rgba(255, 255, 255, 0.1);
          padding: 3rem;
          border-radius: 16px;
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.2);
          max-width: 600px;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
        ">
          <div style="font-size: 4rem; margin-bottom: 1rem;">⚡</div>
          <h1 style="
            font-size: 2.5rem;
            font-weight: 700;
            margin: 0 0 1.5rem 0;
            line-height: 1.2;
          ">Vercel Deployment Required</h1>
          <p style="
            font-size: 1.25rem;
            opacity: 0.9;
            margin: 0 0 2rem 0;
            line-height: 1.5;
          ">This application runs exclusively on Vercel.<br>Push your changes to see them in action.</p>
          
          <div style="
            background: rgba(0, 0, 0, 0.3);
            padding: 1.5rem;
            border-radius: 8px;
            margin: 2rem 0;
            font-family: 'Monaco', 'Menlo', 'Consolas', monospace;
          ">
            <div style="opacity: 0.7; font-size: 0.9rem; margin-bottom: 0.5rem;">Run these commands:</div>
            <code style="display: block; font-size: 1rem; line-height: 1.5;">
              git add .<br>
              git commit -m "your changes"<br>
              git push origin your-branch
            </code>
          </div>
          
          <p style="
            margin: 1.5rem 0 0 0;
            opacity: 0.8;
            font-size: 1rem;
          ">
            🔗 Preview URL will appear in your Pull Request<br>
            🚀 Merge to main for production deployment
          </p>
          
          <div style="
            margin-top: 2rem;
            padding-top: 2rem;
            border-top: 1px solid rgba(255, 255, 255, 0.2);
            opacity: 0.6;
            font-size: 0.9rem;
          ">
            No local setup • No environment variables • No configuration<br>
            Just push and test on real Vercel infrastructure
          </div>
        </div>
      </div>
    `;
  }
  
  // Prevent further execution
  throw new Error('Vercel deployment required');
}

// Error reporting for Vercel deployments
if (env.isProduction()) {
  // Production error handling
  window.addEventListener("unhandledrejection", (event) => {
    console.error("[Production] Unhandled promise rejection:", event.reason);
    // Could integrate with Sentry or other error reporting here
  });

  window.addEventListener("error", (event) => {
    console.error("[Production] Global error:", event.error);
    // Could integrate with error reporting here
  });
} else {
  // Preview/development error handling (more verbose)
  window.addEventListener("unhandledrejection", (event) => {
    console.warn("[Preview] Unhandled promise rejection:", event.reason);
  });

  window.addEventListener("error", (event) => {
    console.warn("[Preview] Global error:", event.error);
  });
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
