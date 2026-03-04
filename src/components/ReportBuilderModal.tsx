import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '../store/useAppStore';
import {
    X,
    Calendar,
    Globe,
    Users,
    User,
    CheckSquare,
    Clock,
    Target,
    Activity,
    BrainCircuit,
    Wand2,
    Download,
    TrendingUp,
    AlertTriangle,
    BarChart2,
    Briefcase,
    Settings2,
    Layers,
    Zap,
    Coffee,
    GitBranch
} from 'lucide-react';

// ─── Template Configs ────────────────────────────────────────────────────────
type MetricKey = string;

interface MetricOption {
    key: MetricKey;
    label: string;
    icon: React.ReactNode;
    defaultOn: boolean;
}

interface TemplateConfig {
    title: string;
    subtitle: string;
    accentColor: string;
    defaultScope: 'me' | 'team' | 'org';
    defaultDateRange: 'today' | 'week' | 'month';
    dateRangeOptions: { id: 'today' | 'week' | 'month'; label: string }[];
    scopeOptions: ('me' | 'team' | 'org')[];
    metrics: MetricOption[];
    advancedOptions?: { key: string; label: string; description: string }[];
}

const TEMPLATE_CONFIGS: Record<string, TemplateConfig> = {
    daily: {
        title: 'Daily Report',
        subtitle: 'A tactical snapshot of your day — what happened, what slipped, and what needs attention now.',
        accentColor: 'indigo',
        defaultScope: 'me',
        defaultDateRange: 'today',
        dateRangeOptions: [
            { id: 'today', label: 'Today' },
            { id: 'week', label: 'Yesterday' },
        ],
        scopeOptions: ['me', 'team'],
        metrics: [
            { key: 'tasksCompleted', label: 'Tasks Completed', icon: <CheckSquare size={15} />, defaultOn: true },
            { key: 'overdueItems', label: 'Overdue / Slipped', icon: <AlertTriangle size={15} />, defaultOn: true },
            { key: 'timeTracked', label: 'Time Logged', icon: <Clock size={15} />, defaultOn: true },
            { key: 'focusScore', label: 'Focus Score', icon: <Target size={15} />, defaultOn: false },
            { key: 'meetingsToday', label: 'Meeting Load', icon: <Coffee size={15} />, defaultOn: false },
            { key: 'blockers', label: 'Active Blockers', icon: <AlertTriangle size={15} />, defaultOn: false },
        ],
        advancedOptions: [
            { key: 'includeCalendar', label: 'Include calendar events', description: 'Pull in scheduled meetings from the day.' },
            { key: 'highlightBlockers', label: 'Highlight blockers prominently', description: 'Place overdue & blocked tasks at the top.' },
        ],
    },
    weekly: {
        title: 'Weekly Performance',
        subtitle: 'Understand how productive the week was — trends, completion velocity, and areas to improve.',
        accentColor: 'emerald',
        defaultScope: 'me',
        defaultDateRange: 'week',
        dateRangeOptions: [
            { id: 'week', label: 'This Week' },
            { id: 'month', label: 'Last 2 Weeks' },
        ],
        scopeOptions: ['me', 'team', 'org'],
        metrics: [
            { key: 'completionRate', label: 'Completion Rate', icon: <TrendingUp size={15} />, defaultOn: true },
            { key: 'productivityTrend', label: 'Productivity Trend', icon: <Activity size={15} />, defaultOn: true },
            { key: 'timeTracked', label: 'Hours Tracked', icon: <Clock size={15} />, defaultOn: true },
            { key: 'overdueItems', label: 'Overdue Rollover', icon: <AlertTriangle size={15} />, defaultOn: true },
            { key: 'focusScore', label: 'Average Focus Score', icon: <Target size={15} />, defaultOn: false },
            { key: 'deepWorkRatio', label: 'Deep Work Ratio', icon: <Zap size={15} />, defaultOn: false },
        ],
        advancedOptions: [
            { key: 'compareLastWeek', label: 'Compare to previous week', description: 'Show side-by-side delta metrics.' },
            { key: 'showVelocityChart', label: 'Task velocity chart', description: 'Daily task completion rate as a bar chart.' },
        ],
    },
    team: {
        title: 'Team Report',
        subtitle: 'Get visibility into team workload distribution, individual contributions, and collaboration health.',
        accentColor: 'amber',
        defaultScope: 'team',
        defaultDateRange: 'week',
        dateRangeOptions: [
            { id: 'week', label: 'This Week' },
            { id: 'month', label: 'This Month' },
        ],
        scopeOptions: ['team', 'org'],
        metrics: [
            { key: 'workloadDistribution', label: 'Workload Distribution', icon: <Users size={15} />, defaultOn: true },
            { key: 'individualContributions', label: 'Individual Contributions', icon: <User size={15} />, defaultOn: true },
            { key: 'collaborationScore', label: 'Collaboration Score', icon: <GitBranch size={15} />, defaultOn: true },
            { key: 'overdueItems', label: 'Overdue by Member', icon: <AlertTriangle size={15} />, defaultOn: false },
            { key: 'capacityUtilization', label: 'Capacity Utilization', icon: <BarChart2 size={15} />, defaultOn: false },
            { key: 'focusScore', label: 'Team Focus Average', icon: <Target size={15} />, defaultOn: false },
        ],
        advancedOptions: [
            { key: 'anonymizeMembers', label: 'Anonymize member data', description: 'Show aggregated data without names.' },
            { key: 'showBurnoutRisk', label: 'Flag burnout risks', description: 'Highlight members above capacity.' },
        ],
    },
    project: {
        title: 'Project Report',
        subtitle: 'Deep-dive into a project\'s health — progress vs plan, delays, bottlenecks, and delivery risk.',
        accentColor: 'rose',
        defaultScope: 'team',
        defaultDateRange: 'month',
        dateRangeOptions: [
            { id: 'week', label: 'Last Week' },
            { id: 'month', label: 'This Month' },
        ],
        scopeOptions: ['me', 'team', 'org'],
        metrics: [
            { key: 'progressVsPlan', label: 'Progress vs Plan', icon: <BarChart2 size={15} />, defaultOn: true },
            { key: 'timeVsEstimate', label: 'Time vs Estimate', icon: <Clock size={15} />, defaultOn: true },
            { key: 'milestonesHit', label: 'Milestones Hit', icon: <CheckSquare size={15} />, defaultOn: true },
            { key: 'delayedTasks', label: 'Delayed Tasks', icon: <AlertTriangle size={15} />, defaultOn: true },
            { key: 'blockers', label: 'Active Blockers', icon: <Layers size={15} />, defaultOn: false },
            { key: 'deliveryRisk', label: 'Delivery Risk Score', icon: <TrendingUp size={15} />, defaultOn: false },
        ],
        advancedOptions: [
            { key: 'showGanttTimeline', label: 'Include timeline view', description: 'Render a simplified Gantt-style chart.' },
            { key: 'riskForecast', label: 'AI delivery risk forecast', description: 'Predict whether deadlines will be met.' },
        ],
    },
    time: {
        title: 'Time Utilization',
        subtitle: 'Analyze how time is really being spent — deep work vs shallow, idle periods, and meeting pressure.',
        accentColor: 'purple',
        defaultScope: 'me',
        defaultDateRange: 'week',
        dateRangeOptions: [
            { id: 'today', label: 'Today' },
            { id: 'week', label: 'This Week' },
            { id: 'month', label: 'This Month' },
        ],
        scopeOptions: ['me', 'team'],
        metrics: [
            { key: 'deepWorkRatio', label: 'Deep Work Ratio', icon: <Zap size={15} />, defaultOn: true },
            { key: 'shallowWorkRatio', label: 'Shallow Work Ratio', icon: <Layers size={15} />, defaultOn: true },
            { key: 'idleTime', label: 'Idle / Unlogged Time', icon: <Coffee size={15} />, defaultOn: true },
            { key: 'meetingLoad', label: 'Meeting Load', icon: <Calendar size={15} />, defaultOn: true },
            { key: 'peakHours', label: 'Peak Performance Hours', icon: <TrendingUp size={15} />, defaultOn: false },
            { key: 'contextSwitches', label: 'Context Switch Count', icon: <Activity size={15} />, defaultOn: false },
        ],
        advancedOptions: [
            { key: 'showHeatmap', label: 'Daily heatmap view', description: 'Color-coded hour-by-hour activity grid.' },
            { key: 'billableToggle', label: 'Split billable vs internal', description: 'Separate billable logged hours from internal.' },
        ],
    },
    custom: {
        title: 'Custom Report',
        subtitle: 'Build your own report from scratch — pick any combination of metrics, scope, and AI models.',
        accentColor: 'gray',
        defaultScope: 'me',
        defaultDateRange: 'week',
        dateRangeOptions: [
            { id: 'today', label: 'Today' },
            { id: 'week', label: 'This Week' },
            { id: 'month', label: 'This Month' },
        ],
        scopeOptions: ['me', 'team', 'org'],
        metrics: [
            { key: 'tasksCompleted', label: 'Tasks Completed', icon: <CheckSquare size={15} />, defaultOn: false },
            { key: 'timeTracked', label: 'Time Tracked', icon: <Clock size={15} />, defaultOn: false },
            { key: 'focusScore', label: 'Focus Score', icon: <Target size={15} />, defaultOn: false },
            { key: 'overdueItems', label: 'Overdue Items', icon: <AlertTriangle size={15} />, defaultOn: false },
            { key: 'productivityTrend', label: 'Productivity Trend', icon: <Activity size={15} />, defaultOn: false },
            { key: 'workloadDistribution', label: 'Workload Distribution', icon: <Users size={15} />, defaultOn: false },
            { key: 'deepWorkRatio', label: 'Deep Work Ratio', icon: <Zap size={15} />, defaultOn: false },
            { key: 'deliveryRisk', label: 'Delivery Risk Score', icon: <TrendingUp size={15} />, defaultOn: false },
            { key: 'collaborationScore', label: 'Collaboration Score', icon: <GitBranch size={15} />, defaultOn: false },
        ],
        advancedOptions: [
            { key: 'compareLastWeek', label: 'Compare to previous period', description: 'Show delta metrics vs the prior period.' },
            { key: 'showBurnoutRisk', label: 'Include burnout risk signals', description: 'Highlight members above capacity.' },
            { key: 'showHeatmap', label: 'Daily heatmap view', description: 'Color-coded hour-by-hour activity grid.' },
        ],
    },
};

