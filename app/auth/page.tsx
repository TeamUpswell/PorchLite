"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth";
import { debugLog } from "@/lib/utils/debug";

export default function AuthPage() {
  const router = useRouter();
  const { user, signIn, signUp, loading: authLoading, refreshSession } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [mode, setMode] = useState<"signin" | "signup">("signin");

  // Redirect if already logged in
  useEffect(() => {
    debugLog("🔍 Auth page loaded");

    if (!authLoading && user) {
      const urlParams = new URLSearchParams(window.location.search);
      const redirectTo = urlParams.get("redirectedFrom") || "/";

      debugLog("🔄 User already authenticated, redirecting to:", redirectTo);
      router.push(redirectTo);
    }
  }, [user, authLoading, router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      console.log("🔄 Attempting login for:", email);
      const result = await signIn(email, password);

      if (result.error) {
        throw new Error(result.error.message);
      }

      if (result.data?.user) {
        console.log("✅ Login successful, redirecting...");

        // Get redirect destination
        const urlParams = new URLSearchParams(window.location.search);
        const redirectTo = urlParams.get("redirectedFrom") || "/";

        // Force redirect after successful login
        router.push(redirectTo);
        return;
      }
    } catch (error) {
      console.error("❌ Login error:", error);
      setError(error instanceof Error ? error.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      console.log("🔄 Attempting signup for:", email);
      const result = await signUp(email, password);

      if (result.error) {
        throw new Error(result.error.message);
      }

      if (result.data?.user) {
        console.log("✅ Signup successful");
        setError("");
        // Don't redirect immediately - user needs to verify email
      }
    } catch (error) {
      console.error("❌ Signup error:", error);
      setError(error instanceof Error ? error.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  // Don't show login form if user is already authenticated
  if (!authLoading && user) {
    return (
      <div className="text-center">
        <p>Redirecting...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            {mode === "signin"
              ? "Sign in to your account"
              : "Create your account"}
          </h2>
        </div>
        <form
          className="mt-8 space-y-6"
          onSubmit={mode === "signin" ? handleLogin : handleSignup}
        >
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <input
                id="email-address"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading || authLoading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              {loading
                ? "Processing..."
                : mode === "signin"
                ? "Sign in"
                : "Sign up"}
            </button>
          </div>

          <div className="text-center">
            <button
              type="button"
              onClick={() =>
                setMode(mode === "signin" ? "signup" : "signin")
              }
              className="text-indigo-600 hover:text-indigo-500"
            >
              {mode === "signin"
                ? "Need an account? Sign up"
                : "Already have an account? Sign in"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
