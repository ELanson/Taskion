import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    X, Clock, CheckCircle2, Activity, Target, Flame,
    TrendingUp, Calendar, AlertCircle, Zap, Award, BarChart2
} from 'lucide-react';
import { useAppStore } from '../store/useAppStore';

// ─── shared helpers ──────────────────────────────────────────────────────────
const Overlay: React.FC<{ onClose: () => void }> = ({ onClose }) => (
    <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
    />
);

const ModalShell: React.FC<{
    title: string; icon: React.ReactNode; accent: string; children: React.ReactNode; onClose: () => void;
}> = ({ title, icon, accent, children, onClose }) => {
    const { isDarkMode } = useAppStore();
    const dk = isDarkMode;
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className={`relative z-10 w-full max-w-md rounded-3xl shadow-2xl overflow-hidden ${dk ? 'bg-[#0F0F11] border border-gray-800' : 'bg-white border border-gray-100'}`}
        >
            {/* Glowing top bar */}
            <div className={`h-1 w-full ${accent}`} />
            <div className="p-6">
                <div className="flex items-center justify-between mb-5">
                    <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${accent.replace('bg-', 'bg-').replace('-500', '-500/10')} text-current`}>
                            {icon}
                        </div>
                        <h3 className={`text-lg font-black ${dk ? 'text-white' : 'text-gray-900'}`}>{title}</h3>
                    </div>
                    <button onClick={onClose} className={`p-2 rounded-xl transition-colors ${dk ? 'hover:bg-gray-800 text-gray-500' : 'hover:bg-gray-100 text-gray-400'}`}>
                        <X size={16} />
                    </button>
                </div>
                {children}
            </div>
        </motion.div>
    );
};

// ─── Modal 1: Total Time ─────────────────────────────────────────────────────
export const TotalTimeModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    const { isDarkMode, totalHours } = useAppStore();
    const dk = isDarkMode;
    const weekData = [
        { day: 'Mon', hours: 6.5 }, { day: 'Tue', hours: 8.2 }, { day: 'Wed', hours: 5.0 },
        { day: 'Thu', hours: 7.8 }, { day: 'Fri', hours: 4.3 }, { day: 'Sat', hours: 2.1 }, { day: 'Sun', hours: totalHours },
    ];
    const maxH = Math.max(...weekData.map(d => d.hours));

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <Overlay onClose={onClose} />
            <ModalShell title="Time Tracker" icon={<Clock size={18} className="text-emerald-400" />} accent="bg-emerald-500" onClose={onClose}>
                {/* Big stat */}
                <div className={`flex items-baseline gap-2 mb-5 p-4 rounded-2xl ${dk ? 'bg-emerald-500/10 border border-emerald-500/20' : 'bg-emerald-50'}`}>
                    <p className="text-5xl font-black text-emerald-400">{totalHours}</p>
                    <p className="text-emerald-400 font-bold text-lg">hrs today</p>
                    <span className="ml-auto text-xs font-bold text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded-full">↑ 12% vs avg</span>
                </div>

                {/* Weekly bar chart */}
                <p className={`text-[10px] font-bold uppercase tracking-widest mb-3 ${dk ? 'text-gray-500' : 'text-gray-400'}`}>This Week</p>
                <div className="flex items-end gap-2 h-28">
                    {weekData.map((d, i) => (
                        <div key={i} className="flex-1 flex flex-col items-center gap-1">
                            <p className={`text-[9px] font-bold ${dk ? 'text-gray-500' : 'text-gray-400'}`}>{d.hours}h</p>
                            <div className="w-full relative flex items-end" style={{ height: '80px' }}>
                                <motion.div
                                    initial={{ height: 0 }} animate={{ height: `${(d.hours / maxH) * 100}%` }}
                                    transition={{ delay: i * 0.05, duration: 0.4 }}
                                    className={`w-full rounded-t-lg ${i === 6 ? 'bg-emerald-400' : (dk ? 'bg-emerald-500/30' : 'bg-emerald-100')}`}
                                />
                            </div>
                            <p className={`text-[8px] font-bold ${dk ? 'text-gray-600' : 'text-gray-400'}`}>{d.day}</p>
                        </div>
                    ))}
                </div>

                {/* Summary row */}
                <div className="grid grid-cols-3 gap-3 mt-5">
                    {[
                        { label: 'This Week', val: '33.9 hrs', color: 'text-emerald-400' },
                        { label: 'Monthly Avg', val: '7.2 hrs', color: dk ? 'text-gray-300' : 'text-gray-700' },
                        { label: 'Best Day', val: '8.2 hrs', color: 'text-amber-400' },
                    ].map(s => (
                        <div key={s.label} className={`p-3 rounded-xl text-center ${dk ? 'bg-gray-900' : 'bg-gray-50'}`}>
                            <p className={`text-sm font-black ${s.color}`}>{s.val}</p>
                            <p className="text-[10px] text-gray-500 mt-0.5">{s.label}</p>
                        </div>
                    ))}
                </div>
            </ModalShell>
        </div>
    );
};

// ─── Modal 2: Tasks Completed ────────────────────────────────────────────────
export const TasksCompletedModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    const { isDarkMode, tasks } = useAppStore();
    const dk = isDarkMode;
    const safeTasks = Array.isArray(tasks) ? tasks : [];
    const completed = safeTasks.filter(t => t.status === 'done');
    const total = safeTasks.length;
    const pct = total > 0 ? Math.round((completed.length / total) * 100) : 0;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <Overlay onClose={onClose} />
            <ModalShell title="Tasks Completed" icon={<CheckCircle2 size={18} className="text-indigo-400" />} accent="bg-indigo-500" onClose={onClose}>
                {/* Progress ring */}
                <div className="flex items-center gap-5 mb-5">
                    <div className="relative w-20 h-20 shrink-0">
                        <svg viewBox="0 0 80 80" className="w-full h-full -rotate-90">
                            <circle cx="40" cy="40" r="32" fill="none" stroke={dk ? '#1f2937' : '#f3f4f6'} strokeWidth="8" />
                            <motion.circle
                                cx="40" cy="40" r="32" fill="none" stroke="#6366f1" strokeWidth="8"
                                strokeDasharray={`${2 * Math.PI * 32}`}
                                initial={{ strokeDashoffset: 2 * Math.PI * 32 }}
                                animate={{ strokeDashoffset: 2 * Math.PI * 32 * (1 - pct / 100) }}
                                transition={{ duration: 0.8, ease: 'easeOut' }}
                                strokeLinecap="round"
                            />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <p className={`text-xl font-black ${dk ? 'text-white' : 'text-gray-900'}`}>{pct}%</p>
                        </div>
                    </div>
                    <div>
                        <p className={`text-3xl font-black ${dk ? 'text-white' : 'text-gray-900'}`}>{completed.length}</p>
                        <p className="text-xs text-gray-500">of {total} tasks done</p>
                        <span className="text-[10px] font-bold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full mt-1 inline-block">+2 from yesterday</span>
                    </div>
                </div>

                {/* Completed task list */}
                <p className={`text-[10px] font-bold uppercase tracking-widest mb-2 ${dk ? 'text-gray-500' : 'text-gray-400'}`}>Recently Completed</p>
                <div className={`rounded-2xl border divide-y max-h-48 overflow-y-auto ${dk ? 'border-gray-800 divide-gray-800' : 'border-gray-100 divide-gray-100'}`}>
                    {completed.length === 0 ? (
                        <div className="py-8 text-center">
                            <AlertCircle size={20} className="text-gray-500 mx-auto mb-2" />
                            <p className="text-xs text-gray-500">No completed tasks yet</p>
                        </div>
                    ) : completed.slice(0, 6).map(t => (
                        <div key={t.id} className="flex items-center gap-3 px-4 py-2.5">
                            <CheckCircle2 size={14} className="text-emerald-400 shrink-0" />
                            <p className={`text-xs font-medium truncate ${dk ? 'text-gray-300' : 'text-gray-700'}`}>{t.title}</p>
                            <span className="ml-auto text-[10px] text-gray-500 shrink-0">{t.due_date ? new Date(t.due_date).toLocaleDateString() : ''}</span>
                        </div>
                    ))}
                </div>
            </ModalShell>
        </div>
    );
};

// ─── Modal 3: Active Tasks ───────────────────────────────────────────────────
export const ActiveTasksModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    const { isDarkMode, tasks } = useAppStore();
    const dk = isDarkMode;
    const safeTasks = Array.isArray(tasks) ? tasks : [];
    const active = safeTasks.filter(t => t.status === 'in_progress');
    const todo = safeTasks.filter(t => t.status === 'todo');

    const priorityColor = (p: string) =>
        p === 'high' ? 'bg-rose-500/10 text-rose-400' : p === 'medium' ? 'bg-amber-500/10 text-amber-400' : 'bg-gray-500/10 text-gray-400';

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <Overlay onClose={onClose} />
            <ModalShell title="Active Tasks" icon={<Activity size={18} className="text-indigo-400" />} accent="bg-gradient-to-r from-indigo-500 to-purple-500" onClose={onClose}>
                {/* Stats row */}
                <div className="grid grid-cols-3 gap-3 mb-5">
                    {[
                        { label: 'In Progress', val: active.length, color: 'text-indigo-400', bg: dk ? 'bg-indigo-500/10' : 'bg-indigo-50' },
                        { label: 'To Do', val: todo.length, color: dk ? 'text-gray-200' : 'text-gray-800', bg: dk ? 'bg-gray-900' : 'bg-gray-50' },
                        { label: 'Overdue', val: safeTasks.filter(t => t.due_date && new Date(t.due_date) < new Date() && t.status !== 'done').length, color: 'text-rose-400', bg: dk ? 'bg-rose-500/10' : 'bg-rose-50' },
                    ].map(s => (
                        <div key={s.label} className={`p-3 rounded-xl text-center ${s.bg}`}>
                            <p className={`text-2xl font-black ${s.color}`}>{s.val}</p>
                            <p className="text-[10px] text-gray-500 mt-0.5">{s.label}</p>
                        </div>
                    ))}
                </div>

                {/* Active task list */}
                <p className={`text-[10px] font-bold uppercase tracking-widest mb-2 ${dk ? 'text-gray-500' : 'text-gray-400'}`}>In Progress</p>
                <div className={`rounded-2xl border divide-y max-h-52 overflow-y-auto ${dk ? 'border-gray-800 divide-gray-800' : 'border-gray-100 divide-gray-100'}`}>
                    {active.length === 0 ? (
                        <div className="py-8 text-center">
                            <Zap size={20} className="text-gray-500 mx-auto mb-2" />
                            <p className="text-xs text-gray-500">No tasks in progress</p>
                        </div>
                    ) : active.map(t => (
                        <div key={t.id} className="flex items-center gap-3 px-4 py-2.5">
                            <Activity size={13} className="text-indigo-400 shrink-0" />
                            <div className="flex-1 min-w-0">
                                <p className={`text-xs font-bold truncate ${dk ? 'text-gray-200' : 'text-gray-800'}`}>{t.title}</p>
                                <p className="text-[10px] text-gray-500">{t.due_date ? `Due ${new Date(t.due_date).toLocaleDateString()}` : 'No deadline'}</p>
                            </div>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${priorityColor(t.priority)}`}>{t.priority}</span>
                        </div>
                    ))}
                </div>
            </ModalShell>
        </div>
    );
};

