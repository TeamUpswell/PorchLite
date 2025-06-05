"use client";

import { useState } from 'react';
import { EyeIcon, ChevronDownIcon } from 'lucide-react';
import { useAuth } from '@/components/auth';
import { useTheme } from '@/components/ThemeProvider';
import { useViewMode } from '@/lib/hooks/useViewMode'; // ✅ Fix import path

type ViewMode = 'manager' | 'family' | 'guest';

interface ViewToggleProps {
  onViewModeChange?: (mode: ViewMode) => void;
}

export default function ViewToggle({ onViewModeChange }: ViewToggleProps) {
  const { user } = useAuth();
  const { actualTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  
  // ✅ Use the global hook
  const { viewMode: currentViewMode, setGlobalViewMode } = useViewMode();

  const isDarkMode = actualTheme === "dark";

  // Get user's actual role
  const userRole = user?.user_metadata?.role || 'family';

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

  if (availableViewModes.length <= 1) return null;

  const handleViewModeChange = (mode: ViewMode) => {
    setGlobalViewMode(mode); // ✅ Use global setter
    setIsOpen(false);
    
    // Still notify parent component if provided
    onViewModeChange?.(mode);
  };

  const getViewModeInfo = (mode: ViewMode) => {
    switch (mode) {
      case 'manager':
        return {
          name: 'Owner/Manager',
          description: 'Full access to property management', // ✅ Updated description
          icon: '👑',
          color: 'text-blue-600'
        };
      case 'family':
        return {
          name: 'Family & Friends',
          description: 'Standard access level',
          icon: '👥',
          color: 'text-green-600'
        };
      case 'guest':
        return {
          name: 'Guest View',
          description: 'Read-only access',
          icon: '👁️',
          color: 'text-amber-600'
        };
    }
  };

  const currentInfo = getViewModeInfo(currentViewMode);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`
          flex items-center space-x-2 px-3 py-2 rounded-lg border transition-colors duration-200
          ${isDarkMode 
            ? 'bg-gray-800 border-gray-700 hover:bg-gray-700 text-gray-200' 
            : 'bg-white border-gray-200 hover:bg-gray-50 text-gray-700'
          }
        `}
      >
        <EyeIcon className="h-4 w-4" />
        <span className="text-sm font-medium">{currentInfo.name}</span>
        <ChevronDownIcon 
          className={`h-4 w-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} 
        />
      </button>

      {isOpen && (
        <div className={`
          absolute right-0 top-full mt-2 w-64 rounded-lg shadow-lg py-2 z-50
          border transition-colors duration-200
          ${isDarkMode 
            ? 'bg-gray-800 border-gray-700' 
            : 'bg-white border-gray-200'
          }
        `}>
          {availableViewModes.map((mode) => {
            const info = getViewModeInfo(mode);
            const isSelected = mode === currentViewMode;

            return (
              <button
                key={mode}
                onClick={() => handleViewModeChange(mode)}
                className={`
                  w-full flex items-start px-4 py-3 text-left transition-colors duration-200
                  ${isSelected 
                    ? (isDarkMode ? 'bg-gray-700' : 'bg-gray-100')
                    : (isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50')
                  }
                `}
              >
                <span className="text-lg mr-3">{info.icon}</span>
                <div className="flex-1">
                  <div className={`
                    font-medium transition-colors duration-200
                    ${isDarkMode ? 'text-white' : 'text-gray-900'}
                  `}>
                    {info.name}
                    {isSelected && (
                      <span className={`ml-2 text-xs px-2 py-1 rounded-full ${isDarkMode ? 'bg-gray-600 text-gray-200' : 'bg-gray-200 text-gray-600'}`}>
                        Current
                      </span>
                    )}
                  </div>
                  <div className={`
                    text-xs mt-1 transition-colors duration-200
                    ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}
                  `}>
                    {info.description}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}