const ACCENT_CLASSES: Record<string, { bg: string; text: string; border: string; button: string }> = {
    indigo: { bg: 'bg-indigo-500/10', text: 'text-indigo-400', border: 'border-indigo-500/20', button: 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-600/30' },
    emerald: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/20', button: 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/30' },
    amber: { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/20', button: 'bg-amber-500 hover:bg-amber-600 shadow-amber-500/30' },
    rose: { bg: 'bg-rose-500/10', text: 'text-rose-400', border: 'border-rose-500/20', button: 'bg-rose-600 hover:bg-rose-700 shadow-rose-600/30' },
    purple: { bg: 'bg-purple-500/10', text: 'text-purple-400', border: 'border-purple-500/20', button: 'bg-purple-600 hover:bg-purple-700 shadow-purple-600/30' },
    gray: { bg: 'bg-gray-500/10', text: 'text-gray-300', border: 'border-gray-600/30', button: 'bg-gray-700 hover:bg-gray-600 shadow-gray-700/30' },
};

// ─── Component ────────────────────────────────────────────────────────────────
export const ReportBuilderModal: React.FC = () => {
    const {
        isReportBuilderOpen,
        setIsReportBuilderOpen,
        activeReportTemplate,
        isDarkMode,
        userProfile,
        isAdmin,
        setGeneratedReportData,
        generateReport,
        isGeneratingReport
    } = useAppStore();

    const config = useMemo(() =>
        TEMPLATE_CONFIGS[activeReportTemplate ?? 'daily'] ?? TEMPLATE_CONFIGS.daily,
        [activeReportTemplate]
    );

    const accent = ACCENT_CLASSES[config.accentColor] ?? ACCENT_CLASSES.indigo;

    // Local state initialised from the template config
    const [scope, setScope] = useState<'me' | 'team' | 'org'>(config.defaultScope);
    const [dateRange, setDateRange] = useState<'today' | 'week' | 'month'>(config.defaultDateRange);
    const [metrics, setMetrics] = useState<Record<string, boolean>>(() =>
        Object.fromEntries(config.metrics.map(m => [m.key, m.defaultOn]))
    );
    const [advancedToggles, setAdvancedToggles] = useState<Record<string, boolean>>({});
    const [useAI, setUseAI] = useState(true);

    // Re-initialise when template changes
    const resetToConfig = (cfg: TemplateConfig) => {
        setScope(cfg.defaultScope);
        setDateRange(cfg.defaultDateRange);
        setMetrics(Object.fromEntries(cfg.metrics.map(m => [m.key, m.defaultOn])));
        setAdvancedToggles({});
    };

    // Run reset when template changes
    React.useEffect(() => {
        resetToConfig(config);
    }, [activeReportTemplate]);

    if (!isReportBuilderOpen || !activeReportTemplate) return null;

    const handleToggleMetric = (key: string) => {
        setMetrics(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const handleToggleAdvanced = (key: string) => {
        setAdvancedToggles(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const handleGenerate = async () => {
        if (!activeReportTemplate) return;

        await generateReport({
            template: activeReportTemplate,
            scope,
            dateRange,
            metrics,
            useAI
        });

        setIsReportBuilderOpen(false);
    };

    const scopeLabels: Record<string, { label: string; icon: React.ReactNode }> = {
        me: { label: 'Just Me', icon: <User size={16} /> },
        team: { label: 'My Team', icon: <Users size={16} /> },
        org: { label: 'Full Org', icon: <Globe size={16} /> },
    };

    const canSelectScope = (s: string) => {
        if (s === 'org') return isAdmin || userProfile?.global_role === 'Global Admin';
        if (s === 'team') return isAdmin || userProfile?.global_role === 'Manager' || userProfile?.global_role === 'Global Admin';
        return true;
    };

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 lg:p-12">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={() => setIsReportBuilderOpen(false)}
                    className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                />

                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    className={`relative w-full max-w-5xl max-h-[92vh] flex flex-col rounded-3xl overflow-hidden shadow-2xl border ${isDarkMode ? 'bg-[#121214] border-gray-800' : 'bg-white border-gray-200'}`}
                >
                    {/* Header */}
                    <div className={`shrink-0 flex items-start justify-between p-6 border-b ${isDarkMode ? 'border-gray-800 bg-[#1A1A1C]/50' : 'border-gray-100 bg-gray-50'}`}>
                        <div>
                            <div className={`inline-flex items-center gap-2 text-xs font-bold tracking-widest uppercase mb-2 ${accent.text}`}>
                                <Briefcase size={12} />
                                {config.accentColor === 'gray' ? 'Custom Builder' : 'Report Builder'}
                            </div>
                            <h2 className={`text-2xl font-black tracking-tight ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                {config.title}
                            </h2>
                            <p className="text-gray-500 text-sm mt-1 max-w-xl">{config.subtitle}</p>
                        </div>
                        <button
                            onClick={() => setIsReportBuilderOpen(false)}
                            className={`p-2 rounded-xl transition-colors shrink-0 mt-1 ${isDarkMode ? 'text-gray-400 hover:text-white hover:bg-gray-800' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'}`}
                        >
                            <X size={22} />
                        </button>
                    </div>

                    {/* Scrollable Content */}
                    <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-8 custom-scrollbar">

                        {/* 1. Time & Scope */}
                        <div className="space-y-4">
                            <SectionLabel label="1. Time & Scope" dark={isDarkMode} />
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                                {/* Date Range */}
                                <div>
                                    <label className={`block text-xs font-bold mb-3 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Date Range</label>
                                    <div className={`flex gap-2 p-1 rounded-xl border ${isDarkMode ? 'bg-[#1a1c1d] border-gray-800' : 'bg-gray-100 border-gray-200'}`}>
                                        {config.dateRangeOptions.map(opt => (
                                            <button
                                                key={opt.id}
                                                onClick={() => setDateRange(opt.id)}
                                                className={`flex-1 py-2 px-3 text-sm font-bold rounded-lg transition-all ${dateRange === opt.id
                                                    ? (isDarkMode ? 'bg-gray-800 text-white shadow' : 'bg-white text-gray-900 shadow')
                                                    : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
                                            >
                                                {opt.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Scope */}
                                <div>
                                    <label className={`block text-xs font-bold mb-3 flex items-center gap-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                        Entity Scope
                                        <span className={`px-2 py-0.5 rounded text-[10px] uppercase ${isDarkMode ? 'bg-gray-800 text-gray-400' : 'bg-gray-200 text-gray-600'}`}>
                                            {userProfile?.global_role || 'User'} Access
                                        </span>
                                    </label>
                                    <div className="flex gap-2">
                                        {config.scopeOptions.map(s => {
                                            const allowed = canSelectScope(s);
                                            return (
                                                <button
                                                    key={s}
                                                    onClick={() => allowed && setScope(s)}
                                                    disabled={!allowed}
                                                    className={`flex-1 flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl border-2 transition-all text-xs font-bold
                                                        ${scope === s
                                                            ? `border-current ${accent.bg} ${accent.text}`
                                                            : isDarkMode ? 'border-gray-800 hover:border-gray-700 text-gray-400' : 'border-gray-200 hover:border-gray-300 text-gray-500'}
                                                        ${!allowed ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}
                                                >
                                                    {scopeLabels[s].icon}
                                                    {scopeLabels[s].label}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* 2. Metrics */}
                        <div className="space-y-4">
                            <SectionLabel label="2. Data Included" dark={isDarkMode} />
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                {config.metrics.map(m => {
                                    const on = metrics[m.key] ?? false;
                                    return (
                                        <button
                                            key={m.key}
                                            onClick={() => handleToggleMetric(m.key)}
                                            className={`flex items-center gap-3 p-4 rounded-xl border transition-all text-left ${on
                                                ? `${accent.bg} ${accent.border} ${accent.text}`
                                                : isDarkMode ? 'bg-[#1a1c1d] border-gray-800 text-gray-400 hover:border-gray-700' : 'bg-gray-50 border-gray-200 text-gray-600 hover:border-gray-300'}`}
                                        >
                                            <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${on ? `bg-current/20` : 'border border-current/30'}`}>
                                                {m.icon}
                                            </div>
                                            <span className="text-sm font-bold leading-tight">{m.label}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* 3. Advanced Options (template-specific) */}
                        {config.advancedOptions && config.advancedOptions.length > 0 && (
                            <div className="space-y-4">
                                <SectionLabel label="3. Advanced Options" dark={isDarkMode} />
                                <div className="space-y-3">
                                    {config.advancedOptions.map(opt => {
                                        const on = advancedToggles[opt.key] ?? false;
                                        return (
                                            <div
                                                key={opt.key}
                                                onClick={() => handleToggleAdvanced(opt.key)}
                                                className={`cursor-pointer flex items-center justify-between gap-4 p-4 rounded-xl border transition-all ${on
                                                    ? `${accent.bg} ${accent.border}`
                                                    : isDarkMode ? 'bg-[#1a1c1d] border-gray-800 hover:border-gray-700' : 'bg-gray-50 border-gray-200 hover:border-gray-300'}`}
                                            >
                                                <div>
                                                    <p className={`text-sm font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{opt.label}</p>
                                                    <p className={`text-xs mt-0.5 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>{opt.description}</p>
                                                </div>
                                                <div className={`w-11 h-6 rounded-full p-1 transition-colors shrink-0 ${on ? `bg-current ${accent.text}` : 'bg-gray-300 dark:bg-gray-700'}`}>
                                                    <div className={`w-4 h-4 rounded-full bg-white transition-transform ${on ? 'translate-x-5' : 'translate-x-0'}`} />
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* 4. AI Intelligence */}
                        <div className="space-y-4">
                            <SectionLabel
                                label={config.advancedOptions?.length ? '4. Intelligence' : '3. Intelligence'}
                                dark={isDarkMode}
                                icon={<BrainCircuit size={14} />}
                                color="purple"
                            />
                            <div
                                onClick={() => setUseAI(!useAI)}
                                className={`cursor-pointer border-2 rounded-2xl p-5 transition-all ${useAI
                                    ? (isDarkMode ? 'border-purple-500 bg-purple-500/5' : 'border-purple-500 bg-purple-50')
                                    : (isDarkMode ? 'border-gray-800' : 'border-gray-200')}`}
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2 rounded-lg ${useAI ? 'bg-purple-500 text-white' : 'bg-gray-200 dark:bg-gray-800 text-gray-400'}`}>
                                            <Wand2 size={18} />
                                        </div>
                                        <div>
                                            <h4 className={`font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Generate AI Narrative Summary</h4>
                                            <p className={`text-xs mt-0.5 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                                Yukime will analyze the data and produce insights, risk flags, and recommendations.
                                            </p>
                                        </div>
                                    </div>
                                    <div className={`w-12 h-6 rounded-full p-1 transition-colors shrink-0 ${useAI ? 'bg-purple-500' : 'bg-gray-300 dark:bg-gray-700'}`}>
                                        <div className={`w-4 h-4 rounded-full bg-white transition-transform ${useAI ? 'translate-x-6' : 'translate-x-0'}`} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className={`shrink-0 p-5 border-t flex flex-col sm:flex-row items-center justify-between gap-4 ${isDarkMode ? 'border-gray-800 bg-[#1A1A1C]/80' : 'border-gray-100 bg-gray-50'}`}>
                        <button className={`flex items-center gap-2 text-sm font-bold px-4 py-2 rounded-xl border transition-all ${isDarkMode ? 'bg-[#1a1c1d] border-gray-800 hover:bg-gray-800 text-gray-300' : 'bg-white border-gray-200 hover:bg-gray-100 text-gray-700'}`}>
                            <Download size={15} /> Quick CSV Export
                        </button>
                        <div className="flex gap-3 w-full sm:w-auto">
                            <button
                                onClick={() => setIsReportBuilderOpen(false)}
                                className={`flex-1 sm:flex-none px-6 py-3 rounded-xl font-bold transition-colors ${isDarkMode ? 'bg-gray-800 text-gray-300 hover:bg-gray-700' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleGenerate}
                                disabled={isGeneratingReport}
                                className={`flex-1 sm:flex-none px-8 py-3 rounded-xl font-black shadow-lg transition-all flex items-center justify-center gap-2 text-white ${accent.button} disabled:opacity-70`}
                            >
                                {isGeneratingReport ? (
                                    <>
                                        <motion.div
                                            animate={{ rotate: 360 }}
                                            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                                        >
                                            <Wand2 size={16} />
                                        </motion.div>
                                        Generating...
                                    </>
                                ) : (
                                    <>
                                        <Wand2 size={16} />
                                        Generate Report
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

// ─── Helper ───────────────────────────────────────────────────────────────────
const SectionLabel: React.FC<{ label: string; dark: boolean; icon?: React.ReactNode; color?: string }> = ({ label, dark, icon, color }) => (
    <h3 className={`text-xs font-bold tracking-widest uppercase flex items-center gap-2 ${color === 'purple' ? (dark ? 'text-purple-400' : 'text-purple-600') : dark ? 'text-gray-500' : 'text-gray-400'}`}>
        {icon}{label}
    </h3>
);
