/**
 * api/weather.ts
 * Secure proxy for OpenWeatherMap API
 */
export default async function handler(req: any, res: any) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();

    const { lat, lon } = req.query;
    const key = process.env.OPENWEATHER_API_KEY;

    if (!lat || !lon) {
        return res.status(400).json({ error: 'Latitude and Longitude are required' });
    }

    if (!key) {
        return res.status(500).json({ error: 'OpenWeather API Key not configured' });
    }

    try {
        const weatherUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${key}`;
        const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=metric&cnt=8&appid=${key}`;

        const [weatherRes, forecastRes] = await Promise.all([
            fetch(weatherUrl),
            fetch(forecastUrl)
        ]);

        if (!weatherRes.ok || !forecastRes.ok) {
            return res.status(weatherRes.status || forecastRes.status || 500).json({ 
                error: 'Failed to fetch weather data from external provider' 
            });
        }

        const weatherData = await weatherRes.json();
        const forecastData = await forecastRes.json();

        return res.json({
            weather: weatherData,
            forecast: forecastData
        });
    } catch (err: any) {
        console.error('[API Weather Proxy] Error:', err.message);
        return res.status(500).json({ error: err.message });
    }
}
