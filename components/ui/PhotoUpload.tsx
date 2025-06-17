"use client";

import { useState } from "react";
import { PhotoIcon, TrashIcon, EyeIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { supabase } from "@/lib/supabase";
import { toast } from "react-hot-toast";

interface PhotoUploadProps {
  photos: string[];
  onPhotosChange: (photos: string[]) => void;
  storageBucket: string;
  maxPhotos?: number;
  maxSizeMB?: number;
  allowPreview?: boolean;
  gridCols?: "2" | "3" | "4" | "5";
  label?: string;
  required?: boolean;
}

export default function PhotoUpload({
  photos,
  onPhotosChange,
  storageBucket,
  maxPhotos = 10,
  maxSizeMB = 5,
  allowPreview = true,
  gridCols = "3",
  label = "Photos",
  required = false,
}: PhotoUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [previewPhoto, setPreviewPhoto] = useState<string | null>(null);

  const handleUpload = async (files: FileList) => {
    if (!files.length) return;

    if (photos.length + files.length > maxPhotos) {
      toast.error(`Maximum ${maxPhotos} photos allowed`);
      return;
    }

    setUploading(true);
    const uploadedUrls: string[] = [];

    try {
      for (const file of Array.from(files)) {
        // Validate file type
        if (!file.type.startsWith("image/")) {
          toast.error(`${file.name} is not an image file`);
          continue;
        }

        // Validate file size
        if (file.size > maxSizeMB * 1024 * 1024) {
          toast.error(`${file.name} exceeds ${maxSizeMB}MB limit`);
          continue;
        }

        // Generate unique filename
        const fileExt = file.name.split(".").pop();
        const fileName = `${Date.now()}-${Math.random()
          .toString(36)
          .substring(2)}.${fileExt}`;

        // Upload to Supabase Storage
        const { data, error } = await supabase.storage
          .from(storageBucket)
          .upload(fileName, file);

        if (error) {
          console.error("Upload error:", error);
          toast.error(`Failed to upload ${file.name}`);
          continue;
        }

        // Get public URL
        const { data: urlData } = supabase.storage
          .from(storageBucket)
          .getPublicUrl(data.path);

        uploadedUrls.push(urlData.publicUrl);
      }

      onPhotosChange([...photos, ...uploadedUrls]);

      if (uploadedUrls.length > 0) {
        toast.success(`Uploaded ${uploadedUrls.length} photo(s)`);
      }
    } catch (error) {
      console.error("Photo upload error:", error);
      toast.error("Failed to upload photos");
    } finally {
      setUploading(false);
    }
  };

  const removePhoto = async (photoUrl: string) => {
    try {
      // Extract filename from URL to delete from storage
      const urlParts = photoUrl.split("/");
      const fileName = urlParts[urlParts.length - 1];

      if (fileName && fileName.includes(".")) {
        await supabase.storage.from(storageBucket).remove([fileName]);
      }

      // Remove from photos array
      onPhotosChange(photos.filter((url) => url !== photoUrl));
      toast.success("Photo removed");
    } catch (error) {
      console.error("Error removing photo:", error);
      toast.error("Failed to remove photo");
    }
  };

  const gridColsClass = {
    "2": "grid-cols-2",
    "3": "grid-cols-2 md:grid-cols-3",
    "4": "grid-cols-2 md:grid-cols-3 lg:grid-cols-4",
    "5": "grid-cols-2 md:grid-cols-3 lg:grid-cols-5",
  };

  return (
    <div className="space-y-4">
      {/* Label */}
      <label className="block text-sm font-medium text-gray-700">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
        {!required && <span className="text-gray-400 ml-1">(optional)</span>}
      </label>

      {/* Upload Area */}
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 hover:border-gray-400 transition-colors">
        <input
          type="file"
          id="photo-upload"
          multiple
          accept="image/*"
          onChange={(e) => e.target.files && handleUpload(e.target.files)}
          className="hidden"
          disabled={uploading || photos.length >= maxPhotos}
        />

        <label
          htmlFor="photo-upload"
          className={`cursor-pointer flex flex-col items-center justify-center ${
            uploading || photos.length >= maxPhotos
              ? "opacity-50 cursor-not-allowed"
              : ""
          }`}
        >
          <PhotoIcon className="h-12 w-12 text-gray-400 mb-2" />
          <span className="text-sm text-gray-600 font-medium mb-1">
            {uploading
              ? "Uploading..."
              : photos.length >= maxPhotos
              ? "Maximum photos reached"
              : "Click to upload photos"}
          </span>
          <span className="text-xs text-gray-400 text-center">
            PNG, JPG up to {maxSizeMB}MB each
            <br />({photos.length}/{maxPhotos} photos)
          </span>
        </label>
      </div>

      {/* Photo Grid */}
      {photos.length > 0 && (
        <div className={`grid ${gridColsClass[gridCols]} gap-4`}>
          {photos.map((photoUrl, index) => (
            <div key={index} className="relative group">
              <img
                src={photoUrl}
                alt={`Photo ${index + 1}`}
                className="w-full h-32 object-cover rounded-lg border border-gray-200 shadow-sm"
              />

              {/* Overlay with actions */}
              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-200 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100">
                <div className="flex space-x-2">
                  {allowPreview && (
                    <button
                      type="button"
                      onClick={() => setPreviewPhoto(photoUrl)}
                      className="bg-blue-500 text-white rounded-full p-2 hover:bg-blue-600 transition-colors shadow-lg"
                    >
                      <EyeIcon className="h-4 w-4" />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => removePhoto(photoUrl)}
                    className="bg-red-500 text-white rounded-full p-2 hover:bg-red-600 transition-colors shadow-lg"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Photo Preview Modal */}
      {previewPhoto && (
        <div
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
          onClick={() => setPreviewPhoto(null)}
        >
          <div className="relative max-w-4xl max-h-full">
            <img
              src={previewPhoto}
              alt="Preview"
              className="max-w-full max-h-full object-contain"
            />
            <button
              onClick={() => setPreviewPhoto(null)}
              className="absolute top-4 right-4 bg-white text-gray-800 rounded-full p-2 hover:bg-gray-100"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
