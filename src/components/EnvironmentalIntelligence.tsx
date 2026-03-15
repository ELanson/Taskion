import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { useAppStore } from '../store/useAppStore';
import {
    CloudRain, Wind, Thermometer, MapPin, Navigation, AlertTriangle, AlertCircle, RefreshCw, Navigation2, Sun, Cloud, CloudLightning, Activity, Droplets, X, Moon
} from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, useMap, Circle, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { DotLottiePlayer } from '@dotlottie/react-player';

// Fix for default marker icon issues in React-Leaflet
// @ts-ignore
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// --- Types ---
export interface WeatherData {
    temp: number;
    condition: 'Sunny' | 'Cloudy' | 'Rain' | 'Storm' | 'Clear';
    rainChance: number;
    windSpeed: number;
    location: string;
    humidity: number;
    uvIndex: number;
    hourly: { time: string; temp: number; icon: 'sun' | 'cloud' | 'rain' | 'storm' }[];
    operationalInsights: {
        department: 'Studio' | 'Production' | 'Logistics' | 'Site Application' | 'Wellness' | 'Productivity' | 'Lifestyle' | 'Workplace';
        level: 'LOW' | 'MEDIUM' | 'HIGH';
        message: string;
        suggestion: string;
    }[];
}

export interface TrafficData {
    status: 'Clear' | 'Moderate' | 'Heavy';
    currentTravelTime: number; // mins
    normalTravelTime: number; // mins
    incidents: string[];
    route: string;
    delayReason?: string;
    impactAreas: { center: [number, number]; color: string; label: string }[];
    operationalInsights?: {
        department: string;
        level: 'LOW' | 'MEDIUM' | 'HIGH';
        message: string;
        suggestion: string;
    }[];
}

// --- Mock Helpers ---
const getRandom = (arr: any[]) => arr[Math.floor(Math.random() * arr.length)];

const generateLifestyleInsights = (status: 'Clear' | 'Moderate' | 'Heavy', hour: number, location: string) => {
    const city = location.split(',')[0];
    const tips = [];
    
    if (hour >= 6 && hour <= 10) { // Morning
        if (status === 'Heavy') {
            tips.push(
                { m: 'Morning Rush Detected', s: `Better to grab an artisanal brew at a local cafe in ${city} and let the rush pass.` },
                { m: 'Heavy Outbound Flow', s: `Perfect time for a nearby breakfast spot in ${city}. Try the specialty omelets while the roads clear.` },
                { m: 'Static Morning Transit', s: `Early morning congestion is high. Consider a quick gym session at a nearby center while it settles.` }
            );
        } else {
            tips.push(
                { m: 'Clear Morning Commute', s: `Roads in ${city} are wide open. Maybe an early stop for a premium espresso before the first meeting?` },
                { m: 'Fluid Start', s: `Smooth transit detected. Catch an early breakfast or hit that local park for a morning walk.` }
            );
        }
    } else if (hour >= 11 && hour <= 15) { // Mid-day
        if (status === 'Heavy') {
            tips.push(
                { m: 'Mid-day Gridlock', s: `Static traffic detected. Why not try that new fusion bistro in ${city} for a late lunch?` },
                { m: 'Delayed Corridors', s: `Roads in ${city} are sluggish. A quick recharge at a nearby juice bar might be a better use of time.` },
                { m: 'Post-Lunch Congestion', s: 'Standard flow is interrupted. Perfect excuse for a quiet afternoon coffee or a library visit.' }
            );
        } else {
            tips.push(
                { m: 'Fluid Mid-day Traffic', s: `Standard lunch rush is absent in ${city}. Great time for a quick drive to that hidden deli.` },
                { m: 'Clear Run', s: 'Optimized travel times today. Great opportunity for errands or a visit to the city center.' }
            );
        }
    } else if (hour >= 16 && hour <= 20) { // Evening
        if (status === 'Heavy') {
            tips.push(
                { m: 'Evening Congestion High', s: `Rush hour in ${city} is in full effect. Maybe a sunset cocktail or a quiet dinner nearby while it settles?` },
                { m: 'Slow Homeward Flow', s: `Major delays in ${city}. Consider a gym session or a browse at a local bookstore to skip the main jam.` },
                { m: 'Peak Transit Warning', s: 'Intense congestion detected. Catch a late movie or a quiet gallery visit to let the roads breathe.' }
            );
        } else {
            tips.push(
                { m: 'Clear Evening Roads', s: `Unusually light traffic in ${city}. Head straight out and catch the early reservations at the waterfront.` },
                { m: 'Fluid Evening Transit', s: 'Express lanes are clear. Ideal for a sunset drive or an early return for some quality downtime.' }
            );
        }
    } else { // Night
        tips.push(
            { m: 'Quiet Night Hours', s: `Nightlife in ${city} is active. Secure a late-night bite or a quiet rooftop drink with clear transit routes.` },
            { m: 'Zero Congestion', s: 'Roads are entirely clear. Perfect for a late drive or a specialized overnight store visit.' }
        );
    }
    return tips;
};

