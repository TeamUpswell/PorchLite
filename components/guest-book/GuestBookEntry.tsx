"use client";

import { useState } from "react";
import { Star, Calendar, Camera, MapPin, MessageCircle, ChevronDown, ChevronUp, Heart } from "lucide-react";
import Image from "next/image";

interface GuestBookEntryProps {
  entry: {
    id: string;
    guest_name: string;
    visit_date: string;
    rating: number;
    title?: string;
    message: string;
    photos?: string[];
    photo_captions?: string[];
    guest_recommendations?: {
      id: string;
      guest_rating: number;
      guest_notes: string;
      recommendation: {
        name: string;
        category: string;
        address: string;
        place_id?: string;
      };
    }[];
    everything_was_great?: boolean;
    everything_well_stocked?: boolean;
  };
  showFullContent?: boolean;
}

export default function GuestBookEntry({ entry, showFullContent = false }: GuestBookEntryProps) {
  const [isExpanded, setIsExpanded] = useState(showFullContent);
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState<number | null>(null);

  const renderStars = (rating: number, size: 'sm' | 'md' = 'sm') => {
    const starSize = size === 'sm' ? 'h-4 w-4' : 'h-5 w-5';
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`${starSize} ${
          i < rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
        }`}
      />
    ));
  };

  const getCategoryIcon = (category: string) => {
    const icons: Record<string, string> = {
      restaurant: '🍽️',
      grocery: '🛒',
      entertainment: '🎭',
      healthcare: '🏥',
      shopping: '🛍️',
      services: '🔧',
      outdoor: '🌲',
      emergency: '🚨',
    };
    return icons[category] || '📍';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center space-x-3 mb-2">
              <div className="flex-shrink-0">
                <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 font-medium text-sm">
                    {entry.guest_name.charAt(0).toUpperCase()}
                  </span>
                </div>
              </div>
              <div>
                <h3 className="text-lg font-medium text-gray-900">{entry.guest_name}</h3>
                <div className="flex items-center text-sm text-gray-500">
                  <Calendar className="h-4 w-4 mr-1" />
                  {formatDate(entry.visit_date)}
                </div>
              </div>
            </div>
            
            {entry.title && (
              <h4 className="text-xl font-medium text-gray-900 mb-2">{entry.title}</h4>
            )}
            
            <div className="flex items-center space-x-2">
              {renderStars(entry.rating, 'md')}
              <span className="text-sm font-medium text-gray-700">
                {entry.rating}/5 stars
              </span>
            </div>
          </div>
          
          {!showFullContent && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="flex items-center text-sm text-blue-600 hover:text-blue-800"
            >
              {isExpanded ? (
                <>
                  <span className="mr-1">Show less</span>
                  <ChevronUp className="h-4 w-4" />
                </>
              ) : (
                <>
                  <span className="mr-1">Show more</span>
                  <ChevronDown className="h-4 w-4" />
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {/* Main Message */}
        <div className="mb-6">
          <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
            {entry.message}
          </p>
        </div>

        {/* Photos */}
        {entry.photos && entry.photos.length > 0 && (isExpanded || showFullContent) && (
          <div className="mb-6">
            <h5 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
              <Camera className="h-4 w-4 mr-1" />
              Photos from their stay ({entry.photos.length})
            </h5>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {entry.photos.map((photo, index) => (
                <div
                  key={index}
                  className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden cursor-pointer hover:opacity-90 transition-opacity"
                  onClick={() => setSelectedPhotoIndex(index)}
                >
                  <Image
                    src={photo}
                    alt={entry.photo_captions?.[index] || `Photo ${index + 1}`}
                    fill
                    className="object-cover"
                  />
                  {entry.photo_captions?.[index] && (
                    <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-75 text-white text-xs p-2">
                      {entry.photo_captions[index]}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recommendations */}
        {entry.guest_recommendations && entry.guest_recommendations.length > 0 && (isExpanded || showFullContent) && (
          <div className="mb-6">
            <h5 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
              <MapPin className="h-4 w-4 mr-1" />
              Places they discovered ({entry.guest_recommendations.length})
            </h5>
            <div className="space-y-3">
              {entry.guest_recommendations.map((rec, index) => (
                <div key={rec.id} className="bg-gray-50 rounded-lg p-3">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h6 className="font-medium text-gray-900 flex items-center">
                        <span className="mr-2">{getCategoryIcon(rec.recommendation.category)}</span>
                        {rec.recommendation.name}
                      </h6>
                      <p className="text-sm text-gray-600">{rec.recommendation.address}</p>
                    </div>
                    <div className="flex items-center">
                      {renderStars(rec.guest_rating)}
                      <span className="ml-1 text-sm text-gray-600">{rec.guest_rating}/5</span>
                    </div>
                  </div>
                  {rec.guest_notes && (
                    <p className="text-sm text-gray-700 italic">"{rec.guest_notes}"</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Positive Feedback Highlights */}
        {(entry.everything_was_great || entry.everything_well_stocked) && (isExpanded || showFullContent) && (
          <div className="mb-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <div className="flex items-center text-green-800 mb-2">
                <Heart className="h-4 w-4 mr-2" />
                <span className="font-medium">Perfect Stay Highlights</span>
              </div>
              <div className="space-y-1 text-sm text-green-700">
                {entry.everything_was_great && (
                  <p>✨ No issues with the property - everything was great!</p>
                )}
                {entry.everything_well_stocked && (
                  <p>✨ All supplies and amenities were well-stocked!</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Quick Stats */}
        {!isExpanded && !showFullContent && (
          <div className="flex items-center space-x-4 text-sm text-gray-500">
            {entry.photos && entry.photos.length > 0 && (
              <span className="flex items-center">
                <Camera className="h-4 w-4 mr-1" />
                {entry.photos.length} photo{entry.photos.length !== 1 ? 's' : ''}
              </span>
            )}
            {entry.guest_recommendations && entry.guest_recommendations.length > 0 && (
              <span className="flex items-center">
                <MapPin className="h-4 w-4 mr-1" />
                {entry.guest_recommendations.length} recommendation{entry.guest_recommendations.length !== 1 ? 's' : ''}
              </span>
            )}
            {(entry.everything_was_great || entry.everything_well_stocked) && (
              <span className="flex items-center text-green-600">
                <Heart className="h-4 w-4 mr-1" />
                Perfect stay
              </span>
            )}
          </div>
        )}
      </div>

      {/* Photo Modal */}
      {selectedPhotoIndex !== null && entry.photos && (
        <div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4">
          <div className="relative max-w-4xl max-h-full">
            <button
              onClick={() => setSelectedPhotoIndex(null)}
              className="absolute top-4 right-4 text-white hover:text-gray-300 z-10"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <img
              src={entry.photos[selectedPhotoIndex]}
              alt={entry.photo_captions?.[selectedPhotoIndex] || `Photo ${selectedPhotoIndex + 1}`}
              className="max-w-full max-h-full object-contain"
            />
            {entry.photo_captions?.[selectedPhotoIndex] && (
              <div className="absolute bottom-4 left-4 right-4 bg-black bg-opacity-75 text-white p-3 rounded">
                {entry.photo_captions[selectedPhotoIndex]}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}