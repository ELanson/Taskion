import React, { useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, RotateCcw, Maximize2, Coffee, Brain, ChevronDown } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';

// ─── Constants ───────────────────────────────────────────────────────────────
const MODES = {
    work: { label: 'Focus', minutes: 25, color: 'indigo' },
    shortBreak: { label: 'Short Break', minutes: 5, color: 'emerald' },
    longBreak: { label: 'Long Break', minutes: 15, color: 'sky' },
};

const colorMap = {
    indigo: { ring: '#6366f1', bg: 'bg-indigo-500/10', text: 'text-indigo-400', border: 'border-indigo-500/30', btn: 'bg-indigo-600 hover:bg-indigo-500' },
    emerald: { ring: '#10b981', bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/30', btn: 'bg-emerald-600 hover:bg-emerald-500' },
    sky: { ring: '#0ea5e9', bg: 'bg-sky-500/10', text: 'text-sky-400', border: 'border-sky-500/30', btn: 'bg-sky-600 hover:bg-sky-500' },
};

function formatTime(seconds: number) {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
}

// ─── Component ───────────────────────────────────────────────────────────────
interface PomodoroWidgetProps {
    onOpenFocusMode: () => void;
}

export const PomodoroWidget: React.FC<PomodoroWidgetProps> = ({ onOpenFocusMode }) => {
    const { isDarkMode, tasks, pomodoroState, setPomodoroState } = useAppStore();
    const dk = isDarkMode;
    const { mode, timeLeft, isRunning, sessionsCompleted, selectedTaskId } = pomodoroState;
    const totalSeconds = MODES[mode].minutes * 60;
    const color = colorMap[MODES[mode].color as keyof typeof colorMap];
    const progress = 1 - timeLeft / totalSeconds;
    const radius = 36;
    const circumference = 2 * Math.PI * radius;
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const safeTasks = Array.isArray(tasks) ? tasks : [];
    const selectedTask = safeTasks.find(t => t.id === selectedTaskId);

    const tick = useCallback(() => {
        setPomodoroState(prev => {
            if (prev.timeLeft <= 1) {
                // Session complete
                const nextSessions = prev.mode === 'work' ? prev.sessionsCompleted + 1 : prev.sessionsCompleted;
                const nextMode = prev.mode === 'work'
                    ? (nextSessions % 4 === 0 ? 'longBreak' : 'shortBreak')
                    : 'work';
                // Browser notification
                if (Notification.permission === 'granted') {
                    new Notification(prev.mode === 'work' ? '🍅 Focus session complete!' : '💪 Break over — back to work!');
                }
                return {
                    ...prev,
                    mode: nextMode,
                    timeLeft: MODES[nextMode].minutes * 60,
                    isRunning: false,
                    sessionsCompleted: nextSessions,
                };
            }
            return { ...prev, timeLeft: prev.timeLeft - 1 };
        });
    }, [setPomodoroState]);

    useEffect(() => {
        if (isRunning) {
            intervalRef.current = setInterval(tick, 1000);
        } else {
            if (intervalRef.current) clearInterval(intervalRef.current);
        }
        return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
    }, [isRunning, tick]);

    const handleStart = () => {
        if (Notification.permission === 'default') Notification.requestPermission();
        setPomodoroState({ isRunning: true });
    };
    const handlePause = () => setPomodoroState({ isRunning: false });
    const handleReset = () => setPomodoroState({ isRunning: false, timeLeft: MODES[mode].minutes * 60 });
    const handleMode = (m: keyof typeof MODES) => setPomodoroState({ mode: m, timeLeft: MODES[m].minutes * 60, isRunning: false });

    return (
        <div className={`${dk ? 'bg-[#121214] border-gray-800' : 'bg-white border-gray-100'} rounded-[20px] border shadow-sm p-5 space-y-4`}>
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${color.bg}`}>
                        {mode === 'work' ? <Brain size={14} className={color.text} /> : <Coffee size={14} className={color.text} />}
                    </div>
                    <p className={`text-sm font-black ${dk ? 'text-white' : 'text-gray-900'}`}>Pomodoro</p>
                    {sessionsCompleted > 0 && (
                        <span className="text-xs text-orange-400 font-bold">{'🍅'.repeat(Math.min(sessionsCompleted, 4))}</span>
                    )}
                </div>
                <button
                    onClick={onOpenFocusMode}
                    className={`p-1.5 rounded-lg transition-colors ${dk ? 'hover:bg-gray-800 text-gray-500' : 'hover:bg-gray-100 text-gray-400'}`}
                    title="Open Focus Mode"
                >
                    <Maximize2 size={14} />
                </button>
            </div>

            {/* Mode tabs */}
            <div className={`flex rounded-xl overflow-hidden border p-0.5 gap-0.5 ${dk ? 'border-gray-800' : 'border-gray-200'}`}>
                {(Object.keys(MODES) as Array<keyof typeof MODES>).map(m => (
                    <button
                        key={m}
                        onClick={() => handleMode(m)}
                        className={`flex-1 py-1 text-[10px] font-bold rounded-lg transition-all ${mode === m
                            ? `${colorMap[MODES[m].color as keyof typeof colorMap].btn} text-white shadow`
                            : dk ? 'text-gray-500 hover:text-gray-300' : 'text-gray-400 hover:text-gray-700'
                            }`}
                    >
                        {MODES[m].label}
                    </button>
                ))}
            </div>

            {/* Timer Ring */}
            <div className="flex items-center gap-4">
                <div className="relative shrink-0">
                    <svg width="88" height="88" viewBox="0 0 88 88" className="-rotate-90">
                        <circle cx="44" cy="44" r={radius} fill="none"
                            stroke={dk ? '#1f2937' : '#f3f4f6'} strokeWidth="7" />
                        <motion.circle
                            cx="44" cy="44" r={radius} fill="none"
                            stroke={color.ring} strokeWidth="7"
                            strokeDasharray={circumference}
                            strokeDashoffset={circumference * (1 - progress)}
                            strokeLinecap="round"
                            transition={{ duration: 0.5 }}
                        />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                        <span className={`text-xl font-black tabular-nums ${dk ? 'text-white' : 'text-gray-900'}`}>
                            {formatTime(timeLeft)}
                        </span>
                    </div>
                </div>

                <div className="flex-1 min-w-0">
                    {/* Task selector */}
                    <div className={`text-[10px] font-bold uppercase tracking-widest mb-1 ${dk ? 'text-gray-600' : 'text-gray-400'}`}>
                        Current Task
                    </div>
                    <div className={`relative`}>
                        <select
                            value={selectedTaskId || ''}
                            onChange={e => setPomodoroState({ selectedTaskId: e.target.value || null })}
                            className={`w-full text-xs font-medium rounded-lg px-2 py-1.5 pr-6 border outline-none appearance-none truncate ${dk ? 'bg-gray-900 border-gray-700 text-gray-300' : 'bg-gray-50 border-gray-200 text-gray-700'
                                }`}
                        >
                            <option value="">— None —</option>
                            {safeTasks.filter(t => t.status !== 'done').map(t => (
                                <option key={t.id} value={t.id}>{t.title}</option>
                            ))}
                        </select>
                        <ChevronDown size={11} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
                    </div>

                    {/* Controls */}
                    <div className="flex gap-1.5 mt-2">
                        {isRunning ? (
                            <button onClick={handlePause} className={`flex-1 py-1.5 rounded-lg text-xs font-bold text-white ${color.btn} transition-all`}>
                                <Pause size={12} className="inline mr-1" />Pause
                            </button>
                        ) : (
                            <button onClick={handleStart} className={`flex-1 py-1.5 rounded-lg text-xs font-bold text-white ${color.btn} transition-all`}>
                                <Play size={12} className="inline mr-1" />Start
                            </button>
                        )}
                        <button
                            onClick={handleReset}
                            className={`px-2.5 py-1.5 rounded-lg transition-all ${dk ? 'bg-gray-800 text-gray-400 hover:bg-gray-700' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
                        >
                            <RotateCcw size={12} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Focus Session CTA */}
            <button
                onClick={onOpenFocusMode}
                className={`w-full py-2.5 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-2 ${dk ? 'border-indigo-500/30 text-indigo-400 hover:bg-indigo-500/10' : 'border-indigo-200 text-indigo-600 hover:bg-indigo-50'
                    }`}
            >
                <Brain size={13} /> Start Focus Session
            </button>
        </div>
    );
};
