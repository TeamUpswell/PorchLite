"use client";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  Edit,
  Plus,
  Trash2,
  AlertTriangle,
  ExternalLink,
} from "lucide-react";
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
}

interface ManualItem {
  id: string;
  title: string;
  content: string;
  order_index: number;
  important: boolean;
  media_urls: string[];
  created_at: string;
}

export default function ViewSectionPage() {
  const params = useParams();
  const { user } = useAuth();
  
  const [section, setSection] = useState<ManualSection | null>(null);
  const [items, setItems] = useState<ManualItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const sectionId = params.id as string;

  useEffect(() => {
    if (sectionId) {
      loadSectionAndItems();
    }
  }, [sectionId]);

  const loadSectionAndItems = async () => {
    try {
      setLoading(true);

      // Load section
      const { data: sectionData, error: sectionError } = await supabase
        .from('manual_sections')
        .select('*')
        .eq('id', sectionId)
        .single();

      if (sectionError) throw sectionError;
      setSection(sectionData);

      // Load items
      const { data: itemsData, error: itemsError } = await supabase
        .from('manual_items')
        .select('*')
        .eq('section_id', sectionId)
        .order('order_index');

      if (itemsError) throw itemsError;
      setItems(itemsData || []);

    } catch (err: any) {
      console.error('Error loading section:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const deleteItem = async (itemId: string) => {
    if (!confirm('Are you sure you want to delete this item?')) return;

    try {
      const { error } = await supabase
        .from('manual_items')
        .delete()
        .eq('id', itemId);

      if (error) throw error;
      
      loadSectionAndItems();
    } catch (error: any) {
      alert(`Error deleting item: ${error.message}`);
    }
  };

  if (loading) {
    return (
      <StandardPageLayout title="Loading...">
        <StandardCard>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2">Loading section...</span>
          </div>
        </StandardCard>
      </StandardPageLayout>
    );
  }

  if (error || !section) {
    return (
      <StandardPageLayout title="Error">
        <StandardCard>
          <div className="text-center py-8">
            <p className="text-red-600">Error: {error || 'Section not found'}</p>
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
      title={`${section.icon} ${section.title}`}
      breadcrumb={[
        { label: "Manual", href: "/manual" },
        { label: section.title }
      ]}
      action={
        <div className="flex space-x-2">
          <Link
            href={`/manual/sections/${section.id}/edit`}
            className="inline-flex items-center px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
          >
            <Edit className="h-4 w-4 mr-2" />
            Edit Section
          </Link>
          <Link
            href={`/manual/sections/${section.id}/items/new`}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Item
          </Link>
        </div>
      }
    >
      <div className="mb-6">
        <Link
          href="/manual"
          className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Manual
        </Link>
      </div>

      {section.description && (
        <StandardCard>
          <p className="text-gray-700">{section.description}</p>
          {section.category && (
            <div className="mt-3 inline-block px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full">
              {section.category}
            </div>
          )}
        </StandardCard>
      )}

      {items.length === 0 ? (
        <StandardCard>
          <div className="text-center py-12">
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Items Yet</h3>
            <p className="text-gray-500 mb-6">Add your first item to this section.</p>
            <Link
              href={`/manual/sections/${section.id}/items/new`}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add First Item
            </Link>
          </div>
        </StandardCard>
      ) : (
        <div className="space-y-6">
          {items.map((item) => (
            <StandardCard key={item.id} className={item.important ? "border-l-4 border-orange-400" : ""}>
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-start">
                  {item.important && (
                    <AlertTriangle className="h-5 w-5 text-orange-500 mr-2 mt-0.5 flex-shrink-0" />
                  )}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">{item.title}</h3>
                    {item.important && (
                      <span className="inline-block px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded-full mb-2">
                        Important
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex space-x-1">
                  <Link
                    href={`/manual/sections/${section.id}/items/${item.id}/edit`}
                    className="p-1 text-gray-400 hover:text-blue-600"
                  >
                    <Edit className="h-4 w-4" />
                  </Link>
                  <button
                    onClick={() => deleteItem(item.id)}
                    className="p-1 text-gray-400 hover:text-red-600"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div 
                className="prose prose-sm max-w-none text-gray-700 mb-4"
                dangerouslySetInnerHTML={{ __html: item.content }}
              />

              {/* Photo Gallery */}
              {item.media_urls && item.media_urls.length > 0 && (
                <div className="mt-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-3">
                    Photos ({item.media_urls.length})
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
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
                          className="w-full h-24 object-cover rounded-lg border border-gray-200 group-hover:border-blue-300 transition-colors"
                        />
                        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 rounded-lg transition-opacity flex items-center justify-center">
                          <ExternalLink className="h-4 w-4 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </StandardCard>
          ))}
        </div>
      )}
    </StandardPageLayout>
  );
}
