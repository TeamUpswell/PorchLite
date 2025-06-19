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
  const [timedOut, setTimedOut] = useState(false); // ✅ Added timedOut state
  const lastActivityRef = useRef(Date.now());
  const mountTimeRef = useRef(Date.now());

  useEffect(() => {
    debugLog("📅 Calendar page component mounted");
    mountTimeRef.current = Date.now();
    
    return () => {
      debugLog("📅 Calendar page unmounted");
    };
  }, []);

  // ✅ Enhanced retry function for calendar data
  const retryCalendarData = () => {
    setTimedOut(false);
    setIsStuck(false);
    lastActivityRef.current = Date.now();
    setNewReservationTrigger(prev => prev + 1);
    debugLog("🔄 Calendar: Manual retry triggered");
  };

  // ✅ Enhanced visibility and focus handling for calendar
  useEffect(() => {
    const handleVisibilityChange = () => {
      const isVisible = document.visibilityState === 'visible';
      setIsPageVisible(isVisible);
      
      if (isVisible) {
        console.log("👁️ Calendar page became visible");
        lastActivityRef.current = Date.now();
        setIsStuck(false);
        setTimedOut(false); // ✅ Reset timeout on visibility
        
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
      setTimedOut(false); // ✅ Reset timeout on focus
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
      setTimedOut(false); // ✅ Reset timeout on activity
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
        setTimedOut(false);
        lastActivityRef.current = Date.now();
        setNewReservationTrigger(prev => prev + 1);
      }, 10000);

      return () => clearTimeout(recoveryTimeout);
    }
  }, [isStuck, user, currentProperty]);

  // Just use a simple loading state in the calendar page
  if (authLoading || propertyLoading) {
    return (
      <StandardPageLayout title="Calendar">
        <div className="flex items-center justify-center p-8">
          <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-blue-500 mr-3"></div>
          <span>Loading calendar...</span>
        </div>
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

  // ✅ Enhanced stuck warning with LoadingWithTimeout integration
  if (isStuck) {
    return (
      <StandardPageLayout
        theme="dark"
        showHeader={false}
        showSideNav={true}
      >
        <LoadingWithTimeout
          isLoading={true}
          onRetry={retryCalendarData}
          message="Calendar appears to be stuck. This might be due to browser inactivity."
          showRetryButton={true}
        />
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