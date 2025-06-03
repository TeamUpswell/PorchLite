"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Plus, Edit, ArrowLeft } from "lucide-react";
import Link from "next/link";
import StandardPageLayout from "@/components/layout/StandardPageLayout";
import StandardCard from "@/components/ui/StandardCard";
import { useAuth } from "@/components/auth";
import { supabase } from "@/lib/supabase";
import { MultiActionPattern } from "@/components/ui/FloatingActionPresets";

interface ManualSection {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: string;
  property_id: string;
  created_at: string;
}

interface ManualItem {
  id: string;
  title: string;
  content: string;
  media_urls?: string[];
  section_id: string;
  created_at: string;
  important?: boolean;
  order_index?: number;
}

export default function SectionPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [section, setSection] = useState<ManualSection | null>(null);
  const [items, setItems] = useState<ManualItem[]>([]);
  const params = useParams();

  const sectionId = params.id as string;

  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch section
        const { data: sectionData, error: sectionError } = await supabase
          .from("manual_sections")
          .select("*")
          .eq("id", sectionId)
          .single();

        if (sectionError) throw sectionError;
        setSection(sectionData);

        // Fetch items
        const { data: itemsData, error: itemsError } = await supabase
          .from("manual_items")
          .select("*")
          .eq("section_id", sectionId)
          .order("order_index");

        if (itemsError) throw itemsError;
        setItems(itemsData || []);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    }

    if (sectionId && user) {
      fetchData();
    }
  }, [sectionId, user]);

  if (loading) {
    return (
      <StandardPageLayout title="Loading...">
        <StandardCard>
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2">Loading section...</span>
          </div>
        </StandardCard>
      </StandardPageLayout>
    );
  }

  if (!section) {
    return (
      <StandardPageLayout title="Section Not Found">
        <StandardCard>
          <div className="text-center py-8">
            <p className="text-gray-500">Section not found</p>
            <Link
              href="/manual"
              className="text-blue-600 hover:text-blue-800 mt-2 inline-block"
            >
              Back to Manual
            </Link>
          </div>
        </StandardCard>
      </StandardPageLayout>
    );
  }

  return (
    <StandardPageLayout
      title={section.title}
      breadcrumb={[
        { label: "Manual", href: "/manual" },
        { label: section.title },
      ]}
    >
      <StandardCard>
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              {section.title}
            </h1>
            <p className="text-gray-600">{section.description}</p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Items ({items.length})
            </h2>

            {items.length === 0 ? (
              <div className="text-center py-8 bg-gray-50 rounded-lg">
                <p className="text-gray-500 mb-4">
                  No items in this section yet
                </p>
                <Link
                  href={`/manual/sections/${sectionId}/items/new`}
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add First Item
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {items.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors"
                  >
                    <div className="flex-1">
                      <Link
                        href={`/manual/sections/${sectionId}/items/${item.id}`}
                        className="block"
                      >
                        <h3 className="font-medium text-gray-900 hover:text-blue-600">
                          {item.title}
                          {item.important && (
                            <span className="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                              Important
                            </span>
                          )}
                        </h3>
                        <p className="text-sm text-gray-500 mt-1">
                          {item.content.length > 100
                            ? `${item.content.substring(0, 100)}...`
                            : item.content}
                        </p>
                      </Link>
                    </div>
                    <div className="flex items-center space-x-2 ml-4">
                      <Link
                        href={`/manual/sections/${sectionId}/items/${item.id}/edit`}
                        className="flex items-center px-3 py-2 text-blue-600 hover:text-blue-800"
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Edit
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </StandardCard>

      {/* Multi-button floating action menu */}
      <MultiActionPattern
        actions={[
          {
            icon: Plus,
            label: "Add Item",
            href: `/manual/sections/${sectionId}/items/new`,
            variant: "primary",
          },
          {
            icon: Edit,
            label: "Edit Section",
            href: `/manual/sections/${sectionId}/edit`,
            variant: "warning",
          },
          {
            icon: ArrowLeft,
            label: "Back to Manual",
            href: "/manual",
            variant: "gray",
          },
        ]}
      />
    </StandardPageLayout>
  );
}
