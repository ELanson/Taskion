import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';
import { useAppStore, Notification } from '../store/useAppStore';

const ICON_MAP = {
    success: <CheckCircle2 size={18} className="text-emerald-500" />,
    error: <AlertCircle size={18} className="text-red-500" />,
    warning: <AlertTriangle size={18} className="text-amber-500" />,
    info: <Info size={18} className="text-indigo-500" />
};

const BG_MAP = {
    success: 'bg-emerald-500/10 border-emerald-500/20',
    error: 'bg-red-500/10 border-red-500/20',
    warning: 'bg-amber-500/10 border-amber-500/20',
    info: 'bg-indigo-500/10 border-indigo-500/20'
};

export const NotificationToast = () => {
    const { notifications, removeNotification } = useAppStore();

    return (
        <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-3 pointer-events-none">
            <AnimatePresence mode="popLayout">
                {notifications.map((n) => (
                    <ToastItem key={n.id} notification={n} onRemove={removeNotification} />
                ))}
            </AnimatePresence>
        </div>
    );
};

const ToastItem = ({ notification, onRemove }: { notification: Notification; onRemove: (id: string) => void }) => {
    useEffect(() => {
        const timer = setTimeout(() => {
            onRemove(notification.id);
        }, 5000);
        return () => clearTimeout(timer);
    }, [notification.id, onRemove]);

    return (
        <motion.div
            layout
            initial={{ opacity: 0, x: 20, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
            className={`pointer-events-auto min-w-[320px] max-w-md ${BG_MAP[notification.type]} border backdrop-blur-md rounded-2xl p-4 flex items-start gap-4 shadow-xl shadow-black/20`}
        >
            <div className="mt-0.5 shrink-0">{ICON_MAP[notification.type]}</div>
            <div className="flex-1 mr-2">
                <p className="text-[10px] uppercase font-bold text-gray-500 tracking-widest mb-0.5">
                    {notification.type}
                </p>
                <p className="text-sm text-gray-200 leading-relaxed font-medium">
                    {notification.message}
                </p>
            </div>
            <button
                onClick={() => onRemove(notification.id)}
                className="mt-0.5 text-gray-500 hover:text-white transition-colors"
            >
                <X size={16} />
            </button>
        </motion.div>
    );
};
