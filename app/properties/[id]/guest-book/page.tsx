"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Plus, Star, Users, Calendar } from "lucide-react";
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import TripReportWizard from "@/components/guest-book/TripReportWizard";
import GuestBookEntry from "@/components/guest-book/GuestBookEntry";
import { useProperty } from "@/hooks/useProperty";

export default function GuestBookPage() {
  const params = useParams();
  const propertyId = params.id as string;
  const { currentProperty } = useProperty();
  const [showWizard, setShowWizard] = useState(false);
  const [entries, setEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalEntries: 0,
    averageRating: 0,
    totalRecommendations: 0,
  });

  const supabase = createClientComponentClient();

  const loadGuestBookEntries = async () => {
    try {
      const { data, error } = await supabase
        .from('guest_book_entries')
        .select(`
          *,
          guest_recommendations(
            id,
            guest_rating,
            guest_notes,
            recommendation:recommendations(
              name,
              category,
              address,
              place_id
            )
          )
        `)
        .eq('property_id', propertyId)
        .eq('status', 'approved') // Only show approved entries
        .order('visit_date', { ascending: false });

      if (error) throw error;

      setEntries(data || []);
      
      // Calculate stats
      if (data && data.length > 0) {
        const totalRating = data.reduce((sum, entry) => sum + entry.rating, 0);
        const avgRating = totalRating / data.length;
        const totalRecs = data.reduce((sum, entry) => sum + (entry.guest_recommendations?.length || 0), 0);
        
        setStats({
          totalEntries: data.length,
          averageRating: Math.round(avgRating * 10) / 10,
          totalRecommendations: totalRecs,
        });
      }
    } catch (error) {
      console.error('Error loading guest book entries:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (propertyId) {
      loadGuestBookEntries();
    }
  }, [propertyId]);

  const handleWizardComplete = (result: any) => {
    setShowWizard(false);
    if (result.success) {
      // Show success message or redirect
      alert(result.message);
      // Optionally reload entries to show pending status
      loadGuestBookEntries();
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

  if (showWizard) {
    return (
      <TripReportWizard
        property={currentProperty}
        onComplete={handleWizardComplete}
      />
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Guest Book</h1>
              <p className="text-gray-600 mb-4">
                {currentProperty?.name} • Share your experience and discover recommendations from other guests
              </p>
              
              {/* Stats */}
              {stats.totalEntries > 0 && (
                <div className="flex items-center space-x-6 text-sm">
                  <div className="flex items-center">
                    <Users className="h-4 w-4 mr-1 text-gray-500" />
                    <span className="font-medium">{stats.totalEntries}</span>
                    <span className="text-gray-500 ml-1">guest{stats.totalEntries !== 1 ? 's' : ''}</span>
                  </div>
                  <div className="flex items-center">
                    {renderStars(Math.round(stats.averageRating))}
                    <span className="ml-2 font-medium">{stats.averageRating}/5</span>
                    <span className="text-gray-500 ml-1">average</span>
                  </div>
                  <div className="flex items-center">
                    <span className="font-medium">{stats.totalRecommendations}</span>
                    <span className="text-gray-500 ml-1">recommendations</span>
                  </div>
                </div>
              )}
            </div>
            
            <button
              onClick={() => setShowWizard(true)}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 flex items-center shadow-sm"
            >
              <Plus className="h-5 w-5 mr-2" />
              Share Your Experience
            </button>
          </div>
        </div>

        {/* Guest Book Entries */}
        {entries.length > 0 ? (
          <div className="space-y-6">
            {entries.map((entry) => (
              <GuestBookEntry key={entry.id} entry={entry} />
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
            <Calendar className="h-12 w-12 mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No guest entries yet</h3>
            <p className="text-gray-600 mb-6">
              Be the first to share your experience at this property!
            </p>
            <button
              onClick={() => setShowWizard(true)}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 flex items-center mx-auto"
            >
              <Plus className="h-5 w-5 mr-2" />
              Write the First Entry
            </button>
          </div>
        )}
      </div>
    </div>
  );
}