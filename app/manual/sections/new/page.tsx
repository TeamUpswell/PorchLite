"use client";

export const dynamic = "force-dynamic";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save } from "lucide-react";
import Link from "next/link";
import StandardPageLayout from "@/components/layout/StandardPageLayout";
import StandardCard from "@/components/ui/StandardCard";
import { useAuth } from "@/components/auth";
import { useProperty } from "@/lib/hooks/useProperty";
import { supabase } from "@/lib/supabase";
import { toast } from "react-hot-toast";
import { EditPattern } from "@/components/ui/FloatingActionPresets";

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
    type: "",
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentProperty || !user) {
      toast.error("Missing property or user information");
      return;
    }

    setSaving(true);

    try {
      const { data, error } = await supabase
        .from("manual_sections")
        .insert([
          {
            ...formData,
            property_id: currentProperty.id,
            created_by: user.id,
          },
        ])
        .select()
        .single();

      if (error) throw error;

      toast.success("Section created successfully!");
      router.push("/manual");
    } catch (error) {
      console.error("Error creating section:", error);
      toast.error("Failed to create section");
    } finally {
      setSaving(false);
    }
  };

  return (
    <StandardPageLayout
      title="Create Section"
      breadcrumb={[
        { label: "Manual", href: "/manual" },
        { label: "Create Section" },
      ]}
    >
      <StandardCard>
        <div className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6" id="section-form">
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Section Title
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, title: e.target.value }))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="e.g., Smart TV Operation"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                rows={3}
                placeholder="Brief description of this section..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Icon
              </label>
              <input
                type="text"
                value={formData.icon}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, icon: e.target.value }))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="📖"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Category
              </label>
              <select
                value={formData.category}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, category: e.target.value }))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select a category</option>
                <option value="appliances">Appliances</option>
                <option value="entertainment">Entertainment</option>
                <option value="utilities">Utilities</option>
                <option value="maintenance">Maintenance</option>
                <option value="safety">Safety</option>
                <option value="policies">Policies</option>
              </select>
            </div>
          </form>
        </div>
      </StandardCard>

      <EditPattern
        form="section-form"
        backHref="/manual"
        saveLabel="Create Section"
        backLabel="Back to Manual"
        saving={saving}
        disabled={!formData.title.trim()}
      />
    </StandardPageLayout>
  );
}
