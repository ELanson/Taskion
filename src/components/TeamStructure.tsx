import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import {
    Users, Building2, ChevronRight, Map, Shield, UserCog, Mail, Search, Plus, X, GripVertical, Edit2, Trash2
} from 'lucide-react';
import { useAppStore, Department, Team } from '../store/useAppStore';

export const TeamStructure: React.FC = () => {
    const { isDarkMode, user, userProfile, isAdmin, departments, teams, allProfiles, createDepartment, createTeam, updateTeam, deleteTeam, moveTeam, fetchAllProfiles, assignUserToTeam, updateGlobalRole } = useAppStore();
    const [activeView, setActiveView] = useState<'org' | 'roles' | 'directory'>('org');

    const [isInitModalOpen, setIsInitModalOpen] = useState(false);
    const [initDeptName, setInitDeptName] = useState('');
    const [isInitializing, setIsInitializing] = useState(false);

    // Compute current user's primary department
    let currentUserDeptId: string | null = null;
    let isGlobalManager = userProfile?.global_role === 'Manager' || userProfile?.global_role === 'Department Admin';
    for (const dept of departments) {
        if (!dept.teams) continue;
        for (const team of dept.teams) {
            if ((team.members || []).some(m => m.user_id === user?.id)) {
                currentUserDeptId = dept.id;
                break;
            }
        }
        if (currentUserDeptId) break;
    }

    // Add Department State
    const [isAddDeptModalOpen, setIsAddDeptModalOpen] = useState(false);
    const [newDeptName, setNewDeptName] = useState('');
    const [isAddingDept, setIsAddingDept] = useState(false);

    // Add Team State
    const [isAddTeamModalOpen, setIsAddTeamModalOpen] = useState(false);
    const [newTeamName, setNewTeamName] = useState('');
    const [selectedDeptIdForTeam, setSelectedDeptIdForTeam] = useState<string | null>(null);
    const [isAddingTeam, setIsAddingTeam] = useState(false);

    // Edit Team State
    const [isEditTeamModalOpen, setIsEditTeamModalOpen] = useState(false);
    const [editingTeam, setEditingTeam] = useState<Team | null>(null);
    const [editTeamName, setEditTeamName] = useState('');
    const [isEditingTeam, setIsEditingTeam] = useState(false);

    // Delete Team State
    const [isDeleteTeamModalOpen, setIsDeleteTeamModalOpen] = useState(false);
    const [teamToDelete, setTeamToDelete] = useState<Team | null>(null);
    const [isDeletingTeam, setIsDeletingTeam] = useState(false);

    // Assign User State
    const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
    const [selectedUserIdForAssign, setSelectedUserIdForAssign] = useState<string | null>(null);
    const [selectedTeamIdForAssign, setSelectedTeamIdForAssign] = useState('');
    const [selectedRoleForAssign, setSelectedRoleForAssign] = useState<'Manager' | 'Contributor' | 'Viewer'>('Contributor');
    const [isAssigning, setIsAssigning] = useState(false);

    useEffect(() => {
        fetchAllProfiles();
    }, [fetchAllProfiles]);

    const handleInitializeOrg = async () => {
        if (!initDeptName.trim()) return;
        setIsInitializing(true);
        const { error } = await createDepartment(initDeptName, 'Core Operations');
        setIsInitializing(false);
        if (!error) {
            setIsInitModalOpen(false);
        }
    };

    const handleAddDepartment = async () => {
        if (!newDeptName.trim()) return;
        setIsAddingDept(true);
        const { error } = await createDepartment(newDeptName, 'New Department');
        setIsAddingDept(false);
        if (!error) {
            setIsAddDeptModalOpen(false);
            setNewDeptName('');
        }
    };

    const handleAddTeam = async () => {
        if (!newTeamName.trim() || !selectedDeptIdForTeam) return;
        setIsAddingTeam(true);
        const { error } = await createTeam(newTeamName, selectedDeptIdForTeam);
        setIsAddingTeam(false);
        if (!error) {
            setIsAddTeamModalOpen(false);
            setNewTeamName('');
            setSelectedDeptIdForTeam(null);
        } else {
            console.error("Team creation error:", error);
            alert("Failed to create team: " + (error.message || JSON.stringify(error)));
        }
    };

    const handleEditTeam = async () => {
        if (!editingTeam || !editTeamName.trim()) return;
        setIsEditingTeam(true);
        const { error } = await updateTeam(editingTeam.id, editTeamName);
        setIsEditingTeam(false);
        if (!error) {
            setIsEditTeamModalOpen(false);
            setEditingTeam(null);
            setEditTeamName('');
        }
    };

    const handleDeleteTeam = async () => {
        if (!teamToDelete) return;
        setIsDeletingTeam(true);
        const { error } = await deleteTeam(teamToDelete.id);
        setIsDeletingTeam(false);
        if (!error) {
            setIsDeleteTeamModalOpen(false);
            setTeamToDelete(null);
        }
    };

    const handleAssignUser = async () => {
        if (!selectedUserIdForAssign || !selectedTeamIdForAssign) return;
        setIsAssigning(true);
        const { error } = await assignUserToTeam(selectedUserIdForAssign, selectedTeamIdForAssign, selectedRoleForAssign);
        setIsAssigning(false);
        if (!error) {
            setIsAssignModalOpen(false);
            setSelectedUserIdForAssign(null);
            setSelectedTeamIdForAssign('');
            setSelectedRoleForAssign('Contributor');
        }
    };

    const handleDragEnd = async (result: any) => {
        if (!result.destination) return;

        const sourceDeptId = result.source.droppableId;
        const destDeptId = result.destination.droppableId;
        const teamId = result.draggableId;

        if (sourceDeptId === destDeptId) {
            // Reordering within the same department (optional depending on needs)
            return;
        }

        // Optimistically update or just rely on the store's update function
        await moveTeam(teamId, destDeptId);
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-300">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-200 dark:border-gray-800 pb-6 mb-6">
                <div>
                    <h2 className={`text-2xl font-black ${isDarkMode ? 'text-white' : 'text-gray-900'} tracking-tight`}>Team Structure</h2>
                    <p className="text-gray-500 text-sm mt-1">Organizational hierarchy and role management</p>
                </div>
                <div className="flex bg-gray-100 dark:bg-[#1a1c1d] rounded-lg p-1">
                    <button
                        onClick={() => setActiveView('org')}
                        className={`px-4 py-2 text-xs font-bold rounded-md transition-all ${activeView === 'org' ? (isDarkMode ? 'bg-gray-800 text-indigo-400 border border-gray-700' : 'bg-white text-indigo-600 shadow-sm border border-gray-200') : 'text-gray-500 hover:text-gray-900 dark:hover:text-gray-300'}`}
                    >
                        Org Chart
                    </button>
                    <button
                        onClick={() => setActiveView('directory')}
                        className={`px-4 py-2 text-xs font-bold rounded-md transition-all ${activeView === 'directory' ? (isDarkMode ? 'bg-gray-800 text-indigo-400 border border-gray-700' : 'bg-white text-indigo-600 shadow-sm border border-gray-200') : 'text-gray-500 hover:text-gray-900 dark:hover:text-gray-300'}`}
                    >
                        Directory
                    </button>
                    <button
                        onClick={() => setActiveView('roles')}
                        className={`px-4 py-2 text-xs font-bold rounded-md transition-all ${activeView === 'roles' ? (isDarkMode ? 'bg-gray-800 text-indigo-400 border border-gray-700' : 'bg-white text-indigo-600 shadow-sm border border-gray-200') : 'text-gray-500 hover:text-gray-900 dark:hover:text-gray-300'}`}
                    >
                        Roles & Permissions
                    </button>
                </div>
            </div>

            {/* Content Area */}
            {activeView === 'org' && (
                <div className={`${isDarkMode ? 'bg-[#121214] border-gray-800' : 'bg-white border-gray-100'} rounded-[20px] border shadow-sm p-8 min-h-[600px] flex items-center justify-center relative overflow-hidden`}>

                    {/* Background Elements */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none"></div>

                    <div className="text-center relative z-10">
                        <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 ${isDarkMode ? 'bg-[#1a1c1d] shadow-indigo-500/10 shadow-xl border border-gray-800' : 'bg-white shadow-xl shadow-indigo-100/50 border border-gray-100'}`}>
                            <Building2 size={32} className="text-indigo-500" />
                        </div>
                        <h3 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'} mb-2`}>Organizational Engine</h3>
                        <p className="text-gray-500 text-sm max-w-md mx-auto mb-8">
                            Map your company structure, visualize cross-team collaboration, and enable AI-driven workforce intelligence.
                        </p>

                        {departments.length === 0 ? (
                            <button
                                onClick={() => setIsInitModalOpen(true)}
                                className={`px-6 py-3 rounded-xl font-bold text-sm text-white bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-600/20 transition-all flex items-center justify-center gap-2 mx-auto`}
                            >
                                <Plus size={18} /> Initialize Organization
                            </button>
                        ) : (
                            <DragDropContext onDragEnd={handleDragEnd}>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto mt-12 text-left">
                                    {departments.map(dept => (
                                        <Droppable droppableId={dept.id} key={dept.id}>
                                            {(provided, snapshot) => (
                                                <div
                                                    ref={provided.innerRef}
                                                    {...provided.droppableProps}
                                                    className={`p-5 rounded-2xl border flex flex-col min-h-[250px] transition-colors ${isDarkMode
                                                        ? (snapshot.isDraggingOver ? 'bg-[#1a1c1] border-indigo-500/50' : 'bg-[#1a1c1d] border-gray-800')
                                                        : (snapshot.isDraggingOver ? 'bg-indigo-50 border-indigo-300' : 'bg-gray-50 border-gray-200')
                                                        }`}
                                                >
                                                    <div className="flex items-center justify-between mb-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className={`p-2 rounded-lg ${isDarkMode ? 'bg-indigo-500/20 text-indigo-400' : 'bg-indigo-100 text-indigo-600'}`}><Building2 size={16} /></div>
                                                            <h4 className={`font-bold ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>{dept.name}</h4>
                                                        </div>
                                                        <button
                                                            onClick={() => {
                                                                setSelectedDeptIdForTeam(dept.id);
                                                                setIsAddTeamModalOpen(true);
                                                            }}
                                                            className={`p-1 rounded hover:bg-black/5 dark:hover:bg-white/5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors`}
                                                        >
                                                            <Plus size={16} />
                                                        </button>
                                                    </div>

                                                    <div className="flex-1 space-y-3">
                                                        {dept.teams?.map((team, index) => (
                                                            <Draggable key={team.id} draggableId={team.id} index={index}>
                                                                {(provided, snapshot) => (
                                                                    <div
                                                                        ref={provided.innerRef}
                                                                        {...provided.draggableProps}
                                                                        className={`group p-3 rounded-xl border flex items-center justify-between ${isDarkMode
                                                                            ? (snapshot.isDragging ? 'bg-indigo-500/10 border-indigo-500 shadow-xl shadow-black/40' : 'bg-[#121214] border-gray-700/50 hover:border-gray-600')
                                                                            : (snapshot.isDragging ? 'bg-white border-indigo-400 shadow-lg' : 'bg-white border-gray-200 hover:border-gray-300')
                                                                            } transition-colors`}
                                                                    >
                                                                        <div className="flex items-center gap-3">
                                                                            <div {...provided.dragHandleProps} className="text-gray-400 cursor-grab active:cursor-grabbing hover:text-gray-600 dark:hover:text-gray-300">
                                                                                <GripVertical size={14} />
                                                                            </div>
                                                                            <div>
                                                                                <div className={`text-sm font-bold ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>{team.name}</div>
                                                                                <div className="text-[10px] text-gray-500 mt-0.5">{team.members?.length || 0} Members</div>
                                                                            </div>
                                                                        </div>
                                                                        {isAdmin ? (
                                                                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                                <button
                                                                                    onClick={(e) => {
                                                                                        e.stopPropagation();
                                                                                        setEditingTeam(team);
                                                                                        setEditTeamName(team.name);
                                                                                        setIsEditTeamModalOpen(true);
                                                                                    }}
                                                                                    className={`p-1.5 rounded-md ${isDarkMode ? 'hover:bg-white/10 text-gray-400 hover:text-white' : 'hover:bg-black/5 text-gray-500 hover:text-black'} transition-colors`}
                                                                                    title="Edit Team"
                                                                                >
                                                                                    <Edit2 size={14} />
                                                                                </button>
                                                                                <button
                                                                                    onClick={(e) => {
                                                                                        e.stopPropagation();
                                                                                        setTeamToDelete(team);
                                                                                        setIsDeleteTeamModalOpen(true);
                                                                                    }}
                                                                                    className={`p-1.5 rounded-md ${isDarkMode ? 'hover:bg-rose-500/20 text-gray-400 hover:text-rose-400' : 'hover:bg-rose-50 text-gray-500 hover:text-rose-600'} transition-colors`}
                                                                                    title="Delete Team"
                                                                                >
                                                                                    <Trash2 size={14} />
                                                                                </button>
                                                                            </div>
                                                                        ) : (
                                                                            <ChevronRight size={14} className="text-gray-500 opacity-50" />
                                                                        )}
                                                                    </div>
                                                                )}
                                                            </Draggable>
                                                        ))}
                                                        {provided.placeholder}
                                                    </div>
                                                </div>
                                            )}
                                        </Droppable>
                                    ))}

                                    <button
                                        onClick={() => setIsAddDeptModalOpen(true)}
                                        className={`p-5 rounded-2xl border border-dashed flex flex-col items-center justify-center gap-3 ${isDarkMode ? 'border-gray-800 hover:bg-[#1a1c1d] text-gray-400' : 'border-gray-300 hover:bg-gray-50 text-gray-500'} transition-colors h-full min-h-[250px]`}
                                    >
                                        <div className={`w-12 h-12 rounded-full flex items-center justify-center ${isDarkMode ? 'bg-gray-800/50' : 'bg-gray-100'}`}>
                                            <Plus size={24} />
                                        </div>
                                        <span className="text-sm font-bold">Add Department</span>
                                    </button>
                                </div>
                            </DragDropContext>
                        )}
                    </div>
                </div>
            )}

            {activeView === 'directory' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {allProfiles.length === 0 && (
                        <div className="col-span-full text-center py-12 text-gray-500 text-sm">Loading directory...</div>
                    )}
                    {allProfiles.map(profile => {
                        // Find user's primary team and department if any
                        let primaryDeptId: string | null = null;
                        let primaryDeptName = 'Unassigned';
                        let primaryTeamName = '';
                        let primaryRole = 'Contributor';

                        // We do a quick lookup through departments to find where the user lives
                        outerLoop: for (const dept of departments) {
                            if (!dept.teams) continue;
                            for (const team of dept.teams) {
                                const memberRecord = (team.members || []).find(m => m.user_id === profile.id);
                                if (memberRecord) {
                                    primaryDeptId = dept.id;
                                    primaryDeptName = dept.name;
                                    primaryTeamName = team.name;
                                    primaryRole = memberRecord.role || 'Contributor';
                                    break outerLoop;
                                }
                            }
                        }

                        return (
                            <div key={profile.id} className={`${isDarkMode ? 'bg-[#121214] border-gray-800' : 'bg-white border-gray-100'} rounded-2xl border shadow-sm p-6 group`}>
                                <div className="flex items-start justify-between mb-4">
                                    {profile.avatar_url ? (
                                        <img src={profile.avatar_url} className="w-12 h-12 rounded-xl object-cover" alt="User" />
                                    ) : (
                                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg ${isDarkMode ? 'bg-indigo-500/20 text-indigo-400' : 'bg-indigo-100 text-indigo-600'}`}>
                                            {(profile.full_name || 'U').charAt(0)}
                                        </div>
                                    )}
                                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md ${isDarkMode ? 'bg-indigo-500/10 text-indigo-400' : 'bg-indigo-50 text-indigo-600'}`}>
                                        {profile.is_admin ? 'Global Admin' : primaryRole}
                                    </span>
                                </div>
                                <h4 className={`font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'} line-clamp-1`}>{profile.full_name || 'Unnamed User'}</h4>
                                <p className="text-xs text-gray-500 mt-1 flex items-center gap-1.5 truncate">
                                    <Building2 size={12} className="shrink-0" /> {primaryDeptName} {primaryTeamName ? `• ${primaryTeamName}` : ''}
                                </p>

                                <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800 flex justify-between items-center">
                                    <div className="flex -space-x-2">
                                        <div className="w-6 h-6 rounded-full bg-emerald-500 border-2 border-white dark:border-[#121214] flex items-center justify-center text-[10px] font-bold text-white z-20" title="Productivity Score">{profile.productivity_score || 0}</div>
                                    </div>

                                    {(isAdmin || (isGlobalManager && (!primaryDeptId || primaryDeptId === currentUserDeptId))) && (
                                        <button
                                            onClick={() => {
                                                setSelectedUserIdForAssign(profile.id);
                                                setIsAssignModalOpen(true);
                                            }}
                                            className={`text-xs font-bold ${isDarkMode ? 'text-gray-400 hover:text-indigo-400' : 'text-gray-500 hover:text-indigo-600'} transition-colors`}
                                        >
                                            Assign to Team
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {activeView === 'roles' && (
                <div className={`${isDarkMode ? 'bg-[#121214] border-gray-800' : 'bg-white border-gray-100'} rounded-[20px] border shadow-sm p-8`}>
                    <div className="flex items-center gap-3 mb-8">
                        <div className="p-2.5 rounded-xl bg-rose-500/10 text-rose-500">
                            <Shield size={24} />
                        </div>
                        <div>
                            <h3 className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Global Role Management</h3>
                            <p className="text-xs text-gray-500">Strictly controlled RBAC (Admin-Only access)</p>
                        </div>
                    </div>

                    {!isAdmin ? (
                        <div className="py-12 text-center">
                            <Shield size={48} className="mx-auto text-rose-500/20 mb-4" />
                            <h3 className={`text-lg font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Access Denied</h3>
                            <p className="text-sm text-gray-500">You must be a Global Admin to manage organizational roles.</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {allProfiles.map(profile => (
                                <div key={profile.id} className={`flex items-center justify-between p-4 rounded-xl border ${isDarkMode ? 'bg-[#1a1c1d] border-gray-800' : 'bg-gray-50 border-gray-100'}`}>
                                    <div className="flex items-center gap-4">
                                        {profile.avatar_url ? (
                                            <img src={profile.avatar_url} className="w-10 h-10 rounded-xl object-cover" alt="User" />
                                        ) : (
                                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm ${isDarkMode ? 'bg-indigo-500/20 text-indigo-400' : 'bg-indigo-100 text-indigo-600'}`}>
                                                {(profile.full_name || 'U').charAt(0)}
                                            </div>
                                        )}
                                        <div>
                                            <h4 className={`font-bold text-sm ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{profile.full_name || 'Unnamed User'}</h4>
                                            <p className="text-xs text-gray-500">{profile.global_role || 'User'}</p>
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-end gap-1">
                                        <select
                                            value={profile.global_role || 'User'}
                                            onChange={(e) => updateGlobalRole(profile.id, e.target.value as any)}
                                            disabled={profile.id === user?.id}
                                            className={`px-3 py-2 rounded-lg text-xs font-bold border focus:ring-2 focus:ring-indigo-500/20 transition-all ${isDarkMode
                                                ? 'bg-[#121214] border-gray-700 text-white disabled:opacity-50 disabled:cursor-not-allowed'
                                                : 'bg-white border-gray-200 text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed'
                                                }`}
                                        >
                                            <option value="Global Admin">Global Admin</option>
                                            <option value="Department Admin">Department Admin</option>
                                            <option value="Manager">Manager</option>
                                            <option value="User">User</option>
                                        </select>
                                        {profile.id === user?.id && (
                                            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Current User</span>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Modals */}
            <AnimatePresence>
                {isInitModalOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 10 }}
                            className={`${isDarkMode ? 'bg-[#121214] border-gray-800' : 'bg-white border-gray-100'} border rounded-[20px] shadow-2xl shadow-black/20 w-full max-w-md p-6`}
                        >
                            <div className="flex justify-between items-center mb-6">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center">
                                        <Building2 size={20} />
                                    </div>
                                    <div>
                                        <h3 className={`font-black text-lg ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Initialize Workspace</h3>
                                        <p className="text-xs text-gray-500 font-medium">Create your first department to get started</p>
                                    </div>
                                </div>
                                <button onClick={() => setIsInitModalOpen(false)} className={`p-2 rounded-lg ${isDarkMode ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-100 text-gray-500'} transition-colors`}>
                                    <X size={18} />
                                </button>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className={`block text-xs font-bold uppercase tracking-wider mb-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Department Name</label>
                                    <input
                                        type="text"
                                        value={initDeptName}
                                        onChange={(e) => setInitDeptName(e.target.value)}
                                        placeholder="e.g., Engineering, Marketing, Core Team"
                                        className={`w-full px-4 py-3 rounded-xl border text-sm font-medium focus:ring-2 focus:ring-indigo-500/20 transition-all ${isDarkMode
                                            ? 'bg-[#1a1c1d] border-gray-800 text-white placeholder-gray-600 focus:border-indigo-500'
                                            : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400 focus:border-indigo-500'
                                            }`}
                                    />
                                </div>
                                <button
                                    onClick={handleInitializeOrg}
                                    disabled={!initDeptName.trim() || isInitializing}
                                    className={`w-full py-3 rounded-xl font-bold flex justify-center items-center gap-2 transition-all ${!initDeptName.trim() || isInitializing
                                        ? 'bg-gray-300 dark:bg-gray-800 text-gray-500 cursor-not-allowed'
                                        : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-600/20'
                                        }`}
                                >
                                    {isInitializing ? (
                                        <span className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></span>
                                    ) : (
                                        <>Create Department <ChevronRight size={16} /></>
                                    )}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}

                {/* Edit Team Modal */}
                {isEditTeamModalOpen && editingTeam && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 10 }}
                            className={`${isDarkMode ? 'bg-[#121214] border-gray-800' : 'bg-white border-gray-100'} border rounded-[20px] shadow-2xl shadow-black/20 w-full max-w-md p-6`}
                        >
                            <div className="flex justify-between items-center mb-6">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center">
                                        <Edit2 size={20} />
                                    </div>
                                    <div>
                                        <h3 className={`font-black text-lg ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Edit Team</h3>
                                        <p className="text-xs text-gray-500 font-medium">Update team details</p>
                                    </div>
                                </div>
                                <button onClick={() => setIsEditTeamModalOpen(false)} className={`p-2 rounded-lg ${isDarkMode ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-100 text-gray-500'} transition-colors`}>
                                    <X size={18} />
                                </button>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className={`block text-xs font-bold uppercase tracking-wider mb-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Team Name</label>
                                    <input
                                        type="text"
                                        value={editTeamName}
                                        onChange={(e) => setEditTeamName(e.target.value)}
                                        placeholder="e.g., Frontend, Backend, Design"
                                        className={`w-full px-4 py-3 rounded-xl border text-sm font-medium focus:ring-2 focus:ring-indigo-500/20 transition-all ${isDarkMode
                                            ? 'bg-[#1a1c1d] border-gray-800 text-white placeholder-gray-600 focus:border-indigo-500'
                                            : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400 focus:border-indigo-500'
                                            }`}
                                    />
                                </div>
                                <button
                                    onClick={handleEditTeam}
                                    disabled={!editTeamName.trim() || isEditingTeam}
                                    className={`w-full py-3 rounded-xl font-bold flex justify-center items-center gap-2 transition-all ${!editTeamName.trim() || isEditingTeam
                                        ? 'bg-gray-300 dark:bg-gray-800 text-gray-500 cursor-not-allowed'
                                        : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-600/20'
                                        }`}
                                >
                                    {isEditingTeam ? (
                                        <span className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></span>
                                    ) : (
                                        <>Save Changes <ChevronRight size={16} /></>
                                    )}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}

                {/* Delete Team Modal */}
                {isDeleteTeamModalOpen && teamToDelete && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 10 }}
                            className={`${isDarkMode ? 'bg-[#121214] border-gray-800' : 'bg-white border-gray-100'} border rounded-[20px] shadow-2xl shadow-black/20 w-full max-w-md p-6`}
                        >
                            <div className="flex justify-between items-center mb-6">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-500 flex items-center justify-center">
                                        <Trash2 size={20} />
                                    </div>
                                    <div>
                                        <h3 className={`font-black text-lg ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Delete Team</h3>
                                        <p className="text-xs text-rose-500 font-medium">This action cannot be undone</p>
                                    </div>
                                </div>
                                <button onClick={() => setIsDeleteTeamModalOpen(false)} className={`p-2 rounded-lg ${isDarkMode ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-100 text-gray-500'} transition-colors`}>
                                    <X size={18} />
                                </button>
                            </div>

                            <div className="space-y-4">
                                <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                    Are you sure you want to delete the team <strong className={isDarkMode ? 'text-white' : 'text-gray-900'}>{teamToDelete.name}</strong>?
                                    This will also remove all user team assignments for this team.
                                </p>
                                <div className="flex gap-3">
                                    <button
                                        onClick={() => setIsDeleteTeamModalOpen(false)}
                                        className={`flex-1 py-3 rounded-xl font-bold flex justify-center items-center gap-2 transition-all ${isDarkMode
                                            ? 'bg-gray-800 hover:bg-gray-700 text-white'
                                            : 'bg-gray-100 hover:bg-gray-200 text-gray-900'
                                            }`}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleDeleteTeam}
                                        disabled={isDeletingTeam}
                                        className={`flex-1 py-3 rounded-xl font-bold flex justify-center items-center gap-2 transition-all ${isDeletingTeam
                                            ? 'bg-gray-300 dark:bg-gray-800 text-gray-500 cursor-not-allowed'
                                            : 'bg-rose-600 hover:bg-rose-700 text-white shadow-lg shadow-rose-600/20'
                                            }`}
                                    >
                                        {isDeletingTeam ? (
                                            <span className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></span>
                                        ) : (
                                            <>Delete Team</>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}

                {/* Add Department Modal */}
                {isAddDeptModalOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 10 }}
                            className={`${isDarkMode ? 'bg-[#121214] border-gray-800' : 'bg-white border-gray-100'} border rounded-[20px] shadow-2xl shadow-black/20 w-full max-w-md p-6`}
                        >
                            <div className="flex justify-between items-center mb-6">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center">
                                        <Building2 size={20} />
                                    </div>
                                    <div>
                                        <h3 className={`font-black text-lg ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Add Department</h3>
                                        <p className="text-xs text-gray-500 font-medium">Create a new organizational root</p>
                                    </div>
                                </div>
                                <button onClick={() => setIsAddDeptModalOpen(false)} className={`p-2 rounded-lg ${isDarkMode ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-100 text-gray-500'} transition-colors`}>
                                    <X size={18} />
                                </button>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className={`block text-xs font-bold uppercase tracking-wider mb-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Department Name</label>
                                    <input
                                        type="text"
                                        value={newDeptName}
                                        onChange={(e) => setNewDeptName(e.target.value)}
                                        placeholder="e.g., Marketing, Sales"
                                        className={`w-full px-4 py-3 rounded-xl border text-sm font-medium focus:ring-2 focus:ring-indigo-500/20 transition-all ${isDarkMode
                                            ? 'bg-[#1a1c1d] border-gray-800 text-white placeholder-gray-600 focus:border-indigo-500'
                                            : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400 focus:border-indigo-500'
                                            }`}
                                    />
                                </div>
                                <button
                                    onClick={handleAddDepartment}
                                    disabled={!newDeptName.trim() || isAddingDept}
                                    className={`w-full py-3 rounded-xl font-bold flex justify-center items-center gap-2 transition-all ${!newDeptName.trim() || isAddingDept
                                        ? 'bg-gray-300 dark:bg-gray-800 text-gray-500 cursor-not-allowed'
                                        : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-600/20'
                                        }`}
                                >
                                    {isAddingDept ? (
                                        <span className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></span>
                                    ) : (
                                        <>Create Department <ChevronRight size={16} /></>
                                    )}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}

                {/* Add Team Modal */}
                {isAddTeamModalOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 10 }}
                            className={`${isDarkMode ? 'bg-[#121214] border-gray-800' : 'bg-white border-gray-100'} border rounded-[20px] shadow-2xl shadow-black/20 w-full max-w-md p-6`}
                        >
                            <div className="flex justify-between items-center mb-6">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center">
                                        <Users size={20} />
                                    </div>
                                    <div>
                                        <h3 className={`font-black text-lg ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Create Team</h3>
                                        <p className="text-xs text-gray-500 font-medium">Add a new team to this department</p>
                                    </div>
                                </div>
                                <button onClick={() => setIsAddTeamModalOpen(false)} className={`p-2 rounded-lg ${isDarkMode ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-100 text-gray-500'} transition-colors`}>
                                    <X size={18} />
                                </button>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className={`block text-xs font-bold uppercase tracking-wider mb-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Team Name</label>
                                    <input
                                        type="text"
                                        value={newTeamName}
                                        onChange={(e) => setNewTeamName(e.target.value)}
                                        placeholder="e.g., Frontend React, Content Writing"
                                        className={`w-full px-4 py-3 rounded-xl border text-sm font-medium focus:ring-2 focus:ring-indigo-500/20 transition-all ${isDarkMode
                                            ? 'bg-[#1a1c1d] border-gray-800 text-white placeholder-gray-600 focus:border-indigo-500'
                                            : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400 focus:border-indigo-500'
                                            }`}
                                    />
                                </div>
                                <button
                                    onClick={handleAddTeam}
                                    disabled={!newTeamName.trim() || isAddingTeam}
                                    className={`w-full py-3 rounded-xl font-bold flex justify-center items-center gap-2 transition-all ${!newTeamName.trim() || isAddingTeam
                                        ? 'bg-gray-300 dark:bg-gray-800 text-gray-500 cursor-not-allowed'
                                        : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-600/20'
                                        }`}
                                >
                                    {isAddingTeam ? (
                                        <span className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></span>
                                    ) : (
                                        <>Create Team <ChevronRight size={16} /></>
                                    )}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}

                {/* Assign User Modal */}
                {isAssignModalOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 10 }}
                            className={`${isDarkMode ? 'bg-[#121214] border-gray-800' : 'bg-white border-gray-100'} border rounded-[20px] shadow-2xl shadow-black/20 w-full max-w-md p-6`}
                        >
                            <div className="flex justify-between items-center mb-6">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center">
                                        <UserCog size={20} />
                                    </div>
                                    <div>
                                        <h3 className={`font-black text-lg ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Assign User</h3>
                                        <p className="text-xs text-gray-500 font-medium">Place the user inside a Team</p>
                                    </div>
                                </div>
                                <button onClick={() => setIsAssignModalOpen(false)} className={`p-2 rounded-lg ${isDarkMode ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-100 text-gray-500'} transition-colors`}>
                                    <X size={18} />
                                </button>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className={`block text-xs font-bold uppercase tracking-wider mb-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Select Target Team</label>
                                    <select
                                        value={selectedTeamIdForAssign}
                                        onChange={(e) => setSelectedTeamIdForAssign(e.target.value)}
                                        className={`w-full px-4 py-3 rounded-xl border text-sm font-medium focus:ring-2 focus:ring-indigo-500/20 transition-all ${isDarkMode
                                            ? 'bg-[#1a1c1d] border-gray-800 text-white focus:border-indigo-500'
                                            : 'bg-gray-50 border-gray-200 text-gray-900 focus:border-indigo-500'
                                            }`}
                                    >
                                        <option value="">-- Choose a Team --</option>
                                        {(isAdmin ? departments : departments.filter(d => d.id === currentUserDeptId)).map(dept => (
                                            <optgroup key={dept.id} label={dept.name}>
                                                {dept.teams?.map(team => (
                                                    <option key={team.id} value={team.id}>{team.name}</option>
                                                ))}
                                            </optgroup>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className={`block text-xs font-bold uppercase tracking-wider mb-2 mt-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Role in Team</label>
                                    <select
                                        value={selectedRoleForAssign}
                                        onChange={(e) => setSelectedRoleForAssign(e.target.value as any)}
                                        className={`w-full px-4 py-3 rounded-xl border text-sm font-medium focus:ring-2 focus:ring-indigo-500/20 transition-all ${isDarkMode
                                            ? 'bg-[#1a1c1d] border-gray-800 text-white focus:border-indigo-500'
                                            : 'bg-gray-50 border-gray-200 text-gray-900 focus:border-indigo-500'
                                            }`}
                                    >
                                        <option value="Manager">Manager</option>
                                        <option value="Contributor">Contributor</option>
                                        <option value="Viewer">Viewer</option>
                                    </select>
                                </div>

                                <button
                                    onClick={handleAssignUser}
                                    disabled={!selectedTeamIdForAssign || isAssigning}
                                    className={`w-full py-3 rounded-xl font-bold flex justify-center items-center gap-2 mt-4 transition-all ${!selectedTeamIdForAssign || isAssigning
                                        ? 'bg-gray-300 dark:bg-gray-800 text-gray-500 cursor-not-allowed'
                                        : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-600/20'
                                        }`}
                                >
                                    {isAssigning ? (
                                        <span className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></span>
                                    ) : (
                                        <>Confirm Assignment <ChevronRight size={16} /></>
                                    )}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};
