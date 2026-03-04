import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '../store/useAppStore';
import { Send, Wand2, Bot, User, Sparkles, Loader2, Shield, Users, UserCheck, ChevronRight, RotateCcw, Square } from 'lucide-react';
import { chatWithLocalModel } from '../lib/localAi';
import { routeMessage } from '../lib/aiRouter';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface ChatMessage {
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
}

const ROLE_CONFIG = {
    admin: {
        label: 'AI Command Center',
        subtitle: 'System-aware diagnostics, team intelligence & anomaly detection.',
        accentColor: 'indigo' as const,
        icon: <Shield size={16} />,
        suggestions: [
            'Why is Marketing underperforming?',
            'Show users with role changes this month.',
            'Detect system inconsistencies.',
            'Which team has the highest burnout risk?',
            'Audit suspicious activity this week.',
        ],
        systemPrompt: `You are Yukime, an AI Command Center for a Global Admin. You can diagnose team performance, 
        detect security anomalies, surface permission misconfigurations, analyze org-wide productivity drops, 
        and provide strategic restructuring recommendations. Be precise, analytical, and data-driven. 
        Provide confidence scores on key insights. Flag anomalies prominently.`,
    },
    manager: {
        label: 'Team Support Assistant',
        subtitle: 'Workload analysis, bottleneck detection & team performance coaching.',
        accentColor: 'emerald' as const,
        icon: <Users size={16} />,
        suggestions: [
            'Who on my team is overloaded?',
            'Why are we missing deadlines this sprint?',
            'Generate a weekly team summary.',
            'Identify the biggest bottleneck right now.',
            'Suggest task reassignments to balance load.',
        ],
        systemPrompt: `You are Yukime, a Team Support Assistant for a Manager. You can analyze team workload, 
        identify bottlenecks, suggest task reassignments, explain missed deadlines, and generate team reports. 
        Stay focused on team-level operational insights. Do not provide company-wide restructuring advice.`,
    },
    contributor: {
        label: 'Personal Productivity Assistant',
        subtitle: 'Your personal AI coach for focus, time blocking & daily planning.',
        accentColor: 'purple' as const,
        icon: <UserCheck size={16} />,
        suggestions: [
            'Plan my day.',
            "Why is my focus score low?",
            'Reschedule my overdue tasks.',
            'What should I work on next?',
            'How can I improve my productivity this week?',
        ],
        systemPrompt: `You are Yukime, a Personal Productivity Assistant. Help the user plan their day, 
        break down tasks into subtasks, suggest optimal time blocks, explain their focus score, 
        alert them about upcoming deadlines, and provide personal analytics insights. 
        Be friendly, encouraging, and supportive. Do not discuss other team members' data.`,
    },
};

