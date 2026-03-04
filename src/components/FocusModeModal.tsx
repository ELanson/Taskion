import React, { useEffect, useRef, useCallback, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Play, Pause, RotateCcw, X, Brain, Coffee, ChevronDown, Wind,
    CloudRain, Volume2, VolumeX, Flame, CheckCircle2, Clock
} from 'lucide-react';
import { useAppStore } from '../store/useAppStore';

// ─── Constants ───────────────────────────────────────────────────────────────
const MODES = {
    work: { label: 'Focus', minutes: 25, color: '#6366f1' },
    pomodoro50: { label: '50-min Deep', minutes: 50, color: '#8b5cf6' },
    pomodoro90: { label: '90-min Flow', minutes: 90, color: '#ec4899' },
    shortBreak: { label: 'Short Break', minutes: 5, color: '#10b981' },
    longBreak: { label: 'Long Break', minutes: 15, color: '#0ea5e9' },
};

type ModeKey = keyof typeof MODES;

const SOUNDS: Record<string, { label: string; icon: React.ReactNode; src: string }> = {
    none: { label: 'Silent', icon: <VolumeX size={14} />, src: '' },
    white: { label: 'White Noise', icon: <Wind size={14} />, src: 'https://www.soundjay.com/misc/sounds/white-noise-01.mp3' },
    rain: { label: 'Rain', icon: <CloudRain size={14} />, src: 'https://www.soundjay.com/nature/sounds/rain-01.mp3' },
};

const STATUS_MESSAGES: Record<string, string[]> = {
    work: ['Deep work in progress...', 'Stay focused, you\'re crushing it 🔥', 'In the zone — don\'t break flow', 'Great momentum, keep going!'],
    shortBreak: ['Recharge your mind ☕', 'Step away, breathe, reset.', 'Quick rest — come back strong.'],
    longBreak: ['Well earned rest 🌿', 'Recover fully before the next sprint.'],
    pomodoro50: ['50-minute deep focus — eliminate distractions.', 'Extended flow state — protect your attention.'],
    pomodoro90: ['90-min flow session — peak performance mode.', 'Ultradian rhythm: your brain is primed for deep work.'],
};

function formatTime(seconds: number) {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return h > 0 ? `${h}:${m}:${s}` : `${m}:${s}`;
}

// ─── Main Modal ───────────────────────────────────────────────────────────────
interface FocusModeModalProps {
    onClose: () => void;
}

