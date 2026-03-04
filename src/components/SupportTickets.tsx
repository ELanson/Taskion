import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore, SupportTicket } from '../store/useAppStore';
import { Plus, X, AlertTriangle, Bug, Lightbulb, Lock, Zap, MoreHorizontal, ChevronDown, Clock, Loader2, RefreshCw } from 'lucide-react';

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
    bug: <Bug size={14} />, feature: <Lightbulb size={14} />, access: <Lock size={14} />, performance: <Zap size={14} />, other: <MoreHorizontal size={14} />,
};
const CATEGORY_COLORS: Record<string, string> = {
    bug: 'bg-rose-500/10 text-rose-400 border-rose-500/20', feature: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
    access: 'bg-amber-500/10 text-amber-400 border-amber-500/20', performance: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    other: 'bg-gray-500/10 text-gray-400 border-gray-500/20',
};
const PRIORITY_COLORS: Record<string, string> = {
    low: 'bg-gray-500/10 text-gray-400', medium: 'bg-amber-500/10 text-amber-400',
    high: 'bg-orange-500/10 text-orange-400', critical: 'bg-rose-500/10 text-rose-500 animate-pulse',
};
const STATUS_COLORS: Record<string, string> = {
    open: 'bg-sky-500/10 text-sky-400', in_progress: 'bg-amber-500/10 text-amber-400',
    resolved: 'bg-emerald-500/10 text-emerald-400', closed: 'bg-gray-500/10 text-gray-500',
};
const STATUS_LABELS: Record<string, string> = { open: 'Open', in_progress: 'In Progress', resolved: 'Resolved', closed: 'Closed' };

const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

