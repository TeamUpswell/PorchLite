"use client";

import { useState, useEffect, useCallback } from "react";
import { BookOpen } from "lucide-react";
import Header from "@/components/layout/Header";
import PageContainer from "@/components/layout/PageContainer";
import StandardCard from "@/components/ui/StandardCard";
import { useAuth } from "@/components/auth";
import { supabase } from "@/lib/supabase";

// ✅ Fixed: Conditional debug utility to avoid ESLint console errors
const debug = (message: string, ...args: any[]) => {
  if (process.env.NODE_ENV === "development") {
    // eslint-disable-next-line no-console
    console.log(message, ...args);
  }
};

interface GuestBookEntry {
  id: string;
  message: string;
  guest_name: string;
  created_at: string;
}

export default function GuestBookPage() {
  const { user } = useAuth();
  const [entries, setEntries] = useState<GuestBookEntry[]>([]);
  const [loading, setLoading] = useState(true);

  // ✅ Fixed: Moved fetchGuestBookEntries before debugAllEntries to avoid dependency issues
  const fetchGuestBookEntries = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("guest_book")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setEntries(data || []);
    } catch (error) {
      debug("Error fetching guest book entries:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  // ✅ Fixed: Use useCallback to stabilize function references
  const debugAllEntries = useCallback(() => {
    debug("All guest book entries:", entries);
  }, [entries]);

  // ✅ Fixed: Simplified useEffect - only fetch data, debug separately
  useEffect(() => {
    fetchGuestBookEntries();
  }, [fetchGuestBookEntries]);

  // ✅ Fixed: Separate useEffect for debugging to avoid circular dependencies
  useEffect(() => {
    if (entries.length > 0) {
      debugAllEntries();
    }
  }, [debugAllEntries, entries.length]);

  if (loading) {
    return (
      <div className="p-6">
        <Header />
        <PageContainer>
          <StandardCard>
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-2">Loading...</span>
            </div>
          </StandardCard>
        </PageContainer>
      </div>
    );
  }

  return (
    <div className="p-6">
      <Header />
      <PageContainer>
        <div className="space-y-6">
          <StandardCard
            title="Guest Book"
            subtitle="Messages from our guests"
            icon={<BookOpen className="h-6 w-6" />}
          >
            <div className="space-y-4">
              {entries.length > 0 ? (
                entries.map((entry) => (
                  <div key={entry.id} className="border rounded-lg p-4">
                    <p className="text-gray-700 mb-2">{entry.message}</p>
                    <div className="text-sm text-gray-500">
                      <span>By: {entry.guest_name}</span>
                      <span className="mx-2">•</span>
                      <span>
                        {new Date(entry.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <BookOpen className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <p>No guest book entries yet</p>
                  <p className="text-sm mt-1">
                    Be the first to leave a message!
                  </p>
                </div>
              )}
            </div>
          </StandardCard>
        </div>
      </PageContainer>
    </div>
  );
}