// ─── Modal 4: Focus Score ────────────────────────────────────────────────────
export const FocusScoreModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    const { isDarkMode, tasks, timeLogs } = useAppStore();
    const dk = isDarkMode;
    const safeTasks = Array.isArray(tasks) ? tasks : [];

    const { score, factors, todayTasksDone } = useMemo(() => {
        if (!timeLogs || !safeTasks) return { score: 0, factors: [], todayTasksDone: 0 };

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayStr = today.toISOString().split('T')[0];

        const tasksDoneToday = safeTasks.filter((t: any) => t.status === 'done' && t.updated_at?.startsWith(todayStr)).length;
        const totalTasksToday = safeTasks.filter((t: any) => (t.status === 'done' && t.updated_at?.startsWith(todayStr)) || (t.status === 'in_progress')).length;
        const hoursToday = (timeLogs as any[]).filter(l => l.date === todayStr).reduce((acc: number, l: any) => acc + (l.hours || 0), 0);

        const completionRate = totalTasksToday > 0 ? Math.min(100, Math.round((tasksDoneToday / totalTasksToday) * 100)) : 0;
        const activeTimeScore = Math.min(100, Math.round((hoursToday / 8) * 100)); // 8 hours = 100

        const onTime = safeTasks.filter(t => t.status === 'done' && (!t.due_date || new Date(t.updated_at!) <= new Date(t.due_date))).length;
        const totalDone = safeTasks.filter(t => t.status === 'done').length;
        const onTimeScore = totalDone > 0 ? Math.min(100, Math.round((onTime / totalDone) * 100)) : 0;

        const priorityScore = safeTasks.filter(t => t.status === 'done' && t.priority === 'high').length > 0 ? 95 : (tasksDoneToday > 0 ? 80 : 0);

        // Match App.tsx streak focus logic roughly
        let currentStreak = 0;
        const activityDates = new Set<string>();
        (timeLogs as any[]).forEach(l => { if (l.date) activityDates.add(l.date); });
        safeTasks.forEach(t => { if (t.status === 'done' && t.updated_at) activityDates.add(new Date(t.updated_at).toISOString().split('T')[0]); });

        const checkDate = new Date(today);
        checkDate.setDate(checkDate.getDate() - 1);
        const yesterdayStr = checkDate.toISOString().split('T')[0];

        if (activityDates.has(todayStr) || activityDates.has(yesterdayStr)) {
            let runDate = new Date(activityDates.has(todayStr) ? todayStr : yesterdayStr);
            while (activityDates.has(runDate.toISOString().split('T')[0])) {
                currentStreak++;
                runDate.setDate(runDate.getDate() - 1);
            }
        }

        let calculatedScore = 40 + (tasksDoneToday * 15) + (hoursToday * 8) + (currentStreak * 2);
        if (calculatedScore > 100) calculatedScore = 100;
        if (tasksDoneToday === 0 && hoursToday === 0) calculatedScore = currentStreak > 0 ? 45 : 0;

        return {
            score: Number(calculatedScore.toFixed(1)),
            todayTasksDone: tasksDoneToday,
            factors: [
                { label: 'Task Completion Rate', score: completionRate || 0, color: 'bg-emerald-500' },
                { label: 'On-Time Delivery', score: onTimeScore || 0, color: 'bg-indigo-500' },
                { label: 'Daily Active Time', score: activeTimeScore || 0, color: 'bg-amber-500' },
                { label: 'Priority Adherence', score: priorityScore || 0, color: 'bg-purple-500' },
            ]
        };
    }, [tasks, timeLogs]);

    const getScoreLabel = (s: number) =>
        s >= 90 ? { text: 'Exceptional', color: 'text-emerald-400' }
            : s >= 75 ? { text: 'Excellent', color: 'text-amber-400' }
                : s >= 60 ? { text: 'Good', color: 'text-indigo-400' }
                    : { text: 'Needs work', color: 'text-rose-400' };

    const { text, color } = getScoreLabel(score);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <Overlay onClose={onClose} />
            <ModalShell title="Focus Score" icon={<Target size={18} className="text-amber-400" />} accent="bg-amber-500" onClose={onClose}>
                {/* Score display */}
                <div className={`flex items-center gap-4 p-4 rounded-2xl mb-5 ${dk ? 'bg-amber-500/10 border border-amber-500/20' : 'bg-amber-50'}`}>
                    <div className="relative w-20 h-20 shrink-0">
                        <svg viewBox="0 0 80 80" className="w-full h-full -rotate-90">
                            <circle cx="40" cy="40" r="30" fill="none" stroke={dk ? '#292524' : '#fef3c7'} strokeWidth="10" />
                            <motion.circle cx="40" cy="40" r="30" fill="none" stroke="#f59e0b" strokeWidth="10"
                                strokeDasharray={`${2 * Math.PI * 30}`}
                                initial={{ strokeDashoffset: 2 * Math.PI * 30 }}
                                animate={{ strokeDashoffset: 2 * Math.PI * 30 * (1 - score / 100) }}
                                transition={{ duration: 1, ease: 'easeOut' }}
                                strokeLinecap="round" />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                            <p className={`text-xl font-black ${dk ? 'text-white' : 'text-gray-900'}`}>{score}</p>
                        </div>
                    </div>
                    <div>
                        <p className={`text-3xl font-black ${dk ? 'text-white' : 'text-gray-900'}`}>{score}<span className="text-sm text-gray-500 font-bold">/100</span></p>
                        <p className={`text-sm font-bold ${color}`}>{text} focus</p>
                        <p className="text-[10px] text-gray-500 mt-1">Based on last 7 days activity</p>
                    </div>
                </div>

                {/* Factor breakdown */}
                <p className={`text-[10px] font-bold uppercase tracking-widest mb-3 ${dk ? 'text-gray-500' : 'text-gray-400'}`}>Score Breakdown</p>
                <div className="space-y-3">
                    {factors.map((f, i) => (
                        <div key={i}>
                            <div className="flex justify-between mb-1">
                                <p className={`text-xs font-medium ${dk ? 'text-gray-300' : 'text-gray-700'}`}>{f.label}</p>
                                <p className={`text-xs font-black ${dk ? 'text-white' : 'text-gray-900'}`}>{f.score}</p>
                            </div>
                            <div className={`h-1.5 rounded-full ${dk ? 'bg-gray-800' : 'bg-gray-100'}`}>
                                <motion.div className={`h-full rounded-full ${f.color}`}
                                    initial={{ width: 0 }} animate={{ width: `${f.score}%` }}
                                    transition={{ delay: i * 0.1, duration: 0.5 }} />
                            </div>
                        </div>
                    ))}
                </div>

                <div className={`mt-4 p-3 rounded-xl flex items-start gap-2 ${dk ? 'bg-amber-500/5 border border-amber-500/10' : 'bg-amber-50'}`}>
                    <TrendingUp size={14} className="text-amber-500 shrink-0 mt-0.5" />
                    <p className="text-[11px] text-gray-500">{todayTasksDone < 2 ? 'Complete 2 more high-priority tasks today to push your score above 85.' : 'Great job today! Keep working on active tasks to maintain your flow state.'}</p>
                </div>
            </ModalShell>
        </div>
    );
};

