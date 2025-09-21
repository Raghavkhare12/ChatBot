// lib/tools.js

// This function now uses latitude and longitude for more accuracy.
async function getCurrentWeather({ latitude, longitude, unit = 'celsius' }) {
  if (!process.env.WEATHER_API_KEY) {
    throw new Error('Weather API key is not set.');
  }
  const url = `http://api.weatherapi.com/v1/current.json?key=${process.env.WEATHER_API_KEY}&q=${latitude},${longitude}`;

  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Weather API request failed with status ${response.status}`);
    const data = await response.json();
    
    // START: MODIFIED LOGIC TO INCLUDE DATE
    // The API provides a datetime string like "2025-09-21 10:01".
    const [dateString, timeString] = data.location.localtime.split(' ');

    // We format the date part for better readability.
    const formattedDate = new Date(dateString).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });

    const weatherInfo = {
      location: data.location.name,
      date: formattedDate,      // <-- Added formatted date
      time: timeString,         // <-- Separated time
      temperature: unit === 'celsius' ? data.current.temp_c : data.current.temp_f,
      condition: data.current.condition.text,
      unit: unit,
    };
    // END: MODIFIED LOGIC

    return JSON.stringify(weatherInfo);
  } catch (error) {
    console.error('Error fetching weather:', error);
    return JSON.stringify({ error: 'Could not fetch weather information.' });
  }
}

// A new function that simply returns the current date and time.
// Note: This will be the server's time. For true user local time, we rely on the weather API's response.
async function getDateTime() {
    return JSON.stringify({
        currentDate: new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }),
        currentTime: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
    });
}

// Updated tool definitions for the LLM.
export const tools = [
  {
    type: 'function',
    function: {
      name: 'getCurrentWeather',
      description: 'Get the current weather, date, and time for a specific location using latitude and longitude',
      parameters: {
        type: 'object',
        properties: {
          latitude: { type: 'number', description: 'The latitude of the location' },
          longitude: { type: 'number', description: 'The longitude of the location' },
          unit: { type: 'string', enum: ['celsius', 'fahrenheit'] },
        },
        required: ['latitude', 'longitude'],
      },
    },
  },
  {
    type: 'function',
    function: {
        name: 'getDateTime',
        description: 'Get the current date and time',
        parameters: { type: 'object', properties: {} } // No parameters needed
    }
  }
];

// Updated map of available functions.
export const availableTools = {
  getCurrentWeather,
  getDateTime,
};