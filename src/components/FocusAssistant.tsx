import React, { useMemo } from 'react';
import { Target, Zap, Clock, User, CheckSquare, Sparkles } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';

export const FocusAssistant: React.FC = () => {
    const { isDarkMode, userProfile, tasks, timeLogs, pomodoroState } = useAppStore();

    // 1. Peak Focus Window Calculation
    const peakFocus = useMemo(() => {
        const doneTasks = (tasks || []).filter(t => t.status === 'done' && t.updated_at);
        if (doneTasks.length === 0) return { window: 'Calculating...', percentage: 0 };

        const buckets: Record<number, number> = {};
        doneTasks.forEach(task => {
            const hour = new Date(task.updated_at!).getHours();
            const bucketKey = Math.floor(hour / 2) * 2; // e.g., 10 for 10-12
            buckets[bucketKey] = (buckets[bucketKey] || 0) + 1;
        });

        const bestBucket = Object.keys(buckets).reduce((a, b) =>
            buckets[Number(a)] > buckets[Number(b)] ? a : b
            , '0');

        const windowStart = Number(bestBucket);
        const windowEnd = windowStart + 2;
        const formatTime = (h: number) => h % 12 === 0 ? 12 : h % 12;
        const ampm = (h: number) => h < 12 ? 'AM' : 'PM';

        const label = `${formatTime(windowStart)} ${ampm(windowStart)} – ${formatTime(windowEnd)} ${ampm(windowEnd)}`;
        const percentage = Math.round((buckets[windowStart] / doneTasks.length) * 100);

        return { window: label, percentage };
    }, [tasks]);

    // 2. Work Style Calculation
    const workStyle = useMemo(() => {
        if (!timeLogs || timeLogs.length === 0) return { label: 'Assessing...', description: 'Log some time to see your style.' };

        const avgHours = timeLogs.reduce((sum, log) => sum + (log.hours || 0), 0) / timeLogs.length;
        if (avgHours < 1.5) {
            return { label: 'Short Bursts', description: 'High efficiency in focused, quick tasks.' };
        } else {
            return { label: 'Deep Work', description: 'Superior ability to maintain long focus.' };
        }
    }, [timeLogs]);

    // 3. Coach Tips Logic
    const coachTips = useMemo(() => {
        const tips = [];

        // Tip: Task Breakdown
        const complexTask = (tasks || []).find(t =>
            t.status === 'in_progress' &&
            (t.estimated_hours || 0) >= 4 &&
            (!t.subtasks || t.subtasks.length === 0)
        );
        if (complexTask) {
            tips.push({
                type: 'suggestion',
                title: 'Task breakdown suggested',
                message: `"${complexTask.title}" is quite heavy. Consider breaking it into subtasks.`,
                icon: <Sparkles size={14} />,
                color: 'emerald'
            });
        }

        // Tip: Break Reminder (Mock duration based on logs today)
        const todayStr = new Date().toISOString().split('T')[0];
        const logsToday = (timeLogs || []).filter(l => l.date === todayStr);
        const hoursToday = logsToday.reduce((sum, l) => sum + (l.hours || 0), 0);

        if (hoursToday > 4) {
            tips.push({
                type: 'warning',
                title: 'Time to take a break',
                message: `You've logged over 4 hours today. Step away for 15 mins to recharge.`,
                icon: <Clock size={14} />,
                color: 'amber'
            });
        }

        // Tip: Focus Mode
        if (pomodoroState?.isRunning) {
            tips.push({
                type: 'info',
                title: 'Deep Focus Active',
                message: 'Pomodoro timer is running. Stay focused on your current task!',
                icon: <Target size={14} />,
                color: 'indigo'
            });
        }

        return tips;
    }, [tasks, timeLogs, pomodoroState]);

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
                            <p className={`text-2xl font-black tracking-tight ${isDarkMode ? 'text-indigo-400' : 'text-indigo-600'}`}>{peakFocus.window}</p>
                            <p className="text-xs text-gray-400 mt-1">
                                {peakFocus.percentage > 0
                                    ? `You clear ${peakFocus.percentage}% of your tasks during this block.`
                                    : 'Complete more tasks to refine your peak window.'}
                            </p>
                        </div>
                        <div className="bg-gray-50 dark:bg-[#1a1c1d] p-5 rounded-xl border border-transparent dark:border-gray-800">
                            <p className="text-gray-500 text-xs font-bold tracking-wider uppercase mb-1">Work Style</p>
                            <p className={`text-2xl font-black tracking-tight ${isDarkMode ? 'text-purple-400' : 'text-purple-600'}`}>{workStyle.label}</p>
                            <p className="text-xs text-gray-400 mt-1">{workStyle.description}</p>
                        </div>
                    </div>

                    <h4 className={`text-sm font-bold tracking-wide mb-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Personal Coach Tips</h4>
                    <div className="space-y-3 flex-1">
                        {coachTips.length > 0 ? (
                            coachTips.map((tip, idx) => (
                                <div key={idx} className={`p-4 rounded-xl border flex items-start gap-4 ${tip.color === 'amber' ? (isDarkMode ? 'bg-amber-500/5 border-amber-500/20' : 'bg-amber-50 border-amber-100') :
                                        tip.color === 'emerald' ? (isDarkMode ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-emerald-50 border-emerald-100') :
                                            (isDarkMode ? 'bg-indigo-500/5 border-indigo-500/20' : 'bg-indigo-50 border-indigo-100')
                                    }`}>
                                    <div className={`p-1.5 rounded-full ${tip.color === 'amber' ? 'bg-amber-500/20 text-amber-500' :
                                            tip.color === 'emerald' ? 'bg-emerald-500/20 text-emerald-500' :
                                                'bg-indigo-500/20 text-indigo-500'
                                        } mt-0.5`}>{tip.icon}</div>
                                    <div>
                                        <p className={`text-sm font-bold ${tip.color === 'amber' ? (isDarkMode ? 'text-amber-200' : 'text-amber-900') :
                                                tip.color === 'emerald' ? (isDarkMode ? 'text-emerald-200' : 'text-emerald-900') :
                                                    (isDarkMode ? 'text-indigo-200' : 'text-indigo-900')
                                            } mb-1`}>{tip.title}</p>
                                        <p className={`text-xs ${tip.color === 'amber' ? (isDarkMode ? 'text-amber-300' : 'text-amber-700') :
                                                tip.color === 'emerald' ? (isDarkMode ? 'text-emerald-300' : 'text-emerald-700') :
                                                    (isDarkMode ? 'text-indigo-300' : 'text-indigo-700')
                                            }`}>{tip.message}</p>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className={`p-8 rounded-xl border border-dashed ${isDarkMode ? 'border-gray-800 text-gray-500' : 'border-gray-200 text-gray-400'} text-center`}>
                                <p className="text-xs font-medium">No tips currently. Keep up the good work!</p>
                            </div>
                        )}
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
