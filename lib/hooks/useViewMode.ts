"use client";

import { useState, useEffect } from "react";

type ViewMode = "grid" | "list" | "card";

export function useViewMode(defaultMode: ViewMode = "grid") {
  const [viewMode, setViewMode] = useState<ViewMode>(defaultMode);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("viewMode") as ViewMode;
      if (saved && ["grid", "list", "card"].includes(saved)) {
        setViewMode(saved);
      }
    }
  }, []);

  const updateViewMode = (mode: ViewMode) => {
    setViewMode(mode);
    if (typeof window !== "undefined") {
      localStorage.setItem("viewMode", mode);
    }
  };

  return {
    viewMode,
    setViewMode: updateViewMode,
    isGrid: viewMode === "grid",
    isList: viewMode === "list",
    isCard: viewMode === "card",
  };
}
