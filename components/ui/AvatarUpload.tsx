"use client";

import { useState, useRef, useEffect } from "react";
import { Camera, X, Upload, User } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/components/auth";

interface AvatarUploadProps {
  onAvatarChange: (url: string) => void;
  currentAvatar?: string;
  className?: string;
}

export default function AvatarUpload({
  onAvatarChange,
  currentAvatar,
  className = "",
}: AvatarUploadProps) {
  const { user } = useAuth();
  const [avatar, setAvatar] = useState<string>(currentAvatar || "");
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ✅ Add this useEffect to sync with currentAvatar changes
  useEffect(() => {
    setAvatar(currentAvatar || "");
  }, [currentAvatar]);

  const compressImage = (
    file: File,
    maxWidth: number = 800,
    maxHeight: number = 800,
    quality: number = 0.8,
    maxSizeMB: number = 2
  ): Promise<File> => {
    return new Promise((resolve) => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d")!;
      const img = new Image();

      img.onload = () => {
        let { width, height } = img;
        const size = Math.min(width, height, maxWidth);
        
        canvas.width = size;
        canvas.height = size;

        const startX = (width - size) / 2;
        const startY = (height - size) / 2;

        ctx.drawImage(img, startX, startY, size, size, 0, 0, size, size);

        const tryCompress = (currentQuality: number) => {
          canvas.toBlob((blob) => {
            if (!blob) return;

            if (blob.size > maxSizeMB * 1024 * 1024 && currentQuality > 0.1) {
              tryCompress(currentQuality - 0.1);
              return;
            }

            const compressedFile = new File([blob], file.name, {
              type: "image/jpeg",
              lastModified: Date.now(),
            });

            resolve(compressedFile);
          }, "image/jpeg", currentQuality);
        };

        tryCompress(quality);
      };

      img.src = URL.createObjectURL(file);
    });
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Please select an image file");
      return;
    }

    setUploading(true);

    try {
      const compressedFile = await compressImage(file);
      const fileName = `${user?.id}/avatar-${Date.now()}.jpg`;

      const { data, error } = await supabase.storage
        .from("avatars")
        .upload(fileName, compressedFile, {
          cacheControl: "3600",
          upsert: true,
        });

      if (error) {
        console.error("Upload error:", error);
        alert(`Failed to upload avatar: ${error.message}`);
        return;
      }

      const { data: { publicUrl } } = supabase.storage
        .from("avatars")
        .getPublicUrl(fileName);

      setAvatar(publicUrl);
      onAvatarChange(publicUrl);

    } catch (error) {
      console.error("Error uploading avatar:", error);
      alert("Failed to upload avatar. Please try again.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const removeAvatar = () => {
    setAvatar("");
    onAvatarChange("");
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className={`flex flex-col items-center space-y-4 ${className}`}>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        disabled={uploading}
        className="hidden"
      />

      {/* Avatar Display */}
      <div className="relative group">
        <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-gray-200 bg-gray-100">
          {avatar ? (
            <img
              src={avatar}
              alt="Profile Avatar"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <User className="w-16 h-16 text-gray-400" />
            </div>
          )}
        </div>

        {/* Overlay buttons */}
        <div className="absolute inset-0 rounded-full bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <div className="flex space-x-2">
            <button
              onClick={triggerFileInput}
              disabled={uploading}
              className="p-2 bg-white rounded-full hover:bg-gray-100 transition-colors"
              title="Change Avatar"
            >
              {uploading ? (
                <Upload className="w-4 h-4 text-gray-600 animate-spin" />
              ) : (
                <Camera className="w-4 h-4 text-gray-600" />
              )}
            </button>
            
            {avatar && (
              <button
                onClick={removeAvatar}
                disabled={uploading}
                className="p-2 bg-white rounded-full hover:bg-gray-100 transition-colors"
                title="Remove Avatar"
              >
                <X className="w-4 h-4 text-red-600" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Upload text */}
      <div className="text-center">
        <button
          onClick={triggerFileInput}
          disabled={uploading}
          className="text-sm text-blue-600 hover:text-blue-700 font-medium disabled:opacity-50"
        >
          {uploading ? "Uploading..." : avatar ? "Change Avatar" : "Upload Avatar"}
        </button>
        <p className="text-xs text-gray-500 mt-1">
          Square images work best. Max 2MB.
        </p>
      </div>
    </div>
  );
}