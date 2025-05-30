"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { ArrowLeft, Edit, Trash2, ExternalLink } from "lucide-react";
import Link from "next/link";
import StandardPageLayout from "@/components/layout/StandardPageLayout";
import StandardCard from "@/components/ui/StandardCard";
import { useAuth } from "@/components/AuthProvider";
import { supabase } from "@/lib/supabase";

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
}

export default function ItemPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [item, setItem] = useState<ManualItem | null>(null);
  const [section, setSection] = useState<ManualSection | null>(null);
  const params = useParams();

  const sectionId = params.id as string;
  const itemId = params.itemId as string;

  // Add these debug logs right here:
  console.log("🚀 Component rendered with:", {
    sectionId,
    itemId,
    user: user?.id,
    loading,
    hasItem: !!item,
    hasSection: !!section,
  });

  useEffect(() => {
    console.log("🔥 useEffect triggered with:", { sectionId, itemId }); // This should show up immediately

    async function fetchData() {
      console.log("🔍 Fetching data for:", { sectionId, itemId }); // Debug log

      try {
        // Fetch section
        console.log("🔍 Fetching section..."); // Debug log
        const { data: sectionData, error: sectionError } = await supabase
          .from("manual_sections")
          .select("*")
          .eq("id", sectionId)
          .single();

        if (sectionError) {
          console.error("❌ Section error:", sectionError); // Debug log
          throw sectionError;
        }

        console.log("✅ Section loaded:", sectionData); // Debug log
        setSection(sectionData);

        // Fetch item
        console.log("🔍 Fetching item..."); // Debug log
        const { data: itemData, error: itemError } = await supabase
          .from("manual_items")
          .select("*")
          .eq("id", itemId)
          .single();

        if (itemError) {
          console.error("❌ Item error:", itemError); // Debug log
          throw itemError;
        }

        console.log("✅ Item loaded:", itemData); // Debug log
        setItem(itemData);
      } catch (error) {
        console.error("❌ Error fetching data:", error);
      } finally {
        console.log("🏁 Setting loading to false"); // Debug log
        setLoading(false);
      }
    }

    if (sectionId && itemId) {
      console.log("✅ Parameters exist, calling fetchData");
      fetchData();
    } else {
      console.log("❌ Missing parameters:", { sectionId, itemId }); // Debug log
      setLoading(false);
    }
  }, [sectionId, itemId]);

  // Add this debug log before the loading check:
  console.log("🎯 Current state:", { loading, item, section, user });

  if (loading) {
    console.log("🔄 Showing loading state");
    return (
      <StandardPageLayout title="Loading...">
        <StandardCard>
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2">Loading item...</span>
          </div>
        </StandardCard>
      </StandardPageLayout>
    );
  }

  if (!section || !item) {
    return (
      <StandardPageLayout title="Item Not Found">
        <StandardCard>
          <div className="text-center py-8">
            <p className="text-gray-500">Item not found</p>
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

  if (!user) {
    return (
      <StandardPageLayout title="Access Denied">
        <StandardCard>
          <div className="text-center py-8">
            <p className="text-gray-500">Please log in to view this item.</p>
          </div>
        </StandardCard>
      </StandardPageLayout>
    );
  }

  return (
    <StandardPageLayout
      title={item.title}
      breadcrumb={[
        { label: "Manual", href: "/manual" },
        { label: section.title, href: `/manual/sections/${sectionId}` },
        { label: item.title },
      ]}
      action={
        <div className="flex items-center space-x-3">
          <Link
            href={`/manual/sections/${sectionId}`}
            className="flex items-center px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Section
          </Link>
          <Link
            href={`/manual/sections/${sectionId}/items/${itemId}/edit`}
            className="flex items-center px-3 py-2 text-blue-600 hover:text-blue-800"
          >
            <Edit className="h-4 w-4 mr-1" />
            Edit
          </Link>
        </div>
      }
    >
      <StandardCard>
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              {item.title}
            </h1>
            <div
              className="prose prose-lg max-w-none text-gray-700"
              dangerouslySetInnerHTML={{ __html: item.content }}
            />
          </div>

          {/* Photo Gallery */}
          {item.media_urls && item.media_urls.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Photos ({item.media_urls.length})
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {item.media_urls.map((url, index) => (
                  <a
                    key={index}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group relative block"
                  >
                    <img
                      src={url}
                      alt={`${item.title} - Image ${index + 1}`}
                      className="w-full h-32 object-cover rounded-lg border border-gray-200 group-hover:border-blue-300 transition-colors"
                    />
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 rounded-lg transition-opacity flex items-center justify-center">
                      <ExternalLink className="h-5 w-5 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      </StandardCard>
    </StandardPageLayout>
  );
}
