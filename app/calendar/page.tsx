// app/calendar/page.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { PageErrorBoundary } from "@/components/PageErrorBoundary";
import { useAuth } from "@/components/auth";
import { useProperty } from "@/lib/hooks/useProperty";
import { debugLog } from "@/lib/utils/debug";
import StandardPageLayout from "@/components/layout/StandardPageLayout";
import StandardCard from "@/components/ui/StandardCard";
import Calendar from "./components/Calendar";
import { Calendar as CalendarIcon } from "lucide-react";

function CalendarPageContent() {
  const { user, loading: authLoading } = useAuth();
  const { currentProperty, loading: propertyLoading } = useProperty();
  const [newReservationTrigger, setNewReservationTrigger] = useState(0);
  const [isStuck, setIsStuck] = useState(false);
  const [isPageVisible, setIsPageVisible] = useState(true);
  const lastActivityRef = useRef(Date.now());
  const mountTimeRef = useRef(Date.now());

  useEffect(() => {
    debugLog("📅 Calendar page component mounted");
    mountTimeRef.current = Date.now();
    
    return () => {
      debugLog("📅 Calendar page unmounted");
    };
  }, []);

  // ✅ Enhanced visibility and focus handling for calendar
  useEffect(() => {
    const handleVisibilityChange = () => {
      const isVisible = document.visibilityState === 'visible';
      setIsPageVisible(isVisible);
      
      if (isVisible) {
        console.log("👁️ Calendar page became visible");
        lastActivityRef.current = Date.now();
        setIsStuck(false);
        
        // Reset calendar state if it's been hidden for a while
        const timeSinceMount = Date.now() - mountTimeRef.current;
        if (timeSinceMount > 60000) { // 1 minute
          console.log("🔄 Calendar: Refreshing after long absence");
          setNewReservationTrigger(prev => prev + 1);
        }
      } else {
        console.log("👁️ Calendar page became hidden");
      }
    };

    const handleFocus = () => {
      console.log("🔍 Calendar window focused");
      lastActivityRef.current = Date.now();
      setIsStuck(false);
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  // ✅ More lenient timeout detection
  useEffect(() => {
    const checkActivity = () => {
      const now = Date.now();
      const timeSinceActivity = now - lastActivityRef.current;
      
      // Only consider stuck if page is visible and truly inactive
      // Increased timeout to 2 minutes and only when page is visible
      if (isPageVisible && timeSinceActivity > 120000) {
        setIsStuck(true);
        console.warn("⚠️ Calendar: Page appears stuck, no activity for 2 minutes");
      }
    };

    const interval = setInterval(checkActivity, 10000); // Check every 10 seconds instead of 5

    // Reset activity on any user interaction
    const resetActivity = () => {
      lastActivityRef.current = Date.now();
      setIsStuck(false);
    };

    // ✅ More interaction types to detect activity
    const events = ["click", "keydown", "scroll", "mousemove", "touchstart"];
    events.forEach(event => {
      window.addEventListener(event, resetActivity, { passive: true });
    });

    return () => {
      clearInterval(interval);
      events.forEach(event => {
        window.removeEventListener(event, resetActivity);
      });
    };
  }, [isPageVisible]);

  // ✅ Auto-recovery mechanism
  useEffect(() => {
    if (isStuck && user && currentProperty) {
      console.log("🔧 Calendar: Attempting auto-recovery");
      
      // Try to auto-recover after 10 seconds
      const recoveryTimeout = setTimeout(() => {
        console.log("🔄 Calendar: Auto-recovering...");
        setIsStuck(false);
        lastActivityRef.current = Date.now();
        setNewReservationTrigger(prev => prev + 1);
      }, 10000);

      return () => clearTimeout(recoveryTimeout);
    }
  }, [isStuck, user, currentProperty]);

  // Loading state
  if (authLoading || propertyLoading) {
    return (
      <StandardPageLayout
        theme="dark"
        showHeader={false}
        showSideNav={true}
      >
        <StandardCard>
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
              <p className="text-gray-600">Loading calendar...</p>
            </div>
          </div>
        </StandardCard>
      </StandardPageLayout>
    );
  }

  // No user state
  if (!user) {
    return (
      <StandardPageLayout
        theme="dark"
        showHeader={false}
        showSideNav={true}
      >
        <StandardCard>
          <div className="text-center py-8">
            <CalendarIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">
              Authentication Required
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              Please sign in to view the calendar.
            </p>
          </div>
        </StandardCard>
      </StandardPageLayout>
    );
  }

  // ✅ Enhanced stuck warning with more options
  if (isStuck) {
    return (
      <StandardPageLayout
        theme="dark"
        showHeader={false}
        showSideNav={true}
      >
        <StandardCard>
          <div className="text-center py-8">
            <div className="text-gray-600 mb-4">
              <svg className="mx-auto h-12 w-12 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h3 className="text-lg font-medium mb-2">Calendar Loading Issue</h3>
              <p className="text-sm text-gray-500 mb-6">
                The calendar appears to be taking longer than usual to load.
              </p>
            </div>
            <div className="space-x-4">
              <button
                onClick={() => {
                  setIsStuck(false);
                  lastActivityRef.current = Date.now();
                  setNewReservationTrigger(prev => prev + 1);
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                Try Again
              </button>
              <button
                onClick={() => window.location.reload()}
                className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                Refresh Page
              </button>
            </div>
          </div>
        </StandardCard>
      </StandardPageLayout>
    );
  }

  // ✅ Main calendar with enhanced error recovery
  return (
    <StandardPageLayout
      theme="dark"
      showHeader={false}
      showSideNav={true}
    >
      <div className="space-y-6">
        <Calendar
          newReservationTrigger={newReservationTrigger}
          isManager={true}
          key={`calendar-${newReservationTrigger}`} // Force re-render when trigger changes
        />
      </div>
    </StandardPageLayout>
  );
}

export default function CalendarPage() {
  return (
    <PageErrorBoundary>
      <CalendarPageContent />
    </PageErrorBoundary>
  );
}
