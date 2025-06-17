import { useState, useEffect, useCallback } from "react";

interface Section {
  id: string;
  name: string;
  description?: string;
  created_at?: string;
  updated_at?: string;
  // Add other section properties based on your API
}

interface UseSectionResult {
  section: Section | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useSection(sectionId: string): UseSectionResult {
  const [section, setSection] = useState<Section | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSection = useCallback(async () => {
    if (!sectionId) {
      setSection(null);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/sections/${sectionId}`);

      if (!response.ok) {
        throw new Error(`Failed to fetch section: ${response.status}`);
      }

      const data = await response.json();
      setSection(data);
    } catch (err) {
      console.error("Error fetching section:", err);
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, [sectionId]);

  useEffect(() => {
    fetchSection();
  }, [fetchSection]);

  return { section, loading, error, refetch: fetchSection };
}

// Default export for flexibility
export default useSection;

import { useSection } from '@/hooks/useSection';
