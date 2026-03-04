import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
    Settings, Shield, Zap, Bell, CheckCircle, Clock,
    CreditCard, LayoutDashboard, Link2, X, Lock, RefreshCw, BarChart2, Calendar
} from 'lucide-react';
import { useAppStore } from '../store/useAppStore';

interface WorkspaceSettingsProps {
    onClose: () => void;
}

export const WorkspaceSettings: React.FC<WorkspaceSettingsProps> = ({ onClose }) => {
    const { isDarkMode, workspaceSettings, setWorkspaceSettings, isAdmin, userProfile } = useAppStore();
    const dk = isDarkMode;

    const role = userProfile?.global_role?.toLowerCase() || 'user';
    const isManager = role === 'manager' || isAdmin;

    const getTabAccess = (tabId: string) => {
        if (['security', 'billing', 'integrations'].includes(tabId)) {
            return { hasAccess: isAdmin, requiredRole: 'Global Admin' };
        }
        if (['defaults', 'ai', 'analytics'].includes(tabId)) {
            return { hasAccess: isManager, requiredRole: 'Manager or Global Admin' };
        }
        return { hasAccess: isManager, requiredRole: 'Workspace Leader (Manager/Admin)' };
    };

    const [activeTab, setActiveTab] = useState<
        'general' | 'defaults' | 'ai' | 'notifications' | 'security' | 'analytics' | 'integrations' | 'billing'
    >('general');

    const tabs = [
        { id: 'general', label: 'General', icon: <LayoutDashboard size={16} /> },
        { id: 'defaults', label: 'System Defaults', icon: <Settings size={16} /> },
        { id: 'ai', label: 'AI Configuration', icon: <Zap size={16} /> },
        { id: 'notifications', label: 'Notifications', icon: <Bell size={16} /> },
        { id: 'security', label: 'Security & Access', icon: <Shield size={16} /> },
        { id: 'analytics', label: 'Reporting Rules', icon: <BarChart2 size={16} /> },
        { id: 'integrations', label: 'Integrations', icon: <Link2 size={16} /> },
        { id: 'billing', label: 'Billing & Plan', icon: <CreditCard size={16} /> },
    ] as const;

    const handleUpdate = (updates: Partial<typeof workspaceSettings>) => {
        setWorkspaceSettings(updates);
    };

    return (
        <div className="fixed inset-0 z-[100] flex bg-black/50 backdrop-blur-sm pointer-events-auto items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                className={`w-full max-w-5xl h-[85vh] flex flex-col rounded-2xl shadow-2xl overflow-hidden ${dk ? 'bg-[#0F0F11] border border-gray-800' : 'bg-white border border-gray-200'}`}
            >
                {/* Header */}
                <div className={`p-4 border-b flex items-center justify-between ${dk ? 'border-gray-800 bg-[#141416]' : 'border-gray-100 bg-gray-50'}`}>
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-500">
                            <Settings size={20} />
                        </div>
                        <div>
                            <h2 className={`text-lg font-black ${dk ? 'text-white' : 'text-gray-900'}`}>Workspace Governance</h2>
                            <p className="text-xs text-gray-500">Global environment settings for {workspaceSettings?.name}</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className={`p-2 rounded-lg transition-colors ${dk ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-200 text-gray-500'}`}
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Body layout */}
                <div className="flex flex-1 overflow-hidden">
                    {/* Sidebar Tabs */}
                    <div className={`w-64 shrink-0 overflow-y-auto p-4 border-r ${dk ? 'border-gray-800 bg-[#121214]' : 'border-gray-100 bg-gray-50/50'}`}>
                        <div className="space-y-1">
                            {tabs.map(tab => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id as any)}
                                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${activeTab === tab.id
                                        ? (dk ? 'bg-indigo-500/10 text-indigo-400' : 'bg-indigo-50 text-indigo-600')
                                        : (dk ? 'text-gray-400 hover:bg-gray-800/50 hover:text-gray-300' : 'text-gray-600 hover:bg-gray-100')
                                        }`}
                                >
                                    {tab.icon}
                                    {tab.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Content Area */}
                    <div className={`flex-1 overflow-y-auto p-8 ${dk ? 'bg-[#0a0a0b]' : 'bg-white'}`}>
                        <div className="max-w-2xl mx-auto space-y-8">

                            {!getTabAccess(activeTab).hasAccess ? (
                                <div className={`flex flex-col items-center justify-center p-12 mt-10 text-center border border-dashed rounded-2xl ${dk ? 'border-gray-800 bg-[#121214]' : 'border-gray-200 bg-gray-50'}`}>
                                    <Lock size={48} className={`mb-4 ${dk ? 'text-gray-700' : 'text-gray-300'}`} />
                                    <h4 className={`text-xl font-bold mb-2 ${dk ? 'text-white' : 'text-gray-900'}`}>{tabs.find(t => t.id === activeTab)?.label} Locked</h4>
                                    <p className="text-sm text-gray-500 max-w-sm">This section requires <strong>{getTabAccess(activeTab).requiredRole}</strong> privileges to view or configure.</p>
                                </div>
                            ) : (
                                <>
                                    {/* General Tab */}
                                    {activeTab === 'general' && (
                                        <div className="space-y-6">
                                            <div>
                                                <h3 className={`text-lg font-bold mb-1 ${dk ? 'text-white' : 'text-gray-900'}`}>General Settings</h3>
                                                <p className="text-sm text-gray-500 mb-6">Define your workspace identity.</p>
                                            </div>
                                            <div className="space-y-4">
                                                <div>
                                                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5">Workspace Name</label>
                                                    <input
                                                        type="text"
                                                        value={workspaceSettings?.name || ''}
                                                        onChange={(e) => handleUpdate({ name: e.target.value })}
                                                        className={`w-full rounded-xl px-4 py-2.5 text-sm outline-none transition-all ${dk ? 'bg-[#1A1A1C] border border-gray-700 text-white focus:border-indigo-500' : 'bg-gray-50 border border-gray-200 text-gray-900 focus:border-indigo-500'}`}
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5">Description</label>
                                                    <input
                                                        type="text"
                                                        value={workspaceSettings?.description || ''}
                                                        onChange={(e) => handleUpdate({ description: e.target.value })}
                                                        className={`w-full rounded-xl px-4 py-2.5 text-sm outline-none transition-all ${dk ? 'bg-[#1A1A1C] border border-gray-700 text-white focus:border-indigo-500' : 'bg-gray-50 border border-gray-200 text-gray-900 focus:border-indigo-500'}`}
                                                    />
                                                </div>
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div>
                                                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5">Timezone</label>
                                                        <select
                                                            value={workspaceSettings?.timezone || 'UTC'}
                                                            onChange={(e) => handleUpdate({ timezone: e.target.value })}
                                                            className={`w-full rounded-xl px-4 py-2.5 text-sm outline-none transition-all ${dk ? 'bg-[#1A1A1C] border border-gray-700 text-white focus:border-indigo-500' : 'bg-gray-50 border border-gray-200 text-gray-900 focus:border-indigo-500'}`}
                                                        >
                                                            <option value="UTC">UTC (GMT+0)</option>
                                                            <option value="EST">EST (GMT-5)</option>
                                                            <option value="PST">PST (GMT-8)</option>
                                                            <option value="EAT">EAT (GMT+3)</option>
                                                        </select>
                                                    </div>
                                                    <div>
                                                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5">Currency</label>
                                                        <input
                                                            type="text"
                                                            value={workspaceSettings?.currency || ''}
                                                            onChange={(e) => handleUpdate({ currency: e.target.value })}
                                                            className={`w-full rounded-xl px-4 py-2.5 text-sm outline-none transition-all ${dk ? 'bg-[#1A1A1C] border border-gray-700 text-white focus:border-indigo-500' : 'bg-gray-50 border border-gray-200 text-gray-900 focus:border-indigo-500'}`}
                                                        />
                                                    </div>
                                                </div>
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div>
                                                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5">Working Hours Start</label>
                                                        <input
                                                            type="time"
                                                            value={workspaceSettings?.workingHoursStart || '09:00'}
                                                            onChange={(e) => handleUpdate({ workingHoursStart: e.target.value })}
                                                            className={`w-full rounded-xl px-4 py-2.5 text-sm outline-none transition-all ${dk ? 'bg-[#1A1A1C] border border-gray-700 text-white focus:border-indigo-500' : 'bg-gray-50 border border-gray-200 text-gray-900 focus:border-indigo-500'}`}
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5">Working Hours End</label>
                                                        <input
                                                            type="time"
                                                            value={workspaceSettings?.workingHoursEnd || '17:00'}
                                                            onChange={(e) => handleUpdate({ workingHoursEnd: e.target.value })}
                                                            className={`w-full rounded-xl px-4 py-2.5 text-sm outline-none transition-all ${dk ? 'bg-[#1A1A1C] border border-gray-700 text-white focus:border-indigo-500' : 'bg-gray-50 border border-gray-200 text-gray-900 focus:border-indigo-500'}`}
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Defaults Tab */}
                                    {activeTab === 'defaults' && (
                                        <div className="space-y-6">
                                            <div>
                                                <h3 className={`text-lg font-bold mb-1 ${dk ? 'text-white' : 'text-gray-900'}`}>Workspace Defaults</h3>
                                                <p className="text-sm text-gray-500 mb-6">Global system behaviors applied across all departments.</p>
                                            </div>
                                            <div className="space-y-4">
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div>
                                                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5">Default Task Status</label>
                                                        <select
                                                            value={workspaceSettings?.defaultTaskStatus || 'todo'}
                                                            onChange={(e) => handleUpdate({ defaultTaskStatus: e.target.value as any })}
                                                            className={`w-full rounded-xl px-4 py-2.5 text-sm outline-none transition-all ${dk ? 'bg-[#1A1A1C] border border-gray-700 text-white focus:border-indigo-500' : 'bg-gray-50 border border-gray-200 text-gray-900 focus:border-indigo-500'}`}
                                                        >
                                                            <option value="todo">To Do</option>
                                                            <option value="in_progress">In Progress</option>
                                                        </select>
                                                    </div>
                                                    <div>
                                                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5">Default Priority</label>
                                                        <select
                                                            value={workspaceSettings?.defaultTaskPriority || 'medium'}
                                                            onChange={(e) => handleUpdate({ defaultTaskPriority: e.target.value as any })}
                                                            className={`w-full rounded-xl px-4 py-2.5 text-sm outline-none transition-all ${dk ? 'bg-[#1A1A1C] border border-gray-700 text-white focus:border-indigo-500' : 'bg-gray-50 border border-gray-200 text-gray-900 focus:border-indigo-500'}`}
                                                        >
                                                            <option value="low">Low</option>
                                                            <option value="medium">Medium</option>
                                                            <option value="high">High</option>
                                                        </select>
                                                    </div>
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5">Task Visibility Baseline</label>
                                                    <select
                                                        value={workspaceSettings?.tasksVisibleTo || 'team'}
                                                        onChange={(e) => handleUpdate({ tasksVisibleTo: e.target.value as any })}
                                                        className={`w-full rounded-xl px-4 py-2.5 text-sm outline-none transition-all ${dk ? 'bg-[#1A1A1C] border border-gray-700 text-white focus:border-indigo-500' : 'bg-gray-50 border border-gray-200 text-gray-900 focus:border-indigo-500'}`}
                                                    >
                                                        <option value="workspace">Entire Workspace</option>
                                                        <option value="department">Restricted to Department</option>
                                                        <option value="team">Restricted to Team</option>
                                                        <option value="private">Private by Default</option>
                                                    </select>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* AI Tab */}
                                    {activeTab === 'ai' && (
                                        <div className="space-y-6">
                                            <div className="flex items-center gap-3 mb-6">
                                                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
                                                    <Zap size={24} />
                                                </div>
                                                <div>
                                                    <h3 className={`text-xl font-bold ${dk ? 'text-white' : 'text-gray-900'}`}>AI & Automation</h3>
                                                    <p className="text-sm text-gray-500">Global instructions for your AI models.</p>
                                                </div>
                                            </div>
                                            <div className="space-y-6">
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div>
                                                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5">AI Access Policy</label>
                                                        <select
                                                            value={workspaceSettings?.aiAccess || 'all'}
                                                            onChange={(e) => handleUpdate({ aiAccess: e.target.value as any })}
                                                            className={`w-full rounded-xl px-4 py-2.5 text-sm outline-none transition-all ${dk ? 'bg-[#1A1A1C] border border-gray-700 text-white focus:border-indigo-500' : 'bg-gray-50 border border-gray-200 text-gray-900 focus:border-indigo-500'}`}
                                                        >
                                                            <option value="all">Everyone</option>
                                                            <option value="managers">Managers Only</option>
                                                            <option value="admin">Admin Only</option>
                                                        </select>
                                                    </div>
                                                    <div>
                                                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5">AI Data Scope</label>
                                                        <select
                                                            value={workspaceSettings?.aiDataScope || 'user'}
                                                            onChange={(e) => handleUpdate({ aiDataScope: e.target.value as any })}
                                                            className={`w-full rounded-xl px-4 py-2.5 text-sm outline-none transition-all ${dk ? 'bg-[#1A1A1C] border border-gray-700 text-white focus:border-indigo-500' : 'bg-gray-50 border border-gray-200 text-gray-900 focus:border-indigo-500'}`}
                                                        >
                                                            <option value="user">Only user's tasks</option>
                                                            <option value="department">Department scope</option>
                                                            <option value="workspace">Full workspace</option>
                                                        </select>
                                                    </div>
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2 mb-1.5">
                                                        Workspace AI System Prompt <span className="px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-500 text-[9px]">ADVANCED</span>
                                                    </label>
                                                    <p className="text-[11px] text-gray-500 mb-2">Shapes how AI behaves and analyzes data across the entire workspace.</p>
                                                    <textarea
                                                        value={workspaceSettings?.aiSystemPrompt || ''}
                                                        onChange={(e) => handleUpdate({ aiSystemPrompt: e.target.value })}
                                                        rows={4}
                                                        className={`w-full rounded-xl px-4 py-3 text-sm outline-none transition-all resize-none ${dk ? 'bg-[#1A1A1C] border border-gray-700 text-white focus:border-indigo-500' : 'bg-gray-50 border border-gray-200 text-gray-900 focus:border-indigo-500'}`}
                                                    />
                                                </div>
                                            </div>

                                            <div className="pt-4 border-t border-gray-100 dark:border-gray-800">
                                                <div className="flex items-center gap-2 mb-4">
                                                    <Zap size={18} className="text-amber-500" />
                                                    <h4 className={`text-sm font-bold ${dk ? 'text-white' : 'text-gray-900'}`}>Cloud Intelligence (Vertex AI)</h4>
                                                </div>

                                                <div className="space-y-4">
                                                    <div className="flex items-center justify-between p-4 rounded-xl border border-indigo-100 dark:border-indigo-900/30 bg-indigo-50/30 dark:bg-indigo-500/5">
                                                        <div>
                                                            <div className="flex items-center gap-2">
                                                                <p className={`text-sm font-bold ${dk ? 'text-white' : 'text-gray-900'}`}>Enable Cloud Engine</p>
                                                                {!isAdmin && <Lock size={12} className="text-amber-400" />}
                                                            </div>
                                                            <p className="text-xs text-gray-500">{isAdmin ? 'Global Admin: Toggle to switch Yukime between Cloud and Local AI.' : 'Only Global Admins can change this setting.'}</p>
                                                        </div>
                                                        <div
                                                            className={`w-11 h-6 rounded-full flex items-center p-1 transition-colors ${isAdmin ? 'cursor-pointer' : 'cursor-not-allowed opacity-60'} ${workspaceSettings?.cloudAiEnabled ? 'bg-indigo-500' : 'bg-gray-300 dark:bg-gray-700'}`}
                                                            onClick={() => isAdmin && handleUpdate({ cloudAiEnabled: !workspaceSettings?.cloudAiEnabled })}
                                                            title={!isAdmin ? 'Only Global Admins can change this setting.' : undefined}
                                                        >
                                                            <div className={`w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${workspaceSettings?.cloudAiEnabled ? 'translate-x-5' : 'translate-x-0'}`} />
                                                        </div>
                                                    </div>

                                                    {workspaceSettings?.cloudAiEnabled && (
                                                        <div className="grid grid-cols-2 gap-4">
                                                            <div>
                                                                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5 text-indigo-500">Premium Model</label>
                                                                <select
                                                                    value={workspaceSettings?.cloudAiModel || 'gemini-2.5-pro'}
                                                                    onChange={(e) => handleUpdate({ cloudAiModel: e.target.value as any })}
                                                                    className={`w-full rounded-xl px-4 py-2.5 text-sm outline-none transition-all ${dk ? 'bg-indigo-500/10 border border-indigo-500/30 text-white focus:border-indigo-500' : 'bg-indigo-50 border border-indigo-200 text-gray-900 focus:border-indigo-500'}`}
                                                                >
                                                                    <option value="gemini-2.5-pro">Gemini 2.5 Pro (Deep Reasoning)</option>
                                                                    <option value="gemini-1.5-flash">Gemini 1.5 Flash (Super Fast)</option>
                                                                </select>
                                                            </div>
                                                            <div className="flex items-center gap-2 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
                                                                <BarChart2 size={16} className="text-amber-500 shrink-0" />
                                                                <p className="text-[10px] text-amber-600 dark:text-amber-400 leading-tight">
                                                                    Cloud models consume GCP credits. <strong>Pro</strong> is best for executive summaries.
                                                                </p>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Notifications Tab */}
                                    {activeTab === 'notifications' && (
                                        <div className="space-y-6">
                                            <div>
                                                <h3 className={`text-lg font-bold mb-1 ${dk ? 'text-white' : 'text-gray-900'}`}>Global Notifications</h3>
                                                <p className="text-sm text-gray-500 mb-6">Master controls for workspace alerts.</p>
                                            </div>
                                            <div className="space-y-4">
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div>
                                                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5">Overdue Warning Days</label>
                                                        <input
                                                            type="number"
                                                            min="0"
                                                            value={workspaceSettings?.notifyOverdueDays || 1}
                                                            onChange={(e) => handleUpdate({ notifyOverdueDays: parseInt(e.target.value) || 0 })}
                                                            className={`w-full rounded-xl px-4 py-2.5 text-sm outline-none transition-all ${dk ? 'bg-[#1A1A1C] border border-gray-700 text-white focus:border-indigo-500' : 'bg-gray-50 border border-gray-200 text-gray-900 focus:border-indigo-500'}`}
                                                        />
                                                    </div>
                                                    <div className="flex flex-col justify-center pt-6">
                                                        <div className="flex items-center justify-between">
                                                            <span className={`text-sm font-medium ${dk ? 'text-gray-300' : 'text-gray-700'}`}>Weekend Notifications</span>
                                                            <div
                                                                className={`w-11 h-6 rounded-full flex items-center p-1 cursor-pointer transition-colors ${workspaceSettings?.weekendNotifications ? 'bg-indigo-500' : 'bg-gray-300 dark:bg-gray-700'}`}
                                                                onClick={() => handleUpdate({ weekendNotifications: !workspaceSettings?.weekendNotifications })}
                                                            >
                                                                <div className={`w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${workspaceSettings?.weekendNotifications ? 'translate-x-5' : 'translate-x-0'}`} />
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className={`p-4 rounded-xl border ${dk ? 'bg-[#1A1A1C] border-gray-800' : 'bg-gray-50 border-gray-200'}`}>
                                                    <div className="flex items-center justify-between mb-4">
                                                        <div>
                                                            <h4 className={`text-sm font-bold ${dk ? 'text-white' : 'text-gray-900'}`}>Quiet Hours</h4>
                                                            <p className="text-xs text-gray-500">Mute all standard notifications across the workspace.</p>
                                                        </div>
                                                        <div
                                                            className={`w-11 h-6 rounded-full flex items-center p-1 cursor-pointer transition-colors ${workspaceSettings?.quietHoursEnabled ? 'bg-indigo-500' : 'bg-gray-300 dark:bg-gray-700'}`}
                                                            onClick={() => handleUpdate({ quietHoursEnabled: !workspaceSettings?.quietHoursEnabled })}
                                                        >
                                                            <div className={`w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${workspaceSettings?.quietHoursEnabled ? 'translate-x-5' : 'translate-x-0'}`} />
                                                        </div>
                                                    </div>
                                                    {workspaceSettings?.quietHoursEnabled && (
                                                        <div className="grid grid-cols-2 gap-4 mt-4">
                                                            <div>
                                                                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5">Start Time</label>
                                                                <input
                                                                    type="time"
                                                                    value={workspaceSettings?.quietHoursStart || '18:00'}
                                                                    onChange={(e) => handleUpdate({ quietHoursStart: e.target.value })}
                                                                    className={`w-full rounded-xl px-4 py-2.5 text-sm outline-none transition-all ${dk ? 'bg-[#141416] border border-gray-700 text-white' : 'bg-white border border-gray-200 text-gray-900'}`}
                                                                />
                                                            </div>
                                                            <div>
                                                                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5">End Time</label>
                                                                <input
                                                                    type="time"
                                                                    value={workspaceSettings?.quietHoursEnd || '08:00'}
                                                                    onChange={(e) => handleUpdate({ quietHoursEnd: e.target.value })}
                                                                    className={`w-full rounded-xl px-4 py-2.5 text-sm outline-none transition-all ${dk ? 'bg-[#141416] border border-gray-700 text-white' : 'bg-white border border-gray-200 text-gray-900'}`}
                                                                />
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Security Tab */}
                                    {activeTab === 'security' && (
                                        <div className="space-y-6">
                                            <div className="flex items-center gap-3 mb-6">
                                                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-500 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20">
                                                    <Shield size={24} />
                                                </div>
                                                <div>
                                                    <h3 className={`text-xl font-bold ${dk ? 'text-white' : 'text-gray-900'}`}>Security & Access</h3>
                                                    <p className="text-sm text-gray-500">Manage internal policies and external sharing.</p>
                                                </div>
                                            </div>

                                            <div className="space-y-4">
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div className={`p-4 rounded-xl border ${dk ? 'bg-[#1A1A1C] border-gray-800' : 'bg-gray-50 border-gray-200'}`}>
                                                        <div className="flex items-center justify-between">
                                                            <div>
                                                                <h4 className={`text-sm font-bold ${dk ? 'text-white' : 'text-gray-900'}`}>Enforce 2FA</h4>
                                                                <p className="text-[10px] text-gray-500 mt-1">Require two-factor auth for all users.</p>
                                                            </div>
                                                            <div
                                                                className={`w-11 h-6 rounded-full flex items-center p-1 cursor-pointer transition-colors ${workspaceSettings?.require2FA ? 'bg-emerald-500' : 'bg-gray-300 dark:bg-gray-700'}`}
                                                                onClick={() => handleUpdate({ require2FA: !workspaceSettings?.require2FA })}
                                                            >
                                                                <div className={`w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${workspaceSettings?.require2FA ? 'translate-x-5' : 'translate-x-0'}`} />
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className={`p-4 rounded-xl border ${dk ? 'bg-[#1A1A1C] border-gray-800' : 'bg-gray-50 border-gray-200'}`}>
                                                        <div className="flex items-center justify-between">
                                                            <div>
                                                                <h4 className={`text-sm font-bold ${dk ? 'text-white' : 'text-gray-900'}`}>Enforce SSO</h4>
                                                                <p className="text-[10px] text-gray-500 mt-1">Force Single Sign-On (SAML/OIDC).</p>
                                                            </div>
                                                            <div
                                                                className={`w-11 h-6 rounded-full flex items-center p-1 cursor-pointer transition-colors ${workspaceSettings?.enforceSSO ? 'bg-emerald-500' : 'bg-gray-300 dark:bg-gray-700'}`}
                                                                onClick={() => handleUpdate({ enforceSSO: !workspaceSettings?.enforceSSO })}
                                                            >
                                                                <div className={`w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${workspaceSettings?.enforceSSO ? 'translate-x-5' : 'translate-x-0'}`} />
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-2 gap-4">
                                                    <div>
                                                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5">Session Timeout (Mins)</label>
                                                        <input
                                                            type="number"
                                                            min="15"
                                                            value={workspaceSettings?.sessionTimeoutMinutes || 120}
                                                            onChange={(e) => handleUpdate({ sessionTimeoutMinutes: parseInt(e.target.value) || 120 })}
                                                            className={`w-full rounded-xl px-4 py-2.5 text-sm outline-none transition-all ${dk ? 'bg-[#1A1A1C] border border-gray-700 text-white focus:border-indigo-500' : 'bg-gray-50 border border-gray-200 text-gray-900 focus:border-indigo-500'}`}
                                                        />
                                                    </div>
                                                    <div className="flex items-center pt-6">
                                                        <span className="text-xs text-gray-500">Inactivity before auto-logout.</span>
                                                    </div>
                                                </div>

                                                <div className="pt-4 border-t border-gray-800 dark:border-gray-800/50 space-y-4">
                                                    <h4 className={`text-sm font-bold uppercase tracking-wider text-gray-400`}>External Sharing</h4>

                                                    <div className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/20 transition-colors">
                                                        <div>
                                                            <p className={`text-sm font-medium ${dk ? 'text-gray-300' : 'text-gray-700'}`}>Allow External Collaborators</p>
                                                            <p className="text-xs text-gray-500">Invite guests to specific projects.</p>
                                                        </div>
                                                        <div
                                                            className={`w-11 h-6 rounded-full flex items-center p-1 cursor-pointer transition-colors ${workspaceSettings?.allowExternalCollaborators ? 'bg-indigo-500' : 'bg-gray-300 dark:bg-gray-700'}`}
                                                            onClick={() => handleUpdate({ allowExternalCollaborators: !workspaceSettings?.allowExternalCollaborators })}
                                                        >
                                                            <div className={`w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${workspaceSettings?.allowExternalCollaborators ? 'translate-x-5' : 'translate-x-0'}`} />
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/20 transition-colors">
                                                        <div>
                                                            <p className={`text-sm font-medium ${dk ? 'text-gray-300' : 'text-gray-700'}`}>Allow Public Project Links</p>
                                                            <p className="text-xs text-gray-500">Generate read-only shareable URLs.</p>
                                                        </div>
                                                        <div
                                                            className={`w-11 h-6 rounded-full flex items-center p-1 cursor-pointer transition-colors ${workspaceSettings?.allowPublicLinks ? 'bg-indigo-500' : 'bg-gray-300 dark:bg-gray-700'}`}
                                                            onClick={() => handleUpdate({ allowPublicLinks: !workspaceSettings?.allowPublicLinks })}
                                                        >
                                                            <div className={`w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${workspaceSettings?.allowPublicLinks ? 'translate-x-5' : 'translate-x-0'}`} />
                                                        </div>
                                                    </div>
                                                </div>

                                            </div>
                                        </div>
                                    )}

                                    {/* Analytics Tab */}
                                    {activeTab === 'analytics' && (
                                        <div className="space-y-6">
                                            <div className="flex items-center gap-3 mb-6">
                                                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-500 to-indigo-500 flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
                                                    <BarChart2 size={24} />
                                                </div>
                                                <div>
                                                    <h3 className={`text-xl font-bold ${dk ? 'text-white' : 'text-gray-900'}`}>Reporting Rules</h3>
                                                    <p className="text-sm text-gray-500">Configure how data is summarized and retained.</p>
                                                </div>
                                            </div>
                                            <div className="space-y-4">
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div>
                                                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5">Default Report Period</label>
                                                        <select
                                                            value={workspaceSettings?.defaultReportPeriod || 'week'}
                                                            onChange={(e) => handleUpdate({ defaultReportPeriod: e.target.value as any })}
                                                            className={`w-full rounded-xl px-4 py-2.5 text-sm outline-none transition-all ${dk ? 'bg-[#1A1A1C] border border-gray-700 text-white focus:border-indigo-500' : 'bg-gray-50 border border-gray-200 text-gray-900 focus:border-indigo-500'}`}
                                                        >
                                                            <option value="week">Weekly</option>
                                                            <option value="month">Monthly</option>
                                                            <option value="quarter">Quarterly</option>
                                                        </select>
                                                    </div>
                                                    <div>
                                                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5">Data Retention (Days)</label>
                                                        <input
                                                            type="number"
                                                            min="30"
                                                            value={workspaceSettings?.dataRetentionDays || 365}
                                                            onChange={(e) => handleUpdate({ dataRetentionDays: parseInt(e.target.value) || 365 })}
                                                            className={`w-full rounded-xl px-4 py-2.5 text-sm outline-none transition-all ${dk ? 'bg-[#1A1A1C] border border-gray-700 text-white focus:border-indigo-500' : 'bg-gray-50 border border-gray-200 text-gray-900 focus:border-indigo-500'}`}
                                                        />
                                                    </div>
                                                </div>

                                                <div className={`p-4 rounded-xl border mt-4 ${dk ? 'bg-[#1A1A1C] border-gray-800' : 'bg-gray-50 border-gray-200'}`}>
                                                    <div className="flex items-center justify-between">
                                                        <div>
                                                            <h4 className={`text-sm font-bold ${dk ? 'text-white' : 'text-gray-900'}`}>Auto-Generate Weekly Summaries</h4>
                                                            <p className="text-[11px] text-gray-500 mt-1">AI creates a Friday digest for all managers.</p>
                                                        </div>
                                                        <div
                                                            className={`w-11 h-6 rounded-full flex items-center p-1 cursor-pointer transition-colors ${workspaceSettings?.autoWeeklySummary ? 'bg-indigo-500' : 'bg-gray-300 dark:bg-gray-700'}`}
                                                            onClick={() => handleUpdate({ autoWeeklySummary: !workspaceSettings?.autoWeeklySummary })}
                                                        >
                                                            <div className={`w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${workspaceSettings?.autoWeeklySummary ? 'translate-x-5' : 'translate-x-0'}`} />
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Integrations Tab */}
                                    {activeTab === 'integrations' && (
                                        <div className="space-y-6">
                                            <div className="flex items-center gap-3 mb-6">
                                                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center text-white shadow-lg">
                                                    <Link2 size={24} />
                                                </div>
                                                <div>
                                                    <h3 className={`text-xl font-bold ${dk ? 'text-white' : 'text-gray-900'}`}>Integrations</h3>
                                                    <p className="text-sm text-gray-500">Connect your workspace with third-party tools.</p>
                                                </div>
                                            </div>
                                            <div className="space-y-4">
                                                <div className={`flex items-center justify-between p-4 rounded-xl border ${dk ? 'bg-[#1A1A1C] border-gray-800' : 'bg-white border-gray-200'}`}>
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-10 h-10 rounded-lg bg-[#4A154B]/10 flex items-center justify-center text-[#4A154B]">
                                                            <svg viewBox="0 0 24 24" className="w-6 h-6 fill-current"><path d="M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523A2.528 2.528 0 0 1 0 15.165a2.527 2.527 0 0 1 2.522-2.52h2.52v2.52zM6.313 15.165a2.527 2.527 0 0 1 2.521-2.52 2.527 2.527 0 0 1 2.521 2.52v6.313A2.528 2.528 0 0 1 8.834 24a2.528 2.528 0 0 1-2.521-2.522v-6.313zM8.834 5.042a2.528 2.528 0 0 1-2.521-2.52A2.528 2.528 0 0 1 8.834 0a2.528 2.528 0 0 1 2.521 2.522v2.52H8.834zM8.834 6.313a2.528 2.528 0 0 1 2.521 2.521 2.528 2.528 0 0 1-2.521 2.521H2.522A2.528 2.528 0 0 1 0 8.834a2.528 2.528 0 0 1 2.522-2.521h6.312zM18.956 8.834a2.528 2.528 0 0 1 2.522-2.521A2.528 2.528 0 0 1 24 8.834a2.528 2.528 0 0 1-2.522 2.521h-2.522v-2.521zM17.688 8.834a2.528 2.528 0 0 1-2.523 2.521 2.527 2.527 0 0 1-2.52-2.521V2.522A2.527 2.527 0 0 1 15.165 0a2.528 2.528 0 0 1 2.523 2.522v6.312zM15.165 18.956a2.528 2.528 0 0 1 2.523 2.522A2.528 2.528 0 0 1 15.165 24a2.527 2.527 0 0 1-2.523-2.522v-2.522h2.523zM15.165 17.688a2.527 2.527 0 0 1-2.523-2.523 2.526 2.526 0 0 1 2.523-2.52h6.313A2.527 2.527 0 0 1 24 15.165a2.528 2.528 0 0 1-2.522 2.523h-6.313z" /></svg>
                                                        </div>
                                                        <div>
                                                            <h4 className={`text-sm font-bold ${dk ? 'text-white' : 'text-gray-900'}`}>Slack Workspace</h4>
                                                            <p className="text-xs text-gray-500">Sync task updates and alerts.</p>
                                                        </div>
                                                    </div>
                                                    <div
                                                        className={`w-11 h-6 rounded-full flex items-center p-1 cursor-pointer transition-colors ${workspaceSettings?.slackConnected ? 'bg-[#4A154B]' : 'bg-gray-300 dark:bg-gray-700'}`}
                                                        onClick={() => handleUpdate({ slackConnected: !workspaceSettings?.slackConnected })}
                                                    >
                                                        <div className={`w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${workspaceSettings?.slackConnected ? 'translate-x-5' : 'translate-x-0'}`} />
                                                    </div>
                                                </div>

                                                <div className={`flex items-center justify-between p-4 rounded-xl border ${dk ? 'bg-[#1A1A1C] border-gray-800' : 'bg-white border-gray-200'}`}>
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-500">
                                                            <Calendar size={20} />
                                                        </div>
                                                        <div>
                                                            <h4 className={`text-sm font-bold ${dk ? 'text-white' : 'text-gray-900'}`}>Google Calendar</h4>
                                                            <p className="text-xs text-gray-500">Two-way sync timeline and time blocks.</p>
                                                        </div>
                                                    </div>
                                                    <div
                                                        className={`w-11 h-6 rounded-full flex items-center p-1 cursor-pointer transition-colors ${workspaceSettings?.googleCalendarConnected ? 'bg-blue-500' : 'bg-gray-300 dark:bg-gray-700'}`}
                                                        onClick={() => handleUpdate({ googleCalendarConnected: !workspaceSettings?.googleCalendarConnected })}
                                                    >
                                                        <div className={`w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${workspaceSettings?.googleCalendarConnected ? 'translate-x-5' : 'translate-x-0'}`} />
                                                    </div>
                                                </div>

                                                <div className="pt-4">
                                                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5">Custom Webhook URL</label>
                                                    <input
                                                        type="url"
                                                        placeholder="https://your-server.com/webhook"
                                                        value={workspaceSettings?.customWebhookUrl || ''}
                                                        onChange={(e) => handleUpdate({ customWebhookUrl: e.target.value })}
                                                        className={`w-full rounded-xl px-4 py-2.5 text-sm outline-none transition-all ${dk ? 'bg-[#1A1A1C] border border-gray-700 text-white focus:border-indigo-500' : 'bg-gray-50 border border-gray-200 text-gray-900 focus:border-indigo-500'}`}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Billing Tab */}
                                    {activeTab === 'billing' && (
                                        <div className="space-y-6">
                                            <div className="flex items-center gap-3 mb-6">
                                                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-orange-400 to-rose-400 flex items-center justify-center text-white shadow-lg shadow-rose-500/20">
                                                    <CreditCard size={24} />
                                                </div>
                                                <div>
                                                    <h3 className={`text-xl font-bold ${dk ? 'text-white' : 'text-gray-900'}`}>Billing & Plan</h3>
                                                    <p className="text-sm text-gray-500">Manage your subscription and payments.</p>
                                                </div>
                                            </div>

                                            <div className={`p-6 rounded-2xl border relative overflow-hidden ${dk ? 'bg-[#1A1A1C] border-gray-800' : 'bg-white border-gray-200 shadow-sm'}`}>
                                                <div className="absolute top-0 right-0 p-4">
                                                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-indigo-500/10 text-indigo-500 uppercase tracking-widest">Active</span>
                                                </div>
                                                <h4 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-1">Current Plan</h4>
                                                <div className="flex items-baseline gap-2 mb-4">
                                                    <span className={`text-4xl font-black ${dk ? 'text-white' : 'text-gray-900'}`}>
                                                        {workspaceSettings?.planTier === 'enterprise' ? 'Enterprise' : workspaceSettings?.planTier === 'pro' ? 'Pro Plan' : 'Free Tier'}
                                                    </span>
                                                </div>
                                                <p className={`text-sm mb-6 ${dk ? 'text-gray-400' : 'text-gray-600'}`}>
                                                    You are currently on the {workspaceSettings?.planTier} plan. Upgrading unlocks unlimited AI usage and priority support.
                                                </p>

                                                <div className="grid grid-cols-3 gap-3 mb-6">
                                                    <button
                                                        onClick={() => handleUpdate({ planTier: 'free' })}
                                                        className={`p-3 rounded-xl border text-center transition-all ${workspaceSettings?.planTier === 'free' ? 'border-indigo-500 bg-indigo-500/10 text-indigo-500' : (dk ? 'border-gray-800 hover:border-gray-700 text-gray-400' : 'border-gray-200 hover:border-gray-300 text-gray-600')}`}
                                                    >
                                                        <div className="font-bold text-sm">Free</div>
                                                    </button>
                                                    <button
                                                        onClick={() => handleUpdate({ planTier: 'pro' })}
                                                        className={`p-3 rounded-xl border text-center transition-all ${workspaceSettings?.planTier === 'pro' ? 'border-indigo-500 bg-indigo-500/10 text-indigo-500' : (dk ? 'border-gray-800 hover:border-gray-700 text-gray-400' : 'border-gray-200 hover:border-gray-300 text-gray-600')}`}
                                                    >
                                                        <div className="font-bold text-sm">Pro</div>
                                                    </button>
                                                    <button
                                                        onClick={() => handleUpdate({ planTier: 'enterprise' })}
                                                        className={`p-3 rounded-xl border text-center transition-all ${workspaceSettings?.planTier === 'enterprise' ? 'border-indigo-500 bg-indigo-500/10 text-indigo-500' : (dk ? 'border-gray-800 hover:border-gray-700 text-gray-400' : 'border-gray-200 hover:border-gray-300 text-gray-600')}`}
                                                    >
                                                        <div className="font-bold text-sm">Enterprise</div>
                                                    </button>
                                                </div>

                                                <div className={`p-4 rounded-xl flex items-center justify-between ${dk ? 'bg-[#121214]' : 'bg-gray-50'}`}>
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-6 bg-gray-200 dark:bg-gray-700 rounded text-[10px] font-bold flex items-center justify-center text-gray-500 uppercase">Visa</div>
                                                        <div>
                                                            <p className={`text-sm font-bold ${dk ? 'text-white' : 'text-gray-900'}`}>•••• 4242</p>
                                                            <p className="text-[10px] text-gray-500">Expires 12/28</p>
                                                        </div>
                                                    </div>
                                                    <button className="text-xs font-bold text-indigo-500 hover:text-indigo-400 transition-colors">Update</button>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </motion.div >
        </div >
    );
};
