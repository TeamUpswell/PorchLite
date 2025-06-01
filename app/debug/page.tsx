"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function TestConnectionPage() {
  const [status, setStatus] = useState("Testing connection...");
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    testConnection();
  }, []);

  const testConnection = async () => {
    try {
      // Test 1: Basic connection
      const { data: healthCheck, error } = await supabase
        .from("tenants")
        .select("id, name")
        .limit(1);

      if (error) {
        setStatus(`❌ Connection Error: ${error.message}`);
        return;
      }

      setStatus("✅ Supabase connected successfully!");
      setData(healthCheck);

      // Test 2: Auth status
      const {
        data: { session },
      } = await supabase.auth.getSession();
      console.log("Auth session:", session ? "Active" : "No session");
    } catch (err) {
      setStatus(`❌ Failed to connect: ${err}`);
    }
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">
        PorchLite - Supabase Connection Test
      </h1>
      <div className="bg-white p-4 rounded shadow">
        <p className="text-lg mb-4">{status}</p>
        {data && (
          <div>
            <h3 className="font-semibold">Sample Data:</h3>
            <pre className="bg-gray-100 p-2 rounded mt-2">
              {JSON.stringify(data, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
