// lib/hooks/useAvatarSync.ts - Global avatar synchronization
import { useEffect, useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
export function useAvatarSync() {
  const { profileData, refreshProfile } = useAuth();
  const [avatarUrl, setAvatarUrl] = useState<string>("");

  // Update local avatar when profile changes
  useEffect(() => {
    if (profileData?.avatar_url) {
      const timestamp = Date.now();
      const separator = profileData.avatar_url.includes("?") ? "&" : "?";
      const urlWithTimestamp = `${profileData.avatar_url}${separator}t=${timestamp}`;
      setAvatarUrl(urlWithTimestamp);
    } else {
      setAvatarUrl("/default-avatar.png");
    }
  }, [profileData?.avatar_url]);

  // Listen for avatar updates from other components
  useEffect(() => {
    const handleAvatarUpdate = (event: CustomEvent) => {
      console.log("🔄 useAvatarSync: Avatar updated:", event.detail);
      if (event.detail?.avatarUrl) {
        setAvatarUrl(`${event.detail.avatarUrl}?t=${Date.now()}`);
      }
    };

    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === "avatar_updated") {
        console.log("🔄 useAvatarSync: Storage change detected, refreshing...");
        refreshProfile();
      }
    };

    window.addEventListener(
      "avatarUpdated",
      handleAvatarUpdate as EventListener
    );
    window.addEventListener("storage", handleStorageChange);

    return () => {
      window.removeEventListener(
        "avatarUpdated",
        handleAvatarUpdate as EventListener
      );
      window.removeEventListener("storage", handleStorageChange);
    };
  }, [refreshProfile]);

  return avatarUrl;
}
