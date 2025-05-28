"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { supabase } from "@/lib/supabase";

export default function DebugPage() {
  const { user, loading } = useAuth(); // Changed from isLoading to loading
  const [cookies, setCookies] = useState<string[]>([]);
  const [localStorageKeys, setLocalStorageKeys] = useState<string[]>([]);

  useEffect(() => {
    // Get all cookies
    document.cookie.split(";").forEach((cookie) => {
      setCookies((prev) => [...prev, cookie.trim()]);
    });

    // Get localStorage keys
    if (typeof window !== "undefined") {
      const keys = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key) keys.push(key);
      }
      setLocalStorageKeys(keys);
    }

    // Log authentication state
    console.log("Auth Debug - User:", user);
    console.log("Auth Debug - Loading:", loading); // Changed from isLoading to loading
  }, [user, loading]); // Changed dependency from isLoading to loading

  const refreshSession = async () => {
    const { data, error } = await supabase.auth.refreshSession();
    if (error) {
      console.error("Failed to refresh session:", error);
      alert("Failed to refresh session: " + error.message);
    } else {
      console.log("Session refreshed:", data);
      alert("Session refreshed successfully");
    }
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Auth Debug Page</h1>

      <div className="mb-6 bg-white p-6 rounded-lg shadow">
        <h2 className="text-lg font-semibold mb-3">Authentication State</h2>
        <div className="mb-2">
          <strong>Loading:</strong> {loading ? "Yes" : "No"}{" "}
          {/* Changed from isLoading to loading */}
        </div>
        <div className="mb-2">
          <strong>Authenticated:</strong> {user ? "Yes" : "No"}
        </div>
        {user && (
          <div className="mb-2">
            <strong>User Email:</strong> {user.email}
          </div>
        )}
        <button
          onClick={refreshSession}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded"
        >
          Refresh Session
        </button>
      </div>

      <div className="mb-6 bg-white p-6 rounded-lg shadow">
        <h2 className="text-lg font-semibold mb-3">Cookies</h2>
        {cookies.length === 0 ? (
          <p>No cookies found</p>
        ) : (
          <ul className="list-disc pl-5">
            {cookies.map((cookie, i) => (
              <li key={i} className="mb-1 text-sm font-mono">
                {cookie}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-lg font-semibold mb-3">LocalStorage</h2>
        {localStorageKeys.length === 0 ? (
          <p>No localStorage keys found</p>
        ) : (
          <ul className="list-disc pl-5">
            {localStorageKeys.map((key, i) => (
              <li key={i} className="mb-1 text-sm font-mono">
                {key}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
