// Create: app/debug-property/page.tsx
"use client";

import { useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { supabase } from "@/lib/supabase";

export default function DebugPropertyPage() {
  const { user } = useAuth();
  const [results, setResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const testPropertyQuery = async () => {
    if (!user?.id) {
      setResults({ error: "No user ID" });
      return;
    }

    setLoading(true);
    setResults(null);

    try {
      console.log("🔍 Testing property query for user:", user.id);

      // Test the exact same query that's hanging
      const startTime = Date.now();

      const { data, error } = await supabase
        .from("properties")
        .select("*")
        .eq("created_by", user.id)
        .order("created_at", { ascending: false });

      const endTime = Date.now();

      setResults({
        success: true,
        data: data,
        error: error,
        queryTime: endTime - startTime,
        userInfo: {
          id: user.id,
          email: user.email,
        },
      });
    } catch (err: any) {
      setResults({
        success: false,
        error: err.message,
        stack: err.stack,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Property Loading Debug</h1>

      <div className="space-y-4">
        <div>
          <strong>User Status:</strong>{" "}
          {user ? `Logged in as ${user.email}` : "Not logged in"}
        </div>

        <button
          onClick={testPropertyQuery}
          disabled={loading || !user}
          className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50"
        >
          {loading ? "Testing..." : "Test Property Query"}
        </button>

        {results && (
          <div className="bg-gray-100 p-4 rounded">
            <h3 className="font-bold">Results:</h3>
            <pre className="text-sm overflow-auto">
              {JSON.stringify(results, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
