"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  MapPinIcon,
  GlobeAltIcon,
  PhoneIcon,
  StarIcon,
  PencilIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";

interface RecommendationCardProps {
  recommendation: any;
  showEditControls?: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
}

export default function RecommendationCard({
  recommendation,
  showEditControls = false,
  onEdit,
  onDelete,
}: RecommendationCardProps) {
  const [imageError, setImageError] = useState(false);

  // Generate default image based on category
  const getCategoryImage = (category: string) => {
    switch (category.toLowerCase()) {
      case "restaurant":
        return "/images/defaults/restaurant.jpg";
      case "hike":
        return "/images/defaults/hike.jpg";
      case "beach":
        return "/images/defaults/beach.jpg";
      case "shopping":
        return "/images/defaults/shopping.jpg";
      case "activity":
        return "/images/defaults/activity.jpg";
      default:
        return "/images/defaults/placeholder.jpg";
    }
  };

  // Choose the image source
  const imageSrc =
    imageError || !recommendation.images || recommendation.images.length === 0
      ? getCategoryImage(recommendation.category)
      : recommendation.images[0];

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      {/* Card header with image */}
      <div className="relative h-48 w-full bg-gray-100">
        <Image
          src={imageSrc}
          alt={`${recommendation.name} - ${recommendation.category}`}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          onError={() => setImageError(true)}
        />

        <div className="absolute top-2 right-2 bg-white/90 py-1 px-2 rounded-lg text-sm font-medium">
          {recommendation.category}
        </div>
      </div>

      {/* Card content */}
      <div className="p-4">
        <div className="flex justify-between items-start">
          <h3 className="text-lg font-semibold">{recommendation.name}</h3>

          {recommendation.rating && (
            <div className="flex items-center">
              {[...Array(Math.round(recommendation.rating))].map((_, i) => (
                <StarIcon
                  key={i}
                  className="h-4 w-4 text-yellow-500 fill-current"
                />
              ))}
              <span className="ml-1 text-sm text-gray-600">
                {recommendation.rating}/5
              </span>
            </div>
          )}
        </div>

        <div className="mt-2 flex items-start">
          <MapPinIcon className="h-5 w-5 text-gray-500 mr-2 mt-0.5 flex-shrink-0" />
          <p className="text-gray-600 text-sm">{recommendation.address}</p>
        </div>

        {recommendation.website && (
          <div className="mt-2 flex items-center">
            <GlobeAltIcon className="h-5 w-5 text-gray-500 mr-2" />
            <Link
              href={recommendation.website}
              target="_blank"
              className="text-blue-600 hover:underline text-sm truncate"
            >
              {recommendation.website.replace(/https?:\/\/(www\.)?/, "")}
            </Link>
          </div>
        )}

        {recommendation.phone_number && (
          <div className="mt-2 flex items-center">
            <PhoneIcon className="h-5 w-5 text-gray-500 mr-2" />
            <a
              href={`tel:${recommendation.phone_number}`}
              className="text-gray-600 text-sm"
            >
              {recommendation.phone_number}
            </a>
          </div>
        )}

        <p className="text-gray-700 mt-3 line-clamp-3">
          {recommendation.description}
        </p>

        {/* Controls */}
        {showEditControls && (
          <div className="mt-4 flex justify-end space-x-2">
            {onEdit && (
              <button
                onClick={onEdit}
                className="text-gray-400 hover:text-blue-500"
                aria-label="Edit recommendation"
              >
                <PencilIcon className="h-5 w-5" />
              </button>
            )}
            {onDelete && (
              <button
                onClick={() => {
                  if (
                    window.confirm(
                      "Are you sure you want to delete this recommendation?"
                    )
                  ) {
                    onDelete();
                  }
                }}
                className="text-gray-400 hover:text-red-500"
                aria-label="Delete recommendation"
              >
                <TrashIcon className="h-5 w-5" />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
