import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '../store/useAppStore';
import { Search, ChevronDown, ChevronUp, BookOpen, Zap, BarChart3, FileText, Shield, AlertTriangle, ExternalLink } from 'lucide-react';

interface Article {
    title: string;
    content: string;
    roles: ('all' | 'admin' | 'manager' | 'contributor')[];
}

interface Section {
    id: string;
    label: string;
    icon: React.ReactNode;
    roles: ('all' | 'admin' | 'manager' | 'contributor')[];
    articles: Article[];
}

const SECTIONS: Section[] = [
    {
        id: 'getting-started',
        label: 'Getting Started',
        icon: <Zap size={16} />,
        roles: ['all'],
        articles: [
            { title: 'Setting up your workspace', content: 'Learn how to configure your TICKEL workspace, invite team members, and set up your first project.', roles: ['all'] },
            { title: 'Navigating the dashboard', content: 'Understand the main dashboard layout: KPI cards, the activity timeline, AI insights panel, and quick actions.', roles: ['all'] },
            { title: 'Your profile and preferences', content: 'Update your name, avatar, and notification preferences from the Settings panel.', roles: ['all'] },
        ],
    },
    {
        id: 'tasks',
        label: 'Task Management',
        icon: <BookOpen size={16} />,
        roles: ['all'],
        articles: [
            { title: 'Creating and editing tasks', content: 'Use the + button or the "Add Task" shortcut to open the Task Modal. Fill in the title, description, assignee, due date, priority, and estimated hours.', roles: ['all'] },
            { title: 'Subtasks and dependencies', content: 'Break down complex tasks in the Subtasks section of the Task Modal. Link dependencies to block tasks until prerequisites are complete.', roles: ['all'] },
            { title: 'Task statuses explained', content: 'Todo → In Progress → Done. Blocked is a special status for tasks awaiting external input.', roles: ['all'] },
            { title: 'Assigning tasks to team members', content: 'In the Task Modal, select a member from the Assignee dropdown. Admins and Managers can assign to any team member.', roles: ['admin', 'manager'] },
            { title: 'Bulk task operations', content: 'Select multiple tasks using checkboxes and apply status changes or priority updates in bulk.', roles: ['admin', 'manager'] },
        ],
    },
    {
        id: 'analytics',
        label: 'Analytics Guide',
        icon: <BarChart3 size={16} />,
        roles: ['all'],
        articles: [
            { title: 'Understanding your Focus Score', content: 'Focus Score is calculated from your deep work ratio (uninterrupted work sessions vs. context switches). Higher is better.', roles: ['contributor', 'all'] },
            { title: 'Productivity trend charts', content: 'Your productivity trend shows daily completion velocity over the selected period. A declining trend may indicate overload.', roles: ['all'] },
            { title: 'Team Productivity Matrix', content: 'Each team is scored by their completion rate and in-progress task ratio. Click a team row to expand and see individual member load.', roles: ['admin', 'manager'] },
            { title: 'Org Velocity metric', content: 'Org Velocity is the organization-wide task completion rate. Admins can drill down by department or team.', roles: ['admin'] },
            { title: 'Burnout risk signals', content: 'TICKEL flags members with consistently high in-progress counts relative to their capacity. Review the Workload Alerts panel regularly.', roles: ['admin', 'manager'] },
        ],
    },
    {
        id: 'reports',
        label: 'Reports Guide',
        icon: <FileText size={16} />,
        roles: ['all'],
        articles: [
            { title: 'Generating your first report', content: 'Go to Reports → select a report type card → click Configure → set your preferences → click Generate. The Report Viewer opens automatically.', roles: ['all'] },
            { title: 'Report types explained', content: 'Daily (today snapshot), Weekly (trend), Team (workload), Project (delivery health), Time Utilization (deep vs shallow), Custom (any combination).', roles: ['all'] },
            { title: 'AI narrative summaries', content: 'Toggle on "Generate AI Narrative Summary" in the builder to get Yukime-powered insights, risk flags, and recommendations.', roles: ['all'] },
            { title: 'Scheduling automated reports', content: 'The Manage Schedules feature is coming soon. Automated report deliveries will be configurable per recipient and cadence.', roles: ['admin', 'manager'] },
        ],
    },
    {
        id: 'permissions',
        label: 'Permissions & Roles',
        icon: <Shield size={16} />,
        roles: ['admin', 'manager'],
        articles: [
            { title: 'Role hierarchy explained', content: 'Global Admin → Manager → Contributor → Viewer. Each level inherits the permissions of the level below.', roles: ['admin'] },
            { title: 'Permission architecture overview', content: 'TICKEL uses Row Level Security (RLS) in Supabase to enforce data isolation. Each policy maps to a role level.', roles: ['admin'] },
            { title: 'Assigning roles to users', content: 'In the Throne panel (⚡), open User Nexus, find the user, and use the Role dropdown to elevate or demote their access.', roles: ['admin'] },
            { title: 'Manager-level access boundaries', content: 'Managers can view all team-level data but cannot access org-wide restructuring, audit logs, or system diagnostics.', roles: ['admin', 'manager'] },
            { title: 'Audit log interpretation', content: 'The audit log records permission changes, admin actions, and login events. Accessible from the Throne panel under Audit Logs.', roles: ['admin'] },
        ],
    },
    {
        id: 'troubleshooting',
        label: 'Troubleshooting',
        icon: <AlertTriangle size={16} />,
        roles: ['all'],
        articles: [
            { title: 'Tasks not saving', content: 'Ensure you have a valid Supabase connection. Check the browser console for RLS policy errors. Contact your admin if the issue persists.', roles: ['all'] },
            { title: 'AI responses not generating', content: 'Check your AI configuration: go to Settings and verify the Local Model URL or Gemini API Key. Ensure the AI service is running.', roles: ['all'] },
            { title: 'Team members not visible in dropdowns', content: 'Members must be added to a team before they appear in task assignment dropdowns. Go to Team → manage your team.', roles: ['all'] },
            { title: 'Report generation fails silently', content: 'This is typically a state sync issue. Refresh the page and try again. If it persists, check console errors.', roles: ['all'] },
            { title: 'RLS policy errors in console', content: 'Run the provided fix_team_members_rls.sql script in your Supabase SQL editor, then refresh the application.', roles: ['admin'] },
        ],
    },
];

