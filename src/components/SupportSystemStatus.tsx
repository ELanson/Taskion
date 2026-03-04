import React from 'react';
import { useAppStore } from '../store/useAppStore';
import { CheckCircle2, AlertTriangle, XCircle, Clock, Database, Cpu, Wifi, Activity, RefreshCw } from 'lucide-react';

interface Service {
    name: string;
    status: 'operational' | 'degraded' | 'outage';
    uptime: string;
    latency?: string;
    adminOnly?: boolean;
}

const SERVICES: Service[] = [
    { name: 'API Gateway', status: 'operational', uptime: '99.98%', latency: '42ms' },
    { name: 'Database (Supabase)', status: 'operational', uptime: '99.95%', latency: '18ms' },
    { name: 'AI Service (Yukime)', status: 'operational', uptime: '99.87%', latency: '380ms' },
    { name: 'Sync Worker', status: 'operational', uptime: '99.91%', latency: '60ms' },
    { name: 'Auth Service', status: 'operational', uptime: '100%', latency: '22ms' },
    { name: 'Storage Layer', status: 'operational', uptime: '99.99%', latency: '30ms', adminOnly: true },
    { name: 'Background Jobs', status: 'operational', uptime: '99.60%', latency: '—', adminOnly: true },
];

const INCIDENTS = [
    { date: '2026-02-20', title: 'AI Service elevated latency', severity: 'minor', resolved: true, description: 'Yukime AI service experienced 2x normal latency for approximately 18 minutes due to a cold-start issue. Resolved by scaling the inference cluster.' },
    { date: '2026-02-14', title: 'Database connection pool exhaustion', severity: 'major', resolved: true, description: 'A query that wasn\'t using connection pooling correctly caused temporary connection errors for ~5 minutes. Fixed by deploying a patched version of the connection manager.' },
];

const STATUS_ICONS = {
    operational: <CheckCircle2 size={16} className="text-emerald-500" />,
    degraded: <AlertTriangle size={16} className="text-amber-500" />,
    outage: <XCircle size={16} className="text-rose-500" />,
};

const STATUS_LABELS = { operational: 'Operational', degraded: 'Degraded', outage: 'Outage' };
const STATUS_COLORS = {
    operational: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    degraded: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    outage: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
};