// --- Mock Hooks & Services ---
export const useEnvironmentalData = () => {
    const { userProfile } = useAppStore();
    const [weather, setWeather] = useState<WeatherData | null>(null);
    const [traffic, setTraffic] = useState<TrafficData | null>(null);
    const [loading, setLoading] = useState(true);
    const [coords, setCoords] = useState<[number, number]>(userProfile.coords || [-1.286389, 36.817223]); // Default to Profile or Nairobi
    const [locationPermission, setLocationPermission] = useState<PermissionState | 'prompt' | 'overridden'>(userProfile.coords ? 'overridden' : 'prompt');
    const [liveDataReady, setLiveDataReady] = useState(false);

    useEffect(() => {
        const fetchLocationAndData = async () => {
            // Priority 1: User Profile Override
            if (userProfile.coords) {
                setCoords(userProfile.coords);
                setLocationPermission('overridden');
                fetchMockData(userProfile.coords, userProfile.location || 'Your Location');
                return;
            }

            // Priority 2: Browser Geolocation
            if (!navigator.geolocation) {
                setLocationPermission('denied');
                fetchMockData(coords, 'Nairobi');
                return;
            }

            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const { latitude, longitude } = position.coords;
                    setCoords([latitude, longitude]);
                    setLocationPermission('granted');
                    fetchMockData([latitude, longitude], 'Local Area');
                },
                (error) => {
                    console.error("Location error:", error);
                    setLocationPermission('denied');
                    fetchMockData(coords, 'Nairobi'); // Fallback to current state
                }
            );
        };

        const fetchMockData = (targetCoords: [number, number], locationName: string) => {
            setLoading(true);
            setTimeout(() => {
                const now = new Date();
                const currentHour = now.getHours();

                // Helper to generate dynamic hourly forecast
                const generateHourlyForecast = () => {
                    const hours: { time: string; temp: number; icon: 'sun' | 'cloud' | 'rain' | 'storm' }[] = [];
                    for (let i = 0; i < 5; i++) {
                        const targetDate = new Date();
                        targetDate.setHours(currentHour + i);
                        const hour = targetDate.getHours();
                        const timeLabel = i === 0 ? 'Now' : `${hour > 12 ? hour - 12 : (hour === 0 ? 12 : hour)}${hour >= 12 ? 'PM' : 'AM'}`;

                        // Logical temp variation based on hour
                        const baseTemp = 23;
                        let tempAdjust = 0;
                        if (hour >= 6 && hour <= 18) {
                            tempAdjust = 5 - Math.abs(hour - 14) * 0.8;
                        } else {
                            const nightHour = hour < 6 ? hour : hour - 24;
                            tempAdjust = -3 + Math.abs(nightHour - 4) * 0.5;
                        }

                        // Condition logic
                        let icon: 'sun' | 'cloud' | 'rain' | 'storm' = 'sun';
                        if (hour >= 13 && hour <= 17) icon = 'rain';
                        else if (hour >= 18 || hour <= 7) icon = 'cloud';

                        hours.push({
                            time: timeLabel,
                            temp: Math.round(baseTemp + tempAdjust),
                            icon
                        });
                    }
                    return hours;
                };

                const hourlyData = generateHourlyForecast();
                const currentConditions = hourlyData[0];

                // --- Dynamic Smart Insights Engine ---
                const generateSmartInsights = () => {
                    const insights: WeatherData['operationalInsights'] = [];
                    const isRainy = hourlyData.some(h => h.icon === 'rain');
                    const isHot = currentConditions.temp > 24;
                    const highUV = currentHour >= 10 && currentHour <= 16;
                    
                    const getRandom = (arr: any[]) => arr[Math.floor(Math.random() * arr.length)];

                    // 1. Wellness Insight
                    if (highUV) {
                        const msg = getRandom([
                            { m: 'Peak UV Radiation detected', s: 'Apply SPF 30+ and limit direct exposure. Hydrate frequently.' },
                            { m: 'Aggressive UV Levels', s: 'Skin protection is critical today. Seek shade during midday hours.' }
                        ]);
                        insights.push({ department: 'Wellness', level: 'HIGH', message: msg.m, suggestion: msg.s });
                    } else if (isHot) {
                        const msg = getRandom([
                            { m: 'High ambient temperature', s: 'Maintain hydration. Optimal indoor temperature: 22°C.' },
                            { m: 'Heat index rising', s: 'Strategic hydration recommended. Avoid heavy outdoor tasks.' }
                        ]);
                        insights.push({ department: 'Wellness', level: 'MEDIUM', message: msg.m, suggestion: msg.s });
                    } else {
                        const msg = getRandom([
                            { m: 'Optimal air quality and temp', s: 'Great day for outdoor exercise or walking meetings.' },
                            { m: 'Balanced conditions', s: 'Ideal for refreshing outdoor activities. Enjoy the mild weather.' }
                        ]);
                        insights.push({ department: 'Wellness', level: 'LOW', message: msg.m, suggestion: msg.s });
                    }

                    // 2. Productivity Insight
                    if (isRainy) {
                        const msg = getRandom([
                            { m: 'Low ambient natural light', s: 'Use 4000K+ task lighting to maintain focus and energy.' },
                            { m: 'Rainy afternoon focus', s: 'Indoor deep-work is optimal. Low external noise distractions.' }
                        ]);
                        insights.push({ department: 'Productivity', level: 'MEDIUM', message: msg.m, suggestion: msg.s });
                    } else if (currentConditions.icon === 'sun') {
                        const msg = getRandom([
                            { m: 'Abundant natural light', s: 'Take a 10-minute sun-break to boost serotonin and focus.' },
                            { m: 'High visibility conditions', s: 'Perfect for creative review and detailed visual work.' }
                        ]);
                        insights.push({ department: 'Productivity', level: 'LOW', message: msg.m, suggestion: msg.s });
                    } else {
                        const msg = getRandom([
                            { m: 'Calm overcast conditions', s: 'Ideal for deep-focus deep work without glare distractions.' },
                            { m: 'Steady atmospheric state', s: 'Reliable conditions for multi-hour sustained productivity.' }
                        ]);
                        insights.push({ department: 'Productivity', level: 'LOW', message: msg.m, suggestion: msg.s });
                    }

                    // 3. Lifestyle / Home Insight
                    if (currentConditions.temp < 20) {
                        insights.push({
                            department: 'Lifestyle',
                            level: 'LOW',
                            message: 'Cooler evening transition',
                            suggestion: 'Seal windows to retain day-time heat. Natural insulation active.'
                        });
                    } else {
                        const msg = getRandom([
                            { m: 'Good cross-ventilation conditions', s: 'Open windows for 15 mins to refresh indoor air quality.' },
                            { m: 'Mild evening weather', s: 'Energy efficient cooling. Open vents for natural regulation.' }
                        ]);
                        insights.push({ department: 'Lifestyle', level: 'LOW', message: msg.m, suggestion: msg.s });
                    }

                    // 4. Workplace / Industrial (Legacy refined)
                    if (isRainy) {
                        insights.push({
                            department: 'Workplace',
                            level: 'HIGH',
                            message: 'Active precipitation risk',
                            suggestion: 'Suspend high-altitude outdoor works. Cover sensitive hardware.'
                        });
                    } else {
                        insights.push({
                            department: 'Workplace',
                            level: 'LOW',
                            message: 'Stable field conditions',
                            suggestion: 'Proceed with outdoor site surveys and hardware deployments.'
                        });
                    }

                    return insights;
                };

                const fetchRealWorldData = async () => {
                    let realTraffic: TrafficData | null = null;
                    let realWeather: Partial<WeatherData> | null = null;
                    let floodInsight: any = null;

                    try {
                        const [lat, lon] = targetCoords;

                        // 1. Fetch Weather through proxy
                        const weatherRes = await fetch(`/api/weather?lat=${lat}&lon=${lon}`);
                        if (weatherRes.ok) {
                            const { weather: wData, forecast: fData } = await weatherRes.json();
                            
                            const conditionMap: Record<string, 'sun' | 'cloud' | 'rain' | 'storm'> = {
                                'Clear': 'sun',
                                'Clouds': 'cloud',
                                'Rain': 'rain',
                                'Drizzle': 'rain',
                                'Thunderstorm': 'storm',
                                'Snow': 'cloud',
                                'Mist': 'cloud',
                                'Smoke': 'cloud',
                                'Haze': 'cloud',
                                'Dust': 'cloud',
                                'Fog': 'cloud',
                                'Sand': 'cloud',
                                'Ash': 'cloud',
                                'Squall': 'storm',
                                'Tornado': 'storm'
                            };

                            realWeather = {
                                temp: Math.round(wData.main.temp),
                                condition: wData.weather[0].main,
                                humidity: wData.main.humidity,
                                windSpeed: Math.round(wData.wind.speed * 3.6), // m/s to km/h
                                rainChance: wData.rain ? 80 : (wData.clouds.all > 70 ? 40 : 10),
                                location: wData.name,
                                hourly: fData.list.map((item: any) => ({
                                    time: new Date(item.dt * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                                    temp: Math.round(item.main.temp),
                                    icon: conditionMap[item.weather[0].main] || 'cloud'
                                }))
                            };
                        } else {
                            const errData = await weatherRes.json().catch(() => ({}));
                            if (weatherRes.status === 401) {
                                toast.warning('Weather Activation Pending', {
                                    description: 'Service provider key is invalid or not yet active. Using internal simulation engine.'
                                });
                            } else {
                                toast.error('Weather Sync Error', {
                                    description: `Internal server error ${weatherRes.status}: ${errData.error || 'Check server logs.'}`
                                });
                            }
                        }

                        // 2. Fetch Traffic through proxy
                        const trafficRes = await fetch(`/api/traffic?lat=${lat}&lon=${lon}`);
                        if (trafficRes.ok) {
                            const data = await trafficRes.json();
                            const incidents = data.tm?.poi?.map((p: any) => p.d) || [];
                            const impactAreas = data.tm?.poi?.map((p: any) => ({
                                center: [p.p.y, p.p.x],
                                color: p.ic === 1 ? '#ef4444' : '#f59e0b',
                                label: p.d
                            })) || [];

                            realTraffic = {
                                status: incidents.length > 5 ? 'Heavy' : (incidents.length > 0 ? 'Moderate' : 'Clear'),
                                currentTravelTime: 16 + (incidents.length * 2),
                                normalTravelTime: 16,
                                incidents: incidents.slice(0, 5),
                                route: locationName.split(',')[0] + ' Corridors',
                                impactAreas: impactAreas.slice(0, 10),
                                delayReason: incidents.length > 0 ? `${incidents.length} incidents detected in your area.` : 'Traffic is flowing smoothly.'
                            };
                        } else {
                            const errData = await trafficRes.json().catch(() => ({}));
                            console.warn('Traffic proxy failed:', trafficRes.status, errData.error);
                        }

                        // 2. Fetch Open-Meteo Flood Risk
                        const floodRes = await fetch(`https://flood-api.open-meteo.com/v1/flood?latitude=${targetCoords[0]}&longitude=${targetCoords[1]}&daily=river_discharge&forecast_days=1`);
                        if (floodRes.ok) {
                            const data = await floodRes.json();
                            const discharge = data.daily?.river_discharge?.[0] || 0;
                            if (discharge > 50) { // Threshold for "abnormal" flow
                                floodInsight = {
                                    department: 'Workplace',
                                    level: discharge > 100 ? 'HIGH' : 'MEDIUM',
                                    message: discharge > 100 ? 'Severe Flash Flood Risk' : 'Elevated River Discharge detected',
                                    suggestion: discharge > 100 ? 'Total site evacuation recommended. Move to high ground.' : 'Avoid riverbanks and low-lying ground works.'
                                };
                            }
                        } else {
                            console.error('Open-Meteo Flood API Error:', floodRes.status, floodRes.statusText);
                            toast.warning('Flood Data Unavailable', {
                                description: `Open-Meteo Flood API responded with status ${floodRes.status}.`
                            });
                        }
                    } catch (err) {
                        console.error('Environmental API Error:', err);
                        toast.error('Environmental Sync Failed', {
                            description: 'Unable to connect to live environmental services. Using fallback intelligence.'
                        });
                    }

                    return { realTraffic, realWeather, floodInsight };
                };

                fetchRealWorldData().then(({ realTraffic, realWeather, floodInsight }) => {
                    const insights = generateSmartInsights();
                    if (floodInsight) insights.unshift(floodInsight);

                    if (realWeather) {
                        setWeather({
                            temp: realWeather.temp || 20,
                            condition: (realWeather.condition === 'Clear' ? 'Sunny' : realWeather.condition) as any,
                            rainChance: realWeather.rainChance || 0,
                            windSpeed: realWeather.windSpeed || 10,
                            location: (locationName && locationName !== 'Local Area' && locationName !== 'Nairobi') ? locationName.split(',')[0] : (realWeather.location || locationName.split(',')[0]),
                            humidity: realWeather.humidity || 50,
                            uvIndex: currentHour >= 10 && currentHour <= 16 ? 8 : 1,
                            hourly: realWeather.hourly || [],
                            operationalInsights: insights
                        });
                    } else {
                        setWeather({
                            temp: currentConditions.temp,
                            condition: currentConditions.icon === 'rain' ? 'Rain' : (currentConditions.icon === 'sun' ? 'Sunny' : (currentConditions.icon === 'storm' ? 'Storm' : 'Cloudy')),
                            rainChance: currentConditions.icon === 'rain' ? 75 : (currentConditions.icon === 'cloud' ? 30 : 5),
                            windSpeed: 12 + Math.floor(Math.random() * 5),
                            location: locationName.split(',')[0],
                            humidity: currentConditions.icon === 'rain' ? 82 : 65,
                            uvIndex: currentHour >= 10 && currentHour <= 16 ? 8 : 1,
                            hourly: hourlyData,
                            operationalInsights: insights
                        });
                    }

                    if (realTraffic) {
                        const lifestyleTips = generateLifestyleInsights(realTraffic.status, currentHour, locationName);
                        setTraffic({
                            ...realTraffic,
                            operationalInsights: [
                                {
                                    department: 'Commute',
                                    level: realTraffic.status === 'Heavy' ? 'HIGH' : (realTraffic.status === 'Moderate' ? 'MEDIUM' : 'LOW'),
                                    message: realTraffic.incidents.length > 0 ? realTraffic.incidents[0] : 'Flowing smoothly',
                                    suggestion: realTraffic.status === 'Heavy' ? 'Strong delays detected. Consider alternative routes.' : 'Standard commute times apply.'
                                },
                                ...lifestyleTips.map(tip => ({
                                    department: 'Lifestyle' as const,
                                    level: 'LOW' as const,
                                    message: tip.m,
                                    suggestion: tip.s
                                }))
                            ]
                        });
                    } else {
                        // Keep simulated traffic if real fetch failed/no key
                        setTraffic(generateDynamicTraffic());
                    }
                    
                    setLoading(false);
                    setLiveDataReady(true);
                });
                // Helper to generate dynamic traffic data (Refined to be more generic/varied)
                const generateDynamicTraffic = () => {
                    const baseTravelTime = 16;
                    let delay = 0;
                    let status: 'Clear' | 'Moderate' | 'Heavy' = 'Clear';
                    const incidents: string[] = [];
                    const impactAreas: { center: [number, number]; color: string; label: string }[] = [];

                    // Varied mock labels
                    const mockIncidents = ['General Congestion', 'Slow traffic', 'Minor delay', 'Road maintenance nearby'];
                    const mockLocations = ['primary routes', 'feeder roads', 'local streets', 'access corridors'];

                    // Travel time & status based on hour (Rush hour peaks)
                    if ((currentHour >= 7 && currentHour <= 9) || (currentHour >= 16 && currentHour <= 19)) {
                        delay = 15 + Math.floor(Math.random() * 10);
                        status = 'Heavy';
                        incidents.push(`Peak hour congestion on ${mockLocations[Math.floor(Math.random() * mockLocations.length)]}`);
                        impactAreas.push({
                            center: [targetCoords[0] + 0.005, targetCoords[1] + 0.005],
                            color: "#ef4444",
                            label: "High Intensity Congestion"
                        });
                    } else if (currentHour >= 10 && currentHour <= 15) {
                        delay = 5 + Math.floor(Math.random() * 8);
                        status = 'Moderate';
                        incidents.push(mockIncidents[Math.floor(Math.random() * mockIncidents.length)]);
                        impactAreas.push({
                            center: [targetCoords[0] - 0.003, targetCoords[1] + 0.003],
                            color: "#f59e0b",
                            label: "Moderate Flow Alert"
                        });
                    }

                    const lifestyleTips = generateLifestyleInsights(status, currentHour, locationName);
                    return {
                        status: status,
                        currentTravelTime: baseTravelTime + delay,
                        normalTravelTime: baseTravelTime,
                        incidents,
                        route: locationName.split(',')[0] + ' Corridors',
                        impactAreas,
                        delayReason: incidents.length > 0 ? incidents[0] : 'Traffic is flowing smoothly.',
                        operationalInsights: [
                            {
                                department: 'Commute',
                                level: status === 'Heavy' ? 'HIGH' : (status === 'Moderate' ? 'MEDIUM' : 'LOW') as 'LOW' | 'MEDIUM' | 'HIGH',
                                message: incidents.length > 0 ? incidents[0] : 'Traffic is currently clear',
                                suggestion: status === 'Heavy'
                                    ? 'Consider delaying departure by 30 mins to avoid the peak. Use navigation to reroute.'
                                    : 'Routes are clear. Optimal time for errands or commutes.'
                            },
                            ...lifestyleTips.map(tip => ({
                                department: 'Lifestyle' as const,
                                level: 'LOW' as const,
                                message: tip.m,
                                suggestion: tip.s
                            }))
                        ]
                    };
                };

                setTraffic(generateDynamicTraffic());
                setLoading(false);
            }, 800);
        };

        fetchLocationAndData();

        // Specific intervals mentioned: Weather (5m), Traffic (2m)
        const weatherInterval = setInterval(() => {
            console.log('Refreshing weather data...');
            fetchMockData(coords, weather?.location || 'Your Location');
        }, 5 * 60 * 1000);
        const trafficInterval = setInterval(() => console.log('Fetching live traffic...'), 2 * 60 * 1000);

        return () => { clearInterval(weatherInterval); clearInterval(trafficInterval); };
    }, [userProfile.coords, userProfile.location]);

    const refreshTraffic = () => {
        // This can be called to manually refresh traffic data
    };

    return { weather, traffic, loading, locationPermission, coords };
};