export const SupportHelpCenter: React.FC = () => {
    const { isDarkMode, isAdmin, userProfile } = useAppStore();
    const [search, setSearch] = useState('');
    const [openSections, setOpenSections] = useState<Set<string>>(new Set(['getting-started']));
    const [expandedArticle, setExpandedArticle] = useState<string | null>(null);

    const role = isAdmin ? 'admin' : (userProfile?.global_role === 'Manager' ? 'manager' : 'contributor');
    const dk = isDarkMode;

    const visibleSections = useMemo(() => {
        return SECTIONS
            .filter(s => s.roles.includes('all') || s.roles.includes(role as any))
            .map(s => ({
                ...s,
                articles: s.articles.filter(a =>
                    (a.roles.includes('all') || a.roles.includes(role as any)) &&
                    (search === '' || a.title.toLowerCase().includes(search.toLowerCase()) || a.content.toLowerCase().includes(search.toLowerCase()))
                )
            }))
            .filter(s => s.articles.length > 0);
    }, [role, search]);

    const toggleSection = (id: string) => {
        setOpenSections(prev => {
            const next = new Set(prev);
            next.has(id) ? next.delete(id) : next.add(id);
            return next;
        });
    };

    return (
        <div className="space-y-6">
            {/* Search */}
            <div className={`flex items-center gap-3 px-4 py-3 rounded-2xl border ${dk ? 'bg-[#1a1c1d] border-gray-800' : 'bg-gray-50 border-gray-200'}`}>
                <Search size={18} className="text-gray-400 shrink-0" />
                <input
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Search articles..."
                    className={`flex-1 bg-transparent text-sm outline-none ${dk ? 'text-white placeholder-gray-500' : 'text-gray-900 placeholder-gray-400'}`}
                />
            </div>

            {/* Role Badge */}
            <div className={`text-xs font-bold px-3 py-1.5 rounded-lg inline-flex items-center gap-2 ${role === 'admin' ? 'bg-indigo-500/10 text-indigo-400' : role === 'manager' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-purple-500/10 text-purple-400'}`}>
                <Shield size={11} />
                Showing articles for: {role === 'admin' ? 'Global Admin' : role === 'manager' ? 'Manager' : 'Contributor'}
            </div>

            {/* Sections */}
            <div className="space-y-3">
                {visibleSections.map(section => {
                    const isOpen = openSections.has(section.id);
                    return (
                        <div key={section.id} className={`rounded-2xl border overflow-hidden ${dk ? 'border-gray-800' : 'border-gray-200'}`}>
                            <button
                                onClick={() => toggleSection(section.id)}
                                className={`w-full flex items-center justify-between gap-3 p-5 transition-colors ${dk ? 'bg-[#121214] hover:bg-[#1a1c1d]' : 'bg-white hover:bg-gray-50'}`}
                            >
                                <div className="flex items-center gap-3">
                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center border ${dk ? 'bg-gray-800 border-gray-700 text-gray-300' : 'bg-gray-100 border-gray-200 text-gray-600'}`}>
                                        {section.icon}
                                    </div>
                                    <div className="text-left">
                                        <p className={`font-bold text-sm ${dk ? 'text-white' : 'text-gray-900'}`}>{section.label}</p>
                                        <p className="text-[11px] text-gray-500">{section.articles.length} article{section.articles.length !== 1 ? 's' : ''}</p>
                                    </div>
                                </div>
                                {isOpen ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
                            </button>

                            <AnimatePresence>
                                {isOpen && (
                                    <motion.div
                                        initial={{ height: 0 }}
                                        animate={{ height: 'auto' }}
                                        exit={{ height: 0 }}
                                        className="overflow-hidden"
                                    >
                                        <div className={`border-t ${dk ? 'border-gray-800' : 'border-gray-100'} divide-y ${dk ? 'divide-gray-800/60' : 'divide-gray-100'}`}>
                                            {section.articles.map((article, idx) => {
                                                const key = `${section.id}-${idx}`;
                                                const isExpanded = expandedArticle === key;
                                                return (
                                                    <div key={idx}
                                                        className={`${dk ? 'bg-[#0e0f10]' : 'bg-gray-50/50'}`}
                                                    >
                                                        <button
                                                            onClick={() => setExpandedArticle(isExpanded ? null : key)}
                                                            className="w-full flex items-center justify-between gap-3 px-5 py-3.5 text-left group"
                                                        >
                                                            <p className={`text-sm font-medium group-hover:text-indigo-400 transition-colors ${dk ? 'text-gray-300' : 'text-gray-700'}`}>
                                                                {article.title}
                                                            </p>
                                                            {isExpanded ? <ChevronUp size={14} className="text-gray-500 shrink-0" /> : <ChevronDown size={14} className="text-gray-500 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />}
                                                        </button>
                                                        <AnimatePresence>
                                                            {isExpanded && (
                                                                <motion.div
                                                                    initial={{ height: 0, opacity: 0 }}
                                                                    animate={{ height: 'auto', opacity: 1 }}
                                                                    exit={{ height: 0, opacity: 0 }}
                                                                    className="overflow-hidden"
                                                                >
                                                                    <p className={`px-5 pb-4 text-sm leading-relaxed ${dk ? 'text-gray-400' : 'text-gray-600'}`}>
                                                                        {article.content}
                                                                    </p>
                                                                </motion.div>
                                                            )}
                                                        </AnimatePresence>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    );
                })}
            </div>

            {visibleSections.length === 0 && (
                <div className="text-center py-16 opacity-50">
                    <Search size={40} className={`mx-auto mb-3 ${dk ? 'text-gray-600' : 'text-gray-400'}`} />
                    <p className={`font-bold ${dk ? 'text-gray-400' : 'text-gray-600'}`}>No articles found for "{search}"</p>
                </div>
            )}
        </div>
    );
};
