"use client";

import { useState, useRef } from "react";
import { Camera, Upload, X } from "lucide-react";
import Image from "next/image";

interface PhotosStepProps {
  formData: {
    photos: File[];
    photoCaptions: string[];
  };
  updateFormData: (updates: any) => void;
}

export default function PhotosStep({ formData, updateFormData }: PhotosStepProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previews, setPreviews] = useState<string[]>([]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const newPhotos = [...formData.photos, ...files];
    const newCaptions = [...formData.photoCaptions, ...Array(files.length).fill('')];
    
    updateFormData({ 
      photos: newPhotos,
      photoCaptions: newCaptions
    });

    // Create previews
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviews(prev => [...prev, e.target?.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removePhoto = (index: number) => {
    const newPhotos = formData.photos.filter((_, i) => i !== index);
    const newCaptions = formData.photoCaptions.filter((_, i) => i !== index);
    const newPreviews = previews.filter((_, i) => i !== index);
    
    updateFormData({ 
      photos: newPhotos,
      photoCaptions: newCaptions
    });
    setPreviews(newPreviews);
  };

  const updateCaption = (index: number, caption: string) => {
    const newCaptions = [...formData.photoCaptions];
    newCaptions[index] = caption;
    updateFormData({ photoCaptions: newCaptions });
  };

  return (
    <div className="space-y-6 p-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Share your photos</h2>
        <p className="text-gray-600">Upload photos from your stay to share with future guests</p>
      </div>

      {/* Upload Area */}
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
        />
        <Camera className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center mx-auto"
        >
          <Upload className="h-4 w-4 mr-2" />
          Upload Photos
        </button>
        <p className="text-sm text-gray-500 mt-2">JPG, PNG up to 10MB each</p>
      </div>

      {/* Photo Previews */}
      {formData.photos.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900">Your Photos ({formData.photos.length})</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {formData.photos.map((photo, index) => (
              <div key={index} className="border border-gray-200 rounded-lg overflow-hidden">
                <div className="relative aspect-video">
                  {previews[index] && (
                    <Image
                      src={previews[index]}
                      alt={`Preview ${index + 1}`}
                      fill
                      className="object-cover"
                    />
                  )}
                  <button
                    type="button"
                    onClick={() => removePhoto(index)}
                    className="absolute top-2 right-2 bg-red-600 text-white p-1 rounded-full hover:bg-red-700"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <div className="p-3">
                  <input
                    type="text"
                    value={formData.photoCaptions[index] || ''}
                    onChange={(e) => updateCaption(index, e.target.value)}
                    placeholder="Add a caption (optional)"
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}