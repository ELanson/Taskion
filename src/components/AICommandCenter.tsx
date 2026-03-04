import React from 'react';
import { Sparkles, Brain, Target, Building2, TrendingUp, AlertTriangle } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { useMemo } from 'react';

export const AICommandCenter: React.FC = () => {
    const { isDarkMode, tasks, departments, teams, allProfiles } = useAppStore();

    const analytics = useMemo(() => {
        const completedTasks = tasks.filter(t => t.status === 'done');
        const activeTasks = tasks.filter(t => t.status === 'in_progress');
        const completionRate = tasks.length > 0 ? Math.round((completedTasks.length / tasks.length) * 100) : 0;

        let healthLabel = 'Neutral';
        let healthColor = 'text-gray-500';
        if (completionRate >= 80) { healthLabel = 'Excellent'; healthColor = 'text-emerald-400'; }
        else if (completionRate >= 50) { healthLabel = 'Good'; healthColor = 'text-indigo-400'; }
        else if (completionRate > 0) { healthLabel = 'Needs Attention'; healthColor = 'text-amber-400'; }
        else { healthLabel = 'No Data'; healthColor = 'text-gray-400'; }

        const userToDept: Record<string, string> = {};
        const userToTeam: Record<string, string> = {};
        teams.forEach(t => {
            t.members?.forEach((m: any) => {
                userToTeam[m.user_id] = t.name;
                const dept = departments.find(d => d.id === t.department_id);
                if (dept) userToDept[m.user_id] = dept.name;
            });
        });

        const deptCompletions: Record<string, number> = {};
        const teamActiveTasks: Record<string, number> = {};
        const userCompletions: Record<string, number> = {};

        tasks.forEach(task => {
            if (task.assignee_id) {
                const deptName = userToDept[task.assignee_id];
                const teamName = userToTeam[task.assignee_id];

                if (task.status === 'done') {
                    if (deptName) deptCompletions[deptName] = (deptCompletions[deptName] || 0) + 1;
                    userCompletions[task.assignee_id] = (userCompletions[task.assignee_id] || 0) + 1;
                } else if (task.status === 'in_progress' || task.status === 'todo') {
                    if (teamName) teamActiveTasks[teamName] = (teamActiveTasks[teamName] || 0) + 1;
                }
            }
        });

        // Top Departments
        const sortedDepts = Object.entries(deptCompletions).sort((a, b) => b[1] - a[1]);
        let topDeptName = 'Depts', topDeptStats = 'No data', velocityMetric = 'N/A';
        if (sortedDepts.length >= 2) {
            topDeptName = `${sortedDepts[0][0].substring(0, 5)} vs ${sortedDepts[1][0].substring(0, 5)}`;
            const diff = Math.round(((sortedDepts[0][1] - sortedDepts[1][1]) / (sortedDepts[1][1] || 1)) * 100);
            velocityMetric = `+${diff}%`;
            topDeptStats = `${sortedDepts[0][0]} higher`;
        } else if (sortedDepts.length === 1) {
            topDeptName = sortedDepts[0][0];
            velocityMetric = `${sortedDepts[0][1]} Tasks`;
            topDeptStats = 'Leading department';
        }

        // Burnout Risk (Teams)
        const sortedTeams = Object.entries(teamActiveTasks).sort((a, b) => b[1] - a[1]);
        const highRiskTeams = sortedTeams.filter(t => t[1] > 3);
        const burnoutAlert = highRiskTeams.length > 0 ? `${highRiskTeams.length} Teams` : 'None';
        const burnoutDetails = highRiskTeams.length > 0 ? highRiskTeams.map(t => t[0]).join(', ') : 'Healthy load';

        // Talent (Users)
        const sortedUsers = Object.entries(userCompletions).sort((a, b) => b[1] - a[1]);
        let topPerformer = null;
        if (sortedUsers.length > 0) {
            topPerformer = allProfiles.find(p => p.id === sortedUsers[0][0]);
        }

        return {
            completionRate,
            healthLabel,
            healthColor,
            topDeptName,
            velocityMetric,
            topDeptStats,
            burnoutAlert,
            burnoutDetails,
            topPerformer: topPerformer ? { name: topPerformer.name, count: sortedUsers[0][1] } : null,
            overloadedTeam: sortedTeams.length > 0 && sortedTeams[0][1] > 0 ? sortedTeams[0] : null
        };
    }, [tasks, departments, teams, allProfiles]);

    return (
        <div className="space-y-6 animate-in fade-in duration-300">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-200 dark:border-gray-800 pb-6 mb-6">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-indigo-500 text-white shadow-lg shadow-indigo-500/30">
                        <Brain size={24} />
                    </div>
                    <div>
                        <h2 className={`text-2xl font-black ${isDarkMode ? 'text-white' : 'text-gray-900'} tracking-tight`}>AI Command Center</h2>
                        <p className="text-gray-500 text-sm mt-1">Global strategic intelligence and organizational health</p>
                    </div>
                </div>
            </div>

            <div className="space-y-6">

                {/* Organizational Overview */}
                <div className={`${isDarkMode ? 'bg-[#121214] border-gray-800' : 'bg-white border-gray-100'} rounded-[20px] border shadow-sm p-6`}>
                    <h3 className={`font-bold tracking-wide mb-6 flex items-center gap-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}><Building2 size={18} /> Cross-Department Analytics</h3>

                    <div className="grid grid-cols-2 gap-4 mb-8">
                        <div className={`p-4 rounded-xl border ${isDarkMode ? 'border-gray-800 bg-[#1a1c1d]' : 'border-gray-100 bg-gray-50'}`}>
                            <p className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-1 truncate" title={analytics.topDeptName}>{analytics.topDeptName}</p>
                            <p className={`text-xl font-black ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{analytics.velocityMetric}</p>
                            <p className="text-[10px] text-emerald-500 font-bold mt-1 truncate" title={analytics.topDeptStats}>{analytics.topDeptStats}</p>
                        </div>
                        <div className={`p-4 rounded-xl border ${isDarkMode ? 'border-gray-800 bg-[#1a1c1d]' : 'border-gray-100 bg-gray-50'}`}>
                            <p className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-1">Global Health</p>
                            <p className={`text-xl font-black ${analytics.healthColor}`}>{analytics.healthLabel}</p>
                            <p className="text-[10px] text-gray-500 font-bold mt-1">{analytics.completionRate}% Completion Rate</p>
                        </div>
                        <div className={`p-4 rounded-xl border ${isDarkMode && analytics.burnoutAlert !== 'None' ? 'border-rose-900/40 bg-rose-500/5' : (!isDarkMode && analytics.burnoutAlert !== 'None' ? 'border-rose-100 bg-rose-50' : (isDarkMode ? 'border-gray-800 bg-[#1a1c1d]' : 'border-gray-100 bg-gray-50'))}`}>
                            <p className={`${analytics.burnoutAlert !== 'None' ? 'text-rose-500' : 'text-emerald-500'} text-xs font-bold uppercase tracking-wider mb-1`}>Burnout Risk</p>
                            <p className={`text-xl font-black ${analytics.burnoutAlert !== 'None' ? 'text-rose-500' : (isDarkMode ? 'text-white' : 'text-gray-900')}`}>{analytics.burnoutAlert}</p>
                            <p className={`text-[10px] font-bold mt-1 truncate ${analytics.burnoutAlert !== 'None' ? 'text-rose-500/80' : 'text-emerald-500/80'}`} title={analytics.burnoutDetails}>{analytics.burnoutDetails}</p>
                        </div>
                        <div className={`p-4 rounded-xl border ${isDarkMode ? 'border-gray-800 bg-[#1a1c1d]' : 'border-gray-100 bg-gray-50'}`}>
                            <p className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-1">Silo Score</p>
                            <p className={`text-xl font-black ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Low</p>
                            <p className="text-[10px] text-indigo-400 font-bold mt-1">Good cross-collaboration</p>
                        </div>
                    </div>

                    <h4 className={`text-sm font-bold tracking-wide mb-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Strategic Suggestions</h4>
                    <div className="space-y-3">
                        <div className={`flex items-start gap-4 p-4 rounded-xl border ${isDarkMode ? 'bg-indigo-500/10 border-indigo-500/20' : 'bg-indigo-50 border-indigo-100'}`}>
                            <div className="p-2 rounded-full bg-indigo-500/20 text-indigo-500 mt-1">
                                <Sparkles size={16} />
                            </div>
                            <div>
                                <p className={`text-sm font-bold ${isDarkMode ? 'text-indigo-100' : 'text-indigo-900'}`}>
                                    {analytics.overloadedTeam ? 'Load Balancing Required' : 'Maintain Current Pace'}
                                </p>
                                <p className={`text-xs mt-1 leading-relaxed ${isDarkMode ? 'text-indigo-300' : 'text-indigo-700'}`}>
                                    {analytics.overloadedTeam
                                        ? `"${analytics.overloadedTeam[0]}" currently has ${analytics.overloadedTeam[1]} active tasks. Consider redistributing some lower-priority tasks to other teams to prevent delays.`
                                        : "Task distribution looks healthy across active teams. No immediate restructures recommended."}
                                </p>
                                {analytics.overloadedTeam && (
                                    <button className="mt-3 px-4 py-1.5 text-xs font-bold rounded-lg bg-indigo-500 text-white hover:bg-indigo-600 transition-colors">
                                        Review Assignments
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Talent Intelligence */}
                <div className={`${isDarkMode ? 'bg-[#121214] border-gray-800' : 'bg-white border-gray-100'} rounded-[20px] border shadow-sm p-6`}>
                    <h3 className={`font-bold tracking-wide mb-6 flex items-center gap-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}><Target size={18} /> Talent Intelligence</h3>

                    <div className="space-y-4">
                        <div className="p-4 rounded-xl border border-transparent dark:border-gray-800 bg-gray-50 dark:bg-[#1a1c1d]">
                            <p className="text-xs font-bold text-emerald-500 uppercase tracking-wider mb-2 flex items-center gap-1"><TrendingUp size={12} /> Top Performer</p>
                            <p className={`text-sm font-bold ${isDarkMode ? 'text-gray-200' : 'text-gray-900'}`}>
                                {analytics.topPerformer ? `Recognize ${analytics.topPerformer.name}` : 'Awaiting Data'}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                                {analytics.topPerformer
                                    ? `Leading the organization with ${analytics.topPerformer.count} completed tasks. Consistency is excellent.`
                                    : 'Complete more tasks to generate talent insights.'}
                            </p>
                        </div>

                        {analytics.overloadedTeam && analytics.overloadedTeam[1] >= 5 && (
                            <div className="p-4 rounded-xl border border-rose-500/20 dark:border-rose-900/40 bg-rose-50 dark:bg-rose-500/5 relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-4 opacity-10">
                                    <AlertTriangle size={32} className="text-rose-500" />
                                </div>
                                <p className="text-xs font-bold text-rose-500 uppercase tracking-wider mb-2 flex items-center gap-1 relative z-10"><AlertTriangle size={12} /> Bottleneck Warning</p>
                                <p className={`text-sm font-bold ${isDarkMode ? 'text-gray-200' : 'text-gray-900'} relative z-10`}>{analytics.overloadedTeam[0]} is severely overloaded</p>
                                <p className="text-xs text-gray-500 mt-1 relative z-10">Capacity limit exceeded based on active ticket volume ({analytics.overloadedTeam[1]} tasks).</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
