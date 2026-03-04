import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, Calendar, Users, Archive, ChevronRight, GripVertical, Brain, X } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';

// ─── Types ───────────────────────────────────────────────────────────────────
type Quadrant = 'q1' | 'q2' | 'q3' | 'q4';

interface QuadrantConfig {
    id: Quadrant;
    label: string;
    subLabel: string;
    urgency: string;
    importance: string;
    icon: React.ReactNode;
    accent: string;
    bg: string;
    border: string;
    badge: string;
    aiHint: string;
}

// ─── Config ──────────────────────────────────────────────────────────────────
const QUADRANTS: QuadrantConfig[] = [
    {
        id: 'q1', label: 'Do Now', subLabel: 'Urgent + Important',
        urgency: 'Urgent', importance: 'Important',
        icon: <Zap size={16} />,
        accent: 'text-rose-400', bg: 'bg-rose-500/5', border: 'border-rose-500/25',
        badge: 'bg-rose-500/15 text-rose-400 border-rose-500/20',
        aiHint: 'Handle immediately — high impact, time-sensitive.',
    },
    {
        id: 'q2', label: 'Schedule', subLabel: 'Not Urgent + Important',
        urgency: 'Not Urgent', importance: 'Important',
        icon: <Calendar size={16} />,
        accent: 'text-indigo-400', bg: 'bg-indigo-500/5', border: 'border-indigo-500/25',
        badge: 'bg-indigo-500/15 text-indigo-400 border-indigo-500/20',
        aiHint: 'Block time on calendar — valuable for long-term growth.',
    },
    {
        id: 'q3', label: 'Delegate', subLabel: 'Urgent + Not Important',
        urgency: 'Urgent', importance: 'Not Important',
        icon: <Users size={16} />,
        accent: 'text-amber-400', bg: 'bg-amber-500/5', border: 'border-amber-500/25',
        badge: 'bg-amber-500/15 text-amber-400 border-amber-500/20',
        aiHint: 'Assign to a teammate — urgent but not your best use of time.',
    },
    {
        id: 'q4', label: 'Eliminate', subLabel: 'Not Urgent + Not Important',
        urgency: 'Not Urgent', importance: 'Not Important',
        icon: <Archive size={16} />,
        accent: 'text-gray-400', bg: 'bg-gray-500/5', border: 'border-gray-500/20',
        badge: 'bg-gray-500/10 text-gray-400 border-gray-500/15',
        aiHint: 'Consider archiving — low value, low urgency.',
    },
];

