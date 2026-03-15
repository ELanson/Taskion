/**
 * api/traffic.ts
 * Secure proxy for TomTom Traffic API
 */
export default async function handler(req: any, res: any) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();

    const { lat, lon } = req.query;
    const key = process.env.TOMTOM_API_KEY;

    if (!lat || !lon) {
        return res.status(400).json({ error: 'Latitude and Longitude are required' });
    }

    if (!key) {
        return res.status(500).json({ error: 'TomTom API Key not configured' });
    }

    try {
        const offset = 0.1; // ~10km bounding box
        const bbox = `${parseFloat(lon as string) - offset},${parseFloat(lat as string) - offset},${parseFloat(lon as string) + offset},${parseFloat(lat as string) + offset}`;
        const incidentUrl = `https://api.tomtom.com/traffic/services/4/incidentDetails/s3/${bbox}/10/-1/json?key=${key}`;

        const response = await fetch(incidentUrl);

        if (!response.ok) {
            return res.status(response.status || 500).json({ 
                error: 'Failed to fetch traffic data from TomTom' 
            });
        }

        const data = await response.json();
        return res.json(data);
    } catch (err: any) {
        console.error('[API Traffic Proxy] Error:', err.message);
        return res.status(500).json({ error: err.message });
    }
}
