import React from "react";
import Link from "next/link";
import Image from "next/image";

interface LocationCardProps {
  id: string;
  name: string;
  photoUrl?: string;
  description?: string;
  distance?: string;
  rating?: number;
}

export default function LocationCard({
  id,
  name,
  photoUrl,
  description,
  distance,
  rating,
}: LocationCardProps) {
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
      <div className="relative h-40 w-full">
        <Image
          src={photoUrl || "/images/placeholder-location.jpg"}
          alt={name || "Location"}
          fill
          className="object-cover rounded-t-lg"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          onError={() => {
            console.log("Image failed to load, using placeholder");
          }}
        />
      </div>

      <div className="p-4">
        <h3 className="font-medium text-lg">{name}</h3>

        {description && (
          <p className="text-gray-600 text-sm mt-1 line-clamp-2">
            {description}
          </p>
        )}

        <div className="flex justify-between items-center mt-3">
          {distance && (
            <span className="text-xs text-gray-500">{distance} away</span>
          )}

          {rating !== undefined && (
            <div className="flex items-center">
              <span className="text-yellow-500 mr-1">★</span>
              <span className="text-sm font-medium">{rating.toFixed(1)}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
