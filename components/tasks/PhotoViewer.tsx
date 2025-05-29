"use client";

import { useState } from "react";
import { XIcon } from "lucide-react";

interface PhotoViewerProps {
  photos: string[];
  isOpen: boolean;
  onClose: () => void;
}

export default function PhotoViewer({ photos, isOpen, onClose }: PhotoViewerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  if (!isOpen || !photos.length) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center p-4 z-50">
      <div className="relative w-full max-w-4xl">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-white hover:text-gray-300 z-10"
        >
          <XIcon className="h-8 w-8" />
        </button>
        
        <div className="bg-white rounded-lg overflow-hidden">
          <img
            src={photos[currentIndex]}
            alt={`Photo ${currentIndex + 1}`}
            className="w-full max-h-[70vh] object-contain"
          />
          
          {photos.length > 1 && (
            <div className="p-4 bg-gray-100">
              <div className="flex items-center justify-between">
                <button
                  onClick={() => setCurrentIndex(prev => 
                    prev > 0 ? prev - 1 : photos.length - 1
                  )}
                  className="px-3 py-1 bg-gray-200 rounded-lg hover:bg-gray-300"
                >
                  Previous
                </button>
                
                <span className="text-sm text-gray-600">
                  {currentIndex + 1} of {photos.length}
                </span>
                
                <button
                  onClick={() => setCurrentIndex(prev => 
                    prev < photos.length - 1 ? prev + 1 : 0
                  )}
                  className="px-3 py-1 bg-gray-200 rounded-lg hover:bg-gray-300"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}