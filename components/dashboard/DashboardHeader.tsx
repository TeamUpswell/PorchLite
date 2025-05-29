"use client";

import { useState, useEffect } from "react";
import { Camera, Settings } from "lucide-react";
import Image from "next/image";
import { useProperty } from "@/lib/hooks/useProperty";
import { useAuth } from "@/components/AuthProvider";
import { supabase } from "@/lib/supabase";
import HeaderImageManager from "./HeaderImageManager";

interface DashboardHeaderProps {
  children?: React.ReactNode;
}

export default function DashboardHeader({ children }: DashboardHeaderProps) {
  const [showImageManager, setShowImageManager] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loadingRole, setLoadingRole] = useState(true);
  
  const { currentProperty, updateProperty } = useProperty();
  const { user } = useAuth();
  
  const currentHeaderImage = currentProperty?.header_image_url || '/images/headers/presets/modern-house.jpg';

  // Check user's role for current property
  useEffect(() => {
    async function checkUserRole() {
      if (!user || !currentProperty) {
        setLoadingRole(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('property_users')
          .select('role')
          .eq('property_id', currentProperty.id)
          .eq('user_id', user.id)
          .single();

        if (error) {
          console.error('Error checking user role:', error);
          setUserRole(null);
        } else {
          setUserRole(data?.role || null);
        }
      } catch (error) {
        console.error('Role check error:', error);
        setUserRole(null);
      } finally {
        setLoadingRole(false);
      }
    }

    checkUserRole();
  }, [user, currentProperty]);

  const handleImageUpdate = async (newImageUrl: string) => {
    if (currentProperty) {
      await updateProperty(currentProperty.id, { header_image_url: newImageUrl });
    }
  };

  // Check if user can edit (owners and managers only)
  const canEdit = userRole && ['owner', 'manager'].includes(userRole.toLowerCase());

  return (
    <>
      <div className="relative h-64 rounded-lg overflow-hidden group">
        {/* Header Image */}
        <Image
          src={currentHeaderImage}
          alt="Property header"
          fill
          className="object-cover"
          priority
          onError={(e) => {
            e.currentTarget.src = '/images/headers/presets/modern-house.jpg';
          }}
        />
        
        {/* Overlay */}
        <div className="absolute inset-0 bg-black/50" />
        
        {/* Content */}
        <div className="relative z-10 h-full flex flex-col justify-center items-center text-white">
          {children}
        </div>
        
        {/* Edit Button - Only show for owners and managers */}
        {canEdit && !loadingRole && (
          <button
            onClick={() => setShowImageManager(true)}
            className="absolute top-4 right-4 bg-black/50 hover:bg-black/70 text-white p-2 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
            title="Change header image (Owner/Manager only)"
          >
            <Camera className="h-5 w-5" />
          </button>
        )}

        {/* Role indicator for non-editors */}
        {!canEdit && !loadingRole && userRole && (
          <div className="absolute top-4 right-4 bg-gray-600/80 text-white px-2 py-1 rounded text-xs opacity-0 group-hover:opacity-100 transition-opacity">
            Role: {userRole}
          </div>
        )}
      </div>

      {/* Image Manager Modal - Only render if user can edit */}
      {canEdit && (
        <HeaderImageManager
          isOpen={showImageManager}
          onClose={() => setShowImageManager(false)}
          currentImageUrl={currentHeaderImage}
          onImageUpdate={handleImageUpdate}
        />
      )}
    </>
  );
}