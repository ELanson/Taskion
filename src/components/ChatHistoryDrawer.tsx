import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, MoreHorizontal, Pencil, Trash2, Trash } from 'lucide-react';

interface Session {
    id: string;
    title: string;
    updated_at: string;
}

interface ChatHistoryDrawerProps {
    sessions: Session[];
    activeId: string | null;
    isDarkMode: boolean;
    onSelect: (id: string) => void;
    onRename: (id: string, newTitle: string) => void;
    onDelete: (id: string) => void;
    onDeleteAll: () => void;
    onClose: () => void;
}

export function ChatHistoryDrawer({
    sessions, activeId, isDarkMode, onSelect, onRename, onDelete, onDeleteAll, onClose,
}: ChatHistoryDrawerProps) {
    const [openMenuId, setOpenMenuId] = useState<string | null>(null);
    const [renamingId, setRenamingId] = useState<string | null>(null);
    const [renameValue, setRenameValue] = useState('');
    const renameRef = useRef<HTMLInputElement>(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClick = (e: MouseEvent) => {
            const target = e.target as HTMLElement;
            if (!target.closest('[data-menu]')) setOpenMenuId(null);
        };
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, []);

    useEffect(() => {
        if (renamingId && renameRef.current) renameRef.current.focus();
    }, [renamingId]);

    const startRename = (session: Session) => {
        setOpenMenuId(null);
        setRenamingId(session.id);
        setRenameValue(session.title || 'Conversation');
    };

    const commitRename = (id: string) => {
        if (renameValue.trim()) onRename(id, renameValue.trim());
        setRenamingId(null);
    };

    const dk = isDarkMode;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ x: '-100%', opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: '-100%', opacity: 0 }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                className={`absolute inset-x-0 bottom-0 top-[88px] z-20 flex flex-col
          ${dk ? 'bg-[#121214]/95 backdrop-blur-xl border-gray-800' : 'bg-white/95 backdrop-blur-xl border-gray-200'} border-r`}
            >
                {/* Header */}
                <div className={`p-4 border-b ${dk ? 'border-gray-800' : 'border-gray-100'} flex items-center justify-between gap-2`}>
                    <h4 className={`text-xs font-black uppercase tracking-widest ${dk ? 'text-gray-400' : 'text-gray-500'}`}>
                        Recent Conversations
                    </h4>
                    <div className="flex items-center gap-1">
                        {sessions.length > 0 && (
                            <button
                                onClick={onDeleteAll}
                                title="Delete all history"
                                className={`p-1.5 rounded-lg transition-colors ${dk ? 'text-gray-500 hover:text-red-400 hover:bg-red-500/10' : 'text-gray-400 hover:text-red-500 hover:bg-red-50'}`}
                            >
                                <Trash size={14} />
                            </button>
                        )}
                        <button onClick={onClose} className="text-gray-500 hover:text-indigo-500 p-1">
                            <Plus className="rotate-45" size={16} />
                        </button>
                    </div>
                </div>

                {/* Session list */}
                <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
                    {sessions.length === 0 ? (
                        <p className="text-sm text-gray-500 text-center py-8 italic">No chat history yet.</p>
                    ) : (
                        sessions.map((session) => (
                            <div
                                key={session.id}
                                className={`group relative flex items-stretch rounded-xl border transition-all
                  ${activeId === session.id
                                        ? (dk ? 'bg-indigo-500/10 border-indigo-500/30' : 'bg-indigo-50 border-indigo-200')
                                        : (dk ? 'bg-[#1A1A1C] border-gray-800 hover:border-gray-700' : 'bg-gray-50 border-gray-100 hover:border-gray-300')
                                    }`}
                            >
                                {/* Main click area */}
                                {renamingId === session.id ? (
                                    <div className="flex-1 p-2 flex items-center">
                                        <input
                                            ref={renameRef}
                                            value={renameValue}
                                            onChange={(e) => setRenameValue(e.target.value)}
                                            onBlur={() => commitRename(session.id)}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') commitRename(session.id);
                                                if (e.key === 'Escape') setRenamingId(null);
                                            }}
                                            className={`w-full text-sm font-bold bg-transparent outline-none border-b
                        ${dk ? 'text-gray-200 border-indigo-500' : 'text-gray-800 border-indigo-400'}`}
                                        />
                                    </div>
                                ) : (
                                    <button
                                        onClick={() => onSelect(session.id)}
                                        className={`flex-1 text-left p-3 pr-1 min-w-0
                      ${activeId === session.id
                                                ? (dk ? 'text-indigo-300' : 'text-indigo-700')
                                                : (dk ? 'text-gray-300' : 'text-gray-600')
                                            }`}
                                    >
                                        <p className="text-sm font-bold truncate mb-0.5">{session.title || 'Conversation'}</p>
                                        <p className="text-[10px] opacity-60 uppercase tracking-widest font-mono">
                                            {new Date(session.updated_at).toLocaleDateString()}
                                        </p>
                                    </button>
                                )}

                                {/* 3-dot menu button */}
                                <div className="relative flex items-center pr-1" data-menu>
                                    <button
                                        data-menu
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setOpenMenuId(prev => prev === session.id ? null : session.id);
                                        }}
                                        className={`p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-all
                      ${dk ? 'text-gray-500 hover:text-gray-300 hover:bg-gray-700/60' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-200/60'}
                      ${openMenuId === session.id ? 'opacity-100' : ''}`}
                                        title="More options"
                                    >
                                        <MoreHorizontal size={15} />
                                    </button>

                                    {/* Dropdown */}
                                    <AnimatePresence>
                                        {openMenuId === session.id && (
                                            <motion.div
                                                data-menu
                                                initial={{ opacity: 0, scale: 0.9, y: -4 }}
                                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                                exit={{ opacity: 0, scale: 0.9, y: -4 }}
                                                transition={{ duration: 0.12 }}
                                                className={`absolute right-0 top-full mt-1 z-50 min-w-[130px] rounded-xl shadow-xl border
                          ${dk ? 'bg-[#1E1E21] border-gray-700 shadow-black/40' : 'bg-white border-gray-200 shadow-gray-200/60'}`}
                                            >
                                                <button
                                                    data-menu
                                                    onClick={() => startRename(session)}
                                                    className={`flex items-center gap-2 w-full text-left px-3 py-2.5 text-sm rounded-t-xl transition-colors
                            ${dk ? 'text-gray-300 hover:bg-white/5' : 'text-gray-700 hover:bg-gray-50'}`}
                                                >
                                                    <Pencil size={13} /> Rename
                                                </button>
                                                <div className={`h-px mx-2 ${dk ? 'bg-gray-700' : 'bg-gray-100'}`} />
                                                <button
                                                    data-menu
                                                    onClick={() => {
                                                        setOpenMenuId(null);
                                                        onDelete(session.id);
                                                    }}
                                                    className={`flex items-center gap-2 w-full text-left px-3 py-2.5 text-sm rounded-b-xl transition-colors
                            ${dk ? 'text-red-400 hover:bg-red-500/10' : 'text-red-500 hover:bg-red-50'}`}
                                                >
                                                    <Trash2 size={13} /> Delete
                                                </button>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </motion.div>
        </AnimatePresence>
    );
}
