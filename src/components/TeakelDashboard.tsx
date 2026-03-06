import React, { useState, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Search, Scan, Table, BarChart3, Settings, ArrowLeft,
    Globe, FileUp, Camera, MapPin, Phone, Mail, Link,
    User, Briefcase, Filter, ChevronRight, Download,
    Activity, Shield, Plus, Sparkles, Loader2, X,
    Trash2, CheckCircle2, AlertCircle, Eye, AlertTriangle,
    MessageSquare, ChevronUp, ChevronDown, Send, SortAsc,
    Folders, TrendingUp, Target, Clock, Zap
} from 'lucide-react';
import { useAppStore, Lead, Campaign } from '../store/useAppStore';
import { NotificationBell } from './NotificationBell';

// --- Reactive mobile breakpoint hook (mirrors Tailwind md: = 768px) ---
function useIsMobile() {
    const [isMobile, setIsMobile] = useState(() =>
        typeof window !== 'undefined' ? window.innerWidth < 768 : false
    );
    useEffect(() => {
        const handler = () => setIsMobile(window.innerWidth < 768);
        window.addEventListener('resize', handler);
        return () => window.removeEventListener('resize', handler);
    }, []);
    return isMobile;
}

// --- Shared Components ---
const TeakelSidebarItem = ({ icon: Icon, label, active, onClick, badge, isOpen }: any) => (
    <button
        onClick={onClick}
        title={!isOpen ? label : undefined}
        className={`w-full flex items-center ${isOpen ? 'justify-between px-4' : 'justify-center p-3'} py-3 rounded-xl transition-all ${active ? 'bg-[#1a1c1d] text-emerald-400 border border-emerald-500/20 shadow-lg shadow-emerald-500/5' : 'text-gray-400 hover:bg-gray-800/50 hover:text-gray-200'} group`}
    >
        <div className="flex items-center gap-3">
            <Icon size={18} className={active ? 'text-emerald-400' : 'text-gray-500 group-hover:text-gray-400'} />
            {isOpen && <span className="font-bold text-sm tracking-tight whitespace-nowrap">{label}</span>}
        </div>
        {badge && isOpen && (
            <span className="px-1.5 py-0.5 rounded-full bg-indigo-500 text-white text-[10px] font-black uppercase shrink-0">{badge}</span>
        )}
    </button>
);


