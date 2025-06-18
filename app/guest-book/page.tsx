"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/components/auth";
import { useProperty } from "@/lib/hooks/useProperty";
import { supabase } from "@/lib/supabase";
import StandardPageLayout from "@/components/layout/StandardPageLayout";
import PageContainer from "@/components/layout/PageContainer";
import StandardCard from "@/components/ui/StandardCard";
import {
  Heart,
  Star,
  Camera,
  MapPin,
  Calendar,
  Plus,
  BookOpen,
  Edit,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import TripReportWizard from "@/components/guest-book/TripReportWizard";

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
  created_by?: string;
  photos?: string[];
  photo_captions?: string[];
  guest_book_photos?: {
    id: string;
    photo_url: string;
    caption: string;
    order_index: number;
    guest_book_entry_id: string;
  }[];
}

export default function GuestBookPage() {
  const { user, loading: authLoading } = useAuth();
  const { currentProperty, loading: propertyLoading } = useProperty();
  const [entries, setEntries] = useState<GuestBookEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [showTopCard, setShowTopCard] = useState(true);
  const [showWizardModal, setShowWizardModal] = useState(false);
  const [editingEntry, setEditingEntry] = useState<any>(null);

  // Debug current state
  useEffect(() => {
    console.log("🔍 Guest Book Debug:", {
      user: user?.email || "none",
      authLoading,
      propertyLoading,
      currentProperty: currentProperty?.name || "none",
      propertyId: currentProperty?.id || "none",
      entriesCount: entries.length,
      loading,
    });
  }, [
    user,
    authLoading,
    propertyLoading,
    currentProperty,
    entries.length,
    loading,
  ]);

  useEffect(() => {
    if (currentProperty?.id && user) {
      fetchGuestBookEntries();
    } else if (!authLoading && !propertyLoading) {
      setLoading(false);
    }
  }, [currentProperty?.id, user, authLoading, propertyLoading]);

  // Timer to hide top card
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowTopCard(false);
    }, 20000);

    return () => clearTimeout(timer);
  }, []);

  const fetchGuestBookEntries = async () => {
    if (!currentProperty?.id) {
      console.log("❌ No property ID available");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      console.log("🔍 Fetching entries for property:", currentProperty.id);

      const { data, error } = await supabase
        .from("guest_book_entries")
        .select("*")
        .eq("property_id", currentProperty.id)
        .eq("is_approved", true)
        .eq("is_public", true)
        .order("visit_date", { ascending: false })
        .limit(20);

      console.log("📋 Guest book query result:", {
        data,
        error,
        count: data?.length,
      });

      if (error) {
        console.error("❌ Guest book query error:", error);
        throw error;
      }

      setEntries(data || []);

      if (data && data.length > 0) {
        await fetchPhotosForEntries(data);
      }
    } catch (error) {
      console.error("💥 Error fetching guest book entries:", error);
      setEntries([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchPhotosForEntries = async (entries: GuestBookEntry[]) => {
    try {
      const entryIds = entries.map((e) => e.id);

      const { data: photos, error } = await supabase
        .from("guest_book_photos")
        .select("*")
        .in("guest_book_entry_id", entryIds)
        .order("order_index", { ascending: true });

      if (!error && photos) {
        console.log("📸 Found photos:", photos.length);
        const entriesWithPhotos = entries.map((entry) => ({
          ...entry,
          guest_book_photos: photos.filter(
            (photo) => photo.guest_book_entry_id === entry.id
          ),
        }));

        setEntries(entriesWithPhotos);
      } else if (error) {
        console.log("📸 Photos query error (table might not exist):", error);
      }
    } catch (error) {
      console.log("📸 Photos table might not exist, continuing without photos");
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

  const canEditEntry = (entry: any) => {
    console.log("🔍 Edit check for entry:", {
      entryId: entry.id,
      entryTitle: entry.title,
      hasUser: !!user,
      userId: user?.id,
      entryCreatedBy: entry.created_by,
      createdByType: typeof entry.created_by,
      canEdit: user && entry.created_by === user.id,
    });
    return user && entry.created_by === user.id;
  };

  // Show loading while auth or property is loading
  if (authLoading || propertyLoading) {
    return (
      <StandardPageLayout>
        <div className="flex items-center justify-center min-h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
            <p className="text-gray-600 mt-4">Loading guest book...</p>
          </div>
        </div>
      </StandardPageLayout>
    );
  }

  // Redirect to login if no user
  if (!user) {
    return (
      <StandardPageLayout>
        <div className="text-center py-12">
          <BookOpen className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">Please log in to view the guest book.</p>
          <Link
            href="/auth/signin"
            className="text-blue-600 hover:text-blue-800 mt-2 inline-block"
          >
            Sign In
          </Link>
        </div>
      </StandardPageLayout>
    );
  }

  // Show message if no property
  if (!currentProperty) {
    return (
      <StandardPageLayout>
        <StandardCard className="text-center py-12">
          <BookOpen className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No Property Selected
          </h3>
          <p className="text-gray-600">
            Please select a property to view its guest book.
          </p>
        </StandardCard>
      </StandardPageLayout>
    );
  }

  return (
    <StandardPageLayout>
      <PageContainer>
        <div className="space-y-6">
          {/* Top welcome card with fade and collapse */}
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

                <div className="mt-4 w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-gradient-to-r from-rose-400 to-amber-400 h-2 rounded-full shrink-animation animate-pulse" />
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

          {/* Main content area */}
          {loading ? (
            <StandardCard className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
              <p className="text-gray-600 mt-2">Loading guest entries...</p>
            </StandardCard>
          ) : entries.length === 0 ? (
            /* Empty state with call to action */
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
                    This lovely place is waiting for its first memory to be
                    shared! We would love to hear about the moments that made
                    your stay special.
                  </p>

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

                  <div className="space-y-4">
                    <button
                      onClick={() => setShowWizardModal(true)}
                      className="inline-flex items-center bg-gradient-to-r from-rose-600 to-amber-600 text-white px-8 py-4 rounded-xl hover:from-rose-700 hover:to-amber-700 transform hover:scale-105 transition-all duration-200 shadow-lg font-semibold text-lg"
                    >
                      <Plus className="h-5 w-5 mr-3" />
                      Start This Home's Memory Collection
                    </button>

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
            /* Guest book entries - Timeline Layout */
            <div className="space-y-8">
              {/* Timeline Header */}
              <div className="text-center mb-6">
                <h2 className="text-3xl font-bold text-gray-900 mb-1">
                  Memory Timeline
                </h2>
                <p className="text-gray-600 max-w-2xl mx-auto mb-2">
                  The memories you create make this place magic
                </p>
                <div className="w-24 h-1 bg-gradient-to-r from-rose-400 to-amber-400 mx-auto rounded-full"></div>
              </div>

              {/* Add new entry prompt - Timeline style */}
              <div className="relative">
                <div className="flex items-center mb-8">
                  <div className="flex-shrink-0 w-4 h-4 bg-blue-500 rounded-full border-4 border-white shadow-lg z-10"></div>
                  <div className="flex-1 ml-6">
                    <StandardCard className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
                      <div className="p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">
                              📖 Add Your Chapter
                            </h3>
                            <p className="text-gray-600">
                              Share your experience and become part of this
                              home's story
                            </p>
                          </div>
                          <button
                            onClick={() => setShowWizardModal(true)}
                            className="inline-flex items-center bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700 font-medium transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
                          >
                            <Heart className="h-5 w-5 mr-2" />
                            Share Memory
                          </button>
                        </div>
                      </div>
                    </StandardCard>
                  </div>
                </div>
                {/* Vertical line */}
                <div className="absolute left-2 top-8 bottom-0 w-0.5 bg-gray-200"></div>
              </div>

              {/* Timeline Entries */}
              <div className="relative">
                {/* Main timeline line */}
                <div className="absolute left-2 top-0 bottom-0 w-0.5 bg-gray-200"></div>

                {entries.map((entry, index) => (
                  <div key={entry.id} className="relative mb-8 last:mb-0">
                    {/* Timeline dot */}
                    <div className="absolute left-0 w-4 h-4 bg-gradient-to-r from-rose-400 to-amber-400 rounded-full border-4 border-white shadow-lg z-10 transform -translate-x-[7px]"></div>

                    {/* Date badge */}
                    <div className="absolute left-8 -top-1">
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700 border">
                        <Calendar className="h-3 w-3 mr-1" />
                        {new Date(entry.visit_date).toLocaleDateString(
                          "en-US",
                          {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          }
                        )}
                      </span>
                    </div>

                    {/* Entry content - more compact */}
                    <div className="ml-10 mt-3">
                      <StandardCard className="overflow-hidden hover:shadow-lg transition-shadow duration-200">
                        <div className="p-4">
                          {/* Compact header */}
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1 min-w-0">
                              <h3 className="text-lg font-bold text-gray-900 mb-1 leading-tight truncate">
                                {entry.title || `A wonderful stay`}
                              </h3>
                              <div className="flex items-center space-x-3 text-sm text-gray-500">
                                <span className="flex items-center font-medium">
                                  <Heart className="h-3 w-3 mr-1 text-rose-400" />
                                  {entry.guest_name}
                                </span>
                                <span className="text-gray-300">•</span>
                                <span className="truncate">
                                  {new Date(
                                    entry.visit_date
                                  ).toLocaleDateString("en-US", {
                                    weekday: "long",
                                  })}
                                </span>
                              </div>
                            </div>

                            {/* Compact rating */}
                            <div className="flex items-center bg-gradient-to-r from-amber-50 to-yellow-50 px-3 py-1 rounded-lg border border-amber-200 ml-3">
                              <div className="flex items-center">
                                {renderStars(entry.rating)}
                              </div>
                              <span className="ml-1 text-sm font-bold text-amber-700">
                                {entry.rating}
                              </span>
                            </div>
                          </div>

                          {/* Compact message */}
                          {entry.message && (
                            <div className="mb-4">
                              <div className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-lg p-3 border-l-3 border-blue-400">
                                <p className="text-gray-800 leading-relaxed italic">
                                  "{entry.message}"
                                </p>
                              </div>
                            </div>
                          )}

                          {/* Compact photos grid */}
                          {((entry.guest_book_photos &&
                            entry.guest_book_photos.length > 0) ||
                            (entry.photos && entry.photos.length > 0)) && (
                            <div className="mb-4">
                              <div className="flex items-center mb-2">
                                <Camera className="h-4 w-4 text-gray-400 mr-1" />
                                <span className="text-xs font-medium text-gray-600">
                                  Memory Snapshots
                                </span>
                              </div>
                              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                                {entry.guest_book_photos?.map(
                                  (photo, photoIndex) => (
                                    <div
                                      key={photo.id}
                                      className="relative group"
                                    >
                                      <div className="relative overflow-hidden rounded-lg bg-gray-100 aspect-square">
                                        <Image
                                          src={photo.photo_url}
                                          alt={
                                            photo.caption ||
                                            `Memory ${photoIndex + 1}`
                                          }
                                          fill
                                          className="object-cover group-hover:scale-110 transition-transform duration-300"
                                        />
                                        {photo.caption && (
                                          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                            <p className="text-white text-xs">
                                              {photo.caption}
                                            </p>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  )
                                )}

                                {entry.photos?.map((photoUrl, photoIndex) => (
                                  <div
                                    key={photoIndex}
                                    className="relative group"
                                  >
                                    <div className="relative overflow-hidden rounded-lg bg-gray-100 aspect-square">
                                      <Image
                                        src={photoUrl}
                                        alt={
                                          entry.photo_captions?.[photoIndex] ||
                                          `Memory ${photoIndex + 1}`
                                        }
                                        fill
                                        className="object-cover group-hover:scale-110 transition-transform duration-300"
                                      />
                                      {entry.photo_captions?.[photoIndex] && (
                                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                          <p className="text-white text-xs">
                                            {entry.photo_captions[photoIndex]}
                                          </p>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Compact status and actions */}
                          <div className="flex flex-wrap items-center justify-between pt-3 border-t border-gray-100">
                            <div className="flex flex-wrap gap-1">
                              {entry.everything_was_great && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-green-100 text-green-800 font-medium">
                                  ✨ Perfect
                                </span>
                              )}
                              {entry.everything_well_stocked && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-blue-100 text-blue-800 font-medium">
                                  📦 Well stocked
                                </span>
                              )}
                            </div>

                            <div className="flex items-center space-x-3 mt-1 md:mt-0">
                              <div className="text-xs text-gray-500">
                                {new Date(
                                  entry.created_at
                                ).toLocaleDateString()}
                              </div>

                              {canEditEntry(entry) && (
                                <button
                                  onClick={() => {
                                    setEditingEntry(entry);
                                    setShowWizardModal(true);
                                  }}
                                  className="inline-flex items-center px-2 py-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50 text-xs font-medium rounded transition-all duration-200"
                                >
                                  <Edit className="h-3 w-3 mr-1" />
                                  Edit
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      </StandardCard>
                    </div>
                  </div>
                ))}

                {/* Timeline end marker */}
                <div className="relative">
                  <div className="absolute left-0 w-4 h-4 bg-gray-300 rounded-full border-4 border-white shadow-sm transform -translate-x-[7px]"></div>
                  <div className="ml-10">
                    <div className="text-center py-4">
                      <div className="inline-flex items-center px-3 py-1 bg-gray-50 rounded-full text-xs text-gray-500 border">
                        <Heart className="h-3 w-3 mr-1 text-gray-400" />
                        The story continues...
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {showWizardModal && currentProperty && (
          <TripReportWizard
            isOpen={showWizardModal}
            onClose={() => {
              setShowWizardModal(false);
              setEditingEntry(null);
            }}
            property={currentProperty}
            editEntry={editingEntry}
            onComplete={() => {
              fetchGuestBookEntries();
              setShowWizardModal(false);
              setEditingEntry(null);
            }}
          />
        )}

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
            0% {
              width: 100%;
            }
            100% {
              width: 0%;
            }
          }

          .animate-float {
            animation: float 3s ease-in-out infinite;
          }

          .animate-float-delayed {
            animation: float-delayed 3s ease-in-out infinite 1.5s;
          }

          .shrink-animation {
            animation: shrink 20s linear forwards;
          }
        `}</style>
      </PageContainer>
    </StandardPageLayout>
  );
}
