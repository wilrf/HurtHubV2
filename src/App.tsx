import { Suspense, lazy } from "react";
import { Toaster } from "react-hot-toast";
import { Provider } from "react-redux";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import { ErrorBoundary } from "@/components/common/ErrorBoundary";
import { MainLayout } from "@/components/layouts/MainLayout";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { store } from "@/store";

// Lazy load pages for code splitting

const Dashboard = lazy(() => import("@/pages/Dashboard"));
const HomePage = lazy(() => import("@/pages/HomePage"));
const CommunityPulse = lazy(() => import("@/pages/CommunityPulse"));
const BusinessIntelligence = lazy(() => import("@/pages/BusinessIntelligence"));
const AIAssistant = lazy(() => import("@/pages/AIAssistant"));
const CompanyDetails = lazy(() => import("@/pages/CompanyDetails"));
const BusinessProfile = lazy(() => import("@/pages/BusinessProfile"));
const Settings = lazy(() => import("@/pages/Settings"));
const NotFound = lazy(() => import("@/pages/NotFound"));
const GPT5Test = lazy(() => import("@/pages/GPT5Test").then(module => ({ default: module.GPT5Test })));

function App() {
  return (
    <Provider store={store}>
      <ErrorBoundary>
        <Router>
          <ThemeProvider>
            <AuthProvider>
              <div className="min-h-screen transition-all duration-300">
                <Routes>
                  {/* Main application routes */}
                  <Route path="/" element={<MainLayout />}>
                    <Route
                      index
                      element={
                        <Suspense
                          fallback={
                            <div className="flex h-96 items-center justify-center">
                              <LoadingSpinner size="lg" />
                            </div>
                          }
                        >
                          <Dashboard />
                        </Suspense>
                      }
                    />
                    <Route
                      path="home"
                      element={
                        <Suspense
                          fallback={
                            <div className="flex h-96 items-center justify-center">
                              <LoadingSpinner size="lg" />
                            </div>
                          }
                        >
                          <HomePage />
                        </Suspense>
                      }
                    />
                    <Route
                      path="community"
                      element={
                        <Suspense
                          fallback={
                            <div className="flex h-96 items-center justify-center">
                              <LoadingSpinner size="lg" />
                            </div>
                          }
                        >
                          <CommunityPulse />
                        </Suspense>
                      }
                    />
                    <Route
                      path="business-intelligence"
                      element={
                        <Suspense
                          fallback={
                            <div className="flex h-96 items-center justify-center">
                              <LoadingSpinner size="lg" />
                            </div>
                          }
                        >
                          <BusinessIntelligence />
                        </Suspense>
                      }
                    />
                    <Route
                      path="ai-assistant"
                      element={
                        <Suspense
                          fallback={
                            <div className="flex h-96 items-center justify-center">
                              <LoadingSpinner size="lg" />
                            </div>
                          }
                        >
                          <AIAssistant />
                        </Suspense>
                      }
                    />
                    <Route
                      path="gpt5-test"
                      element={
                        <Suspense
                          fallback={
                            <div className="flex h-96 items-center justify-center">
                              <LoadingSpinner size="lg" />
                            </div>
                          }
                        >
                          <GPT5Test />
                        </Suspense>
                      }
                    />
                    <Route
                      path="company/:id"
                      element={
                        <Suspense
                          fallback={
                            <div className="flex h-96 items-center justify-center">
                              <LoadingSpinner size="lg" />
                            </div>
                          }
                        >
                          <CompanyDetails />
                        </Suspense>
                      }
                    />
                    <Route
                      path="business/:id"
                      element={
                        <Suspense
                          fallback={
                            <div className="flex h-96 items-center justify-center">
                              <LoadingSpinner size="lg" />
                            </div>
                          }
                        >
                          <BusinessProfile />
                        </Suspense>
                      }
                    />
                    <Route
                      path="settings"
                      element={
                        <Suspense
                          fallback={
                            <div className="flex h-96 items-center justify-center">
                              <LoadingSpinner size="lg" />
                            </div>
                          }
                        >
                          <Settings />
                        </Suspense>
                      }
                    />
                  </Route>

                  {/* Redirect old routes */}
                  <Route
                    path="/dashboard"
                    element={<Navigate to="/" replace />}
                  />
                  <Route
                    path="/companies/:id"
                    element={<Navigate to="/company/$1" replace />}
                  />

                  {/* 404 page */}
                  <Route
                    path="*"
                    element={
                      <Suspense fallback={<LoadingSpinner size="lg" />}>
                        <NotFound />
                      </Suspense>
                    }
                  />
                </Routes>

                {/* Global toast notifications */}
                <Toaster
                  position="top-right"
                  toastOptions={{
                    duration: 5000,
                    style: {
                      background: "hsl(var(--background))",
                      color: "hsl(var(--foreground))",
                      border: "1px solid hsl(var(--border))",
                    },
                    success: {
                      iconTheme: {
                        primary: "hsl(var(--success))",
                        secondary: "hsl(var(--success-foreground))",
                      },
                    },
                    error: {
                      iconTheme: {
                        primary: "hsl(var(--destructive))",
                        secondary: "hsl(var(--destructive-foreground))",
                      },
                    },
                  }}
                />
              </div>
            </AuthProvider>
          </ThemeProvider>
        </Router>
      </ErrorBoundary>
    </Provider>
  );
}

export default App;
