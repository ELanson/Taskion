import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '../store/useAppStore';
import {
    X,
    Download,
    Share2,
    BrainCircuit,
    TrendingUp,
    TrendingDown,
    Clock,
    CheckSquare,
    Target,
    AlertTriangle,
    BarChart3,
    Activity
} from 'lucide-react';

export const ReportViewer: React.FC = () => {
    const {
        generatedReportData,
        setGeneratedReportData,
        isDarkMode
    } = useAppStore();

    if (!generatedReportData) return null;

    // Destructure real data from the backend engine
    const { template, scope, dateRange, useAI, stats, aiContent } = generatedReportData;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[60] flex flex-col bg-gray-50 dark:bg-[#0A0A0B]">
                {/* Header Navbar */}
                <motion.div
                    initial={{ y: -50 }}
                    animate={{ y: 0 }}
                    className={`shrink-0 h-16 px-6 border-b flex items-center justify-between shadow-sm z-10 ${isDarkMode ? 'bg-[#121214] border-gray-800' : 'bg-white border-gray-200'}`}
                >
                    <div className="flex items-center gap-4">
                        <div className={`p-2 rounded-lg ${isDarkMode ? 'bg-indigo-500/10 text-indigo-400' : 'bg-indigo-50 text-indigo-600'}`}>
                            <BarChart3 size={20} />
                        </div>
                        <div>
                            <h2 className={`text-base font-black ${isDarkMode ? 'text-white' : 'text-gray-900'} uppercase tracking-widest`}>
                                Intelligence Report: {template}
                            </h2>
                            <p className="text-xs text-gray-500 font-medium">
                                Scope: {scope.toUpperCase()} • Range: {dateRange.toUpperCase()}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <button className={`p-2 rounded-xl transition-colors ${isDarkMode ? 'hover:bg-gray-800 text-gray-400 hover:text-white' : 'hover:bg-gray-100 text-gray-500 hover:text-gray-900'} hidden sm:block`} title="Export PDF">
                            <Download size={18} />
                        </button>
                        <button className={`p-2 rounded-xl transition-colors ${isDarkMode ? 'hover:bg-gray-800 text-gray-400 hover:text-white' : 'hover:bg-gray-100 text-gray-500 hover:text-gray-900'} hidden sm:block`} title="Share Link">
                            <Share2 size={18} />
                        </button>
                        <div className="w-px h-6 bg-gray-200 dark:bg-gray-800 mx-2" />
                        <button
                            onClick={() => setGeneratedReportData(null)}
                            className={`p-2 rounded-xl border transition-colors flex items-center gap-2 ${isDarkMode ? 'border-gray-800 hover:bg-gray-800 text-gray-300' : 'border-gray-200 hover:bg-gray-100 text-gray-700'}`}
                        >
                            <X size={16} />
                            <span className="text-sm font-bold hidden sm:inline">Close</span>
                        </button>
                    </div>
                </motion.div>

                {/* Report Content Scrollable */}
                <div className="flex-1 overflow-y-auto w-full max-w-5xl mx-auto p-4 sm:p-8 space-y-8 pb-32 custom-scrollbar">

                    {/* 1. AI Narrative Summary */}
                    {useAI && aiContent && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className={`p-6 sm:p-8 rounded-[24px] border border-transparent shadow-lg relative overflow-hidden ${isDarkMode ? 'bg-[#121214] border-gray-800/50' : 'bg-white'}`}
                        >
                            {/* Decorative AI Glow */}
                            <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/10 blur-3xl rounded-full translate-x-1/2 -translate-y-1/2 pointer-events-none" />

                            <div className="flex items-center gap-3 mb-6 relative z-10">
                                <div className="p-2 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 text-white shadow-lg shadow-purple-500/20">
                                    <BrainCircuit size={20} />
                                </div>
                                <h3 className={`text-xl font-black ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Executive Summary</h3>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
                                <div className="md:col-span-2 space-y-4">
                                    <p className={`text-sm leading-relaxed whitespace-pre-wrap ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                        {aiContent.executiveSummary}
                                    </p>

                                    {aiContent.recommendations && aiContent.recommendations.length > 0 && (
                                        <div className="pt-4 space-y-2">
                                            <p className={`text-[10px] font-bold uppercase tracking-widest ${isDarkMode ? 'text-indigo-400' : 'text-indigo-600'}`}>AI Recommendations</p>
                                            <div className="grid grid-cols-1 gap-2">
                                                {aiContent.recommendations.map((rec: string, i: number) => (
                                                    <div key={i} className={`text-xs p-3 rounded-lg border flex items-center gap-2 ${isDarkMode ? 'bg-indigo-500/5 border-indigo-500/20 text-gray-300' : 'bg-indigo-50 border-indigo-100 text-indigo-900'}`}>
                                                        <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                                                        {rec}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                                <div className="space-y-3">
                                    {aiContent.risks && aiContent.risks.map((risk: string, i: number) => (
                                        <div key={i} className={`p-4 rounded-xl border flex items-start gap-3 ${isDarkMode ? 'bg-rose-500/5 border-rose-500/10' : 'bg-rose-50 border-rose-100'}`}>
                                            <AlertTriangle size={16} className="text-rose-500 shrink-0 mt-0.5" />
                                            <div>
                                                <p className={`text-xs font-bold ${isDarkMode ? 'text-rose-400' : 'text-rose-700'} uppercase tracking-wider mb-1`}>Identified Risk</p>
                                                <p className={`text-xs ${isDarkMode ? 'text-rose-300/80' : 'text-rose-800/80'}`}>{risk}</p>
                                            </div>
                                        </div>
                                    ))}
                                    <button className="w-full py-2.5 text-xs font-bold bg-indigo-500/10 text-indigo-500 dark:text-indigo-400 hover:bg-indigo-500/20 rounded-xl transition-colors">
                                        Ask AI to elaborate
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* 2. KPI Metrics */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="grid grid-cols-2 md:grid-cols-4 gap-4"
                    >
                        <MetricCard title="Total Output" value={`${stats?.totalTasks || 0} Tasks`} icon={<CheckSquare size={16} />} trend="+12" isDarkMode={isDarkMode} />
                        <MetricCard title="Time Captured" value={`${stats?.totalHours || 0} Hrs`} icon={<Clock size={16} />} trend="+4.5" isDarkMode={isDarkMode} />
                        <MetricCard title="Velocity Score" value={stats?.completionRate >= 80 ? 'A' : (stats?.completionRate >= 60 ? 'B' : 'C')} icon={<Activity size={16} />} isDarkMode={isDarkMode} />
                        <MetricCard title="Success Rate" value={`${stats?.completionRate || 0}%`} icon={<Target size={16} />} trend="-2" isDarkMode={isDarkMode} />
                    </motion.div>

                    {/* 3. Visualizations (Mock Bars - Still Mocked for Layout) */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className={`p-6 sm:p-8 rounded-[24px] border shadow-sm ${isDarkMode ? 'bg-[#121214] border-gray-800' : 'bg-white border-gray-100'}`}
                    >
                        <h3 className={`text-lg font-bold mb-6 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Velocity Breakdown</h3>

                        <div className="space-y-6">
                            <ProgressBar label="Overall Progress" value={stats?.completionRate || 0} color="bg-indigo-500" isDarkMode={isDarkMode} />
                            <ProgressBar label="Active Utilization" value={Math.min(100, (stats?.totalHours || 0) / 40 * 100)} color="bg-emerald-500" isDarkMode={isDarkMode} />
                        </div>
                    </motion.div>

                </div>
            </div>
        </AnimatePresence>
    );
};

// Helper Components
const MetricCard = ({ title, value, icon, trend, isDarkMode }: any) => {
    const isPositive = trend && trend.startsWith('+');

    return (
        <div className={`p-5 rounded-[20px] border shadow-sm flex flex-col justify-between h-32 ${isDarkMode ? 'bg-[#121214] border-gray-800' : 'bg-white border-gray-100'}`}>
            <div className="flex items-center justify-between">
                <div className={`p-2 rounded-lg ${isDarkMode ? 'bg-gray-800 text-gray-400' : 'bg-gray-100 text-gray-500'}`}>
                    {icon}
                </div>
                {trend && (
                    <div className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full ${isPositive ? (isDarkMode ? 'bg-emerald-500/10 text-emerald-400' : 'bg-emerald-50 text-emerald-600') : (isDarkMode ? 'bg-rose-500/10 text-rose-400' : 'bg-rose-50 text-rose-600')}`}>
                        {isPositive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                        {trend}%
                    </div>
                )}
            </div>
            <div>
                <p className="text-[10px] font-bold tracking-widest uppercase text-gray-500 mb-1">{title}</p>
                <p className={`text-xl font-black ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{value}</p>
            </div>
        </div>
    );
};

const ProgressBar = ({ label, value, color, isDarkMode }: any) => (
    <div>
        <div className="flex justify-between items-center mb-2">
            <span className={`text-sm font-bold ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>{label}</span>
            <span className={`text-xs font-bold ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>{value}%</span>
        </div>
        <div className={`h-2.5 w-full rounded-full overflow-hidden ${isDarkMode ? 'bg-[#1A1A1C] border border-gray-800' : 'bg-gray-100'}`}>
            <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${value}%` }}
                transition={{ duration: 1, ease: 'easeOut' }}
                className={`h-full ${color}`}
            />
        </div>
    </div>
);
