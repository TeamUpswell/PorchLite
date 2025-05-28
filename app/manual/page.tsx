"use client";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { useState, useEffect } from "react";
import { BookOpen, Plus, Edit, Trash2, Eye, AlertTriangle } from "lucide-react";
import Link from "next/link";
import StandardPageLayout from "@/components/layout/StandardPageLayout";
import StandardCard from "@/components/ui/StandardCard";
import { useAuth } from "@/components/AuthProvider";
import { useProperty } from "@/lib/hooks/useProperty";
import { supabase } from "@/lib/supabase";

interface ManualSection {
  id: string;
  title: string;
  description: string;
  icon: string;
  order_index: number;
  category: string;
  property_id: string;
  created_at: string;
  manual_items?: ManualItem[];
}

interface ManualItem {
  id: string;
  title: string;
  important: boolean;
}

export default function ManualPage() {
  const { user } = useAuth();
  const { currentProperty } = useProperty();
  const [sections, setSections] = useState<ManualSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (currentProperty?.id) {
      loadSections();
    } else {
      setLoading(false);
    }
  }, [currentProperty]);

  const loadSections = async () => {
    if (!currentProperty?.id) return;

    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('manual_sections')
        .select(`
          *,
          manual_items (
            id,
            title,
            important
          )
        `)
        .eq('property_id', currentProperty.id)
        .order('order_index');

      if (error) throw error;

      setSections(data || []);
      setError(null);
    } catch (err: any) {
      console.error('Failed to load sections:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const deleteSection = async (sectionId: string) => {
    if (!confirm('Delete this section and all its items?')) return;

    try {
      await supabase.from('manual_items').delete().eq('section_id', sectionId);
      await supabase.from('manual_sections').delete().eq('id', sectionId);
      loadSections();
    } catch (error: any) {
      alert(`Error: ${error.message}`);
    }
  };

  if (loading) {
    return (
      <StandardPageLayout 
        title="Property Manual"
        headerIcon={<BookOpen className="h-6 w-6 text-blue-600" />}
      >
        <StandardCard>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2">Loading manual...</span>
          </div>
        </StandardCard>
      </StandardPageLayout>
    );
  }

  if (!currentProperty) {
    return (
      <StandardPageLayout 
        title="Property Manual"
        headerIcon={<BookOpen className="h-6 w-6 text-blue-600" />}
      >
        <StandardCard>
          <div className="text-center py-8">
            <BookOpen className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Property Selected</h3>
            <p className="text-gray-500">Please select a property to view its manual.</p>
          </div>
        </StandardCard>
      </StandardPageLayout>
    );
  }

  return (
    <StandardPageLayout
      title={`${currentProperty.name} - Manual`}
      headerIcon={<BookOpen className="h-6 w-6 text-blue-600" />}
      action={
        <Link 
          href="/manual/sections/new"
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Section
        </Link>
      }
    >
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-700">Error: {error}</p>
        </div>
      )}

      {sections.length === 0 ? (
        <StandardCard>
          <div className="text-center py-12">
            <BookOpen className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-gray-900 mb-2">No Manual Sections</h3>
            <p className="text-gray-500 mb-6">
              Create sections to organize your property manual content.
            </p>
            <Link 
              href="/manual/sections/new"
              className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Plus className="h-5 w-5 mr-2" />
              Create First Section
            </Link>
          </div>
        </StandardCard>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {sections.map((section) => (
            <StandardCard key={section.id}>
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center">
                  <span className="text-2xl mr-3">{section.icon}</span>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{section.title}</h3>
                    {section.category && (
                      <span className="text-sm text-gray-500">{section.category}</span>
                    )}
                  </div>
                </div>
                <div className="flex space-x-1">
                  <Link
                    href={`/manual/sections/${section.id}`}
                    className="p-1 text-gray-400 hover:text-blue-600"
                  >
                    <Eye className="h-4 w-4" />
                  </Link>
                  <Link
                    href={`/manual/sections/${section.id}/edit`}
                    className="p-1 text-gray-400 hover:text-blue-600"
                  >
                    <Edit className="h-4 w-4" />
                  </Link>
                  <button
                    onClick={() => deleteSection(section.id)}
                    className="p-1 text-gray-400 hover:text-red-600"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {section.description && (
                <p className="text-gray-600 text-sm mb-3 line-clamp-2">{section.description}</p>
              )}

              <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                <span>{section.manual_items?.length || 0} items</span>
                {section.manual_items?.some(item => item.important) && (
                  <div className="flex items-center text-orange-600">
                    <AlertTriangle className="h-3 w-3 mr-1" />
                    <span className="text-xs">Important</span>
                  </div>
                )}
              </div>

              <div className="flex space-x-2 mt-4">
                <Link
                  href={`/manual/sections/${section.id}`}
                  className="flex-1 px-3 py-2 bg-gray-100 text-gray-700 text-center rounded hover:bg-gray-200 text-sm"
                >
                  View Section
                </Link>
                <Link
                  href={`/manual/sections/${section.id}/items/new`}
                  className="px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
                >
                  Add Item
                </Link>
              </div>
            </StandardCard>
          ))}
        </div>
      )}
    </StandardPageLayout>
  );
}