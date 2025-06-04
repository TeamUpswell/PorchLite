"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import StandardCard from "@/components/ui/StandardCard";

export default function DatabaseDiagnostic() {
  const [status, setStatus] = useState<"loading" | "connected" | "error">(
    "loading"
  );
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const testConnection = async () => {
      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("id")
          .limit(1);
        if (error) throw error;
        setStatus("connected");
      } catch (err) {
        setStatus("error");
        setError(err instanceof Error ? err.message : "Unknown error");
      }
    };

    testConnection();
  }, []);

  return (
    <StandardCard title="Database Connection">
      <div className="space-y-2">
        <div
          className={`font-medium ${
            status === "connected"
              ? "text-green-600"
              : status === "error"
              ? "text-red-600"
              : "text-yellow-600"
          }`}
        >
          Status: {status === "loading" ? "Testing..." : status}
        </div>
        {error && <div className="text-red-600 text-sm">{error}</div>}
      </div>
    </StandardCard>
  );
}
