"use client";

import { useState, useRef, useEffect } from "react";
import { Camera, Upload, Check, X, Lock } from "lucide-react";
import Image from "next/image";
import { toast } from "react-hot-toast";
import { supabase } from "@/lib/supabase";
import { useProperty } from "@/lib/hooks/useProperty";
import { useAuth } from "@/components/AuthProvider";

// Default presets available to all tenants
const DEFAULT_PRESETS = [
  {
    id: 'modern-house',
    name: 'Modern House',
    url: '/images/headers/presets/modern-house.jpg',
    thumbnail: '/images/headers/presets/thumbs/modern-house-thumb.jpg'
  },
  {
    id: 'cozy-cabin',
    name: 'Cozy Cabin',
    url: '/images/headers/presets/cozy-cabin.jpg',
    thumbnail: '/images/headers/presets/thumbs/cozy-cabin-thumb.jpg'
  },
  {
    id: 'beach-house',
    name: 'Beach House',
    url: '/images/headers/presets/beach-house.jpg',
    thumbnail: '/images/headers/presets/thumbs/beach-house-thumb.jpg'
  },
  {
    id: 'city-apartment',
    name: 'City Apartment',
    url: '/images/headers/presets/city-apartment.jpg',
    thumbnail: '/images/headers/presets/thumbs/city-apartment-thumb.jpg'
  }
];

// Tenant-specific presets
const TENANT_PRESETS: Record<string, typeof DEFAULT_PRESETS> = {
  'luxury-properties': [
    {
      id: 'luxury-villa',
      name: 'Luxury Villa',
      url: '/images/headers/presets/luxury/villa.jpg',
      thumbnail: '/images/headers/presets/luxury/thumbs/villa-thumb.jpg'
    }
  ],
  'vacation-rentals': [
    {
      id: 'beach-house',
      name: 'Beach House',
      url: '/images/headers/presets/vacation/beach.jpg',
      thumbnail: '/images/headers/presets/vacation/thumbs/beach-thumb.jpg'
    }
  ]
};

interface HeaderImageManagerProps {
  isOpen: boolean;
  onClose: () => void;
  currentImageUrl?: string;
  onImageUpdate: (imageUrl: string) => void;
}

