"use client";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save, Plus, X } from "lucide-react";
import Link from "next/link";
import StandardPageLayout from "@/components/layout/StandardPageLayout";
import StandardCard from "@/components/ui/StandardCard";
import { useAuth } from "@/components/AuthProvider";
import { supabase } from "@/lib/supabase";

export default function NewItemPage({ params }) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(false);
  }, []);

  return (
    <StandardPageLayout title="New Item">
      <StandardCard>
        <div className="p-6">
          <h2 className="text-xl font-semibold">Create New Item</h2>
          <p>Item creation form will go here</p>
        </div>
      </StandardCard>
    </StandardPageLayout>
  );
}
