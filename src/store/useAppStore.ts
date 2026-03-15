import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase } from '../lib/supabase';
import { fetchWorkspaceSettings, updateWorkspaceSettingsInDB } from '../lib/workspaceSettings';

export interface Task {
    id: number;
    title: string;
    description: string;
    project_id: number;
    project_name?: string;
    priority: 'low' | 'medium' | 'high' | 'urgent';
    status: 'todo' | 'in_progress' | 'done' | 'blocked';
    estimated_hours: number;
    due_date?: string;
    start_date?: string;
    assignee_id?: string;
    subtasks?: { title: string; completed: boolean }[];
    dependencies?: number[];
    tags?: string[];
    attachments?: any[];
    watchers?: string[];
    repeat_config?: any;
    is_private?: boolean;
    budget?: number;
    cost?: number;
    location?: any;
    created_at: string;
    updated_at?: string;
}

export interface Project {
    id: number;
    name: string;
    description: string;
    status: string;
    created_at?: string;
}

export interface Message {
    role: 'user' | 'assistant' | 'system';
    content: string;
}

export interface Appointment {
    id: string;
    title: string;
    description?: string;
    start_time: string; // ISO
    end_time: string;   // ISO
    date: string;       // YYYY-MM-DD
    is_google_synced?: boolean;
    google_event_id?: string;
    location?: string;
    color?: string;
    created_at: string;
}

export interface TeamMember {
    id: string;
    team_id: string;
    user_id: string;
    name?: string;
    avatar_url?: string | null;
    role: 'Manager' | 'Contributor' | 'Viewer' | 'lead' | 'member';
}

export interface SupportTicket {
    id: string;
    title: string;
    description: string;
    category: 'bug' | 'feature' | 'access' | 'performance' | 'other';
    priority: 'low' | 'medium' | 'high' | 'critical';
    status: 'open' | 'in_progress' | 'resolved' | 'closed';
    userId: string;
    userName: string;
    createdAt: string;
}

export interface FeedbackItem {
    id: string;
    title: string;
    description: string;
    votes: number;
    userVoted: boolean;
    status: 'planned' | 'in-review' | 'shipped' | 'considering';
    category: string;
}

export interface Team {
    id: string;
    name: string;
    description: string;
    department_id: string;
    members?: TeamMember[];
}

export interface Department {
    id: string;
    name: string;
    description: string;
    teams?: Team[];
}

export interface Lead {
    id: string;
    name: string;
    email: string;
    phone: string;
    company: string;
    role: string;
    website: string;
    address: string;
    source: 'scraping' | 'vision' | 'manual' | 'search';
    created_at: string;
}

export interface DuplicateReview {
    id: string; // original lead ID
    original: Lead;
    incoming: Lead;
    timestamp: number;
}

export interface SearchHistoryItem {
    id: string;
    query: string;
    timestamp: number;
    resultCount: number;
    starred: boolean;
    campaignId?: string; // optional campaign association
}

export interface Campaign {
    id: string;
    name: string;
    description?: string;
    color: string; // tailwind color name like 'emerald', 'indigo', 'amber'
    created_at: string;
    searchIds: string[]; // search history IDs associated
    leadCount: number;
}

export interface HuntStats {
    sessionLeads: number;
    sessionDuplicates: number;
    sessionSearchCount: number;
    sessionStartTime: number | null;
    lastSearchDuration: number; // ms
    sourcesHit: string[];
}

export interface WorkspaceSettings {
    name: string;
    description: string;
    industry: string;
    timezone: string;
    workingHoursStart: string;
    workingHoursEnd: string;
    currency: string;
    defaultTaskStatus: 'todo' | 'in_progress' | 'done' | 'blocked';
    defaultTaskPriority: 'low' | 'medium' | 'high' | 'urgent';
    defaultDueDateOffsetDays: number;
    tasksVisibleTo: 'workspace' | 'department' | 'team' | 'private';
    aiAccess: 'all' | 'managers' | 'admin';
    aiDataScope: 'workspace' | 'department' | 'user';
    aiAutoExecute: boolean;
    aiAutoCreateSubtasks: boolean;
    aiUsageDailyCap: number;
    aiSystemPrompt: string;
    notifyOverdueDays: number;
    quietHoursEnabled: boolean;
    quietHoursStart: string;
    quietHoursEnd: string;
    weekendNotifications: boolean;
    require2FA: boolean;
    enforceSSO: boolean;
    sessionTimeoutMinutes: number;
    allowExternalCollaborators: boolean;
    allowPublicLinks: boolean;
    defaultReportPeriod: 'week' | 'month' | 'quarter';
    autoWeeklySummary: boolean;
    dataRetentionDays: number;
    slackConnected: boolean;
    googleCalendarConnected: boolean;
    customWebhookUrl?: string;
    planTier: 'free' | 'pro' | 'enterprise';
    cloudAiEnabled: boolean;
    cloudAiModel: 'gemini-1.5-pro' | 'gemini-1.5-flash';
}

export interface AppNotification {
    id: string;
    type: 'success' | 'error' | 'warning' | 'info';
    title: string;
    body?: string; // Markdown support
    timestamp: number;
    isRead: boolean;
    isSeen: boolean; // For glow/shake reset
}

export interface SystemHealth {
    dbStatus: 'operational' | 'degraded' | 'outage';
    aiLatency: number;
    lastCheck: string;
    securityAlerts: number;
}

export interface SystemIncident {
    id: string;
    title: string;
    description: string;
    severity: 'minor' | 'major' | 'critical';
    status: 'resolved' | 'investigating' | 'identified';
    created_at: string;
    resolved_at?: string;
}

interface AppState {
    // Global Data
    tasks: Task[];
    projects: Project[];
    departments: Department[];
    teams: Team[];
    allProfiles: any[];
    totalHours: number;
    messages: Message[];
    aiActionLogs: any[];
    leads: Lead[];
    yukiIsSearching: boolean;
    yukiIsScanning: boolean;
    yukiBatchIsScanning: boolean;
    yukiBatchProgress: number;
    yukiSearchController: AbortController | null;
    yukiVisionController: AbortController | null;
    yukiBatchController: AbortController | null;
    yukiMaxResults: number;
    pendingDuplicateReviews: DuplicateReview[];

    // UI State
    input: string;
    isLoading: boolean;
    isRefreshing: boolean;
    activeTab: 'dashboard' | 'tasks' | 'reports' | 'analytics' | 'team' | 'support' | 'leads' | 'workflow' | 'fboard';
    teakelActiveTab: 'search' | 'vision' | 'list' | 'reports' | 'campaigns' | 'settings' | 'fboard';

    // Modals & Editing
    isModalOpen: boolean;
    isProjectModalOpen: boolean;
    isTimeLogModalOpen: boolean;
    isSettingsModalOpen: boolean;
    isWorkspaceSettingsModalOpen: boolean;
    isThroneModalOpen: boolean;
    isReportBuilderOpen: boolean;
    activeReportTemplate: string | null;
    generatedReportData: any | null;
    isGeneratingReport: boolean;
    isDarkMode: boolean;
    userProfile: {
        id?: string;
        name: string;
        avatar_url: string | null;
        global_role?: string;
        location?: string;
        coords?: [number, number];
        isLiveLocation?: boolean;
    };
    user: any | null; // From Supabase Auth
    isAdmin: boolean;
    geminiApiKey: string;
    useLocalModel: boolean;
    localModelUrl: string;
    editingTask: Task | null;
    editingProject: Project | null;
    selectedProjectIds: number[];
    selectedTaskIdForTimeLog: number | null;

    // Forms
    formData: {
        title: string;
        description: string;
        project_id: number;
        priority: 'low' | 'medium' | 'high' | 'urgent';
        estimated_hours: number;
        status: 'todo' | 'in_progress' | 'done' | 'blocked';
        due_date: string;
        start_date: string;
        assignee_id: string;
        subtasks: { title: string; completed: boolean }[];
        tags: string[];
        dependencies: number[];
        is_private: boolean;
        budget: number;
    };
    projectFormData: {
        name: string;
        description: string;
        status: string;
    };
    timeLogFormData: {
        hours: number;
        date: string;
    };

    // Nav
    isNavOpen: boolean;
    isSidebarOpen: boolean;

    // Support Module
    supportTab: 'assistant' | 'helpcenter' | 'tickets' | 'status' | 'feedback';
    supportTickets: SupportTicket[];
    feedbackItems: FeedbackItem[];

    // Chat History
    mainChatSessions: { id: string; title: string; updated_at: string; }[];
    supportChatSessions: { id: string; title: string; updated_at: string; }[];
    activeMainChatId: string | null;
    activeSupportChatId: string | null;
    isChatHistoryOpen: boolean;
    isTeamModalOpen: boolean;

    // Planner
    plannerView: 'month' | 'week' | 'day';
    selectedPlannerDate: string; // YYYY-MM-DD
    appointments: Appointment[];
    dayPlan: {
        date: string;
        items: { time: string; activity: string; type: 'task' | 'appointment' | 'break'; refId?: string | number }[];
    } | null;