export const SupportSystemStatus: React.FC = () => {
    const { isDarkMode, isAdmin } = useAppStore();
    const dk = isDarkMode;

    const visibleServices = SERVICES.filter(s => !s.adminOnly || isAdmin);
    const overallStatus: 'operational' | 'degraded' | 'outage' = visibleServices.some(s => s.status === 'outage') ? 'outage'
        : visibleServices.some(s => s.status === 'degraded') ? 'degraded' : 'operational';

    return (
        <div className="space-y-6">
            {/* Overall Health Banner */}
            <div className={`p-6 rounded-2xl border ${overallStatus === 'operational'
                ? dk ? 'bg-emerald-900/20 border-emerald-800/40' : 'bg-emerald-50 border-emerald-200'
                : dk ? 'bg-amber-900/20 border-amber-800/40' : 'bg-amber-50 border-amber-200'
                }`}>
                <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${overallStatus === 'operational' ? 'bg-emerald-500/20' : 'bg-amber-500/20'}`}>
                        {overallStatus === 'operational' ? <CheckCircle2 size={24} className="text-emerald-500" /> : <AlertTriangle size={24} className="text-amber-500" />}
                    </div>
                    <div>
                        <h3 className={`font-black text-lg ${dk ? 'text-white' : 'text-gray-900'}`}>
                            {overallStatus === 'operational' ? 'All Systems Operational' : overallStatus === 'degraded' ? 'Partial Service Disruption' : 'Service Outage'}
                        </h3>
                        <p className="text-sm text-gray-500">Last updated: {new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</p>
                    </div>
                    <button className={`ml-auto p-2 rounded-lg transition-colors ${dk ? 'bg-gray-800 hover:bg-gray-700 text-gray-400' : 'bg-white hover:bg-gray-50 text-gray-500 border border-gray-200'}`}>
                        <RefreshCw size={14} />
                    </button>
                </div>
            </div>

            {/* If contributor, just show the banner + simple message */}
            {!isAdmin && (
                <div className={`p-5 rounded-2xl border ${dk ? 'bg-[#121214] border-gray-800' : 'bg-white border-gray-200'}`}>
                    <p className={`text-sm ${dk ? 'text-gray-400' : 'text-gray-600'}`}>
                        Detailed infrastructure metrics are available to administrators. If you are experiencing issues, please <strong className={dk ? 'text-white' : 'text-gray-900'}>submit a support ticket</strong>.
                    </p>
                </div>
            )}

            {/* Service Grid (Admin/Manager) */}
            {isAdmin && (
                <>
                    <div>
                        <h4 className={`text-xs font-bold uppercase tracking-widest mb-3 ${dk ? 'text-gray-500' : 'text-gray-400'}`}>Service Health</h4>
                        <div className="space-y-2">
                            {visibleServices.map(service => (
                                <div key={service.name} className={`flex items-center gap-4 p-4 rounded-xl border ${dk ? 'bg-[#121214] border-gray-800' : 'bg-white border-gray-200'}`}>
                                    <div className="shrink-0">{STATUS_ICONS[service.status]}</div>
                                    <p className={`flex-1 text-sm font-medium ${dk ? 'text-gray-200' : 'text-gray-800'}`}>{service.name}</p>
                                    <div className="flex items-center gap-3">
                                        {service.latency && (
                                            <span className="text-[11px] text-gray-500 hidden sm:block">
                                                <span className="font-bold text-gray-400">{service.latency}</span> avg
                                            </span>
                                        )}
                                        <span className="text-[11px] text-gray-500 hidden sm:block">
                                            <span className="font-bold text-emerald-400">{service.uptime}</span> uptime
                                        </span>
                                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${STATUS_COLORS[service.status]}`}>
                                            {STATUS_LABELS[service.status]}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Uptime Overview */}
                    <div className={`p-6 rounded-2xl border ${dk ? 'bg-[#121214] border-gray-800' : 'bg-white border-gray-200'}`}>
                        <h4 className={`text-xs font-bold uppercase tracking-widest mb-4 ${dk ? 'text-gray-500' : 'text-gray-400'}`}>90-Day Uptime Overview</h4>
                        <div className="flex gap-1">
                            {Array.from({ length: 90 }, (_, i) => {
                                const issue = i === 70 || i === 76;
                                return <div key={i} className={`flex-1 h-8 rounded-sm ${issue ? 'bg-amber-500/60' : 'bg-emerald-500/60'}`} title={issue ? 'Degraded' : 'Operational'} />;
                            })}
                        </div>
                        <div className="flex items-center justify-between mt-2">
                            <span className="text-[10px] text-gray-500">90 days ago</span>
                            <div className="flex items-center gap-3">
                                <span className="flex items-center gap-1 text-[10px] text-emerald-400"><div className="w-2 h-2 rounded-sm bg-emerald-500/60" /> Operational</span>
                                <span className="flex items-center gap-1 text-[10px] text-amber-400"><div className="w-2 h-2 rounded-sm bg-amber-500/60" /> Degraded</span>
                            </div>
                            <span className="text-[10px] text-gray-500">Today</span>
                        </div>
                    </div>

                    {/* Incidents */}
                    <div>
                        <h4 className={`text-xs font-bold uppercase tracking-widest mb-3 ${dk ? 'text-gray-500' : 'text-gray-400'}`}>Recent Incidents</h4>
                        <div className="space-y-3">
                            {INCIDENTS.map((inc, i) => (
                                <div key={i} className={`p-4 rounded-xl border ${dk ? 'bg-[#121214] border-gray-800' : 'bg-white border-gray-200'}`}>
                                    <div className="flex items-start justify-between gap-3">
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${inc.severity === 'minor' ? 'bg-amber-500/10 text-amber-400' : 'bg-rose-500/10 text-rose-400'}`}>
                                                    {inc.severity}
                                                </span>
                                                <span className="text-[10px] text-gray-500">{inc.date}</span>
                                                {inc.resolved && <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-emerald-500/10 text-emerald-400">Resolved</span>}
                                            </div>
                                            <p className={`text-sm font-bold ${dk ? 'text-white' : 'text-gray-900'}`}>{inc.title}</p>
                                            <p className={`text-xs mt-1 ${dk ? 'text-gray-400' : 'text-gray-600'}`}>{inc.description}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};
