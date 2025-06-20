"use client";

import { useState, useRef } from "react";
import { Camera, X, Upload, Image as ImageIcon } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/components/auth/AuthProvider";
interface PhotoUploadProps {
  onPhotosChange: (urls: string[]) => void;
  existingPhotos: string[];
  maxPhotos: number;
}

export default function PhotoUpload({
  onPhotosChange,
  existingPhotos,
  maxPhotos,
}: PhotoUploadProps) {
  const { user } = useAuth();
  const [photos, setPhotos] = useState<string[]>(existingPhotos);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Add image compression function
  const compressImage = (
    file: File,
    maxWidth: number = 1920,
    maxHeight: number = 1920,
    quality: number = 0.8,
    maxSizeMB: number = 5
  ): Promise<File> => {
    return new Promise((resolve) => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d")!;
      const img = new Image();

      img.onload = () => {
        // Calculate new dimensions
        let { width, height } = img;

        if (width > height) {
          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = (width * maxHeight) / height;
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;

        // Draw and resize
        ctx.drawImage(img, 0, 0, width, height);

        // Convert to blob and check size
        const tryCompress = (currentQuality: number) => {
          canvas.toBlob(
            (blob) => {
              if (!blob) return;

              // If still too large and quality can be reduced, try again
              if (blob.size > maxSizeMB * 1024 * 1024 && currentQuality > 0.1) {
                tryCompress(currentQuality - 0.1);
                return;
              }

              // Create final file
              const compressedFile = new File([blob], file.name, {
                type: "image/jpeg",
                lastModified: Date.now(),
              });

              resolve(compressedFile);
            },
            "image/jpeg",
            currentQuality
          );
        };

        tryCompress(quality);
      };

      img.src = URL.createObjectURL(file);
    });
  };

  const handleFileSelect = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    if (photos.length + files.length > maxPhotos) {
      alert(`You can only upload up to ${maxPhotos} photos`);
      return;
    }

    setUploading(true);
    const newPhotos: string[] = [];

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];

        // Validate file type
        if (!file.type.startsWith("image/")) {
          alert(`File ${file.name} is not an image`);
          continue;
        }

        // Compress the image first
        console.log(`Original size: ${(file.size / 1024 / 1024).toFixed(2)}MB`);
        const compressedFile = await compressImage(file);
        console.log(
          `Compressed size: ${(compressedFile.size / 1024 / 1024).toFixed(2)}MB`
        );

        // Double check size after compression
        if (compressedFile.size > 5 * 1024 * 1024) {
          alert(
            `File ${file.name} is still too large after compression. Please try a smaller image.`
          );
          continue;
        }

        // Generate unique filename
        const fileExt = "jpg"; // Always use jpg after compression
        const fileName = `${user?.id}/${Date.now()}-${Math.random()
          .toString(36)
          .substring(2)}.${fileExt}`;

        // Upload compressed file to Supabase Storage
        const { data, error } = await supabase.storage
          .from("manual-photos")
          .upload(fileName, compressedFile, {
            cacheControl: "3600",
            upsert: false,
          });

        if (error) {
          console.error("Upload error:", error);
          alert(`Failed to upload ${file.name}: ${error.message}`);
          continue;
        }

        // Get public URL
        const {
          data: { publicUrl },
        } = supabase.storage.from("manual-photos").getPublicUrl(fileName);

        newPhotos.push(publicUrl);
      }

      const updatedPhotos = [...photos, ...newPhotos];
      setPhotos(updatedPhotos);
      onPhotosChange(updatedPhotos);
    } catch (error) {
      console.error("Error uploading photos:", error);
      alert("Failed to upload photos. Please try again.");
    } finally {
      setUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const removePhoto = async (photoUrl: string) => {
    try {
      // Extract filename from URL to delete from storage
      const urlParts = photoUrl.split("/");
      const fileName = urlParts[urlParts.length - 1];
      const fullPath = `${user?.id}/${fileName}`;

      // Delete from Supabase Storage
      const { error } = await supabase.storage
        .from("manual-photos")
        .remove([fullPath]);

      if (error) {
        console.error("Delete error:", error);
      }

      // Remove from state regardless of delete success
      const updatedPhotos = photos.filter((url) => url !== photoUrl);
      setPhotos(updatedPhotos);
      onPhotosChange(updatedPhotos);
    } catch (error) {
      console.error("Error removing photo:", error);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-4">
      {/* File input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleFileSelect}
        disabled={uploading}
        className="hidden"
      />

      {/* Upload button */}
      <button
        type="button"
        onClick={triggerFileInput}
        disabled={uploading || photos.length >= maxPhotos}
        className="w-full p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-gray-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <div className="flex flex-col items-center">
          {uploading ? (
            <Upload className="w-8 h-8 text-gray-400 mb-2 animate-spin" />
          ) : (
            <Camera className="w-8 h-8 text-gray-400 mb-2" />
          )}
          <span className="text-sm text-gray-600">
            {uploading
              ? "Uploading and compressing..."
              : `Click to upload photos (${photos.length}/${maxPhotos})`}
          </span>
          <span className="text-xs text-gray-400 mt-1">
            Images will be automatically resized to stay under 5MB
          </span>
        </div>
      </button>

      {/* Photo grid */}
      {photos.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {photos.map((photoUrl, index) => (
            <div key={index} className="relative group">
              <img
                src={photoUrl}
                alt={`Photo ${index + 1}`}
                className="w-full h-32 object-cover rounded-lg border"
              />
              <button
                onClick={() => removePhoto(photoUrl)}
                className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors opacity-0 group-hover:opacity-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Manual URL inputs */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          Or add photo URLs manually:
        </label>
        {existingPhotos.map((url, index) => (
          <div key={index} className="flex gap-2">
            <input
              type="url"
              value={url}
              onChange={(e) => {
                const newUrls = [...existingPhotos];
                newUrls[index] = e.target.value;
                onPhotosChange(newUrls);
              }}
              placeholder="Photo URL"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg"
            />
            <button
              onClick={() => {
                const newUrls = existingPhotos.filter((_, i) => i !== index);
                onPhotosChange(newUrls);
              }}
              className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