export const FocusModeModal: React.FC<FocusModeModalProps> = ({ onClose }) => {
    const { tasks, pomodoroState, setPomodoroState, isDarkMode } = useAppStore();
    const safeTasks = Array.isArray(tasks) ? tasks : [];
    const { sessionsCompleted, selectedTaskId } = pomodoroState;

    // local state for full modal (doesn't share the widget timer — independent)
    const [focusMode, setFocusMode] = useState<ModeKey>('work');
    const totalSeconds = MODES[focusMode].minutes * 60;
    const [timeLeft, setTimeLeft] = useState(totalSeconds);
    const [isRunning, setIsRunning] = useState(false);
    const [sound, setSound] = useState<string>('none');
    const [localTaskId, setLocalTaskId] = useState<string | null>(selectedTaskId);
    const [msgIdx, setMsgIdx] = useState(0);
    const [completedSessions, setCompletedSessions] = useState<{ mode: ModeKey; minutes: number }[]>([]);
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    const selectedTask = safeTasks.find(t => String(t.id) === localTaskId);
    const modeColor = MODES[focusMode].color;
    const progress = 1 - timeLeft / totalSeconds;
    const radius = 120;
    const circumference = 2 * Math.PI * radius;
    const msgs = STATUS_MESSAGES[focusMode] || STATUS_MESSAGES.work;

    // Rotate status message every 30 s
    useEffect(() => {
        const t = setInterval(() => setMsgIdx(i => (i + 1) % msgs.length), 30000);
        return () => clearInterval(t);
    }, [msgs.length]);

    // Keyboard shortcut: space
    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if (e.code === 'Space' && e.target === document.body) {
                e.preventDefault();
                setIsRunning(r => !r);
            }
            if (e.code === 'Escape') onClose();
        };
        document.addEventListener('keydown', handler);
        return () => document.removeEventListener('keydown', handler);
    }, [onClose]);

    // Timer
    const tick = useCallback(() => {
        setTimeLeft(t => {
            if (t <= 1) {
                setIsRunning(false);
                setCompletedSessions(prev => [...prev, { mode: focusMode, minutes: MODES[focusMode].minutes }]);
                if (Notification.permission === 'granted') {
                    new Notification(focusMode === 'shortBreak' || focusMode === 'longBreak'
                        ? '💪 Break over — back to work!'
                        : '🍅 Focus session complete! Take a break.');
                }
                return MODES[focusMode].minutes * 60;
            }
            return t - 1;
        });
    }, [focusMode]);

    useEffect(() => {
        if (isRunning) {
            intervalRef.current = setInterval(tick, 1000);
        } else {
            if (intervalRef.current) clearInterval(intervalRef.current);
        }
        return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
    }, [isRunning, tick]);

    // Audio
    useEffect(() => {
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current = null;
        }
        if (sound !== 'none' && SOUNDS[sound].src) {
            const audio = new Audio(SOUNDS[sound].src);
            audio.loop = true;
            audio.volume = 0.3;
            if (isRunning) audio.play().catch(() => { });
            audioRef.current = audio;
        }
        return () => { audioRef.current?.pause(); };
    }, [sound]);

    useEffect(() => {
        if (audioRef.current) {
            if (isRunning) audioRef.current.play().catch(() => { });
            else audioRef.current.pause();
        }
    }, [isRunning]);

    const handleModeChange = (m: ModeKey) => {
        setFocusMode(m);
        setTimeLeft(MODES[m].minutes * 60);
        setIsRunning(false);
    };

    const handleReset = () => {
        setTimeLeft(MODES[focusMode].minutes * 60);
        setIsRunning(false);
    };

    return (
        <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-[#070709] flex flex-col"
        >
            {/* Close */}
            <div className="flex justify-between items-center px-8 pt-8 pb-0">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-indigo-500/10 flex items-center justify-center">
                        <Brain size={16} className="text-indigo-400" />
                    </div>
                    <span className="text-white font-black text-lg">Focus Mode</span>
                    <span className="text-xs text-gray-600 border border-gray-800 px-2 py-0.5 rounded-full">Space to pause · Esc to exit</span>
                </div>
                <button onClick={onClose} className="p-2 rounded-xl hover:bg-gray-900 text-gray-500 transition-colors">
                    <X size={18} />
                </button>
            </div>

            {/* Main content */}
            <div className="flex-1 flex flex-col md:flex-row items-center justify-center gap-12 px-8">

                {/* Center: Timer */}
                <div className="flex flex-col items-center gap-8">
                    {/* Status message */}
                    <AnimatePresence mode="wait">
                        <motion.p key={msgIdx} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
                            className="text-gray-400 text-sm font-medium text-center max-w-xs">
                            {msgs[msgIdx]}
                        </motion.p>
                    </AnimatePresence>

                    {/* Ring */}
                    <div className="relative">
                        <svg width="300" height="300" viewBox="0 0 300 300" className="-rotate-90">
                            <circle cx="150" cy="150" r={radius} fill="none" stroke="#1a1a1f" strokeWidth="14" />
                            <motion.circle
                                cx="150" cy="150" r={radius} fill="none"
                                stroke={modeColor} strokeWidth="14"
                                strokeDasharray={circumference}
                                animate={{ strokeDashoffset: circumference * (1 - progress) }}
                                transition={{ duration: 0.8, ease: 'easeInOut' }}
                                strokeLinecap="round"
                                style={{ filter: `drop-shadow(0 0 12px ${modeColor}60)` }}
                            />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center gap-1">
                            <span className="text-6xl font-black text-white tabular-nums tracking-tight">
                                {formatTime(timeLeft)}
                            </span>
                            <span className="text-sm font-bold text-gray-500">{MODES[focusMode].label}</span>
                            {completedSessions.length > 0 && (
                                <span className="text-xs text-orange-400 font-bold mt-1">
                                    {'🍅'.repeat(Math.min(completedSessions.filter(s => s.mode === 'work' || s.mode === 'pomodoro50' || s.mode === 'pomodoro90').length, 6))}
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Controls */}
                    <div className="flex items-center gap-4">
                        <button onClick={handleReset}
                            className="w-12 h-12 rounded-2xl bg-gray-900 text-gray-400 hover:bg-gray-800 hover:text-white flex items-center justify-center transition-all">
                            <RotateCcw size={18} />
                        </button>
                        <button
                            onClick={() => setIsRunning(r => !r)}
                            className="w-20 h-20 rounded-3xl flex items-center justify-center text-white shadow-2xl transition-all active:scale-95"
                            style={{ background: modeColor, boxShadow: `0 0 40px ${modeColor}40` }}
                        >
                            {isRunning ? <Pause size={32} /> : <Play size={32} />}
                        </button>
                    </div>
                </div>

                {/* Right panel */}
                <div className="w-72 space-y-4">
                    {/* Mode selector */}
                    <div className="bg-gray-900/80 rounded-2xl p-4 border border-gray-800 space-y-2">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-600 mb-2">Timer Mode</p>
                        {(Object.keys(MODES) as ModeKey[]).map(m => (
                            <button key={m} onClick={() => handleModeChange(m)}
                                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-sm font-bold transition-all ${focusMode === m ? 'bg-gray-800 text-white' : 'text-gray-500 hover:text-gray-300 hover:bg-gray-800/50'
                                    }`}>
                                <span>{MODES[m].label}</span>
                                <div className="flex items-center gap-2">
                                    <span className="text-gray-600 text-xs font-medium">{MODES[m].minutes} min</span>
                                    {focusMode === m && (
                                        <div className="w-2 h-2 rounded-full" style={{ background: modeColor }} />
                                    )}
                                </div>
                            </button>
                        ))}
                    </div>

                    {/* Task selector */}
                    <div className="bg-gray-900/80 rounded-2xl p-4 border border-gray-800">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-600 mb-2">Current Task</p>
                        {localTaskId && selectedTask ? (
                            <div className="space-y-2">
                                <div className="flex items-start gap-2 p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20">
                                    <Brain size={13} className="text-indigo-400 shrink-0 mt-0.5" />
                                    <p className="text-xs font-bold text-indigo-300 leading-snug">{selectedTask.title}</p>
                                </div>
                                <button onClick={() => setLocalTaskId(null)} className="text-[10px] text-gray-600 hover:text-gray-400 transition-colors">
                                    Clear task
                                </button>
                            </div>
                        ) : (
                            <div className="relative">
                                <select
                                    value={localTaskId || ''}
                                    onChange={e => setLocalTaskId(e.target.value || null)}
                                    className="w-full text-xs font-medium bg-gray-800 border border-gray-700 text-gray-300 rounded-xl px-3 py-2 pr-7 outline-none appearance-none"
                                >
                                    <option value="">— Select a task —</option>
                                    {safeTasks.filter(t => t.status !== 'done').map(t => (
                                        <option key={t.id} value={t.id}>{t.title}</option>
                                    ))}
                                </select>
                                <ChevronDown size={11} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
                            </div>
                        )}
                    </div>

                    {/* Sound picker */}
                    <div className="bg-gray-900/80 rounded-2xl p-4 border border-gray-800">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-600 mb-2">Ambient Sound</p>
                        <div className="flex gap-2">
                            {Object.entries(SOUNDS).map(([key, s]) => (
                                <button key={key} onClick={() => setSound(key)}
                                    className={`flex-1 py-2 rounded-xl text-xs font-bold flex flex-col items-center gap-1 transition-all border ${sound === key ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-800 text-gray-500 hover:text-gray-300 hover:border-gray-700'
                                        }`}>
                                    {s.icon}
                                    <span className="text-[9px]">{s.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Session log */}
                    {completedSessions.length > 0 && (
                        <div className="bg-gray-900/80 rounded-2xl p-4 border border-gray-800">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-600 mb-2">Today's Sessions</p>
                            <div className="space-y-1.5 max-h-32 overflow-y-auto">
                                {completedSessions.map((s, i) => (
                                    <div key={i} className="flex items-center gap-2 text-xs text-gray-400">
                                        <CheckCircle2 size={11} className="text-emerald-400 shrink-0" />
                                        <span className="font-medium">{MODES[s.mode].label}</span>
                                        <span className="ml-auto text-gray-600">{s.minutes} min</span>
                                    </div>
                                ))}
                                <div className="pt-1.5 border-t border-gray-800 flex items-center gap-1 text-emerald-400 font-bold text-xs">
                                    <Clock size={11} />
                                    {completedSessions.reduce((a, s) => a + s.minutes, 0)} min focused today
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </motion.div>
    );
};
