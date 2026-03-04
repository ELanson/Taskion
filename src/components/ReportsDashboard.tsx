import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '../store/useAppStore';
import {
    FileText,
    Calendar,
    Clock,
    Briefcase,
    Users,
    Settings2,
    ArrowRight
} from 'lucide-react';

export const ReportsDashboard: React.FC = () => {
    const { isDarkMode, setIsReportBuilderOpen, setActiveReportTemplate } = useAppStore();
    const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);

    const handleOpenBuilder = (templateId: string) => {
        setActiveReportTemplate(templateId);
        setIsReportBuilderOpen(true);
    };

    const reportTypes = [
        {
            id: 'daily',
            title: 'Daily Report',
            description: 'Tasks completed, time tracked, focus score, and overdue items.',
            icon: <Clock size={24} />,
            colorClass: isDarkMode ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' : 'bg-indigo-50 text-indigo-600 border-indigo-100'
        },
        {
            id: 'weekly',
            title: 'Weekly Performance',
            description: 'Productivity trends, completion rates, and bottlenecks overview.',
            icon: <Calendar size={24} />,
            colorClass: isDarkMode ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-emerald-50 text-emerald-600 border-emerald-100'
        },
        {
            id: 'team',
            title: 'Team Report',
            description: 'Team workload, individual contributions, and efficiency scores.',
            icon: <Users size={24} />,
            colorClass: isDarkMode ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : 'bg-amber-50 text-amber-600 border-amber-100'
        },
        {
            id: 'project',
            title: 'Project Report',
            description: 'Progress tracking, time vs estimates, delays, and blockers.',
            icon: <Briefcase size={24} />,
            colorClass: isDarkMode ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' : 'bg-rose-50 text-rose-600 border-rose-100'
        },
        {
            id: 'time',
            title: 'Time Utilization',
            description: 'Deep vs shallow work breakdown, idle time, and meeting load.',
            icon: <FileText size={24} />,
            colorClass: isDarkMode ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' : 'bg-purple-50 text-purple-600 border-purple-100'
        },
        {
            id: 'custom',
            title: 'Custom Report',
            description: 'Manually select metrics, scopes, and AI summary models.',
            icon: <Settings2 size={24} />,
            colorClass: isDarkMode ? 'bg-gray-500/10 text-gray-400 border-gray-500/20' : 'bg-gray-100 text-gray-600 border-gray-200'
        }
    ];

    return (
        <div className="space-y-8 animate-in fade-in duration-300">
            {/* Header */}
            <div>
                <h1 className={`text-3xl font-black ${isDarkMode ? 'text-white' : 'text-gray-900'} tracking-tight mb-2`}>
                    Reports Center
                </h1>
                <p className="text-gray-500 text-sm">
                    Generate multi-mode intelligence reports to understand performance, predict outcomes, and take action.
                </p>
            </div>

            {/* Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {reportTypes.map((report) => (
                    <button
                        key={report.id}
                        onClick={() => handleOpenBuilder(report.id)}
                        className={`text-left group relative overflow-hidden rounded-[24px] border border-transparent 
                            ${isDarkMode ? 'bg-[#121214] hover:border-gray-700' : 'bg-white hover:border-gray-200'} 
                            shadow-sm hover:shadow-xl transition-all duration-300 p-8 flex flex-col`}
                    >
                        {/* Background Effect */}
                        <div className={`absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl opacity-0 group-hover:opacity-20 transition-opacity duration-500 ${report.colorClass.split(' ')[0]}`} />

                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 border ${report.colorClass} shadow-inner transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-3`}>
                            {report.icon}
                        </div>

                        <h3 className={`text-xl font-bold tracking-tight mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                            {report.title}
                        </h3>

                        <p className="text-sm text-gray-500 leading-relaxed mb-6 flex-1">
                            {report.description}
                        </p>

                        <div className={`flex items-center gap-2 text-sm font-bold ${isDarkMode ? 'text-gray-400 group-hover:text-white' : 'text-gray-500 group-hover:text-gray-900'} transition-colors`}>
                            <span>Configure</span>
                            <ArrowRight size={16} className="transform translate-x-0 group-hover:translate-x-1 transition-transform" />
                        </div>
                    </button>
                ))}
            </div>

            {/* Context Widget */}
            <div className={`mt-8 p-6 rounded-[20px] border flex items-center justify-between ${isDarkMode ? 'bg-indigo-500/5 border-indigo-500/20' : 'bg-indigo-50 border-indigo-100'}`}>
                <div>
                    <h4 className={`font-bold mb-1 ${isDarkMode ? 'text-indigo-200' : 'text-indigo-900'}`}>Scheduled Reports</h4>
                    <p className={`text-sm ${isDarkMode ? 'text-indigo-300' : 'text-indigo-700'}`}>You have 2 active automated report deliveries configured.</p>
                </div>
                <button
                    onClick={() => setIsScheduleModalOpen(true)}
                    className="px-4 py-2 font-bold text-sm bg-indigo-500 text-white rounded-xl shadow-lg shadow-indigo-500/20 hover:bg-indigo-600 transition-colors"
                >
                    Manage Schedules
                </button>
            </div>


            {/* Coming Soon Modal */}
            <AnimatePresence>
                {isScheduleModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsScheduleModalOpen(false)}
                            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className={`relative w-full max-w-sm p-8 flex flex-col items-center text-center rounded-[32px] shadow-2xl border ${isDarkMode ? 'bg-[#1a1c1d] border-gray-800' : 'bg-white border-gray-200'}`}
                        >
                            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-6 border ${isDarkMode ? 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400' : 'bg-indigo-50 border-indigo-100 text-indigo-600'}`}>
                                <Calendar size={32} />
                            </div>

                            <h3 className={`text-2xl font-black tracking-tight mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                Coming Soon
                            </h3>

                            <p className={`text-sm leading-relaxed mb-8 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                The <strong className={isDarkMode ? 'text-white' : 'text-gray-900'}>Manage Schedules</strong> feature is under active development. Soon, you'll be able to automate report deliveries straight to your team's inbox!
                            </p>

                            <button
                                onClick={() => setIsScheduleModalOpen(false)}
                                className="w-full py-3 px-6 rounded-xl font-bold bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 hover:bg-indigo-700 transition-colors"
                            >
                                Got it
                            </button>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};
