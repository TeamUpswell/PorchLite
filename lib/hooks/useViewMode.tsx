"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/components/auth";
import { useProperty } from "@/lib/hooks/useProperty";

type ViewMode = "manager" | "family" | "guest";

export function useViewMode() {
  const { user } = useAuth();
  const { currentTenant } = useProperty();

  // ✅ Handle missing tenant gracefully
  const role = currentTenant?.role || "guest";

  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    if (typeof window !== "undefined") {
      const savedMode = localStorage.getItem("viewMode") as ViewMode | null;
      if (savedMode && ["manager", "family", "guest"].includes(savedMode)) {
        return savedMode;
      }
    }
    return role === "owner" || role === "manager"
      ? "manager"
      : (role as ViewMode);
  });

  useEffect(() => {
    const savedMode = localStorage.getItem("viewMode") as ViewMode | null;
    if (savedMode && ["manager", "family", "guest"].includes(savedMode)) {
      setViewMode(savedMode);
    }

    const handleViewModeChange = (event: CustomEvent) => {
      setViewMode(event.detail.mode);
    };

    window.addEventListener(
      "viewModeChanged",
      handleViewModeChange as EventListener
    );

    return () => {
      window.removeEventListener(
        "viewModeChanged",
        handleViewModeChange as EventListener
      );
    };
  }, []);

  useEffect(() => {
    const savedMode = localStorage.getItem("viewMode");
    if (!savedMode) {
      const defaultMode =
        role === "owner" || role === "manager" ? "manager" : (role as ViewMode);
      setViewMode(defaultMode);
      localStorage.setItem("viewMode", defaultMode);
    }
  }, [role]);

  const setGlobalViewMode = (mode: ViewMode) => {
    setViewMode(mode);
    localStorage.setItem("viewMode", mode);

    window.dispatchEvent(
      new CustomEvent("viewModeChanged", {
        detail: { mode },
      })
    );
  };

  const isManagerView = viewMode === "manager";
  const isFamilyView = viewMode === "family";
  const isGuestView = viewMode === "guest";
  const isViewingAsLowerRole = viewMode !== role;

  return {
    viewMode,
    setGlobalViewMode,
    isManagerView,
    isFamilyView,
    isGuestView,
    isViewingAsLowerRole,
    actualUserRole: role,
  };
}
