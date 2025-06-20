"use client";

import React, { Component, ReactNode, ErrorInfo } from "react";
import { AlertTriangle, RefreshCw, Home, Bug } from "lucide-react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
  errorId: string;
}

export class PageErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);

    this.state = {
      hasError: false,
      errorId: "",
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    // Generate unique error ID for tracking
    const errorId = `err_${Date.now()}_${Math.random()
      .toString(36)
      .substr(2, 9)}`;

    return {
      hasError: true,
      error,
      errorId,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error to console in development
    if (process.env.NODE_ENV === "development") {
      console.group("🚨 Page Error Boundary Caught Error");
      console.error("Error:", error);
      console.error("Error Info:", errorInfo);
      console.error("Component Stack:", errorInfo.componentStack);
      console.groupEnd();
    }

    // Update state with error info
    this.setState({ errorInfo });

    // Here you could send error to monitoring service
    // Example: Sentry, LogRocket, etc.
    this.logErrorToService(error, errorInfo);
  }

  private logErrorToService = (error: Error, errorInfo: ErrorInfo) => {
    // Log to external service in production
    if (process.env.NODE_ENV === "production") {
      try {
        // Example: Send to your error monitoring service
        // Sentry.captureException(error, {
        //   contexts: {
        //     react: {
        //       componentStack: errorInfo.componentStack,
        //     },
        //   },
        //   tags: {
        //     errorBoundary: 'PageErrorBoundary',
        //     errorId: this.state.errorId,
        //   },
        // });

        console.error("Error logged to service:", {
          error: error.message,
          stack: error.stack,
          componentStack: errorInfo.componentStack,
          errorId: this.state.errorId,
        });
      } catch (loggingError) {
        console.error("Failed to log error to service:", loggingError);
      }
    }
  };

  private handleRetry = () => {
    this.setState({
      hasError: false,
      error: undefined,
      errorInfo: undefined,
      errorId: "",
    });
  };

  private handleReload = () => {
    window.location.reload();
  };

  private handleGoHome = () => {
    window.location.href = "/";
  };

  private copyErrorInfo = () => {
    const errorInfo = {
      errorId: this.state.errorId,
      message: this.state.error?.message,
      stack: this.state.error?.stack,
      componentStack: this.state.errorInfo?.componentStack,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
    };

    navigator.clipboard
      .writeText(JSON.stringify(errorInfo, null, 2))
      .then(() => {
        alert("Error information copied to clipboard");
      })
      .catch(() => {
        console.error("Failed to copy error info");
      });
  };

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="w-8 h-8 text-red-600" />
              </div>
              <h1 className="text-xl font-bold text-gray-900 mb-2">
                Oops! Something went wrong
              </h1>
              <p className="text-gray-600 text-sm">
                We're sorry, but an unexpected error occurred. Our team has been
                notified.
              </p>
              {process.env.NODE_ENV === "development" && (
                <div className="mt-4 p-3 bg-red-50 rounded text-left">
                  <p className="text-xs font-mono text-red-800 break-all">
                    <strong>Error:</strong> {this.state.error?.message}
                  </p>
                  <p className="text-xs text-red-600 mt-1">
                    Error ID: {this.state.errorId}
                  </p>
                </div>
              )}
            </div>

            <div className="space-y-3">
              <button
                onClick={this.handleRetry}
                className="w-full flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Try Again
              </button>

              <button
                onClick={this.handleReload}
                className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Reload Page
              </button>

              <button
                onClick={this.handleGoHome}
                className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
              >
                <Home className="w-4 h-4 mr-2" />
                Go to Homepage
              </button>

              {process.env.NODE_ENV === "development" && (
                <button
                  onClick={this.copyErrorInfo}
                  className="w-full flex items-center justify-center px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors text-xs"
                >
                  <Bug className="w-3 h-3 mr-2" />
                  Copy Error Info
                </button>
              )}
            </div>

            <div className="mt-4 pt-4 border-t border-gray-200 text-center">
              <p className="text-xs text-gray-500">
                If this problem persists, please contact support
              </p>
              {this.state.errorId && (
                <p className="text-xs text-gray-400 mt-1">
                  Error ID: {this.state.errorId}
                </p>
              )}
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
