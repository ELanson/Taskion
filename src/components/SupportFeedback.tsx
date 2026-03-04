import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAppStore, FeedbackItem } from '../store/useAppStore';
import { ThumbsUp, Lightbulb, Plus, X, Truck, Circle, FlaskConical, CheckCircle2, Loader2, RefreshCw } from 'lucide-react';

const STATUS_CONFIG = {
    planned: { label: 'Planned', icon: <Circle size={11} />, color: 'bg-sky-500/10 text-sky-400 border-sky-500/20' },
    'in-review': { label: 'In Review', icon: <FlaskConical size={11} />, color: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
    shipped: { label: 'Shipped', icon: <CheckCircle2 size={11} />, color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
    considering: { label: 'Considering', icon: <Lightbulb size={11} />, color: 'bg-purple-500/10 text-purple-400 border-purple-500/20' },
};

export const SupportFeedback: React.FC = () => {
    const { isDarkMode, isAdmin, user, feedbackItems, fetchFeedbackItems, voteFeedback, addFeedbackItem } = useAppStore();
    const [showForm, setShowForm] = useState(false);
    const [filterStatus, setFilterStatus] = useState<string>('all');
    const [isLoading, setIsLoading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [form, setForm] = useState({ title: '', description: '', category: 'Productivity' });
    const dk = isDarkMode;

    // Fetch on mount
    useEffect(() => {
        const load = async () => {
            setIsLoading(true);
            await fetchFeedbackItems();
            setIsLoading(false);
        };
        load();
    }, [user?.id]);

    const sorted = [...feedbackItems]
        .filter(f => filterStatus === 'all' || f.status === filterStatus)
        .sort((a, b) => b.votes - a.votes);

    const totalVotes = feedbackItems.reduce((acc, f) => acc + f.votes, 0);
    const topCategory = feedbackItems.reduce((acc: Record<string, number>, f) => {
        acc[f.category] = (acc[f.category] || 0) + f.votes;
        return acc;
    }, {});
    const topCategoryName = Object.entries(topCategory).sort((a, b) => b[1] - a[1])[0]?.[0] || '—';

    const handleSubmit = async () => {
        if (!form.title.trim() || isSubmitting) return;
        setIsSubmitting(true);
        try {
            await addFeedbackItem({ title: form.title, description: form.description, category: form.category, status: 'considering' });
            setForm({ title: '', description: '', category: 'Productivity' });
            setShowForm(false);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleVote = async (id: string) => {
        if (!user?.id) return;
        await voteFeedback(id, user.id);
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-start justify-between flex-wrap gap-3">
                <div>
                    <h3 className={`text-lg font-black ${dk ? 'text-white' : 'text-gray-900'}`}>Feedback & Feature Requests</h3>
                    <p className="text-sm text-gray-500 mt-0.5">Vote on features and submit your own ideas.</p>
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={async () => { setIsLoading(true); await fetchFeedbackItems(); setIsLoading(false); }}
                        className={`p-2.5 rounded-xl border text-sm transition-colors ${dk ? 'bg-[#1a1c1d] border-gray-800 text-gray-400 hover:text-white' : 'bg-white border-gray-200 text-gray-500 hover:text-gray-900'}`}
                    >
                        <RefreshCw size={15} className={isLoading ? 'animate-spin' : ''} />
                    </button>
                    <button onClick={() => setShowForm(true)} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-purple-600 text-white text-sm font-bold shadow-lg shadow-purple-600/20 hover:bg-purple-700 transition-colors">
                        <Plus size={16} /> Submit Idea
                    </button>
                </div>
            </div>

            {/* Admin Stats */}
            {isAdmin && (
                <div className="grid grid-cols-3 gap-3">
                    {[
                        { label: 'Total Votes', value: totalVotes, color: 'text-indigo-400' },
                        { label: 'Ideas Submitted', value: feedbackItems.length, color: 'text-purple-400' },
                        { label: 'Top Category', value: topCategoryName, color: 'text-emerald-400' },
                    ].map(s => (
                        <div key={s.label} className={`p-4 rounded-xl border text-center ${dk ? 'bg-[#121214] border-gray-800' : 'bg-white border-gray-200'}`}>
                            <p className={`text-xl font-black ${s.color}`}>{s.value}</p>
                            <p className="text-[10px] text-gray-500 uppercase tracking-wider mt-1">{s.label}</p>
                        </div>
                    ))}
                </div>
            )}

            {/* Roadmap strip */}
            <div className={`p-4 rounded-2xl border ${dk ? 'bg-gradient-to-r from-indigo-900/20 to-purple-900/20 border-indigo-800/30' : 'bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-200'} flex items-center gap-4`}>
                <div className="flex items-center gap-2 shrink-0">
                    <Truck size={18} className="text-indigo-400" />
                    <p className={`text-sm font-bold ${dk ? 'text-white' : 'text-gray-900'}`}>Roadmap</p>
                </div>
                <div className="flex gap-2 overflow-x-auto">
                    {feedbackItems.filter(f => f.status === 'planned' || f.status === 'in-review').slice(0, 4).map(f => (
                        <span key={f.id} className={`shrink-0 text-[10px] px-2.5 py-1 rounded-full border font-medium ${STATUS_CONFIG[f.status].color}`}>
                            {f.title.length > 30 ? f.title.slice(0, 30) + '…' : f.title}
                        </span>
                    ))}
                    {feedbackItems.filter(f => f.status === 'planned' || f.status === 'in-review').length === 0 && (
                        <span className="text-xs text-gray-500">No planned items yet</span>
                    )}
                </div>
            </div>

            {/* Filter tabs */}
            <div className="flex gap-2 flex-wrap">
                {['all', ...Object.keys(STATUS_CONFIG)].map(s => (
                    <button key={s} onClick={() => setFilterStatus(s)}
                        className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-all capitalize ${filterStatus === s
                            ? 'border-purple-500 bg-purple-500/10 text-purple-400'
                            : dk ? 'border-gray-800 bg-[#1a1c1d] text-gray-400 hover:border-gray-700' : 'border-gray-200 bg-gray-50 text-gray-600 hover:border-gray-300'}`}
                    >
                        {s === 'all' ? 'All' : STATUS_CONFIG[s as keyof typeof STATUS_CONFIG]?.label || s}
                    </button>
                ))}
            </div>

            {/* Loading */}
            {isLoading ? (
                <div className={`rounded-2xl border p-12 text-center ${dk ? 'border-gray-800 bg-[#121214]' : 'border-gray-200 bg-white'}`}>
                    <Loader2 size={32} className="mx-auto animate-spin text-purple-500 mb-3" />
                    <p className="text-sm text-gray-500">Loading ideas...</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {sorted.map((item, idx) => (
                        <motion.div key={item.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.03 }}
                            className={`flex items-center gap-4 p-4 rounded-2xl border ${dk ? 'bg-[#121214] border-gray-800' : 'bg-white border-gray-200'}`}
                        >
                            {/* Vote button */}
                            <button onClick={() => handleVote(item.id)}
                                disabled={!user?.id}
                                className={`flex flex-col items-center gap-1 w-12 shrink-0 p-2 rounded-xl border transition-all ${item.userVoted
                                    ? 'border-purple-500 bg-purple-500/10 text-purple-400'
                                    : dk ? 'border-gray-800 hover:border-gray-700 text-gray-500 hover:text-purple-400' : 'border-gray-200 hover:border-purple-400 text-gray-500 hover:text-purple-600'} disabled:opacity-50 disabled:cursor-not-allowed`}
                            >
                                <ThumbsUp size={14} />
                                <span className="text-xs font-black">{item.votes}</span>
                            </button>

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-0.5">
                                    <p className={`font-bold text-sm ${dk ? 'text-white' : 'text-gray-900'}`}>{item.title}</p>
                                    <span className={`shrink-0 text-[9px] px-1.5 py-0.5 rounded-full border font-bold flex items-center gap-1 ${STATUS_CONFIG[item.status].color}`}>
                                        {STATUS_CONFIG[item.status].icon} {STATUS_CONFIG[item.status].label}
                                    </span>
                                </div>
                                <p className={`text-xs truncate ${dk ? 'text-gray-400' : 'text-gray-500'}`}>{item.description}</p>
                                <span className={`text-[10px] mt-1 px-2 py-0.5 rounded font-medium inline-block ${dk ? 'bg-gray-800 text-gray-500' : 'bg-gray-100 text-gray-500'}`}>{item.category}</span>
                            </div>
                        </motion.div>
                    ))}
                    {sorted.length === 0 && (
                        <div className={`rounded-2xl border p-12 text-center ${dk ? 'border-gray-800 bg-[#121214]' : 'border-gray-200 bg-white'}`}>
                            <Lightbulb size={36} className="mx-auto text-gray-500 mb-3" />
                            <p className={`font-bold ${dk ? 'text-gray-300' : 'text-gray-700'}`}>No ideas yet</p>
                            <p className="text-sm text-gray-500 mt-1">Be the first to submit one.</p>
                        </div>
                    )}
                </div>
            )}

            {/* Submit Idea Modal */}
            {showForm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowForm(false)} />
                    <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                        className={`relative w-full max-w-md rounded-3xl shadow-2xl border p-8 ${dk ? 'bg-[#1a1c1d] border-gray-800' : 'bg-white border-gray-200'}`}
                    >
                        <div className="flex items-center justify-between mb-6">
                            <h3 className={`text-xl font-black ${dk ? 'text-white' : 'text-gray-900'}`}>Submit an Idea</h3>
                            <button onClick={() => setShowForm(false)} className={`p-2 rounded-xl ${dk ? 'hover:bg-gray-800' : 'hover:bg-gray-100'} text-gray-400`}><X size={18} /></button>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label className={`text-xs font-bold mb-1.5 block ${dk ? 'text-gray-300' : 'text-gray-700'}`}>Idea Title *</label>
                                <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="e.g. Dark mode for mobile app"
                                    className={`w-full px-4 py-3 rounded-xl border text-sm outline-none focus:ring-2 focus:ring-purple-500/40 ${dk ? 'bg-[#121214] border-gray-700 text-white placeholder-gray-500' : 'bg-gray-50 border-gray-200 text-gray-900'}`}
                                />
                            </div>
                            <div>
                                <label className={`text-xs font-bold mb-1.5 block ${dk ? 'text-gray-300' : 'text-gray-700'}`}>Category</label>
                                <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                                    className={`w-full px-3 py-3 rounded-xl border text-sm outline-none ${dk ? 'bg-[#121214] border-gray-700 text-white' : 'bg-gray-50 border-gray-200 text-gray-900'}`}
                                >
                                    {['Productivity', 'UI/UX', 'Integration', 'Analytics', 'AI', 'Finance', 'Other'].map(c => <option key={c}>{c}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className={`text-xs font-bold mb-1.5 block ${dk ? 'text-gray-300' : 'text-gray-700'}`}>Description</label>
                                <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={3} placeholder="Describe your idea..."
                                    className={`w-full px-4 py-3 rounded-xl border text-sm outline-none resize-none ${dk ? 'bg-[#121214] border-gray-700 text-white placeholder-gray-500' : 'bg-gray-50 border-gray-200 text-gray-900'}`}
                                />
                            </div>
                        </div>
                        <div className="flex gap-3 mt-6">
                            <button onClick={() => setShowForm(false)} className={`flex-1 py-3 rounded-xl font-bold text-sm ${dk ? 'bg-gray-800 text-gray-300' : 'bg-gray-100 text-gray-700'}`}>Cancel</button>
                            <button onClick={handleSubmit} disabled={!form.title.trim() || isSubmitting}
                                className="flex-1 py-3 rounded-xl font-black text-sm bg-purple-600 text-white shadow-lg shadow-purple-600/20 hover:bg-purple-700 disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {isSubmitting ? <><Loader2 size={14} className="animate-spin" /> Submitting...</> : 'Submit Idea'}
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </div>
    );
};
