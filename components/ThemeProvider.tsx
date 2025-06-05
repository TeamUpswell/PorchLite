"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

type Theme = 'dark' | 'light' | 'system';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  actualTheme: 'dark' | 'light'; // ✅ Add actual resolved theme
}

const ThemeContext = createContext<ThemeContextType>({
  theme: 'system',
  setTheme: () => {},
  actualTheme: 'light', // ✅ Default to light
});

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>('system');
  const [actualTheme, setActualTheme] = useState<'dark' | 'light'>('light'); // ✅ Track actual theme

  useEffect(() => {
    // Get theme from localStorage or default to system
    const savedTheme = localStorage.getItem('theme') as Theme;
    if (savedTheme) {
      setTheme(savedTheme);
    }
  }, []);

  useEffect(() => {
    // Apply theme to document
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');

    let resolvedTheme: 'dark' | 'light';

    if (theme === 'system') {
      resolvedTheme = window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light';
    } else {
      resolvedTheme = theme;
    }

    root.classList.add(resolvedTheme);
    setActualTheme(resolvedTheme); // ✅ Update actual theme state

    // Save to localStorage
    localStorage.setItem('theme', theme);

    // ✅ Listen for system theme changes when using 'system' mode
    if (theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = () => {
        const newResolvedTheme = mediaQuery.matches ? 'dark' : 'light';
        root.classList.remove('light', 'dark');
        root.classList.add(newResolvedTheme);
        setActualTheme(newResolvedTheme);
      };

      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, actualTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}

// Update ViewToggle.tsx to properly load and sync the view mode:

export default function ViewToggle({ onViewModeChange }: ViewToggleProps) {
  const { user } = useAuth();
  const { actualTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);

  const isDarkMode = actualTheme === "dark";

  // Get user's actual role
  const userRole = user?.user_metadata?.role || 'family';

  // ✅ Initialize with saved view mode or user's actual role
  const [currentViewMode, setCurrentViewMode] = useState<ViewMode>(() => {
    // Try to get from localStorage first
    if (typeof window !== 'undefined') {
      const savedMode = localStorage.getItem('viewMode') as ViewMode | null;
      if (savedMode && ['manager', 'family', 'guest'].includes(savedMode)) {
        return savedMode;
      }
    }
    // Fallback to user's actual role
    return (userRole === 'owner' || userRole === 'manager') ? 'manager' : userRole as ViewMode;
  });

  // ✅ Sync with localStorage and listen for changes
  useEffect(() => {
    // Load saved view mode
    const savedMode = localStorage.getItem('viewMode') as ViewMode | null;
    if (savedMode && ['manager', 'family', 'guest'].includes(savedMode)) {
      setCurrentViewMode(savedMode);
    }

    // Listen for view mode changes from other components
    const handleViewModeChange = (event: CustomEvent) => {
      setCurrentViewMode(event.detail.mode);
    };

    window.addEventListener('viewModeChanged', handleViewModeChange as EventListener);
    
    return () => {
      window.removeEventListener('viewModeChanged', handleViewModeChange as EventListener);
    };
  }, []);

  // ✅ Also sync when user role changes
  useEffect(() => {
    if (!localStorage.getItem('viewMode')) {
      // If no saved view mode, default to user's role
      const defaultMode = (userRole === 'owner' || userRole === 'manager') ? 'manager' : userRole as ViewMode;
      setCurrentViewMode(defaultMode);
    }
  }, [userRole]);

  // ✅ Only show for owners/managers
  if (userRole !== 'owner' && userRole !== 'manager') {
    return null;
  }

  // Available view modes based on user's actual role
  const getAvailableViewModes = (): ViewMode[] => {
    switch (userRole) {
      case 'owner':
      case 'manager':
        return ['manager', 'family', 'guest'];
      case 'family':
        return ['family', 'guest'];
      case 'guest':
      default:
        return ['guest'];
    }
  };

  const availableViewModes = getAvailableViewModes();

  // This check is now redundant since we return null above for non-owners
  // But keeping it as a safety check
  if (availableViewModes.length <= 1) return null;

  const handleViewModeChange = (mode: ViewMode) => {
    setCurrentViewMode(mode);
    setIsOpen(false);
    
    // Store in localStorage
    localStorage.setItem('viewMode', mode);
    
    // Notify parent component
    onViewModeChange?.(mode);
    
    // Dispatch custom event for other components
    window.dispatchEvent(new CustomEvent('viewModeChanged', { 
      detail: { mode } 
    }));
  };

  // ...rest of your component stays the same...
}
