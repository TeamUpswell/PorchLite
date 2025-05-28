"use client";

import { useState, FormEvent } from "react";
import { useAuth } from "@/components/AuthProvider";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const { user, signIn, signUp } = useAuth();
  const router = useRouter();

  // ✅ ADD THE DEBUG CODE HERE:
  console.log("🔐 Login page - useAuth result:", {
    user: !!user,
    signIn: typeof signIn,
    signInExists: !!signIn,
  });

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    console.log("🔐 Login attempt:", { email, password: "***" });

    try {
      // ✅ Correct way - signIn throws on error, returns data on success
      const result = await signIn(email, password);
      console.log("🔐 SignIn result:", result);

      // If we get here, login was successful
      console.log("🔐 Login successful, redirecting...");
      router.push("/dashboard");
    } catch (err: any) {
      // ✅ Catch block handles errors
      console.error("🔴 Login error:", err);
      setError(err.message || "An error occurred during login");
    } finally {
      setLoading(false);
    }
  };

  // Add this signup handler:
  const handleSignup = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    console.log("🔐 Signup attempt:", { email, password: "***" });

    try {
      const result = await signUp(email, password);
      console.log("🔐 SignUp result:", result);

      // Check if email confirmation is required
      if (result.user && !result.session) {
        setError(
          "Please check your email to confirm your account before signing in."
        );
      } else {
        console.log("🔐 Signup successful, redirecting...");
        router.push("/dashboard");
      }
    } catch (err: any) {
      console.error("🔴 Signup error:", err);
      setError(err.message || "An error occurred during signup");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-md mt-10">
      <h1 className="text-2xl font-bold mb-6">Sign In</h1>

      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      <form onSubmit={isSignUp ? handleSignup : handleLogin}>
        <div className="mb-4">
          <label htmlFor="email" className="block mb-1 font-medium">
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-2 border rounded"
            required
          />
        </div>

        <div className="mb-6">
          <label htmlFor="password" className="block mb-1 font-medium">
            Password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-2 border rounded"
            required
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded"
        >
          {loading
            ? isSignUp
              ? "Creating Account..."
              : "Signing In..."
            : isSignUp
            ? "Create Account"
            : "Sign In"}
        </button>
      </form>

      <div className="text-center mt-4">
        <p className="text-sm text-gray-600">
          {isSignUp ? "Already have an account?" : "Don't have an account?"}{" "}
          <button
            type="button"
            onClick={() => {
              setIsSignUp(!isSignUp);
              setError("");
            }}
            className="text-blue-600 hover:underline"
          >
            {isSignUp ? "Sign in" : "Create account"}
          </button>
        </p>
      </div>
    </div>
  );
}