export const SupportTickets: React.FC = () => {
    const { isDarkMode, isAdmin, userProfile, user, supportTickets, fetchSupportTickets, addSupportTicket, updateTicketStatus } = useAppStore();
    const [showForm, setShowForm] = useState(false);
    const [filterStatus, setFilterStatus] = useState<string>('all');
    const [expandedTicket, setExpandedTicket] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [form, setForm] = useState({ title: '', description: '', category: 'bug' as SupportTicket['category'], priority: 'medium' as SupportTicket['priority'] });

    const dk = isDarkMode;
    const role = isAdmin ? 'admin' : (userProfile?.global_role === 'Manager' ? 'manager' : 'contributor');

    // Fetch on mount and whenever user changes
    useEffect(() => {
        const load = async () => {
            setIsLoading(true);
            await fetchSupportTickets();
            setIsLoading(false);
        };
        load();
    }, [user?.id]);

    const visibleTickets = supportTickets.filter(t => {
        if (filterStatus !== 'all' && t.status !== filterStatus) return false;
        return true;
    });

    const handleSubmit = async () => {
        if (!form.title.trim() || isSubmitting) return;
        setIsSubmitting(true);
        try {
            await addSupportTicket({
                title: form.title,
                description: form.description,
                category: form.category,
                priority: form.priority,
                status: 'open',
                userId: user?.id || '',
                userName: userProfile?.name || 'Unknown',
            });
            setForm({ title: '', description: '', category: 'bug', priority: 'medium' });
            setShowForm(false);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Header row */}
            <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                    <h3 className={`text-lg font-black ${dk ? 'text-white' : 'text-gray-900'}`}>Support Tickets</h3>
                    <p className="text-sm text-gray-500 mt-0.5">{role === 'admin' ? 'All tickets across the organization.' : role === 'manager' ? 'Team-related tickets.' : 'Your submitted tickets.'}</p>
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={async () => { setIsLoading(true); await fetchSupportTickets(); setIsLoading(false); }}
                        className={`p-2.5 rounded-xl border text-sm transition-colors ${dk ? 'bg-[#1a1c1d] border-gray-800 text-gray-400 hover:text-white' : 'bg-white border-gray-200 text-gray-500 hover:text-gray-900'}`}
                    >
                        <RefreshCw size={15} className={isLoading ? 'animate-spin' : ''} />
                    </button>
                    <button onClick={() => setShowForm(true)} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-bold shadow-lg shadow-indigo-600/20 hover:bg-indigo-700 transition-colors">
                        <Plus size={16} /> New Ticket
                    </button>
                </div>
            </div>

            {/* Status filter chips */}
            <div className="flex flex-wrap gap-2">
                {(['all', 'open', 'in_progress', 'resolved', 'closed'] as const).map(s => {
                    const count = s === 'all' ? visibleTickets.length : visibleTickets.filter(t => t.status === s).length;
                    return (
                        <button key={s} onClick={() => setFilterStatus(s)}
                            className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-all ${filterStatus === s
                                ? 'border-indigo-500 bg-indigo-500/10 text-indigo-400'
                                : dk ? 'border-gray-800 bg-[#1a1c1d] text-gray-400 hover:border-gray-700' : 'border-gray-200 bg-gray-50 text-gray-600 hover:border-gray-300'}`}
                        >
                            {s === 'all' ? 'All' : STATUS_LABELS[s]} ({count})
                        </button>
                    );
                })}
            </div>

            {/* Loading state */}
            {isLoading ? (
                <div className={`rounded-2xl border p-12 text-center ${dk ? 'border-gray-800 bg-[#121214]' : 'border-gray-200 bg-white'}`}>
                    <Loader2 size={32} className="mx-auto animate-spin text-indigo-500 mb-3" />
                    <p className="text-sm text-gray-500">Loading tickets...</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {visibleTickets.length === 0 ? (
                        <div className={`rounded-2xl border p-12 text-center ${dk ? 'border-gray-800 bg-[#121214]' : 'border-gray-200 bg-white'}`}>
                            <AlertTriangle size={36} className="mx-auto text-gray-500 mb-3" />
                            <p className={`font-bold ${dk ? 'text-gray-300' : 'text-gray-700'}`}>No tickets found</p>
                            <p className="text-sm text-gray-500 mt-1">Create your first ticket to get support.</p>
                        </div>
                    ) : visibleTickets.map(ticket => {
                        const isOpen = expandedTicket === ticket.id;
                        return (
                            <div key={ticket.id} className={`rounded-2xl border overflow-hidden ${dk ? 'border-gray-800 bg-[#121214]' : 'border-gray-200 bg-white'}`}>
                                <button onClick={() => setExpandedTicket(isOpen ? null : ticket.id)} className="w-full p-5 flex items-start gap-4 text-left group">
                                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${CATEGORY_COLORS[ticket.category]}`}>
                                        {CATEGORY_ICONS[ticket.category]}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between gap-2">
                                            <p className={`font-bold text-sm ${dk ? 'text-white' : 'text-gray-900'}`}>{ticket.title}</p>
                                            <div className="flex items-center gap-2 shrink-0">
                                                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${PRIORITY_COLORS[ticket.priority]}`}>{ticket.priority}</span>
                                                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${STATUS_COLORS[ticket.status]}`}>{STATUS_LABELS[ticket.status]}</span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3 mt-1.5 text-[11px] text-gray-500">
                                            <span>{ticket.userName}</span>
                                            <span>·</span>
                                            <span className="flex items-center gap-1"><Clock size={10} /> {formatDate(ticket.createdAt)}</span>
                                            <span>·</span>
                                            <span className="capitalize">{ticket.category.replace('_', ' ')}</span>
                                        </div>
                                    </div>
                                    {isOpen ? <ChevronDown size={14} className="text-gray-400 mt-1 shrink-0 rotate-180 transition-transform" /> : <ChevronDown size={14} className="text-gray-600 mt-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />}
                                </button>

                                <AnimatePresence>
                                    {isOpen && (
                                        <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
                                            <div className={`px-5 pb-5 border-t ${dk ? 'border-gray-800' : 'border-gray-100'}`}>
                                                <p className={`text-sm mt-4 leading-relaxed ${dk ? 'text-gray-300' : 'text-gray-700'}`}>{ticket.description || 'No description provided.'}</p>
                                                {(isAdmin || role === 'manager') && (
                                                    <div className="flex gap-2 mt-4 flex-wrap">
                                                        <p className={`text-xs font-bold mr-1 self-center ${dk ? 'text-gray-400' : 'text-gray-600'}`}>Change status:</p>
                                                        {(['open', 'in_progress', 'resolved', 'closed'] as const).map(s => (
                                                            <button key={s} onClick={() => updateTicketStatus(ticket.id, s)}
                                                                className={`px-3 py-1 rounded-lg text-[11px] font-bold border transition-all ${ticket.status === s ? STATUS_COLORS[s] + ' border-current' : dk ? 'border-gray-700 text-gray-500 hover:border-gray-600' : 'border-gray-200 text-gray-500 hover:border-gray-300'}`}
                                                            >
                                                                {STATUS_LABELS[s]}
                                                            </button>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* New Ticket Modal */}
            <AnimatePresence>
                {showForm && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowForm(false)} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
                        <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className={`relative w-full max-w-lg rounded-3xl shadow-2xl border p-8 ${dk ? 'bg-[#1a1c1d] border-gray-800' : 'bg-white border-gray-200'}`}
                        >
                            <div className="flex items-center justify-between mb-6">
                                <h3 className={`text-xl font-black ${dk ? 'text-white' : 'text-gray-900'}`}>New Support Ticket</h3>
                                <button onClick={() => setShowForm(false)} className={`p-2 rounded-xl ${dk ? 'hover:bg-gray-800' : 'hover:bg-gray-100'} transition-colors text-gray-400`}><X size={18} /></button>
                            </div>
                            <div className="space-y-4">
                                <div>
                                    <label className={`text-xs font-bold mb-1.5 block ${dk ? 'text-gray-300' : 'text-gray-700'}`}>Title *</label>
                                    <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Brief description of the issue"
                                        className={`w-full px-4 py-3 rounded-xl border text-sm outline-none focus:ring-2 focus:ring-indigo-500/40 ${dk ? 'bg-[#121214] border-gray-700 text-white placeholder-gray-500' : 'bg-gray-50 border-gray-200 text-gray-900'}`}
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className={`text-xs font-bold mb-1.5 block ${dk ? 'text-gray-300' : 'text-gray-700'}`}>Category</label>
                                        <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value as any }))}
                                            className={`w-full px-3 py-3 rounded-xl border text-sm outline-none ${dk ? 'bg-[#121214] border-gray-700 text-white' : 'bg-gray-50 border-gray-200 text-gray-900'}`}
                                        >
                                            <option value="bug">Bug</option>
                                            <option value="feature">Feature Request</option>
                                            <option value="access">Access Issue</option>
                                            <option value="performance">Performance</option>
                                            <option value="other">Other</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className={`text-xs font-bold mb-1.5 block ${dk ? 'text-gray-300' : 'text-gray-700'}`}>Priority</label>
                                        <select value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value as any }))}
                                            className={`w-full px-3 py-3 rounded-xl border text-sm outline-none ${dk ? 'bg-[#121214] border-gray-700 text-white' : 'bg-gray-50 border-gray-200 text-gray-900'}`}
                                        >
                                            <option value="low">Low</option>
                                            <option value="medium">Medium</option>
                                            <option value="high">High</option>
                                            <option value="critical">Critical</option>
                                        </select>
                                    </div>
                                </div>
                                <div>
                                    <label className={`text-xs font-bold mb-1.5 block ${dk ? 'text-gray-300' : 'text-gray-700'}`}>Description</label>
                                    <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={4} placeholder="Describe the issue in detail..."
                                        className={`w-full px-4 py-3 rounded-xl border text-sm outline-none resize-none focus:ring-2 focus:ring-indigo-500/40 ${dk ? 'bg-[#121214] border-gray-700 text-white placeholder-gray-500' : 'bg-gray-50 border-gray-200 text-gray-900'}`}
                                    />
                                </div>
                            </div>
                            <div className="flex gap-3 mt-6">
                                <button onClick={() => setShowForm(false)} className={`flex-1 py-3 rounded-xl font-bold text-sm ${dk ? 'bg-gray-800 text-gray-300' : 'bg-gray-100 text-gray-700'} transition-colors`}>Cancel</button>
                                <button onClick={handleSubmit} disabled={!form.title.trim() || isSubmitting}
                                    className="flex-1 py-3 rounded-xl font-black text-sm bg-indigo-600 text-white shadow-lg shadow-indigo-600/20 hover:bg-indigo-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {isSubmitting ? <><Loader2 size={14} className="animate-spin" /> Submitting...</> : 'Submit Ticket'}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};
