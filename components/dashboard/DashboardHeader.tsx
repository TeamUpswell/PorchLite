"use client";

import { useState, useEffect } from "react";
import { Camera } from "lucide-react";
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

  const currentHeaderImage =
    currentProperty?.header_image_url ||
    "/images/headers/presets/modern-house.jpg";

  // Check user's role to determine edit permissions
  useEffect(() => {
    async function checkUserRole() {
      if (!user || !currentProperty) {
        setLoadingRole(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from("tenant_users")
          .select("role, status")
          .eq("tenant_id", currentProperty.tenant_id)
          .eq("user_id", user.id)
          .eq("status", "active")
          .single();

        if (!error && data) {
          setUserRole(data.role);
        }
      } catch (error) {
        console.error("Error checking user role:", error);
      } finally {
        setLoadingRole(false);
      }
    }

    checkUserRole();
  }, [user, currentProperty]);

  const handleImageUpdate = async (newImageUrl: string) => {
    if (!currentProperty) {
      console.error("No current property selected");
      return;
    }

    try {
      // Direct Supabase update since updateProperty might not exist
      const { error } = await supabase
        .from("properties")
        .update({ header_image_url: newImageUrl })
        .eq("id", currentProperty.id);

      if (error) {
        console.error("Error updating property image:", error);
        return;
      }

      console.log("✅ Header image updated successfully:", newImageUrl);

      // Refresh the property data to show the new image
      window.location.reload();
    } catch (error) {
      console.error("Error in handleImageUpdate:", error);
    }
  };

  // Check if user can edit (owner, manager, or admin)
  const canEdit = userRole && ["owner", "manager", "admin"].includes(userRole);

  return (
    <>
      <div className="relative h-64 rounded-lg overflow-hidden group">
        <Image
          src={currentHeaderImage}
          alt="Property header"
          fill
          className="object-cover"
          priority
          onError={(e) => {
            e.currentTarget.src = "/images/headers/presets/modern-house.jpg";
          }}
        />

        <div className="absolute inset-0 bg-black/50" />

        <div className="relative z-10 h-full flex flex-col justify-center items-center text-white">
          {children}
        </div>

        {/* Camera button - only show for users with edit permissions */}
        {canEdit && !loadingRole && (
          <button
            onClick={() => setShowImageManager(true)}
            className="absolute top-4 right-4 bg-black/50 hover:bg-black/70 text-white p-2 rounded-lg transition-all duration-200 z-20"
            title="Change header image"
          >
            <Camera className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Header Image Manager Modal */}
      <HeaderImageManager
        isOpen={showImageManager}
        onClose={() => setShowImageManager(false)}
        onImageUpdate={handleImageUpdate}
        currentImageUrl={currentHeaderImage}
      />
    </>
  );
}
