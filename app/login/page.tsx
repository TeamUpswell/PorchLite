"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/components/auth";

export default function LoginPage() {
  const router = useRouter();
  const { user, signIn, signUp, loading: authLoading, initialized } = useAuth(); // 🔑 ADD loading and initialized
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // 🔑 IMPROVED: Redirect if already logged in (wait for auth to initialize)
  useEffect(() => {
    console.log('🔍 Login redirect check:', { user: !!user, authLoading, initialized });
    
    if (initialized && !authLoading && user) {
      console.log('🔄 Login: User already logged in, redirecting to home...');
      router.push("/");
    }
  }, [user, authLoading, initialized, router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      console.log('🔍 Login: Attempting login...');
      const result = await signIn(email, password);
      
      // 🔑 CHECK FOR ERRORS
      if (result.error) {
        setError(result.error.message || "Login failed");
        console.log('❌ Login error:', result.error);
      } else {
        console.log('✅ Login successful, auth state will handle redirect');
        // 🔑 REMOVE manual redirect - let useEffect handle it
        // router.push("/"); // Remove this line
      }
    } catch (error) {
      console.log('❌ Login exception:', error);
      setError(error instanceof Error ? error.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleQuickSignup = async () => {
    try {
      const result = await signUp("test@example.com", "password123");
      if (result.error) {
        setError(result.error.message || "Signup failed");
      }
    } catch (error) {
      console.error("Signup error:", error);
      setError("Signup failed");
    }
  };

  // 🔑 SHOW LOADING STATE while auth initializes
  if (!initialized || authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // 🔑 DON'T show login form if user is already logged in
  if (user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-gray-600">Redirecting...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">
          Sign in to your account
        </h2>
        <p className="text-gray-600">Enter your credentials below</p>
      </div>

      {error && (
        <div className="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <form onSubmit={handleLogin} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Email
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
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
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
            placeholder="Enter your password"
          />
        </div>

        <div className="space-y-3">
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2.5 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors font-medium"
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>

          <button
            type="button"
            onClick={handleQuickSignup}
            disabled={loading}
            className="w-full py-2.5 px-4 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 transition-colors font-medium"
          >
            Create Test Account
          </button>
        </div>

        <div className="text-center mt-6">
          <p className="text-sm text-gray-600">
            Don&apos;t have an account?{" "}
            <a
              href="/signup"
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              Sign up and add your first property
            </a>
          </p>
        </div>
      </form>
    </>
  );
}
