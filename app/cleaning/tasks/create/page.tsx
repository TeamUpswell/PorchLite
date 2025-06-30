"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import StandardCard from "@/components/ui/StandardCard";
import { ArrowRight, Book, Clock } from "lucide-react";

export default function CreateCleaningTaskRedirect() {
  const router = useRouter();

  useEffect(() => {
    // Add a small delay to show the redirect message
    const timer = setTimeout(() => {
      // Redirect directly to manual with cleaning focus
      router.replace("/manual?highlight=cleaning");
    }, 1500);

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <StandardCard
        title="Create Cleaning Task"
        subtitle="Redirecting to documentation"
        headerActions={
          <div className="flex items-center text-sm text-gray-600">
            <Clock className="h-4 w-4 mr-1" />
            Redirecting...
          </div>
        }
      />

      {/* Redirect Card */}
      <StandardCard>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center max-w-md">
            {/* Loading spinner */}
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>

            {/* Main message */}
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
              Redirecting to Cleaning Documentation
            </h3>

            <p className="text-gray-700 dark:text-gray-300 mb-6">
              You're being redirected to the manual section with
              cleaning-specific information.
            </p>

            {/* Visual indicator */}
            <div className="flex items-center justify-center space-x-2 text-sm text-gray-700 dark:text-gray-300">
              <Book className="h-4 w-4" />
              <ArrowRight className="h-4 w-4" />
              <span>Manual (Cleaning Section)</span>
            </div>

            {/* Fallback manual redirect */}
            <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
              <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">
                Taking too long?
              </p>
              <button
                onClick={() => router.replace("/manual?highlight=cleaning")}
                className="inline-flex items-center px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 dark:text-blue-400 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
              >
                <Book className="h-4 w-4 mr-2" />
                Go to Manual
              </button>
            </div>
          </div>
        </div>
      </StandardCard>

      {/* Info Card */}
      <StandardCard
        title="About Cleaning Task Creation"
        subtitle="Learn how to create and manage cleaning tasks"
      >
        <div className="space-y-4">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
              <span className="text-blue-600 font-medium text-sm">1</span>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 dark:text-white mb-1">
                Task Planning
              </h4>
              <p className="text-sm text-gray-700 dark:text-gray-300">
                Define cleaning requirements, schedules, and priority levels
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
              <span className="text-green-600 font-medium text-sm">2</span>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 dark:text-white mb-1">
                Assignment & Tracking
              </h4>
              <p className="text-sm text-gray-700 dark:text-gray-300">
                Assign tasks to team members and track progress in real-time
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0 w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
              <span className="text-purple-600 font-medium text-sm">3</span>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 dark:text-white mb-1">
                Quality Control
              </h4>
              <p className="text-sm text-gray-700 dark:text-gray-300">
                Set quality standards and conduct reviews to ensure standards
                are met
              </p>
            </div>
          </div>
        </div>
      </StandardCard>
    </div>
  );
}