// --- Pending Duplicates Module ---
const PendingDuplicates = () => {
    const { isDarkMode, pendingDuplicateReviews = [], resolveDuplicate } = useAppStore();

    if (!pendingDuplicateReviews || pendingDuplicateReviews.length === 0) return null;

    return (
        <div className={`mb-8 p-6 rounded-3xl border ${isDarkMode ? 'bg-amber-500/10 border-amber-500/20' : 'bg-amber-50 border-amber-200'}`}>
            <div className="flex items-center gap-3 mb-4">
                <AlertTriangle className="text-amber-500" size={24} />
                <h3 className={`text-lg font-black ${isDarkMode ? 'text-amber-500' : 'text-amber-700'}`}>Review Duplicate Leads ({pendingDuplicateReviews.length})</h3>
            </div>
            <div className="space-y-4">
                {pendingDuplicateReviews.map(review => (
                    <div key={review.id} className={`p-4 rounded-2xl border flex flex-col md:flex-row gap-4 items-center justify-between ${isDarkMode ? 'bg-[#1a1a1c] border-gray-800' : 'bg-white border-amber-100'}`}>
                        <div className="flex-1">
                            <p className={`font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{review.incoming.name || review.incoming.company} <span className="text-xs text-gray-400 font-normal ml-2">Potential duplicate of existing {review.original.name || review.original.company}</span></p>
                            <p className="text-sm text-gray-500">{review.incoming.email} • {review.incoming.phone}</p>
                        </div>
                        <div className="flex items-center gap-2">
                            <button onClick={() => resolveDuplicate(review.id, 'keep_original')} className="px-4 py-2 text-sm font-bold text-gray-500 hover:text-white transition-colors bg-gray-800 rounded-xl hover:bg-gray-700">Discard New</button>
                            <button onClick={() => resolveDuplicate(review.id, 'overwrite_new')} className="px-4 py-2 text-sm font-bold text-amber-500 bg-amber-500/10 hover:bg-amber-500/20 transition-colors rounded-xl border border-amber-500/20">Replace Old</button>
                            <button onClick={() => resolveDuplicate(review.id, 'merge', { phone: review.incoming.phone || review.original.phone, role: review.incoming.role || review.original.role })} className="px-4 py-2 text-sm font-bold text-white bg-amber-600 hover:bg-amber-700 transition-colors rounded-xl shadow-lg shadow-amber-900/20">Merge Sync</button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};


// --- Yuki-Search Module ---
const SUGGESTED_QUERIES = [
    'B2B SaaS founders Kenya 2025',
    'CFOs fintech startups East Africa',
    'HR directors medium enterprise Nairobi',
    'Procurement managers manufacturing',
    'Marketing leads e-commerce Africa',
];

const YukiSearch = () => {
    const isMobile = useIsMobile();
    const [showLeftPanel, setShowLeftPanel] = useState(true);
    useEffect(() => { setShowLeftPanel(!isMobile); }, [isMobile]);
    const {
        isDarkMode, yukiIsSearching, startYukiSearch, stopYukiSearch,
        yukiMaxResults, setYukiMaxResults,
        yukiStreamLeads, clearYukiStream,
        searchHistory, toggleStarSearch, clearSearchHistory,
        campaigns, activeCampaignId, setActiveCampaignId, huntStats, resetHuntStats
    } = useAppStore();
    const [query, setQuery] = useState('');
    const streamEndRef = useRef<HTMLDivElement>(null);
    const [skippedIds, setSkippedIds] = useState<Set<string>>(new Set());

    useEffect(() => {
        streamEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [yukiStreamLeads]);

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!query.trim()) return;
        clearYukiStream();
        setSkippedIds(new Set());
        await startYukiSearch(query);
    };

    const handleReRun = (q: string) => {
        setQuery(q);
        clearYukiStream();
        setSkippedIds(new Set());
        startYukiSearch(q);
    };

    const handleSkip = (id: string) => setSkippedIds(p => new Set([...p, id]));
    const visibleStream = yukiStreamLeads.filter(l => !skippedIds.has(l.id));

    const sourceColor: Record<string, string> = {
        search: 'bg-emerald-500/10 text-emerald-400',
        vision: 'bg-indigo-500/10 text-indigo-400',
        manual: 'bg-gray-500/10 text-gray-400',
        scraping: 'bg-blue-500/10 text-blue-400',
    };

    return (
        <div className="h-full flex overflow-hidden relative">
            {/* Mobile backdrop when left panel is open */}
            {showLeftPanel && isMobile && (
                <div
                    className="fixed inset-0 z-20 bg-black/60 md:hidden"
                    onClick={() => setShowLeftPanel(false)}
                />
            )}

            {/* Mobile toggle for left panel */}
            {isMobile && !showLeftPanel && (
                <button
                    onClick={() => setShowLeftPanel(true)}
                    className="absolute top-3 left-3 z-10 flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-600/90 text-white text-xs font-black shadow-xl"
                    title="Open search controls"
                >
                    <Filter size={14} /> Controls
                </button>
            )}

            {/* LEFT COLUMN: Controls + History */}
            <div className={`
                ${isMobile
                    ? `fixed inset-y-0 left-0 z-30 transition-transform duration-300 ${showLeftPanel ? 'translate-x-0' : '-translate-x-full'}`
                    : 'relative flex'
                }
                w-80 flex flex-col border-r shrink-0 ${isDarkMode ? 'bg-[#0D0D0E] border-gray-800' : 'bg-white border-gray-100'}
            `}>
                {/* Mobile close button */}
                {isMobile && (
                    <button
                        onClick={() => setShowLeftPanel(false)}
                        className="absolute top-3 right-3 z-10 p-1.5 rounded-lg text-gray-500 hover:text-white"
                    >
                        <X size={18} />
                    </button>
                )}
                {/* Header + search */}
                <div className="p-4 border-b border-gray-800/50">
                    <PendingDuplicates />
                    <div className="flex items-center gap-2 mb-3">
                        <div className="w-7 h-7 bg-emerald-500/10 rounded-lg flex items-center justify-center border border-emerald-500/20 overflow-hidden p-1 shrink-0">
                            <img src={isDarkMode ? "/TICKEL Logo 192px invert.png" : "/TICKEL Logo 192px.png"} className="w-full h-full object-contain" alt="Yuki" />
                        </div>
                        <div>
                            <h2 className={`text-sm font-black ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Yuki-Search</h2>
                            <p className="text-[10px] text-gray-500 font-medium">AI-powered lead discovery</p>
                        </div>
                    </div>
                    <form onSubmit={handleSearch}>
                        <div className={`flex items-center rounded-2xl border mb-2 ${isDarkMode ? 'bg-[#121214] border-gray-800 focus-within:border-emerald-500/40' : 'bg-gray-50 border-gray-200 focus-within:border-emerald-400'} transition-all`}>
                            <Search className="text-gray-500 ml-3 shrink-0" size={16} />
                            <input
                                type="text"
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                placeholder="Describe your ideal lead…"
                                className="flex-1 bg-transparent px-3 py-3 text-sm focus:outline-none placeholder:text-gray-600 font-medium"
                            />
                            {query && <button type="button" onClick={() => setQuery('')} className="pr-2 text-gray-600 hover:text-white"><X size={14} /></button>}
                        </div>
                        {yukiIsSearching ? (
                            <button type="button" onClick={stopYukiSearch} className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 font-bold text-xs hover:bg-red-500/20 transition-all">
                                <X size={14} /> Stop Hunt
                            </button>
                        ) : (
                            <button type="submit" disabled={!query.trim()} className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-emerald-600 text-white font-black text-xs hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-900/40 disabled:opacity-40">
                                <Sparkles size={14} /> Hunt Leads
                            </button>
                        )}
                    </form>
                </div>

                {/* Target count slider */}
                <div className={`px-4 py-3 border-b ${isDarkMode ? 'border-gray-800/50' : 'border-gray-100'}`}>
                    <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Target Count</span>
                        <span className="text-emerald-500 font-black text-sm">{yukiMaxResults}</span>
                    </div>
                    <input type="range" min="1" max="30" value={yukiMaxResults} onChange={e => setYukiMaxResults(parseInt(e.target.value))} className="w-full accent-emerald-500" />
                </div>

                {/* Suggested queries */}
                <div className={`px-4 py-3 border-b ${isDarkMode ? 'border-gray-800/50' : 'border-gray-100'}`}>
                    <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">Suggested Hunts</p>
                    <div className="space-y-1">
                        {SUGGESTED_QUERIES.map(sq => (
                            <button
                                key={sq}
                                onClick={() => setQuery(sq)}
                                className={`w-full text-left px-3 py-2 rounded-xl text-xs font-medium transition-all ${isDarkMode ? 'text-gray-400 hover:bg-gray-800 hover:text-emerald-400' : 'text-gray-600 hover:bg-emerald-50 hover:text-emerald-700'}`}
                            >
                                {sq}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Search History */}
                <div className="flex-1 overflow-y-auto">
                    <div className={`px-4 py-3 flex items-center justify-between sticky top-0 z-10 ${isDarkMode ? 'bg-[#0D0D0E]' : 'bg-white'}`}>
                        <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Search History</p>
                        {searchHistory.length > 0 && (
                            <button onClick={clearSearchHistory} className="text-[10px] text-gray-600 hover:text-red-400 font-bold transition-colors">Clear</button>
                        )}
                    </div>
                    {searchHistory.length === 0 ? (
                        <p className="px-4 text-xs text-gray-600 font-medium italic">No searches yet</p>
                    ) : (
                        <div className="px-3 space-y-1 pb-4">
                            {searchHistory.map(h => (
                                <div
                                    key={h.id}
                                    className={`group flex items-center gap-2 px-3 py-2.5 rounded-xl cursor-pointer transition-all ${isDarkMode ? 'hover:bg-gray-800/50' : 'hover:bg-gray-50'}`}
                                    onClick={() => handleReRun(h.query)}
                                >
                                    <div className="flex-1 min-w-0">
                                        <p className={`text-xs font-bold truncate ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>{h.query}</p>
                                        <div className="flex items-center gap-2 mt-0.5">
                                            <span className={`text-[10px] font-medium ${h.resultCount > 0 ? 'text-emerald-500' : 'text-gray-500'}`}>
                                                {h.resultCount} lead{h.resultCount !== 1 ? 's' : ''}
                                            </span>
                                            <span className="text-[10px] text-gray-600">
                                                {new Date(h.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                            </span>
                                        </div>
                                    </div>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); toggleStarSearch(h.id); }}
                                        className={`shrink-0 transition-colors ${h.starred ? 'text-amber-400' : 'text-gray-700 opacity-0 group-hover:opacity-100'}`}
                                        title={h.starred ? 'Unstar' : 'Star query'}
                                    >
                                        <Sparkles size={12} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Campaign selector */}
                <div className={`px-4 py-3 border-b ${isDarkMode ? 'border-gray-800/50' : 'border-gray-100'}`}>
                    <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">Active Campaign</p>
                    <select
                        value={activeCampaignId ?? ''}
                        onChange={e => setActiveCampaignId(e.target.value || null)}
                        className={`w-full text-xs font-bold rounded-xl px-3 py-2 border focus:outline-none focus:border-emerald-500/50 transition-colors ${isDarkMode ? 'bg-[#121214] border-gray-800 text-gray-300' : 'bg-gray-50 border-gray-200 text-gray-700'}`}
                    >
                        <option value="">— None —</option>
                        {campaigns.map(c => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                    </select>
                </div>

                {/* Session Stats */}
                <div className="px-4 py-3">
                    <div className="flex items-center justify-between mb-2">
                        <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Session Stats</p>
                        {huntStats.sessionSearchCount > 0 && (
                            <button onClick={resetHuntStats} className="text-[10px] text-gray-600 hover:text-red-400 font-bold transition-colors">Reset</button>
                        )}
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                        {[
                            { icon: Target, label: 'Leads Found', value: huntStats.sessionLeads, color: 'emerald' },
                            { icon: Zap, label: 'Searches', value: huntStats.sessionSearchCount, color: 'indigo' },
                            { icon: Clock, label: 'Last Run', value: huntStats.lastSearchDuration > 0 ? `${(huntStats.lastSearchDuration / 1000).toFixed(1)}s` : '—', color: 'blue' },
                            { icon: TrendingUp, label: 'Sources', value: huntStats.sourcesHit.length || '—', color: 'amber' },
                        ].map(s => (
                            <div key={s.label} className={`p-2.5 rounded-2xl border ${isDarkMode ? 'bg-[#121214] border-gray-800' : 'bg-gray-50 border-gray-100'}`}>
                                <s.icon size={12} className={`text-${s.color}-500 mb-1`} />
                                <p className={`text-sm font-black text-${s.color}-500`}>{s.value}</p>
                                <p className="text-[9px] text-gray-600 font-bold uppercase tracking-wider leading-tight">{s.label}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* RIGHT COLUMN: Live Discovery Stream */}
            <div className="flex-1 flex flex-col overflow-hidden">
                {/* Stream header */}
                <div className={`h-14 border-b flex items-center justify-between px-6 shrink-0 ${isDarkMode ? 'border-gray-800 bg-[#0A0A0B]' : 'border-gray-100 bg-gray-50'}`}>
                    <div className="flex items-center gap-3">
                        <span className={`text-[10px] font-black uppercase tracking-[0.25em] ${isDarkMode ? 'text-gray-600' : 'text-gray-400'}`}>Discovery Stream</span>
                        {yukiIsSearching && (
                            <div className="flex items-center gap-1.5">
                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                <span className="text-[10px] text-emerald-500 font-bold uppercase tracking-wider">Live</span>
                            </div>
                        )}
                        {visibleStream.length > 0 && !yukiIsSearching && (
                            <span className="text-[10px] text-gray-500 font-bold">{visibleStream.length} found</span>
                        )}
                    </div>
                    {visibleStream.length > 0 && (
                        <button
                            onClick={() => { clearYukiStream(); setSkippedIds(new Set()); }}
                            className="text-[10px] text-gray-600 hover:text-red-400 font-bold transition-colors"
                        >
                            Clear Stream
                        </button>
                    )}
                </div>

                {/* Stream body */}
                <div className="flex-1 overflow-y-auto p-6">
                    {visibleStream.length === 0 && !yukiIsSearching ? (
                        <div className="h-full flex flex-col items-center justify-center text-center">
                            <div className={`w-20 h-20 rounded-3xl flex items-center justify-center mb-6 ${isDarkMode ? 'bg-emerald-500/5 border border-emerald-500/10' : 'bg-emerald-50'}`}>
                                <Globe size={36} className="text-emerald-500/40" />
                            </div>
                            <h3 className={`text-lg font-black mb-2 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>Ready to Hunt</h3>
                            <p className="text-gray-600 text-sm font-medium max-w-xs">Leads will stream in here one-by-one as Yukime discovers them across the web.</p>
                            <div className="mt-8 grid grid-cols-2 gap-3 w-full max-w-sm">
                                {['Google Business', 'LinkedIn', 'Crunchbase', 'Industry Directories'].map(s => (
                                    <div key={s} className={`p-3 rounded-2xl border text-left ${isDarkMode ? 'border-gray-800 bg-[#121214]' : 'border-gray-100 bg-white'}`}>
                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500/30 mb-2" />
                                        <p className="text-xs font-bold text-gray-500">{s}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                            <AnimatePresence>
                                {yukiIsSearching && (
                                    <motion.div
                                        key="scanning"
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0 }}
                                        className={`p-5 rounded-3xl border flex flex-col items-center justify-center gap-3 min-h-[140px] ${isDarkMode ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-emerald-50 border-emerald-200'}`}
                                    >
                                        <Loader2 size={24} className="text-emerald-500 animate-spin" />
                                        <p className="text-xs text-emerald-500 font-black uppercase tracking-widest">Scanning…</p>
                                    </motion.div>
                                )}
                                {visibleStream.map((lead) => (
                                    <motion.div
                                        key={lead.id}
                                        initial={{ opacity: 0, y: 20, scale: 0.97 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.95 }}
                                        transition={{ duration: 0.25 }}
                                        className={`p-5 rounded-3xl border flex flex-col gap-3 group ${isDarkMode ? 'bg-[#121214] border-gray-800 hover:border-emerald-500/30' : 'bg-white border-gray-100 hover:border-emerald-300'} transition-all shadow-sm`}
                                    >
                                        <div className="flex items-start gap-3">
                                            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-black text-sm shrink-0 ${isDarkMode ? 'bg-emerald-500/10 text-emerald-400' : 'bg-emerald-50 text-emerald-600'}`}>
                                                {(lead.name || lead.company || '?').charAt(0).toUpperCase()}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className={`font-black text-sm truncate ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{lead.name || 'Unknown'}</p>
                                                <p className="text-xs text-gray-500 font-medium truncate">{lead.company}</p>
                                            </div>
                                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase shrink-0 ${sourceColor[lead.source] || 'bg-gray-500/10 text-gray-400'}`}>
                                                {lead.source}
                                            </span>
                                        </div>
                                        {(lead.role || lead.email || lead.phone) && (
                                            <div className="space-y-1.5">
                                                {lead.role && <div className="flex items-center gap-2 text-xs text-gray-500"><Briefcase size={11} className="shrink-0 text-gray-600" /><span className="truncate">{lead.role}</span></div>}
                                                {lead.email && <div className="flex items-center gap-2 text-xs text-gray-500"><Mail size={11} className="shrink-0 text-gray-600" /><span className="truncate">{lead.email}</span></div>}
                                                {lead.phone && <div className="flex items-center gap-2 text-xs text-gray-500"><Phone size={11} className="shrink-0 text-gray-600" /><span className="truncate">{lead.phone}</span></div>}
                                            </div>
                                        )}
                                        <div className="flex items-center pt-1">
                                            <span className="text-[10px] text-emerald-500 font-bold flex items-center gap-1"><CheckCircle2 size={11} /> Saved to Leads</span>
                                            <button onClick={() => handleSkip(lead.id)} className="ml-auto text-[10px] text-gray-600 hover:text-red-400 font-bold transition-colors opacity-0 group-hover:opacity-100">Dismiss</button>
                                        </div>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                            <div ref={streamEndRef} />
                        </div>
                    )}
                </div>
            </div>
        </div >
    );
};

// --- Yuki-Vision Module ---
const YukiVision = () => {
    const { isDarkMode, yukiIsScanning, startYukiVision, stopYukiVision } = useAppStore();
    const fileRef = useRef<HTMLInputElement>(null);

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            const reader = new FileReader();
            reader.onload = async (event) => {
                try {
                    const base64Str = event.target?.result as string;
                    const base64Data = base64Str.split(',')[1];
                    await startYukiVision(base64Data, file.type);
                } catch (err) {
                    console.error("Vision API processing error: ", err);
                } finally {
                    if (fileRef.current) fileRef.current.value = '';
                }
            };
            reader.onerror = (err) => {
                console.error("FileReader error: ", err);
            };
            reader.readAsDataURL(file);
        } catch (error) {
            console.error("File processing failed:", error);
        }
    };

    return (
        <div className="p-4 sm:p-8 max-w-4xl mx-auto h-full flex flex-col overflow-y-auto">
            <PendingDuplicates />
            <div className="mb-8 sm:mb-12 text-center">
                <div className="w-16 h-16 sm:w-20 sm:h-20 bg-indigo-500/10 rounded-3xl flex items-center justify-center mx-auto mb-4 sm:mb-6 border border-indigo-500/20 overflow-hidden p-4">
                    <img src={isDarkMode ? "/TICKEL Logo 192px invert.png" : "/TICKEL Logo 192px.png"} className="w-full h-full object-contain" alt="Tickel" />
                </div>
                <h2 className={`text-2xl sm:text-3xl font-black mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Yuki-Vision</h2>
                <p className="text-gray-500 font-medium text-sm">Instant lead extraction from business cards &amp; images</p>
            </div>

            <div className={`relative border-2 border-dashed rounded-3xl p-8 sm:p-16 text-center transition-all ${isDarkMode ? 'border-gray-800 hover:border-indigo-500/50 bg-[#121214]' : 'border-gray-200 hover:border-indigo-500/50 bg-white'}`}>
                <input ref={fileRef} type="file" accept="image/*,.pdf" onChange={handleFileUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" disabled={yukiIsScanning} />
                <div className="pointer-events-none">
                    {yukiIsScanning ? (
                        <>
                            <Loader2 size={48} className="text-indigo-500 animate-spin mx-auto mb-6" />
                            <h3 className={`text-xl font-black mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Analysing...</h3>
                            <p className="text-gray-500 font-medium">Gemini is reading the image and extracting contacts</p>
                        </>
                    ) : (
                        <>
                            <Camera size={48} className="text-gray-600 mx-auto mb-6" />
                            <h3 className={`text-xl font-black mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Drop a business card or badge</h3>
                            <p className="text-gray-500 font-medium mb-6">Supports JPG, PNG, WEBP, PDF</p>
                            <div className={`inline-flex items-center gap-2 px-6 py-3 rounded-2xl font-bold text-sm ${isDarkMode ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' : 'bg-indigo-50 text-indigo-600 border border-indigo-200'}`}>
                                <FileUp size={18} />
                                Choose file or drag & drop
                            </div>
                        </>
                    )}
                </div>
                {yukiIsScanning && (
                    <button
                        onClick={(e) => { e.stopPropagation(); stopYukiVision(); }}
                        className="pointer-events-auto mt-6 px-6 py-2 rounded-xl border border-red-500/20 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-colors font-bold text-sm"
                    >
                        Stop Scan
                    </button>
                )}
            </div>

            <div className={`mt-8 p-6 rounded-3xl border ${isDarkMode ? 'bg-indigo-500/5 border-indigo-500/20' : 'bg-indigo-50 border-indigo-200'}`}>
                <div className="flex items-start gap-4">
                    <Sparkles className="text-indigo-500 shrink-0 mt-1" size={20} />
                    <div>
                        <h4 className={`text-sm font-black ${isDarkMode ? 'text-white' : 'text-indigo-900'}`}>Bulk Processing Available</h4>
                        <p className="text-xs text-indigo-500 font-medium">Upload a folder of business cards and let Yukime process them in parallel.</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- Leads List Module ---
type SortField = 'name' | 'company' | 'role' | 'email' | 'source' | 'created_at';
type SortDir = 'asc' | 'desc';

const LeadsList = () => {
    const { isDarkMode, leads = [], deleteLead } = useAppStore();
    const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [sortField, setSortField] = useState<SortField>('created_at');
    const [sortDir, setSortDir] = useState<SortDir>('desc');
    const [search, setSearch] = useState('');

    const toggleSort = (field: SortField) => {
        if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
        else { setSortField(field); setSortDir('asc'); }
    };

    const filteredLeads = useMemo(() => {
        let list = [...leads];
        if (search) {
            const q = search.toLowerCase();
            list = list.filter(l =>
                l.name?.toLowerCase().includes(q) ||
                l.company?.toLowerCase().includes(q) ||
                l.role?.toLowerCase().includes(q) ||
                l.email?.toLowerCase().includes(q)
            );
        }
        list.sort((a, b) => {
            const av = (a[sortField] || '').toString().toLowerCase();
            const bv = (b[sortField] || '').toString().toLowerCase();
            return sortDir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av);
        });
        return list;
    }, [leads, search, sortField, sortDir]);

    const allSelected = filteredLeads.length > 0 && filteredLeads.every(l => selectedIds.has(l.id));
    const toggleAll = () => {
        if (allSelected) setSelectedIds(new Set());
        else setSelectedIds(new Set(filteredLeads.map(l => l.id)));
    };
    const toggleOne = (id: string) => {
        setSelectedIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id); else next.add(id);
            return next;
        });
    };

    const handleBatchDelete = () => {
        selectedIds.forEach(id => deleteLead(id));
        setSelectedIds(new Set());
        setSelectedLead(null);
    };

    const exportCSV = (rows: Lead[]) => {
        const headers = ['Name', 'Company', 'Role', 'Email', 'Phone', 'Website', 'Address', 'Source'];
        const csv = [
            headers.join(','),
            ...rows.map(l => [l.name, l.company, l.role, l.email, l.phone, l.website, l.address, l.source].map(v => `"${(v || '').replace(/"/g, '""')}"`).join(','))
        ].join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a'); a.href = url; a.download = 'teakel-leads.csv'; a.click();
    };

    const SortTh = ({ field, label }: { field: SortField; label: string }) => (
        <th
            className="px-4 py-4 text-[10px] font-black text-gray-500 uppercase tracking-widest cursor-pointer hover:text-emerald-400 transition-colors select-none"
            onClick={() => toggleSort(field)}
        >
            <div className="flex items-center gap-1">
                {label}
                {sortField === field ? (
                    sortDir === 'asc' ? <ChevronUp size={12} className="text-emerald-500" /> : <ChevronDown size={12} className="text-emerald-500" />
                ) : <SortAsc size={10} className="opacity-30" />}
            </div>
        </th>
    );

    return (
        <div className="h-full flex flex-col overflow-hidden">
            {/* Toolbar */}
            <div className="px-4 sm:px-8 pt-4 sm:pt-6 pb-3 flex flex-col gap-3 shrink-0">
                <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0">
                        <h2 className={`text-xl sm:text-2xl font-black truncate ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Leads Repository</h2>
                        <p className="text-gray-500 text-xs sm:text-sm font-medium">{leads.length} total · {filteredLeads.length} shown</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                        {selectedIds.size > 0 && (
                            <>
                                <button
                                    onClick={() => exportCSV(filteredLeads.filter(l => selectedIds.has(l.id)))}
                                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 font-bold text-xs hover:bg-emerald-500/20 transition-all"
                                >
                                    <Download size={13} /> {selectedIds.size}
                                </button>
                                <button
                                    onClick={handleBatchDelete}
                                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-red-500/30 bg-red-500/10 text-red-400 font-bold text-xs hover:bg-red-500/20 transition-all"
                                >
                                    <Trash2 size={13} /> {selectedIds.size}
                                </button>
                            </>
                        )}
                        <button
                            onClick={() => exportCSV(filteredLeads)}
                            className={`p-2 rounded-xl border ${isDarkMode ? 'border-gray-800 bg-gray-800/30 text-gray-400 hover:text-white' : 'border-gray-200 bg-white text-gray-500 hover:text-gray-900'} transition-all`}
                            title="Export all as CSV"
                        >
                            <Download size={16} />
                        </button>
                        <button className="bg-emerald-600 text-white px-3 sm:px-5 py-2 sm:py-2.5 rounded-xl font-bold flex items-center gap-1.5 hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-900/40 text-xs sm:text-sm">
                            <Plus size={15} /> <span className="hidden sm:inline">New Lead</span>
                        </button>
                    </div>
                </div>
                <div className={`relative flex items-center rounded-xl border ${isDarkMode ? 'bg-[#121214] border-gray-800' : 'bg-white border-gray-200'}`}>
                    <Search size={16} className="absolute left-3 text-gray-500" />
                    <input
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="Search by name, company, role, email…"
                        className="w-full bg-transparent pl-9 pr-4 py-2.5 text-sm focus:outline-none placeholder:text-gray-600 font-medium"
                    />
                    {search && <button onClick={() => setSearch('')} className="pr-3 text-gray-500 hover:text-white"><X size={14} /></button>}
                </div>
            </div>

            <div className="flex-1 flex overflow-hidden">
                <div className="flex-1 overflow-y-auto px-4 sm:px-8 pb-8">
                    <div className={`rounded-3xl border overflow-hidden overflow-x-auto ${isDarkMode ? 'bg-[#121214] border-gray-800 shadow-2xl shadow-black/40' : 'bg-white border-gray-200 shadow-xl shadow-black/5'}`}>
                        <table className="min-w-[640px] w-full text-left border-collapse">
                            <thead>
                                <tr className={`border-b ${isDarkMode ? 'border-gray-800' : 'border-gray-100'}`}>
                                    <th className="pl-5 py-4 w-8">
                                        <input
                                            type="checkbox"
                                            checked={allSelected}
                                            onChange={toggleAll}
                                            className="accent-emerald-500 w-4 h-4 cursor-pointer"
                                        />
                                    </th>
                                    <SortTh field="name" label="Name" />
                                    <SortTh field="company" label="Company" />
                                    <SortTh field="role" label="Role" />
                                    <SortTh field="email" label="Email" />
                                    <SortTh field="source" label="Source" />
                                    <SortTh field="created_at" label="Added" />
                                    <th className="px-4 py-4 w-10"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-800/20">
                                {filteredLeads.length === 0 ? (
                                    <tr>
                                        <td colSpan={8} className="px-6 py-12 text-center text-gray-500 font-bold italic">
                                            {search ? `No leads match "${search}"` : 'No leads found. Start hunting or scanning!'}
                                        </td>
                                    </tr>
                                ) : (
                                    filteredLeads.map((lead) => (
                                        <tr
                                            key={lead.id}
                                            onClick={() => setSelectedLead(lead)}
                                            className={`group cursor-pointer transition-colors ${selectedIds.has(lead.id) ? (isDarkMode ? 'bg-emerald-500/10' : 'bg-emerald-50') :
                                                selectedLead?.id === lead.id ? (isDarkMode ? 'bg-gray-800/40' : 'bg-gray-50') :
                                                    (isDarkMode ? 'hover:bg-gray-800/20' : 'hover:bg-gray-50')
                                                }`}
                                        >
                                            <td className="pl-5 py-4" onClick={e => { e.stopPropagation(); toggleOne(lead.id); }}>
                                                <input type="checkbox" checked={selectedIds.has(lead.id)} onChange={() => toggleOne(lead.id)} className="accent-emerald-500 w-4 h-4 cursor-pointer" />
                                            </td>
                                            <td className="px-4 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs ${isDarkMode ? 'bg-gray-800 text-emerald-400' : 'bg-emerald-50 text-emerald-600'}`}>
                                                        {(lead.name || '?').charAt(0)}
                                                    </div>
                                                    <span className={`text-sm font-bold ${isDarkMode ? 'text-gray-200' : 'text-gray-900'}`}>{lead.name}</span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-4 text-xs font-bold text-gray-500">{lead.company}</td>
                                            <td className="px-4 py-4 text-xs font-bold text-gray-500">{lead.role || <span className="text-gray-700 italic">—</span>}</td>
                                            <td className="px-4 py-4 text-xs font-bold text-gray-500">{lead.email}</td>
                                            <td className="px-4 py-4">
                                                <span className={`px-2 py-1 rounded-full text-[9px] font-black uppercase ${lead.source === 'vision' ? 'bg-indigo-500/10 text-indigo-400' : 'bg-emerald-500/10 text-emerald-400'}`}>
                                                    {lead.source}
                                                </span>
                                            </td>
                                            <td className="px-4 py-4 text-xs text-gray-600 font-medium">
                                                {new Date(lead.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: '2-digit' })}
                                            </td>
                                            <td className="px-4 py-4">
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); deleteLead(lead.id); }}
                                                    className="p-1.5 rounded-lg text-gray-600 hover:text-red-500 hover:bg-red-500/10 transition-colors"
                                                    title="Delete lead"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                <AnimatePresence>
                    {selectedLead && (
                        <motion.div
                            initial={{ x: 400, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            exit={{ x: 400, opacity: 0 }}
                            className={`w-full sm:w-96 border-t sm:border-t-0 sm:border-l flex flex-col shrink-0 absolute sm:relative bottom-0 inset-x-0 sm:inset-auto z-20 sm:z-auto max-h-[60vh] sm:max-h-full ${isDarkMode ? 'bg-[#0D0D0E] border-gray-800' : 'bg-gray-50 border-gray-200'} shadow-2xl`}
                        >
                            <div className={`p-6 border-b flex items-center justify-between ${isDarkMode ? 'border-gray-800' : 'border-gray-200'}`}>
                                <h4 className={`font-black uppercase tracking-widest text-xs ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Lead Details</h4>
                                <button onClick={() => setSelectedLead(null)} className="p-1.5 hover:bg-gray-800 rounded-lg text-gray-500"><X size={18} /></button>
                            </div>
                            <div className="p-8 space-y-8 overflow-y-auto">
                                <div className="flex flex-col items-center text-center">
                                    <div className={`w-20 h-20 rounded-3xl mb-4 flex items-center justify-center text-2xl font-black ${isDarkMode ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-emerald-50 text-emerald-600'}`}>
                                        {(selectedLead.name || '?').charAt(0)}
                                    </div>
                                    <h3 className={`text-xl font-black ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{selectedLead.name}</h3>
                                    <p className="text-emerald-500 text-xs font-black uppercase tracking-widest mt-1">{selectedLead.role}</p>
                                </div>
                                <div className="space-y-4">
                                    <DetailItem icon={Briefcase} label="Company" value={selectedLead.company} isDarkMode={isDarkMode} />
                                    <DetailItem icon={Mail} label="Email" value={selectedLead.email} isDarkMode={isDarkMode} />
                                    <DetailItem icon={Phone} label="Phone" value={selectedLead.phone} isDarkMode={isDarkMode} />
                                    <DetailItem icon={Link} label="Website" value={selectedLead.website} isDarkMode={isDarkMode} />
                                    <DetailItem icon={MapPin} label="Location" value={selectedLead.address} isDarkMode={isDarkMode} />
                                </div>
                                <div className="grid grid-cols-2 gap-3 pt-4">
                                    <button className="flex-1 bg-emerald-600 text-white py-3 rounded-2xl font-bold text-xs hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-900/40">Send Email</button>
                                    <button className={`flex-1 py-3 rounded-2xl font-bold text-xs border ${isDarkMode ? 'border-gray-800 text-gray-300 hover:bg-gray-800' : 'border-gray-200 text-gray-700 hover:bg-gray-100'} transition-all`}>Export vCard</button>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

const DetailItem = ({ icon: Icon, label, value, isDarkMode }: any) => (
    <div className={`p-4 rounded-2xl border ${isDarkMode ? 'bg-gray-800/30 border-gray-800' : 'bg-white border-gray-100'}`}>
        <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">{label}</p>
        <div className="flex items-center gap-2">
            <Icon size={14} className="text-emerald-500" />
            <p className={`text-sm font-bold ${isDarkMode ? 'text-gray-200' : 'text-gray-900'}`}>{value || 'Not provided'}</p>
        </div>
    </div>
);

const SettingsToggle = ({ label, description, checked, isDarkMode }: any) => (
    <div className={`p-6 rounded-3xl border flex items-center justify-between ${isDarkMode ? 'bg-[#121214] border-gray-800' : 'bg-white border-gray-100 shadow-sm'}`}>
        <div>
            <h4 className={`text-sm font-black ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{label}</h4>
            <p className="text-xs text-gray-500 font-medium mt-1">{description}</p>
        </div>
        <div className={`w-12 h-6 rounded-full p-1 transition-all ${checked ? 'bg-emerald-600' : 'bg-gray-700'}`}>
            <div className={`w-4 h-4 rounded-full bg-white shadow-md transform transition-transform ${checked ? 'translate-x-6' : 'translate-x-0'}`} />
        </div>
    </div>
);

// --- Campaign Manager ---
const CAMPAIGN_COLORS = [
    { name: 'emerald', bg: 'bg-emerald-500', text: 'text-emerald-400', border: 'border-emerald-500/30', glow: 'shadow-emerald-500/10' },
    { name: 'indigo', bg: 'bg-indigo-500', text: 'text-indigo-400', border: 'border-indigo-500/30', glow: 'shadow-indigo-500/10' },
    { name: 'amber', bg: 'bg-amber-500', text: 'text-amber-400', border: 'border-amber-500/30', glow: 'shadow-amber-500/10' },
    { name: 'rose', bg: 'bg-rose-500', text: 'text-rose-400', border: 'border-rose-500/30', glow: 'shadow-rose-500/10' },
    { name: 'sky', bg: 'bg-sky-500', text: 'text-sky-400', border: 'border-sky-500/30', glow: 'shadow-sky-500/10' },
    { name: 'violet', bg: 'bg-violet-500', text: 'text-violet-400', border: 'border-violet-500/30', glow: 'shadow-violet-500/10' },
];

const CampaignManager = () => {
    const { isDarkMode, campaigns, activeCampaignId, setActiveCampaignId, createCampaign, deleteCampaign, searchHistory, leads } = useAppStore();
    const [creating, setCreating] = useState(false);
    const [newName, setNewName] = useState('');
    const [newDesc, setNewDesc] = useState('');
    const [newColor, setNewColor] = useState('emerald');
    const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);

    const handleCreate = () => {
        if (!newName.trim()) return;
        createCampaign(newName.trim(), newDesc.trim(), newColor);
        setNewName('');
        setNewDesc('');
        setNewColor('emerald');
        setCreating(false);
    };

    const getColorMeta = (color: string) => CAMPAIGN_COLORS.find(c => c.name === color) || CAMPAIGN_COLORS[0];

    // If a campaign is selected, show its detail view
    if (selectedCampaign) {
        const campaign = campaigns.find(c => c.id === selectedCampaign.id);
        if (!campaign) { setSelectedCampaign(null); return null; }
        const cm = getColorMeta(campaign.color);
        const campaignSearches = searchHistory.filter(h => h.campaignId === campaign.id);
        const campaignLeads = leads.filter(l =>
            campaignSearches.some(s => {
                const sTime = s.timestamp;
                const lTime = new Date(l.created_at).getTime();
                return Math.abs(lTime - sTime) < 60_000 * 30; // within 30 min window
            })
        );

        return (
            <div className="h-full overflow-y-auto p-8">
                <div className="max-w-4xl mx-auto space-y-8">
                    <div className="flex items-center gap-4">
                        <button onClick={() => setSelectedCampaign(null)} className="p-2 rounded-xl hover:bg-gray-800/50 text-gray-500 hover:text-white transition-colors"><ArrowLeft size={18} /></button>
                        <div className={`w-10 h-10 rounded-2xl ${cm.bg} flex items-center justify-center shadow-lg ${cm.glow}`}>
                            <Target size={18} className="text-white" />
                        </div>
                        <div>
                            <h2 className={`text-xl font-black ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{campaign.name}</h2>
                            {campaign.description && <p className="text-xs text-gray-500 font-medium">{campaign.description}</p>}
                        </div>
                        <button
                            onClick={() => { setActiveCampaignId(activeCampaignId === campaign.id ? null : campaign.id); }}
                            className={`ml-auto px-4 py-2 rounded-xl text-xs font-black transition-all ${activeCampaignId === campaign.id ? `${cm.bg} text-white` : `border ${cm.border} ${cm.text} hover:bg-gray-800/50`}`}
                        >
                            {activeCampaignId === campaign.id ? '✓ Active Campaign' : 'Set as Active'}
                        </button>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-3 gap-4">
                        {[
                            { label: 'Search Runs', value: campaignSearches.length },
                            { label: 'Leads Collected', value: campaign.leadCount },
                            { label: 'Started', value: new Date(campaign.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) },
                        ].map(s => (
                            <div key={s.label} className={`p-5 rounded-3xl border ${isDarkMode ? 'bg-[#121214] border-gray-800' : 'bg-white border-gray-100 shadow-sm'}`}>
                                <p className="text-xs font-black text-gray-500 uppercase tracking-widest mb-1">{s.label}</p>
                                <p className={`text-2xl font-black ${cm.text}`}>{s.value}</p>
                            </div>
                        ))}
                    </div>

                    {/* Search history for this campaign */}
                    <div className={`p-6 rounded-3xl border ${isDarkMode ? 'bg-[#121214] border-gray-800' : 'bg-white border-gray-100 shadow-sm'}`}>
                        <h3 className={`text-sm font-black uppercase tracking-widest mb-5 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Search Runs</h3>
                        {campaignSearches.length === 0 ? (
                            <p className="text-gray-500 text-sm italic">No searches linked yet — set this campaign as active and run a hunt.</p>
                        ) : (
                            <div className="space-y-2">
                                {campaignSearches.map(h => (
                                    <div key={h.id} className={`flex items-center gap-3 px-4 py-3 rounded-2xl ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
                                        <Search size={14} className={cm.text} />
                                        <span className={`flex-1 text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>{h.query}</span>
                                        <span className={`text-xs font-black ${h.resultCount > 0 ? 'text-emerald-500' : 'text-gray-500'}`}>{h.resultCount} leads</span>
                                        <span className="text-[10px] text-gray-600">{new Date(h.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="h-full overflow-y-auto p-8">
            <div className="max-w-5xl mx-auto space-y-8">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className={`text-2xl font-black mb-1 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Campaigns</h2>
                        <p className="text-gray-500 text-sm font-medium">Group your search hunts into focused outreach campaigns</p>
                    </div>
                    <button
                        onClick={() => setCreating(true)}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 text-white font-black text-sm hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-900/30"
                    >
                        <Plus size={16} /> New Campaign
                    </button>
                </div>

                {/* Create form */}
                <AnimatePresence>
                    {creating && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className={`p-6 rounded-3xl border ${isDarkMode ? 'bg-[#121214] border-gray-800' : 'bg-white border-gray-200 shadow-sm'}`}
                        >
                            <h3 className={`text-sm font-black uppercase tracking-widest mb-5 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Create Campaign</h3>
                            <div className="space-y-4">
                                <input
                                    value={newName}
                                    onChange={e => setNewName(e.target.value)}
                                    placeholder="Campaign name (e.g. Q2 Fintech Outreach)"
                                    className={`w-full text-sm font-medium rounded-2xl px-4 py-3 border focus:outline-none focus:border-emerald-500/50 ${isDarkMode ? 'bg-[#0D0D0E] border-gray-800 text-white placeholder:text-gray-600' : 'bg-gray-50 border-gray-200 text-gray-900 placeholder:text-gray-400'}`}
                                    autoFocus
                                />
                                <input
                                    value={newDesc}
                                    onChange={e => setNewDesc(e.target.value)}
                                    placeholder="Brief description (optional)"
                                    className={`w-full text-sm font-medium rounded-2xl px-4 py-3 border focus:outline-none focus:border-emerald-500/50 ${isDarkMode ? 'bg-[#0D0D0E] border-gray-800 text-white placeholder:text-gray-600' : 'bg-gray-50 border-gray-200 text-gray-900 placeholder:text-gray-400'}`}
                                />
                                <div>
                                    <p className="text-xs font-black text-gray-500 uppercase tracking-widest mb-3">Color</p>
                                    <div className="flex gap-2">
                                        {CAMPAIGN_COLORS.map(c => (
                                            <button
                                                key={c.name}
                                                onClick={() => setNewColor(c.name)}
                                                className={`w-7 h-7 rounded-full ${c.bg} transition-all ${newColor === c.name ? 'ring-2 ring-white ring-offset-2 ring-offset-black scale-110' : 'opacity-50 hover:opacity-100'}`}
                                            />
                                        ))}
                                    </div>
                                </div>
                                <div className="flex gap-3 pt-2">
                                    <button onClick={handleCreate} disabled={!newName.trim()} className="px-6 py-2.5 rounded-xl bg-emerald-600 text-white font-black text-sm hover:bg-emerald-700 disabled:opacity-40 transition-all">Create</button>
                                    <button onClick={() => setCreating(false)} className="px-6 py-2.5 rounded-xl border border-gray-700 text-gray-400 font-bold text-sm hover:text-white transition-all">Cancel</button>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Active campaign callout */}
                {activeCampaignId && (() => {
                    const ac = campaigns.find(c => c.id === activeCampaignId);
                    const acm = ac ? getColorMeta(ac.color) : null;
                    return ac && acm ? (
                        <div className={`flex items-center gap-3 px-5 py-3 rounded-2xl border ${acm.border} ${isDarkMode ? 'bg-[#121214]' : 'bg-white'}`}>
                            <div className={`w-2 h-2 rounded-full animate-pulse ${acm.bg}`} />
                            <span className={`text-sm font-black ${acm.text}`}>Active: {ac.name}</span>
                            <span className="text-xs text-gray-500 font-medium">New searches will be logged to this campaign</span>
                            <button onClick={() => setActiveCampaignId(null)} className="ml-auto text-xs text-gray-600 hover:text-red-400 font-bold"><X size={14} /></button>
                        </div>
                    ) : null;
                })()}

                {/* Campaign grid */}
                {campaigns.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-24 text-center">
                        <div className={`w-20 h-20 rounded-3xl flex items-center justify-center mb-6 ${isDarkMode ? 'bg-emerald-500/5 border border-emerald-500/10' : 'bg-emerald-50'}`}>
                            <Folders size={36} className="text-emerald-500/40" />
                        </div>
                        <h3 className={`text-lg font-black mb-2 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>No campaigns yet</h3>
                        <p className="text-gray-600 text-sm font-medium max-w-xs">Create a campaign to organize your search hunts by goal — e.g., "Q2 HR Directors" or "Fintech Expansion East Africa".</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                        <AnimatePresence>
                            {campaigns.map(campaign => {
                                const cm = getColorMeta(campaign.color);
                                return (
                                    <motion.div
                                        key={campaign.id}
                                        initial={{ opacity: 0, y: 16 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.95 }}
                                        onClick={() => setSelectedCampaign(campaign)}
                                        className={`p-6 rounded-3xl border cursor-pointer group transition-all hover:-translate-y-1 shadow-sm ${isDarkMode ? `bg-[#121214] border-gray-800 hover:${cm.border}` : `bg-white border-gray-100 hover:border-gray-200 hover:shadow-md`} ${activeCampaignId === campaign.id ? `ring-1 ring-${campaign.color}-500/40` : ''}`}
                                    >
                                        <div className="flex items-start justify-between mb-5">
                                            <div className={`w-11 h-11 rounded-2xl ${cm.bg} flex items-center justify-center shadow-lg shadow-${campaign.color}-500/20`}>
                                                <Target size={20} className="text-white" />
                                            </div>
                                            <div className="flex items-center gap-2">
                                                {activeCampaignId === campaign.id && (
                                                    <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${cm.bg} text-white`}>Active</span>
                                                )}
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); deleteCampaign(campaign.id); }}
                                                    className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-red-500/10 text-gray-600 hover:text-red-400 transition-all"
                                                >
                                                    <Trash2 size={13} />
                                                </button>
                                            </div>
                                        </div>
                                        <h3 className={`font-black text-base mb-1 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{campaign.name}</h3>
                                        {campaign.description && <p className="text-xs text-gray-500 font-medium mb-4 leading-relaxed">{campaign.description}</p>}
                                        <div className="flex items-center gap-4 mt-4">
                                            <div>
                                                <p className={`text-lg font-black ${cm.text}`}>{campaign.leadCount}</p>
                                                <p className="text-[9px] text-gray-600 font-black uppercase tracking-wider">Leads</p>
                                            </div>
                                            <div>
                                                <p className={`text-lg font-black ${cm.text}`}>{campaign.searchIds.length}</p>
                                                <p className="text-[9px] text-gray-600 font-black uppercase tracking-wider">Searches</p>
                                            </div>
                                            <div className="ml-auto">
                                                <p className="text-[10px] text-gray-600 font-medium">{new Date(campaign.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</p>
                                            </div>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </AnimatePresence>
                    </div>
                )}
            </div>
        </div>
    );
};

// --- Reports Module with Yukime Chat ---
const ReportsModule = () => {
    const { isDarkMode, leads = [] } = useAppStore();
    const isMobile = useIsMobile();
    const [chatOpen, setChatOpen] = useState(true);
    useEffect(() => { if (isMobile) setChatOpen(false); }, [isMobile]);
    const [messages, setMessages] = useState<{ role: 'user' | 'yukime'; text: string }[]>([
        { role: 'yukime', text: 'Hi! I\'m Yukime 2.5 ✨ Ask me anything about your leads data — source breakdowns, top companies, conversion tips, or export suggestions.' }
    ]);
    const [input, setInput] = useState('');
    const [thinking, setThinking] = useState(false);
    const chatBottom = useRef<HTMLDivElement>(null);

    useEffect(() => {
        chatBottom.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const sendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || thinking) return;
        const userMsg = input.trim();
        setInput('');
        setMessages(m => [...m, { role: 'user', text: userMsg }]);
        setThinking(true);

        // Build context summary from leads
        const leadSummary = leads.length === 0
            ? 'No leads collected yet.'
            : `${leads.length} total leads. Sources: ${[...new Set(leads.map(l => l.source))].join(', ')}. Top companies: ${[...new Set(leads.map(l => l.company).filter(Boolean))].slice(0, 5).join(', ')}.`;

        try {
            const res = await fetch('/api/teakel-search', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    query: `You are Yukime, an expert sales intelligence assistant inside the Teakel dashboard. Leads context: ${leadSummary}. User question: ${userMsg}`,
                    maxResults: 0,
                    chatMode: true
                })
            });
            const data = await res.json();
            const reply = data.answer || data.message || 'I\'m still learning! I couldn\'t formulate a response right now.';
            setMessages(m => [...m, { role: 'yukime', text: reply }]);
        } catch {
            setMessages(m => [...m, { role: 'yukime', text: 'Connection issue — please check the API server is running.' }]);
        } finally {
            setThinking(false);
        }
    };

    // Compute stats
    const sourceBreakdown = leads.reduce((acc, l) => {
        acc[l.source] = (acc[l.source] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);
    const topCompanies = Object.entries(
        leads.reduce((acc, l) => { if (l.company) acc[l.company] = (acc[l.company] || 0) + 1; return acc; }, {} as Record<string, number>)
    ).sort((a, b) => b[1] - a[1]).slice(0, 5);

    return (
        <div className="h-full flex flex-col sm:flex-row overflow-hidden">
            {/* Reports Content */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-8">
                <div className="max-w-4xl mx-auto space-y-6 sm:space-y-8">
                    <div className="flex items-start justify-between gap-3">
                        <div>
                            <h2 className={`text-xl sm:text-2xl font-black mb-1 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Intelligence Reports</h2>
                            <p className="text-gray-500 text-sm font-medium">Overview of your lead collection activity</p>
                        </div>
                        {/* Mobile chat toggle in header */}
                        <button
                            onClick={() => setChatOpen(!chatOpen)}
                            className={`sm:hidden flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-black border transition-colors shrink-0 ${chatOpen ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : (isDarkMode ? 'border-gray-800 text-gray-500' : 'border-gray-200 text-gray-600')
                                }`}
                        >
                            <MessageSquare size={14} />
                            {chatOpen ? 'Hide AI' : 'Ask AI'}
                        </button>
                    </div>

                    {/* Mobile chat panel (stacks below header on mobile) */}
                    <AnimatePresence>
                        {chatOpen && isMobile && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className={`rounded-3xl border overflow-hidden flex flex-col ${isDarkMode ? 'bg-[#0D0D0E] border-gray-800' : 'bg-white border-gray-200'}`}
                                style={{ maxHeight: 320 }}
                            >
                                <div className="flex-1 overflow-y-auto p-3 space-y-2">
                                    {messages.map((msg, i) => (
                                        <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                            <div className={`max-w-[85%] px-3 py-2 rounded-2xl text-xs font-medium leading-relaxed ${msg.role === 'user' ? 'bg-emerald-600 text-white rounded-br-sm' : isDarkMode ? 'bg-gray-800 text-gray-200 rounded-bl-sm' : 'bg-gray-100 text-gray-800 rounded-bl-sm'}`}>
                                                {msg.text}
                                            </div>
                                        </div>
                                    ))}
                                    {thinking && (
                                        <div className="flex justify-start">
                                            <div className={`px-3 py-2 rounded-2xl rounded-bl-sm flex gap-1 items-center ${isDarkMode ? 'bg-gray-800' : 'bg-gray-100'}`}>
                                                <div className="w-1 h-1 rounded-full bg-emerald-500 animate-bounce" style={{ animationDelay: '0ms' }} />
                                                <div className="w-1 h-1 rounded-full bg-emerald-500 animate-bounce" style={{ animationDelay: '150ms' }} />
                                                <div className="w-1 h-1 rounded-full bg-emerald-500 animate-bounce" style={{ animationDelay: '300ms' }} />
                                            </div>
                                        </div>
                                    )}
                                </div>
                                <form onSubmit={sendMessage} className={`p-2 border-t flex items-center gap-2 shrink-0 ${isDarkMode ? 'border-gray-800' : 'border-gray-100'}`}>
                                    <input
                                        value={input}
                                        onChange={e => setInput(e.target.value)}
                                        placeholder="Ask about your leads…"
                                        className={`flex-1 bg-transparent text-xs focus:outline-none placeholder:text-gray-600 font-medium px-3 py-2 rounded-xl border ${isDarkMode ? 'border-gray-800' : 'border-gray-200'}`}
                                        disabled={thinking}
                                    />
                                    <button type="submit" disabled={!input.trim() || thinking} className="p-2 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 transition-all disabled:opacity-40 shrink-0">
                                        <Send size={14} />
                                    </button>
                                </form>
                            </motion.div>
                        )}
                    </AnimatePresence>


                    {/* Stats row */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {[
                            { label: 'Total Leads', value: leads.length, color: 'emerald' },
                            { label: 'Web Scraped', value: leads.filter(l => l.source === 'search' || l.source === 'scraping').length, color: 'blue' },
                            { label: 'Vision Scanned', value: leads.filter(l => l.source === 'vision').length, color: 'indigo' },
                            { label: 'Manual', value: leads.filter(l => l.source === 'manual').length, color: 'amber' },
                        ].map(stat => (
                            <div key={stat.label} className={`p-5 rounded-3xl border ${isDarkMode ? 'bg-[#121214] border-gray-800' : 'bg-white border-gray-200 shadow-sm'}`}>
                                <p className="text-xs font-black text-gray-500 uppercase tracking-widest mb-2">{stat.label}</p>
                                <p className={`text-3xl font-black text-${stat.color}-500`}>{stat.value}</p>
                            </div>
                        ))}
                    </div>

                    {/* Source Breakdown */}
                    <div className={`p-6 rounded-3xl border ${isDarkMode ? 'bg-[#121214] border-gray-800' : 'bg-white border-gray-200 shadow-sm'}`}>
                        <h3 className={`text-sm font-black uppercase tracking-widest mb-5 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Source Breakdown</h3>
                        {Object.keys(sourceBreakdown).length === 0 ? (
                            <p className="text-gray-500 text-sm font-medium italic">No leads yet — start with Yuki-Search or Yuki-Vision.</p>
                        ) : (
                            <div className="space-y-3">
                                {Object.entries(sourceBreakdown).map(([source, count]) => (
                                    <div key={source}>
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="text-xs font-bold text-gray-400 uppercase">{source}</span>
                                            <span className="text-xs font-black text-emerald-400">{count}</span>
                                        </div>
                                        <div className={`h-2 rounded-full ${isDarkMode ? 'bg-gray-800' : 'bg-gray-100'}`}>
                                            <div
                                                className="h-2 rounded-full bg-gradient-to-r from-emerald-500 to-indigo-500 transition-all"
                                                style={{ width: `${(count / leads.length) * 100}%` }}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Top Companies */}
                    <div className={`p-6 rounded-3xl border ${isDarkMode ? 'bg-[#121214] border-gray-800' : 'bg-white border-gray-200 shadow-sm'}`}>
                        <h3 className={`text-sm font-black uppercase tracking-widest mb-5 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Top Companies</h3>
                        {topCompanies.length === 0 ? (
                            <p className="text-gray-500 text-sm font-medium italic">No company data yet.</p>
                        ) : (
                            <div className="space-y-3">
                                {topCompanies.map(([company, count], i) => (
                                    <div key={company} className="flex items-center gap-4">
                                        <span className="text-xs font-black text-gray-600 w-5">#{i + 1}</span>
                                        <div className="flex-1">
                                            <div className="flex items-center justify-between mb-1">
                                                <span className={`text-sm font-bold ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>{company}</span>
                                                <span className="text-xs font-black text-indigo-400">{count} lead{count > 1 ? 's' : ''}</span>
                                            </div>
                                            <div className={`h-1.5 rounded-full ${isDarkMode ? 'bg-gray-800' : 'bg-gray-100'}`}>
                                                <div
                                                    className="h-1.5 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500"
                                                    style={{ width: `${(count / (topCompanies[0]?.[1] || 1)) * 100}%` }}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Yukime Chat Sidebar — desktop only; mobile version is inline above */}
            <div className={`hidden sm:flex ${chatOpen ? 'sm:w-80 md:w-96' : 'sm:w-14'} flex-col border-l transition-all duration-300 ${isDarkMode ? 'bg-[#0D0D0E] border-gray-800' : 'bg-white border-gray-200'} shrink-0`}>
                {/* Chat header / toggle */}
                <div className={`h-14 flex items-center border-b px-4 gap-3 shrink-0 ${isDarkMode ? 'border-gray-800' : 'border-gray-100'}`}>
                    <button
                        onClick={() => setChatOpen(!chatOpen)}
                        className="p-1.5 rounded-xl hover:bg-gray-800/50 text-emerald-400 transition-colors shrink-0"
                        title={chatOpen ? 'Collapse chat' : 'Open Yukime chat'}
                    >
                        <MessageSquare size={18} />
                    </button>
                    {chatOpen && (
                        <div className="flex items-center gap-2 min-w-0">
                            <span className={`text-sm font-black truncate ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Ask Yukime</span>
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                        </div>
                    )}
                </div>

                {chatOpen && (
                    <>
                        <div className="flex-1 overflow-y-auto p-4 space-y-3">
                            {messages.map((msg, i) => (
                                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-[85%] px-4 py-3 rounded-2xl text-sm font-medium leading-relaxed ${msg.role === 'user'
                                        ? 'bg-emerald-600 text-white rounded-br-sm'
                                        : isDarkMode ? 'bg-gray-800 text-gray-200 rounded-bl-sm' : 'bg-gray-100 text-gray-800 rounded-bl-sm'
                                        }`}>
                                        {msg.text}
                                    </div>
                                </div>
                            ))}
                            {thinking && (
                                <div className="flex justify-start">
                                    <div className={`px-4 py-3 rounded-2xl rounded-bl-sm flex gap-1 items-center ${isDarkMode ? 'bg-gray-800' : 'bg-gray-100'}`}>
                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-bounce" style={{ animationDelay: '0ms' }} />
                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-bounce" style={{ animationDelay: '150ms' }} />
                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-bounce" style={{ animationDelay: '300ms' }} />
                                    </div>
                                </div>
                            )}
                            <div ref={chatBottom} />
                        </div>
                        <form onSubmit={sendMessage} className={`p-3 border-t flex items-center gap-2 shrink-0 ${isDarkMode ? 'border-gray-800' : 'border-gray-100'}`}>
                            <input
                                value={input}
                                onChange={e => setInput(e.target.value)}
                                placeholder="Ask about your leads…"
                                className={`flex-1 bg-transparent text-sm focus:outline-none placeholder:text-gray-600 font-medium px-3 py-2 rounded-xl border ${isDarkMode ? 'border-gray-800 focus:border-emerald-500/50' : 'border-gray-200 focus:border-emerald-500/50'} transition-colors`}
                                disabled={thinking}
                            />
                            <button
                                type="submit"
                                disabled={!input.trim() || thinking}
                                className="p-2 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 transition-all disabled:opacity-40 shrink-0"
                            >
                                <Send size={16} />
                            </button>
                        </form>
                    </>
                )}
            </div>
        </div>
    );
};

// --- Main Dashboard Component ---
export const TeakelDashboard: React.FC = () => {
    const { isDarkMode, teakelActiveTab, setTeakelActiveTab, setActiveTab, fetchLeads } = useAppStore();
    const isMobile = useIsMobile();
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    useEffect(() => { if (isMobile) setIsSidebarOpen(false); }, [isMobile]);

    useEffect(() => {
        fetchLeads();
    }, [fetchLeads]);

    return (
        <div className="fixed inset-0 z-[100] flex bg-[#0A0A0B] text-white overflow-hidden">
            {/* Teakel Sidebar */}
            <aside className={`${isSidebarOpen ? 'w-72' : 'w-20'} shrink-0 relative flex flex-col border-r transition-all duration-300 ${isDarkMode ? 'bg-[#121214] border-gray-800' : 'bg-white border-gray-200 text-gray-900'}`}>
                <button
                    onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                    className={`absolute -right-3 top-8 w-6 h-6 rounded-full border flex items-center justify-center z-10 transition-colors shadow-sm ${isDarkMode ? 'bg-gray-800 border-gray-700 text-gray-400 hover:text-white hover:border-gray-500' : 'bg-white border-gray-200 text-gray-500 hover:text-gray-900'}`}
                >
                    <ChevronRight size={14} className={`transform transition-transform ${isSidebarOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* Brand Header */}
                <div className={`p-6 mb-4 ${!isSidebarOpen && 'px-4'}`}>
                    <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${isDarkMode ? 'bg-white' : 'bg-black'} shadow-md p-1.5 overflow-hidden transition-all duration-300 ${!isSidebarOpen && 'mx-auto'}`}>
                            <img src={isDarkMode ? "/TICKEL Logo 192px.png" : "/TICKEL Logo 192px invert.png"} className="w-full h-full object-contain" alt="Tickel" />
                        </div>
                        {isSidebarOpen && (
                            <div className="overflow-hidden">
                                <h1 className="text-xl font-black tracking-tight leading-none bg-gradient-to-r from-emerald-500 via-emerald-400 to-indigo-500 bg-clip-text text-transparent">Teakel</h1>
                                <p className="text-[9px] text-gray-500 font-black uppercase tracking-widest mt-0.5 whitespace-nowrap">By Rickel Industries</p>
                            </div>
                        )}
                    </div>
                </div>

                <nav className="flex-1 px-3 space-y-1">
                    <TeakelSidebarItem icon={Search} label="Yuki-Search" active={teakelActiveTab === 'search'} onClick={() => setTeakelActiveTab('search')} badge="AI" isOpen={isSidebarOpen} />
                    <TeakelSidebarItem icon={Scan} label="Yuki-Vision" active={teakelActiveTab === 'vision'} onClick={() => setTeakelActiveTab('vision')} isOpen={isSidebarOpen} />
                    <TeakelSidebarItem icon={Table} label="Leads List" active={teakelActiveTab === 'list'} onClick={() => setTeakelActiveTab('list')} isOpen={isSidebarOpen} />
                    <TeakelSidebarItem icon={Folders} label="Campaigns" active={teakelActiveTab === 'campaigns'} onClick={() => setTeakelActiveTab('campaigns')} isOpen={isSidebarOpen} />
                    <TeakelSidebarItem icon={BarChart3} label="Reports" active={teakelActiveTab === 'reports'} onClick={() => setTeakelActiveTab('reports')} isOpen={isSidebarOpen} />

                    <div className={`my-4 border-t ${isDarkMode ? 'border-gray-800' : 'border-gray-100'}`} />

                    <TeakelSidebarItem icon={Settings} label="Settings" active={teakelActiveTab === 'settings'} onClick={() => setTeakelActiveTab('settings')} isOpen={isSidebarOpen} />
                    <button
                        onClick={() => setActiveTab('dashboard')}
                        title={!isSidebarOpen ? "Back to Main Dashboard" : undefined}
                        className={`w-full flex items-center ${isSidebarOpen ? 'gap-3 px-4' : 'justify-center'} py-3 rounded-xl transition-all ${isDarkMode ? 'text-gray-500 hover:text-white' : 'text-gray-400 hover:text-gray-900'} mt-4`}
                    >
                        <ArrowLeft size={18} />
                        {isSidebarOpen && <span className="font-bold text-sm tracking-tight whitespace-nowrap">Back to Main</span>}
                    </button>
                </nav>

                <div className={`p-5 mt-auto ${!isSidebarOpen && 'px-3'}`}>
                    {isSidebarOpen ? (
                        <div className="flex flex-col gap-3">
                            <div className={`p-4 rounded-3xl border ${isDarkMode ? 'bg-[#1a1c1d] border-gray-800' : 'bg-gray-50 border-gray-200'}`}>
                                <div className="flex items-center gap-2 mb-2">
                                    <Shield size={14} className="text-emerald-500 shrink-0" />
                                    <span className="text-[10px] font-black uppercase tracking-widest text-emerald-500">System Secure</span>
                                </div>
                                <p className="text-[10px] text-gray-400 font-medium leading-relaxed">
                                    Yukime AI may produce inaccurate information about people, places, or facts.
                                </p>
                            </div>
                            <p className="text-[10px] text-gray-500 font-bold leading-tight text-center">
                                Powered by Yukime 2.5 from <a href="https://www.rickelindustries.co.ke" target="_blank" rel="noopener noreferrer" className="text-indigo-500 hover:underline">Rickel Industries</a>
                            </p>
                        </div>
                    ) : (
                        <div className="flex justify-center" title="System Secure - Yukime AI may produce inaccurate information.">
                            <Shield size={18} className="text-emerald-500" />
                        </div>
                    )}
                </div>
            </aside>

            {/* Teakel Content Area */}
            <main className={`flex-1 flex flex-col overflow-hidden ${isDarkMode ? 'bg-[#0A0A0B]' : 'bg-gray-50'}`}>
                {/* Sub-header */}
                <header className={`h-16 border-b flex items-center justify-between px-8 shrink-0 ${isDarkMode ? 'bg-[#121214] border-gray-800/60' : 'bg-white border-gray-200/60'}`}>
                    <div className="flex items-center gap-4">
                        <span className={`text-[10px] font-black uppercase tracking-[0.3em] ${isDarkMode ? 'text-gray-600' : 'text-gray-400'}`}>Yukime Intelligence Stream</span>
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    </div>
                    <div className="flex items-center gap-4">
                        <NotificationBell />
                    </div>
                </header>

                <div className="flex-1 overflow-hidden">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={teakelActiveTab}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.2 }}
                            className="h-full"
                        >
                            {teakelActiveTab === 'search' && <YukiSearch />}
                            {teakelActiveTab === 'vision' && <YukiVision />}
                            {teakelActiveTab === 'list' && <LeadsList />}
                            {teakelActiveTab === 'campaigns' && <CampaignManager />}
                            {teakelActiveTab === 'reports' && <ReportsModule />}
                            {teakelActiveTab === 'settings' && (
                                <div className="p-12 max-w-2xl mx-auto overflow-y-auto h-full">
                                    <h3 className={`text-2xl font-black mb-8 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Teakel Settings</h3>
                                    <div className="space-y-6">
                                        <SettingsToggle
                                            label="Allow Yukime to use Lead data"
                                            description="Permit AI to incorporate lead intelligence into overall Rickel Industries reports."
                                            checked={true}
                                            isDarkMode={isDarkMode}
                                        />
                                        <SettingsToggle
                                            label="Automated LinkedIn Scraping"
                                            description="Automatically attempt to enrich Vision leads with LinkedIn bio data."
                                            checked={false}
                                            isDarkMode={isDarkMode}
                                        />
                                        <SettingsToggle
                                            label="External vCard Sync"
                                            description="Sync all Vision-scanned leads to your workspace-wide contact list."
                                            checked={true}
                                            isDarkMode={isDarkMode}
                                        />
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    </AnimatePresence>
                </div>
            </main>
        </div>
    );
};