const ACCENT = {
    indigo: { bg: 'bg-indigo-600', light: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20', chip: 'bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 border border-indigo-500/20' },
    emerald: { bg: 'bg-emerald-600', light: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', chip: 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/20' },
    purple: { bg: 'bg-purple-600', light: 'bg-purple-500/10 text-purple-400 border-purple-500/20', chip: 'bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 border border-purple-500/20' },
};

export const SupportAIAssistant: React.FC = () => {
    const { isDarkMode, isAdmin, userProfile, useLocalModel, localModelUrl, geminiApiKey, fetchData, user, loadChatSession, saveChatSession, workspaceSettings } = useAppStore();

    const role = isAdmin ? 'admin' : (userProfile?.global_role === 'Manager' ? 'manager' : 'contributor');
    const cfg = ROLE_CONFIG[role];
    const accent = ACCENT[cfg.accentColor];

    const [messages, setMessages] = useState<ChatMessage[]>([
        {
            role: 'assistant',
            content: `Hello! I'm Yukime, your **${cfg.label}**. ${cfg.subtitle}\n\nHow can I help you today?`,
            timestamp: new Date(),
        }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const bottomRef = useRef<HTMLDivElement>(null);
    const abortControllerRef = useRef<AbortController | null>(null);

    const handleStopGeneration = () => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
            abortControllerRef.current = null;
        }
        setMessages(prev => [...prev, { role: 'assistant', content: '⬛ Response stopped.', timestamp: new Date() }]);
        setIsLoading(false);
    };

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Fetch chat sessions list on mount, but don't auto-load content
    useEffect(() => {
        if (user?.id) {
            useAppStore.getState().fetchChatSessions('support');
        }
    }, [user?.id]);

    // Save chat history to Supabase on update
    useEffect(() => {
        if (messages.length > 1) {
            saveChatSession('support', messages);
        }
    }, [messages, saveChatSession]);

    const sendMessage = async (text: string) => {
        if (!text.trim() || isLoading) return;
        const userMsg: ChatMessage = { role: 'user', content: text.trim(), timestamp: new Date() };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setIsLoading(true);

        // Create a fresh AbortController for this request
        const controller = new AbortController();
        abortControllerRef.current = controller;

        try {
            const history = messages.map(m => ({ role: m.role, content: m.content }));

            const now = new Date();
            const dateStr = now.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
            const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
            const userName = userProfile?.name || 'User';
            const userId = user?.id || 'unknown';
            const userGlobalRole = userProfile?.global_role || 'Contributor';

            const dynamicSystemPrompt = `${cfg.systemPrompt}
---
[CONTEXT]
Current System Date: ${dateStr}
Current System Time: ${timeStr}
User Name: ${userName}
User ID: ${userId}
User Role: ${userGlobalRole}
---
[CRITICAL INSTRUCTIONS]
1. You are responding to ${userName} (ID: ${userId}).
2. You HAVE ACCESS to database tools (create_task, get_tasks, get_projects, get_metrics, etc).
3. YOU MUST USE THESE TOOLS proactively when the user asks you to perform an action or fetch data. 
4. DO NOT provide instructions on how the user can do it themselves manually if a tool exists for it. EXECUTE the tool.
6. If the user uses relative dates (like "yesterday", "today", "tomorrow"), DO NOT calculate ISO strings. Instead, use the start_days_offset and due_days_offset parameters (e.g., -1 for yesterday, 0 for today, 1 for tomorrow) along with start_time and due_time (24-hour HH:MM format). The system will calculate the exact database dates automatically.
7. NEVER pass placeholders like {yesterday}. Use the numeric day offsets.
8. [ROLE ENFORCEMENT]: You must enforce the following assignment rules based on the User Role (${userGlobalRole}):
   - If Role is "Contributor": The system automatically handles your task assignments. DO NOT include the \`assignee_id\` field in your tool call at all. Let the system backend assign it to you automatically. If requested to assign to someone else, refuse and explain you only track personal tasks.
   - If Role is "Manager" or "Admin": You are PERMITTED to assign tasks to other team members. Use the \`get_team_members\` tool to find their IDs first if necessary.
9. If you are an Admin/Manager and the user asks to assign a task to "me" or "myself", use their User ID (${userId}) as the assignee_id.
10. NEVER emit warnings in your text response claiming the User ID is a "placeholder" or "unresolved" or "non-UUID". The ID is fully verified.`;

            const systemContextMessages = [
                { role: 'system' as const, content: dynamicSystemPrompt },
                ...history,
                { role: 'user' as const, content: text.trim() },
            ];

            let responseText = '';
            let didMutate = false;

            // Smart routing: CRUD tasks always go to local LLM.
            // Gemini is only used for complex analytics, reports, real-time queries.
            const route = routeMessage(text.trim(), !!workspaceSettings?.cloudAiEnabled, !!useLocalModel);

            if (route === 'local') {
                const { text: localRes, didMutate: localMutated } = await chatWithLocalModel(systemContextMessages, localModelUrl, userId, userGlobalRole);
                responseText = localRes;
                didMutate = localMutated;
            } else {
                // Cloud route (Gemini) — only for complex analytics, reports, real-time data
                const res = await fetch('/api/chat', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        message: text.trim(),
                        history: history.map((m: any) => ({ role: m.role, content: m.content })),
                        systemPrompt: dynamicSystemPrompt
                    }),
                    signal: abortControllerRef.current?.signal
                });
                const data = await res.json();
                responseText = data.text;
                didMutate = data.didMutate || false;
            }

            if (!abortControllerRef.current?.signal.aborted) {
                setMessages(prev => [...prev, { role: 'assistant', content: responseText, timestamp: new Date() }]);
                // Refresh dashboard in case AI used tools
                if (didMutate) {
                    await fetchData();
                }
            }
        } catch (err: any) {
            if (err?.name === 'AbortError') return; // user cancelled
            setMessages(prev => [...prev, { role: 'assistant', content: 'I encountered an error. Please check your AI configuration and try again.', timestamp: new Date() }]);
        } finally {
            abortControllerRef.current = null;
            setIsLoading(false);
        }
    };

    const renderContent = (text: string) => {
        return text;
    };

    const dk = isDarkMode;

    return (
        <div className={`flex flex-col h-[calc(100vh-200px)] rounded-[24px] border overflow-hidden ${dk ? 'bg-[#0e0f10] border-gray-800' : 'bg-white border-gray-200'}`}>
            {/* Header */}
            <div className={`shrink-0 px-6 py-4 border-b flex items-center justify-between ${dk ? 'border-gray-800 bg-[#121214]' : 'border-gray-100 bg-gray-50'}`}>
                <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${accent.light} border`}>
                        {cfg.icon}
                    </div>
                    <div>
                        <h3 className={`font-black text-sm ${dk ? 'text-white' : 'text-gray-900'}`}>{cfg.label}</h3>
                        <p className="text-[11px] text-gray-500 max-w-xs hidden sm:block">{cfg.subtitle}</p>
                    </div>
                </div>
                <button
                    onClick={() => setMessages([{ role: 'assistant', content: `Hello! I'm Yukime, your **${cfg.label}**. How can I help?`, timestamp: new Date() }])}
                    className={`p-2 rounded-lg text-xs flex items-center gap-1.5 ${dk ? 'bg-gray-800 text-gray-400 hover:text-white' : 'bg-gray-100 text-gray-500 hover:text-gray-900'} transition-colors`}
                >
                    <RotateCcw size={12} /> Clear
                </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-5 custom-scrollbar">
                <AnimatePresence initial={false}>
                    {messages.map((msg, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
                        >
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${msg.role === 'assistant' ? accent.bg + ' text-white' : dk ? 'bg-gray-800 text-gray-300' : 'bg-gray-200 text-gray-600'}`}>
                                {msg.role === 'assistant' ? <Sparkles size={14} /> : <User size={14} />}
                            </div>
                            <div className={`max-w-[95%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${msg.role === 'user'
                                ? dk ? 'bg-gray-700 text-white rounded-tr-sm' : 'bg-indigo-600 text-white rounded-tr-sm'
                                : dk ? 'bg-gray-800/80 text-gray-200 rounded-tl-sm border border-gray-700/50' : 'bg-gray-100 text-gray-800 rounded-tl-sm'
                                }`}
                            >
                                {msg.role === 'assistant' ? (
                                    <div className={`prose prose-sm max-w-none ${dk ? 'prose-invert' : ''}`}>
                                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                            {msg.content}
                                        </ReactMarkdown>
                                    </div>
                                ) : (
                                    msg.content
                                )}
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>

                {isLoading && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${accent.bg} text-white`}><Sparkles size={14} /></div>
                        <div className={`px-4 py-3 rounded-2xl rounded-tl-sm ${dk ? 'bg-gray-800/80 border border-gray-700/50' : 'bg-gray-100'}`}>
                            <div className="flex items-center gap-1.5">
                                {[0, 1, 2].map(i => (
                                    <motion.div key={i} className={`w-1.5 h-1.5 rounded-full ${cfg.accentColor === 'indigo' ? 'bg-indigo-400' : cfg.accentColor === 'emerald' ? 'bg-emerald-400' : 'bg-purple-400'}`}
                                        animate={{ scale: [1, 1.4, 1], opacity: [0.5, 1, 0.5] }}
                                        transition={{ duration: 0.8, delay: i * 0.15, repeat: Infinity }}
                                    />
                                ))}
                            </div>
                        </div>
                    </motion.div>
                )}
                <div ref={bottomRef} />
            </div>

            {/* Quick Suggestions */}
            <div className={`shrink-0 px-4 py-3 border-t ${dk ? 'border-gray-800' : 'border-gray-100'}`}>
                <div className="flex gap-2 overflow-x-auto custom-scrollbar-x pb-1">
                    {cfg.suggestions.map((s, i) => (
                        <button key={i} onClick={() => sendMessage(s)}
                            className={`shrink-0 text-[11px] font-medium px-3 py-1.5 rounded-full transition-colors ${accent.chip}`}
                        >
                            {s}
                        </button>
                    ))}
                </div>
            </div>

            {/* Input */}
            <div className={`shrink-0 p-4 border-t ${dk ? 'border-gray-800 bg-[#121214]' : 'border-gray-100 bg-gray-50'}`}>
                <div className={`flex gap-3 items-end p-3 rounded-2xl border ${dk ? 'bg-[#1a1c1d] border-gray-800' : 'bg-white border-gray-200'}`}>
                    <textarea
                        ref={(el) => {
                            if (el) {
                                el.style.height = 'auto';
                                el.style.height = `${Math.min(el.scrollHeight, 200)}px`;
                            }
                        }}
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(input); } }}
                        placeholder={isLoading ? 'Yukime is thinking...' : `Ask ${cfg.label}...`}
                        rows={1}
                        disabled={isLoading}
                        className={`flex-1 bg-transparent text-sm resize-none outline-none leading-relaxed ${dk ? 'text-white placeholder-gray-500' : 'text-gray-900 placeholder-gray-400'} disabled:opacity-60`}
                    />
                    {isLoading ? (
                        <button
                            type="button"
                            onClick={handleStopGeneration}
                            title="Stop generation"
                            className={`p-2.5 rounded-xl bg-red-500 text-white shadow-lg transition-all hover:bg-red-600 animate-pulse shrink-0`}
                        >
                            <Square size={16} fill="white" />
                        </button>
                    ) : (
                        <button
                            onClick={() => sendMessage(input)}
                            disabled={!input.trim()}
                            className={`p-2.5 rounded-xl ${accent.bg} text-white shadow-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90 shrink-0`}
                        >
                            <Send size={16} />
                        </button>
                    )}
                </div>
                <p className="text-center text-[10px] text-gray-600 mt-2">Powered by Yukime AI · Shift+Enter for new line</p>
            </div>
        </div>
    );
};