    // System Status
    systemHealth: SystemHealth;
    incidents: SystemIncident[];
    fetchSystemHealth: () => Promise<void>;
    fetchIncidents: () => Promise<void>;

    notifications: AppNotification[];
    isNotificationModalOpen: boolean;
    addNotification: (n: Omit<AppNotification, 'id' | 'timestamp' | 'isRead' | 'isSeen'>) => void;
    removeNotification: (id: string) => void;
    markNotificationAsRead: (id: string) => void;
    markAllNotificationsAsRead: () => void;
    clearUnseenNotifications: () => void;
    setIsNotificationModalOpen: (isOpen: boolean) => void;
    broadcastNotification: (data: { type: AppNotification['type']; title: string; body: string }) => Promise<{ error: any }>;
    subscribeToGlobalNotifications: () => () => void;

    // Pomodoro Timer
    pomodoroState: {
        mode: 'work' | 'shortBreak' | 'longBreak';
        timeLeft: number;
        isRunning: boolean;
        sessionsCompleted: number;
        selectedTaskId: string | null;
    };
    setPomodoroState: (patch: Partial<AppState['pomodoroState']> | ((prev: AppState['pomodoroState']) => AppState['pomodoroState'])) => void;

    // Eisenhower Matrix
    eisenhowerMap: Record<string, string>; // taskId -> quadrant ('q1'|'q2'|'q3'|'q4')
    setTaskQuadrant: (taskId: string, quadrant: string) => void;

    // Workspace Settings
    workspaceSettings: WorkspaceSettings;
    setWorkspaceSettings: (settings: Partial<WorkspaceSettings>) => void;

    // Actions
    timeLogs: any[]; // Store full time logs for metric calculations
    setLeads: (leads: Lead[]) => void;
    fetchLeads: () => Promise<void>;
    addLead: (lead: Omit<Lead, 'id' | 'created_at'>) => Promise<void>;
    deleteLead: (leadId: string) => Promise<void>;
    // Teakel Background & Duplicate Actions
    setYukiMaxResults: (max: number) => void;
    yukiStreamLeads: Lead[];          // live feed for current session
    clearYukiStream: () => void;
    searchHistory: SearchHistoryItem[];
    addSearchHistory: (item: Omit<SearchHistoryItem, 'id'>) => void;
    toggleStarSearch: (id: string) => void;
    clearSearchHistory: () => void;
    // Campaign Manager
    campaigns: Campaign[];
    activeCampaignId: string | null;
    setActiveCampaignId: (id: string | null) => void;
    createCampaign: (name: string, description: string, color: string) => string;
    deleteCampaign: (id: string) => void;
    updateCampaign: (id: string, patch: Partial<Campaign>) => void;
    // Hunt Statistics
    huntStats: HuntStats;
    resetHuntStats: () => void;
    startYukiSearch: (query: string) => Promise<void>;
    stopYukiSearch: () => void;
    startYukiVision: (base64: string, mimeType: string) => Promise<void>;
    stopYukiVision: () => void;
    startYukiBatchVision: (files: { data: string; type: string }[]) => Promise<void>;
    stopYukiBatchVision: () => void;
    resolveDuplicate: (id: string, action: 'keep_original' | 'overwrite_new' | 'merge', mergedData?: Partial<Lead>) => Promise<void>;
    setTeakelActiveTab: (tab: AppState['teakelActiveTab']) => void;
    setTasks: (tasks: Task[]) => void;
    setProjects: (projects: Project[]) => void;
    setDepartments: (departments: Department[]) => void;
    setTeams: (teams: Team[]) => void;
    setAllProfiles: (profiles: any[]) => void;
    setTotalHours: (hours: number) => void;
    setMessages: (updater: Message[] | ((prev: Message[]) => Message[])) => void;
    setInput: (input: string) => void;
    setIsLoading: (isLoading: boolean) => void;
    setIsRefreshing: (isRefreshing: boolean) => void;
    setActiveTab: (tab: AppState['activeTab']) => void;
    setIsModalOpen: (isOpen: boolean) => void;
    setIsProjectModalOpen: (isOpen: boolean) => void;
    setIsTimeLogModalOpen: (isOpen: boolean) => void;
    setIsSettingsModalOpen: (isOpen: boolean) => void;
    setIsWorkspaceSettingsModalOpen: (isOpen: boolean) => void;
    toggleProjectSelection: (id: number) => void;
    clearProjectSelection: () => void;
    deleteProject: (id: number) => Promise<void>;
    bulkDeleteProjects: (ids: number[]) => Promise<void>;
    setIsReportBuilderOpen: (isOpen: boolean) => void;
    setActiveReportTemplate: (template: string | null) => void;
    setGeneratedReportData: (data: any | null) => void;
    setIsTeamModalOpen: (isOpen: boolean) => void;
    generateReport: (config: {
        template: string;
        scope: string;
        dateRange: string;
        metrics: any;
        useAI: boolean;
    }) => Promise<void>;
    setIsThroneModalOpen: (isOpen: boolean) => void;
    toggleDarkMode: () => void;
    setUserProfile: (profile: Partial<AppState['userProfile']>) => void;
    setUser: (user: any | null) => void;
    setGeminiApiKey: (key: string) => void;
    setUseLocalModel: (useLocal: boolean) => void;
    setLocalModelUrl: (url: string) => void;
    setEditingTask: (task: Task | null) => void;
    setEditingProject: (project: Project | null) => void;
    setSelectedTaskIdForTimeLog: (id: number | null) => void;
    setFormData: (updater: Partial<AppState['formData']> | ((prev: AppState['formData']) => AppState['formData'])) => void;
    setProjectFormData: (updater: Partial<AppState['projectFormData']> | ((prev: AppState['projectFormData']) => AppState['projectFormData'])) => void;
    setTimeLogFormData: (updater: Partial<AppState['timeLogFormData']> | ((prev: AppState['timeLogFormData']) => AppState['timeLogFormData'])) => void;
    setIsNavOpen: (isOpen: boolean) => void;
    setIsSidebarOpen: (isOpen: boolean) => void;
    setSupportTab: (tab: AppState['supportTab']) => void;
    // Support data: Supabase-backed async thunks
    fetchSupportTickets: () => Promise<void>;
    fetchFeedbackItems: () => Promise<void>;
    addSupportTicket: (ticket: Omit<SupportTicket, 'id' | 'createdAt'>) => Promise<void>;
    updateLastActive: () => Promise<void>;
    sendPoke: (toUserId: string) => Promise<void>;
    subscribeToPokes: () => (() => void) | void;
    updateTicketStatus: (id: string, status: SupportTicket['status']) => Promise<void>;
    voteFeedback: (id: string, userId: string) => Promise<void>;
    addFeedbackItem: (item: Omit<FeedbackItem, 'id' | 'votes' | 'userVoted'>) => Promise<void>;

    // Thunks / Async Actions
    fetchData: () => Promise<void>;
    initializeAuth: () => (() => void);
    signOut: () => Promise<void>;

    // Chat Session Management
    fetchChatSessions: (module: 'main' | 'support') => Promise<void>;
    setActiveChatSessionId: (module: 'main' | 'support', id: string | null) => void;
    setIsChatHistoryOpen: (isOpen: boolean) => void;
    createNewChatSession: (module: 'main' | 'support') => void;
    loadChatSession: (module: 'main' | 'support', sessionId?: string) => Promise<any[] | null>;
    saveChatSession: (module: 'main' | 'support', msgs: any[]) => Promise<void>;
    deleteChatSession: (module: 'main' | 'support', sessionId: string) => Promise<void>;
    renameChatSession: (module: 'main' | 'support', sessionId: string, newTitle: string) => Promise<void>;
    deleteAllChatSessions: (module: 'main' | 'support') => Promise<void>;

    // Admin Actions
    inviteUser: (email: string) => Promise<{ error: any }>;
    resetUserPassword: (email: string) => Promise<{ error: any }>;
    toggleUserAdmin: (userId: string, currentStatus: boolean) => Promise<{ error: any }>;
    updateGlobalRole: (userId: string, role: 'Global Admin' | 'Department Admin' | 'Manager' | 'User') => Promise<{ error: any }>;
    createDepartment: (name: string, description: string) => Promise<{ error: any }>;
    createTeam: (name: string, departmentId: string) => Promise<{ error: any }>;
    updateTeam: (teamId: string, name: string) => Promise<{ error: any }>;
    deleteTeam: (teamId: string) => Promise<{ error: any }>;
    moveTeam: (teamId: string, newDepartmentId: string) => Promise<{ error: any }>;
    fetchAllProfiles: () => Promise<void>;
    assignUserToTeam: (userId: string, teamId: string, role: 'Manager' | 'Contributor' | 'Viewer') => Promise<{ error: any }>;
    removeUserFromTeam: (userId: string, teamId: string) => Promise<{ error: any }>;

