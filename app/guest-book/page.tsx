"use client";

import { useState, useEffect } from "react";
import { useProperty } from "@/lib/hooks/useProperty";
import { supabase } from "@/lib/supabase";
import StandardCard from "@/components/ui/StandardCard";
import { Heart, Star, Camera, MapPin, Calendar, Plus } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import ProtectedPageWrapper from "@/components/layout/ProtectedPageWrapper";
import PageContainer from "@/components/layout/PageContainer";
import Header from "@/components/layout/Header"; // ✅ Add Header import

interface GuestBookEntry {
  id: string;
  guest_name: string;
  visit_date: string;
  rating: number;
  title: string;
  message: string;
  is_public: boolean;
  is_approved: boolean;
  everything_was_great: boolean;
  everything_well_stocked: boolean;
  created_at: string;
  photos?: string[]; // Add photos array if stored in the entry
  photo_captions?: string[]; // Add captions if stored
  guest_book_photos?: {
    // Add if photos are in separate table
    id: string;
    photo_url: string;
    caption: string;
    order_index: number;
  }[];
}

export default function GuestBookPage() {
  const { currentProperty } = useProperty();
  const [entries, setEntries] = useState<GuestBookEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [showTopCard, setShowTopCard] = useState(true);

  useEffect(() => {
    if (currentProperty?.id) {
      fetchGuestBookEntries();
      debugAllEntries();
    }
  }, [currentProperty?.id]);

  // Timer to hide top card
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowTopCard(false);
    }, 20000);

    return () => clearTimeout(timer);
  }, []);

  const fetchGuestBookEntries = async () => {
    try {
      setLoading(true);
      console.log(
        "🔍 Fetching guest book entries for property:",
        currentProperty?.id
      );

      if (!currentProperty?.id) {
        console.warn("❌ No property ID available");
        setEntries([]);
        return;
      }

      // ✅ Try with photos first
      let { data, error } = await supabase
        .from("guest_book_entries")
        .select(
          `
          *,
          guest_book_photos (
            id,
            photo_url,
            caption,
            order_index
          )
        `
        )
        .eq("property_id", currentProperty.id)
        .eq("is_approved", true)
        .eq("is_public", true)
        .order("visit_date", { ascending: false })
        .limit(20);

      // ✅ If photos query fails, try without photos
      if (error && error.message.includes("guest_book_photos")) {
        console.log("📸 Photos table not found, trying without photos...");

        const { data: fallbackData, error: fallbackError } = await supabase
          .from("guest_book_entries")
          .select("*")
          .eq("property_id", currentProperty.id)
          .eq("is_approved", true)
          .eq("is_public", true)
          .order("visit_date", { ascending: false })
          .limit(20);

        if (fallbackError) {
          throw fallbackError;
        }

        data = fallbackData;
        error = null;
      }

      if (error) {
        throw error;
      }

      console.log("✅ Found guest book entries:", data?.length || 0);

      setEntries(data || []);
    } catch (error) {
      console.error("❌ Error fetching guest book entries:", error);
      // ✅ Still set empty array so page renders
      setEntries([]);
    } finally {
      setLoading(false);
    }
  };

  const debugAllEntries = async () => {
    try {
      console.log("🔍 Debug: Current property:", {
        id: currentProperty?.id,
        name: currentProperty?.name,
      });

      if (!currentProperty?.id) {
        console.warn("❌ No property ID for debugging");
        return;
      }

      // ✅ Check all entries regardless of filters
      const { data: allData, error: allError } = await supabase
        .from("guest_book_entries")
        .select("*")
        .eq("property_id", currentProperty.id)
        .order("created_at", { ascending: false });

      console.log("📊 ALL entries for this property:", allData?.length || 0);
      console.log("🗃️ Raw data:", allData);

      if (allError) {
        console.error("❌ Debug query error:", allError);
        return;
      }

      // ✅ Check filters
      const approvedEntries =
        allData?.filter((entry) => entry.is_approved) || [];
      const publicEntries = allData?.filter((entry) => entry.is_public) || [];
      const visibleEntries =
        allData?.filter((entry) => entry.is_approved && entry.is_public) || [];

      console.log("📋 Filter analysis:", {
        total: allData?.length || 0,
        approved: approvedEntries.length,
        public: publicEntries.length,
        visible: visibleEntries.length,
      });

      // ✅ Log each entry's status
      allData?.forEach((entry, index) => {
        console.log(`Entry ${index + 1}:`, {
          id: entry.id,
          guest_name: entry.guest_name,
          title: entry.title,
          is_approved: entry.is_approved,
          is_public: entry.is_public,
          will_show: entry.is_approved && entry.is_public,
          visit_date: entry.visit_date,
          created_at: entry.created_at,
        });
      });
    } catch (error) {
      console.error("❌ Debug query failed:", error);
    }
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${
          i < rating ? "text-yellow-400 fill-current" : "text-gray-300"
        }`}
      />
    ));
  };

  // ✅ Show loading if property is still loading
  if (!currentProperty) {
    return (
      <ProtectedPageWrapper>
        <Header title="Guest Book" /> {/* ✅ Add Header to loading state */}
        <PageContainer>
          <div className="flex items-center justify-center min-h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">Loading property...</p>
            </div>
          </div>
        </PageContainer>
      </ProtectedPageWrapper>
    );
  }

  return (
    <ProtectedPageWrapper>
      <div className="p-6">
        <Header title="Guest Book" />
        <PageContainer className="space-y-6">
          {/* Top card with fade and collapse - this animation is enough */}
          <div
            className={`transition-all duration-1000 ease-out ${
              showTopCard
                ? "opacity-100 max-h-96 mb-8"
                : "opacity-0 max-h-0 mb-0 overflow-hidden"
            }`}
          >
            <StandardCard className="bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200">
              <div className="p-6 text-center">
                <div className="flex justify-center mb-4">
                  <Heart className="h-8 w-8 text-rose-500 mr-2" />
                  <span className="text-2xl">🏡</span>
                  <Heart className="h-8 w-8 text-rose-500 ml-2" />
                </div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">
                  Help Us Record the Magic of This Place
                </h3>
                <p className="text-gray-600 leading-relaxed max-w-3xl mx-auto">
                  Every visit adds a unique chapter to our home's story. We'd
                  love to hear about the special moments, adventures, and
                  connections you've experienced here. Your stories inspire us
                  and become part of the legacy of this place.
                </p>

                {/* Progress bar showing time remaining */}
                <div className="mt-4 w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-rose-400 to-amber-400 h-2 rounded-full transition-all duration-200 animate-pulse"
                    style={{
                      animation: `shrink 20s linear forwards`,
                    }}
                  ></div>
                </div>

                <button
                  onClick={() => setShowTopCard(false)}
                  className="mt-2 text-xs text-gray-500 hover:text-gray-700 underline"
                >
                  Hide this message
                </button>
              </div>
            </StandardCard>
          </div>

          {/* Main content */}
          <div>
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
                      This lovely pace is waiting for its first memory to be
                      shared! We would love to hear about the moments that made
                      your stay special.
                    </p>

                    {/* Features preview */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                      <div className="text-center p-4 bg-white/60 rounded-lg backdrop-blur-sm">
                        <Camera className="h-8 w-8 text-blue-500 mx-auto mb-2" />
                        <p className="text-sm font-medium text-gray-700">
                          Capture Moments
                        </p>
                        <p className="text-xs text-gray-500">
                          Share your favorite memories
                        </p>
                      </div>
                      <div className="text-center p-4 bg-white/60 rounded-lg backdrop-blur-sm">
                        <MapPin className="h-8 w-8 text-green-500 mx-auto mb-2" />
                        <p className="text-sm font-medium text-gray-700">
                          Local Gems
                        </p>
                        <p className="text-xs text-gray-500">
                          Guide future adventurers
                        </p>
                      </div>
                      <div className="text-center p-4 bg-white/60 rounded-lg backdrop-blur-sm">
                        <Heart className="h-8 w-8 text-rose-500 mx-auto mb-2" />
                        <p className="text-sm font-medium text-gray-700">
                          Heartfelt Thanks
                        </p>
                        <p className="text-xs text-gray-500">
                          Show appreciation to owners
                        </p>
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
                        "A house becomes a home through the memories made while
                        staying here. Help us celebrate yours."
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
                      <strong>📖 Add your chapter to our home's story!</strong>{" "}
                      We love reading about the memories our guests make here.
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
                        <div className="flex-1">
                          <h3 className="text-xl font-bold text-gray-900 mb-2">
                            {entry.title || `A wonderful stay`}
                          </h3>
                          <div className="flex items-center space-x-4 text-sm text-gray-500">
                            <span className="flex items-center">
                              <Calendar className="h-4 w-4 mr-1" />
                              {new Date(entry.visit_date).toLocaleDateString(
                                "en-US",
                                {
                                  year: "numeric",
                                  month: "long",
                                  day: "numeric",
                                }
                              )}
                            </span>
                            <span className="flex items-center">
                              <Heart className="h-4 w-4 mr-1" />
                              {entry.guest_name}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center bg-amber-50 px-3 py-2 rounded-lg">
                          {renderStars(entry.rating)}
                          <span className="ml-2 text-sm font-medium text-gray-700">
                            {entry.rating}/5
                          </span>
                        </div>
                      </div>

                      {/* Photos */}
                      {((entry.guest_book_photos &&
                        entry.guest_book_photos.length > 0) ||
                        (entry.photos && entry.photos.length > 0)) && (
                        <div className="mb-6">
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {/* Handle separate photos table */}
                            {entry.guest_book_photos?.map((photo, index) => (
                              <div key={photo.id} className="relative group">
                                <div className="relative overflow-hidden rounded-lg bg-gray-100 aspect-video">
                                  <Image
                                    src={photo.photo_url}
                                    alt={photo.caption || `Photo ${index + 1}`}
                                    fill
                                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                    className="object-cover group-hover:scale-105 transition-transform duration-200"
                                  />
                                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-opacity duration-200" />
                                </div>
                                {photo.caption && (
                                  <p className="mt-2 text-sm text-gray-600 italic">
                                    {photo.caption}
                                  </p>
                                )}
                              </div>
                            ))}

                            {/* Handle photos array in main table */}
                            {entry.photos?.map((photoUrl, index) => (
                              <div key={index} className="relative group">
                                <div className="relative overflow-hidden rounded-lg bg-gray-100 aspect-video">
                                  <Image
                                    src={photoUrl}
                                    alt={
                                      entry.photo_captions?.[index] ||
                                      `Photo ${index + 1}`
                                    }
                                    fill
                                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                    className="object-cover group-hover:scale-105 transition-transform duration-200"
                                  />
                                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-opacity duration-200" />
                                </div>
                                {entry.photo_captions?.[index] && (
                                  <p className="mt-2 text-sm text-gray-600 italic">
                                    {entry.photo_captions[index]}
                                  </p>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Message */}
                      {entry.message && (
                        <div className="mb-6">
                          <div className="bg-gray-50 rounded-lg p-4 border-l-4 border-blue-400">
                            <p className="text-gray-800 leading-relaxed text-lg italic">
                              "{entry.message}"
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Status indicators and metadata */}
                      <div className="flex flex-wrap items-center justify-between pt-4 border-t border-gray-100">
                        <div className="flex flex-wrap gap-2">
                          {entry.everything_was_great && (
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-green-100 text-green-800 font-medium">
                              ✨ Everything was perfect
                            </span>
                          )}
                          {entry.everything_well_stocked && (
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800 font-medium">
                              📦 Well stocked
                            </span>
                          )}

                          {/* Show approval status for debugging (remove in production) */}
                          {!entry.is_approved && (
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-yellow-100 text-yellow-800 font-medium">
                              ⏳ Pending Approval
                            </span>
                          )}
                          {!entry.is_public && (
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-red-100 text-red-800 font-medium">
                              🔒 Private
                            </span>
                          )}
                        </div>

                        <div className="text-sm text-gray-500 mt-2 md:mt-0">
                          Shared{" "}
                          {new Date(entry.created_at).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  </StandardCard>
                ))}
              </div>
            )}
          </div>

          {/* ✅ Remove this debug button since guest book is working */}
          {/* 
        <div className="fixed bottom-4 left-4 z-50">
          <button
            onClick={() => {
              console.log("🧪 Manual test clicked");
              fetchGuestBookEntries();
              debugAllEntries();
            }}
            className="bg-red-500 text-white px-3 py-1 rounded text-xs"
          >
            🧪 Test DB
          </button>
        </div>
        */}
        </PageContainer>
      </div>
      <style jsx>{`
        @keyframes float {
          0%,
          100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-10px);
          }
        }

        @keyframes float-delayed {
          0%,
          100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-15px);
          }
        }

        @keyframes shrink {
          from {
            width: 100%;
          }
          to {
            width: 0%;
          }
        }

        .animate-float {
          animation: float 3s ease-in-out infinite;
        }

        .animate-float-delayed {
          animation: float-delayed 3s ease-in-out infinite 1.5s;
        }
      `}</style>
    </ProtectedPageWrapper>
  );
}
