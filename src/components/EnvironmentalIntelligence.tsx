import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CloudRain, Wind, Thermometer, MapPin, Navigation, AlertTriangle, AlertCircle, RefreshCw, Navigation2, Sun, Cloud, CloudLightning, Activity, Droplets } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, useMap, Circle } from 'react-leaflet';
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
    condition: 'Sunny' | 'Cloudy' | 'Rain' | 'Storm';
    rainChance: number;
    windSpeed: number;
    location: string;
    humidity: number;
    uvIndex: number;
    hourly: { time: string; temp: number; icon: 'sun' | 'cloud' | 'rain' | 'storm' }[];
    operationalInsights: {
        department: 'Studio' | 'Production' | 'Logistics' | 'Site Application';
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

// --- Mock Hooks & Services ---
export const useEnvironmentalData = () => {
    const [weather, setWeather] = useState<WeatherData | null>(null);
    const [traffic, setTraffic] = useState<TrafficData | null>(null);
    const [loading, setLoading] = useState(true);
    const [coords, setCoords] = useState<[number, number]>([-1.286389, 36.817223]); // Default to Nairobi
    const [locationPermission, setLocationPermission] = useState<PermissionState | 'prompt'>('prompt');

    useEffect(() => {
        const fetchLocationAndData = async () => {
            if (!navigator.geolocation) {
                setLocationPermission('denied');
                setLoading(false);
                return;
            }

            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const { latitude, longitude } = position.coords;
                    setCoords([latitude, longitude]);
                    setLocationPermission('granted');
                    // In a real app, we would use position.coords.latitude/longitude 
                    // to fetch weather for the actual location.
                    fetchMockData();
                },
                (error) => {
                    console.error("Location error:", error);
                    setLocationPermission('denied');
                    fetchMockData(); // Fallback to mock data (Nairobi) even if denied
                }
            );
        };

        const fetchMockData = () => {
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

                setWeather({
                    temp: currentConditions.temp,
                    condition: currentConditions.icon === 'rain' ? 'Rain' : (currentConditions.icon === 'sun' ? 'Sunny' : (currentConditions.icon === 'storm' ? 'Storm' : 'Cloudy')),
                    rainChance: currentConditions.icon === 'rain' ? 75 : (currentConditions.icon === 'cloud' ? 30 : 5),
                    windSpeed: 12 + Math.floor(Math.random() * 5),
                    location: 'Nairobi',
                    humidity: currentConditions.icon === 'rain' ? 82 : 65,
                    uvIndex: currentHour >= 10 && currentHour <= 16 ? 8 : 1,
                    hourly: hourlyData,
                    operationalInsights: [
                        {
                            department: 'Site Application',
                            level: hourlyData.some(h => h.icon === 'rain') ? 'HIGH' : 'LOW',
                            message: hourlyData.some(h => h.icon === 'rain')
                                ? `Rain expected within ${hourlyData.findIndex(h => h.icon === 'rain')} hours`
                                : 'Clear skies for installation',
                            suggestion: hourlyData.some(h => h.icon === 'rain')
                                ? 'Suspend outdoor high-altitude installations. Secure ground signage.'
                                : 'Proceed with scheduled outdoor installations as planned.'
                        },
                        {
                            department: 'Logistics',
                            level: hourlyData.some(h => h.icon === 'rain') ? 'MEDIUM' : 'LOW',
                            message: 'Weather affecting urban mobility',
                            suggestion: hourlyData.some(h => h.icon === 'rain')
                                ? 'Factor in 30+ minute delays for all urban deliveries today.'
                                : 'Standard delivery windows remain in effect.'
                        },
                        {
                            department: 'Production',
                            level: 'LOW',
                            message: `Ambient humidity at ${currentConditions.icon === 'rain' ? 82 : 65}%`,
                            suggestion: 'Monitor ink drying times on wide-format vinyl printing.'
                        },
                        {
                            department: 'Studio',
                            level: 'LOW',
                            message: currentConditions.icon === 'sun' ? 'Strong natural side-lighting' : 'Overcast skies affecting natural lighting',
                            suggestion: 'Rely on calibrated monitors for accurate color proofing.'
                        }
                    ]
                });

                // Helper to generate dynamic traffic data
                const generateDynamicTraffic = () => {
                    const baseTravelTime = 16;
                    let delay = 0;
                    let status: 'Clear' | 'Moderate' | 'Heavy' = 'Clear';
                    const incidents: string[] = [];
                    const impactAreas: { center: [number, number]; color: string; label: string }[] = [];

                    // Travel time & status based on hour (Rush hour peaks)
                    if ((currentHour >= 7 && currentHour <= 9) || (currentHour >= 16 && currentHour <= 19)) {
                        delay = 15 + Math.floor(Math.random() * 10);
                        status = 'Heavy';
                        incidents.push('Peak hour congestion');
                        impactAreas.push({
                            center: [coords[0] + 0.005, coords[1] + 0.005],
                            color: "#ef4444",
                            label: "Heavy Congestion Area"
                        });
                    } else if (currentHour >= 10 && currentHour <= 15) {
                        delay = 5 + Math.floor(Math.random() * 5);
                        status = 'Moderate';
                        impactAreas.push({
                            center: [coords[0] + 0.005, coords[1] + 0.005],
                            color: "#f59e0b",
                            label: "Moderate Flow"
                        });
                    }

                    // Simulated Roadworks (Active 8AM - 6PM)
                    if (currentHour >= 8 && currentHour <= 18) {
                        incidents.push('Roadworks near Bellevue');
                        impactAreas.push({
                            center: [-1.314, 36.837],
                            color: "#f59e0b",
                            label: "Roadworks at Bellevue"
                        });
                    }

                    // Simulated Flood (Active during Storm/Rain hours)
                    if (currentConditions.icon === 'rain' || currentConditions.icon === 'storm') {
                        incidents.push('Flash flood warning at Valley Arch');
                        impactAreas.push({
                            center: [coords[0] - 0.01, coords[1] - 0.005],
                            color: "#3b82f6",
                            label: "Flash Flood Warning Zone"
                        });
                    }

                    return {
                        status,
                        currentTravelTime: baseTravelTime + delay,
                        normalTravelTime: baseTravelTime,
                        route: 'Mombasa Road',
                        incidents,
                        impactAreas,
                        delayReason: delay > 10 ? 'Significant congestion detected.' : (delay > 0 ? 'Minor congestion detected.' : 'Traffic is flowing smoothly.'),
                        operationalInsights: [
                            {
                                department: 'Logistics',
                                level: status === 'Heavy' ? 'HIGH' : (status === 'Moderate' ? 'MEDIUM' : 'LOW') as 'LOW' | 'MEDIUM' | 'HIGH',
                                message: incidents.length > 0 ? incidents[0] : 'Traffic is currently clear',
                                suggestion: status === 'Heavy'
                                    ? 'Reroute all active dispatch units through Southern Bypass immediately.'
                                    : (status === 'Moderate' ? 'Expect minor delays. Standard routes remain active.' : 'Standard delivery windows remain in effect.')
                            },
                            {
                                department: 'Site Application',
                                level: (status === 'Heavy' ? 'MEDIUM' : 'LOW') as 'LOW' | 'MEDIUM' | 'HIGH',
                                message: `Traffic ${status === 'Heavy' ? 'compounding' : 'not affecting'} installation delays`,
                                suggestion: status === 'Heavy'
                                    ? 'Notify client of revised ETA. Team currently 30 mins behind schedule.'
                                    : 'Schedule remains unaffected by traffic flow.'
                            }
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
            fetchMockData();
        }, 5 * 60 * 1000);
        const trafficInterval = setInterval(() => console.log('Fetching live traffic...'), 2 * 60 * 1000);

        return () => { clearInterval(weatherInterval); clearInterval(trafficInterval); };
    }, []);

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

    useEffect(() => {
        if (!weather?.operationalInsights?.length) return;
        const interval = setInterval(() => {
            setCurrentInsightIdx(prev => (prev + 1) % weather.operationalInsights.length);
        }, 5000); // Rotate insight every 5 seconds
        return () => clearInterval(interval);
    }, [weather]);

    if (!weather) return null;

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
                className={`relative w-full sm:max-w-md ${isDarkMode ? 'bg-[#121214] border-gray-800 shadow-[0_-20px_40px_rgba(0,0,0,0.5)]' : 'bg-white border-gray-200 shadow-[0_-20px_40px_rgba(0,0,0,0.1)]'} rounded-t-[32px] sm:rounded-[32px] border overflow-hidden flex flex-col origin-bottom z-10 max-h-[90vh]`}
            >
                {/* Visual Header */}
                <div className={`p-8 relative overflow-hidden ${isDarkMode ? 'bg-gradient-to-b from-blue-900/40 to-transparent' : 'bg-gradient-to-b from-blue-50 to-white'}`}>

                    {weather.condition === 'Rain' && (
                        <div className="absolute inset-0 opacity-30 mix-blend-overlay">
                            <div className="rain-particles w-full h-full bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0IiBoZWlnaHQ9IjEyIj48cmVjdCB3aWR0aD0iMSIgaGVpZ2h0PSI0IiBmaWxsPSIjM2I4MmY2IiBvcGFjaXR5PSIwLjUiLz48L3N2Zz4=')] animate-[rain_0.3s_linear_infinite]" style={{ backgroundSize: '24px 48px' }}></div>
                        </div>
                    )}

                    <div className="flex justify-between items-start relative z-10 mb-6 w-full">
                        <div>
                            <h2 className={`text-2xl font-black ${isDarkMode ? 'text-white' : 'text-gray-900'} tracking-tight`}>{weather.location}</h2>
                            <p className={`text-sm font-bold flex items-center gap-1.5 mt-1 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}>
                                <MapPin size={14} /> Local Conditions
                            </p>
                        </div>
                        <div className="w-24 h-24 -mt-4 drop-shadow-lg">
                            <WeatherLottie condition={weather.condition} />
                        </div>
                    </div>

                    <div className="flex items-baseline gap-2 relative z-10">
                        <span className={`text-6xl font-black tracking-tighter ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{weather.temp}°</span>
                        <span className={`text-xl font-black ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>{weather.condition}</span>
                    </div>

                    <div className={`grid grid-cols-4 gap-2 mt-8 relative z-10 bg-white/5 dark:bg-black/20 backdrop-blur-md p-4 rounded-2xl border ${isDarkMode ? 'border-white/10' : 'border-gray-900/5'}`}>
                        <div className="text-center">
                            <Thermometer className={`mx-auto mb-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} size={16} />
                            <p className={`text-xs font-black ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{weather.humidity}%</p>
                            <p className="text-[9px] uppercase font-bold text-gray-500">Humid</p>
                        </div>
                        <div className="text-center">
                            <Wind className={`mx-auto mb-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} size={16} />
                            <p className={`text-xs font-black ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{weather.windSpeed}</p>
                            <p className="text-[9px] uppercase font-bold text-gray-500">km/h</p>
                        </div>
                        <div className="text-center">
                            <Droplets className={`mx-auto mb-1 flex-shrink-0 ${isDarkMode ? 'text-blue-400' : 'text-blue-500'}`} size={16} />
                            <p className={`text-xs font-black ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{weather.rainChance}%</p>
                            <p className="text-[9px] uppercase font-bold text-gray-500">Rain</p>
                        </div>
                        <div className="text-center">
                            <Sun className={`mx-auto mb-1 ${isDarkMode ? 'text-amber-400' : 'text-amber-500'}`} size={16} />
                            <p className={`text-xs font-black ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{weather.uvIndex}</p>
                            <p className="text-[9px] uppercase font-bold text-gray-500">UV</p>
                        </div>
                    </div>
                </div>

                <div className="px-6 py-4 overflow-y-auto">
                    {/* Hourly */}
                    <div className="mb-6">
                        <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-3">Today</p>
                        <div className="flex justify-between items-center gap-2 overflow-x-auto custom-scrollbar pb-2 mask-linear">
                            {weather.hourly.map((h, i) => (
                                <div key={i} className="flex flex-col items-center flex-shrink-0 min-w-[50px]">
                                    <p className={`text-[10px] font-bold mb-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>{h.time}</p>
                                    <div className="w-8 h-8 mb-1">
                                        <WeatherLottie condition={h.icon} />
                                    </div>
                                    <p className={`text-sm font-black ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{h.temp}°</p>
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
                                    className={`absolute inset-0 p-4 rounded-2xl border ${weather.operationalInsights[currentInsightIdx].level === 'HIGH' ? (isDarkMode ? 'bg-red-500/10 border-red-500/20' : 'bg-red-50 border-red-200') : (weather.operationalInsights[currentInsightIdx].level === 'MEDIUM' ? (isDarkMode ? 'bg-amber-500/10 border-amber-500/20' : 'bg-amber-50 border-amber-200') : (isDarkMode ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-emerald-50 border-emerald-200'))} overflow-hidden flex flex-col justify-center`}
                                >
                                    <div className="flex items-center justify-between mb-2 relative z-10">
                                        <div className="flex items-center gap-2">
                                            {weather.operationalInsights[currentInsightIdx].level === 'HIGH' ? <AlertTriangle size={14} className="text-red-500" /> : (weather.operationalInsights[currentInsightIdx].level === 'MEDIUM' ? <AlertCircle size={14} className="text-amber-500" /> : <Activity size={14} className="text-emerald-500" />)}
                                            <span className={`text-[10px] font-black uppercase tracking-wider ${weather.operationalInsights[currentInsightIdx].level === 'HIGH' ? 'text-red-500' : (weather.operationalInsights[currentInsightIdx].level === 'MEDIUM' ? 'text-amber-500' : 'text-emerald-500')}`}>
                                                {weather.operationalInsights[currentInsightIdx].department} RISK: {weather.operationalInsights[currentInsightIdx].level}
                                            </span>
                                        </div>
                                        {/* Pagination Dots */}
                                        <div className="flex gap-1">
                                            {weather.operationalInsights.map((_, i) => (
                                                <div key={i} className={`w-1.5 h-1.5 rounded-full ${i === currentInsightIdx ? (isDarkMode ? 'bg-white' : 'bg-gray-800') : (isDarkMode ? 'bg-gray-700' : 'bg-gray-300')}`} />
                                            ))}
                                        </div>
                                    </div>
                                    <p className={`text-sm font-bold mb-0.5 relative z-10 leading-tight ${isDarkMode ? 'text-white' : 'text-gray-900'} line-clamp-1`}>{weather.operationalInsights[currentInsightIdx].message}</p>
                                    <p className={`text-xs font-medium relative z-10 leading-snug ${isDarkMode ? 'text-gray-400' : 'text-gray-600'} line-clamp-2`}>{weather.operationalInsights[currentInsightIdx].suggestion}</p>

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

export const TrafficModal = ({ traffic, coords, isDarkMode, onClose }: { traffic: TrafficData | null, coords: [number, number], isDarkMode: boolean, onClose: () => void }) => {
    const [currentInsightIdx, setCurrentInsightIdx] = useState(0);

    useEffect(() => {
        if (!traffic?.operationalInsights?.length) return;
        const interval = setInterval(() => {
            setCurrentInsightIdx(prev => (prev + 1) % traffic.operationalInsights!.length);
        }, 5000);
        return () => clearInterval(interval);
    }, [traffic]);

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
                className={`relative w-full sm:max-w-xl ${isDarkMode ? 'bg-[#121214] border-gray-800 shadow-[0_-20px_40px_rgba(0,0,0,0.5)]' : 'bg-white border-gray-200 shadow-[0_-20px_40px_rgba(0,0,0,0.1)]'} rounded-t-[32px] sm:rounded-[32px] border overflow-hidden flex flex-col origin-bottom z-10 max-h-[90vh]`}
            >
                <div className={`px-6 py-5 border-b flex justify-between items-center ${isDarkMode ? 'border-gray-800 bg-[#171719]' : 'border-gray-100 bg-gray-50'}`}>
                    <div>
                        <h2 className={`text-lg font-black tracking-tight ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{traffic.route}</h2>
                        <p className="text-xs font-bold text-gray-500">Live Traffic Overview</p>
                    </div>
                    <div className={`px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 ${traffic.status === 'Clear' ? 'bg-emerald-500/10 text-emerald-500' : (traffic.status === 'Moderate' ? 'bg-amber-500/10 text-amber-500' : 'bg-red-500/10 text-red-500')}`}>
                        {traffic.status === 'Clear' ? <Navigation size={12} /> : <AlertTriangle size={12} />}
                        {traffic.status} Status
                    </div>
                </div>

                <div className="p-6">
                    <TrafficMap coords={coords} isDarkMode={isDarkMode} status={traffic.status} impactAreas={traffic.impactAreas} />

                    <div className="grid grid-cols-2 gap-4">
                        <div className={`p-4 rounded-xl border ${isDarkMode ? 'bg-[#1a1c1d] border-gray-800' : 'bg-gray-50 border-gray-100'}`}>
                            <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Current Time</p>
                            <p className={`text-2xl font-black ${isDelayed ? 'text-amber-500' : (isDarkMode ? 'text-white' : 'text-gray-900')}`}>{traffic.currentTravelTime} <span className="text-sm font-bold text-gray-500">min</span></p>
                        </div>
                        <div className={`p-4 rounded-xl border ${isDarkMode ? 'bg-[#1a1c1d] border-gray-800' : 'bg-gray-50 border-gray-100'}`}>
                            <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Normal Time</p>
                            <p className={`text-2xl font-black ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>{traffic.normalTravelTime} <span className="text-sm font-bold text-gray-500">min</span></p>
                        </div>
                    </div>

                    {traffic.incidents.length > 0 && (
                        <div className={`mt-4 p-4 rounded-xl border ${isDarkMode ? 'bg-amber-500/10 border-amber-500/20' : 'bg-amber-50 border-amber-200'}`}>
                            <h4 className={`text-xs font-black uppercase tracking-wider mb-2 flex items-center gap-1.5 ${isDarkMode ? 'text-amber-500' : 'text-amber-700'}`}>
                                <AlertTriangle size={14} /> Reported Incidents
                            </h4>
                            <ul className="space-y-1">
                                {traffic.incidents.map((inc, i) => (
                                    <li key={i} className={`text-sm font-bold ${isDarkMode ? 'text-amber-200' : 'text-amber-900'}`}>• {inc}</li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {/* AI Insights Rotator */}
                    {traffic.operationalInsights && traffic.operationalInsights.length > 0 && (
                        <div className="relative h-[110px] mt-4">
                            <AnimatePresence mode="wait">
                                <motion.div
                                    key={currentInsightIdx}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    transition={{ duration: 0.3 }}
                                    className={`absolute inset-0 p-4 rounded-2xl border ${traffic.operationalInsights[currentInsightIdx].level === 'HIGH' ? (isDarkMode ? 'bg-red-500/10 border-red-500/20' : 'bg-red-50 border-red-200') : (traffic.operationalInsights[currentInsightIdx].level === 'MEDIUM' ? (isDarkMode ? 'bg-amber-500/10 border-amber-500/20' : 'bg-amber-50 border-amber-200') : (isDarkMode ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-emerald-50 border-emerald-200'))} overflow-hidden flex flex-col justify-center`}
                                >
                                    <div className="flex items-center justify-between mb-2 relative z-10">
                                        <div className="flex items-center gap-2">
                                            {traffic.operationalInsights[currentInsightIdx].level === 'HIGH' ? <AlertTriangle size={14} className="text-red-500" /> : (traffic.operationalInsights[currentInsightIdx].level === 'MEDIUM' ? <AlertCircle size={14} className="text-amber-500" /> : <Activity size={14} className="text-emerald-500" />)}
                                            <span className={`text-[10px] font-black uppercase tracking-wider ${traffic.operationalInsights[currentInsightIdx].level === 'HIGH' ? 'text-red-500' : (traffic.operationalInsights[currentInsightIdx].level === 'MEDIUM' ? 'text-amber-500' : 'text-emerald-500')}`}>
                                                {traffic.operationalInsights[currentInsightIdx].department} RISK: {traffic.operationalInsights[currentInsightIdx].level}
                                            </span>
                                        </div>
                                        {/* Pagination Dots */}
                                        <div className="flex gap-1">
                                            {traffic.operationalInsights.map((_, i) => (
                                                <div key={i} className={`w-1.5 h-1.5 rounded-full ${i === currentInsightIdx ? (isDarkMode ? 'bg-white' : 'bg-gray-800') : (isDarkMode ? 'bg-gray-700' : 'bg-gray-300')}`} />
                                            ))}
                                        </div>
                                    </div>
                                    <p className={`text-sm font-bold mb-0.5 relative z-10 leading-tight ${isDarkMode ? 'text-white' : 'text-gray-900'} line-clamp-1`}>{traffic.operationalInsights[currentInsightIdx].message}</p>
                                    <p className={`text-xs font-medium relative z-10 leading-snug ${isDarkMode ? 'text-gray-400' : 'text-gray-600'} line-clamp-2`}>{traffic.operationalInsights[currentInsightIdx].suggestion}</p>

                                    {traffic.operationalInsights[currentInsightIdx].level === 'HIGH' && (
                                        <div className="absolute right-0 top-0 w-24 h-24 bg-red-500/20 rounded-full blur-3xl -mr-8 -mt-8 pointer-events-none"></div>
                                    )}
                                </motion.div>
                            </AnimatePresence>
                        </div>
                    )}
                </div>
            </motion.div>
        </div>
    );
};
