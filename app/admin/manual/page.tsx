"use client";

// REMOVE ANY EXISTING revalidate CONFIGS
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";
export const runtime = "nodejs";

import { useState, useEffect } from "react";
import ProtectedPageWrapper from "@/components/layout/ProtectedPageWrapper";
import StandardCard from "@/components/ui/StandardCard";
import { BookOpen } from "lucide-react";

export default function AdminManualPage() {
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(false);
  }, []);

  return (
    <ProtectedPageWrapper requiredRole="admin">
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex items-center space-x-3">
          <BookOpen className="h-6 w-6 text-blue-600" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Admin Manual Management
            </h1>
            <p className="text-gray-600">
              Manage all property manuals from here
            </p>
          </div>
        </div>

        <StandardCard title="Manual Administration">
          <div className="space-y-4">
            <p className="text-gray-600">
              Manage all property manuals from here.
            </p>

            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="text-gray-500 mt-2">Loading manuals...</p>
              </div>
            ) : (
              <div className="text-center py-8">
                <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">
                  Manual management features coming soon
                </p>
              </div>
            )}
          </div>
        </StandardCard>
      </div>
    </ProtectedPageWrapper>
  );
}
