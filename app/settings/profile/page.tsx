"use client";

export const dynamic = "force-dynamic";
export const revalidate = 0;

import { useState, useEffect } from "react";
import { useAuth } from "@/components/auth";
import { supabase } from "@/lib/supabase";

export default function ProfilePage() {
  const { user } = useAuth();

  const handleAvatarUpload = async (file: File) => {
    if (!user?.id) {
      console.error("User not authenticated");
      return;
    }

    const fileExt = file.name.split(".").pop();
    const fileName = `${user.id}.${fileExt}`;

    const { error } = await supabase.storage
      .from("avatars")
      .upload(fileName, file, {
        cacheControl: "604800",
        upsert: true,
      });

    if (error) {
      console.error("Error uploading avatar:", error.message);
      return false;
    }

    return true;
  };

  return <div>Profile page content</div>;
}
