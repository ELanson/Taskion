import React from 'react';
import { Target, Zap, Clock, User, CheckSquare, Sparkles } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';

export const FocusAssistant: React.FC = () => {
    const { isDarkMode, userProfile } = useAppStore();

    return (
        <div className="space-y-6 animate-in fade-in duration-300">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-200 dark:border-gray-800 pb-6 mb-6">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-purple-500 text-white shadow-lg shadow-purple-500/30">
                        <Zap size={24} />
                    </div>
                    <div>
                        <h2 className={`text-2xl font-black ${isDarkMode ? 'text-white' : 'text-gray-900'} tracking-tight`}>Focus Assistant</h2>
                        <p className="text-gray-500 text-sm mt-1">Your personalized intelligence coach, {userProfile.name}</p>
                    </div>
                </div>
            </div>

            <div className="space-y-6">
                {/* Personal Intelligence */}
                <div className={`${isDarkMode ? 'bg-[#121214] border-gray-800' : 'bg-white border-gray-100'} rounded-[20px] border shadow-sm p-6 flex flex-col`}>
                    <div className="flex items-center gap-3 mb-6 border-b border-gray-100 dark:border-gray-800 pb-4">
                        <div className={`p-2 rounded-lg ${isDarkMode ? 'bg-indigo-500/10 text-indigo-400' : 'bg-indigo-50 text-indigo-600'}`}>
                            <User size={20} />
                        </div>
                        <h3 className={`font-bold tracking-wide ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>My Performance Baseline</h3>
                    </div>

                    <div className="grid grid-cols-1 gap-4 mb-6">
                        <div className="bg-gray-50 dark:bg-[#1a1c1d] p-5 rounded-xl border border-transparent dark:border-gray-800">
                            <p className="text-gray-500 text-xs font-bold tracking-wider uppercase mb-1">Peak Focus Window</p>
                            <p className={`text-2xl font-black tracking-tight ${isDarkMode ? 'text-indigo-400' : 'text-indigo-600'}`}>10 AM – 12 PM</p>
                            <p className="text-xs text-gray-400 mt-1">You clear 40% of your tasks during this block.</p>
                        </div>
                        <div className="bg-gray-50 dark:bg-[#1a1c1d] p-5 rounded-xl border border-transparent dark:border-gray-800">
                            <p className="text-gray-500 text-xs font-bold tracking-wider uppercase mb-1">Work Style</p>
                            <p className={`text-2xl font-black tracking-tight ${isDarkMode ? 'text-purple-400' : 'text-purple-600'}`}>Short Bursts</p>
                            <p className="text-xs text-gray-400 mt-1">High efficiency in tasks under 1 hour.</p>
                        </div>
                    </div>

                    <h4 className={`text-sm font-bold tracking-wide mb-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Personal Coach Tips</h4>
                    <div className="space-y-3 flex-1">
                        <div className={`p-4 rounded-xl border flex items-start gap-4 ${isDarkMode ? 'bg-amber-500/5 border-amber-500/20' : 'bg-amber-50 border-amber-100'}`}>
                            <div className="p-1.5 rounded-full bg-amber-500/20 text-amber-500 mt-0.5"><Clock size={14} /></div>
                            <div>
                                <p className={`text-sm font-bold ${isDarkMode ? 'text-amber-200' : 'text-amber-900'} mb-1`}>Time to take a break</p>
                                <p className={`text-xs ${isDarkMode ? 'text-amber-300' : 'text-amber-700'}`}>You've been working continuously for 85 minutes. Step away for 5 mins to restore focus.</p>
                            </div>
                        </div>
                        <div className={`p-4 rounded-xl border flex items-start gap-4 ${isDarkMode ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-emerald-50 border-emerald-100'}`}>
                            <div className="p-1.5 rounded-full bg-emerald-500/20 text-emerald-500 mt-0.5"><Sparkles size={14} /></div>
                            <div>
                                <p className={`text-sm font-bold ${isDarkMode ? 'text-emerald-200' : 'text-emerald-900'} mb-1`}>Task breakdown suggested</p>
                                <p className={`text-xs ${isDarkMode ? 'text-emerald-300' : 'text-emerald-700'}`}>"Implement User Auth" is very broad. Consider clicking "Break into subtasks" on the task card to make it manageable.</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Overdue / Action Items */}
                <div className={`${isDarkMode ? 'bg-[#121214] border-gray-800' : 'bg-white border-gray-100'} rounded-[20px] border shadow-sm p-6 flex flex-col`}>
                    <div className="flex items-center gap-3 mb-6 border-b border-gray-100 dark:border-gray-800 pb-4">
                        <div className={`p-2 rounded-lg ${isDarkMode ? 'bg-rose-500/10 text-rose-400' : 'bg-rose-50 text-rose-600'}`}>
                            <CheckSquare size={20} />
                        </div>
                        <h3 className={`font-bold tracking-wide ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Action Required</h3>
                    </div>

                    <div className="flex-1 flex flex-col items-center justify-center text-center p-6 border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-xl">
                        <div className="w-16 h-16 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center mb-4">
                            <Target size={32} />
                        </div>
                        <p className={`text-sm font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'} mb-2`}>You're all caught up!</p>
                        <p className="text-xs text-gray-500">No overdue tasks. Enjoy your focused time.</p>
                    </div>
                </div>
            </div>
        </div>
    );
};
