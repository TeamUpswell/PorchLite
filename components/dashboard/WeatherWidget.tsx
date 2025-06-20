// components/dashboard/WeatherWidget.tsx
'use client';

import { useState, useEffect } from 'react';
import { useProperty } from '@/lib/hooks/useProperty';

export function usePropertyWeather() {
  const { currentProperty } = useProperty();
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentProperty?.id) {
      setLoading(false);
      return;
    }

    const fetchWeather = async () => {
      try {
        const mockWeather = {
          current: {
            temp: 72,
            condition: "Partly Cloudy",
            humidity: 65,
            wind_speed: 8,
            icon: "partly-cloudy",
          },
          forecast: [
            { date: "Today", high: 75, low: 62, condition: "Sunny", icon: "sunny" },
            { date: "Tomorrow", high: 78, low: 64, condition: "Partly Cloudy", icon: "partly-cloudy" },
            { date: "Wed", high: 73, low: 60, condition: "Rain", icon: "rain" },
          ],
          location: formatLocationName(currentProperty)
        };
        
        setWeather(mockWeather);
      } catch (error) {
        console.error('Weather error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchWeather();
  }, [currentProperty?.id]);

  return { weather, loading, error: null };
}

// Helper function to format location nicely
function formatLocationName(property: any): string {
  if (property.city && property.state) {
    return `${property.city}, ${property.state}`;
  }
  if (property.city) {
    return property.city;
  }
  if (property.address) {
    // Extract city from address if needed
    const parts = property.address.split(',');
    if (parts.length >= 2) {
      return parts[parts.length - 2].trim();
    }
  }
  return 'Current Location';
}