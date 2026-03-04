import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '../store/useAppStore';
import { Sparkles, BookOpen, Ticket, Activity, ThumbsUp, Shield, BarChart3 } from 'lucide-react';
import { SupportAIAssistant } from './SupportAIAssistant';
import { SupportHelpCenter } from './SupportHelpCenter';
import { SupportTickets } from './SupportTickets';
import { SupportSystemStatus } from './SupportSystemStatus';
import { SupportFeedback } from './SupportFeedback';

interface Tab {
    id: 'assistant' | 'helpcenter' | 'tickets' | 'status' | 'feedback';
    label: string;
    shortLabel: string;
    icon: React.ReactNode;
    adminLabel?: string;
}

const TABS: Tab[] = [
    { id: 'assistant', label: 'AI Assistant', shortLabel: 'AI', icon: <Sparkles size={16} />, adminLabel: 'Command Center' },
    { id: 'helpcenter', label: 'Help Center', shortLabel: 'Help', icon: <BookOpen size={16} /> },
    { id: 'tickets', label: 'Tickets', shortLabel: 'Tickets', icon: <Ticket size={16} /> },
    { id: 'status', label: 'System Status', shortLabel: 'Status', icon: <Activity size={16} /> },
    { id: 'feedback', label: 'Feedback', shortLabel: 'Ideas', icon: <ThumbsUp size={16} /> },
];

export const SupportHub: React.FC = () => {
    const { isDarkMode, isAdmin, userProfile, supportTab, setSupportTab } = useAppStore();
    const dk = isDarkMode;
    const role = isAdmin ? 'admin' : (userProfile?.global_role === 'Manager' ? 'manager' : 'contributor');

    const activeTab = supportTab;

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Page Header */}
            <div className="flex items-start justify-between flex-wrap gap-4">
                <div>
                    <div className={`inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest mb-2 ${dk ? 'text-indigo-400' : 'text-indigo-600'}`}>
                        {isAdmin ? <Shield size={12} /> : <Sparkles size={12} />}
                        {isAdmin ? 'Admin Support Center' : role === 'manager' ? 'Team Support Center' : 'Support & Help'}
                    </div>
                    <h1 className={`text-3xl font-black tracking-tight ${dk ? 'text-white' : 'text-gray-900'}`}>
                        {isAdmin ? 'Intelligence & Support' : 'Support Center'}
                    </h1>
                    <p className="text-gray-500 text-sm mt-1">
                        {isAdmin ? 'System diagnostics, AI command center, and organization-wide support management.' : role === 'manager' ? 'Team assistant, knowledge base, and operational support.' : 'Your personal AI coach, help articles, and support requests.'}
                    </p>
                </div>

                {/* Quick stat badges for Admin */}
                {isAdmin && (
                    <div className="flex gap-3 flex-wrap">
                        <div className={`px-4 py-2 rounded-xl border text-center ${dk ? 'bg-[#1a1c1d] border-gray-800' : 'bg-white border-gray-200'}`}>
                            <p className={`text-lg font-black text-rose-400`}>2</p>
                            <p className="text-[10px] text-gray-500 uppercase tracking-wider">Open Tickets</p>
                        </div>
                        <div className={`px-4 py-2 rounded-xl border text-center ${dk ? 'bg-[#1a1c1d] border-gray-800' : 'bg-white border-gray-200'}`}>
                            <p className={`text-lg font-black text-emerald-400`}>99.9%</p>
                            <p className="text-[10px] text-gray-500 uppercase tracking-wider">System Health</p>
                        </div>
                    </div>
                )}
            </div>

            {/* Tab Navigation */}
            <div className={`flex gap-1 p-1.5 rounded-2xl border overflow-x-auto ${dk ? 'bg-[#1a1c1d] border-gray-800' : 'bg-gray-100 border-gray-200'}`}>
                {TABS.map(tab => {
                    const isActive = activeTab === tab.id;
                    const label = (tab.id === 'assistant' && isAdmin && tab.adminLabel) ? tab.adminLabel : tab.label;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setSupportTab(tab.id)}
                            className={`relative flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold whitespace-nowrap transition-all flex-1 justify-center ${isActive
                                ? dk ? 'bg-[#121214] text-white shadow-sm' : 'bg-white text-gray-900 shadow-sm'
                                : dk ? 'text-gray-500 hover:text-gray-300' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            {tab.icon}
                            <span className="hidden sm:block">{label}</span>
                            <span className="sm:hidden">{tab.shortLabel}</span>
                            {isActive && (
                                <motion.div
                                    layoutId="tab-indicator"
                                    className="absolute inset-0 rounded-xl ring-1 ring-indigo-500/30"
                                />
                            )}
                        </button>
                    );
                })}
            </div>

            {/* Tab Content */}
            <AnimatePresence mode="wait">
                <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.18 }}
                >
                    {activeTab === 'assistant' && <SupportAIAssistant />}
                    {activeTab === 'helpcenter' && <SupportHelpCenter />}
                    {activeTab === 'tickets' && <SupportTickets />}
                    {activeTab === 'status' && <SupportSystemStatus />}
                    {activeTab === 'feedback' && <SupportFeedback />}
                </motion.div>
            </AnimatePresence>
        </div>
    );
};
