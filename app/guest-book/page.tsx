"use client";

import { useState, useEffect } from "react";
import { useProperty } from "@/lib/hooks/useProperty";
import { supabase } from "@/lib/supabase";
import StandardPageLayout from "@/components/layout/StandardPageLayout";
import StandardCard from "@/components/ui/StandardCard";
import { Heart, Star, Camera, MapPin, Calendar, Plus } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

interface GuestBookEntry {
  id: string;
  guest_name: string;
  visit_date: string;
  rating: number;
  title: string;
  message: string;
  guest_photos: { id: string; photo_url: string; caption: string }[];
  guest_recommendations: { id: string; place_name: string; rating: number }[];
}

export default function GuestBookPage() {
  const { currentProperty } = useProperty();
  const [entries, setEntries] = useState<GuestBookEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (currentProperty?.id) {
      fetchGuestBookEntries();
    }
  }, [currentProperty?.id]);

  const fetchGuestBookEntries = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('guest_book_entries')
        .select(`
          *,
          guest_photos (id, photo_url, caption),
          guest_recommendations (id, place_name, rating)
        `)
        .eq('property_id', currentProperty.id)
        .eq('is_approved', true)
        .eq('is_public', true)
        .order('visit_date', { ascending: false })
        .limit(20);

      if (error) throw error;
      setEntries(data || []);
    } catch (error) {
      console.error('Error fetching guest book entries:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${
          i < rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
        }`}
      />
    ));
  };

  return (
    <StandardPageLayout
      title="Guest Book"
      subtitle="Stories and memories from our guests"
      actions={
        <Link
          href="/guest-book/new"
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center"
        >
          <Plus className="h-4 w-4 mr-2" />
          Share Your Experience
        </Link>
      }
    >
      {/* Guest Book Entries */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
        </div>
      ) : entries.length === 0 ? (
        <StandardCard className="text-center py-12">
          <Heart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No entries yet
          </h3>
          <p className="text-gray-500 mb-6">
            Be the first to share your experience!
          </p>
          <Link
            href="/guest-book/new"
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
          >
            Write First Entry
          </Link>
        </StandardCard>
      ) : (
        <div className="space-y-6">
          {entries.map((entry) => (
            <StandardCard key={entry.id} className="overflow-hidden">
              <div className="p-6">
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {entry.title || `${entry.guest_name}'s Visit`}
                    </h3>
                    <div className="flex items-center space-x-4 text-sm text-gray-500 mt-1">
                      <span className="flex items-center">
                        <Calendar className="h-4 w-4 mr-1" />
                        {new Date(entry.visit_date).toLocaleDateString()}
                      </span>
                      <span>by {entry.guest_name}</span>
                    </div>
                  </div>
                  <div className="flex items-center">
                    {renderStars(entry.rating)}
                  </div>
                </div>

                {/* Message */}
                {entry.message && (
                  <p className="text-gray-700 mb-4 leading-relaxed">
                    {entry.message}
                  </p>
                )}

                {/* Photos */}
                {entry.guest_photos && entry.guest_photos.length > 0 && (
                  <div className="mb-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      {entry.guest_photos.slice(0, 4).map((photo, index) => (
                        <div key={photo.id} className="relative aspect-square rounded-lg overflow-hidden">
                          <Image
                            src={photo.photo_url}
                            alt={photo.caption || `Photo ${index + 1}`}
                            fill
                            className="object-cover hover:scale-105 transition-transform duration-200"
                          />
                          {entry.guest_photos.length > 4 && index === 3 && (
                            <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                              <span className="text-white font-medium">
                                +{entry.guest_photos.length - 4} more
                              </span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Recommendations Preview */}
                {entry.guest_recommendations && entry.guest_recommendations.length > 0 && (
                  <div className="border-t pt-4">
                    <div className="flex items-center text-sm text-gray-600 mb-2">
                      <MapPin className="h-4 w-4 mr-1" />
                      Recommended {entry.guest_recommendations.length} places
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {entry.guest_recommendations.slice(0, 3).map((rec) => (
                        <span
                          key={rec.id}
                          className="bg-blue-50 text-blue-700 px-2 py-1 rounded text-xs"
                        >
                          {rec.place_name}
                          {rec.rating && (
                            <span className="ml-1">★{rec.rating}</span>
                          )}
                        </span>
                      ))}
                      {entry.guest_recommendations.length > 3 && (
                        <span className="text-gray-500 text-xs">
                          +{entry.guest_recommendations.length - 3} more
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </StandardCard>
          ))}
        </div>
      )}
    </StandardPageLayout>
  );
}