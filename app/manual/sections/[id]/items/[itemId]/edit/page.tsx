"use client";

export const dynamic = "force-dynamic";
export const revalidate = 0;

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft, Save } from "lucide-react";
import Link from "next/link";
import StandardPageLayout from "@/components/layout/StandardPageLayout";
import StandardCard from "@/components/ui/StandardCard";
import { useAuth } from "@/components/AuthProvider";
import { supabase } from "@/lib/supabase";

export default function EditItemPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const params = useParams();
  const sectionId = params.id as string;
  const itemId = params.itemId as string;

  useEffect(() => {
    setLoading(false);
  }, []);

  return (
    <StandardPageLayout title="Edit Item">
      <StandardCard>
        <div className="p-6">
          <h1>Edit Item {itemId}</h1>
          <p>Section: {sectionId}</p>
          <Link href={`/manual/sections/${sectionId}/items/${itemId}`}>
            Back to Item
          </Link>
        </div>
      </StandardCard>
    </StandardPageLayout>
  );
}