// ─── Modal 5: Consistency / Streak ──────────────────────────────────────────
export const ConsistencyModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    const { isDarkMode, tasks, timeLogs } = useAppStore();
    const dk = isDarkMode;

    const { streak, bestStreak, grid, last7, totalDone } = useMemo(() => {
        const safeTasks = Array.isArray(tasks) ? tasks : [];
        const activityDates = new Map<string, number>(); // date -> number of tasks/logs

        (timeLogs as any[] || []).forEach(log => {
            if (log.date) activityDates.set(log.date, (activityDates.get(log.date) || 0) + 1);
        });

        safeTasks.forEach(t => {
            if (t.status === 'done' && t.updated_at) {
                const d = new Date(t.updated_at).toISOString().split('T')[0];
                activityDates.set(d, (activityDates.get(d) || 0) + 1);
            }
        });

        // Calculate streak
        let currentStreak = 0;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayStr = today.toISOString().split('T')[0];
        const checkDate = new Date(today);
        checkDate.setDate(checkDate.getDate() - 1);
        const yesterdayStr = checkDate.toISOString().split('T')[0];

        if (activityDates.has(todayStr) || activityDates.has(yesterdayStr)) {
            let runDate = new Date(activityDates.has(todayStr) ? todayStr : yesterdayStr);
            while (activityDates.has(runDate.toISOString().split('T')[0])) {
                currentStreak++;
                runDate.setDate(runDate.getDate() - 1);
            }
        }

        // Mock best streak dynamically based on current
        const maxStreak = Math.max(currentStreak, Math.min(currentStreak + 6, 18));

        // Heatmap Grid (4 weeks x 7 days) -> last 28 days
        const gridData = Array.from({ length: 4 }, () => Array(7).fill(0));
        let gridDate = new Date(today);
        // Start date 27 days ago (to account for today being the 28th day)
        gridDate.setDate(gridDate.getDate() - 27);

        for (let w = 0; w < 4; w++) {
            for (let d = 0; d < 7; d++) {
                const dateStr = gridDate.toISOString().split('T')[0];
                gridData[w][d] = activityDates.get(dateStr) || 0;
                gridDate.setDate(gridDate.getDate() + 1);
            }
        }

        // Last 7 days mini chart
        const dayLabels = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
        const l7 = [];
        const tempDate = new Date(today);
        tempDate.setDate(tempDate.getDate() - 6);
        for (let i = 0; i < 7; i++) {
            l7.push({
                active: activityDates.has(tempDate.toISOString().split('T')[0]),
                label: dayLabels[tempDate.getDay()]
            });
            tempDate.setDate(tempDate.getDate() + 1);
        }

        return { streak: currentStreak, bestStreak: maxStreak, grid: gridData, last7: l7, totalDone: safeTasks.filter(t => t.status === 'done').length };
    }, [tasks, timeLogs]);

    const intensityColor = (v: number) => {
        if (v === 0) return dk ? 'bg-gray-800' : 'bg-gray-100';
        if (v === 1) return 'bg-orange-500/20';
        if (v === 2) return 'bg-orange-500/40';
        if (v === 3) return 'bg-orange-500/70';
        return 'bg-orange-500';
    };

    const achievements = [
        { icon: <Flame size={14} />, label: `${streak}-Day Streak`, color: 'text-orange-400', bg: dk ? 'bg-orange-500/10' : 'bg-orange-50' },
        { icon: <Award size={14} />, label: 'Week Warrior', color: 'text-yellow-400', bg: dk ? 'bg-yellow-500/10' : 'bg-yellow-50' },
        { icon: <BarChart2 size={14} />, label: `${totalDone}+ Tasks Done`, color: 'text-indigo-400', bg: dk ? 'bg-indigo-500/10' : 'bg-indigo-50' },
    ];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <Overlay onClose={onClose} />
            <ModalShell title="Consistency" icon={<Flame size={18} className="text-orange-400" />} accent="bg-orange-500" onClose={onClose}>
                {/* Streak stat */}
                <div className={`flex items-center gap-4 p-4 rounded-2xl mb-5 ${dk ? 'bg-orange-500/10 border border-orange-500/20' : 'bg-orange-50'}`}>
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${dk ? 'bg-orange-500/20' : 'bg-orange-100'}`}>
                        <Flame size={28} className="text-orange-400" />
                    </div>
                    <div>
                        <p className={`text-4xl font-black ${dk ? 'text-white' : 'text-gray-900'}`}>{streak}</p>
                        <p className="text-sm font-bold text-orange-400">Day Streak</p>
                        <p className="text-[10px] text-gray-500">Keep it up! Best: {bestStreak} days</p>
                    </div>
                    <div className="ml-auto text-right">
                        <p className={`text-xs font-bold ${dk ? 'text-gray-300' : 'text-gray-700'}`}>This week</p>
                        <div className="flex gap-1 mt-1">
                            {last7.map((day, i) => (
                                <div key={i} className="flex flex-col items-center gap-0.5">
                                    <div className={`w-3 h-3 rounded-full ${day.active ? 'bg-orange-500' : (dk ? 'bg-gray-800' : 'bg-gray-200')}`} />
                                    <span className="text-[7px] text-gray-500">{day.label}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Activity heatmap */}
                <p className={`text-[10px] font-bold uppercase tracking-widest mb-2 ${dk ? 'text-gray-500' : 'text-gray-400'}`}>Activity Heatmap</p>
                <div className="flex gap-1 mb-4">
                    {grid.map((week, w) => (
                        <div key={w} className="flex flex-col gap-1 flex-1">
                            {week.map((val, d) => (
                                <motion.div key={d} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                                    transition={{ delay: (w * 7 + d) * 0.01 }}
                                    className={`h-4 rounded-sm ${intensityColor(val)}`}
                                    title={`${val} tasks`}
                                />
                            ))}
                        </div>
                    ))}
                </div>

                {/* Achievements */}
                <p className={`text-[10px] font-bold uppercase tracking-widest mb-2 ${dk ? 'text-gray-500' : 'text-gray-400'}`}>Achievements</p>
                <div className="flex gap-2">
                    {achievements.map((a, i) => (
                        <div key={i} className={`flex-1 flex flex-col items-center gap-1.5 p-3 rounded-xl ${a.bg}`}>
                            <div className={a.color}>{a.icon}</div>
                            <p className={`text-[9px] font-bold text-center ${dk ? 'text-gray-300' : 'text-gray-700'}`}>{a.label}</p>
                        </div>
                    ))}
                </div>
            </ModalShell>
        </div>
    );
};
