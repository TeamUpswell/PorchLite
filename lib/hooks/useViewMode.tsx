"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/components/auth';

type ViewMode = 'manager' | 'family' | 'guest';

export function useViewMode() {
  const { userRole, hasPermission, canAccess } = useAuth();
  const [viewMode, setViewMode] = useState<ViewMode>(userRole || 'guest');

  useEffect(() => {
    // Check localStorage for saved view mode
    const savedMode = localStorage.getItem('viewMode') as ViewMode | null;
    if (savedMode && isValidViewMode(savedMode)) {
      setViewMode(savedMode);
    } else if (userRole) {
      setViewMode(userRole);
    }

    // Listen for view mode changes
    const handleViewModeChange = (event: CustomEvent) => {
      setViewMode(event.detail.mode);
    };

    window.addEventListener('viewModeChanged', handleViewModeChange as EventListener);
    
    return () => {
      window.removeEventListener('viewModeChanged', handleViewModeChange as EventListener);
    };
  }, [userRole]);

  const isValidViewMode = (mode: string): mode is ViewMode => {
    return ['manager', 'family', 'guest'].includes(mode);
  };

  // Permission checking based on current view mode
  const hasViewPermission = (requiredRole: ViewMode): boolean => {
    const roleHierarchy = { manager: 3, family: 2, guest: 1 };
    return roleHierarchy[viewMode] >= roleHierarchy[requiredRole];
  };

  const canAccessFeature = (feature: string): boolean => {
    // Use the actual user's permissions, but filtered by current view mode
    const userCanAccess = canAccess(feature);
    
    // If user can't access it, they definitely can't in any view mode
    if (!userCanAccess) return false;
    
    // Check if the current view mode would allow this feature
    const featurePermissions: Record<string, ViewMode[]> = {
      'property-management': ['manager'],
      'user-management': ['manager'],
      'financial-reports': ['manager'],
      'system-settings': ['manager'],
      'inventory-management': ['manager', 'family'],
      'maintenance-tasks': ['manager', 'family'],
      'calendar-management': ['manager', 'family'],
      'document-upload': ['manager', 'family'],
      'view-inventory': ['manager', 'family', 'guest'],
      'view-calendar': ['manager', 'family', 'guest'],
      'basic-messaging': ['manager', 'family', 'guest'],
      'view-documents': ['manager', 'family', 'guest'],
    };

    const allowedRoles = featurePermissions[feature];
    return allowedRoles ? allowedRoles.includes(viewMode) : false;
  };

  return {
    viewMode,
    isManagerView: viewMode === 'manager',
    isFamilyView: viewMode === 'family',
    isGuestView: viewMode === 'guest',
    isViewingAsLowerRole: viewMode !== userRole,
    hasViewPermission,
    canAccessFeature,
    actualUserRole: userRole,
  };
}