    // Planner Actions
    setAppointments: (appointments: Appointment[]) => void;
    addAppointment: (app: Partial<Appointment>) => void;
    updateAppointment: (id: string, patch: Partial<Appointment>) => void;
    deleteAppointment: (id: string) => void;
    setPlannerView: (view: 'month' | 'week' | 'day') => void;
    setSelectedPlannerDate: (date: string) => void;
    setDayPlan: (plan: AppState['dayPlan']) => void;
}

export const useAppStore = create<AppState>()(
    persist(
        (set, get) => ({
            tasks: [],
            projects: [],
            departments: [],
            teams: [],
            allProfiles: [],
            timeLogs: [],
            totalHours: 0,
            messages: [
                { role: 'assistant', content: 'Hello! I am your Work Intelligence Agent. How can I help you manage your tasks today?' }
            ],
            input: '',
            isLoading: false,
            isRefreshing: false,
            activeTab: 'dashboard',
            teakelActiveTab: 'search',
            leads: [],
            yukiIsSearching: false,
            yukiIsScanning: false,
            yukiSearchController: null,
            yukiVisionController: null,
            yukiMaxResults: 5,
            pendingDuplicateReviews: [],
            yukiStreamLeads: [],
            searchHistory: [],
            campaigns: [],
            activeCampaignId: null,
            huntStats: {
                sessionLeads: 0,
                sessionDuplicates: 0,
                sessionSearchCount: 0,
                sessionStartTime: null,
                lastSearchDuration: 0,
                sourcesHit: []
            },
            yukiBatchIsScanning: false,
            yukiBatchProgress: 0,
            yukiBatchController: null,
            appointments: [],
            dayPlan: null,

            isModalOpen: false,
            isProjectModalOpen: false,
            isTimeLogModalOpen: false,
            isSettingsModalOpen: false,
            isThroneModalOpen: false,
            isReportBuilderOpen: false,
            activeReportTemplate: null,
            generatedReportData: null,
            isGeneratingReport: false,
            isWorkspaceSettingsModalOpen: false,
            workspaceSettings: {
                name: 'Rickel Industries',
                description: 'Intelligent Work Platform',
                industry: 'Technology',
                timezone: 'UTC',
                workingHoursStart: '09:00',
                workingHoursEnd: '17:00',
                currency: 'USD',
                defaultTaskStatus: 'todo',
                defaultTaskPriority: 'medium',
                defaultDueDateOffsetDays: 3,
                tasksVisibleTo: 'team',
                aiAccess: 'all',
                aiDataScope: 'user',
                aiAutoExecute: true,
                aiAutoCreateSubtasks: false,
                aiUsageDailyCap: 100,
                aiSystemPrompt: 'Prioritize strategic outcomes and maintain focus on high-impact tasks.',
                notifyOverdueDays: 1,
                quietHoursEnabled: true,
                quietHoursStart: '18:00',
                quietHoursEnd: '08:00',
                weekendNotifications: false,
                require2FA: false,
                enforceSSO: false,
                sessionTimeoutMinutes: 120,
                allowExternalCollaborators: false,
                allowPublicLinks: false,
                defaultReportPeriod: 'week',
                autoWeeklySummary: true,
                dataRetentionDays: 365,
                slackConnected: false,
                googleCalendarConnected: false,
                planTier: 'pro',
                cloudAiEnabled: true,
                cloudAiModel: 'gemini-1.5-pro'
            },
            isDarkMode: true,
            isTeamModalOpen: false,
            userProfile: {
                name: 'Guest User',
                avatar_url: null,
                location: 'Nairobi',
                coords: [-1.286389, 36.817223],
                isLiveLocation: false
            },
            user: null,
            isAdmin: false,
            geminiApiKey: '',
            useLocalModel: false,
            localModelUrl: 'https://tea.rickelindustries.co.ke/',
            editingTask: null,
            editingProject: null,
            selectedProjectIds: [],
            aiActionLogs: [],
            selectedTaskIdForTimeLog: null,
            // Chat History
            mainChatSessions: [],
            supportChatSessions: [],
            activeMainChatId: null,
            activeSupportChatId: null,
            isChatHistoryOpen: false,

            // Planner Initial State
            plannerView: 'month',
            selectedPlannerDate: new Date().toISOString().split('T')[0],

            systemHealth: {
                dbStatus: 'operational',
                aiLatency: 0,
                lastCheck: new Date().toISOString(),
                securityAlerts: 0
            },
            incidents: [],

            notifications: [],
            isNotificationModalOpen: false,
            addNotification: (n) => set((state) => ({
                notifications: [
                    ...state.notifications,
                    {
                        ...n,
                        id: Math.random().toString(36).substring(7),
                        timestamp: Date.now(),
                        isRead: false,
                        isSeen: false
                    }
                ]
            })),
            removeNotification: (id) => set((state) => ({
                notifications: state.notifications.filter((n) => n.id !== id)
            })),
            markNotificationAsRead: (id) => set((state) => ({
                notifications: state.notifications.map(n => n.id === id ? { ...n, isRead: true } : n)
            })),
            markAllNotificationsAsRead: () => set((state) => ({
                notifications: state.notifications.map(n => ({ ...n, isRead: true }))
            })),
            clearUnseenNotifications: () => set((state) => ({
                notifications: state.notifications.map(n => ({ ...n, isSeen: true }))
            })),
            setIsNotificationModalOpen: (isNotificationModalOpen) => set({ isNotificationModalOpen }),

            formData: {
                title: '',
                description: '',
                project_id: 0,
                priority: 'medium',
                status: 'todo',
                estimated_hours: 0,
                due_date: '',
                start_date: '',
                assignee_id: '',
                subtasks: [],
                tags: [],
                dependencies: [],
                is_private: false,
                budget: 0
            },
            projectFormData: {
                name: '',
                description: '',
                status: 'active'
            },
            timeLogFormData: {
                hours: 0,
                date: new Date().toISOString().split('T')[0]
            },

            isNavOpen: false,
            isSidebarOpen: true,

            // Support Module
            supportTab: 'assistant',
            supportTickets: [
                { id: 's1', title: 'Cannot assign tasks to new team member', description: 'When I try to assign a task to the newly added team member, the dropdown does not show them.', category: 'bug', priority: 'high', status: 'open', userId: 'system', userName: 'System Demo', createdAt: new Date(Date.now() - 86400000 * 2).toISOString() },
                { id: 's2', title: 'Request: Bulk task import from CSV', description: 'It would save a lot of time to import tasks from a CSV spreadsheet.', category: 'feature', priority: 'medium', status: 'in_progress', userId: 'system', userName: 'System Demo', createdAt: new Date(Date.now() - 86400000 * 5).toISOString() },
            ],
            feedbackItems: [
                { id: 'f1', title: 'Dark mode for mobile app', description: 'Would love dark mode on the mobile version.', votes: 24, userVoted: false, status: 'planned', category: 'UI/UX' },
                { id: 'f2', title: 'Slack integration for task notifications', description: 'Get notified in Slack when tasks are assigned to me.', votes: 18, userVoted: false, status: 'in-review', category: 'Integration' },
                { id: 'f3', title: 'Recurring tasks', description: 'Allow tasks to repeat daily, weekly, or monthly automatically.', votes: 41, userVoted: false, status: 'planned', category: 'Productivity' },
                { id: 'f4', title: 'Time tracking export to payroll', description: 'Export time logs directly to payroll systems.', votes: 12, userVoted: false, status: 'considering', category: 'Finance' },
                { id: 'f5', title: 'Kanban board view', description: 'Drag-and-drop kanban for task management.', votes: 55, userVoted: true, status: 'shipped', category: 'Productivity' },
            ],

            // Pomodoro Timer
            pomodoroState: {
                mode: 'work',
                timeLeft: 25 * 60,
                isRunning: false,
                sessionsCompleted: 0,
                selectedTaskId: null,
            },

            // Eisenhower Matrix
            eisenhowerMap: {},

            setTasks: (tasks) => set({ tasks }),
            setProjects: (projects) => set({ projects }),
            setDepartments: (departments) => set({ departments }),
            setTeams: (teams) => set({ teams }),
            setAllProfiles: (allProfiles) => set({ allProfiles }),
            setTotalHours: (totalHours) => set({ totalHours }),
            setMessages: (updater) => set((state) => ({
                messages: typeof updater === 'function' ? updater(state.messages) : updater
            })),
            setInput: (input) => set({ input }),
            setIsLoading: (isLoading) => set({ isLoading }),
            setIsRefreshing: (isRefreshing) => set({ isRefreshing }),
            setActiveTab: (activeTab) => set({ activeTab }),
            setTeakelActiveTab: (teakelActiveTab) => set({ teakelActiveTab }),
            setLeads: (leads) => set({ leads }),
            setYukiMaxResults: (max) => set({ yukiMaxResults: max }),
            clearYukiStream: () => set({ yukiStreamLeads: [] }),
            addSearchHistory: (item) => set((s) => ({
                searchHistory: [{ ...item, id: crypto.randomUUID() }, ...s.searchHistory].slice(0, 50)
            })),
            toggleStarSearch: (id) => set((s) => ({
                searchHistory: s.searchHistory.map(h => h.id === id ? { ...h, starred: !h.starred } : h)
            })),
            clearSearchHistory: () => set({ searchHistory: [] }),
            // Campaign actions
            setActiveCampaignId: (activeCampaignId) => set({ activeCampaignId }),
            createCampaign: (name, description, color) => {
                const id = crypto.randomUUID();
                set((s) => ({
                    campaigns: [{ id, name, description, color, created_at: new Date().toISOString(), searchIds: [], leadCount: 0 }, ...s.campaigns]
                }));
                return id;
            },
            deleteCampaign: (id) => set((s) => ({
                campaigns: s.campaigns.filter(c => c.id !== id),
                activeCampaignId: s.activeCampaignId === id ? null : s.activeCampaignId
            })),
            updateCampaign: (id, patch) => set((s) => ({
                campaigns: s.campaigns.map(c => c.id === id ? { ...c, ...patch } : c)
            })),
            resetHuntStats: () => set({ huntStats: { sessionLeads: 0, sessionDuplicates: 0, sessionSearchCount: 0, sessionStartTime: null, lastSearchDuration: 0, sourcesHit: [] } }),

            fetchLeads: async () => {
                const uid = get().user?.id;
                if (!uid) return;
                const { data, error } = await supabase
                    .from('teakel_leads')
                    .select('*')
                    .order('created_at', { ascending: false });
                if (!error && data) {
                    set({ leads: data as Lead[] });
                }
            },

            addLead: async (leadData) => {
                const uid = get().user?.id;
                const state = get();

                // Build a temporary lead for duplicate detection against local cache
                const tempLead = {
                    ...leadData,
                    id: crypto.randomUUID(),
                    created_at: new Date().toISOString()
                } as Lead;

                // Duplicate Detection against current in-memory leads
                const existingLead = state.leads.find(l =>
                    (tempLead.email && l.email?.toLowerCase() === tempLead.email?.toLowerCase()) ||
                    (tempLead.phone && l.phone?.replace(/[^0-9]/g, '') === tempLead.phone?.replace(/[^0-9]/g, ''))
                );

                if (existingLead) {
                    const newDuplicate: DuplicateReview = {
                        id: existingLead.id,
                        original: existingLead,
                        incoming: tempLead,
                        timestamp: Date.now()
                    };
                    set((s) => ({ pendingDuplicateReviews: [...s.pendingDuplicateReviews, newDuplicate] }));
                    return;
                }

                if (!uid) {
                    // Not logged in — store in local state only
                    set((s) => ({ leads: [tempLead, ...s.leads] }));
                    return;
                }

                const { data, error } = await supabase
                    .from('teakel_leads')
                    .insert([{ ...leadData, user_id: uid }])
                    .select()
                    .single();

                if (error) {
                    console.error('Failed to save lead:', error);
                    get().addNotification({ type: 'error', title: 'Save Failed', body: 'Could not save lead to database.' });
                } else if (data) {
                    set((s) => ({ leads: [data as Lead, ...s.leads] }));
                }
            },

            deleteLead: async (leadId: string) => {
                const uid = get().user?.id;
                set((s) => ({ leads: s.leads.filter(l => l.id !== leadId) }));
                if (uid) {
                    await supabase.from('teakel_leads').delete().eq('id', leadId).eq('user_id', uid);
                }
            },

            resolveDuplicate: async (duplicateId, action, mergedData) => {
                const state = get();
                const reviews = [...state.pendingDuplicateReviews];
                const index = reviews.findIndex(r => r.id === duplicateId);
                if (index === -1) return;

                const review = reviews[index];
                reviews.splice(index, 1);
                set({ pendingDuplicateReviews: reviews });

                if (action === 'keep_original') return;

                const uid = get().user?.id;

                if (action === 'overwrite_new') {
                    const updatedLead = { ...review.incoming, id: review.original.id, created_at: review.original.created_at };
                    set((s) => ({
                        leads: s.leads.map(l => l.id === duplicateId ? updatedLead : l)
                    }));
                    if (uid) {
                        const { id, created_at, ...fields } = updatedLead;
                        await supabase.from('teakel_leads').update(fields).eq('id', duplicateId).eq('user_id', uid);
                    }
                } else if (action === 'merge' && mergedData) {
                    const merged = { ...review.original, ...mergedData };
                    set((s) => ({
                        leads: s.leads.map(l => l.id === duplicateId ? merged : l)
                    }));
                    if (uid) {
                        const { id, created_at, user_id, ...fields } = merged as any;
                        await supabase.from('teakel_leads').update(fields).eq('id', duplicateId).eq('user_id', uid);
                    }
                }
            },

            startYukiSearch: async (query: string) => {
                const state = get();
                if (state.yukiIsSearching) return;

                const controller = new AbortController();
                const searchStart = Date.now();
                // Init session start time if first search
                set((s) => ({
                    yukiIsSearching: true,
                    yukiSearchController: controller,
                    yukiStreamLeads: [],
                    huntStats: {
                        ...s.huntStats,
                        sessionStartTime: s.huntStats.sessionStartTime ?? Date.now(),
                        sessionSearchCount: s.huntStats.sessionSearchCount + 1,
                    }
                }));

                try {
                    const token = process.env.VITE_SUPABASE_ANON_KEY || 'dummy';
                    const { yukiMaxResults, activeCampaignId } = get();

                    const response = await fetch('/api/teakel-search', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`
                        },
                        body: JSON.stringify({ query, maxResults: yukiMaxResults }),
                        signal: controller.signal
                    });

                    if (!response.ok) throw new Error('Failed to execute search');

                    const data = await response.json();
                    const leads: any[] = data.leads || [];
                    const duration = Date.now() - searchStart;

                    if (leads.length > 0) {
                        for (const l of leads) {
                            if (get().yukiSearchController !== controller) break;
                            const streamLead = { ...l, source: 'search', id: crypto.randomUUID(), created_at: new Date().toISOString() } as Lead;
                            set((s) => ({ yukiStreamLeads: [...s.yukiStreamLeads, streamLead] }));
                            await new Promise(r => setTimeout(r, 120));
                        }
                        leads.forEach((l: any) => get().addLead({ ...l, source: 'search' }));
                        const historyId = crypto.randomUUID();
                        set((s) => ({
                            searchHistory: [{ id: historyId, query, timestamp: Date.now(), resultCount: leads.length, starred: false, campaignId: activeCampaignId ?? undefined }, ...s.searchHistory].slice(0, 50),
                            huntStats: {
                                ...s.huntStats,
                                sessionLeads: s.huntStats.sessionLeads + leads.length,
                                lastSearchDuration: duration,
                                sourcesHit: [...new Set([...s.huntStats.sourcesHit, 'web-search'])]
                            },
                            // Update campaign leadCount
                            campaigns: activeCampaignId
                                ? s.campaigns.map(c => c.id === activeCampaignId
                                    ? { ...c, leadCount: c.leadCount + leads.length, searchIds: [...c.searchIds, historyId] }
                                    : c)
                                : s.campaigns
                        }));
                        get().addNotification({ type: 'success', title: 'Search Complete', body: `Found ${leads.length} leads for "${query}".` });
                    } else {
                        set((s) => ({
                            searchHistory: [{ id: crypto.randomUUID(), query, timestamp: Date.now(), resultCount: 0, starred: false, campaignId: activeCampaignId ?? undefined }, ...s.searchHistory].slice(0, 50),
                            huntStats: { ...s.huntStats, lastSearchDuration: duration }
                        }));
                        get().addNotification({ type: 'info', title: 'Search Complete', body: 'No leads found.' });
                    }
                } catch (error: any) {
                    if (error.name === 'AbortError') {
                        get().addNotification({ type: 'warning', title: 'Search Stopped', body: 'Lead extraction was halted.' });
                    } else {
                        console.error("YukiSearch error:", error);
                        get().addNotification({ type: 'error', title: 'Search Failed', body: error.message || 'An error occurred during search.' });
                    }
                } finally {
                    set((s) => s.yukiSearchController === controller ? { yukiIsSearching: false, yukiSearchController: null } : s);
                }
            },

            stopYukiSearch: () => {
                const { yukiSearchController } = get();
                if (yukiSearchController) {
                    yukiSearchController.abort();
                    set({ yukiIsSearching: false, yukiSearchController: null });
                }
            },

            startYukiVision: async (base64Data: string, mimeType: string) => {
                const state = get();
                if (state.yukiIsScanning) return;

                const controller = new AbortController();
                set({ yukiIsScanning: true, yukiVisionController: controller });

                try {
                    const token = import.meta.env.VITE_SUPABASE_ANON_KEY || 'dummy';

                    const response = await fetch('/api/teakel-vision', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`
                        },
                        body: JSON.stringify({ imageBase64: base64Data, mimeType }),
                        signal: controller.signal
                    });

                    if (!response.ok) {
                        throw new Error('Failed to extract data');
                    }

                    const data = await response.json();
                    const extractedLead = data.lead;

                    if (extractedLead && (extractedLead.name || extractedLead.company || extractedLead.email)) {
                        get().addLead({ ...extractedLead, source: 'vision' });
                        get().addNotification({
                            type: 'success',
                            title: 'Scan Successful',
                            body: `Extracted data for ${extractedLead.name || extractedLead.company || 'new lead'}.`
                        });
                    } else {
                        get().addNotification({ type: 'warning', title: 'Scan Complete', body: "Couldn't confidently extract lead info." });
                    }
                } catch (error: any) {
                    if (error.name === 'AbortError') {
                        get().addNotification({ type: 'warning', title: 'Scan Stopped', body: 'Image scanning was halted.' });
                    } else {
                        console.error("YukiVision error:", error);
                        get().addNotification({ type: 'error', title: 'Scan Failed', body: error.message || 'An error occurred while scanning.' });
                    }
                } finally {
                    set((s) => s.yukiVisionController === controller ? { yukiIsScanning: false, yukiVisionController: null } : s);
                }
            },

            stopYukiVision: () => {
                const { yukiVisionController } = get();
                if (yukiVisionController) {
                    yukiVisionController.abort();
                    set({ yukiIsScanning: false, yukiVisionController: null });
                }
            },
            startYukiBatchVision: async (files) => {
                const state = get();
                if (state.yukiBatchIsScanning) return;

                const controller = new AbortController();
                set({ yukiBatchIsScanning: true, yukiBatchProgress: 0, yukiBatchController: controller });

                try {
                    const total = files.length;
                    let completed = 0;

                    const processFile = async (file: { data: string, type: string }) => {
                        try {
                            const token = import.meta.env.VITE_SUPABASE_ANON_KEY || 'dummy';
                            const response = await fetch('/api/teakel-vision', {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json',
                                    'Authorization': `Bearer ${token}`
                                },
                                body: JSON.stringify({ imageBase64: file.data, mimeType: file.type }),
                                signal: controller.signal
                            });

                            if (response.ok) {
                                const data = await response.json();
                                if (data.lead && (data.lead.name || data.lead.company || data.lead.email)) {
                                    await get().addLead({ ...data.lead, source: 'vision' });
                                }
                            }
                        } catch (err: any) {
                            if (err.name !== 'AbortError') console.error("Batch Vision individual file error:", err);
                        } finally {
                            completed++;
                            set({ yukiBatchProgress: Math.round((completed / total) * 100) });
                        }
                    };

                    // Process in parallel with a concurrency limit if needed, 
                    // but for now simple Promise.all is fine for small batches.
                    await Promise.all(files.map(f => processFile(f)));

                    get().addNotification({
                        type: 'success',
                        title: 'Batch Scan Complete',
                        body: `Processed ${total} files. Check your leads list.`
                    });
                } catch (error: any) {
                    if (error.name === 'AbortError') {
                        get().addNotification({ type: 'warning', title: 'Batch Stopped', body: 'Batch scanning was halted.' });
                    } else {
                        console.error("YukiBatchVision error:", error);
                        get().addNotification({ type: 'error', title: 'Batch Failed', body: 'An error occurred during batch processing.' });
                    }
                } finally {
                    set((s) => s.yukiBatchController === controller ? { yukiBatchIsScanning: false, yukiBatchProgress: 0, yukiBatchController: null } : s);
                }
            },
            stopYukiBatchVision: () => {
                const { yukiBatchController } = get();
                if (yukiBatchController) {
                    yukiBatchController.abort();
                    set({ yukiBatchIsScanning: false, yukiBatchController: null });
                }
            },
            setPomodoroState: (patch) => set((state) => ({
                pomodoroState: typeof patch === 'function'
                    ? patch(state.pomodoroState)
                    : { ...state.pomodoroState, ...patch }
            })),
            setTaskQuadrant: (taskId, quadrant) => set((state) => ({
                eisenhowerMap: { ...state.eisenhowerMap, [taskId]: quadrant }
            })),
            setIsModalOpen: (isModalOpen) => set({ isModalOpen }),
            setIsProjectModalOpen: (isProjectModalOpen) => set({ isProjectModalOpen }),
            setIsTimeLogModalOpen: (isTimeLogModalOpen) => set({ isTimeLogModalOpen }),
            setIsSettingsModalOpen: (isSettingsModalOpen) => set({ isSettingsModalOpen }),
            setIsWorkspaceSettingsModalOpen: (isWorkspaceSettingsModalOpen) => set({ isWorkspaceSettingsModalOpen }),
            setIsThroneModalOpen: (isThroneModalOpen) => set({ isThroneModalOpen }),
            setIsReportBuilderOpen: (isReportBuilderOpen) => set({ isReportBuilderOpen }),
            setActiveReportTemplate: (activeReportTemplate) => set({ activeReportTemplate }),
            setGeneratedReportData: (generatedReportData) => set({ generatedReportData }),
            setIsTeamModalOpen: (isTeamModalOpen) => set({ isTeamModalOpen }),

            // Planner Actions
            setAppointments: (appointments) => set({ appointments }),
            addAppointment: (app) => set(state => {
                const newApp: Appointment = {
                    id: Math.random().toString(36).substring(7),
                    title: 'New Appointment',
                    start_time: new Date().toISOString(),
                    end_time: new Date().toISOString(),
                    date: new Date().toISOString().split('T')[0],
                    created_at: new Date().toISOString(),
                    ...app
                };
                return { appointments: [...state.appointments, newApp] };
            }),
            updateAppointment: (id, patch) => set(state => ({
                appointments: state.appointments.map(a => a.id === id ? { ...a, ...patch } : a)
            })),
            deleteAppointment: (id) => set(state => ({
                appointments: state.appointments.filter(a => a.id !== id)
            })),
            setPlannerView: (plannerView) => set({ plannerView }),
            setSelectedPlannerDate: (selectedPlannerDate) => set({ selectedPlannerDate }),
            setDayPlan: (dayPlan) => set({ dayPlan }),

            generateReport: async (config) => {
                set({ isGeneratingReport: true });
                try {
                    const response = await fetch('/api/generate-report', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            ...config,
                            userId: get().user?.id
                        })
                    });
                    const data = await response.json();
                    if (data.success) {
                        set({
                            generatedReportData: {
                                ...config,
                                stats: data.stats,
                                aiContent: data.aiContent
                            }
                        });
                    }
                } catch (error) {
                    console.error("Failed to generate report:", error);
                } finally {
                    set({ isGeneratingReport: false });
                }
            },
            toggleDarkMode: () => set((state) => ({ isDarkMode: !state.isDarkMode })),
            setUserProfile: async (profile) => {
                const uid = get().user?.id;
                set((state) => ({
                    userProfile: { ...state.userProfile, ...profile }
                }));

                if (uid) {
                    try {
                        const updateData: any = { id: uid }; // Include ID for upsert
                        if (profile.name) updateData.full_name = profile.name;
                        if (profile.avatar_url !== undefined) updateData.avatar_url = profile.avatar_url;
                        if (profile.location !== undefined) updateData.location = profile.location;
                        if (profile.coords !== undefined) updateData.coords = profile.coords;
                        if (profile.global_role !== undefined) updateData.global_role = profile.global_role;

                        if (Object.keys(updateData).length > 1) {
                            console.log('[Store] Persisting profile update to Supabase:', updateData);
                            const { error } = await supabase.from('profiles').upsert(updateData);
                            if (error) {
                                console.error('[Store] Error persisting profile update:', error.message);
                            } else {
                                console.log('[Store] Profile successfully persisted.');
                            }
                        }
                    } catch (e) {
                        console.error('[Store] Profile persistence exception:', e);
                    }
                } else {
                    console.warn('[Store] Cannot persist profile: No authenticated user ID found.');
                }
            },

            fetchSystemHealth: async () => {
                const startTime = Date.now();
                try {
                    // Verifying DB connection with a minimal profile check
                    const { error } = await supabase.from('profiles').select('id').limit(1);
                    const latency = Date.now() - startTime;

                    set((state) => ({
                        systemHealth: {
                            ...state.systemHealth,
                            dbStatus: error ? 'outage' : (latency > 800 ? 'degraded' : 'operational'),
                            lastCheck: new Date().toISOString(),
                            // Simulate AI latency if not recently updated
                            aiLatency: state.systemHealth.aiLatency || Math.floor(Math.random() * 200) + 300,
                            // Derived security alerts from action logs (simulated for demo purpose)
                            securityAlerts: state.aiActionLogs.filter(log =>
                                log.action_type?.includes('delete') ||
                                log.action_type?.includes('role') ||
                                log.details?.priority === 'critical'
                            ).length
                        }
                    }));
                } catch (err) {
                    set((state) => ({
                        systemHealth: { ...state.systemHealth, dbStatus: 'outage', lastCheck: new Date().toISOString() }
                    }));
                }
            },

            fetchIncidents: async () => {
                try {
                    const { data, error } = await supabase
                        .from('system_incidents')
                        .select('*')
                        .order('created_at', { ascending: false });

                    if (error) throw error;
                    set({ incidents: data as SystemIncident[] });
                } catch (err) {
                    console.error('Error fetching incidents:', err);
                }
            },
            setUser: async (user) => {
                set({ user });
                if (user) {
                    const { data: profile, error } = await supabase.from('profiles').select('*').eq('id', user.id).single();
                    
                    if (error) {
                        console.warn('[Store] Profile fetch error (row may not exist):', error.message);
                    }

                    if (profile) {
                        set({
                            userProfile: {
                                name: profile.full_name || 'Guest User',
                                avatar_url: profile.avatar_url,
                                global_role: profile.global_role || 'User',
                                location: profile.location || 'Nairobi',
                                coords: profile.coords || [-1.286389, 36.817223],
                                isLiveLocation: false 
                            },
                            isAdmin: profile.is_admin || false
                        });
                    } else {
                        console.log('[Store] No profile record found in DB for user.');
                    }
                } else {
                    set({ isAdmin: false });
                }
            },
            setWorkspaceSettings: (settings) => {
                set((state) => ({
                    workspaceSettings: { ...state.workspaceSettings, ...settings }
                }));
                // Persist changes to Supabase in the background
                void updateWorkspaceSettingsInDB(settings);
            },
            setGeminiApiKey: (geminiApiKey) => set({ geminiApiKey }),
            setUseLocalModel: (useLocalModel) => set({ useLocalModel }),
            setLocalModelUrl: (localModelUrl) => set({ localModelUrl }),
            setEditingTask: (editingTask) => set({ editingTask }),
            setEditingProject: (editingProject) => set({ editingProject }),
            setSelectedTaskIdForTimeLog: (selectedTaskIdForTimeLog) => set({ selectedTaskIdForTimeLog }),

            setFormData: (updater) => set((state) => ({
                formData: typeof updater === 'function' ? updater(state.formData) : { ...state.formData, ...updater }
            })),
            setProjectFormData: (updater) => set((state) => ({
                projectFormData: typeof updater === 'function' ? updater(state.projectFormData) : { ...state.projectFormData, ...updater }
            })),
            setTimeLogFormData: (updater) => set((state) => ({
                timeLogFormData: typeof updater === 'function' ? updater(state.timeLogFormData) : { ...state.timeLogFormData, ...updater }
            })),

            setIsNavOpen: (isNavOpen) => set({ isNavOpen }),
            setIsSidebarOpen: (isSidebarOpen) => set({ isSidebarOpen }),
            setSupportTab: (supportTab) => set({ supportTab }),

            // ─── Support: Supabase-backed ───
            fetchSupportTickets: async () => {
                // Use store user (works with DEV BYPASS too)
                const uid = get().user?.id;
                const isAdminUser = get().isAdmin;
                if (!uid) return;
                try {
                    const query = supabase.from('support_tickets').select('*').order('created_at', { ascending: false });
                    const { data, error } = await (isAdminUser ? query : query.eq('user_id', uid));
                    if (error) { console.warn('[Support] fetchTickets error:', error.message); return; }
                    if (data) {
                        const mapped: SupportTicket[] = data.map((t: any) => ({
                            id: t.id, title: t.title, description: t.description,
                            category: t.category, priority: t.priority, status: t.status,
                            userId: t.user_id, userName: t.user_name, createdAt: t.created_at,
                        }));
                        set({ supportTickets: mapped });
                    }
                } catch (e) { console.warn('[Support] fetchTickets exception:', e); }
            },

            fetchFeedbackItems: async () => {
                const uid = get().user?.id;
                try {
                    const { data: items, error } = await supabase.from('feedback_items').select('*').order('votes', { ascending: false });
                    if (error) { console.warn('[Support] fetchFeedback error:', error.message); return; }
                    let votedIds = new Set<string>();
                    if (uid) {
                        const { data: votes } = await supabase.from('feedback_votes').select('feedback_id').eq('user_id', uid);
                        if (votes) votedIds = new Set(votes.map((v: any) => v.feedback_id));
                    }
                    if (items) {
                        const mapped: FeedbackItem[] = items.map((f: any) => ({
                            id: f.id, title: f.title, description: f.description,
                            category: f.category, status: f.status, votes: f.votes,
                            userVoted: votedIds.has(f.id),
                        }));
                        set({ feedbackItems: mapped });
                    }
                } catch (e) { console.warn('[Support] fetchFeedback exception:', e); }
            },

            addSupportTicket: async (ticketData) => {
                // Use store user — works even with DEV BYPASS
                const uid = get().user?.id;
                const userName = ticketData.userName || get().userProfile?.name || 'Unknown';
                // Always add optimistically first so UI is instant
                const localTicket: SupportTicket = {
                    id: `local-${Date.now()}`,
                    title: ticketData.title,
                    description: ticketData.description,
                    category: ticketData.category,
                    priority: ticketData.priority,
                    status: 'open',
                    userId: uid || 'local',
                    userName,
                    createdAt: new Date().toISOString(),
                };
                set(s => ({ supportTickets: [localTicket, ...s.supportTickets] }));
                // Then try to persist to Supabase
                if (uid) {
                    try {
                        const { error } = await supabase.from('support_tickets').insert({
                            title: ticketData.title, description: ticketData.description,
                            category: ticketData.category, priority: ticketData.priority,
                            status: 'open', user_id: uid, user_name: userName,
                        });
                        if (!error) {
                            // Replace local ticket with real DB ticket
                            await useAppStore.getState().fetchSupportTickets();
                        } else {
                            console.warn('[Support] addTicket DB error (local state kept):', error.message);
                        }
                    } catch (e) { console.warn('[Support] addTicket exception (local state kept):', e); }
                }
            },

            updateTicketStatus: async (id, status) => {
                // Optimistic update first
                set(state => ({
                    supportTickets: state.supportTickets.map(t => t.id === id ? { ...t, status } : t)
                }));
                try {
                    const { error } = await supabase.from('support_tickets').update({ status }).eq('id', id);
                    if (error) console.warn('[Support] updateStatus DB error:', error.message);
                } catch (e) { console.warn('[Support] updateStatus exception:', e); }
            },

            voteFeedback: async (id, userId) => {
                const item = useAppStore.getState().feedbackItems.find(f => f.id === id);
                if (!item) return;
                // Optimistic local update first
                set(s => ({
                    feedbackItems: s.feedbackItems.map(f => f.id === id
                        ? { ...f, votes: item.userVoted ? f.votes - 1 : f.votes + 1, userVoted: !f.userVoted }
                        : f)
                }));
                try {
                    if (item.userVoted) {
                        await supabase.from('feedback_votes').delete().eq('feedback_id', id).eq('user_id', userId);
                        await supabase.from('feedback_items').update({ votes: Math.max(0, item.votes - 1) }).eq('id', id);
                    } else {
                        await supabase.from('feedback_votes').upsert({ feedback_id: id, user_id: userId });
                        await supabase.from('feedback_items').update({ votes: item.votes + 1 }).eq('id', id);
                    }
                } catch (e) { console.warn('[Support] vote exception (local state kept):', e); }
            },

            addFeedbackItem: async (itemData) => {
                const uid = get().user?.id;
                // Optimistic local add first
                const localItem: FeedbackItem = {
                    id: `local-${Date.now()}`,
                    title: itemData.title,
                    description: itemData.description,
                    category: itemData.category,
                    status: 'considering',
                    votes: 1,
                    userVoted: true,
                };
                set(s => ({ feedbackItems: [localItem, ...s.feedbackItems] }));
                // Then persist
                try {
                    const { error } = await supabase.from('feedback_items').insert({
                        title: itemData.title, description: itemData.description,
                        category: itemData.category, status: 'considering', votes: 1,
                        created_by: uid || null,
                    });
                    if (!error) {
                        // Record vote for this user if we have their ID
                        if (uid) {
                            const { data: newItem } = await supabase.from('feedback_items')
                                .select('id').eq('title', itemData.title).order('created_at', { ascending: false }).limit(1).single();
                            if (newItem) await supabase.from('feedback_votes').upsert({ feedback_id: newItem.id, user_id: uid });
                        }
                        await useAppStore.getState().fetchFeedbackItems();
                    } else {
                        console.warn('[Support] addFeedback DB error (local state kept):', error.message);
                    }
                } catch (e) { console.warn('[Support] addFeedback exception (local state kept):', e); }
            },

            fetchData: async () => {
                try {
                    // Fetch all citizens concurrently to populate Assignee dropdowns
                    get().fetchAllProfiles();

                    // Load global workspace settings
                    void fetchWorkspaceSettings().then((settings) => {
                        if (settings) {
                            set({ workspaceSettings: settings });
                        }
                    });

                    const [tasksRes, projectsRes, metricsRes, deptsRes, teamsRes, logsRes] = await Promise.all([
                        supabase.from('tasks').select('*').is('deleted_at', null).order('created_at', { ascending: false }),
                        supabase.from('projects').select('*').is('deleted_at', null).order('created_at', { ascending: false }),
                        supabase.from('time_logs').select('*'),
                        supabase.from('departments').select('*').order('name'),
                        supabase.from('teams').select('*, members:team_members(*)').order('name'),
                        supabase.from('ai_action_logs').select('*').order('timestamp', { ascending: false }).limit(20)
                    ]);

                    if (tasksRes.error) throw tasksRes.error;
                    if (projectsRes.error) throw projectsRes.error;
                    if (metricsRes.error) throw metricsRes.error;

                    const fetchedDepts = (deptsRes.data as Department[]) || [];
                    const fetchedTeams = (teamsRes.data as Team[]) || [];

                    // Important fix: Nest teams inside their respective departments for the UI
                    const departmentsWithTeams = fetchedDepts.map(dept => {
                        const deptTeams = fetchedTeams.filter(team => team.department_id === dept.id);
                        return { ...dept, teams: deptTeams };
                    });

                    if (deptsRes.error) {
                        console.error('Error fetching departments:', deptsRes.error);
                    } else {
                        set({ departments: departmentsWithTeams });
                    }

                    if (teamsRes.error) {
                        console.error('Error fetching teams:', teamsRes.error);
                    } else {
                        set({ teams: fetchedTeams });
                    }

                    const tasksData = tasksRes.data || [];
                    const projectsData = projectsRes.data || [];
                    const timeLogs = metricsRes.data || [];
                    const totalHours = timeLogs.reduce((sum, log) => sum + (log.hours || 0), 0);

                    set({
                        tasks: tasksData as Task[],
                        projects: projectsData as Project[],
                        timeLogs: timeLogs as any[],
                        aiActionLogs: logsRes.data || [],
                        totalHours: totalHours
                    });

                    // ----------------------------------------------------
                    // Fetch Chat Session List (Don't auto-load content)
                    // ----------------------------------------------------
                    try {
                        // We fetch the list so the history sidebar is accurate,
                        // but we no longer 'set' messages from the latest session here.
                        await get().fetchChatSessions('main');
                    } catch (chatErr) {
                        console.warn('Failed to load chat sessions:', chatErr);
                    }
                    // ----------------------------------------------------

                    // Set default project if none selected and projects exist
                    const state = get();
                    if (state.formData.project_id === 0 && Array.isArray(projectsData) && projectsData.length > 0) {
                        set((s) => ({
                            formData: { ...s.formData, project_id: projectsData[0].id }
                        }));
                    }
                } catch (error) {
                    console.error('Error fetching data from Supabase:', error);
                }
            },
            initializeAuth: () => {
                // Production Settings Re-Sync: If we're on a live domain but localStorage 
                // has stale 'local model' settings from dev, override them once.
                const isProduction = typeof window !== 'undefined' &&
                    !window.location.hostname.includes('localhost') &&
                    !window.location.hostname.includes('127.0.0.1');

                if (isProduction && get().useLocalModel) {
                    console.log('[System] Production detected. Optimizing AI settings for Cloud...');
                    set((state) => ({
                        useLocalModel: false,
                        workspaceSettings: { ...state.workspaceSettings, cloudAiEnabled: true }
                    }));
                }

                // Initial session check
                supabase.auth.getSession().then(({ data: { session } }) => {
                    get().setUser(session?.user ?? null);
                    if (session?.user) get().fetchData();
                });

                // Listen for changes
                const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
                    get().setUser(session?.user ?? null);
                    if (session?.user) {
                        get().fetchData();
                    } else {
                        set({ tasks: [], projects: [], totalHours: 0 });
                    }
                });

                return () => subscription.unsubscribe();
            },
            signOut: async () => {
                await supabase.auth.signOut();
                set({
                    user: null, tasks: [], projects: [], totalHours: 0,
                    mainChatSessions: [], supportChatSessions: [],
                    activeMainChatId: null, activeSupportChatId: null,
                    messages: [
                        { role: 'assistant', content: 'Hello! I am your Work Intelligence Agent. How can I help you manage your tasks today?' }
                    ]
                });
            },

            fetchChatSessions: async (module) => {
                const uid = get().user?.id;
                if (!uid) return;
                const { data, error } = await supabase
                    .from('ai_chat_sessions')
                    .select('id, title, updated_at')
                    .eq('user_id', uid)
                    .eq('module', module)
                    .order('updated_at', { ascending: false });
                if (!error && data) {
                    if (module === 'main') set({ mainChatSessions: data });
                    else set({ supportChatSessions: data });
                }
            },

            setActiveChatSessionId: (module, id) => {
                if (module === 'main') set({ activeMainChatId: id });
                else set({ activeSupportChatId: id });
            },
            setIsChatHistoryOpen: (isOpen) => set({ isChatHistoryOpen: isOpen }),

            deleteChatSession: async (module, sessionId) => {
                const uid = get().user?.id;
                if (!uid) return;
                await supabase.from('ai_chat_sessions').delete().eq('id', sessionId).eq('user_id', uid);
                // If the deleted session is active, start fresh
                const activeId = module === 'main' ? get().activeMainChatId : get().activeSupportChatId;
                if (activeId === sessionId) {
                    get().createNewChatSession(module);
                }
                await get().fetchChatSessions(module);
            },

            renameChatSession: async (module, sessionId, newTitle) => {
                const uid = get().user?.id;
                if (!uid) return;
                await supabase.from('ai_chat_sessions').update({ title: newTitle }).eq('id', sessionId).eq('user_id', uid);
                await get().fetchChatSessions(module);
            },

            deleteAllChatSessions: async (module) => {
                const uid = get().user?.id;
                if (!uid) return;
                await supabase.from('ai_chat_sessions').delete().eq('user_id', uid).eq('module', module);
                get().createNewChatSession(module);
                if (module === 'main') set({ mainChatSessions: [] });
                else set({ supportChatSessions: [] });
            },

            createNewChatSession: (module) => {
                if (module === 'main') {
                    set({
                        activeMainChatId: null,
                        messages: [{ role: 'assistant', content: 'Hello! Let\'s start a new conversation. What can I help you with?' }]
                    });
                } else {
                    set({
                        activeSupportChatId: null,
                        // We don't reset the global messages if we're in support assistant 
                        // unless specifically requested, but for now we follow the same pattern if it's the main greeting
                    });
                }
            },

            loadChatSession: async (module, sessionId) => {
                const uid = get().user?.id;
                if (!uid) return null;

                const activeId = module === 'main' ? get().activeMainChatId : get().activeSupportChatId;

                let query = supabase.from('ai_chat_sessions').select('id, messages').eq('user_id', uid).eq('module', module);

                if (sessionId) {
                    query = query.eq('id', sessionId);
                } else if (activeId) {
                    query = query.eq('id', activeId);
                } else {
                    query = query.order('updated_at', { ascending: false }).limit(1);
                }

                const { data, error } = await query.maybeSingle();

                if (!error && data) {
                    if (module === 'main') set({ activeMainChatId: data.id });
                    else set({ activeSupportChatId: data.id });
                    return data.messages;
                } else if (error) {
                    console.warn(`Failed to load ${module} chat session:`, error);
                }
                return null;
            },

            saveChatSession: async (module, msgs) => {
                const uid = get().user?.id;
                if (!uid) return;

                const activeId = module === 'main' ? get().activeMainChatId : get().activeSupportChatId;

                // Smarter title generation based on the first user message
                const userMsgs = msgs.filter(m => m.role === 'user');
                let titleText = 'New Conversation';
                if (userMsgs.length > 0) {
                    const firstMsg = userMsgs[0].content.trim();
                    titleText = firstMsg.length > 40 ? firstMsg.substring(0, 40) + '...' : firstMsg;
                }

                if (activeId) {
                    // Update existing
                    await supabase.from('ai_chat_sessions').update({
                        messages: msgs,
                        title: titleText,
                        updated_at: new Date().toISOString()
                    }).eq('id', activeId);
                } else {
                    // Create new
                    const { data, error } = await supabase.from('ai_chat_sessions').insert({
                        user_id: uid,
                        module,
                        messages: msgs,
                        title: titleText,
                        updated_at: new Date().toISOString()
                    }).select('id').single();

                    if (data && !error) {
                        if (module === 'main') set({ activeMainChatId: data.id });
                        else set({ activeSupportChatId: data.id });
                    }
                }

                // Refresh history list
                get().fetchChatSessions(module);
            },

            inviteUser: async (email) => {
                return await supabase.auth.signInWithOtp({
                    email,
                    options: {
                        emailRedirectTo: window.location.origin,
                        shouldCreateUser: true
                    }
                });
            },

            resetUserPassword: async (email) => {
                return await supabase.auth.resetPasswordForEmail(email, {
                    redirectTo: window.location.origin + '/reset-password',
                });
            },

            toggleUserAdmin: async (userId, currentStatus) => {
                const { error } = await supabase
                    .from('profiles')
                    .update({ is_admin: !currentStatus })
                    .eq('id', userId);
                return { error };
            },

            updateGlobalRole: async (userId, role) => {
                const { error } = await supabase
                    .from('profiles')
                    .update({ global_role: role, is_admin: role === 'Global Admin' })
                    .eq('id', userId);
                if (!error) {
                    get().fetchAllProfiles(); // Refresh the directory

                    // If modifying oneself, refresh own session data
                    if (userId === get().user?.id) {
                        const { data: profile } = await supabase.from('profiles').select('*').eq('id', userId).single();
                        if (profile) {
                            set(state => ({
                                userProfile: { ...state.userProfile, global_role: profile.global_role },
                                isAdmin: profile.is_admin
                            }));
                        }
                    }
                }
                return { error };
            },

            createDepartment: async (name, description) => {
                const { data, error } = await supabase.from('departments').insert([{ name, description }]).select().single();
                if (data) {
                    set(state => ({ departments: [...state.departments, { ...data, teams: [] }] }));
                }
                return { error };
            },

            createTeam: async (name, departmentId) => {
                const { data, error } = await supabase.from('teams').insert([{ name, department_id: departmentId }]).select().single();
                if (data && !error) {
                    const newTeamData = { ...data, members: [] };
                    set(state => {
                        const newTeams = [...state.teams, newTeamData];
                        // Also nest it under the right department for UI
                        const newDepartments = state.departments.map(d => {
                            if (d.id === departmentId) {
                                return { ...d, teams: [...(d.teams || []), newTeamData] };
                            }
                            return d;
                        });
                        return { teams: newTeams, departments: newDepartments };
                    });
                    // Refresh completely to ensure RLS dependencies or linkages are synced
                    get().fetchData();
                }
                return { error };
            },

            updateTeam: async (teamId, name) => {
                const { data, error } = await supabase.from('teams').update({ name }).eq('id', teamId).select().single();
                if (data && !error) {
                    set(state => {
                        const newTeams = state.teams.map(t => t.id === teamId ? { ...t, ...data } : t);
                        const newDepartments = state.departments.map(d => {
                            if (d.id === data.department_id) {
                                return { ...d, teams: (d.teams || []).map(t => t.id === teamId ? { ...t, name } : t) };
                            }
                            return d;
                        });
                        return { teams: newTeams, departments: newDepartments };
                    });
                }
                return { error };
            },

            deleteTeam: async (teamId) => {
                const teamToDelete = get().teams.find(t => t.id === teamId);
                const { error } = await supabase.from('teams').delete().eq('id', teamId);
                if (!error && teamToDelete) {
                    set(state => {
                        const newTeams = state.teams.filter(t => t.id !== teamId);
                        const newDepartments = state.departments.map(d => {
                            if (d.id === teamToDelete.department_id) {
                                return { ...d, teams: (d.teams || []).filter(t => t.id !== teamId) };
                            }
                            return d;
                        });
                        return { teams: newTeams, departments: newDepartments };
                    });
                }
                return { error };
            },

            moveTeam: async (teamId, newDepartmentId) => {
                const { error } = await supabase
                    .from('teams')
                    .update({ department_id: newDepartmentId })
                    .eq('id', teamId);

                if (!error) {
                    set(state => {
                        const newTeams = state.teams.map(t =>
                            t.id === teamId ? { ...t, department_id: newDepartmentId } : t
                        );

                        // We also need to update the nested teams inside departments
                        const newDepartments = state.departments.map(d => {
                            // Remove from old
                            const filteredTeams = (d.teams || []).filter(t => t.id !== teamId);

                            // Add to new
                            if (d.id === newDepartmentId) {
                                const movedTeam = state.teams.find(t => t.id === teamId);
                                if (movedTeam) {
                                    filteredTeams.push({ ...movedTeam, department_id: newDepartmentId });
                                }
                            }
                            return { ...d, teams: filteredTeams };
                        });

                        return { teams: newTeams, departments: newDepartments };
                    });
                }
                return { error };
            },

            fetchAllProfiles: async () => {
                const { data, error } = await supabase.from('profiles').select('*').order('full_name');
                if (!error && data) {
                    set({ allProfiles: data });
                }
            },

            assignUserToTeam: async (userId, teamId, role) => {
                // Upsert handles updates if they're already in a team but role changed
                const { error } = await supabase.from('team_members').upsert({
                    team_id: teamId,
                    user_id: userId,
                    role: role
                }, { onConflict: 'team_id,user_id' });

                if (!error) {
                    get().fetchData();
                }
                return { error };
            },

            removeUserFromTeam: async (userId, teamId) => {
                const { error } = await supabase.from('team_members').delete().match({ team_id: teamId, user_id: userId });
                if (!error) {
                    get().fetchData();
                }
                return { error };
            },

            toggleProjectSelection: (id) => set(state => ({
                selectedProjectIds: state.selectedProjectIds.includes(id)
                    ? state.selectedProjectIds.filter(pid => pid !== id)
                    : [...state.selectedProjectIds, id]
            })),

            clearProjectSelection: () => set({ selectedProjectIds: [] }),

            deleteProject: async (id) => {
                const { error } = await supabase.from('projects').update({ deleted_at: new Date().toISOString() }).eq('id', id);
                if (!error) {
                    set(state => ({
                        projects: state.projects.filter(p => p.id !== id),
                        selectedProjectIds: state.selectedProjectIds.filter(pid => pid !== id)
                    }));
                }
            },

            bulkDeleteProjects: async (ids) => {
                const { error } = await supabase.from('projects').update({ deleted_at: new Date().toISOString() }).in('id', ids);
                if (!error) {
                    set(state => ({
                        projects: state.projects.filter(p => !ids.includes(p.id)),
                        selectedProjectIds: []
                    }));
                }
            },

            updateLastActive: async () => {
                const uid = get().user?.id;
                if (!uid) return;
                await supabase.from('profiles').update({ last_active_at: new Date().toISOString() }).eq('id', uid);
            },

            sendPoke: async (toUserId) => {
                const fromId = get().user?.id;
                if (!fromId) return;
                const toProfile = get().allProfiles.find(p => p.id === toUserId);
                const toName = toProfile?.full_name || 'Member';
                const { error } = await supabase.from('pokes').insert([{ from_id: fromId, to_id: toUserId }]);
                if (error) {
                    get().addNotification({ type: 'error', title: "Buzz Failed", body: "Failed to send buzz." });
                } else {
                    get().addNotification({ type: 'success', title: "Buzz Sent", body: `Buzz sent to **${toName}**!` });
                }
            },

            subscribeToPokes: () => {
                const uid = get().user?.id;
                if (!uid) return;

                const subscription = supabase
                    .channel('pokes')
                    .on('postgres_changes', {
                        event: 'INSERT',
                        schema: 'public',
                        table: 'pokes',
                        filter: `to_id=eq.${uid}`
                    }, (payload: any) => {
                        const fromProfile = get().allProfiles.find(p => p.id === payload.new.from_id);
                        get().addNotification({
                            type: 'info',
                            title: 'New Buzz!',
                            body: `**${fromProfile?.full_name || 'Someone'}** buzzed you!\n\n"Hey i am online and active come join"`
                        });
                    })
                    .subscribe();

                return () => {
                    supabase.removeChannel(subscription);
                };
            },

            broadcastNotification: async (data) => {
                const uid = get().user?.id;
                if (!uid) return { error: 'Not authenticated' };
                const { error } = await supabase.from('global_notifications').insert([{
                    ...data,
                    created_by: uid
                }]);
                return { error };
            },

            subscribeToGlobalNotifications: () => {
                const subscription = supabase
                    .channel('global_notifications')
                    .on('postgres_changes', {
                        event: 'INSERT',
                        schema: 'public',
                        table: 'global_notifications'
                    }, (payload: any) => {
                        get().addNotification({
                            type: payload.new.type,
                            title: payload.new.title,
                            body: payload.new.body
                        });
                    })
                    .subscribe();

                return () => {
                    supabase.removeChannel(subscription);
                };
            }
        }),
        {
            name: 'tickel-storage',
            partialize: (state) => ({
                isDarkMode: state.isDarkMode,
                useLocalModel: state.useLocalModel,
                localModelUrl: state.localModelUrl,
                geminiApiKey: state.geminiApiKey,
                yukiMaxResults: state.yukiMaxResults,
                activeTab: state.activeTab,
                teakelActiveTab: state.teakelActiveTab
            })
        }
    )
);
