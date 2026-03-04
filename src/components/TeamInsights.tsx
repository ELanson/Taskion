import React from 'react';
import { Target, AlertTriangle, TrendingDown, Users, CheckCircle2 } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';

export const TeamInsights: React.FC = () => {
    const { isDarkMode } = useAppStore();

    return (
        <div className="space-y-6 animate-in fade-in duration-300">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-200 dark:border-gray-800 pb-6 mb-6">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-emerald-500 text-white shadow-lg shadow-emerald-500/30">
                        <Users size={24} />
                    </div>
                    <div>
                        <h2 className={`text-2xl font-black ${isDarkMode ? 'text-white' : 'text-gray-900'} tracking-tight`}>Team Insights</h2>
                        <p className="text-gray-500 text-sm mt-1">Operational metrics and workload distribution for your scoped team</p>
                    </div>
                </div>
            </div>

            <div className="space-y-6">
                {/* Team Productivity Engine */}
                <div className={`${isDarkMode ? 'bg-[#121214] border-gray-800' : 'bg-white border-gray-100'} rounded-[20px] border shadow-sm p-6 lg:p-8 flex flex-col`}>
                    <div className="flex items-center gap-3 mb-6 border-b border-gray-100 dark:border-gray-800 pb-4">
                        <div className={`p-2 rounded-lg ${isDarkMode ? 'bg-amber-500/10 text-amber-500' : 'bg-amber-50 text-amber-600'}`}>
                            <Target size={20} />
                        </div>
                        <h3 className={`font-bold tracking-wide ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Team Performance</h3>
                    </div>

                    <div className="space-y-6 flex-1">
                        <div className="bg-gray-50 dark:bg-[#1a1c1d] p-5 rounded-xl border border-transparent dark:border-gray-800 flex justify-between items-center">
                            <div>
                                <p className="text-gray-500 text-xs font-bold tracking-wider uppercase mb-1">Completion Rate</p>
                                <p className={`text-3xl font-black tracking-tight ${isDarkMode ? 'text-gray-200' : 'text-gray-900'}`}>82%</p>
                            </div>
                            <div className="text-right">
                                <p className="text-xs text-rose-500 flex items-center justify-end gap-1 font-bold mb-1"><TrendingDown size={12} /> -4%</p>
                                <span className="text-[10px] font-bold text-gray-500">vs last week</span>
                            </div>
                        </div>

                        <div className="bg-rose-50 dark:bg-rose-500/5 p-5 rounded-xl border border-rose-500/20 dark:border-rose-900/40 relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-4 opacity-10">
                                <AlertTriangle size={64} className="text-rose-500" />
                            </div>
                            <p className="text-rose-500 text-xs font-bold uppercase tracking-wider mb-2 flex items-center gap-1.5 relative z-10"><AlertTriangle size={14} /> Intervention Needed</p>
                            <p className={`text-sm font-bold ${isDarkMode ? 'text-gray-200' : 'text-gray-900'} relative z-10 leading-tight mb-2`}>Your team's productivity dropped 12%</p>
                            <p className="text-xs text-gray-500 relative z-10 mb-4">The dip correlates with an unusually high number of ad-hoc "Urgent" tasks disrupting deep work flows.</p>
                            <button className="relative z-10 px-4 py-1.5 text-xs font-bold rounded-lg bg-rose-500 text-white shadow-lg shadow-rose-500/20 hover:bg-rose-600 transition-colors">
                                View Disrupters
                            </button>
                        </div>
                    </div>
                </div>

                {/* Tactical Management */}
                <div className={`${isDarkMode ? 'bg-[#121214] border-gray-800' : 'bg-white border-gray-100'} rounded-[20px] border shadow-sm p-6 lg:p-8 flex flex-col`}>
                    <div className="flex items-center gap-3 mb-6 border-b border-gray-100 dark:border-gray-800 pb-4">
                        <div className={`p-2 rounded-lg ${isDarkMode ? 'bg-indigo-500/10 text-indigo-400' : 'bg-indigo-50 text-indigo-600'}`}>
                            <CheckCircle2 size={20} />
                        </div>
                        <h3 className={`font-bold tracking-wide ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Tactical AI Agent</h3>
                    </div>

                    <div className="space-y-4">
                        <div className={`p-4 rounded-xl border ${isDarkMode ? 'bg-indigo-500/5 border-indigo-500/20' : 'bg-indigo-50 border-indigo-100'}`}>
                            <p className={`text-sm font-bold ${isDarkMode ? 'text-indigo-200' : 'text-indigo-900'} mb-1`}>Brian is overloaded</p>
                            <p className={`text-xs ${isDarkMode ? 'text-indigo-300' : 'text-indigo-700'} mb-3`}>Assigned task volume exceeds his average weekly velocity by 60%.</p>
                            <button className="px-3 py-1.5 text-xs font-bold rounded bg-indigo-500/20 dark:bg-indigo-500/30 text-indigo-600 dark:text-indigo-300 hover:bg-indigo-500/30 transition-colors">
                                Reassign Tasks
                            </button>
                        </div>

                        <div className={`p-4 rounded-xl border ${isDarkMode ? 'bg-[#1a1c1d] border-gray-800' : 'bg-gray-50 border-gray-200'}`}>
                            <p className={`text-sm font-bold ${isDarkMode ? 'text-amber-400' : 'text-amber-600'} mb-1 flex items-center gap-2`}><AlertTriangle size={14} /> 2 tasks at risk</p>
                            <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'} mb-3`}>"API Authentication Flow" and "Dashboard Widgets" are likely to miss the Friday deadline.</p>
                            <button className="px-3 py-1.5 text-xs font-bold rounded bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-700 transition-colors">
                                Adjust Deadlines
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
