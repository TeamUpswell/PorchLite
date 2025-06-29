import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const lat = searchParams.get('lat');
    const lng = searchParams.get('lng');

    if (!lat || !lng) {
      return NextResponse.json(
        { error: 'Missing latitude or longitude' },
        { status: 400 }
      );
    }

    const API_KEY = process.env.OPENWEATHER_API_KEY;
    
    if (!API_KEY) {
      // Return mock data when API key is not configured
      console.log('⚠️ OpenWeather API key not configured, returning mock data');
      const mockWeatherData = {
        location: 'Bend, OR',
        temperature: 72,
        condition: 'Clear',
        description: 'clear sky',
        icon: '01d',
        humidity: 45,
        windSpeed: 8,
        feelsLike: 75,
        forecast: [
          {
            date: new Date(Date.now() + 86400000).toISOString().split('T')[0], // Tomorrow
            high: 78,
            low: 52,
            condition: 'Sunny',
            icon: '01d',
            description: 'sunny'
          },
          {
            date: new Date(Date.now() + 172800000).toISOString().split('T')[0], // Day after
            high: 75,
            low: 48,
            condition: 'Partly Cloudy',
            icon: '02d',
            description: 'partly cloudy'
          },
          {
            date: new Date(Date.now() + 259200000).toISOString().split('T')[0], // 3 days out
            high: 68,
            low: 45,
            condition: 'Rain',
            icon: '10d',
            description: 'light rain'
          }
        ]
      };
      
      await new Promise(resolve => setTimeout(resolve, 500)); // Simulate API delay
      return NextResponse.json(mockWeatherData);
    }

    // Fetch current weather and 5-day forecast in parallel
    const [currentResponse, forecastResponse] = await Promise.all([
      fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lng}&appid=${API_KEY}&units=imperial`),
      fetch(`https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lng}&appid=${API_KEY}&units=imperial`)
    ]);

    if (!currentResponse.ok) {
      throw new Error(`Current weather API error: ${currentResponse.status}`);
    }

    if (!forecastResponse.ok) {
      throw new Error(`Forecast API error: ${forecastResponse.status}`);
    }

    const [currentData, forecastData] = await Promise.all([
      currentResponse.json(),
      forecastResponse.json()
    ]);

    // Process forecast data to get next 3 days
    const dailyForecasts = [];
    const processedDates = new Set();
    
    for (const item of forecastData.list) {
      const date = new Date(item.dt * 1000);
      const dateStr = date.toISOString().split('T')[0];
      
      // Skip today and only process next 3 days
      const today = new Date().toISOString().split('T')[0];
      if (dateStr === today || processedDates.has(dateStr) || dailyForecasts.length >= 3) {
        continue;
      }
      
      // Find all forecasts for this date to get high/low
      const dayForecasts = forecastData.list.filter(f => {
        const fDate = new Date(f.dt * 1000).toISOString().split('T')[0];
        return fDate === dateStr;
      });
      
      const temperatures = dayForecasts.map(f => f.main.temp);
      const high = Math.round(Math.max(...temperatures));
      const low = Math.round(Math.min(...temperatures));
      
      // Use the forecast closest to noon for conditions
      const noonForecast = dayForecasts.reduce((closest, current) => {
        const currentHour = new Date(current.dt * 1000).getHours();
        const closestHour = new Date(closest.dt * 1000).getHours();
        return Math.abs(12 - currentHour) < Math.abs(12 - closestHour) ? current : closest;
      });
      
      dailyForecasts.push({
        date: dateStr,
        high,
        low,
        condition: noonForecast.weather[0].main,
        icon: noonForecast.weather[0].icon,
        description: noonForecast.weather[0].description
      });
      
      processedDates.add(dateStr);
    }

    const weatherData = {
      location: currentData.name,
      temperature: Math.round(currentData.main.temp),
      condition: currentData.weather[0].main,
      description: currentData.weather[0].description,
      icon: currentData.weather[0].icon,
      humidity: currentData.main.humidity,
      windSpeed: Math.round(currentData.wind?.speed || 0),
      feelsLike: Math.round(currentData.main.feels_like),
      forecast: dailyForecasts
    };

    return NextResponse.json(weatherData);
  } catch (error) {
    console.error('Weather API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch weather data' },
      { status: 500 }
    );
  }
}