// --- Helper Components ---

export const WeatherLottie = ({ condition, className = "" }: { condition: string, className?: string }) => {
    let src = "/lottie/sunny.lottie";
    switch (condition?.toLowerCase()) {
        case 'rain':
        case 'rainy': src = "/lottie/rainy icon.lottie"; break;
        case 'storm':
        case 'thunder': src = "/lottie/thunder.lottie"; break;
        case 'cloudy':
        case 'cloud': src = "/lottie/cloudy.lottie"; break;
        case 'sunny':
        case 'sun': src = "/lottie/sunny.lottie"; break;
    }

    return (
        <div className={className}>
            <DotLottiePlayer
                key={src}
                src={src}
                autoplay
                loop
                style={{ width: '100%', height: '100%' }}
            />
        </div>
    );
};

// --- Impact Area Components ---

const PulseCircle = ({ center, color, label }: { center: [number, number], color: string, label: string }) => {
    return (
        <>
            {/* Outer Pulsing Aura */}
            <Circle
                center={center}
                radius={300}
                pathOptions={{
                    color: color,
                    fillColor: color,
                    fillOpacity: 0.1,
                    weight: 1,
                    className: 'map-pulse-animation'
                }}
            />
            {/* Inner Core */}
            <Circle
                center={center}
                radius={80}
                pathOptions={{
                    color: color,
                    fillColor: color,
                    fillOpacity: 0.6,
                    weight: 2
                }}
            >
                <Popup>
                    <div className="font-bold text-xs">{label}</div>
                </Popup>
            </Circle>
        </>
    );
};

