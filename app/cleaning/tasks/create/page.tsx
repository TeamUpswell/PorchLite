"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import StandardPageLayout from "@/components/layout/StandardPageLayout";
import StandardCard from "@/components/ui/StandardCard";
import { ArrowRight, Book, Clock } from "lucide-react";

export default function CreateCleaningTaskRedirect() {
  const router = useRouter();

  useEffect(() => {
    // Add a small delay to show the redirect message
    const timer = setTimeout(() => {
      // Redirect directly to manual with cleaning focus
      router.replace('/manual?highlight=cleaning');
    }, 1500);

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <StandardPageLayout
      title="Create Cleaning Task"
      subtitle="Redirecting to documentation"
      breadcrumb={[
        { label: "Cleaning", href: "/cleaning" },
        { label: "Tasks", href: "/cleaning/tasks" },
        { label: "New Task" }
      ]}
    >
      <StandardCard>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center max-w-md">
            {/* Loading spinner */}
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            
            {/* Main message */}
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
              Redirecting to Cleaning Documentation
            </h3>
            
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              You're being redirected to the manual section with cleaning-specific information.
            </p>

            {/* Visual indicator */}
            <div className="flex items-center justify-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
              <Book className="h-4 w-4" />
              <ArrowRight className="h-4 w-4" />
              <span>Manual (Cleaning Section)</span>
            </div>

            {/* Fallback manual redirect */}
            <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                Taking too long?
              </p>
              <button
                onClick={() => router.replace('/manual?highlight=cleaning')}
                className="inline-flex items-center px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 dark:text-blue-400 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
              >
                <Book className="h-4 w-4 mr-2" />
                Go to Manual
              </button>
            </div>
          </div>
        </div>
      </StandardCard>
    </StandardPageLayout>
  );
}
