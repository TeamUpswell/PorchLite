"use client";

import { useState, useRef } from "react";
import { Camera, X, Upload, Image as ImageIcon } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/components/AuthProvider";

interface PhotoUploadProps {
  onPhotosChange: (urls: string[]) => void;
  existingPhotos: string[];
  maxPhotos: number;
}

export default function PhotoUpload({ 
  onPhotosChange, 
  existingPhotos, 
  maxPhotos 
}: PhotoUploadProps) {
  const { user } = useAuth();
  const [photos, setPhotos] = useState<string[]>(existingPhotos);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
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
        if (!file.type.startsWith('image/')) {
          alert(`File ${file.name} is not an image`);
          continue;
        }

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
          alert(`File ${file.name} is too large. Max size is 5MB`);
          continue;
        }

        // Generate unique filename
        const fileExt = file.name.split('.').pop();
        const fileName = `${user?.id}/${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;

        // Upload to Supabase Storage
        const { data, error } = await supabase.storage
          .from('manual-photos')
          .upload(fileName, file, {
            cacheControl: '3600',
            upsert: false
          });

        if (error) {
          console.error('Upload error:', error);
          alert(`Failed to upload ${file.name}: ${error.message}`);
          continue;
        }

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('manual-photos')
          .getPublicUrl(fileName);

        newPhotos.push(publicUrl);
      }

      const updatedPhotos = [...photos, ...newPhotos];
      setPhotos(updatedPhotos);
      onPhotosChange(updatedPhotos);

    } catch (error) {
      console.error('Error uploading photos:', error);
      alert('Failed to upload photos. Please try again.');
    } finally {
      setUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const removePhoto = async (photoUrl: string) => {
    try {
      // Extract filename from URL to delete from storage
      const urlParts = photoUrl.split('/');
      const fileName = urlParts[urlParts.length - 1];
      const fullPath = `${user?.id}/${fileName}`;

      // Delete from Supabase Storage
      const { error } = await supabase.storage
        .from('manual-photos')
        .remove([fullPath]);

      if (error) {
        console.error('Delete error:', error);
      }

      // Remove from state regardless of delete success
      const updatedPhotos = photos.filter(url => url !== photoUrl);
      setPhotos(updatedPhotos);
      onPhotosChange(updatedPhotos);

    } catch (error) {
      console.error('Error removing photo:', error);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-2">
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
        </div>
      ))}
    </div>
  );
}