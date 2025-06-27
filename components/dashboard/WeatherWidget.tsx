// components/dashboard/WeatherWidget.tsx
"use client";

import { useState, useEffect } from "react";
import { useProperty } from "@/lib/hooks/useProperty";
import {
  fetchWeatherByCoordinates,
  WeatherData,
} from "@/lib/services/openWeatherApi";

// Create a simplified interface for the hook that matches your dashboard needs
export interface SimpleWeatherData {
  temperature: number;
  condition: string;
  location: string;
  humidity?: number;
  windSpeed?: number;
  icon: string;
  description?: string;
}

export function usePropertyWeather() {
  const { currentProperty } = useProperty();
  const [weather, setWeather] = useState<SimpleWeatherData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!currentProperty?.latitude || !currentProperty?.longitude) {
      setWeather(null);
      setLoading(false);
      setError("No property coordinates available");
      return;
    }

    const fetchWeather = async () => {
      setLoading(true);
      setError(null);

      try {
        console.log("🌤️ Fetching weather for coordinates:", {
          property: currentProperty.name,
          lat: currentProperty.latitude,
          lon: currentProperty.longitude,
        });

        const weatherData = await fetchWeatherByCoordinates(
          currentProperty.latitude,
          currentProperty.longitude
        );

        // Convert the API response to the format your dashboard expects
        const simpleWeatherData: SimpleWeatherData = {
          temperature: weatherData.current.temp,
          condition: weatherData.current.condition,
          location:
            weatherData.location ||
            currentProperty.address ||
            currentProperty.name,
          humidity: weatherData.current.humidity,
          windSpeed: weatherData.current.wind_speed,
          icon: getWeatherIcon(weatherData.current.icon),
          description: `Current weather for ${currentProperty.name}`,
        };

        console.log("✅ Weather data loaded:", simpleWeatherData);
        setWeather(simpleWeatherData);
      } catch (err) {
        console.error("❌ Weather fetch error:", err);

        // Fallback to mock data if API fails
        if (err instanceof Error && err.message.includes("API key not found")) {
          console.log("🌤️ API key missing, using mock data");

          const mockWeatherData: SimpleWeatherData = {
            temperature: Math.floor(Math.random() * 30) + 60,
            condition: ["Sunny", "Partly Cloudy", "Cloudy"][
              Math.floor(Math.random() * 3)
            ],
            location: currentProperty.address || currentProperty.name,
            humidity: Math.floor(Math.random() * 40) + 40,
            windSpeed: Math.floor(Math.random() * 15) + 3,
            icon: ["☀️", "⛅", "☁️"][Math.floor(Math.random() * 3)],
            description: "Mock weather data (API key needed for real data)",
          };

          setWeather(mockWeatherData);
        } else {
          setError(
            err instanceof Error ? err.message : "Failed to fetch weather"
          );
          setWeather(null);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchWeather();
  }, [
    currentProperty?.latitude,
    currentProperty?.longitude,
    currentProperty?.name,
    currentProperty?.address,
  ]);

  return { weather, loading, error };
}

// Convert OpenWeather icon codes to emojis
function getWeatherIcon(iconCode: string): string {
  const iconMap: Record<string, string> = {
    "01d": "☀️",
    "01n": "🌙", // clear sky
    "02d": "⛅",
    "02n": "☁️", // few clouds
    "03d": "☁️",
    "03n": "☁️", // scattered clouds
    "04d": "☁️",
    "04n": "☁️", // broken clouds
    "09d": "🌧️",
    "09n": "🌧️", // shower rain
    "10d": "🌦️",
    "10n": "🌧️", // rain
    "11d": "⛈️",
    "11n": "⛈️", // thunderstorm
    "13d": "❄️",
    "13n": "❄️", // snow
    "50d": "🌫️",
    "50n": "🌫️", // mist
  };

  return iconMap[iconCode] || "🌤️";
}

// Export a default WeatherDisplay component
export default function WeatherDisplay({
  weather,
  loading,
  error,
}: {
  weather: SimpleWeatherData | null;
  loading?: boolean;
  error?: string | null;
}) {
  if (loading) {
    return (
      <div className="flex items-center gap-2 text-white/80">
        <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-white/60"></div>
        <span className="text-sm">Loading weather...</span>
      </div>
    );
  }

  if (error || !weather) {
    return (
      <div className="text-white/60 text-sm">
        <span>Weather unavailable</span>
        {error && <div className="text-xs text-white/40 mt-1">{error}</div>}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 text-white">
      <div className="text-2xl">{weather.icon}</div>
      <div>
        <div className="font-semibold text-lg">{weather.temperature}°F</div>
        <div className="text-white/80 text-sm">{weather.condition}</div>
        {weather.windSpeed && (
          <div className="text-white/60 text-xs">
            Wind: {weather.windSpeed} mph
          </div>
        )}
      </div>
      {weather.humidity && (
        <div className="text-white/70 text-xs">
          <div>Humidity</div>
          <div className="font-medium">{weather.humidity}%</div>
        </div>
      )}
    </div>
  );
}
