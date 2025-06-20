// components/system/UnifiedSessionManager.tsx
'use client';

import { useEffect } from 'react';

export default function UnifiedSessionManager() {
  useEffect(() => {
    console.log('🔧 UnifiedSessionManager initialized');

    // Global cleanup on page unload
    const handleBeforeUnload = () => {
      // Cancel any pending requests
      if (typeof window !== 'undefined') {
        // Clear timeouts and intervals
        const highestId = window.setTimeout(() => {}, 0);
        for (let i = 0; i < highestId; i++) {
          window.clearTimeout(i);
          window.clearInterval(i);
        }
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      console.log('🔧 UnifiedSessionManager cleaned up');
    };
  }, []); // Empty dependency array - only run once

  return null;
}
