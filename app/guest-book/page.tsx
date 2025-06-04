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
      {/* Always show this inspiring message */}
      <StandardCard className="mb-8 bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200">
        <div className="p-6 text-center">
          <div className="flex justify-center mb-4">
            <Heart className="h-8 w-8 text-rose-500 mr-2" />
            <span className="text-2xl">🏡</span>
            <Heart className="h-8 w-8 text-rose-500 ml-2" />
          </div>
          <h3 className="text-xl font-semibold text-gray-800 mb-2">
            Help Us Preserve the Magic of This Place
          </h3>
          <p className="text-gray-600 leading-relaxed max-w-3xl mx-auto">
            Every stay creates unique memories that become part of this home's story. The owners treasure 
            hearing about the special moments, adventures, and connections that happen here. Your memories 
            inspire them and help future guests discover the magic that awaits them.
          </p>
        </div>
      </StandardCard>

      {/* Guest Book Entries */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
        </div>
      ) : entries.length === 0 ? (
        <div className="text-center py-16">
          {/* Animated illustration area */}
          <div className="relative mb-8">
            <div className="flex justify-center items-center space-x-4 mb-6">
              <div className="animate-bounce delay-0">
                <Heart className="h-12 w-12 text-pink-400" />
              </div>
              <div className="animate-bounce delay-150">
                <Camera className="h-12 w-12 text-blue-400" />
              </div>
              <div className="animate-bounce delay-300">
                <Star className="h-12 w-12 text-yellow-400 fill-current" />
              </div>
            </div>
            
            {/* Floating elements */}
            <div className="absolute top-0 left-1/4 animate-float">
              <MapPin className="h-6 w-6 text-green-400 opacity-70" />
            </div>
            <div className="absolute top-8 right-1/4 animate-float-delayed">
              <Calendar className="h-6 w-6 text-purple-400 opacity-70" />
            </div>
          </div>

          <StandardCard className="max-w-2xl mx-auto bg-gradient-to-br from-rose-50 to-amber-50 border-none shadow-lg">
            <div className="p-8">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                🌟 Be the First to Share Your Story 🌟
              </h3>
              <p className="text-lg text-gray-600 mb-6 leading-relaxed">
                This beautiful space is waiting for its first memory to be shared! The owners would love to hear 
                about the moments that made your stay special. Was it the morning coffee ritual? A sunset view? 
                A cozy evening? Your story becomes part of this home's cherished legacy.
              </p>
              
              {/* Features preview */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                <div className="text-center p-4 bg-white/60 rounded-lg backdrop-blur-sm">
                  <Camera className="h-8 w-8 text-blue-500 mx-auto mb-2" />
                  <p className="text-sm font-medium text-gray-700">Capture Moments</p>
                  <p className="text-xs text-gray-500">Share your favorite memories</p>
                </div>
                <div className="text-center p-4 bg-white/60 rounded-lg backdrop-blur-sm">
                  <MapPin className="h-8 w-8 text-green-500 mx-auto mb-2" />
                  <p className="text-sm font-medium text-gray-700">Local Gems</p>
                  <p className="text-xs text-gray-500">Guide future adventurers</p>
                </div>
                <div className="text-center p-4 bg-white/60 rounded-lg backdrop-blur-sm">
                  <Heart className="h-8 w-8 text-rose-500 mx-auto mb-2" />
                  <p className="text-sm font-medium text-gray-700">Heartfelt Thanks</p>
                  <p className="text-xs text-gray-500">Show appreciation to owners</p>
                </div>
              </div>

              {/* Call to action */}
              <div className="space-y-4">
                <Link
                  href="/guest-book/new"
                  className="inline-flex items-center bg-gradient-to-r from-rose-600 to-amber-600 text-white px-8 py-4 rounded-xl hover:from-rose-700 hover:to-amber-700 transform hover:scale-105 transition-all duration-200 shadow-lg font-semibold text-lg"
                >
                  <Plus className="h-5 w-5 mr-3" />
                  Start This Home's Memory Collection
                </Link>
                
                <div className="flex items-center justify-center space-x-6 text-sm text-gray-500 mt-6">
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-green-400 rounded-full mr-2"></div>
                    Quick & meaningful
                  </div>
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-blue-400 rounded-full mr-2"></div>
                    Photos welcome
                  </div>
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-rose-400 rounded-full mr-2"></div>
                    Owners will treasure it
                  </div>
                </div>
              </div>

              {/* Inspiring quote */}
              <div className="mt-8 p-4 bg-white/40 rounded-lg border-l-4 border-rose-400">
                <p className="text-gray-600 italic text-center">
                  "A house becomes a home through the memories made within its walls. Help us celebrate yours."
                </p>
              </div>
            </div>
          </StandardCard>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Add memories prompt even when there are entries */}
          <StandardCard className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
            <div className="p-4 text-center">
              <p className="text-gray-700 mb-3">
                <strong>📖 Add your chapter to this home's story!</strong> The owners love reading about 
                the memories you've made here.
              </p>
              <Link
                href="/guest-book/new"
                className="inline-flex items-center bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm font-medium"
              >
                <Heart className="h-4 w-4 mr-2" />
                Share Your Memory
              </Link>
            </div>
          </StandardCard>

          {entries.map((entry) => (
            <StandardCard key={entry.id} className="overflow-hidden">
              <div className="p-6">
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {entry.title || `${entry.guest_name}'s Memory`}
                    </h3>
                    <div className="flex items-center space-x-4 text-sm text-gray-500 mt-1">
                      <span className="flex items-center">
                        <Calendar className="h-4 w-4 mr-1" />
                        {new Date(entry.visit_date).toLocaleDateString()}
                      </span>
                      <span>shared by {entry.guest_name}</span>
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
                            alt={photo.caption || `Memory ${index + 1}`}
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
                      Discovered {entry.guest_recommendations.length} local gems
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
                          +{entry.guest_recommendations.length - 3} more discoveries
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
