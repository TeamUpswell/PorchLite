"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { ArrowLeft, Edit, ExternalLink } from "lucide-react";
import Link from "next/link";
import StandardPageLayout from "@/components/layout/StandardPageLayout";
import StandardCard from "@/components/ui/StandardCard";
import { useAuth } from "@/components/AuthProvider";
import { supabase } from "@/lib/supabase";
import Image from "next/image";

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

interface ManualSection {
  id: string;
  title: string;
}

export default function ItemDetailPage() {
  const { user } = useAuth();
  const params = useParams();
  const sectionId = params.id as string;
  const itemId = params.itemId as string;

  const [loading, setLoading] = useState(true);
  const [item, setItem] = useState<ManualItem | null>(null);
  const [section, setSection] = useState<ManualSection | null>(null);

  useEffect(() => {
    if (sectionId && itemId) {
      loadData();
    }
  }, [sectionId, itemId]);

  const loadData = async () => {
    try {
      console.log("Loading item data for:", { sectionId, itemId });

      // Load item
      const { data: itemData, error: itemError } = await supabase
        .from("manual_items")
        .select("*")
        .eq("id", itemId)
        .single();

      if (itemError) {
        console.error("Item error:", itemError);
        throw itemError;
      }

      console.log("Item loaded:", itemData);
      setItem(itemData);

      // Load section
      const { data: sectionData, error: sectionError } = await supabase
        .from("manual_sections")
        .select("id, title")
        .eq("id", sectionId)
        .single();

      if (sectionError) {
        console.error("Section error:", sectionError);
        throw sectionError;
      }

      console.log("Section loaded:", sectionData);
      setSection(sectionData);
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <StandardPageLayout title="Loading...">
        <StandardCard>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2">Loading...</span>
          </div>
        </StandardCard>
      </StandardPageLayout>
    );
  }

  if (!item || !section) {
    return (
      <StandardPageLayout title="Not Found">
        <StandardCard>
          <div className="text-center py-8">
            <p className="text-red-600">Item not found</p>
            <Link href="/manual" className="text-blue-600 hover:underline">
              Back to Manual
            </Link>
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
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Edit className="h-4 w-4 mr-2" />
            Edit Item
          </Link>
        </div>
      }
    >
      <StandardCard>
        <div className="space-y-6">
          {/* Item Header */}
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                {item.title}
                {item.important && (
                  <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                    Important
                  </span>
                )}
              </h1>
              <p className="text-sm text-gray-500">
                Created {new Date(item.created_at).toLocaleDateString()}
                {item.media_urls && item.media_urls.length > 0 && (
                  <span className="ml-4">
                    📸 {item.media_urls.length} photo
                    {item.media_urls.length !== 1 ? "s" : ""}
                  </span>
                )}
              </p>
            </div>
          </div>

          {/* Content */}
          <div className="prose prose-lg max-w-none text-gray-700">
            <div className="whitespace-pre-wrap leading-relaxed bg-gray-50 rounded-lg p-4 border">
              {item.content}
            </div>
          </div>

          {/* Photos */}
          {item.media_urls && item.media_urls.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Photos ({item.media_urls.length})
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {item.media_urls.map((url, index) => (
                  <a
                    key={index}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group relative block"
                  >
                    <div className="relative aspect-video overflow-hidden rounded-lg border border-gray-200 group-hover:border-blue-300 transition-colors">
                      <Image
                        src={url}
                        alt={`${item.title} - Image ${index + 1}`}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-200"
                      />
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-colors flex items-center justify-center">
                        <ExternalLink className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
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
