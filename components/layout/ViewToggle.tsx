"use client";

import { useState, useEffect } from 'react';
import { EyeIcon, ChevronDownIcon } from 'lucide-react';
import { useAuth } from '@/components/auth';
import { useTheme } from '@/components/ThemeProvider';

type ViewMode = 'manager' | 'family' | 'guest';

interface ViewToggleProps {
  onViewModeChange?: (mode: ViewMode) => void;
}

export default function ViewToggle({ onViewModeChange }: ViewToggleProps) {
  const { user } = useAuth();
  const { theme } = useTheme();
  const [currentViewMode, setCurrentViewMode] = useState<ViewMode>('family');
  const [isOpen, setIsOpen] = useState(false);

  const isDarkMode = theme === "dark";

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

  const getViewModeInfo = (mode: ViewMode) => {
    switch (mode) {
      case 'manager':
        return {
          label: 'Owner/Manager',
          description: 'Full access to all features',
          shortLabel: 'Owner',
          icon: '👑',
          color: isDarkMode 
            ? 'bg-blue-900/50 text-blue-200 border-blue-700/50 backdrop-blur-sm' 
            : 'bg-blue-50/80 text-blue-700 border-blue-200/80 backdrop-blur-sm',
          hoverColor: isDarkMode 
            ? 'hover:bg-blue-800/60' 
            : 'hover:bg-blue-100/90',
          badge: isDarkMode 
            ? 'bg-blue-800/80 text-blue-200' 
            : 'bg-blue-200/80 text-blue-800'
        };
      case 'family':
        return {
          label: 'Family & Friends',
          description: 'Standard family member access',
          shortLabel: 'Family',
          icon: '👥',
          color: isDarkMode 
            ? 'bg-green-900/50 text-green-200 border-green-700/50 backdrop-blur-sm' 
            : 'bg-green-50/80 text-green-700 border-green-200/80 backdrop-blur-sm',
          hoverColor: isDarkMode 
            ? 'hover:bg-green-800/60' 
            : 'hover:bg-green-100/90',
          badge: isDarkMode 
            ? 'bg-green-800/80 text-green-200' 
            : 'bg-green-200/80 text-green-800'
        };
      case 'guest':
        return {
          label: 'Guest View',
          description: 'Limited read-only access',
          shortLabel: 'Guest',
          icon: '👁️',
          color: isDarkMode 
            ? 'bg-amber-900/50 text-amber-200 border-amber-700/50 backdrop-blur-sm' 
            : 'bg-amber-50/80 text-amber-700 border-amber-200/80 backdrop-blur-sm',
          hoverColor: isDarkMode 
            ? 'hover:bg-amber-800/60' 
            : 'hover:bg-amber-100/90',
          badge: isDarkMode 
            ? 'bg-amber-800/80 text-amber-200' 
            : 'bg-amber-200/80 text-amber-800'
        };
    }
  };

  const currentInfo = getViewModeInfo(currentViewMode);
  const isViewingAsLowerRole = currentViewMode !== userRole;

  return (
    <div className="relative z-50"> {/* ✅ Higher z-index */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`
          group flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium 
          transition-all duration-200 border shadow-lg min-w-[140px] justify-center
          ${isViewingAsLowerRole 
            ? `${currentInfo.color} ${currentInfo.hoverColor} shadow-lg ring-1 ring-white/20` 
            : isDarkMode
              ? 'bg-gray-800/80 text-gray-200 hover:bg-gray-700/90 border-gray-600/50 backdrop-blur-sm shadow-lg'
              : 'bg-white/80 text-gray-700 hover:bg-gray-50/90 border-gray-200/50 backdrop-blur-sm shadow-lg'
          }
        `}
        title={currentInfo.description}
      >
        <span className="text-base">{currentInfo.icon}</span>
        <span className="hidden sm:inline">{currentInfo.shortLabel}</span>
        <span className="sm:hidden">{currentInfo.label}</span>
        {isViewingAsLowerRole && (
          <span className={`
            inline-flex items-center px-1.5 py-0.5 rounded-md text-xs font-bold
            ${currentInfo.badge} shadow-sm
          `}>
            VIEW
          </span>
        )}
        <ChevronDownIcon className={`
          h-3.5 w-3.5 transition-transform duration-200
          ${isOpen ? "rotate-180" : ""}
          opacity-60 group-hover:opacity-100
        `} />
      </button>

      {isOpen && (
        <>
          {/* ✅ Higher z-index backdrop */}
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)}
          />
          
          {/* ✅ Higher z-index dropdown */}
          <div className={`
            absolute right-0 mt-3 w-72 rounded-2xl shadow-2xl border z-50
            ${isDarkMode 
              ? 'bg-gray-800/95 border-gray-600/50 backdrop-blur-xl' 
              : 'bg-white/95 border-gray-200/50 backdrop-blur-xl'
            }
          `}>
            {/* Header */}
            <div className={`
              p-4 border-b rounded-t-2xl
              ${isDarkMode 
                ? 'border-gray-700/50 bg-gradient-to-r from-gray-700/30 to-gray-800/30' 
                : 'border-gray-200/50 bg-gradient-to-r from-gray-50/50 to-gray-100/50'
              }
            `}>
              <div className="flex items-center gap-2 mb-2">
                <EyeIcon className={`h-4 w-4 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} />
                <h3 className={`
                  text-sm font-semibold
                  ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}
                `}>
                  Switch View Mode
                </h3>
              </div>
              <p className={`
                text-xs
                ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}
              `}>
                Your role: <span className="font-medium">{userRole}</span> • 
                Current view: <span className="font-medium">{currentInfo.shortLabel}</span>
              </p>
            </div>
            
            {/* Options */}
            <div className="p-2">
              {availableViewModes.map((mode) => {
                const info = getViewModeInfo(mode);
                const isSelected = currentViewMode === mode;
                
                return (
                  <button
                    key={mode}
                    onClick={() => handleViewModeChange(mode)}
                    className={`
                      w-full px-4 py-3 text-left transition-all duration-200 rounded-xl
                      group hover:scale-[1.02] transform
                      ${isSelected 
                        ? isDarkMode 
                          ? 'bg-blue-900/50 border border-blue-700/50' 
                          : 'bg-blue-50/80 border border-blue-200/50'
                        : isDarkMode 
                          ? 'hover:bg-gray-700/50' 
                          : 'hover:bg-gray-50/50'
                      }
                    `}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <span className="text-lg mt-0.5">{info.icon}</span>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className={`
                              font-medium text-sm
                              ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}
                              ${isSelected ? 'font-semibold' : ''}
                            `}>
                              {info.label}
                            </span>
                            {isSelected && (
                              <span className={`
                                inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold
                                ${isDarkMode 
                                  ? 'bg-blue-800/80 text-blue-200' 
                                  : 'bg-blue-200/80 text-blue-800'
                                }
                              `}>
                                ACTIVE
                              </span>
                            )}
                          </div>
                          <p className={`
                            text-xs mt-1 leading-relaxed
                            ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}
                          `}>
                            {info.description}
                          </p>
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Footer */}
            <div className={`
              px-4 py-3 border-t rounded-b-2xl
              ${isDarkMode 
                ? 'border-gray-700/50 bg-gray-900/30' 
                : 'border-gray-200/50 bg-gray-50/30'
              }
            `}>
              <p className={`
                text-xs text-center
                ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}
              `}>
                Switch views to preview different permission levels
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}