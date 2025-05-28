"use client";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save } from "lucide-react";
import Link from "next/link";
import StandardPageLayout from "@/components/layout/StandardPageLayout";
import StandardCard from "@/components/ui/StandardCard";
import { useAuth } from "@/components/AuthProvider";
import { useProperty } from "@/lib/hooks/useProperty";
import { supabase } from "@/lib/supabase";

export default function NewSectionPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { currentProperty } = useProperty();
  
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    icon: "📖",
    order_index: 1,
    category: "",
    type: ""
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log("Form submitted", formData);
  };

  return (
    <StandardPageLayout title="Create Section">
      <StandardCard>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Section Title
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              placeholder="e.g., Smart TV Operation"
            />
          </div>
          
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg"
          >
            Create Section
          </button>
        </form>
      </StandardCard>
      <div className="p-6">
        <h1>Create New Section</h1>
        <Link href="/manual">Back to Manual</Link>
      </div>
    </StandardPageLayout>
  );
}
