"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft, Save } from "lucide-react";
import Link from "next/link";
import StandardPageLayout from "@/components/layout/StandardPageLayout";
import StandardCard from "@/components/ui/StandardCard";
import { useAuth } from "@/components/AuthProvider";
import { supabase } from "@/lib/supabase";

export default function NewItemPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const params = useParams();
  const sectionId = params.id as string;

  useEffect(() => {
    setLoading(false);
  }, []);

  return (
    <StandardPageLayout title="Add New Item">
      <StandardCard>
        <div className="p-6">
          <h1>Add New Item to Section {sectionId}</h1>
          <Link href={`/manual/sections/${sectionId}`}>Back to Section</Link>
        </div>
      </StandardCard>
    </StandardPageLayout>
  );
}
