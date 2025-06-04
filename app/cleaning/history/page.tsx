"use client";

// REMOVE ANY EXISTING revalidate CONFIGS
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";
export const runtime = "nodejs";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { useAuth } from "@/components/auth";
import AuthenticatedLayout from "@/components/auth/AuthenticatedLayout";
import { supabase } from "@/lib/supabase";
import { useProperty } from "@/lib/hooks/useProperty";
import { ArrowLeft, Calendar, Check, X, ChevronRight } from "lucide-react";

export default function CleaningHistory() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(false);
  }, []);

  return (
    <AuthenticatedLayout>
      <div className="p-6">
        <h1 className="text-2xl font-bold">Cleaning History</h1>
        <p>History content will go here</p>
      </div>
    </AuthenticatedLayout>
  );
}
