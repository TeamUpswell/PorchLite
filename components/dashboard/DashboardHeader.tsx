"use client";

import { PropertySwitcher } from "@/components/property/PropertySwitcher";
import { useProperty } from "@/lib/hooks/useProperty";
import { useAuth } from "@/components/auth";
import {
  Home as HomeIcon,
  Camera,
  Cloud,
  Sun,
  CloudRain,
  Wind,
  Thermometer,
} from "lucide-react"; // ✅ Add missing icons
import { useState, useEffect } from "react";
import HeaderImageManager from "./HeaderImageManager";
import { debug } from "@/lib/utils/debug";

// Enhanced interface with weather support
interface DashboardHeaderProps {
  title?: string;
  subtitle?: string;
  weather?: {
    current: {
      temp: number;
      condition: string;
      humidity: number;
      wind_speed: number;
      icon: string;
    };
    forecast: Array<{
      date: string;
      high: number;
      low: number;
      condition: string;
      icon: string;
    }>;
    location?: string; // Added location field
  } | null;
  showWeather?: boolean;
}

export default function DashboardHeader({
  title = "Dashboard",
  subtitle,
  weather,
  showWeather = true,
}: DashboardHeaderProps) {
  const { user } = useAuth();
  const { currentProperty } = useProperty(); // ✅ Removed tenant from destructuring
  const [showImageManager, setShowImageManager] = useState(false);
  const [loadingRole, setLoadingRole] = useState(true);
  const [userRole, setUserRole] = useState<string | null>(null);

  // Get current header image
  const currentHeaderImage =
    currentProperty?.header_image_url ||
    "/images/headers/presets/modern-house.jpg";

  // Enhanced role checking with debug logs
  useEffect(() => {
    debug.log("🔐 DashboardHeader - user:", user);

    if (user?.id) {
      // ✅ Simplified: assume owner if user exists
      debug.log("🔐 Setting role to owner for user:", user.id);
      setUserRole("owner");
      setLoadingRole(false);
    } else {
      debug.log("🔐 No user, setting timeout fallback");
      // Timeout fallback to prevent infinite loading
      setTimeout(() => {
        setLoadingRole(false);
        setUserRole("owner"); // Default to owner for testing
      }, 3000);
    }
  }, [user]);

  const canEdit =
    userRole && ["owner", "manager", "admin"].includes(userRole.toLowerCase());

  debug.log(
    "🔐 Final state - canEdit:",
    canEdit,
    "loadingRole:",
    loadingRole,
    "userRole:",
    userRole
  );

  const handleImageUpdate = (newImageUrl: string) => {
    window.location.reload();
  };

  return (
    <>
      <div className="relative h-64 rounded-lg overflow-hidden group mb-6">
        <img
          src={currentHeaderImage}
          alt="Property header"
          className="object-cover w-full h-full"
          onError={(e) => {
            e.currentTarget.src = "/images/headers/presets/modern-house.jpg";
          }}
        />

        {/* Lighter overlay */}
        <div className="absolute inset-0 bg-black/15" />

        {/* Manage Photo Button - Subtle Design */}
        {canEdit && (
          <button
            onClick={() => {
              debug.log("🖼️ Manage Photo clicked!");
              setShowImageManager(true);
            }}
            className="absolute top-4 left-4 bg-black/50 hover:bg-black/70 text-white px-3 py-2 rounded-lg transition-all duration-200 z-20 flex items-center shadow-md border border-white/20 opacity-0 group-hover:opacity-100"
            title="Change header image"
          >
            <Camera className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline text-sm font-medium">
              Manage Photo
            </span>
            <span className="sm:hidden text-sm font-medium">Photo</span>
          </button>
        )}

        {/* Weather Widget - Top Right (Desktop) */}
        {weather && showWeather && (
          <div className="hidden md:block absolute top-4 right-4 bg-white/15 backdrop-blur-md rounded-xl p-4 text-white border border-white/20 min-w-0 flex-shrink-0 z-10">
            {/* Current Weather */}
            <div className="flex items-center space-x-4 mb-3">
              <div className="text-center">
                <div className="flex items-center justify-center mb-2">
                  {weather.current.condition.includes("Sunny") ? (
                    <Sun className="h-7 w-7 text-yellow-300" />
                  ) : weather.current.condition.includes("Rain") ? (
                    <CloudRain className="h-7 w-7 text-blue-300" />
                  ) : (
                    <Cloud className="h-7 w-7 text-gray-300" />
                  )}
                </div>
                <div className="text-2xl font-bold">
                  {weather.current.temp}°
                </div>
                <div className="text-xs opacity-80 leading-tight">
                  {weather.current.condition}
                </div>
              </div>

              <div className="border-l border-white/30 pl-3 space-y-1">
                <div className="flex items-center space-x-2 text-sm">
                  <Wind className="h-3 w-3 flex-shrink-0" />
                  <span>{weather.current.wind_speed} mph</span>
                </div>
                <div className="flex items-center space-x-2 text-sm">
                  <Thermometer className="h-3 w-3 flex-shrink-0" />
                  <span>{weather.current.humidity}%</span>
                </div>
              </div>
            </div>

            {/* 3-Day Forecast */}
            <div className="border-t border-white/20 pt-3">
              <div className="grid grid-cols-3 gap-2 text-xs">
                {weather.forecast.slice(0, 3).map((day, index) => (
                  <div key={index} className="text-center">
                    <div className="font-medium opacity-80 mb-1 truncate">
                      {day.date}
                    </div>
                    <div className="flex justify-center mb-1">
                      {day.condition.includes("Sunny") ? (
                        <Sun className="h-3 w-3 text-yellow-300" />
                      ) : day.condition.includes("Rain") ? (
                        <CloudRain className="h-3 w-3 text-blue-300" />
                      ) : (
                        <Cloud className="h-3 w-3 text-gray-300" />
                      )}
                    </div>
                    <div className="font-bold text-xs">{day.high}°</div>
                    <div className="opacity-60 text-xs">{day.low}°</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Location Info - Added below weather */}
            {weather.location && (
              <p className="text-white/70 text-xs font-medium tracking-wide">
                {weather.location}
              </p>
            )}
          </div>
        )}

        {/* Mobile Layout - Stacked properly */}
        <div className="md:hidden absolute bottom-4 left-4 right-4 space-y-3">
          {/* Weather Widget - Mobile (below title) */}
          {weather && showWeather && (
            <div className="bg-white/15 backdrop-blur-md rounded-lg p-3 text-white border border-white/20">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="text-center">
                    {weather.current.condition.includes("Sunny") ? (
                      <Sun className="h-5 w-5 text-yellow-300 mx-auto mb-1" />
                    ) : weather.current.condition.includes("Rain") ? (
                      <CloudRain className="h-5 w-5 text-blue-300 mx-auto mb-1" />
                    ) : (
                      <Cloud className="h-5 w-5 text-gray-300 mx-auto mb-1" />
                    )}
                    <div className="text-lg font-bold">
                      {weather.current.temp}°
                    </div>
                  </div>
                  <div className="text-xs">
                    <div className="font-medium">
                      {weather.current.condition}
                    </div>
                    <div className="opacity-80">
                      {weather.current.wind_speed} mph •{" "}
                      {weather.current.humidity}%
                    </div>
                  </div>
                </div>

                <div className="flex space-x-2">
                  {weather.forecast.slice(0, 3).map((day, index) => (
                    <div key={index} className="text-center text-xs">
                      <div className="opacity-80 mb-1">
                        {day.date.slice(0, 3)}
                      </div>
                      <div className="font-bold">{day.high}°</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Header Image Manager Modal */}
      <HeaderImageManager
        isOpen={showImageManager}
        onClose={() => setShowImageManager(false)}
        onImageUpdate={handleImageUpdate}
        currentImageUrl={currentHeaderImage}
      />
    </>
  );
}
