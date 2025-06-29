"use client";

import { useState, useEffect } from 'react';
import { debugLog, debugError } from '@/lib/utils/debug';

interface WeatherData {
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
  location: string;
}

export function useWeather(address?: string) {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!address) {
      debugLog('🌤️ No address provided, skipping weather fetch');
      return;
    }

    const fetchWeather = async () => {
      setLoading(true);
      setError(null);
      
      try {
        debugLog('🌤️ Fetching weather for:', address);
        
        const API_KEY = process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY;
        
        if (!API_KEY) {
          throw new Error('Weather API key not configured');
        }

        // First, get coordinates from address
        let geoResponse = await fetch(
          `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(address)}&limit=1&appid=${API_KEY}`
        );
        
        let geoData = await geoResponse.json();
        debugLog('🌤️ Initial geocoding result:', geoData);
        
        // If no results, try with just city/state
        if (!geoData.length && address.includes(',')) {
          const cityState = address.split(',').slice(-2).join(',').trim();
          debugLog('🌤️ Full address failed, trying city/state:', cityState);
          
          geoResponse = await fetch(
            `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(cityState)}&limit=1&appid=${API_KEY}`
          );
          
          geoData = await geoResponse.json();
        }
        
        // If still no results, try just the city
        if (!geoData.length && address.includes(',')) {
          const city = address.split(',')[0].trim();
          debugLog('🌤️ City/state failed, trying just city:', city);
          
          geoResponse = await fetch(
            `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(city)}&limit=1&appid=${API_KEY}`
          );
          
          geoData = await geoResponse.json();
        }

        // NEW: If still nothing, try "Bend, Oregon" as fallback
        if (!geoData.length) {
          debugLog('🌤️ All address attempts failed, trying Bend, Oregon fallback');
          
          geoResponse = await fetch(
            `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent('Bend, Oregon')}&limit=1&appid=${API_KEY}`
          );
          
          geoData = await geoResponse.json();
        }
        
        if (!geoData.length) {
          throw new Error('Location not found');
        }
        
        const { lat, lon, name, state } = geoData[0];
        const locationName = `${name}${state ? `, ${state}` : ''}`;
        debugLog('🌤️ Coordinates found:', { lat, lon, locationName });
        
        // Get current weather and forecast using free APIs
        const [currentResponse, forecastResponse] = await Promise.all([
          // Current weather (free)
          fetch(
            `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=imperial&appid=${API_KEY}`
          ),
          // 5-day forecast (free)
          fetch(
            `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=imperial&appid=${API_KEY}`
          )
        ]);
        
        if (!currentResponse.ok || !forecastResponse.ok) {
          throw new Error(`Weather fetch failed: ${currentResponse.status} / ${forecastResponse.status}`);
        }
        
        const [currentData, forecastData] = await Promise.all([
          currentResponse.json(),
          forecastResponse.json()
        ]);
        
        debugLog('🌤️ Current weather data received for:', locationName);
        debugLog('🌤️ Forecast data received, entries:', forecastData.list.length);
        
        // Transform the data to match our interface
        const transformedWeather: WeatherData = {
          current: {
            temp: Math.round(currentData.main.temp),
            condition: currentData.weather[0].main,
            humidity: currentData.main.humidity,
            wind_speed: Math.round(currentData.wind.speed),
            icon: currentData.weather[0].icon,
          },
          forecast: forecastData.list
            .filter((_: any, index: number) => index % 8 === 0) // Every 8th entry (24h apart)
            .slice(0, 3)
            .map((day: any, index: number) => ({
              date: index === 0 ? 'Today' : index === 1 ? 'Tomorrow' : 
                    new Date(day.dt * 1000).toLocaleDateString('en-US', { weekday: 'short' }),
              high: Math.round(day.main.temp_max),
              low: Math.round(day.main.temp_min),
              condition: day.weather[0].main,
              icon: day.weather[0].icon,
            })),
          location: locationName,
        };
        
        setWeather(transformedWeather);
        debugLog('✅ Weather data transformed successfully for:', locationName);
        
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to fetch weather';
        debugError('❌ Weather fetch error:', errorMessage);
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchWeather();
  }, [address]);

  return { weather, loading, error };
}