// ─── Task Card ───────────────────────────────────────────────────────────────
const TaskCard: React.FC<{
    task: any;
    quadrant: QuadrantConfig;
    isDark: boolean;
    onDragStart: (taskId: string) => void;
    onRemove: (taskId: string) => void;
}> = ({ task, quadrant, isDark, onDragStart, onRemove }) => {
    const dk = isDark;
    const priorityColor = task.priority === 'high'
        ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
        : task.priority === 'medium'
            ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
            : 'bg-gray-500/10 text-gray-400 border-gray-500/15';

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            draggable
            onDragStart={() => onDragStart(task.id)}
            className={`group p-3 rounded-xl border cursor-grab active:cursor-grabbing transition-all ${dk ? 'bg-[#0d0d0f] border-gray-800 hover:border-gray-700' : 'bg-white border-gray-100 hover:border-gray-200 shadow-sm'
                }`}
        >
            <div className="flex items-start gap-2">
                <GripVertical size={12} className="text-gray-600 mt-0.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="flex-1 min-w-0">
                    <p className={`text-xs font-bold truncate leading-tight ${dk ? 'text-gray-200' : 'text-gray-800'}`}>
                        {task.title}
                    </p>
                    <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border uppercase tracking-wider ${priorityColor}`}>
                            {task.priority}
                        </span>
                        {task.due_date && (
                            <span className="text-[9px] text-gray-500 flex items-center gap-0.5">
                                <Calendar size={9} />
                                {new Date(task.due_date).toLocaleDateString('en', { month: 'short', day: 'numeric' })}
                            </span>
                        )}
                    </div>
                </div>
                <button
                    onClick={() => onRemove(task.id)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded text-gray-600 hover:text-gray-400"
                >
                    <X size={11} />
                </button>
            </div>
            {/* AI hint */}
            <div className={`mt-2 text-[9px] text-gray-600 flex items-center gap-1 border-t pt-1.5 ${dk ? 'border-gray-800' : 'border-gray-100'}`}>
                <Brain size={9} className="shrink-0 text-indigo-400" />
                {quadrant.aiHint}
            </div>
        </motion.div>
    );
};

// ─── Drop Zone ───────────────────────────────────────────────────────────────
const DropZone: React.FC<{
    quadrant: QuadrantConfig;
    tasks: any[];
    isDark: boolean;
    onDragOver: (qId: Quadrant) => void;
    onDrop: (qId: Quadrant) => void;
    dragTarget: Quadrant | null;
    onDragStart: (taskId: string) => void;
    onRemoveFromQuadrant: (taskId: string) => void;
}> = ({ quadrant, tasks, isDark, onDragOver, onDrop, dragTarget, onDragStart, onRemoveFromQuadrant }) => {
    const dk = isDark;
    const isTarget = dragTarget === quadrant.id;

    return (
        <div
            onDragOver={e => { e.preventDefault(); onDragOver(quadrant.id); }}
            onDrop={e => { e.preventDefault(); onDrop(quadrant.id); }}
            className={`h-full flex flex-col rounded-2xl border-2 transition-all ${isTarget
                ? `${quadrant.border} ring-2 ring-offset-0` + (dk ? ' ring-offset-[#0A0A0B]' : '')
                : dk ? 'border-gray-800' : 'border-gray-100'
                } ${isTarget ? quadrant.bg : ''}`}
        >
            {/* Header */}
            <div className={`p-4 border-b ${dk ? 'border-gray-800' : 'border-gray-100'} flex items-start justify-between ${quadrant.bg} rounded-t-2xl`}>
                <div className="flex items-center gap-2">
                    <span className={quadrant.accent}>{quadrant.icon}</span>
                    <div>
                        <p className={`text-sm font-black ${dk ? 'text-white' : 'text-gray-900'}`}>{quadrant.label}</p>
                        <p className="text-[10px] text-gray-500">{quadrant.subLabel}</p>
                    </div>
                </div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${quadrant.badge}`}>
                    {tasks.length}
                </span>
            </div>

            {/* Task list */}
            <div className="flex-1 p-3 space-y-2 overflow-y-auto min-h-[80px]">
                <AnimatePresence mode="popLayout">
                    {tasks.map(task => (
                        <TaskCard
                            key={task.id}
                            task={task}
                            quadrant={quadrant}
                            isDark={dk}
                            onDragStart={onDragStart}
                            onRemove={onRemoveFromQuadrant}
                        />
                    ))}
                </AnimatePresence>
                {tasks.length === 0 && (
                    <div className={`h-16 flex items-center justify-center rounded-xl border-2 border-dashed ${dk ? 'border-gray-800 text-gray-700' : 'border-gray-200 text-gray-300'
                        } text-xs font-medium`}>
                        Drop tasks here
                    </div>
                )}
            </div>
        </div>
    );
};

