import { AlertTriangle, RefreshCw, Home, Bug } from "lucide-react";
import { Component, type ReactNode, type ErrorInfo } from "react";

import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { env } from "@/config/env";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorId: string | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    // Update state to show error UI
    return {
      hasError: true,
      error,
      errorId: crypto.randomUUID(),
    };
  }

  override componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error details
    this.setState({ errorInfo });

    // Log to console in development
    if (env.isDevelopment()) {
      console.group("🚨 Error Boundary Caught Error");
      console.error("Error:", error);
      console.error("Error Info:", errorInfo);
      console.error("Component Stack:", errorInfo.componentStack);
      console.groupEnd();
    }

    // Send error to monitoring service (Sentry, etc.)
    this.logError(error, errorInfo);

    // Call custom error handler if provided
    this.props.onError?.(error, errorInfo);
  }

  private logError(error: Error, errorInfo: ErrorInfo) {
    const errorReport = {
      id: this.state.errorId,
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      url: window.location.href,
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString(),
    };

    // In production, send to error reporting service
    if (env.isProduction()) {
      // Example: Sentry.captureException(error, { extra: errorReport })
      console.error("Error Report:", errorReport);
    }
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleGoHome = () => {
    window.location.href = "/";
  };

  private handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
    });
  };

  private reportBug = () => {
    const errorDetails = encodeURIComponent(
      `Error ID: ${this.state.errorId}\n` +
        `Message: ${this.state.error?.message}\n` +
        `URL: ${window.location.href}\n` +
        `Time: ${new Date().toISOString()}`,
    );

    const githubUrl = `https://github.com/charlotte-econdev/issues/new?title=Error%20Report&body=${errorDetails}`;
    window.open(githubUrl, "_blank");
  };

  override render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
          <Card className="w-full max-w-lg mx-auto shadow-sleek-lg">
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <div className="p-3 bg-destructive/10 rounded-full">
                  <AlertTriangle className="h-8 w-8 text-destructive" />
                </div>
              </div>
              <CardTitle className="text-xl font-semibold">
                Something went wrong
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-2">
                We apologize for the inconvenience. An unexpected error
                occurred.
              </p>
            </CardHeader>

            <CardContent className="space-y-6">
              {/* Error details in development */}
              {env.isDevelopment() && this.state.error && (
                <div className="bg-muted p-4 rounded-lg text-sm font-mono">
                  <p className="font-semibold mb-2">Error Details:</p>
                  <p className="text-destructive mb-2">
                    {this.state.error.message}
                  </p>
                  {this.state.errorId && (
                    <p className="text-xs text-muted-foreground">
                      Error ID: {this.state.errorId}
                    </p>
                  )}
                </div>
              )}

              {/* Action buttons */}
              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  onClick={this.handleRetry}
                  className="flex-1"
                  variant="default"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Try Again
                </Button>

                <Button
                  onClick={this.handleGoHome}
                  variant="outline"
                  className="flex-1"
                >
                  <Home className="h-4 w-4 mr-2" />
                  Go Home
                </Button>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  onClick={this.handleReload}
                  variant="ghost"
                  className="flex-1"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Reload Page
                </Button>

                <Button
                  onClick={this.reportBug}
                  variant="ghost"
                  className="flex-1"
                >
                  <Bug className="h-4 w-4 mr-2" />
                  Report Bug
                </Button>
              </div>

              {/* Help text */}
              <div className="text-center text-xs text-muted-foreground">
                <p>
                  If this problem persists, please contact support or try
                  refreshing the page.
                </p>
                {this.state.errorId && (
                  <p className="mt-1">Error ID: {this.state.errorId}</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

// HOC for wrapping components with error boundary
export function withErrorBoundary<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  fallback?: ReactNode,
) {
  const WithErrorBoundaryComponent = (props: P) => (
    <ErrorBoundary fallback={fallback}>
      <WrappedComponent {...props} />
    </ErrorBoundary>
  );

  WithErrorBoundaryComponent.displayName = `withErrorBoundary(${WrappedComponent.displayName || WrappedComponent.name})`;

  return WithErrorBoundaryComponent;
}

// Minimal error fallback component
export function ErrorFallback({
  error,
  resetError,
}: {
  error?: Error;
  resetError?: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[200px] p-6">
      <AlertTriangle className="h-12 w-12 text-destructive mb-4" />
      <h2 className="text-lg font-semibold mb-2">Something went wrong</h2>
      <p className="text-sm text-muted-foreground text-center mb-4">
        {error?.message || "An unexpected error occurred"}
      </p>
      {resetError && (
        <Button onClick={resetError} variant="outline" size="sm">
          Try again
        </Button>
      )}
    </div>
  );
}
