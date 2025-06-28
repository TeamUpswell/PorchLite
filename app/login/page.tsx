"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/AuthProvider";
export default function LoginPage() {
  const router = useRouter();
  const { user, signIn, signUp, loading: authLoading, initialized } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Refs for optimization
  const mountedRef = useRef(true);
  const submittingRef = useRef(false);
  const hasRedirectedRef = useRef(false);

  // Component cleanup
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Optimized redirect logic with deduplication
  useEffect(() => {
    console.log("🔍 Login redirect check:", {
      user: !!user,
      authLoading,
      initialized,
      hasRedirected: hasRedirectedRef.current,
    });

    // Prevent multiple redirects
    if (hasRedirectedRef.current) return;

    if (initialized && !authLoading && user && mountedRef.current) {
      console.log("🔄 Login: User already logged in, redirecting to home...");
      hasRedirectedRef.current = true;
      router.push("/");
    }
  }, [user, authLoading, initialized, router]);

  // Memoized error clearing
  const clearError = useCallback(() => {
    if (mountedRef.current && error) {
      setError("");
    }
  }, [error]);

  // Memoized input handlers
  const handleEmailChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setEmail(e.target.value);
      clearError();
    },
    [clearError]
  );

  const handlePasswordChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setPassword(e.target.value);
      clearError();
    },
    [clearError]
  );

  // Optimized login handler with deduplication
  const handleLogin = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      // Prevent duplicate submissions
      if (submittingRef.current || loading || !mountedRef.current) {
        console.log("🛑 Login: Preventing duplicate submission");
        return;
      }

      submittingRef.current = true;
      setLoading(true);
      setError("");

      try {
        console.log("🔍 Login: Attempting login...");
        const result = await signIn(email, password);

        if (!mountedRef.current) {
          console.log("⚠️ Login: Component unmounted, aborting");
          return;
        }

        if (result.error) {
          setError(result.error.message || "Login failed");
          console.log("❌ Login error:", result.error);
        } else {
          console.log("✅ Login successful, auth state will handle redirect");
          // Clear form on success
          setEmail("");
          setPassword("");
        }
      } catch (error) {
        console.log("❌ Login exception:", error);
        if (mountedRef.current) {
          setError(
            error instanceof Error ? error.message : "An error occurred"
          );
        }
      } finally {
        if (mountedRef.current) {
          setLoading(false);
        }
        submittingRef.current = false;
      }
    },
    [email, password, signIn, loading]
  );

  // Optimized quick signup handler
  const handleQuickSignup = useCallback(async () => {
    if (submittingRef.current || loading || !mountedRef.current) {
      return;
    }

    submittingRef.current = true;
    setLoading(true);
    setError("");

    try {
      console.log("🔍 Quick signup: Creating test account...");
      const result = await signUp("test@example.com", "password123");

      if (!mountedRef.current) {
        console.log("⚠️ Quick signup: Component unmounted, aborting");
        return;
      }

      if (result.error) {
        setError(result.error.message || "Signup failed");
        console.log("❌ Quick signup error:", result.error);
      } else {
        console.log("✅ Quick signup successful");
      }
    } catch (error) {
      console.error("❌ Quick signup exception:", error);
      if (mountedRef.current) {
        setError("Signup failed");
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
      submittingRef.current = false;
    }
  }, [signUp, loading]);

  // Memoized retry handler
  const handleRetry = useCallback(() => {
    setError("");
    setEmail("");
    setPassword("");
  }, []);

  // Loading state while auth initializes
  if (!initialized || authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">⏳ Initializing authentication...</p>
        </div>
      </div>
    );
  }

  // Don't show login form if user is already logged in
  if (user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-3"></div>
          <p className="text-gray-600">🔄 Redirecting to dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Sign in to your account
          </h2>
          <p className="text-gray-600">Enter your credentials below</p>
        </div>

        {error && (
          <div className="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
            <div className="flex items-center justify-between">
              <span>{error}</span>
              <button
                onClick={handleRetry}
                className="text-red-500 hover:text-red-700 ml-4 text-sm underline"
              >
                Try Again
              </button>
            </div>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={handleEmailChange}
              required
              disabled={loading}
              autoComplete="email"
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none disabled:bg-gray-100 disabled:cursor-not-allowed transition-colors"
              placeholder="Enter your email"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={handlePasswordChange}
              required
              disabled={loading}
              autoComplete="current-password"
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none disabled:bg-gray-100 disabled:cursor-not-allowed transition-colors"
              placeholder="Enter your password"
            />
          </div>

          <div className="space-y-3">
            <button
              type="submit"
              disabled={loading || !email.trim() || !password.trim()}
              className="w-full bg-blue-600 text-white py-2.5 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors font-medium"
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Signing in...
                </span>
              ) : (
                "Sign In"
              )}
            </button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-gray-50 text-gray-500">Or</span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleQuickSignup}
              disabled={loading}
              className="w-full py-2.5 px-4 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Creating account...
                </span>
              ) : (
                "🚀 Create Test Account"
              )}
            </button>
          </div>

          <div className="text-center mt-6">
            <p className="text-sm text-gray-600">
              Don't have an account?{" "}
              <a
                href="/auth/signup"
                className="text-blue-600 hover:text-blue-700 font-medium transition-colors"
              >
                Sign up and add your first property
              </a>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
