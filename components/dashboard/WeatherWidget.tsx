// components/dashboard/WeatherWidget.tsx
'use client';

import { useState, useEffect } from 'react';
import { useProperty } from '@/lib/hooks/useProperty';
import { fetchWeatherByCoordinates, WeatherData } from '@/lib/services/openWeatherApi';

export function usePropertyWeather() {
  const { currentProperty } = useProperty();
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!currentProperty?.latitude || !currentProperty?.longitude) {
      setWeather(null);
      setLoading(false);
      setError('No property coordinates available');
      return;
    }

    const fetchWeather = async () => {
      setLoading(true);
      setError(null);
      
      try {
        console.log('🌤️ Fetching weather for coordinates:', {
          lat: currentProperty.latitude,
          lon: currentProperty.longitude
        });
        
        const weatherData = await fetchWeatherByCoordinates(
          currentProperty.latitude,
          currentProperty.longitude
        );
        
        console.log('✅ Weather data fetched:', weatherData);
        setWeather(weatherData);
      } catch (err) {
        console.error('❌ Weather fetch error:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch weather');
        setWeather(null);
      } finally {
        setLoading(false);
      }
    };

    fetchWeather();
  }, [currentProperty?.latitude, currentProperty?.longitude]);

  return { weather, loading, error };
}