export default function HeaderImageManager({ 
  isOpen, 
  onClose, 
  currentImageUrl,
  onImageUpdate 
}: HeaderImageManagerProps) {
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [customImageUrl, setCustomImageUrl] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [hasEditPermission, setHasEditPermission] = useState(false);
  const [loadingRole, setLoadingRole] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { currentProperty } = useProperty();
  const { user } = useAuth();

  // Check user's role for current property using simplified approach
  useEffect(() => {
    async function checkUserRole() {
      if (!user || !currentProperty) {
        setLoadingRole(false);
        return;
      }

      try {
        // Use existing tenant_users table structure for role checking
        const { data, error } = await supabase
          .from('tenant_users')
          .select('role, status')
          .eq('tenant_id', currentProperty.tenant_id)
          .eq('user_id', user.id)
          .eq('status', 'active')
          .single();

        if (error) {
          console.error('Error checking user role:', error);
          setUserRole(null);
          setHasEditPermission(false);
        } else {
          const role = data?.role || null;
          setUserRole(role);
          
          // Check if role has edit permission (owner, manager, admin)
          const canEdit = role && ['owner', 'manager', 'admin'].includes(role.toLowerCase());
          setHasEditPermission(canEdit);
        }
      } catch (error) {
        console.error('Role check error:', error);
        setUserRole(null);
        setHasEditPermission(false);
      } finally {
        setLoadingRole(false);
      }
    }

    checkUserRole();
  }, [user, currentProperty]);

  // Get tenant-specific presets
  const getAvailablePresets = () => {
    const tenantType = currentProperty?.tenant_type || 'default';
    return TENANT_PRESETS[tenantType] || DEFAULT_PRESETS;
  };

  if (!isOpen) return null;

  // Show loading state while checking permissions
  if (loadingRole) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Checking permissions...</p>
        </div>
      </div>
    );
  }

  // Show permission denied if user doesn't have access
  if (!hasEditPermission) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg max-w-md w-full p-6">
          <div className="text-center">
            <Lock className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">Access Restricted</h2>
            <p className="text-gray-600 mb-4">
              Only property owners and managers can change the header image.
            </p>
            <p className="text-sm text-gray-500 mb-6">
              Your current role: <span className="font-medium">{userRole || 'None'}</span>
            </p>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !currentProperty || !user) return;

    // Double-check permissions before upload
    if (!hasEditPermission) {
      toast.error('You do not have permission to upload images');
      return;
    }

    // Validate file
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be smaller than 5MB');
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      // Create tenant-isolated file path
      const fileExt = file.name.split('.').pop();
      const fileName = `header-${Date.now()}.${fileExt}`;
      
      // Multi-tenant file structure
      const filePath = `tenants/${currentProperty.tenant_id}/properties/${currentProperty.id}/headers/${fileName}`;

      // Upload to Supabase Storage with tenant isolation
      const { data, error } = await supabase.storage
        .from('property-images')
        .upload(filePath, file, {
          onUploadProgress: (progress) => {
            setUploadProgress((progress.loaded / progress.total) * 100);
          }
        });

      if (error) throw error;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('property-images')
        .getPublicUrl(filePath);

      setCustomImageUrl(publicUrl);
      setSelectedPreset(null);
      toast.success('Image uploaded successfully!');

    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload image');
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleSave = async () => {
    if (!currentProperty || !user || !hasEditPermission) {
      toast.error('You do not have permission to update this image');
      return;
    }

    try {
      let imageUrl = '';
      
      if (selectedPreset) {
        const preset = getAvailablePresets().find(p => p.id === selectedPreset);
        imageUrl = preset?.url || '';
      } else if (customImageUrl) {
        imageUrl = customImageUrl;
      }

      if (!imageUrl) {
        toast.error('Please select an image');
        return;
      }

      // Update property with tenant checks
      const { error } = await supabase
        .from('properties')
        .update({ 
          header_image_url: imageUrl,
          updated_at: new Date().toISOString(),
          updated_by: user.id 
        })
        .eq('id', currentProperty.id)
        .eq('tenant_id', currentProperty.tenant_id); // Ensure tenant isolation

      if (error) throw error;

      onImageUpdate(imageUrl);
      toast.success('Header image updated!');
      onClose();

    } catch (error) {
      console.error('Save error:', error);
      toast.error('Failed to save header image');
    }
  };

  const availablePresets = getAvailablePresets();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Choose Header Image</h2>
              <p className="text-sm text-gray-500">
                For {currentProperty?.name || 'this property'} • Role: {userRole}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Current Image Preview */}
          {(selectedPreset || customImageUrl) && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-3">Preview</h3>
              <div className="relative h-32 bg-gray-100 rounded-lg overflow-hidden">
                <Image
                  src={customImageUrl || availablePresets.find(p => p.id === selectedPreset)?.url || ''}
                  alt="Header preview"
                  fill
                  className="object-cover"
                />
              </div>
            </div>
          )}

          {/* Upload Custom Image */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-3">Upload Custom Image</h3>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
              
              {uploading ? (
                <div className="space-y-2">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                  <p className="text-sm text-gray-600">Uploading... {Math.round(uploadProgress)}%</p>
                </div>
              ) : (
                <div>
                  <Upload className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-lg font-medium text-gray-700 mb-1">
                    Upload your own image
                  </p>
                  <p className="text-sm text-gray-500 mb-4">
                    JPG, PNG, or WebP up to 5MB
                  </p>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Choose File
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Preset Images */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-3">
              Choose from Presets 
              <span className="text-sm font-normal text-gray-500 ml-2">
                ({availablePresets.length} available)
              </span>
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {availablePresets.map((preset) => (
                <div
                  key={preset.id}
                  onClick={() => setSelectedPreset(preset.id)}
                  className={`relative cursor-pointer rounded-lg overflow-hidden border-2 transition-all ${
                    selectedPreset === preset.id
                      ? 'border-blue-500 ring-2 ring-blue-200'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="aspect-video relative">
                    <Image
                      src={preset.thumbnail}
                      alt={preset.name}
                      fill
                      className="object-cover"
                    />
                    {selectedPreset === preset.id && (
                      <div className="absolute inset-0 bg-blue-600 bg-opacity-20 flex items-center justify-center">
                        <Check className="h-8 w-8 text-blue-600 bg-white rounded-full p-1" />
                      </div>
                    )}
                  </div>
                  <div className="p-3">
                    <p className="font-medium text-gray-900">{preset.name}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-4 border-t">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={!selectedPreset && !customImageUrl}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Save Header Image
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}