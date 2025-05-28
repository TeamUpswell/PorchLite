// components/recommendations/RecommendationCard.tsx
import { useState } from "react";
import Image from "next/image";
import { Star, MapPin, ExternalLink, Phone, MessageSquare, ThumbsDown } from "lucide-react";
import { ActionButton } from "@/components/ui/Icons";
import RecommendationNotes from "./RecommendationNotes";
import { Recommendation, RecommendationNote } from "@/types/recommendations";

interface RecommendationCardProps {
  recommendation: Recommendation;
  notes: RecommendationNote[];
  hasEditPermission: boolean;
  hasAddPermission: boolean;
  onEdit: (recommendation: Recommendation) => void;
  onDelete: (id: string) => void;
  onToggleStatus: (id: string, currentStatus: boolean | undefined) => void;
  onAddNote: (recommendationId: string, content: string) => Promise<void>;
}

const RecommendationCard: React.FC<RecommendationCardProps> = ({
  recommendation,
  notes,
  hasEditPermission,
  hasAddPermission,
  onEdit,
  onDelete,
  onToggleStatus,
  onAddNote,
}) => {
  const renderRating = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;

    for (let i = 1; i <= 5; i++) {
      if (i <= fullStars) {
        stars.push(
          <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
        );
      } else if (i === fullStars + 1 && hasHalfStar) {
        stars.push(
          <Star
            key={i}
            className="h-4 w-4 fill-yellow-400 text-yellow-400 half-filled"
          />
        );
      } else {
        stars.push(<Star key={i} className="h-4 w-4 text-gray-300" />);
      }
    }

    return (
      <div className="flex items-center">
        {stars}
        <span className="ml-1 text-sm text-gray-600">{rating.toFixed(1)}</span>
      </div>
    );
  };

  return (
    <div
      className={`bg-white rounded-lg shadow-md overflow-hidden relative ${
        recommendation.is_recommended === false
          ? "border-2 border-red-300"
          : ""
      }`}
    >
      {/* Status Badge */}
      {recommendation.is_recommended === false && (
        <div className="absolute top-2 left-2 z-10 bg-red-500 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
          <ThumbsDown size={12} />
          Not Recommended
        </div>
      )}

      {/* Action Buttons */}
      <div className="absolute top-2 right-2 z-10 flex space-x-2">
        {hasEditPermission && (
          <>
            <ActionButton
              onClick={() => onDelete(recommendation.id)}
              title="Delete recommendation"
              variant="delete"
            />
            <ActionButton
              onClick={() =>
                onToggleStatus(recommendation.id, recommendation.is_recommended)
              }
              title={
                recommendation.is_recommended !== false
                  ? "Mark as not recommended"
                  : "Mark as recommended"
              }
              variant={
                recommendation.is_recommended !== false ? "delete" : "confirm"
              }
            />
          </>
        )}
        {hasAddPermission && (
          <ActionButton
            onClick={() => onEdit(recommendation)}
            title="Edit recommendation"
            variant="edit"
          />
        )}
      </div>

      {/* Image */}
      {recommendation.images && recommendation.images.length > 0 ? (
        <div
          className={`h-32 w-full relative ${
            recommendation.is_recommended === false ? "opacity-70" : ""
          }`}
        >
          <Image
            src={recommendation.images[0]}
            alt={recommendation.name}
            width={400}
            height={300}
            className="w-full h-full rounded-t-lg object-cover"
          />
          <div className="absolute top-2 left-2 bg-white/90 text-gray-800 text-xs px-2 py-1 rounded-full capitalize shadow-sm">
            {recommendation.category}
          </div>
        </div>
      ) : (
        <div
          className={`h-32 w-full bg-gray-200 flex items-center justify-center ${
            recommendation.is_recommended === false ? "opacity-70" : ""
          }`}
        >
          <span className="text-gray-400 text-lg capitalize">
            {recommendation.category}
          </span>
        </div>
      )}

      {/* Content */}
      <div className="p-4">
        <h3 className="text-xl font-bold mb-1">{recommendation.name}</h3>

        {recommendation.rating && (
          <div className="mb-3">{renderRating(recommendation.rating)}</div>
        )}

        {recommendation.description && (
          <p className="text-gray-600 text-sm mb-4">
            {recommendation.description}
          </p>
        )}

        {/* Contact Info */}
        <div className="space-y-2 mb-4">
          {recommendation.address && (
            <div className="flex items-start text-sm">
              <MapPin className="h-4 w-4 text-gray-400 mt-0.5 mr-2 flex-shrink-0" />
              <span>{recommendation.address}</span>
            </div>
          )}

          {recommendation.phone_number && (
            <div className="flex items-center text-sm">
              <Phone className="h-4 w-4 text-gray-400 mr-2" />
              <a
                href={`tel:${recommendation.phone_number}`}
                className="text-blue-600 hover:underline"
              >
                {recommendation.phone_number}
              </a>
            </div>
          )}

          {recommendation.website && (
            <a
              href={recommendation.website}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center text-blue-600 hover:text-blue-800 text-sm"
            >
              <ExternalLink className="h-4 w-4 mr-1" />
              Visit Website
            </a>
          )}
        </div>

        {/* Notes Section */}
        <RecommendationNotes
          recommendationId={recommendation.id}
          recommendationName={recommendation.name}
          notes={notes}
          onAddNote={onAddNote}
        />
      </div>
    </div>
  );
};

export default RecommendationCard;