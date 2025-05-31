"use client";

export const dynamic = 'force-dynamic';

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save } from "lucide-react";
import Link from "next/link";
import StandardPageLayout from "@/components/layout/StandardPageLayout";
import StandardCard from "@/components/ui/StandardCard";
import { useAuth } from "@/components/AuthProvider";
import { useProperty } from "@/lib/hooks/useProperty";
import { supabase } from "@/lib/supabase";
import { toast } from "react-hot-toast";

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
          }
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
        { label: "Create Section" }
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
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
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
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
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
                onChange={(e) => setFormData(prev => ({ ...prev, icon: e.target.value }))}
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
                onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
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

      {/* NEW: Floating Action Button - Mobile/Desktop Optimized */}
      <div className="fixed bottom-6 right-6 z-40 flex flex-col space-y-3">
        {/* Save Button */}
        <button
          type="submit"
          form="section-form" // We'll need to add this id to the form
          disabled={saving || !formData.title.trim()}
          className="group flex items-center justify-center bg-green-600 hover:bg-green-700 active:bg-green-800 text-white shadow-lg transition-all duration-300 hover:shadow-xl focus:outline-none focus:ring-4 focus:ring-green-500 focus:ring-opacity-50 disabled:opacity-50 disabled:cursor-not-allowed
          
          /* Mobile: circular button */
          w-14 h-14 rounded-full
          
          /* Desktop: expandable button with rounded corners */
          sm:w-auto sm:h-auto sm:px-4 sm:py-3 sm:rounded-lg sm:hover:scale-105"
          aria-label="Save section"
        >
          <Save className="h-6 w-6 transition-transform group-hover:rotate-12 duration-200 sm:mr-0 group-hover:sm:mr-2" />

          {/* Text appears on desktop hover only */}
          <span className="hidden sm:inline-block sm:w-0 sm:overflow-hidden sm:whitespace-nowrap sm:transition-all sm:duration-300 group-hover:sm:w-auto group-hover:sm:ml-2">
            {saving ? "Creating..." : "Create Section"}
          </span>
        </button>

        {/* Back Button */}
        <Link
          href="/manual"
          className="group flex items-center justify-center bg-gray-600 hover:bg-gray-700 active:bg-gray-800 text-white shadow-lg transition-all duration-300 hover:shadow-xl focus:outline-none focus:ring-4 focus:ring-gray-500 focus:ring-opacity-50
          
          /* Mobile: circular button */
          w-14 h-14 rounded-full
          
          /* Desktop: expandable button with rounded corners */
          sm:w-auto sm:h-auto sm:px-4 sm:py-3 sm:rounded-lg sm:hover:scale-105"
          aria-label="Back to manual"
        >
          <ArrowLeft className="h-6 w-6 transition-transform group-hover:-translate-x-1 duration-200 sm:mr-0 group-hover:sm:mr-2" />

          {/* Text appears on desktop hover only */}
          <span className="hidden sm:inline-block sm:w-0 sm:overflow-hidden sm:whitespace-nowrap sm:transition-all sm:duration-300 group-hover:sm:w-auto group-hover:sm:ml-2">
            Back to Manual
          </span>
        </Link>
      </div>
    </StandardPageLayout>
  );
}
