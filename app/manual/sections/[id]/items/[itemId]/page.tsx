"use client";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Edit, Trash2, ExternalLink } from "lucide-react";
import Link from "next/link";
import StandardPageLayout from "@/components/layout/StandardPageLayout";
import StandardCard from "@/components/ui/StandardCard";
import { useAuth } from "@/components/AuthProvider";
import { supabase } from "@/lib/supabase";

export default function ItemPage({ params }) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(false);
  }, []);

  return (
    <StandardPageLayout title="Manual Item">
      <StandardCard>
        <div className="p-6">
          <h2 className="text-xl font-semibold">Manual Item</h2>
          <p>Item content will go here</p>
        </div>
      </StandardCard>
    </StandardPageLayout>
  );
}
