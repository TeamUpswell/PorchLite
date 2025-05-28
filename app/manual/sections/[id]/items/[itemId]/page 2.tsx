"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Edit, Trash2, ExternalLink } from "lucide-react";
import Link from "next/link";
import StandardPageLayout from "@/components/layout/StandardPageLayout";
import StandardCard from "@/components/ui/StandardCard";
import { useAuth } from "@/components/AuthProvider";
import { supabase } from "@/lib/supabase";

export default function ViewItemPage({ params }) {
  const router = useRouter();
  const { user } = useAuth();
  const [section, setSection] = useState(null);
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        console.log("Fetching data:", { sectionId: params.id, itemId: params.itemId });
        
        // Fetch section
        const { data: sectionData, error: sectionError } = await supabase
          .from("manual_sections")
          .select("*")
          .eq("id", params.id)
          .single();
          
        if (sectionError) {
          console.error("Section error:", sectionError);
          throw sectionError;
        }
        setSection(sectionData);
        
        // Fetch item
        const { data: itemData, error: itemError } = await supabase
          .from("manual_items")
          .select("*")
          .eq("id", params.itemId)
          .single();
          
        if (itemError) {
          console.error("Item error:", itemError);
          throw itemError;
        }
        setItem(itemData);
        
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    }
    
    if (params.id && params.itemId) {
      fetchData();
    }
  }, [params.id, params.itemId]);

  if (loading) {
    return (
      <StandardPageLayout title="Loading...">
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </StandardPageLayout>
    );
  }

  if (!section || !item) {
    return (
      <StandardPageLayout title="Item Not Found">
        <StandardCard>
          <div className="text-center py-8">
            <p className="text-gray-500">Item not found</p>
            <Link href="/manual" className="text-blue-600 hover:text-blue-800 mt-2 inline-block">
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
      subtitle={`From "${section.title}"`}
      headerActions={
        <div className="flex items-center space-x-3">
          <Link
            href={`/manual/sections/${params.id}`}
            className="flex items-center px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Section
          </Link>
          <Link
            href={`/manual/sections/${params.id}/items/${params.itemId}/edit`}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Edit className="h-4 w-4 mr-2" />
            Edit Item
          </Link>
        </div>
      }
    >
      <StandardCard>
        <div className="space-y-6">
          {item.important && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-center">
                <div className="text-yellow-600 text-sm font-medium">Important</div>
              </div>
            </div>
          )}

          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-3">Instructions</h3>
            <div className="prose prose-sm max-w-none">
              <pre className="whitespace-pre-wrap font-sans text-gray-700 leading-relaxed">
                {item.content}
              </pre>
            </div>
          </div>

          {item.media_urls && item.media_urls.length > 0 && (
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-3">Media & Resources</h3>
              <div className="space-y-2">
                {item.media_urls.map((url, index) => (
                  <a
                    key={index}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center px-3 py-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <ExternalLink className="h-4 w-4 mr-2 text-gray-500" />
                    <span className="text-sm text-blue-600 hover:text-blue-800">
                      {url}
                    </span>
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