// Map View Adjuster
const ChangeView = ({ center }: { center: [number, number] }) => {
    const map = useMap();
    useEffect(() => {
        map.setView(center, map.getZoom());
    }, [center, map]);
    return null;
};

const TrafficMap = ({ coords, isDarkMode, status, impactAreas }: { coords: [number, number], isDarkMode: boolean, status: string, impactAreas: { center: [number, number]; color: string; label: string }[] }) => {
    return (
        <div className={`relative w-full h-64 rounded-[24px] mb-6 border overflow-hidden ${isDarkMode ? 'border-gray-800' : 'border-gray-200'}`}>
            <MapContainer
                center={coords}
                zoom={14}
                scrollWheelZoom={true}
                touchZoom={true}
                style={{ height: '100%', width: '100%', zIndex: 0 }}
                zoomControl={true}
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url={isDarkMode
                        ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                        : "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    }
                />
                <ChangeView center={coords} />
                <Marker position={coords}>
                    <Popup>
                        <div className="font-black">Your Location</div>
                        <div className="text-[10px] text-gray-500 font-bold">Currently tracking site context</div>
                    </Popup>
                </Marker>

                {/* Dynamic Impact Areas Driven by Data */}
                {impactAreas.map((area, idx) => (
                    <PulseCircle
                        key={`${area.label}-${idx}`}
                        center={area.center}
                        color={area.color}
                        label={area.label}
                    />
                ))}
            </MapContainer>

            {/* Status Overlay */}
            <div className="absolute bottom-4 left-4 z-[400] bg-white/10 backdrop-blur-md border border-white/20 px-3 py-1.5 rounded-full shadow-lg pointer-events-none">
                <p className="text-[10px] font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${status === 'Clear' ? 'bg-emerald-500' : (status === 'Moderate' ? 'bg-amber-500' : 'bg-red-500')} animate-pulse`} />
                    Live Interactive Map
                </p>
            </div>
        </div>
    );
};

// 1. Weather Icon Helper (Legacy Fallback + Lottie wrapper)
const WeatherIcon = ({ condition, size = 24, className = '', useLottie = true }: { condition: string, size?: number, className?: string, useLottie?: boolean }) => {
    if (useLottie) {
        return <WeatherLottie condition={condition} className={className} />;
    }
    switch (condition?.toLowerCase()) {
        case 'rain': return <CloudRain size={size} className={`text-blue-400 ${className}`} />;
        case 'storm': return <CloudLightning size={size} className={`text-purple-400 ${className}`} />;
        case 'cloudy':
        case 'cloud': return <Cloud size={size} className={`text-gray-400 ${className}`} />;
        case 'sun':
        case 'sunny': return <Sun size={size} className={`text-amber-400 ${className}`} />;
        default: return <Sun size={size} className={`text-amber-400 ${className}`} />;
    }
};

// 2. Dashboard Cards (Small)
export const DashboardWeatherCard = ({
    weather, loading, isDarkMode, onClick
}: { weather: WeatherData | null, loading: boolean, isDarkMode: boolean, onClick: () => void }) => {

    if (loading || !weather) {
        return (
            <div className={`p-5 rounded-[20px] border shadow-sm flex flex-col justify-center items-center h-full animate-pulse ${isDarkMode ? 'bg-[#121214] border-gray-800' : 'bg-white border-gray-100'}`}>
                <CloudRain className="text-gray-500 mb-2 opacity-50" />
                <div className="h-3 w-16 bg-gray-700/30 rounded"></div>
            </div>
        );
    }

    return (
        <button
            onClick={onClick}
            className={`${isDarkMode ? 'bg-gradient-to-br from-blue-900/20 to-[#121214] border-blue-500/20 hover:border-blue-500/40 hover:shadow-[0_0_15px_rgba(59,130,246,0.1)]' : 'bg-gradient-to-br from-blue-50 to-white border-blue-100 hover:border-blue-300'} p-5 rounded-[20px] border shadow-sm flex flex-col justify-between text-left transition-all cursor-pointer group relative overflow-hidden h-full w-full`}
        >
            {/* Subtle rain animation background layer */}
            {weather.condition === 'Rain' && (
                <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20 group-hover:opacity-40 transition-opacity">
                    <div className="rain-particles w-full h-full bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0IiBoZWlnaHQ9IjEyIj48cmVjdCB3aWR0aD0iMSIgaGVpZ2h0PSI0IiBmaWxsPSIjM2I4MmY2IiBvcGFjaXR5PSIwLjUiLz48L3N2Zz4=')] animate-[rain_0.3s_linear_infinite]" style={{ backgroundSize: '16px 32px' }}></div>
                </div>
            )}

            <div className="flex justify-between items-start mb-2 relative z-10 w-full">
                <div className="flex items-center gap-1.5 text-xs font-medium tracking-wide">
                    <span className={isDarkMode ? 'text-gray-400' : 'text-gray-500'}>Weather</span>
                    <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${isDarkMode ? 'bg-gray-800 text-gray-300' : 'bg-gray-100 text-gray-700'}`}>{weather.location}</span>
                </div>
                <div className="w-10 h-10 group-hover:rotate-12 transition-transform">
                    <WeatherLottie condition={weather.condition} />
                </div>
            </div>

            <div className="relative z-10 flex items-end justify-between mt-1">
                <div className="flex items-start">
                    <p className={`text-4xl font-black tracking-tight ${isDarkMode ? 'text-white' : 'text-gray-900'} leading-none`}>
                        {weather.temp}°
                    </p>
                </div>
                <div className="flex flex-col gap-1 items-end">
                    <p className={`text-[10px] font-bold flex items-center gap-1 ${weather.rainChance > 50 ? 'text-blue-400' : (isDarkMode ? 'text-gray-400' : 'text-gray-500')}`}>
                        <Droplets size={10} /> {weather.rainChance}% Rain
                    </p>
                    <p className={`text-[10px] font-bold flex items-center gap-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        <Wind size={10} /> {weather.windSpeed} km/h
                    </p>
                </div>
            </div>

            <div className="absolute inset-x-0 bottom-0 h-0.5 bg-gradient-to-r from-blue-500/0 via-blue-500/60 to-blue-500/0 opacity-0 group-hover:opacity-100 transition-opacity" />
        </button>
    );
};

export const DashboardTrafficCard = ({
    traffic, loading, isDarkMode, onClick
}: { traffic: TrafficData | null, loading: boolean, isDarkMode: boolean, onClick: () => void }) => {

    if (loading || !traffic) {
        return (
            <div className={`p-5 rounded-[20px] border shadow-sm flex flex-col justify-center items-center h-full animate-pulse ${isDarkMode ? 'bg-[#121214] border-gray-800' : 'bg-white border-gray-100'}`}>
                <Navigation2 className="text-gray-500 mb-2 opacity-50" />
                <div className="h-3 w-16 bg-gray-700/30 rounded"></div>
            </div>
        );
    }

    const isDelayed = traffic.currentTravelTime > traffic.normalTravelTime;
    const statusColor = traffic.status === 'Clear' ? 'text-emerald-500' : (traffic.status === 'Moderate' ? 'text-amber-500' : 'text-red-500');
    const statusBg = traffic.status === 'Clear' ? 'bg-emerald-500/20' : (traffic.status === 'Moderate' ? 'bg-amber-500/20' : 'bg-red-500/20');
    const statusGlow = traffic.status === 'Clear' ? 'hover:shadow-[0_0_15px_rgba(16,185,129,0.1)] hover:border-emerald-500/40' : (traffic.status === 'Moderate' ? 'hover:shadow-[0_0_15px_rgba(245,158,11,0.1)] hover:border-amber-500/40' : 'hover:shadow-[0_0_15px_rgba(239,68,68,0.1)] hover:border-red-500/40');

    return (
        <button
            onClick={onClick}
            className={`${isDarkMode ? `bg-gradient-to-br from-gray-900/40 to-[#121214] border-gray-800 ${statusGlow}` : `bg-white border-gray-100 ${statusGlow}`} p-5 rounded-[20px] border shadow-sm flex flex-col justify-between text-left transition-all cursor-pointer group relative overflow-hidden w-full h-full`}
        >
            <div className="flex justify-between items-start mb-2 relative z-10 w-full">
                <div className="flex items-center gap-1.5 text-xs font-medium tracking-wide">
                    <span className={isDarkMode ? 'text-gray-400' : 'text-gray-500'}>Traffic</span>
                </div>
                <div className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold ${statusColor} ${statusBg}`}>
                    <div className={`w-1.5 h-1.5 rounded-full bg-current ${isDelayed ? 'animate-pulse' : ''}`} />
                    {traffic.status}
                </div>
            </div>

            <div className="relative z-10 flex flex-col mt-1">
                <p className={`text-2xl font-black tracking-tight ${isDarkMode ? 'text-white' : 'text-gray-900'} leading-none mb-1`}>
                    {traffic.currentTravelTime} <span className="text-sm text-gray-500 font-bold">min</span>
                </p>
                {isDelayed ? (
                    <p className="text-[10px] text-amber-500 font-bold flex items-center gap-1">
                        <AlertCircle size={10} /> +{traffic.currentTravelTime - traffic.normalTravelTime} min delay
                    </p>
                ) : (
                    <p className={`text-[10px] font-bold ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                        Normal ({traffic.normalTravelTime} min)
                    </p>
                )}
            </div>

            <div className="absolute inset-x-0 bottom-0 h-0.5 bg-gradient-to-r from-gray-500/0 via-gray-500/30 to-gray-500/0 opacity-0 group-hover:opacity-100 transition-opacity" />
        </button>
    );
};

// 3. Modals
export const WeatherModal = ({ weather, isDarkMode, onClose }: { weather: WeatherData | null, isDarkMode: boolean, onClose: () => void }) => {
    const [currentInsightIdx, setCurrentInsightIdx] = useState(0);
    const [weatherTheme, setWeatherTheme] = useState<'light' | 'dark'>('dark');

    useEffect(() => {
        if (!weather?.operationalInsights?.length) return;
        const interval = setInterval(() => {
            setCurrentInsightIdx(prev => (prev + 1) % weather.operationalInsights.length);
        }, 5000); // Rotate insight every 5 seconds
        return () => clearInterval(interval);
    }, [weather]);

    if (!weather) return null;

    const activeTheme = weatherTheme;

    return (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 perspective-1000">
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
                className="absolute inset-0 bg-black/60 backdrop-blur-md"
            />
            <motion.div
                initial={{ y: '100%', opacity: 0, scale: 0.95, rotateX: 10 }}
                animate={{ y: 0, opacity: 1, scale: 1, rotateX: 0 }}
                exit={{ y: '100%', opacity: 0, scale: 0.95, rotateX: 10 }}
                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                className={`relative w-full sm:max-w-md ${activeTheme === 'dark' ? 'bg-[#121214] border-gray-800 shadow-[0_-20px_40px_rgba(0,0,0,0.5)]' : 'bg-white border-gray-200 shadow-[0_-20px_40px_rgba(0,0,0,0.1)]'} rounded-t-[32px] sm:rounded-[32px] border overflow-hidden flex flex-col origin-bottom z-10 max-h-[90vh]`}
            >
                {/* Visual Header */}
                <div className={`p-8 relative overflow-hidden ${activeTheme === 'dark' ? 'bg-gradient-to-b from-blue-900/40 to-transparent' : 'bg-gradient-to-b from-blue-50 to-white'}`}>

                    {weather.condition === 'Rain' && (
                        <div className="absolute inset-0 opacity-30 mix-blend-overlay">
                            <div className="rain-particles w-full h-full bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0IiBoZWlnaHQ9IjEyIj48cmVjdCB3aWR0aD0iMSIgaGVpZ2h0PSI0IiBmaWxsPSIjM2I4MmY2IiBvcGFjaXR5PSIwLjUiLz48L3N2Zz4=')] animate-[rain_0.3s_linear_infinite]" style={{ backgroundSize: '24px 48px' }}></div>
                        </div>
                    )}

                    <div className="flex justify-between items-start relative z-10 mb-6 w-full">
                        <div>
                            <h2 className={`text-2xl font-black ${activeTheme === 'dark' ? 'text-white' : 'text-gray-900'} tracking-tight`}>{weather.location}</h2>
                            <p className={`text-sm font-bold flex items-center gap-1.5 mt-1 ${activeTheme === 'dark' ? 'text-blue-400' : 'text-blue-600'}`}>
                                <MapPin size={14} /> Local Conditions
                            </p>
                        </div>
                        <div className="flex items-center gap-3">
                            <button 
                                onClick={() => setWeatherTheme(prev => prev === 'light' ? 'dark' : 'light')}
                                className={`p-2 rounded-full transition-all flex items-center justify-center relative shadow-lg ${activeTheme === 'dark' ? 'bg-indigo-600 text-white shadow-indigo-500/20' : 'bg-amber-400 text-amber-950 shadow-amber-500/20'}`}
                                title="Toggle Weather Theme"
                            >
                                <motion.div
                                    initial={false}
                                    animate={{ rotate: activeTheme === 'dark' ? 180 : 0, scale: [0.8, 1.1, 1] }}
                                    transition={{ type: 'spring', stiffness: 200 }}
                                >
                                    {activeTheme === 'dark' ? <Moon size={16} fill="currentColor" /> : <Sun size={16} fill="currentColor" />}
                                </motion.div>
                            </button>
                            <button onClick={onClose} className={`p-2 rounded-full transition-colors ${activeTheme === 'dark' ? 'hover:bg-white/10 text-gray-400 hover:text-white' : 'hover:bg-black/5 text-gray-500 hover:text-black'}`}>
                                <X size={20} />
                            </button>
                        </div>
                    </div>

                    <div className="flex items-center justify-between relative z-10">
                        <div className="flex items-baseline gap-2">
                            <span className={`text-6xl font-black tracking-tighter ${activeTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{weather.temp}°</span>
                            <span className={`text-xl font-black ${activeTheme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>{weather.condition}</span>
                        </div>
                        <div className="w-20 h-20 -mt-2 drop-shadow-xl">
                            <WeatherLottie condition={weather.condition} />
                        </div>
                    </div>

                    <div className={`grid grid-cols-4 gap-2 mt-8 relative z-10 bg-white/5 dark:bg-black/20 backdrop-blur-md p-4 rounded-2xl border ${activeTheme === 'dark' ? 'border-white/10' : 'border-gray-900/5'}`}>
                        <div className="text-center">
                            <Thermometer className={`mx-auto mb-1 ${activeTheme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`} size={16} />
                            <p className={`text-xs font-black ${activeTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{weather.humidity}%</p>
                            <p className="text-[9px] uppercase font-bold text-gray-500">Humid</p>
                        </div>
                        <div className="text-center">
                            <Wind className={`mx-auto mb-1 ${activeTheme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`} size={16} />
                            <p className={`text-xs font-black ${activeTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{weather.windSpeed}</p>
                            <p className="text-[9px] uppercase font-bold text-gray-500">km/h</p>
                        </div>
                        <div className="text-center">
                            <Droplets className={`mx-auto mb-1 flex-shrink-0 ${activeTheme === 'dark' ? 'text-blue-400' : 'text-blue-500'}`} size={16} />
                            <p className={`text-xs font-black ${activeTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{weather.rainChance}%</p>
                            <p className="text-[9px] uppercase font-bold text-gray-500">Rain</p>
                        </div>
                        <div className="text-center">
                            <Sun className={`mx-auto mb-1 ${activeTheme === 'dark' ? 'text-amber-400' : 'text-amber-500'}`} size={16} />
                            <p className={`text-xs font-black ${activeTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{weather.uvIndex}</p>
                            <p className="text-[9px] uppercase font-bold text-gray-500">UV</p>
                        </div>
                    </div>
                </div>

                <div className={`px-6 py-4 overflow-y-auto ${activeTheme === 'dark' ? 'bg-[#121214]' : 'bg-white'}`}>
                    {/* Hourly */}
                    <div className="mb-6">
                        <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-3">Today</p>
                        <div className="flex justify-between items-center gap-2 overflow-x-auto custom-scrollbar pb-2 mask-linear">
                            {weather.hourly.map((h, i) => (
                                <div key={i} className="flex flex-col items-center flex-shrink-0 min-w-[50px]">
                                    <p className={`text-[10px] font-bold mb-1 ${activeTheme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>{h.time}</p>
                                    <div className="w-8 h-8 mb-1">
                                        <WeatherLottie condition={h.icon} />
                                    </div>
                                    <p className={`text-sm font-black ${activeTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{h.temp}°</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* AI Insights Rotator */}
                    <div className="relative h-[110px]">
                        <AnimatePresence mode="wait">
                            {weather.operationalInsights && weather.operationalInsights.length > 0 && (
                                <motion.div
                                    key={currentInsightIdx}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    transition={{ duration: 0.3 }}
                                    className={`absolute inset-0 p-4 rounded-2xl border ${weather.operationalInsights[currentInsightIdx].level === 'HIGH' ? (activeTheme === 'dark' ? 'bg-red-500/10 border-red-500/20' : 'bg-red-50 border-red-200') : (weather.operationalInsights[currentInsightIdx].level === 'MEDIUM' ? (activeTheme === 'dark' ? 'bg-amber-500/10 border-amber-500/20' : 'bg-amber-50 border-amber-200') : (activeTheme === 'dark' ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-emerald-50 border-emerald-200'))} overflow-hidden flex flex-col justify-center`}
                                >
                                    <div className="flex items-center justify-between mb-2 relative z-10">
                                        <div className="flex items-center gap-2">
                                            {weather.operationalInsights[currentInsightIdx].level === 'HIGH' ? <AlertTriangle size={14} className="text-red-500" /> : (weather.operationalInsights[currentInsightIdx].level === 'MEDIUM' ? <AlertCircle size={14} className="text-amber-500" /> : <Activity size={14} className="text-emerald-500" />)}
                                            <span className={`text-[10px] font-black uppercase tracking-wider ${weather.operationalInsights[currentInsightIdx].level === 'HIGH' ? 'text-red-500' : (weather.operationalInsights[currentInsightIdx].level === 'MEDIUM' ? 'text-amber-500' : 'text-emerald-500')}`}>
                                                SMART INSIGHT • {weather.operationalInsights[currentInsightIdx].department}: {weather.operationalInsights[currentInsightIdx].level}
                                            </span>
                                        </div>
                                        {/* Pagination Dots */}
                                        <div className="flex gap-1">
                                            {weather.operationalInsights.map((_, i) => (
                                                <div key={i} className={`w-1.5 h-1.5 rounded-full ${i === currentInsightIdx ? (activeTheme === 'dark' ? 'bg-white' : 'bg-gray-800') : (activeTheme === 'dark' ? 'bg-gray-700' : 'bg-gray-300')}`} />
                                            ))}
                                        </div>
                                    </div>
                                    <p className={`text-sm font-bold mb-0.5 relative z-10 leading-tight ${activeTheme === 'dark' ? 'text-white' : 'text-gray-900'} line-clamp-1`}>{weather.operationalInsights[currentInsightIdx].message}</p>
                                    <p className={`text-xs font-medium relative z-10 leading-snug ${activeTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'} line-clamp-2`}>{weather.operationalInsights[currentInsightIdx].suggestion}</p>

                                    {weather.operationalInsights[currentInsightIdx].level === 'HIGH' && (
                                        <div className="absolute right-0 top-0 w-24 h-24 bg-red-500/20 rounded-full blur-3xl -mr-8 -mt-8 pointer-events-none"></div>
                                    )}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

// --- TomTom Live Feed Types ---
interface LiveIncident {
    id: string;
    type: string;
    description: string;
    magnitude: number; 
    delay: number;
    coords: [number, number];
}

export const TrafficModal = ({ traffic, coords, isDarkMode, onClose }: { traffic: TrafficData | null, coords: [number, number], isDarkMode: boolean, onClose: () => void }) => {
    const [currentInsightIdx, setCurrentInsightIdx] = useState(0);
    const [lifestyleIndex, setLifestyleIndex] = useState(0);
    const [mapTheme, setMapTheme] = useState<'light' | 'dark'>('dark');
    const [liveIncidents, setLiveIncidents] = useState<LiveIncident[]>([]);
    const [isSyncing, setIsSyncing] = useState(false);
    
    const commuteInsights = traffic?.operationalInsights?.filter(i => i.department === 'Commute') || [];
    const lifestyleInsights = traffic?.operationalInsights?.filter(i => i.department === 'Lifestyle') || [];
    
    const TOMTOM_KEY = import.meta.env.VITE_TOMTOM_API_KEY;
    const hasKey = TOMTOM_KEY && TOMTOM_KEY !== 'your_tomtom_api_key_here';

    useEffect(() => {
        if (!traffic?.operationalInsights?.length) return;
        const interval = setInterval(() => {
            setCurrentInsightIdx(prev => (prev + 1) % traffic.operationalInsights!.length);
        }, 5000);
        return () => clearInterval(interval);
    }, [traffic]);

    // --- TomTom Real-Time Incident Fetching ---
    useEffect(() => {
        if (!hasKey || !coords) return;

        const fetchLiveIncidents = async () => {
            setIsSyncing(true);
            try {
                // Correct BBox order for TomTom: minLon,minLat,maxLon,maxLat
                const offset = 0.5; // ~50km coverage
                const [lat, lon] = coords;
                const bbox = [
                    lon - offset, lat - offset, // Bottom Left (Lon, Lat)
                    lon + offset, lat + offset  // Top Right (Lon, Lat)
                ].join(',');

                // Use the latest V5 Incident Details API
                const res = await fetch(`https://api.tomtom.com/traffic/services/5/incidentDetails?key=${TOMTOM_KEY}&bbox=${bbox}&fields={incidents{id,type,description,magnitude,delay,geometry{type,coordinates}}}&language=en-GB`);
                
                if (res.ok) {
                    const data = await res.json();
                    console.log("TomTom V5 Raw Data:", data);
                    
                    if (data.incidents) {
                        const mapped = data.incidents.map((inc: any) => {
                            const point = inc.geometry?.type === 'Point' ? inc.geometry.coordinates : 
                                         (inc.geometry?.type === 'LineString' ? inc.geometry.coordinates[0] : [lon, lat]);
                            
                            return {
                                id: inc.id,
                                type: inc.type === 'ACCIDENT' ? 'Accident' : (inc.type === 'JAM' ? 'Jam' : 'Construction'),
                                description: inc.description || 'Traffic incident reported',
                                magnitude: inc.magnitude || 0,
                                delay: Math.round((inc.delay || 0) / 60),
                                coords: [point[1], point[0]] as [number, number] // V5 is [lon, lat], we need [lat, lng]
                            };
                        });
                        setLiveIncidents(mapped.slice(0, 10));
                    }
                }
            } catch (err) {
                console.error("Live fetch error:", err);
                toast.error('Metropolitan Feed Error', {
                    description: 'Failed to synchronize live traffic incidents. Check connection.'
                });
            } finally {
                setIsSyncing(false);
            }
        };

        fetchLiveIncidents();
        const refreshInterval = setInterval(fetchLiveIncidents, 60000); // Sync every minute
        return () => clearInterval(refreshInterval);
    }, [hasKey, coords, TOMTOM_KEY]);

    if (!traffic) return null;
    const isDelayed = traffic.currentTravelTime > traffic.normalTravelTime;

    return (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 perspective-1000">
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
                className="absolute inset-0 bg-black/60 backdrop-blur-md"
            />
            <motion.div
                initial={{ y: '100%', opacity: 0, scale: 0.95, rotateX: 10 }}
                animate={{ y: 0, opacity: 1, scale: 1, rotateX: 0 }}
                exit={{ y: '100%', opacity: 0, scale: 0.95, rotateX: 10 }}
                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                className={`relative w-full sm:max-w-4xl ${mapTheme === 'dark' ? 'bg-[#1a1c1e] border-gray-800 shadow-[0_-20px_40px_rgba(0,0,0,0.5)]' : 'bg-white border-gray-200 shadow-[0_-20px_40px_rgba(0,0,0,0.1)]'} rounded-t-[32px] sm:rounded-[32px] border overflow-hidden flex flex-col origin-bottom z-10 max-h-[90vh]`}
            >
                <div className={`px-8 py-6 border-b flex justify-between items-center ${mapTheme === 'dark' ? 'border-[#2d2f31] bg-[#1a1c1e]' : 'border-gray-100 bg-gray-50'}`}>
                    <div>
                        <h2 className={`text-2xl font-black tracking-tight ${mapTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{traffic.route}</h2>
                        <p className="text-sm font-bold text-gray-400">Environmental & Mobility Control Center</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className={`px-4 py-2 rounded-full text-xs font-black flex items-center gap-2 ${traffic.status === 'Clear' ? 'bg-emerald-500/10 text-emerald-500' : (traffic.status === 'Moderate' ? 'bg-amber-500/10 text-amber-500' : 'bg-red-500/10 text-red-500')}`}>
                            <div className={`w-2 h-2 rounded-full bg-current ${isDelayed ? 'animate-pulse' : ''}`} />
                             {traffic.status.toUpperCase()} FLOW
                        </div>
                        <button 
                            onClick={() => setMapTheme(prev => prev === 'light' ? 'dark' : 'light')}
                            className={`p-2.5 rounded-full transition-all flex items-center justify-center relative shadow-lg ${mapTheme === 'dark' ? 'bg-indigo-600 text-white shadow-indigo-500/20' : 'bg-amber-400 text-amber-950 shadow-amber-500/20'}`}
                            title="Toggle Map Theme"
                        >
                            <motion.div
                                initial={false}
                                animate={{ rotate: mapTheme === 'dark' ? 180 : 0, scale: [0.8, 1.1, 1] }}
                                transition={{ type: 'spring', stiffness: 200 }}
                            >
                                {mapTheme === 'dark' ? <Moon size={18} fill="currentColor" /> : <Sun size={18} fill="currentColor" />}
                            </motion.div>
                        </button>
                        <button onClick={onClose} className={`p-2 rounded-full transition-colors ${mapTheme === 'dark' ? 'hover:bg-white/5 text-gray-500 hover:text-white' : 'hover:bg-black/5 text-gray-400 hover:text-black'}`}>
                            <X size={20} />
                        </button>
                    </div>
                </div>

                <div className={`flex flex-col lg:flex-row h-[600px] border-t ${mapTheme === 'dark' ? 'border-[#2d2f31] divide-[#2d2f31]' : 'border-gray-100 divide-gray-100'} divide-x`}>
                    {/* Left Pane: Large Map */}
                    <div className="flex-1 relative overflow-hidden h-[300px] lg:h-full cursor-pointer">
                         <MapContainer
                            center={coords}
                            zoom={13}
                            scrollWheelZoom={true}
                            style={{ height: '100%', width: '100%', zIndex: 0 }}
                            zoomControl={false}
                            className="force-pointer"
                        >
                            <TileLayer
                                url={hasKey 
                                    ? `https://{s}.api.tomtom.com/map/1/tile/basic/${mapTheme === 'dark' ? 'night' : 'main'}/{z}/{x}/{y}.png?key=${TOMTOM_KEY}`
                                    : (mapTheme === 'dark' ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" : "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png")
                                }
                                subdomains={hasKey ? "abcd" : "abc"}
                                attribution={hasKey ? '&copy; <a href="https://www.tomtom.com/">TomTom</a>' : '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'}
                            />
                            {/* TomTom Traffic Flow Layer (Real-Time Overlays) */}
                            {hasKey && (
                                <TileLayer
                                    url={`https://{s}.api.tomtom.com/traffic/map/4/tile/flow/absolute/{z}/{x}/{y}.png?key=${TOMTOM_KEY}`}
                                    subdomains="abcd"
                                    opacity={0.9}
                                    zIndex={10}
                                />
                            )}
                            <ChangeView center={coords} />
                            
                            {/* User Marker */}
                            <Marker position={coords}>
                                <Popup><div className="font-bold">Operational Base</div></Popup>
                            </Marker>
                             {/* TomTom Real-Time Incident Markers */}
                             {liveIncidents.map((inc) => (
                                 <PulseCircle
                                     key={inc.id}
                                     center={inc.coords}
                                     color={inc.type === 'Accident' ? '#ef4444' : (inc.type === 'Jam' ? '#f59e0b' : '#3b82f6')}
                                     label={inc.type}
                                 />
                             ))}
                         </MapContainer>
                        
                        <div className="absolute top-4 left-4 z-[400] flex flex-col gap-2">
                             <div className={`backdrop-blur-md border px-3 py-1.5 rounded-lg ${mapTheme === 'dark' ? 'bg-black/40 border-white/10' : 'bg-white/60 border-black/10'}`}>
                                <p className={`text-[10px] font-black uppercase tracking-widest leading-tight ${mapTheme === 'dark' ? 'text-white/70' : 'text-black/60'}`}>Live Layer</p>
                                <p className={`text-xs font-bold flex items-center gap-1.5 mt-0.5 ${mapTheme === 'dark' ? 'text-white' : 'text-black'}`}>
                                    <div className={`w-1.5 h-1.5 rounded-full animate-pulse ${hasKey ? 'bg-blue-500' : 'bg-amber-500'}`} />
                                    {hasKey ? 'TomTom Real-Time' : 'TomTom (API Key Required)'}
                                </p>
                             </div>
                        </div>
                    </div>

                    {/* Right Pane: Alert Feed & Metrics */}
                    <div className={`w-full lg:w-[380px] flex flex-col ${mapTheme === 'dark' ? 'bg-[#1a1c1e]' : 'bg-white'}`}>
                        <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
                            {/* High Priority Alerts First */}
                             <div className="mb-8">
                                <div className="flex justify-between items-center mb-4">
                                    <h4 className={`text-[10px] font-black uppercase tracking-widest ${mapTheme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>Live Metropolitan Feed</h4>
                                    {isSyncing && <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />}
                                </div>
                                <div className="space-y-4">
                                    {liveIncidents.length > 0 ? (
                                        liveIncidents.map((inc) => (
                                            <div key={inc.id} className={`p-4 rounded-2xl border transition-all ${mapTheme === 'dark' ? 'bg-[#25282a] border-white/5' : 'bg-gray-50 border-gray-100'}`}>
                                                <div className="flex items-center justify-between mb-2">
                                                    <div className="flex items-center gap-2">
                                                        <div className={`p-1.5 rounded-lg ${inc.type === 'Accident' ? 'bg-red-500/20 text-red-500' : (inc.type === 'Jam' ? 'bg-amber-500/20 text-amber-500' : 'bg-blue-500/20 text-blue-500')}`}>
                                                            {inc.type === 'Accident' ? <AlertCircle size={14} /> : (inc.type === 'Jam' ? <Navigation size={14} /> : <Activity size={14} />)}
                                                        </div>
                                                        <span className={`text-[10px] font-black uppercase ${inc.type === 'Accident' ? 'text-red-500' : (inc.type === 'Jam' ? 'text-amber-500' : 'text-blue-500')}`}>{inc.type}</span>
                                                    </div>
                                                    {inc.delay > 0 && <span className="text-[10px] font-black text-gray-500">+{inc.delay}m Delay</span>}
                                                </div>
                                                <p className={`text-sm font-bold leading-snug ${mapTheme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{inc.description}</p>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="p-6 text-center">
                                            <div className="w-12 h-12 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-3">
                                                <Activity size={24} className="text-emerald-500" />
                                            </div>
                                            <p className="text-sm font-bold text-gray-400">All routes flowing smoothly. No active incidents detected.</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Secondary Insights */}
                            <div className="mb-6">
                                <h4 className={`text-[10px] font-black uppercase tracking-widest mb-4 ${mapTheme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>Intelligence Feed</h4>
                                <div className="space-y-3">
                                    {/* Commute Alert */}
                                    {commuteInsights.map((insight, idx) => (
                                        <div key={`commute-${idx}`} className={`p-4 rounded-xl border ${mapTheme === 'dark' ? 'bg-[#25282a] border-white/5' : 'bg-gray-50 border-gray-100'}`}>
                                            <div className="flex items-center justify-between mb-1">
                                                <span className="text-[9px] font-black text-blue-500 uppercase">{insight.department}</span>
                                                <span className={`text-[9px] font-bold ${insight.level === 'HIGH' ? 'text-red-500' : (insight.level === 'MEDIUM' ? 'text-amber-500' : 'text-emerald-500')}`}>{insight.level}</span>
                                            </div>
                                            <p className={`text-xs font-bold mb-1 ${mapTheme === 'dark' ? 'text-gray-200' : 'text-gray-900'}`}>{insight.message}</p>
                                            <p className="text-[10px] text-gray-500 font-medium leading-tight">{insight.suggestion}</p>
                                        </div>
                                    ))}

                                    {/* Lifestyle Recommendation (Cyclable) */}
                                    {lifestyleInsights.length > 0 && (
                                        <div className={`p-4 rounded-xl border transition-all duration-300 ${mapTheme === 'dark' ? 'bg-[#25282a] border-white/5' : 'bg-gray-50 border-gray-100'}`}>
                                            <div className="flex items-center justify-between mb-2">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-[9px] font-black text-emerald-500 uppercase">Lifestyle</span>
                                                    <span className="text-[9px] font-bold text-gray-400">Low</span>
                                                </div>
                                                {lifestyleInsights.length > 1 && (
                                                    <button 
                                                        onClick={() => setLifestyleIndex((lifestyleIndex + 1) % lifestyleInsights.length)}
                                                        className={`p-1 rounded-md transition-colors ${mapTheme === 'dark' ? 'hover:bg-white/10 text-white/50' : 'hover:bg-black/5 text-black/40'}`}
                                                    >
                                                        <RefreshCw size={10} className={lifestyleIndex > 0 ? 'animate-spin-once' : ''} />
                                                    </button>
                                                )}
                                            </div>
                                            <AnimatePresence mode="wait">
                                                <motion.div
                                                    key={lifestyleIndex}
                                                    initial={{ opacity: 0, x: 5 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    exit={{ opacity: 0, x: -5 }}
                                                    transition={{ duration: 0.2 }}
                                                >
                                                    <p className={`text-xs font-bold mb-1 ${mapTheme === 'dark' ? 'text-gray-200' : 'text-gray-900'}`}>{lifestyleInsights[lifestyleIndex].message}</p>
                                                    <p className="text-[10px] text-gray-500 font-medium leading-tight">{lifestyleInsights[lifestyleIndex].suggestion}</p>
                                                </motion.div>
                                            </AnimatePresence>
                                            {lifestyleInsights.length > 1 && (
                                                <div className="flex gap-1 mt-3">
                                                    {lifestyleInsights.map((_, i) => (
                                                        <div key={i} className={`h-0.5 flex-1 rounded-full transition-all ${i === lifestyleIndex ? 'bg-emerald-500' : (mapTheme === 'dark' ? 'bg-white/10' : 'bg-black/10')}`} />
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Bottom Stats Footer */}
                        <div className={`p-6 border-t ${mapTheme === 'dark' ? 'border-[#2d2f31] bg-[#1a1c1e]' : 'border-gray-100 bg-gray-50'}`}>
                            <div className="flex justify-between items-center">
                                <div>
                                    <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Est. Travel Time</p>
                                    <p className={`text-2xl font-black ${isDelayed ? 'text-red-500' : 'text-emerald-500'}`}>{traffic.currentTravelTime} <span className="text-sm font-bold text-gray-500">mins</span></p>
                                </div>
                                <div className="text-right">
                                    <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Normal</p>
                                    <p className={`text-sm font-bold ${mapTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{traffic.normalTravelTime} mins</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};
