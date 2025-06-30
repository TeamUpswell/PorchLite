"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { useProperty } from "@/lib/hooks/useProperty";
import { supabase } from "@/lib/supabase";
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

// Types
interface GuestBookPhoto {
  id: string;
  photo_url: string;
  caption: string;
  order_index: number;
  guest_book_entry_id: string;
}

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
  guest_book_photos?: GuestBookPhoto[];
}

export default function GuestBookPage() {
  const { user, loading: authLoading } = useAuth();
  const { currentProperty, loading: propertyLoading } = useProperty();

  const [entries, setEntries] = useState<GuestBookEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showTopCard, setShowTopCard] = useState(true);
  const [showWizardModal, setShowWizardModal] = useState(false);
  const [editingEntry, setEditingEntry] = useState<GuestBookEntry | null>(null);

  // Refs to prevent multiple fetches and track component mount
  const fetchingRef = useRef(false);
  const hasFetchedRef = useRef<string | null>(null);
  const mountedRef = useRef(true);
  const topCardTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Memoize loading states
  const isLoading = useMemo(() => {
    return authLoading || propertyLoading;
  }, [authLoading, propertyLoading]);

  // Component cleanup
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (topCardTimerRef.current) {
        clearTimeout(topCardTimerRef.current);
      }
    };
  }, []);

  // Timer to hide top card
  useEffect(() => {
    if (topCardTimerRef.current) {
      clearTimeout(topCardTimerRef.current);
    }

    topCardTimerRef.current = setTimeout(() => {
      if (mountedRef.current) {
        setShowTopCard(false);
      }
    }, 20000);

    return () => {
      if (topCardTimerRef.current) {
        clearTimeout(topCardTimerRef.current);
      }
    };
  }, []);

  // Optimized fetch function with photo joining
  const fetchGuestBookEntries = useCallback(async (property_id: string) => {
    // Prevent duplicate fetches
    if (fetchingRef.current || hasFetchedRef.current === property_id) {
      return;
    }

    fetchingRef.current = true;
    hasFetchedRef.current = property_id;

    try {
      console.log("📖 Fetching guest book entries for property:", property_id);
      setLoading(true);
      setError(null);

      // Try to fetch with photos in a single query first
      let { data: entriesData, error: entriesError } = await supabase
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
        .eq("property_id", property_id)
        .eq("is_approved", true)
        .eq("is_public", true)
        .order("visit_date", { ascending: false })
        .limit(20);

      // If photo join fails (table doesn't exist), fetch entries only
      if (entriesError && entriesError.message.includes("guest_book_photos")) {
        console.log("📸 Photos table not found, fetching entries only");
        const { data: fallbackData, error: fallbackError } = await supabase
          .from("guest_book_entries")
          .select("*")
          .eq("property_id", property_id)
          .eq("is_approved", true)
          .eq("is_public", true)
          .order("visit_date", { ascending: false })
          .limit(20);

        if (fallbackError) throw fallbackError;
        entriesData = fallbackData;
      } else if (entriesError) {
        throw entriesError;
      }

      if (mountedRef.current) {
        console.log("✅ Guest book entries loaded:", entriesData?.length || 0);
        setEntries(entriesData || []);
      }
    } catch (error) {
      console.error("❌ Error fetching guest book entries:", error);
      if (mountedRef.current) {
        setError("Failed to load guest book entries. Please try again.");
        setEntries([]);
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
      fetchingRef.current = false;
    }
  }, []);

  // Single useEffect with proper dependencies
  useEffect(() => {
    if (isLoading || !user || !currentProperty?.id) {
      if (!isLoading) {
        setLoading(false);
      }
      return;
    }

    console.log("📖 User and property loaded, fetching guest book entries");
    fetchGuestBookEntries(currentProperty.id);
  }, [user, currentProperty?.id, isLoading, fetchGuestBookEntries]);

  // Reset fetch tracking when property changes
  useEffect(() => {
    if (currentProperty?.id !== hasFetchedRef.current) {
      hasFetchedRef.current = null;
      fetchingRef.current = false;
      setEntries([]);
      setError(null);
    }
  }, [currentProperty?.id]);

  // Memoized star renderer
  const renderStars = useCallback((rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${
          i < rating ? "text-yellow-400 fill-current" : "text-gray-300"
        }`}
      />
    ));
  }, []);

  // Memoized edit permission check
  const canEditEntry = useCallback(
    (entry: GuestBookEntry) => {
      return user && entry.created_by === user.id;
    },
    [user]
  );

  // Memoized handlers
  const handleEditEntry = useCallback((entry: GuestBookEntry) => {
    setEditingEntry(entry);
    setShowWizardModal(true);
  }, []);

  const handleCloseWizard = useCallback(() => {
    setShowWizardModal(false);
    setEditingEntry(null);
  }, []);

  const handleWizardComplete = useCallback(() => {
    // Refresh data by resetting cache
    if (currentProperty?.id) {
      hasFetchedRef.current = null;
      fetchingRef.current = false;
      fetchGuestBookEntries(currentProperty.id);
    }
    setShowWizardModal(false);
    setEditingEntry(null);
  }, [currentProperty?.id, fetchGuestBookEntries]);

  const retryFetch = useCallback(() => {
    if (currentProperty?.id) {
      hasFetchedRef.current = null;
      fetchingRef.current = false;
      setError(null);
      fetchGuestBookEntries(currentProperty.id);
    }
  }, [currentProperty?.id, fetchGuestBookEntries]);

  // Memoized EntryCard component
  const EntryCard = useCallback(
    ({ entry, index }: { entry: GuestBookEntry; index: number }) => (
      <div key={entry.id} className="relative mb-8 last:mb-0">
        {/* Timeline dot */}
        <div className="absolute left-0 w-4 h-4 bg-gradient-to-r from-rose-400 to-amber-400 rounded-full border-4 border-white shadow-lg z-10 transform -translate-x-[7px]"></div>

        {/* Date badge */}
        <div className="absolute left-8 -top-1">
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700 border">
            <Calendar className="h-3 w-3 mr-1" />
            {new Date(entry.visit_date).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </span>
        </div>

        {/* Entry content */}
        <div className="ml-10 mt-3">
          <StandardCard className="overflow-hidden hover:shadow-lg transition-shadow duration-200">
            <div className="p-4">
              {/* Header */}
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
                      {new Date(entry.visit_date).toLocaleDateString("en-US", {
                        weekday: "long",
                      })}
                    </span>
                  </div>
                </div>

                {/* Rating */}
                <div className="flex items-center bg-gradient-to-r from-amber-50 to-yellow-50 px-3 py-1 rounded-lg border border-amber-200 ml-3">
                  <div className="flex items-center">
                    {renderStars(entry.rating)}
                  </div>
                  <span className="ml-1 text-sm font-bold text-amber-700">
                    {entry.rating}
                  </span>
                </div>
              </div>

              {/* Message */}
              {entry.message && (
                <div className="mb-4">
                  <div className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-lg p-3 border-l-3 border-blue-400">
                    <p className="text-gray-800 leading-relaxed italic">
                      "{entry.message}"
                    </p>
                  </div>
                </div>
              )}

              {/* Photos */}
              {((entry.guest_book_photos &&
                entry.guest_book_photos.length > 0) ||
                (entry.photos && entry.photos.length > 0)) && (
                <div className="mb-4">
                  <div className="flex items-center mb-2">
                    <Camera className="h-4 w-4 text-gray-600 dark:text-gray-400 mr-1" />
                    <span className="text-xs font-medium text-gray-600">
                      Memory Snapshots
                    </span>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                    {entry.guest_book_photos?.map((photo, photoIndex) => (
                      <div key={photo.id} className="relative group">
                        <div className="relative overflow-hidden rounded-lg bg-gray-100 aspect-square">
                          <Image
                            src={photo.photo_url}
                            alt={photo.caption || `Memory ${photoIndex + 1}`}
                            fill
                            className="object-cover group-hover:scale-110 transition-transform duration-300"
                            onError={() =>
                              console.warn(
                                "Failed to load photo:",
                                photo.photo_url
                              )
                            }
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
                    ))}

                    {entry.photos?.map((photoUrl, photoIndex) => (
                      <div key={photoIndex} className="relative group">
                        <div className="relative overflow-hidden rounded-lg bg-gray-100 aspect-square">
                          <Image
                            src={photoUrl}
                            alt={
                              entry.photo_captions?.[photoIndex] ||
                              `Memory ${photoIndex + 1}`
                            }
                            fill
                            className="object-cover group-hover:scale-110 transition-transform duration-300"
                            onError={() =>
                              console.warn("Failed to load photo:", photoUrl)
                            }
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

              {/* Status and actions */}
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
                    {new Date(entry.created_at).toLocaleDateString()}
                  </div>

                  {canEditEntry(entry) && (
                    <button
                      onClick={() => handleEditEntry(entry)}
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
    ),
    [renderStars, canEditEntry, handleEditEntry]
  );

  // Loading states
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="text-gray-600 mt-4">⏳ Loading guest book...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="text-center py-12">
        <BookOpen className="h-16 w-16 text-gray-600 dark:text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600">Please log in to view the guest book.</p>
        <Link
          href="/auth/signin"
          className="text-blue-600 hover:text-blue-800 mt-2 inline-block"
        >
          Sign In
        </Link>
      </div>
    );
  }

  if (!currentProperty) {
    return (
      <StandardCard className="text-center py-12">
        <BookOpen className="h-16 w-16 text-gray-600 dark:text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          No Property Selected
        </h3>
        <p className="text-gray-600">
          Please select a property to view its guest book.
        </p>
      </StandardCard>
    );
  }

  // Error state
  if (error) {
    return (
      <StandardCard>
        <div className="text-center py-8">
          <BookOpen className="h-12 w-12 text-red-300 mx-auto mb-4" />
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={retryFetch}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Try Again
          </button>
        </div>
      </StandardCard>
    );
  }

  return (
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
              connections you've experienced here.
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

              <button
                onClick={() => setShowWizardModal(true)}
                className="inline-flex items-center bg-gradient-to-r from-rose-600 to-amber-600 text-white px-8 py-4 rounded-xl hover:from-rose-700 hover:to-amber-700 transform hover:scale-105 transition-all duration-200 shadow-lg font-semibold text-lg"
              >
                <Plus className="h-5 w-5 mr-3" />
                Start This Home's Memory Collection
              </button>
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
              The memories you create make this place magic (
              {entries.length} entries)
            </p>
            <div className="w-24 h-1 bg-gradient-to-r from-rose-400 to-amber-400 mx-auto rounded-full"></div>
          </div>

          {/* Add new entry prompt */}
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
            <div className="absolute left-2 top-8 bottom-0 w-0.5 bg-gray-200"></div>
          </div>

          {/* Timeline Entries */}
          <div className="relative">
            <div className="absolute left-2 top-0 bottom-0 w-0.5 bg-gray-200"></div>
            {entries.map((entry, index) => (
              <EntryCard key={entry.id} entry={entry} index={index} />
            ))}

            {/* Timeline end marker */}
            <div className="relative">
              <div className="absolute left-0 w-4 h-4 bg-gray-300 rounded-full border-4 border-white shadow-sm transform -translate-x-[7px]"></div>
              <div className="ml-10">
                <div className="text-center py-4">
                  <div className="inline-flex items-center px-3 py-1 bg-gray-50 rounded-full text-xs text-gray-500 border">
                    <Heart className="h-3 w-3 mr-1 text-gray-600 dark:text-gray-400" />
                    The story continues...
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Trip Report Wizard Modal */}
      {showWizardModal && currentProperty && (
        <TripReportWizard
          isOpen={showWizardModal}
          onClose={handleCloseWizard}
          property={currentProperty}
          editEntry={editingEntry}
          onComplete={handleWizardComplete}
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
    </div>
  );
}