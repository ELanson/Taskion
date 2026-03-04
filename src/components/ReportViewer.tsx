import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '../store/useAppStore';
import {
    X,
    Download,
    Share2,
    BrainCircuit,
    TrendingUp,
    TrendingDown,
    Clock,
    CheckSquare,
    Target,
    AlertTriangle,
    BarChart3,
    Activity,
    Globe,
    User,
    MessageSquare,
    Send,
    ChevronLeft,
    ChevronRight,
    Loader2
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export const ReportViewer: React.FC = () => {
    const {
        generatedReportData,
        setGeneratedReportData,
        isDarkMode,
        userProfile
    } = useAppStore();

    const [headerType, setHeaderType] = React.useState<'default' | 'personal'>('default');
    const [showCollaboration, setShowCollaboration] = React.useState(false);
    const [collabInput, setCollabInput] = React.useState('');
    const [collabMessages, setCollabMessages] = React.useState<{ role: 'user' | 'assistant', content: string }[]>([]);
    const [isCollabLoading, setIsCollabLoading] = React.useState(false);
    const collabScrollRef = React.useRef<HTMLDivElement>(null);

    React.useEffect(() => {
        if (collabScrollRef.current) {
            collabScrollRef.current.scrollTop = collabScrollRef.current.scrollHeight;
        }
    }, [collabMessages]);

    if (!generatedReportData) return null;

    // Destructure real data from the backend engine
    const { template, scope, dateRange, useAI, stats, aiContent } = generatedReportData;

    const handleDownloadPDF = () => {
        window.print();
    };

    const handleCollabSend = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!collabInput.trim() || isCollabLoading) return;

        const userMsg = collabInput.trim();
        setCollabMessages(prev => [...prev, { role: 'user', content: userMsg }]);
        setCollabInput('');
        setIsCollabLoading(true);

        try {
            const res = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: `[REPORT COLLABORATION CONTEXT]\nReport Title: ${template}\nScope: ${scope}\nRange: ${dateRange}\n\nUser Question: ${userMsg}`,
                    history: collabMessages,
                    userId: userProfile?.id,
                    userRole: userProfile?.global_role
                })
            });
            const data = await res.json();
            setCollabMessages(prev => [...prev, { role: 'assistant', content: data.text }]);
        } catch (error) {
            setCollabMessages(prev => [...prev, { role: 'assistant', content: "I'm sorry, I encountered an error while processing your request." }]);
        } finally {
            setIsCollabLoading(false);
        }
    };

    return (
        <AnimatePresence mode="wait">
            <div className="fixed inset-0 z-[60] flex flex-col bg-gray-50 dark:bg-[#0A0A0B]">
                {/* Header Navbar */}
                <motion.div
                    initial={{ y: -50 }}
                    animate={{ y: 0 }}
                    className={`shrink-0 h-16 px-6 border-b flex items-center justify-between shadow-sm z-10 print:hidden ${isDarkMode ? 'bg-[#121214] border-gray-800' : 'bg-white border-gray-200'}`}
                >
                    <div className="flex items-center gap-4">
                        <div className={`p-2 rounded-lg ${isDarkMode ? 'bg-indigo-500/10 text-indigo-400' : 'bg-indigo-50 text-indigo-600'}`}>
                            <BarChart3 size={20} />
                        </div>
                        <div className="flex items-center gap-4">
                            <div>
                                <h2 className={`text-base font-black ${isDarkMode ? 'text-white' : 'text-gray-900'} uppercase tracking-widest leading-tight`}>
                                    Intelligence Report
                                </h2>
                                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">
                                    {template} • {scope} • {dateRange}
                                </p>
                            </div>
                            <div className={`flex items-center p-1 rounded-xl gap-1 ${isDarkMode ? 'bg-gray-800/50' : 'bg-gray-100'}`}>
                                <button
                                    onClick={() => setHeaderType('default')}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${headerType === 'default' ? 'bg-indigo-600 text-white shadow-lg' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
                                >
                                    Default
                                </button>
                                <button
                                    onClick={() => setHeaderType('personal')}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${headerType === 'personal' ? 'bg-indigo-600 text-white shadow-lg' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
                                >
                                    Personal
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={handleDownloadPDF}
                            className={`p-2.5 rounded-xl transition-all flex items-center gap-2 ${isDarkMode ? 'bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20' : 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100'}`}
                            title="Download PDF"
                        >
                            <Download size={18} />
                            <span className="text-sm font-bold hidden sm:inline">Export PDF</span>
                        </button>
                        <button className={`p-2.5 rounded-xl transition-colors ${isDarkMode ? 'hover:bg-gray-800 text-gray-400 hover:text-white' : 'hover:bg-gray-100 text-gray-500 hover:text-gray-900'} hidden sm:block`} title="Share Link">
                            <Share2 size={18} />
                        </button>
                        <div className="w-px h-6 bg-gray-200 dark:bg-gray-800 mx-2" />
                        <button
                            onClick={() => setGeneratedReportData(null)}
                            className={`p-2.5 rounded-xl border transition-colors flex items-center gap-2 ${isDarkMode ? 'border-gray-800 hover:bg-gray-800 text-gray-300' : 'border-gray-200 hover:bg-gray-100 text-gray-700'}`}
                        >
                            <X size={16} />
                            <span className="text-sm font-bold hidden sm:inline">Close</span>
                        </button>
                    </div>
                </motion.div>

                {/* Dynamic Content Layout: Collaboration + Report */}
                <div className="flex-1 flex overflow-hidden relative">
                    <style>{`
                        @media print {
                            @page {
                                size: A4;
                                margin: 15mm;
                            }
                            
                            /* Force visibility of backgrounds and colors */
                            * {
                                -webkit-print-color-adjust: exact !important;
                                print-color-adjust: exact !important;
                                color-adjust: exact !important;
                            }

                            body {
                                background: white !important;
                                margin: 0 !important;
                                padding: 0 !important;
                            }

                            .print\\:hidden { display: none !important; }
                            
                            /* Layout Reset for Print */
                            .fixed { position: static !important; display: block !important; }
                            .inset-0 { position: static !important; height: auto !important; overflow: visible !important; }
                            .flex-1 { flex: none !important; display: block !important; }
                            .overflow-hidden, .overflow-y-auto { overflow: visible !important; height: auto !important; }
                            
                            /* Container Optimization */
                            .max-w-5xl { max-width: 100% !important; width: 100% !important; margin: 0 !important; padding: 0 !important; }
                            .p-4, .p-8, .p-6 { padding: 8mm !important; }
                            .sm\\:p-8 { padding: 10mm !important; }

                            /* Card & Content Styling */
                            .shadow-sm, .shadow-lg, .shadow-xl { box-shadow: none !important; border: 1px solid #e2e8f0 !important; }
                            .rounded-\\[24px\\], .rounded-[20px] { border-radius: 12px !important; }
                            .bg-white, .dark\\:bg-\\[#0A0A0B\\], .bg-\\[#121214\\] { background: white !important; color: black !important; }
                            
                            /* Text contrast */
                            .text-gray-300, .text-gray-400, .text-gray-500 { color: #4b5563 !important; }
                            .text-white { color: black !important; }
                            h1, h2, h3, h4, p, span { color: black !important; }
                            .text-indigo-500, .text-indigo-600, .text-purple-500 { color: #4f46e5 !important; }
                            
                            /* Ensure icons have some weight */
                            svg { stroke: currentColor !important; }

                            /* Page break controls */
                            .page-break-before { page-break-before: always; }
                            .page-break-after { page-break-after: always; }
                            .avoid-break { page-break-inside: avoid; }
                            
                            /* Sidebar/Interactive UI removal */
                            .z-\\[60\\], .z-10, .z-20 { z-index: auto !important; }
                            
                            /* Progress bars & Metrics */
                            .bg-indigo-500 { background-color: #4f46e5 !important; }
                            .bg-emerald-500 { background-color: #10b981 !important; }
                            .bg-rose-500 { background-color: #f43f5e !important; }
                            .bg-indigo-50 { background-color: #f5f3ff !important; border: 1px solid #ddd6fe !important; }
                            .bg-emerald-50 { background-color: #ecfdf5 !important; }
                            .bg-rose-50 { background-color: #fff1f2 !important; }
                            .text-emerald-600 { color: #059669 !important; }
                            .text-rose-600 { color: #dc2626 !important; }
                        }
                    `}</style>

                    <AnimatePresence>
                        {showCollaboration && (
                            <motion.div
                                initial={{ x: -400, opacity: 0 }}
                                animate={{ x: 0, opacity: 1 }}
                                exit={{ x: -400, opacity: 0 }}
                                className={`w-96 border-r flex flex-col shrink-0 z-20 print:hidden ${isDarkMode ? 'bg-[#0D0D0E] border-gray-800' : 'bg-gray-50 border-gray-200'}`}
                            >
                                <div className="p-6 border-b flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400">
                                            <MessageSquare size={18} />
                                        </div>
                                        <h4 className={`font-black uppercase tracking-widest text-sm ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Collaborate</h4>
                                    </div>
                                    <button onClick={() => setShowCollaboration(false)} className="p-1.5 hover:bg-gray-800 rounded-lg text-gray-500">
                                        <ChevronLeft size={20} />
                                    </button>
                                </div>

                                <div ref={collabScrollRef} className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
                                    {collabMessages.length === 0 && (
                                        <div className="text-center py-8">
                                            <div className="w-16 h-16 bg-indigo-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4 text-indigo-400">
                                                <BrainCircuit size={32} />
                                            </div>
                                            <p className={`text-sm font-bold ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Discuss your report with Yukime</p>
                                            <p className="text-xs text-gray-500 mt-2">Ask for more details, data clarifications, or report structure changes.</p>
                                        </div>
                                    )}
                                    {collabMessages.map((m, i) => (
                                        <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                            <div className={`max-w-[85%] p-4 rounded-2xl text-xs leading-relaxed ${m.role === 'user' ? 'bg-indigo-600 text-white rounded-tr-none' : (isDarkMode ? 'bg-gray-800 text-gray-300 border border-gray-700 rounded-tl-none' : 'bg-white border border-gray-100 text-gray-700 rounded-tl-none')}`}>
                                                <ReactMarkdown remarkPlugins={[remarkGfm]}>{m.content}</ReactMarkdown>
                                            </div>
                                        </div>
                                    ))}
                                    {isCollabLoading && (
                                        <div className="flex justify-start">
                                            <div className={`p-4 rounded-2xl rounded-tl-none flex items-center gap-2 ${isDarkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-100'}`}>
                                                <Loader2 size={12} className="animate-spin text-indigo-500" />
                                                <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Yukime is thinking...</span>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <form onSubmit={handleCollabSend} className="p-4 border-t relative">
                                    <textarea
                                        value={collabInput}
                                        onChange={(e) => setCollabInput(e.target.value)}
                                        onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleCollabSend(); } }}
                                        placeholder="Discuss with Yukime..."
                                        className={`w-full bg-transparent border rounded-2xl px-4 py-3 pb-12 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all resize-none ${isDarkMode ? 'border-gray-700 text-white placeholder-gray-600' : 'border-gray-200'}`}
                                        rows={3}
                                    />
                                    <button
                                        type="submit"
                                        disabled={!collabInput.trim() || isCollabLoading}
                                        className="absolute right-7 bottom-7 p-2 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 transition-all shadow-lg shadow-indigo-900/40"
                                    >
                                        <Send size={16} />
                                    </button>
                                </form>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Report Content Scrollable */}
                    <div className="flex-1 overflow-y-auto custom-scrollbar bg-white dark:bg-[#0A0A0B] print:bg-white print:overflow-visible">
                        <div className="w-full max-w-5xl mx-auto p-4 sm:p-8 space-y-8 pb-32 print:p-0 print:pb-0">
                            {/* PDF Header (Dynamic) */}
                            <div className="mb-12 border-b-2 border-indigo-500 pb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 avoid-break">
                                {headerType === 'default' ? (
                                    <div className="flex items-center gap-5 text-left">
                                        <img src={isDarkMode ? "/TICKEL Logo 192px invert.png" : "/TICKEL Logo 192px.png"} className="w-16 h-16 object-contain" alt="Tickel Logo" />
                                        <div>
                                            <h1 className={`text-xl font-black ${isDarkMode ? 'text-white' : 'text-gray-900'} uppercase tracking-tight`}>Rickel Industries</h1>
                                            <div className="flex flex-col gap-1">
                                                <a href="https://www.rickelindustries.co.ke" target="_blank" rel="noopener noreferrer" className="text-xs text-indigo-500 font-bold flex items-center gap-1 hover:underline">
                                                    <Globe size={12} />
                                                    www.rickelindustries.co.ke
                                                </a>
                                                <div className="flex items-center gap-2 text-[10px] text-gray-500 font-medium uppercase tracking-widest">
                                                    <span>Agent: Yukime 2.5</span>
                                                    <span className="w-1 h-1 rounded-full bg-gray-400" />
                                                    <span>By Rickel Industries</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-5 text-left">
                                        {userProfile?.avatar_url ? (
                                            <img src={userProfile.avatar_url} className="w-16 h-16 rounded-2xl object-cover border-2 border-indigo-500/20" alt="Profile" />
                                        ) : (
                                            <div className="w-16 h-16 rounded-2xl bg-indigo-600 flex items-center justify-center text-white text-xl font-black">
                                                {userProfile?.name?.charAt(0) || 'U'}
                                            </div>
                                        )}
                                        <div>
                                            <h1 className={`text-xl font-black ${isDarkMode ? 'text-white' : 'text-gray-900'} uppercase tracking-tight`}>{userProfile?.name || 'Authorized User'}</h1>
                                            <p className="text-indigo-500 text-xs font-black uppercase tracking-widest leading-none mt-1">{userProfile?.global_role || 'Contributor'}</p>
                                            <p className="text-[10px] text-gray-500 font-medium uppercase tracking-widest mt-1">Certified Analytics Stream • {new Date().toLocaleDateString()}</p>
                                        </div>
                                    </div>
                                )}

                                <div className="text-right">
                                    <div className={`inline-block px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider mb-2 ${isDarkMode ? 'bg-indigo-500/10 text-indigo-400' : 'bg-indigo-50 text-indigo-600'}`}>
                                        Intelligence Report
                                    </div>
                                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest leading-none">ID: TR-{Math.random().toString(36).substr(2, 9).toUpperCase()}</p>
                                </div>
                            </div>

                            {/* 1. AI Narrative Summary */}
                            {useAI && aiContent && (
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.1 }}
                                    className={`p-6 sm:p-8 rounded-[24px] border border-transparent shadow-lg relative overflow-hidden avoid-break ${isDarkMode ? 'bg-[#121214] border-gray-800/50' : 'bg-white'}`}
                                >
                                    <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/5 blur-3xl rounded-full translate-x-1/2 -translate-y-1/2 pointer-events-none" />

                                    <div className="flex items-center gap-3 mb-6 relative z-10">
                                        <div className="p-2 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 text-white shadow-lg shadow-purple-500/20">
                                            <BrainCircuit size={20} />
                                        </div>
                                        <h3 className={`text-xl font-black ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Executive Summary</h3>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative z-10">
                                        <div className="md:col-span-2 space-y-4">
                                            <div className={`text-sm leading-relaxed prose prose-sm max-w-none ${isDarkMode ? 'prose-invert text-gray-300' : 'text-gray-700'}`}>
                                                <ReactMarkdown remarkPlugins={[remarkGfm]}>{aiContent.executiveSummary}</ReactMarkdown>
                                            </div>

                                            {aiContent.recommendations && aiContent.recommendations.length > 0 && (
                                                <div className="pt-6 space-y-3">
                                                    <p className={`text-[10px] font-bold uppercase tracking-widest ${isDarkMode ? 'text-indigo-400' : 'text-indigo-600'}`}>Yukime's Strategic Recommendations</p>
                                                    <div className="grid grid-cols-1 gap-2">
                                                        {aiContent.recommendations.map((rec: string, i: number) => (
                                                            <div key={i} className={`text-xs p-3 rounded-xl border flex items-center gap-3 ${isDarkMode ? 'bg-indigo-500/5 border-indigo-500/20 text-gray-300' : 'bg-indigo-50 border-indigo-100 text-indigo-900'}`}>
                                                                <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0" />
                                                                {rec}
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                        <div className="space-y-4">
                                            {aiContent.risks && aiContent.risks.map((risk: string, i: number) => (
                                                <div key={i} className={`p-4 rounded-xl border flex items-start gap-3 ${isDarkMode ? 'bg-rose-500/5 border-rose-500/10' : 'bg-rose-50 border-rose-100'}`}>
                                                    <AlertTriangle size={16} className="text-rose-500 shrink-0 mt-0.5" />
                                                    <div>
                                                        <p className={`text-[10px] font-bold ${isDarkMode ? 'text-rose-400' : 'text-rose-700'} uppercase tracking-widest mb-1`}>Critical Risk</p>
                                                        <p className={`text-xs leading-relaxed ${isDarkMode ? 'text-rose-300/80' : 'text-rose-800/80'}`}>{risk}</p>
                                                    </div>
                                                </div>
                                            ))}
                                            <button
                                                onClick={() => setShowCollaboration(true)}
                                                className={`w-full py-3 text-xs font-bold rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 border print:hidden ${isDarkMode ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20 hover:bg-indigo-500/20 hover:border-indigo-500/40' : 'bg-indigo-50 text-indigo-600 border-indigo-200 hover:bg-indigo-100'}`}
                                            >
                                                <MessageSquare size={14} />
                                                Ask Yukime to Collaborate
                                            </button>
                                        </div>
                                    </div>
                                </motion.div>
                            )}

                            {/* 2. KPI Metrics */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2 }}
                                className="grid grid-cols-2 md:grid-cols-4 gap-4 avoid-break"
                            >
                                <MetricCard title="Total Output" value={`${stats?.totalTasks || 0} Tasks`} icon={<CheckSquare size={16} />} trend="+12" isDarkMode={isDarkMode} />
                                <MetricCard title="Time Captured" value={`${stats?.totalHours || 0} Hrs`} icon={<Clock size={16} />} trend="+4.5" isDarkMode={isDarkMode} />
                                <MetricCard title="Velocity Score" value={stats?.completionRate >= 80 ? 'A' : (stats?.completionRate >= 60 ? 'B' : 'C')} icon={<Activity size={16} />} isDarkMode={isDarkMode} />
                                <MetricCard title="Success Rate" value={`${stats?.completionRate || 0}%`} icon={<Target size={16} />} trend="-2" isDarkMode={isDarkMode} />
                            </motion.div>

                            {/* 3. Visualizations */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.3 }}
                                className={`p-6 sm:p-8 rounded-[24px] border shadow-sm avoid-break ${isDarkMode ? 'bg-[#121214] border-gray-800' : 'bg-white border-gray-100'}`}
                            >
                                <h3 className={`text-lg font-bold mb-6 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Velocity Breakdown</h3>
                                <div className="space-y-6">
                                    <ProgressBar label="Overall Progress" value={stats?.completionRate || 0} color="bg-indigo-500" isDarkMode={isDarkMode} />
                                    <ProgressBar label="Active Utilization" value={Math.min(100, (stats?.totalHours || 0) / 40 * 100)} color="bg-emerald-500" isDarkMode={isDarkMode} />
                                </div>
                            </motion.div>

                            {/* 4. Footer Disclaimer */}
                            <div className="pt-16 border-t border-gray-100 dark:border-gray-800 flex flex-col items-center text-center">
                                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-[0.3em] mb-4">
                                    Intelligence Stream Terminated • TICK-{Math.random().toString(36).substr(2, 6).toUpperCase()}
                                </p>
                                <div className={`max-w-2xl px-8 py-5 rounded-2xl border avoid-break ${isDarkMode ? 'bg-gray-800/10 border-gray-800/50' : 'bg-gray-50/50 border-gray-100'}`}>
                                    <p className="text-[9px] text-gray-500 font-bold leading-relaxed italic print:text-gray-600">
                                        DISCLAIMER: Yukime is an AI tool currently in development. AI-generated insights, summaries, and predictions are based on historical system data and probabilistic modeling. They should be used for supportive intelligence only. Users must double-check critical project information and metrics before making high-stakes decisions. Rickel Industries is not liable for outcomes based on AI advice.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AnimatePresence>
    );
};

// Helper Components
function MetricCard({ title, value, icon, trend, isDarkMode }: any) {
    const isPositive = trend && trend.startsWith('+');

    return (
        <div className={`p-5 rounded-[20px] border shadow-sm flex flex-col justify-between h-32 ${isDarkMode ? 'bg-[#121214] border-gray-800' : 'bg-white border-gray-100'}`}>
            <div className="flex items-center justify-between">
                <div className={`p-2 rounded-lg ${isDarkMode ? 'bg-gray-800 text-gray-400' : 'bg-gray-100 text-gray-500'}`}>
                    {icon}
                </div>
                {trend && (
                    <div className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full ${isPositive ? (isDarkMode ? 'bg-emerald-500/10 text-emerald-400' : 'bg-emerald-50 text-emerald-600') : (isDarkMode ? 'bg-rose-500/10 text-rose-400' : 'bg-rose-50 text-rose-600')}`}>
                        {isPositive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                        {trend}%
                    </div>
                )}
            </div>
            <div>
                <p className="text-[10px] font-bold tracking-widest uppercase text-gray-500 mb-1">{title}</p>
                <p className={`text-xl font-black ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{value}</p>
            </div>
        </div>
    );
}

function ProgressBar({ label, value, color, isDarkMode }: any) {
    return (
        <div>
            <div className="flex justify-between items-center mb-2">
                <span className={`text-sm font-bold ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>{label}</span>
                <span className={`text-xs font-bold ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>{value}%</span>
            </div>
            <div className={`h-2.5 w-full rounded-full overflow-hidden ${isDarkMode ? 'bg-[#1A1A1C] border border-gray-800' : 'bg-gray-100'}`}>
                <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${value}%` }}
                    transition={{ duration: 1, ease: 'easeOut' }}
                    className={`h-full ${color}`}
                />
            </div>
        </div>
    );
}
