"use client";

export const dynamic = "force-dynamic";
export const revalidate = 0;

import { useState, useEffect } from "react";
import StandardPageLayout from "@/components/layout/StandardPageLayout";
import StandardCard from "@/components/ui/StandardCard";

export default function AdminManualPage() {
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(false);
  }, []);

  return (
    <StandardPageLayout title="Admin Manual Management">
      <StandardCard>
        <div className="p-6">
          <h2 className="text-xl font-semibold mb-4">Manual Administration</h2>
          <p className="text-gray-600">
            Manage all property manuals from here.
          </p>
        </div>
      </StandardCard>
    </StandardPageLayout>
  );
}