// ─── Main Component ───────────────────────────────────────────────────────────
export const EisenhowerMatrix: React.FC = () => {
    const { isDarkMode, tasks, eisenhowerMap, setTaskQuadrant } = useAppStore();
    const dk = isDarkMode;
    const safeTasks = Array.isArray(tasks) ? tasks : [];

    // Tasks not yet assigned go to q1 by default
    const getQuadrant = (taskId: number): Quadrant =>
        (eisenhowerMap[String(taskId)] as Quadrant) || 'q1';

    const [draggingTaskId, setDraggingTaskId] = useState<string | null>(null);
    const [dragTarget, setDragTarget] = useState<Quadrant | null>(null);

    const handleDrop = useCallback((targetQ: Quadrant) => {
        if (draggingTaskId) {
            setTaskQuadrant(draggingTaskId, targetQ);
            setDraggingTaskId(null);
            setDragTarget(null);
        }
    }, [draggingTaskId, setTaskQuadrant]);

    const handleRemove = useCallback((taskId: string) => {
        // Move to eliminate quadrant
        setTaskQuadrant(taskId, 'q4');
    }, [setTaskQuadrant]);

    // Unassigned tasks dropdown
    const [showUnassigned, setShowUnassigned] = useState(false);
    const unassigned = safeTasks.filter(t => !eisenhowerMap[String(t.id)] && t.status !== 'done');

    return (
        <div className="space-y-4">
            {/* Header row */}
            <div className="flex items-center justify-between">
                <div>
                    <p className={`text-xs text-gray-500`}>
                        Drag tasks between quadrants to prioritize your work.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    {unassigned.length > 0 && (
                        <div className="relative">
                            <button
                                onClick={() => setShowUnassigned(!showUnassigned)}
                                className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl border transition-all ${dk ? 'border-gray-700 text-gray-300 hover:border-gray-600 bg-[#121214]' : 'border-gray-200 text-gray-700 hover:border-gray-300 bg-white'
                                    }`}
                            >
                                <span className="w-4 h-4 rounded-full bg-amber-500 text-white text-[9px] font-black flex items-center justify-center">
                                    {unassigned.length}
                                </span>
                                Unassigned <ChevronRight size={12} className={showUnassigned ? 'rotate-90 transition-transform' : 'transition-transform'} />
                            </button>
                            <AnimatePresence>
                                {showUnassigned && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 4 }}
                                        className={`absolute right-0 top-full mt-2 w-64 rounded-2xl border shadow-xl z-20 p-2 space-y-1 ${dk ? 'bg-[#121214] border-gray-800 shadow-black/50' : 'bg-white border-gray-100'
                                            }`}
                                    >
                                        <p className={`text-[10px] font-bold uppercase tracking-widest px-2 mb-1 ${dk ? 'text-gray-600' : 'text-gray-400'}`}>
                                            Drag to assign — or click to place in Q1
                                        </p>
                                        {unassigned.map(t => (
                                            <button
                                                key={t.id}
                                                draggable
                                                onDragStart={() => { setDraggingTaskId(String(t.id)); setShowUnassigned(false); }}
                                                onClick={() => { setTaskQuadrant(String(t.id), 'q1'); }}
                                                className={`w-full text-left px-3 py-2 rounded-xl flex items-center gap-2 transition-all ${dk ? 'hover:bg-gray-800 text-gray-300' : 'hover:bg-gray-50 text-gray-700'
                                                    }`}
                                            >
                                                <GripVertical size={11} className="text-gray-500 shrink-0" />
                                                <span className="text-xs font-medium truncate">{t.title}</span>
                                            </button>
                                        ))}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    )}
                </div>
            </div>

            {/* Axis labels */}
            <div className="relative">
                {/* Urgency label top */}
                <div className="flex justify-center mb-1">
                    <div className="flex items-center gap-6 text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                        <span>← Not Urgent</span>
                        <span className="w-24 text-center">Urgency →</span>
                        <span>Urgent →</span>
                    </div>
                </div>

                <div className="flex gap-4">
                    {/* Importance label left */}
                    <div className="flex flex-col justify-center shrink-0">
                        <div style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}
                            className="text-[10px] font-bold text-gray-500 uppercase tracking-widest whitespace-nowrap">
                            ← Not Important · Important →
                        </div>
                    </div>

                    {/* 2x2 Grid */}
                    <div className="flex-1 grid grid-cols-2 gap-3 min-h-[480px]">
                        {/* Row 1: Important */}
                        {/* Q1: Urgent + Important */}
                        <DropZone
                            quadrant={QUADRANTS[0]}
                            tasks={safeTasks.filter(t => getQuadrant(t.id) === 'q1' && t.status !== 'done')}
                            isDark={dk}
                            onDragOver={setDragTarget}
                            onDrop={handleDrop}
                            dragTarget={dragTarget}
                            onDragStart={setDraggingTaskId}
                            onRemoveFromQuadrant={handleRemove}
                        />
                        {/* Q2: Not Urgent + Important */}
                        <DropZone
                            quadrant={QUADRANTS[1]}
                            tasks={safeTasks.filter(t => getQuadrant(t.id) === 'q2' && t.status !== 'done')}
                            isDark={dk}
                            onDragOver={setDragTarget}
                            onDrop={handleDrop}
                            dragTarget={dragTarget}
                            onDragStart={setDraggingTaskId}
                            onRemoveFromQuadrant={handleRemove}
                        />
                        {/* Row 2: Not Important */}
                        {/* Q3: Urgent + Not Important */}
                        <DropZone
                            quadrant={QUADRANTS[2]}
                            tasks={safeTasks.filter(t => getQuadrant(t.id) === 'q3' && t.status !== 'done')}
                            isDark={dk}
                            onDragOver={setDragTarget}
                            onDrop={handleDrop}
                            dragTarget={dragTarget}
                            onDragStart={setDraggingTaskId}
                            onRemoveFromQuadrant={handleRemove}
                        />
                        {/* Q4: Not Urgent + Not Important */}
                        <DropZone
                            quadrant={QUADRANTS[3]}
                            tasks={safeTasks.filter(t => getQuadrant(t.id) === 'q4' && t.status !== 'done')}
                            isDark={dk}
                            onDragOver={setDragTarget}
                            onDrop={handleDrop}
                            dragTarget={dragTarget}
                            onDragStart={setDraggingTaskId}
                            onRemoveFromQuadrant={handleRemove}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};
