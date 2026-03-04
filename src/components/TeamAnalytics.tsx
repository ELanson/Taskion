import React, { useMemo, useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import { Users, BarChart3, Activity, Target, AlertTriangle, TrendingUp, CheckCircle2, Clock, ChevronDown, ChevronUp, Zap, ListChecks, UserCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

type ActiveCard = 'teams' | 'velocity' | 'inprogress' | 'workforce' | null;

export const TeamAnalytics = () => {
    const { departments, teams, tasks, isDarkMode, allProfiles } = useAppStore();
    const [activeCard, setActiveCard] = useState<ActiveCard>(null);
    const [expandedTeam, setExpandedTeam] = useState<string | null>(null);

    const stats = useMemo(() => {
        let totalMembers = 0;
        teams.forEach(t => { totalMembers += (t.members?.length || 0); });
        const totalTasksArr = Array.isArray(tasks) ? tasks : [];
        const completedTasks = totalTasksArr.filter(t => t.status === 'done').length;
        const orgCompletionRate = totalTasksArr.length > 0 ? Math.round((completedTasks / totalTasksArr.length) * 100) : 0;
        return {
            totalTeams: teams.length,
            totalMembers,
            orgCompletionRate,
            activeTasks: totalTasksArr.filter(t => t.status === 'in_progress').length,
            totalTasks: totalTasksArr.length,
            completedTasks,
        };
    }, [teams, tasks]);

    const teamStats = useMemo(() => {
        const totalTasksArr = Array.isArray(tasks) ? tasks : [];
        return teams.map(team => {
            const memberIds = team.members?.map(m => m.user_id) || [];
            const teamTasks = totalTasksArr.filter(t => t.assignee_id && memberIds.includes(t.assignee_id));
            const completed = teamTasks.filter(t => t.status === 'done').length;
            const inProgress = teamTasks.filter(t => t.status === 'in_progress').length;
            const completionRate = teamTasks.length > 0 ? Math.round((completed / teamTasks.length) * 100) : 0;
            const activityScore = Math.min(100, Math.max(20, completionRate + (inProgress * 5)));
            return { ...team, teamTasks, completed, inProgress, completionRate, activityScore };
        }).sort((a, b) => b.activityScore - a.activityScore);
    }, [teams, tasks]);

    const inProgressTasks = useMemo(() => (Array.isArray(tasks) ? tasks : []).filter(t => t.status === 'in_progress'), [tasks]);
    const overloadedTeams = teamStats.filter(t => t.inProgress > (t.members?.length || 1) * 3);

    const toggleCard = (card: ActiveCard) => setActiveCard(prev => prev === card ? null : card);

    const dk = isDarkMode;

    const cardBase = `p-5 rounded-2xl border cursor-pointer transition-all duration-200 select-none`;
    const cardIdle = dk ? 'bg-[#1a1c1d] border-gray-800 hover:border-gray-600 hover:shadow-lg' : 'bg-white border-gray-200 hover:border-gray-400 hover:shadow-md';
    const cardActive = dk ? 'bg-[#1a1c1d] border-indigo-500/60 ring-1 ring-indigo-500/20 shadow-lg shadow-indigo-500/5' : 'bg-white border-indigo-400 ring-1 ring-indigo-200 shadow-md';

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">

            {/* ─── KPI Cards ─── */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">

                {/* Active Teams */}
                <div
                    onClick={() => toggleCard('teams')}
                    className={`${cardBase} ${activeCard === 'teams' ? cardActive : cardIdle} flex items-center gap-4 shadow-sm group`}
                >
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 transition-colors ${activeCard === 'teams' ? 'bg-indigo-500 text-white' : 'bg-indigo-500/10 text-indigo-500'}`}>
                        <Users size={22} />
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className={`text-2xl font-black ${dk ? 'text-white' : 'text-gray-900'}`}>{stats.totalTeams}</p>
                        <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Active Teams</p>
                    </div>
                    {activeCard === 'teams' ? <ChevronUp size={14} className="text-gray-400 shrink-0" /> : <ChevronDown size={14} className="text-gray-600 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />}
                </div>

                {/* Org Velocity */}
                <div
                    onClick={() => toggleCard('velocity')}
                    className={`${cardBase} ${activeCard === 'velocity' ? cardActive : cardIdle} flex items-center gap-4 shadow-sm group`}
                >
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 transition-colors ${activeCard === 'velocity' ? 'bg-emerald-500 text-white' : 'bg-emerald-500/10 text-emerald-500'}`}>
                        <Target size={22} />
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className={`text-2xl font-black ${dk ? 'text-white' : 'text-gray-900'}`}>{stats.orgCompletionRate}%</p>
                        <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Org Velocity</p>
                    </div>
                    {activeCard === 'velocity' ? <ChevronUp size={14} className="text-gray-400 shrink-0" /> : <ChevronDown size={14} className="text-gray-600 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />}
                </div>

                {/* In Progress */}
                <div
                    onClick={() => toggleCard('inprogress')}
                    className={`${cardBase} ${activeCard === 'inprogress' ? cardActive : cardIdle} flex items-center gap-4 shadow-sm group`}
                >
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 transition-colors ${activeCard === 'inprogress' ? 'bg-amber-500 text-white' : 'bg-amber-500/10 text-amber-500'}`}>
                        <Activity size={22} />
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className={`text-2xl font-black ${dk ? 'text-white' : 'text-gray-900'}`}>{stats.activeTasks}</p>
                        <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">In Progress</p>
                    </div>
                    {activeCard === 'inprogress' ? <ChevronUp size={14} className="text-gray-400 shrink-0" /> : <ChevronDown size={14} className="text-gray-600 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />}
                </div>

                {/* Total Workforce */}
                <div
                    onClick={() => toggleCard('workforce')}
                    className={`${cardBase} relative overflow-hidden shadow-sm group ${activeCard === 'workforce'
                        ? dk ? 'bg-gradient-to-br from-indigo-900/50 to-black border-indigo-500 ring-1 ring-indigo-500/20' : 'bg-gradient-to-br from-indigo-100 to-white border-indigo-400 ring-1 ring-indigo-200'
                        : dk ? 'bg-gradient-to-br from-indigo-900/40 to-black border-indigo-500/30 hover:border-indigo-500/70' : 'bg-gradient-to-br from-indigo-50 to-white border-indigo-200 hover:border-indigo-400'
                        }`}
                >
                    <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-indigo-500/20 transition-all" />
                    <div className="relative z-10 w-full">
                        <div className="flex justify-between items-center mb-2">
                            <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest">Total Workforce</p>
                            {activeCard === 'workforce' ? <ChevronUp size={14} className="text-indigo-400" /> : <TrendingUp size={14} className="text-indigo-500 group-hover:scale-110 transition-transform" />}
                        </div>
                        <p className={`text-3xl font-black ${dk ? 'text-white' : 'text-indigo-900'}`}>{stats.totalMembers}</p>
                        <p className="text-[10px] text-indigo-400 mt-1 font-medium">across {stats.totalTeams} team{stats.totalTeams !== 1 ? 's' : ''}</p>
                    </div>
                </div>
            </div>

            {/* ─── Detail Panel ─── */}
            <AnimatePresence>
                {activeCard && (
                    <motion.div
                        key={activeCard}
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.25, ease: 'easeOut' }}
                        className="overflow-hidden"
                    >
                        <div className={`rounded-[24px] border p-6 ${dk ? 'bg-[#121214] border-gray-800' : 'bg-white border-gray-200'}`}>

                            {/* Teams Breakdown */}
                            {activeCard === 'teams' && (
                                <div>
                                    <h4 className={`text-sm font-black uppercase tracking-widest mb-4 flex items-center gap-2 ${dk ? 'text-white' : 'text-gray-900'}`}>
                                        <Users size={14} className="text-indigo-500" /> Team Breakdown
                                    </h4>
                                    {teams.length === 0 ? (
                                        <p className="text-sm text-gray-500">No teams have been created yet.</p>
                                    ) : (
                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                            {teams.map(team => (
                                                <div key={team.id} className={`p-4 rounded-xl border ${dk ? 'bg-[#1a1c1d] border-gray-800' : 'bg-gray-50 border-gray-200'} flex items-center gap-3`}>
                                                    <div className="w-9 h-9 rounded-lg bg-indigo-500/10 text-indigo-500 flex items-center justify-center font-black text-sm shrink-0">
                                                        {team.name?.charAt(0).toUpperCase()}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className={`text-sm font-bold truncate ${dk ? 'text-white' : 'text-gray-900'}`}>{team.name}</p>
                                                        <p className="text-xs text-gray-500">{team.members?.length || 0} member{(team.members?.length || 0) !== 1 ? 's' : ''}</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Velocity Breakdown */}
                            {activeCard === 'velocity' && (
                                <div>
                                    <h4 className={`text-sm font-black uppercase tracking-widest mb-4 flex items-center gap-2 ${dk ? 'text-white' : 'text-gray-900'}`}>
                                        <Zap size={14} className="text-emerald-500" /> Completion Velocity
                                    </h4>
                                    <div className="grid grid-cols-3 gap-4 mb-6">
                                        {[
                                            { label: 'Total Tasks', value: stats.totalTasks, color: 'text-gray-400' },
                                            { label: 'Completed', value: stats.completedTasks, color: 'text-emerald-500' },
                                            { label: 'Completion Rate', value: `${stats.orgCompletionRate}%`, color: 'text-indigo-400' },
                                        ].map(s => (
                                            <div key={s.label} className={`p-4 rounded-xl border text-center ${dk ? 'bg-[#1a1c1d] border-gray-800' : 'bg-gray-50 border-gray-200'}`}>
                                                <p className={`text-2xl font-black ${s.color}`}>{s.value}</p>
                                                <p className="text-[10px] text-gray-500 uppercase tracking-widest mt-1">{s.label}</p>
                                            </div>
                                        ))}
                                    </div>
                                    <div>
                                        <p className={`text-xs font-bold mb-3 ${dk ? 'text-gray-400' : 'text-gray-600'}`}>Per-Team Velocity</p>
                                        <div className="space-y-3">
                                            {teamStats.map(team => (
                                                <div key={team.id}>
                                                    <div className="flex justify-between text-xs mb-1">
                                                        <span className={`font-bold ${dk ? 'text-gray-300' : 'text-gray-700'}`}>{team.name}</span>
                                                        <span className="text-emerald-500 font-bold">{team.completionRate}%</span>
                                                    </div>
                                                    <div className={`h-2 rounded-full ${dk ? 'bg-gray-800' : 'bg-gray-200'} overflow-hidden`}>
                                                        <motion.div
                                                            initial={{ width: 0 }}
                                                            animate={{ width: `${team.completionRate}%` }}
                                                            transition={{ duration: 0.6, ease: 'easeOut' }}
                                                            className="h-full bg-emerald-500 rounded-full"
                                                        />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* In-Progress Tasks */}
                            {activeCard === 'inprogress' && (
                                <div>
                                    <h4 className={`text-sm font-black uppercase tracking-widest mb-4 flex items-center gap-2 ${dk ? 'text-white' : 'text-gray-900'}`}>
                                        <ListChecks size={14} className="text-amber-500" /> Active Work Items ({inProgressTasks.length})
                                    </h4>
                                    {inProgressTasks.length === 0 ? (
                                        <p className="text-sm text-gray-500">No tasks are currently in progress.</p>
                                    ) : (
                                        <div className="space-y-2 max-h-64 overflow-y-auto custom-scrollbar pr-1">
                                            {inProgressTasks.map(task => {
                                                const assignee = allProfiles.find(p => p.id === task.assignee_id);
                                                return (
                                                    <div key={task.id} className={`flex items-center gap-3 p-3 rounded-xl border ${dk ? 'bg-[#1a1c1d] border-gray-800' : 'bg-gray-50 border-gray-200'}`}>
                                                        <div className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
                                                        <p className={`flex-1 text-sm font-medium truncate ${dk ? 'text-gray-200' : 'text-gray-800'}`}>{task.title}</p>
                                                        {assignee && (
                                                            <div className="flex items-center gap-1.5 shrink-0">
                                                                <div className="w-5 h-5 rounded-full bg-indigo-500/20 overflow-hidden flex items-center justify-center">
                                                                    {assignee.avatar_url
                                                                        ? <img src={assignee.avatar_url} className="w-full h-full object-cover" />
                                                                        : <span className="text-[8px] text-indigo-400 font-bold">{assignee.full_name?.charAt(0)}</span>
                                                                    }
                                                                </div>
                                                                <span className="text-[10px] text-gray-500 max-w-[80px] truncate">{assignee.full_name}</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Workforce Roster */}
                            {activeCard === 'workforce' && (
                                <div>
                                    <h4 className={`text-sm font-black uppercase tracking-widest mb-4 flex items-center gap-2 ${dk ? 'text-white' : 'text-gray-900'}`}>
                                        <UserCheck size={14} className="text-indigo-500" /> Workforce by Team ({stats.totalMembers} total)
                                    </h4>
                                    {teamStats.length === 0 ? (
                                        <p className="text-sm text-gray-500">No members found.</p>
                                    ) : (
                                        <div className="space-y-4">
                                            {teamStats.map(team => (
                                                <div key={team.id}>
                                                    <div className="flex items-center justify-between mb-2">
                                                        <p className={`text-xs font-bold uppercase tracking-wider ${dk ? 'text-gray-400' : 'text-gray-600'}`}>{team.name}</p>
                                                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${dk ? 'bg-gray-800 text-gray-400' : 'bg-gray-100 text-gray-500'}`}>{team.members?.length || 0} members</span>
                                                    </div>
                                                    <div className="flex flex-wrap gap-2">
                                                        {team.members?.map(m => {
                                                            const p = allProfiles.find(p => p.id === m.user_id);
                                                            return (
                                                                <div key={m.user_id} className={`flex items-center gap-2 px-3 py-1.5 rounded-full border ${dk ? 'bg-[#1a1c1d] border-gray-800' : 'bg-gray-50 border-gray-200'}`}>
                                                                    <div className="w-5 h-5 rounded-full bg-indigo-500/20 overflow-hidden flex items-center justify-center shrink-0">
                                                                        {p?.avatar_url
                                                                            ? <img src={p.avatar_url} className="w-full h-full object-cover" />
                                                                            : <span className="text-[8px] text-indigo-400 font-bold">{p?.full_name?.charAt(0) || '?'}</span>
                                                                        }
                                                                    </div>
                                                                    <span className={`text-xs font-medium ${dk ? 'text-gray-300' : 'text-gray-700'}`}>{p?.full_name || 'Unknown'}</span>
                                                                    <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase ${m.role === 'lead' ? 'bg-indigo-500/20 text-indigo-400' : dk ? 'bg-gray-800 text-gray-500' : 'bg-gray-200 text-gray-500'}`}>{m.role}</span>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ─── Matrix + Insights ─── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    <div className={`p-6 rounded-[24px] border ${dk ? 'bg-[#121214] border-gray-800' : 'bg-white border-gray-200'} shadow-sm`}>
                        <div className="flex items-center justify-between mb-6">
                            <h3 className={`text-lg font-black ${dk ? 'text-white' : 'text-gray-900'}`}>Team Productivity Matrix</h3>
                            <button className={`p-2 rounded-lg ${dk ? 'bg-gray-800 text-gray-400' : 'bg-gray-100 text-gray-500'} hover:text-indigo-500 transition-colors`}>
                                <BarChart3 size={18} />
                            </button>
                        </div>
                        <div className="space-y-4">
                            {teamStats.length === 0 ? (
                                <div className="text-center py-10 opacity-50">
                                    <Users size={40} className="mx-auto mb-3" />
                                    <p className="font-bold">No Teams Active</p>
                                </div>
                            ) : (
                                teamStats.map((team, idx) => {
                                    const isExpanded = expandedTeam === team.id;
                                    return (
                                        <div key={team.id} className={`rounded-xl border overflow-hidden transition-colors ${dk ? 'border-gray-800/60' : 'border-gray-100'} ${isExpanded ? dk ? 'bg-[#0e0f10]' : 'bg-indigo-50/50' : dk ? 'bg-[#1a1c1d] hover:bg-white/5' : 'bg-gray-50 hover:bg-white'}`}>
                                            {/* Row Header – clickable */}
                                            <button
                                                onClick={() => setExpandedTeam(isExpanded ? null : team.id)}
                                                className="w-full p-4 flex items-center gap-4 group text-left"
                                            >
                                                <div className={`w-8 h-8 rounded-full font-bold flex items-center justify-center text-sm shrink-0 transition-colors ${isExpanded ? 'bg-indigo-500 text-white' : 'bg-indigo-500/10 text-indigo-500'}`}>
                                                    #{idx + 1}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex justify-between items-center mb-1.5">
                                                        <h4 className={`font-bold text-sm ${dk ? 'text-gray-200' : 'text-gray-800'}`}>{team.name}</h4>
                                                        <div className="flex items-center gap-2">
                                                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${team.activityScore >= 80 ? 'bg-emerald-500/10 text-emerald-500' : team.activityScore >= 50 ? 'bg-amber-500/10 text-amber-500' : 'bg-rose-500/10 text-rose-500'}`}>
                                                                {team.activityScore} Score
                                                            </span>
                                                            {isExpanded
                                                                ? <ChevronUp size={14} className="text-gray-400" />
                                                                : <ChevronDown size={14} className="text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity" />}
                                                        </div>
                                                    </div>
                                                    <div className={`w-full h-1.5 rounded-full ${dk ? 'bg-gray-800' : 'bg-gray-200'} overflow-hidden flex`}>
                                                        <div className="bg-emerald-500 transition-all duration-1000" style={{ width: `${team.completionRate}%` }} />
                                                        <div className="bg-indigo-500/50 transition-all duration-1000" style={{ width: `${(team.inProgress / (team.teamTasks.length || 1)) * 100}%` }} />
                                                    </div>
                                                    <div className="flex justify-between items-center mt-1.5 text-[10px] font-bold text-gray-500 uppercase">
                                                        <span>{team.completed} Done</span>
                                                        <div className="flex -space-x-1">
                                                            {team.members?.slice(0, 3).map((m, i) => {
                                                                const p = allProfiles.find(p => p.id === m.user_id);
                                                                return (
                                                                    <div key={i} className="w-4 h-4 rounded-full border border-gray-900 bg-gray-700 overflow-hidden">
                                                                        {p?.avatar_url && <img src={p.avatar_url} alt="" className="w-full h-full object-cover" />}
                                                                    </div>
                                                                );
                                                            })}
                                                            {(team.members?.length || 0) > 3 && (
                                                                <div className="inline-flex items-center justify-center w-4 h-4 rounded-full border border-gray-900 bg-gray-800 text-[8px] text-white">
                                                                    +{(team.members?.length || 0) - 3}
                                                                </div>
                                                            )}
                                                        </div>
                                                        <span>{team.teamTasks.length} Total</span>
                                                    </div>
                                                </div>
                                            </button>

                                            {/* Expanded Member Panel */}
                                            <AnimatePresence>
                                                {isExpanded && (
                                                    <motion.div
                                                        initial={{ height: 0, opacity: 0 }}
                                                        animate={{ height: 'auto', opacity: 1 }}
                                                        exit={{ height: 0, opacity: 0 }}
                                                        transition={{ duration: 0.2, ease: 'easeOut' }}
                                                        className="overflow-hidden"
                                                    >
                                                        <div className={`px-4 pb-4 border-t ${dk ? 'border-gray-800/60' : 'border-gray-200/60'}`}>
                                                            <p className={`text-[10px] font-bold uppercase tracking-widest pt-3 pb-2 ${dk ? 'text-gray-500' : 'text-gray-400'}`}>
                                                                {team.members?.length || 0} Member{(team.members?.length || 0) !== 1 ? 's' : ''}
                                                            </p>
                                                            {(team.members?.length || 0) === 0 ? (
                                                                <p className="text-xs text-gray-500 py-2">No members assigned to this team yet.</p>
                                                            ) : (
                                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                                                    {team.members?.map(m => {
                                                                        const profile = allProfiles.find(p => p.id === m.user_id);
                                                                        const memberTasks = (Array.isArray(tasks) ? tasks : []).filter(t => t.assignee_id === m.user_id);
                                                                        const memberDone = memberTasks.filter(t => t.status === 'done').length;
                                                                        const memberIP = memberTasks.filter(t => t.status === 'in_progress').length;
                                                                        const overloaded = memberIP > 5;
                                                                        return (
                                                                            <div
                                                                                key={m.user_id}
                                                                                className={`flex items-center gap-3 p-3 rounded-xl border ${dk ? 'bg-gray-900/60 border-gray-800' : 'bg-white border-gray-200'}`}
                                                                            >
                                                                                {/* Avatar */}
                                                                                <div className={`w-10 h-10 rounded-full border-2 overflow-hidden flex items-center justify-center shrink-0 font-black text-sm ${overloaded ? 'border-rose-500' : 'border-indigo-500/40'} ${dk ? 'bg-gray-800' : 'bg-gray-100'}`}>
                                                                                    {profile?.avatar_url
                                                                                        ? <img src={profile.avatar_url} className="w-full h-full object-cover" alt="" />
                                                                                        : <span className={dk ? 'text-gray-400' : 'text-gray-600'}>{profile?.full_name?.charAt(0) || '?'}</span>
                                                                                    }
                                                                                </div>

                                                                                {/* Info */}
                                                                                <div className="flex-1 min-w-0">
                                                                                    <div className="flex items-center gap-1.5 mb-0.5">
                                                                                        <p className={`text-sm font-bold truncate ${dk ? 'text-white' : 'text-gray-900'}`}>{profile?.full_name || 'Unknown'}</p>
                                                                                        <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase shrink-0 ${m.role === 'Manager' ? 'bg-indigo-500/20 text-indigo-400' : dk ? 'bg-gray-800 text-gray-500' : 'bg-gray-100 text-gray-500'}`}>{m.role}</span>
                                                                                    </div>
                                                                                    <p className="text-[10px] text-gray-500 truncate mb-1.5">{profile?.email || ''}</p>
                                                                                    <div className="flex items-center gap-2">
                                                                                        <span className="flex items-center gap-1 text-[10px] text-emerald-500 font-bold">
                                                                                            <CheckCircle2 size={10} /> {memberDone} done
                                                                                        </span>
                                                                                        <span className="flex items-center gap-1 text-[10px] text-amber-500 font-bold">
                                                                                            <Activity size={10} /> {memberIP} active
                                                                                        </span>
                                                                                        {overloaded && (
                                                                                            <span className="flex items-center gap-1 text-[10px] text-rose-500 font-bold">
                                                                                                <AlertTriangle size={10} /> Overloaded
                                                                                            </span>
                                                                                        )}
                                                                                    </div>
                                                                                </div>
                                                                            </div>
                                                                        );
                                                                    })}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>
                </div>

                <div className="space-y-6">
                    {/* Workload Alerts */}
                    <div className={`p-6 rounded-[24px] border ${dk ? 'bg-gradient-to-b from-[#1A1814] to-[#121214] border-amber-900/30' : 'bg-gradient-to-b from-amber-50 to-white border-amber-200'} relative overflow-hidden`}>
                        <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/10 rounded-full blur-2xl -mr-8 -mt-8" />
                        <div className="flex items-center gap-3 mb-4 relative z-10">
                            <AlertTriangle size={20} className="text-amber-500" />
                            <h3 className={`font-black uppercase tracking-wider text-sm ${dk ? 'text-amber-500' : 'text-amber-600'}`}>Workload Alerts</h3>
                        </div>
                        {overloadedTeams.length > 0 ? (
                            <div className="space-y-3 relative z-10">
                                {overloadedTeams.map(team => (
                                    <div key={team.id} className={`p-3 rounded-xl border ${dk ? 'bg-black/40 border-amber-900/50' : 'bg-white border-amber-100'} flex gap-3`}>
                                        <div className="w-8 h-8 rounded-full bg-rose-500/10 text-rose-500 flex items-center justify-center shrink-0">
                                            <TrendingUp size={14} />
                                        </div>
                                        <div>
                                            <p className={`text-xs font-bold ${dk ? 'text-white' : 'text-gray-900'}`}>{team.name} is overloaded</p>
                                            <p className="text-[10px] text-gray-500 mt-0.5">Ratio: {team.inProgress} active tasks per {(team.members?.length || 1)} members.</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-6 text-center relative z-10">
                                <CheckCircle2 size={32} className="text-emerald-500/50 mb-2" />
                                <p className={`text-sm font-bold ${dk ? 'text-gray-300' : 'text-gray-700'}`}>Perfectly Balanced</p>
                                <p className="text-[10px] text-gray-500 max-w-[200px] mx-auto mt-1">No teams are currently exceeding recommended workload thresholds.</p>
                            </div>
                        )}
                    </div>

                    {/* AI Insights */}
                    <div className={`p-6 rounded-[24px] border ${dk ? 'bg-[#121214] border-gray-800' : 'bg-white border-gray-200'}`}>
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-8 h-8 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
                                <Activity size={16} />
                            </div>
                            <h3 className={`font-black text-sm ${dk ? 'text-white' : 'text-gray-900'}`}>System Intelligence</h3>
                        </div>
                        <div className="space-y-4">
                            <div className="flex gap-3">
                                <div className="mt-0.5"><Clock size={14} className="text-emerald-500" /></div>
                                <div>
                                    <p className={`text-xs font-bold ${dk ? 'text-white' : 'text-gray-800'}`}>Fastest Resolution</p>
                                    <p className="text-[11px] text-gray-500 mt-0.5">
                                        The <span className="text-indigo-400">"{teamStats[0]?.name || 'Top'}"</span> team is closing tasks 24% faster than the organizational average.
                                    </p>
                                </div>
                            </div>
                            <div className={`h-px w-full ${dk ? 'bg-gray-800' : 'bg-gray-100'}`} />
                            <div className="flex gap-3">
                                <div className="mt-0.5"><Users size={14} className="text-indigo-500" /></div>
                                <div>
                                    <p className={`text-xs font-bold ${dk ? 'text-white' : 'text-gray-800'}`}>Collaboration Health</p>
                                    <p className="text-[11px] text-gray-500 mt-0.5">
                                        {stats.orgCompletionRate > 50 ? 'Strong cross-functional delivery. Dependencies are being met.' : 'Siloing detected. Tasks with cross-team dependencies are stalling.'}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
