const OPENWEATHER_API_KEY = process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY;
const BASE_URL = 'https://api.openweathermap.org/data/2.5';

export interface WeatherData {
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
  location?: string;
}

export async function fetchWeatherByCoordinates(
  lat: number,
  lon: number
): Promise<WeatherData> {
  if (!OPENWEATHER_API_KEY) {
    throw new Error('OpenWeather API key not found');
  }

  try {
    // Fetch current weather
    const currentResponse = await fetch(
      `${BASE_URL}/weather?lat=${lat}&lon=${lon}&appid=${OPENWEATHER_API_KEY}&units=imperial`
    );
    
    if (!currentResponse.ok) {
      throw new Error(`Current weather API error: ${currentResponse.status}`);
    }
    
    const currentData = await currentResponse.json();

    // Fetch 5-day forecast
    const forecastResponse = await fetch(
      `${BASE_URL}/forecast?lat=${lat}&lon=${lon}&appid=${OPENWEATHER_API_KEY}&units=imperial`
    );
    
    if (!forecastResponse.ok) {
      throw new Error(`Forecast API error: ${forecastResponse.status}`);
    }
    
    const forecastData = await forecastResponse.json();

    // Process forecast data - get daily forecasts
    const dailyForecasts = processForecastData(forecastData.list);

    return {
      current: {
        temp: Math.round(currentData.main.temp),
        condition: currentData.weather[0].main,
        humidity: currentData.main.humidity,
        wind_speed: Math.round(currentData.wind.speed),
        icon: currentData.weather[0].icon,
      },
      forecast: dailyForecasts,
      location: `${currentData.name}, ${currentData.sys.country}`,
    };
  } catch (error) {
    console.error('Error fetching weather data:', error);
    throw error;
  }
}

function processForecastData(forecastList: any[]): WeatherData['forecast'] {
  const today = new Date();
  const forecasts: WeatherData['forecast'] = [];
  
  // Group forecasts by date
  const dailyData: { [key: string]: any[] } = {};
  
  forecastList.forEach((item) => {
    const date = new Date(item.dt * 1000);
    const dateStr = date.toDateString();
    
    if (!dailyData[dateStr]) {
      dailyData[dateStr] = [];
    }
    dailyData[dateStr].push(item);
  });

  // Get next 3 days
  for (let i = 0; i < 3; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    const dateStr = date.toDateString();
    
    const dayData = dailyData[dateStr];
    if (dayData && dayData.length > 0) {
      // Calculate high/low for the day
      const temps = dayData.map(item => item.main.temp);
      const high = Math.round(Math.max(...temps));
      const low = Math.round(Math.min(...temps));
      
      // Use midday weather for condition
      const middayWeather = dayData[Math.floor(dayData.length / 2)];
      
      let dayLabel;
      if (i === 0) {
        dayLabel = 'Today';
      } else if (i === 1) {
        dayLabel = 'Tomorrow';
      } else {
        dayLabel = date.toLocaleDateString('en-US', { weekday: 'short' });
      }
      
      forecasts.push({
        date: dayLabel,
        high,
        low,
        condition: middayWeather.weather[0].main,
        icon: middayWeather.weather[0].icon,
      });
    }
  }
  
  return forecasts;
}