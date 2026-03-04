import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  LayoutDashboard,
  MessageSquare,
  Plus,
  Clock,
  TrendingUp,
  CheckCircle2,
  AlertCircle,
  Send,
  Loader2,
  ChevronRight,
  Briefcase,
  Calendar,
  BarChart3,
  Edit2,
  Trash2,
  Settings,
  Mail,
  Lock,
  ArrowRight,
  Shield,
  Tag,
  User,
  Paperclip,
  AlertTriangle,
  CheckSquare,
  Layers,
  PlusCircle,
  Sparkles,
  Maximize2,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  History,
  CalendarDays,
  Users,
  LifeBuoy,
  Bell,
  FileText,
  Flame,
  Zap,
  Activity,
  Target,
  Search,
  PieChart,
  LineChart,
  Brain,
  Timer,
  TrendingDown,
  Square
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

import { useAppStore, Task, Project, Message } from './store/useAppStore';
import { supabase } from './lib/supabase';
import { chatWithLocalModel, parseTaskFromPrompt } from './lib/localAi';
import { routeMessage } from './lib/aiRouter';
import Auth from './components/Auth';
import { TeamStructure } from './components/TeamStructure';
import { TeamAnalytics } from './components/TeamAnalytics';
import { AICommandCenter } from './components/AICommandCenter';
import { WorkspaceSettings } from './components/WorkspaceSettings';
import { TeamInsights } from './components/TeamInsights';
import { FocusAssistant } from './components/FocusAssistant';
import { ReportsDashboard } from './components/ReportsDashboard';
import { ReportBuilderModal } from './components/ReportBuilderModal';
import { ReportViewer } from './components/ReportViewer';
import { SupportHub } from './components/SupportHub';
import { UserProfileMenu } from './components/UserProfileMenu';
import {
  TotalTimeModal, TasksCompletedModal, ActiveTasksModal,
  FocusScoreModal, ConsistencyModal
} from './components/DashboardCardModals';
import { PomodoroWidget } from './components/PomodoroWidget';
import { ChatHistoryDrawer } from './components/ChatHistoryDrawer';
import { FocusModeModal } from './components/FocusModeModal';
import { EisenhowerMatrix } from './components/EisenhowerMatrix';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export default function App() {
  const {
    tasks, setEditingTask,
    projects,
    teams,
    allProfiles, setAllProfiles,
    totalHours,
    messages, setMessages,
    input, setInput,
    isLoading, setIsLoading,
    isRefreshing, setIsRefreshing,
    activeTab, setActiveTab,
    isModalOpen, setIsModalOpen,
    isProjectModalOpen, setIsProjectModalOpen,
    isTimeLogModalOpen, setIsTimeLogModalOpen,
    editingTask,
    editingProject, setEditingProject,
    selectedTaskIdForTimeLog, setSelectedTaskIdForTimeLog,
    isSettingsModalOpen, setIsSettingsModalOpen,
    isWorkspaceSettingsModalOpen, setIsWorkspaceSettingsModalOpen,
    isThroneModalOpen, setIsThroneModalOpen,
    isDarkMode, toggleDarkMode,
    userProfile, setUserProfile,
    user, isAdmin,
    geminiApiKey, setGeminiApiKey,
    useLocalModel, setUseLocalModel,
    localModelUrl, setLocalModelUrl,
    formData, setFormData,
    projectFormData, setProjectFormData,
    timeLogFormData, setTimeLogFormData,
    isNavOpen, setIsNavOpen,
    isSidebarOpen, setIsSidebarOpen,
    inviteUser, resetUserPassword, toggleUserAdmin,
    initializeAuth, signOut,
    fetchData, saveChatSession,
    mainChatSessions, activeMainChatId, isChatHistoryOpen, setIsChatHistoryOpen, createNewChatSession, loadChatSession,
    deleteChatSession, renameChatSession, deleteAllChatSessions,
    timeLogs, workspaceSettings, setIsReportBuilderOpen, setActiveReportTemplate
  } = useAppStore();

  const { focusScore, focusLabel, streakCount, streakDaysUI } = useMemo(() => {
    if (!timeLogs || !tasks) return { focusScore: 0, focusLabel: 'Need more data', streakCount: 0, streakDaysUI: [] };

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Collect dates with activity
    const activityDates = new Set<string>();
    timeLogs.forEach((log: any) => { if (log.date) activityDates.add(log.date); });
    tasks.forEach((t: any) => {
      if (t.status === 'done' && t.updated_at) {
        activityDates.add(new Date(t.updated_at).toISOString().split('T')[0]);
      }
    });

    // Calculate streak
    let currentStreak = 0;
    const checkDate = new Date(today);
    const todayStr = checkDate.toISOString().split('T')[0];
    checkDate.setDate(checkDate.getDate() - 1);
    const yesterdayStr = checkDate.toISOString().split('T')[0];

    if (activityDates.has(todayStr) || activityDates.has(yesterdayStr)) {
      let runDate = new Date(activityDates.has(todayStr) ? todayStr : yesterdayStr);
      while (activityDates.has(runDate.toISOString().split('T')[0])) {
        currentStreak++;
        runDate.setDate(runDate.getDate() - 1);
      }
    }

    // Last 7 days for mini-chart
    const dayLabels = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
    const last7 = [];
    const tempDate = new Date(today);
    tempDate.setDate(tempDate.getDate() - 6);
    for (let i = 0; i < 7; i++) {
      last7.push({
        active: activityDates.has(tempDate.toISOString().split('T')[0]),
        label: dayLabels[tempDate.getDay()]
      });
      tempDate.setDate(tempDate.getDate() + 1);
    }

    // Calculate dynamic focus score based on today's efforts
    const tasksDoneToday = tasks.filter((t: any) => t.status === 'done' && t.updated_at?.startsWith(todayStr)).length;
    const hoursToday = timeLogs.filter((l: any) => l.date === todayStr).reduce((acc: number, l: any) => acc + (l.hours || 0), 0);

    let score = 40 + (tasksDoneToday * 15) + (hoursToday * 8) + (currentStreak * 2);
    if (score > 100) score = 100;
    if (tasksDoneToday === 0 && hoursToday === 0) {
      score = currentStreak > 0 ? 45 : 0;
    }

    let label = 'Needs focus';
    if (score >= 90) label = 'Flow State';
    else if (score >= 75) label = 'Excellent focus';
    else if (score >= 50) label = 'Good productivity';
    else if (score > 0) label = 'Warming up';

    return { focusScore: score, focusLabel: label, streakCount: currentStreak, streakDaysUI: last7 };
  }, [timeLogs, tasks]);

  const [inviteEmail, setInviteEmail] = useState('');
  const [isAdminPanelLoading, setIsAdminPanelLoading] = useState(false);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [isWorkspaceInfoOpen, setIsWorkspaceInfoOpen] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [aiTaskPrompt, setAiTaskPrompt] = useState('');
  const [newSubtask, setNewSubtask] = useState('');
  const [activeDashCard, setActiveDashCard] = useState<'time' | 'completed' | 'active' | 'focus' | 'streak' | null>(null);
  const [isFocusModeOpen, setIsFocusModeOpen] = useState(false);
  const [tasksView, setTasksView] = useState<'all' | 'matrix'>('all');

  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const unsub = initializeAuth();
    return () => {
      if (typeof unsub === 'function') unsub();
    };
  }, [initializeAuth]);

  // Continuously sync main AI Chat History to cloud DB
  useEffect(() => {
    if (user && messages.length > 1) {
      saveChatSession('main', messages);
    }
  }, [messages, user, saveChatSession]);

  useEffect(() => {
    // Fetch profiles whenever the task modal or throne modal opens (or on initial admin check)
    if (isModalOpen || (isThroneModalOpen && isAdmin)) {
      fetchProfiles();
    }
  }, [isModalOpen, isThroneModalOpen, isAdmin]);

  const fetchProfiles = async () => {
    // Relying on the global store for this now to prevent disparate state issues
    // Just a placeholder to avoid breaking the useEffect below if it references this
  };
  const handleInviteUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail) return;
    const { error } = await inviteUser(inviteEmail);
    if (!error) {
      alert('Invitation (Magic Link) sent!');
      setInviteEmail('');
    } else {
      alert(`Error: ${error.message}`);
    }
  };

  const handleMagicFill = async () => {
    if (!aiTaskPrompt.trim()) return;
    setIsLoading(true);
    try {
      const parsed = await parseTaskFromPrompt(aiTaskPrompt, localModelUrl);
      if (parsed) {
        setFormData(prev => ({
          ...prev,
          ...parsed,
          subtasks: parsed.subtasks || prev.subtasks,
          tags: parsed.tags || prev.tags
        }));
        setAiTaskPrompt('');
      }
    } catch (e) {
      console.error('Magic Fill failed', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      const metadata = user.user_metadata;
      if (metadata?.full_name && userProfile.name === 'Guest User') {
        setUserProfile({ name: metadata.full_name });
      }
    }
  }, [user, setUserProfile, userProfile.name]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Auto-calculate estimated hours when start and due dates are populated
  useEffect(() => {
    if (formData.start_date && formData.due_date) {
      const start = new Date(formData.start_date).getTime();
      const end = new Date(formData.due_date).getTime();
      if (!isNaN(start) && !isNaN(end) && end > start) {
        const diffMs = end - start;
        const diffHours = parseFloat((diffMs / (1000 * 60 * 60)).toFixed(2));
        setFormData(prev => ({ ...prev, estimated_hours: diffHours }));
      }
    }
  }, [formData.start_date, formData.due_date, setFormData]);

  const handleOpenModal = (task?: Task) => {
    if (projects.length === 0) {
      alert("You must create a project first before adding a task. Ask the Work Agent to create a project for you.");
      return;
    }

    if (task) {
      setEditingTask(task);
      setFormData({
        title: task.title,
        description: task.description,
        project_id: task.project_id,
        priority: task.priority,
        estimated_hours: task.estimated_hours,
        status: task.status,
        due_date: task.due_date || '',
        start_date: task.start_date || '',
        assignee_id: task.assignee_id || '',
        subtasks: task.subtasks || [],
        tags: task.tags || [],
        is_private: task.is_private || false,
        budget: task.budget || 0
      });
    } else {
      setEditingTask(null);
      setFormData({
        title: '',
        description: '',
        project_id: projects[0]?.id || 0,
        priority: 'medium',
        estimated_hours: 0,
        status: 'todo',
        due_date: '',
        start_date: '',
        assignee_id: user?.id || '',
        subtasks: [],
        tags: [],
        is_private: false,
        budget: 0
      });
    }
    setIsModalOpen(true);
  };

  const handleOpenProjectModal = (project?: Project) => {
    if (project) {
      setEditingProject(project);
      setProjectFormData({
        name: project.name,
        description: project.description,
        status: project.status
      });
    } else {
      setEditingProject(null);
      setProjectFormData({ name: '', description: '', status: 'active' });
    }
    setIsProjectModalOpen(true);
  };

  const handleOpenTimeLogModal = (taskId: number) => {
    setSelectedTaskIdForTimeLog(taskId);
    setTimeLogFormData({ hours: 0, date: new Date().toISOString().split('T')[0] });
    setIsTimeLogModalOpen(true);
  };

  const handleSaveTask = async (e: React.FormEvent, addAnother = false) => {
    e.preventDefault();
    if (formData.project_id === 0) {
      alert("A valid project must be selected.");
      return;
    }

    const payloadToSave = { ...formData };

    // Hard fallback: If a Contributor's locked dropdown somehow cleared the ID, inject it explicitly
    if (userProfile?.global_role === 'Contributor' && !payloadToSave.assignee_id) {
      payloadToSave.assignee_id = user?.id || '';
    }

    // Supabase strict typing: convert empty frontend strings to actual DB nulls
    if (payloadToSave.assignee_id === '') payloadToSave.assignee_id = null as any;
    if (payloadToSave.due_date === '') payloadToSave.due_date = null as any;
    if (payloadToSave.start_date === '') payloadToSave.start_date = null as any;
    if (payloadToSave.project_id === 0) payloadToSave.project_id = null as any;

    try {
      let res;
      if (editingTask) {
        res = await supabase.from('tasks').update(payloadToSave).eq('id', editingTask.id);
      } else {
        res = await supabase.from('tasks').insert([payloadToSave]);
      }

      if (!res.error) {
        if (!addAnother) {
          setIsModalOpen(false);
        } else {
          // Reset for next task
          setFormData(prev => ({ ...prev, title: '', description: '', subtasks: [] }));
        }
        fetchData();
      } else {
        alert(`Error: ${res.error.message}`);
      }
    } catch (error) {
      console.error('Error saving task:', error);
    }
  };

  const handleDeleteTask = async (id: number) => {
    if (!confirm('Are you sure you want to delete this task?')) return;
    try {
      const res = await supabase.from('tasks').update({ deleted_at: new Date().toISOString() }).eq('id', id);
      if (!res.error) fetchData();
    } catch (error) {
      console.error('Error deleting task:', error);
    }
  };

  const handleSaveProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectFormData.name.trim()) {
      alert("Project name is required.");
      return;
    }

    try {
      let res;
      if (editingProject) {
        res = await supabase.from('projects').update(projectFormData).eq('id', editingProject.id);
      } else {
        res = await supabase.from('projects').insert([projectFormData]);
      }

      if (!res.error) {
        setIsProjectModalOpen(false);
        fetchData();
      } else {
        alert(`Error: ${res.error.message}`);
      }
    } catch (error) {
      console.error('Error saving project:', error);
    }
  };

  const handleDeleteProject = async (id: number) => {
    if (!confirm('Are you sure you want to delete this project? All associated tasks will also be deleted.')) return;
    try {
      const res = await supabase.from('projects').update({ deleted_at: new Date().toISOString() }).eq('id', id);
      await supabase.from('tasks').update({ deleted_at: new Date().toISOString() }).eq('project_id', id).is('deleted_at', null);
      if (!res.error) fetchData();
    } catch (error) {
      console.error('Error deleting project:', error);
    }
  };

  const handleSaveTimeLog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTaskIdForTimeLog || timeLogFormData.hours <= 0) {
      alert("Valid hours are required.");
      return;
    }

    try {
      setIsLoading(true);
      const res = await supabase.from('time_logs').insert([{
        task_id: selectedTaskIdForTimeLog,
        hours: timeLogFormData.hours,
        date: timeLogFormData.date
      }]);

      if (!res.error) {
        setIsTimeLogModalOpen(false);
        setIsRefreshing(true);
        await fetchData();
        setTimeout(() => setIsRefreshing(false), 1000);
      } else {
        alert(`Error: ${res.error.message}`);
      }
    } catch (error) {
      console.error('Error logging time:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // AbortController for stopping in-flight AI requests
  const abortControllerRef = React.useRef<AbortController | null>(null);

  const handleStopGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setMessages(prev => [...prev, { role: 'assistant', content: '⬛ Response stopped.' }]);
    setIsLoading(false);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    // Create a fresh AbortController for this request
    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      let didMutate = false;

      // Route the message: 'agent' = task CRUD (always server), 'cloud' = analytics (if enabled), 'local' = Q&A
      const route = routeMessage(userMessage, !!workspaceSettings?.cloudAiEnabled, useLocalModel);
      console.log(`[AI Router] "${userMessage.slice(0, 60)}" → ${route.toUpperCase()}`);

      let finalResponseText = '';

      if (route === 'local') {
        try {
          // Local model handles simple Q&A and read-only queries
          const { text: responseText, didMutate: localMutated } = await chatWithLocalModel(
            [...messages, { role: 'user', content: userMessage }],
            localModelUrl,
            user?.id,
            userProfile?.global_role
          );
          didMutate = localMutated;
          finalResponseText = responseText;
        } catch (localError) {
          console.error('[Local AI Fallback] Error:', localError);
          // Fallback to cloud agent if local fails
          const session = (await supabase.auth.getSession()).data.session;
          const currentUserId = user?.id || session?.user?.id;

          try {
            const res = await fetch('/api/chat', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${session?.access_token || ''}`
              },
              body: JSON.stringify({
                message: userMessage,
                history: messages.map(m => ({ role: m.role, content: m.content })),
                userId: currentUserId,
                userRole: userProfile?.global_role
              }),
              signal: controller.signal
            });

            if (!res.ok) {
              const errorData = await res.json();
              throw new Error(errorData.details || errorData.error || 'Cloud API failed');
            }

            const data = await res.json();
            finalResponseText = `⚠️ (Local Model unavailable, using Yukime Cloud)\n\n${data.text || 'I processed your request, but returned no text.'}`;
            didMutate = data.didMutate || false;
          } catch (cloudError: any) {
            console.error('[Cloud Fallback Failed]:', cloudError);
            finalResponseText = `❌ Error: Both Local and Cloud AI are currently unavailable.\n\nDetail: ${cloudError.message}`;
          }
        }

        if (!controller.signal.aborted) {
          setMessages(prev => [...prev, { role: 'assistant', content: finalResponseText }]);
        }
      } else if (route === 'agent' || route === 'cloud') {
        // Both 'agent' and 'cloud' use the server-side Gemini endpoint (/api/chat)
        // 'agent' = task CRUD mutations (always on, ignores toggle)
        // 'cloud' = deep analysis/reports (only when cloud enabled — already gated by router)
        const session = (await supabase.auth.getSession()).data.session;
        const res = await fetch('/api/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session?.access_token || ''}`
          },
          body: JSON.stringify({
            message: userMessage,
            history: messages.map(m => ({ role: m.role, content: m.content })),
            userId: user?.id,
            userRole: userProfile?.global_role
          }),
          signal: controller.signal
        });

        if (!res.ok) {
          // Server is offline — if it was a task mutation, tell the user clearly
          if (route === 'agent') {
            if (!controller.signal.aborted) {
              setMessages(prev => [...prev, { role: 'assistant', content: "⚠️ The task agent server is currently offline. Please ensure the dev API server (`npx tsx scripts/dev-api.ts`) is running, then try again." }]);
            }
          } else {
            if (!controller.signal.aborted) {
              setMessages(prev => [...prev, { role: 'assistant', content: "⚠️ Cloud AI is temporarily unavailable. Please try again shortly." }]);
            }
          }
          return;
        }

        const data = await res.json();
        didMutate = data.didMutate || false;
        if (!controller.signal.aborted) {
          setMessages(prev => [...prev, { role: 'assistant', content: data.text || data.error || "Something went wrong." }]);
        }
      }

      if (controller.signal.aborted) return;

      // Persist the conversation thread
      const latestMessages = useAppStore.getState().messages;
      await saveChatSession('main', latestMessages);

      // Refresh task/project data in the UI if the AI performed a mutation
      if (didMutate) {
        setIsRefreshing(true);
        await fetchData();
        setTimeout(() => setIsRefreshing(false), 2000);
      }

    } catch (error: any) {
      if (error?.name === 'AbortError') return;
      setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, I encountered an error processing your request.' }]);
    } finally {
      abortControllerRef.current = null;
      setIsLoading(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-500 bg-red-50 dark:bg-red-500/10 border-red-100 dark:border-red-500/20';
      case 'medium': return 'text-amber-500 bg-amber-50 dark:bg-amber-500/10 border-amber-100 dark:border-amber-500/20';
      default: return 'text-emerald-500 bg-emerald-50 dark:bg-emerald-500/10 border-emerald-100 dark:border-emerald-500/20';
    }
  };

  if (!user) {
    return <Auth />;
  }

  return (
    <div className={`flex h-screen ${isDarkMode ? 'dark bg-[#0A0A0B] text-gray-100' : 'bg-[#F8F9FA] text-[#1A1A1A]'} font-sans overflow-hidden transition-colors duration-300`}>
      <div className="flex w-full h-full bg-inherit">
        {/* Sidebar */}
        {/* Sidebar */}
        <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 ${isDarkMode ? 'bg-[#121214] border-gray-800' : 'bg-white border-gray-200'} border-r flex flex-col transition-transform duration-300 transform
        lg:translate-x-0 lg:static lg:inset-0
        ${isNavOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
          {/* Top Logo */}
          <div className={`p-6 pb-4 flex items-center justify-between`}>
            <div className="flex items-center gap-2 text-indigo-500 font-bold text-xl">
              <img src={isDarkMode ? "/TICKEL Logo 192px invert.png" : "/TICKEL Logo 192px.png"} className="w-8 h-8 object-contain" alt="TICKEL" />
              <div className="flex flex-col">
                <span className={`${isDarkMode ? 'text-white' : 'text-indigo-600'} leading-none`}>TICKEL</span>
                <span className="text-[8px] font-bold text-gray-500 uppercase tracking-widest mt-0.5">
                  By <a href="https://rickelindustries.co.ke/" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-indigo-500 transition-colors">Rickel Industries</a>
                </span>
              </div>
            </div>
            <button onClick={() => setIsNavOpen(false)} className={`lg:hidden p-2 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
              <Plus size={20} className="rotate-45" />
            </button>
          </div>

          {/* Workspace Selector */}
          <div className="px-4 mb-6 relative">
            <button
              onClick={() => setIsWorkspaceInfoOpen(!isWorkspaceInfoOpen)}
              className={`w-full flex items-center justify-between p-3 rounded-xl border ${isDarkMode ? 'bg-[#1a1c1d] border-gray-800 hover:border-emerald-500/50' : 'bg-gray-50 border-gray-200 hover:border-emerald-500/50'} transition-all group`}
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center text-emerald-500 group-hover:bg-emerald-500 group-hover:text-white transition-colors">
                  <Sparkles size={16} />
                </div>
                <div className="text-left">
                  <p className="text-[10px] uppercase text-gray-500 font-bold tracking-wider">Team Workspace</p>
                  <p className={`text-sm font-bold ${isDarkMode ? 'text-gray-200' : 'text-gray-900'}`}>Rickel Industries</p>
                </div>
              </div>
              <ChevronDown size={14} className={`text-gray-500 transition-transform ${isWorkspaceInfoOpen ? 'rotate-180' : ''}`} />
            </button>

            <AnimatePresence>
              {isWorkspaceInfoOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className={`absolute top-16 left-4 right-4 z-50 p-2 rounded-xl shadow-xl border ${isDarkMode ? 'bg-[#121214] border-gray-800' : 'bg-white border-gray-200'} text-xs`}
                >
                  <button
                    onClick={() => { setIsWorkspaceSettingsModalOpen(true); setIsWorkspaceInfoOpen(false); }}
                    className={`w-full flex items-center justify-between p-2.5 rounded-lg mb-2 transition-colors ${isDarkMode ? 'hover:bg-gray-800/50 text-gray-200' : 'hover:bg-gray-50 text-gray-700'}`}
                  >
                    <span className="font-bold flex items-center gap-2">
                      <Settings size={14} className={isDarkMode ? 'text-gray-400' : 'text-gray-500'} />
                      Workspace Settings
                    </span>
                    <span className="text-[10px] bg-indigo-500/10 text-indigo-500 px-1.5 py-0.5 rounded font-bold">Admin</span>
                  </button>

                  <div className={`p-3 rounded-lg ${isDarkMode ? 'bg-[#1a1c1d]' : 'bg-gray-50'}`}>
                    <div className="flex items-center gap-2 mb-2">
                      <AlertCircle size={14} className="text-indigo-500" />
                      <span className={`font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Workspace & Hierarchy</span>
                    </div>
                    <p className={`mb-2 leading-relaxed text-[11px] ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      A <strong>Workspace</strong> (like Rickel Industries) encapsulates your entire organization. Inside a Workspace, you have <strong>Departments</strong> (e.g., Engineering), and within those are specific <strong>Teams</strong> (e.g., Frontend).
                    </p>
                    <p className={`leading-relaxed text-[11px] ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      Your permissions and task visibility are scoped to your assigned Team and Department based on your global Role.
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <button
              onClick={() => setIsSearchModalOpen(true)}
              className={`mt-3 w-full flex items-center gap-2 px-3 py-2 rounded-lg ${isDarkMode ? 'bg-gray-800/30 text-gray-400 hover:bg-gray-800/60 hover:text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-gray-900'} text-xs font-medium cursor-pointer transition-colors border border-transparent ${isDarkMode ? 'hover:border-gray-700' : 'hover:border-gray-300'}`}
            >
              <Search size={14} />
              <span>Search for tasks, projects...</span>
              <div className={`ml-auto px-1.5 py-0.5 rounded border ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} text-[9px] font-bold`}>⌘F</div>
            </button>
          </div>

          <div className="px-6 mb-2">
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Navigation</p>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
            <button
              onClick={() => { setActiveTab('dashboard'); setIsNavOpen(false); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'dashboard' ? (isDarkMode ? 'bg-[#1a1c1d] text-white' : 'bg-gray-900 text-white') : (isDarkMode ? 'text-gray-400 hover:bg-gray-800/50 hover:text-gray-200' : 'text-gray-500 hover:bg-gray-100')}`}
            >
              <LayoutDashboard size={18} />
              <span className="font-medium text-sm">Dashboard</span>
            </button>
            <button
              onClick={() => { setActiveTab('analytics'); setIsNavOpen(false); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'analytics' ? (isDarkMode ? 'bg-[#1a1c1d] text-white' : 'bg-gray-900 text-white') : (isDarkMode ? 'text-gray-400 hover:bg-gray-800/50 hover:text-gray-200' : 'text-gray-500 hover:bg-gray-100')}`}
            >
              <BarChart3 size={18} />
              <span className="font-medium text-sm">Analytics</span>
            </button>
            <button
              onClick={() => { setActiveTab('team'); setIsNavOpen(false); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'team' ? (isDarkMode ? 'bg-[#1a1c1d] text-white' : 'bg-gray-900 text-white') : (isDarkMode ? 'text-gray-400 hover:bg-gray-800/50 hover:text-gray-200' : 'text-gray-500 hover:bg-gray-100')}`}
            >
              <Users size={18} />
              <span className="font-medium text-sm">Team Structure</span>
            </button>
            <button
              onClick={() => { setActiveTab('reports'); setIsNavOpen(false); }}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all ${activeTab === 'reports' ? (isDarkMode ? 'bg-[#1a1c1d] text-white' : 'bg-gray-900 text-white') : (isDarkMode ? 'text-gray-400 hover:bg-gray-800/50 hover:text-gray-200' : 'text-gray-500 hover:bg-gray-100')}`}
            >
              <div className="flex items-center gap-3">
                <FileText size={18} />
                <span className="font-medium text-sm">Reports</span>
              </div>
              <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-500 flex items-center justify-center text-[10px] font-bold">1</span>
            </button>
            <button
              onClick={() => { setActiveTab('support'); setIsNavOpen(false); }}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all ${activeTab === 'support' ? (isDarkMode ? 'bg-[#1a1c1d] text-white' : 'bg-gray-900 text-white') : (isDarkMode ? 'text-gray-400 hover:bg-gray-800/50 hover:text-gray-200' : 'text-gray-500 hover:bg-gray-100')}`}
            >
              <div className="flex items-center gap-3">
                <LifeBuoy size={18} />
                <span className="font-medium text-sm">Support</span>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500 text-white text-[10px] font-bold">New</span>
            </button>

            {/* Separator and My Tasks */}
            <div className={`my-4 border-t ${isDarkMode ? 'border-gray-800' : 'border-gray-100'}`}></div>
            <button
              onClick={() => { setActiveTab('tasks'); setIsNavOpen(false); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'tasks' ? (isDarkMode ? 'bg-[#1a1c1d] text-emerald-400' : 'bg-gray-900 text-emerald-400') : (isDarkMode ? 'text-emerald-500 hover:bg-gray-800/50 hover:text-emerald-400' : 'text-emerald-600 hover:bg-emerald-50')} border border-transparent`}
            >
              <CheckCircle2 size={18} />
              <span className="font-medium text-sm">My Tasks</span>
            </button>
          </nav>

          {/* Bottom Settings / Throne */}
          <div className={`p-4 mt-auto border-t ${isDarkMode ? 'border-gray-800' : 'border-gray-100'}`}>
            {isAdmin && (
              <button
                onClick={() => { setIsThroneModalOpen(true); setIsNavOpen(false); }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${isDarkMode ? 'text-indigo-400 hover:bg-gray-800/50' : 'text-indigo-600 hover:bg-indigo-50'} mb-1`}
              >
                <Shield size={18} />
                <span className="font-medium text-sm">Throne</span>
              </button>
            )}
            <button
              onClick={() => { setIsSettingsModalOpen(true); setIsNavOpen(false); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${isDarkMode ? 'text-gray-400 hover:bg-gray-800/50 hover:text-gray-200' : 'text-gray-500 hover:bg-gray-100'} mb-6`}
            >
              <Settings size={18} />
              <span className="font-medium text-sm">Settings</span>
            </button>

            <div className="px-2 mb-2">
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">User Account</p>
            </div>

            <div className={`flex items-center justify-between p-3 rounded-xl ${isDarkMode ? 'bg-[#1a1c1d] border border-gray-800' : 'bg-gray-50 border border-gray-200'}`}>
              <div className="flex items-center gap-3">
                <img src={userProfile.avatar_url || `https://picsum.photos/seed/${userProfile.name}/40/40`} className="w-8 h-8 rounded-lg object-cover" alt="User" />
                <div>
                  <p className={`text-sm font-bold ${isDarkMode ? 'text-gray-200' : 'text-gray-900'} leading-tight`}>{userProfile.name?.split(' ')[0]} {userProfile.name?.split(' ')[1]}</p>
                  <p className="text-[10px] text-gray-500">#{user?.id?.slice(0, 8)}</p>
                </div>
              </div>
              <button onClick={() => signOut()} className={`p-1.5 rounded-lg ${isDarkMode ? 'text-gray-500 hover:text-red-400 hover:bg-gray-800' : 'text-gray-400 hover:text-red-500 hover:bg-white'} transition-colors`} title="Sign out">
                <ArrowRight size={14} className="rotate-180" />
              </button>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 flex flex-col overflow-hidden">
          <header className={`h-16 ${isDarkMode ? 'bg-[#121214] border-gray-800' : 'bg-white border-gray-200'} border-b flex items-center justify-between px-4 sm:px-8 transition-colors duration-300`}>
            <div className="flex items-center gap-4">
              <button
                onClick={() => setIsNavOpen(true)}
                className={`lg:hidden p-2 ${isDarkMode ? 'text-gray-400 hover:bg-gray-800' : 'text-gray-500 hover:bg-gray-100'} rounded-lg transition-all`}
              >
                <LayoutDashboard size={20} />
              </button>
              <h2 className={`text-lg font-semibold capitalize hidden sm:block ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{activeTab}</h2>
              {activeTab === 'tasks' && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleOpenProjectModal()}
                    className={`flex items-center gap-2 ${isDarkMode ? 'bg-[#1A1A1C] border-gray-700 text-gray-300 hover:bg-gray-800' : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'} border px-4 py-1.5 rounded-lg text-sm font-bold transition-all shadow-sm`}
                  >
                    <Briefcase size={16} />
                    Projects
                  </button>
                  <button
                    onClick={() => handleOpenModal()}
                    className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-1.5 rounded-lg text-sm font-bold hover:bg-indigo-700 transition-all shadow-sm shadow-indigo-900/20"
                  >
                    <Plus size={16} />
                    New Task
                  </button>
                </div>
              )}
            </div>
            <div className="flex items-center gap-4">
              <AnimatePresence>
                {isRefreshing && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute top-1/2 right-1/2 translate-x-1/2 -translate-y-1/2 bg-indigo-600 text-white px-4 py-2 rounded-full text-xs font-bold shadow-lg flex items-center gap-2 z-30"
                  >
                    <Loader2 size={12} className="animate-spin" />
                    Agent updated tasks
                  </motion.div>
                )}
              </AnimatePresence>

              {/* User Profile Section */}
              <UserProfileMenu />

              <button
                onClick={() => toggleDarkMode()}
                className={`p-2 ${isDarkMode ? 'text-amber-400 hover:bg-gray-800' : 'text-gray-400 hover:bg-gray-100'} rounded-lg transition-all`}
                title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              >
                {isDarkMode ? <TrendingUp size={20} /> : <LayoutDashboard size={20} />}
                {/* Using TrendingUp as a temporary sun icon for now, will replace with proper Lucide icons if available or stay with layout icons */}
              </button>

              <button
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className={`lg:hidden p-2 ${isDarkMode ? 'text-gray-400 hover:bg-gray-800' : 'text-gray-500 hover:bg-gray-100'} rounded-lg transition-all`}
              >
                <MessageSquare size={20} />
              </button>
              <div className="flex -space-x-2 hidden md:flex">
                {[1, 2, 3].map(i => (
                  <div key={i} className={`w-8 h-8 rounded-full border-2 ${isDarkMode ? 'border-[#121214]' : 'border-white'} bg-gray-200 overflow-hidden`}>
                    <img src={`https://picsum.photos/seed/${i + 10}/32/32`} alt="user" referrerPolicy="no-referrer" />
                  </div>
                ))}
              </div>
              <button
                onClick={() => alert('No new notifications')}
                className={`p-2 ${isDarkMode ? 'text-gray-500 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'} transition-colors`}
              >
                <AlertCircle size={20} />
              </button>
            </div>
          </header>

          <div className={`flex-1 overflow-y-auto p-8 ${isDarkMode ? 'bg-[#0A0A0B]' : 'bg-[#F8F9FA]'}`}>
            {activeTab === 'dashboard' && (
              <div className="space-y-8">
                {/* 5-Metric Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">

                  {/* Card 1: Total Time */}
                  <button onClick={() => setActiveDashCard('time')} className="bg-[#1a1c1d] p-5 rounded-[20px] border border-gray-800 shadow-lg relative overflow-hidden group text-left hover:border-emerald-500/30 hover:shadow-emerald-500/10 transition-all cursor-pointer">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl -mr-8 -mt-8"></div>
                    <p className="text-gray-400 text-xs font-medium tracking-wide mb-4">Total Time Today</p>
                    <div className="flex items-end gap-2 relative z-10">
                      <p className="text-3xl font-black text-white tracking-tight">{totalHours}</p>
                      <p className="text-emerald-400 text-sm font-bold mb-1">hrs</p>
                    </div>
                    <div className="mt-3 flex items-end gap-1 h-8">
                      {[40, 70, 45, 90, 60, 30, 80].map((h, i) => (
                        <div key={i} className="flex-1 bg-emerald-500/80 rounded-t-sm transition-all group-hover:bg-emerald-400" style={{ height: `${h}%` }}></div>
                      ))}
                    </div>
                    <div className="absolute inset-x-0 bottom-0 h-0.5 bg-gradient-to-r from-emerald-500/0 via-emerald-500/60 to-emerald-500/0 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>

                  {/* Card 2: Tasks Completed */}
                  <button onClick={() => setActiveDashCard('completed')} className={`${isDarkMode ? 'bg-[#121214] border-gray-800 hover:border-indigo-500/30' : 'bg-white border-gray-100 hover:border-indigo-400/30'} p-5 rounded-[20px] border shadow-sm flex flex-col justify-between text-left transition-all cursor-pointer group relative overflow-hidden`}>
                    <div className="flex justify-between items-start mb-2">
                      <p className="text-gray-500 text-xs font-medium tracking-wide">Tasks Completed</p>
                      <CheckCircle2 size={16} className={isDarkMode ? 'text-gray-600 group-hover:text-indigo-400 transition-colors' : 'text-gray-300'} />
                    </div>
                    <div>
                      <p className={`text-4xl font-black tracking-tight ${isDarkMode ? 'text-white' : 'text-gray-900'} mb-1`}>{(Array.isArray(tasks) ? tasks : []).filter(t => t.status === 'done').length}</p>
                      <span className="text-[10px] font-bold text-emerald-500 bg-emerald-500/10 px-1.5 py-0.5 rounded-full inline-block">+2 from yesterday</span>
                    </div>
                    <div className="absolute inset-x-0 bottom-0 h-0.5 bg-gradient-to-r from-indigo-500/0 via-indigo-500/60 to-indigo-500/0 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>

                  {/* Card 3: Active Tasks */}
                  <button onClick={() => setActiveDashCard('active')} className={`${isDarkMode ? 'bg-gradient-to-br from-indigo-900/40 to-[#121214] border-indigo-500/20 hover:border-indigo-500/50' : 'bg-gradient-to-br from-indigo-50 to-white border-indigo-100 hover:border-indigo-300'} p-5 rounded-[20px] border shadow-sm flex flex-col justify-between text-left transition-all cursor-pointer group relative overflow-hidden`}>
                    <div className="flex justify-between items-start mb-2">
                      <p className={`${isDarkMode ? 'text-indigo-300' : 'text-indigo-600'} text-xs font-medium tracking-wide`}>Active Tasks</p>
                      <Activity size={16} className={isDarkMode ? 'text-indigo-400' : 'text-indigo-500'} />
                    </div>
                    <div>
                      <p className={`text-4xl font-black tracking-tight ${isDarkMode ? 'text-white' : 'text-indigo-900'} mb-1`}>{(Array.isArray(tasks) ? tasks : []).filter(t => t.status === 'in_progress').length}</p>
                      <span className={`text-[10px] font-bold ${isDarkMode ? 'text-indigo-300' : 'text-indigo-500'} uppercase tracking-widest`}>In Progress</span>
                    </div>
                    <div className="absolute inset-x-0 bottom-0 h-0.5 bg-gradient-to-r from-indigo-500/0 via-indigo-500 to-indigo-500/0 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>

                  {/* Card 4: Focus Score */}
                  <button onClick={() => setActiveDashCard('focus')} className={`${isDarkMode ? 'bg-[#121214] border-gray-800 hover:border-amber-500/30' : 'bg-white border-gray-100 hover:border-amber-400/30'} p-5 rounded-[20px] border shadow-sm col-span-2 lg:col-span-1 relative overflow-hidden flex flex-col justify-between group transition-all cursor-pointer text-left`}>
                    <div className="flex items-center justify-between relative z-10 mb-2">
                      <p className="text-gray-500 text-xs font-medium tracking-wide">Focus Score</p>
                      <Target size={16} className="text-amber-500" />
                    </div>
                    <div className="relative z-10">
                      <div className="flex items-baseline gap-1 mt-2">
                        <p className={`text-4xl font-black tracking-tight ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{focusScore.toFixed(1)}</p>
                        <p className="text-sm font-bold text-gray-500">/100</p>
                      </div>
                      <p className="text-[10px] text-amber-500 font-bold mt-1">{focusLabel}</p>
                    </div>
                    <div className="absolute -bottom-4 left-0 right-0 h-16 opacity-20 pointer-events-none flex items-end">
                      <svg viewBox="0 0 100 40" preserveAspectRatio="none" className="w-full h-full text-amber-500 fill-current">
                        <path d="M0,40 L0,20 Q10,10 20,20 T40,20 T60,20 T80,20 T100,20 L100,40 Z"></path>
                      </svg>
                    </div>
                    <div className="absolute inset-x-0 bottom-0 h-0.5 bg-gradient-to-r from-amber-500/0 via-amber-500/60 to-amber-500/0 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>

                  {/* Card 5: Streak */}
                  <button onClick={() => setActiveDashCard('streak')} className={`${isDarkMode ? 'bg-[#121214] border-gray-800 hover:border-orange-500/30' : 'bg-white border-gray-100 hover:border-orange-400/30'} p-5 rounded-[20px] border shadow-sm col-span-2 lg:col-span-1 flex flex-col justify-between group transition-all cursor-pointer text-left relative overflow-hidden`}>
                    <div className="flex justify-between items-start mb-2">
                      <p className="text-gray-500 text-xs font-medium tracking-wide">Consistency</p>
                      <div className="w-6 h-6 rounded-full bg-orange-500/20 flex items-center justify-center text-orange-500">
                        <Flame size={14} />
                      </div>
                    </div>
                    <div className="flex items-end justify-between mt-2">
                      <div>
                        <p className={`text-4xl font-black tracking-tight ${isDarkMode ? 'text-white' : 'text-gray-900'} mb-1`}>{streakCount}</p>
                        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Day Streak</p>
                      </div>
                      <div className="flex gap-1 mb-1">
                        {streakDaysUI.map((day, i) => (
                          <div key={i} className="flex flex-col items-center gap-1">
                            <div className={`w-2.5 h-2.5 rounded-full ${day.active ? 'bg-orange-500' : (isDarkMode ? 'bg-gray-800' : 'bg-gray-200')}`}></div>
                            <span className="text-[8px] font-bold text-gray-500">{day.label}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="absolute inset-x-0 bottom-0 h-0.5 bg-gradient-to-r from-orange-500/0 via-orange-500/60 to-orange-500/0 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                </div>

                {/* Dashboard Card Modals */}
                <AnimatePresence>
                  {activeDashCard === 'time' && <TotalTimeModal onClose={() => setActiveDashCard(null)} />}
                  {activeDashCard === 'completed' && <TasksCompletedModal onClose={() => setActiveDashCard(null)} />}
                  {activeDashCard === 'active' && <ActiveTasksModal onClose={() => setActiveDashCard(null)} />}
                  {activeDashCard === 'focus' && <FocusScoreModal onClose={() => setActiveDashCard(null)} />}
                  {activeDashCard === 'streak' && <ConsistencyModal onClose={() => setActiveDashCard(null)} />}
                </AnimatePresence>

                {/* Dual-Column Main Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
                  {/* LEFT COLUMN: Primary Work Area */}
                  <div className="lg:col-span-2 space-y-6">
                    {/* 1. Recent Tasks Card */}
                    <div className={`${isDarkMode ? 'bg-[#121214] border-gray-800' : 'bg-white border-gray-100'} rounded-[20px] border shadow-sm overflow-hidden`}>
                      <div className={`px-8 py-6 border-b ${isDarkMode ? 'border-gray-800' : 'border-gray-50'} flex items-center justify-between`}>
                        <h3 className={`font-bold tracking-wide ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>Recent Tasks</h3>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleOpenModal()}
                            className={`text-xs font-bold px-4 py-2 rounded-full ${isDarkMode ? 'bg-indigo-600 hover:bg-indigo-500' : 'bg-indigo-600 hover:bg-indigo-700'} text-white transition-all flex items-center gap-1.5`}
                          >
                            <Plus size={14} /> Add Task
                          </button>
                          <button
                            onClick={() => setActiveTab('tasks')}
                            className={`text-xs font-bold px-4 py-2 rounded-full ${isDarkMode ? 'bg-[#1a1c1d] text-gray-300 hover:bg-gray-800' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'} transition-all`}
                          >
                            All Tasks
                          </button>
                        </div>
                      </div>
                      <div className="p-2">
                        {(Array.isArray(tasks) ? tasks : []).slice(0, 5).map(task => (
                          <div
                            key={task.id}
                            onClick={() => handleOpenModal(task)}
                            className={`${isDarkMode ? 'hover:bg-[#1a1c1d]' : 'hover:bg-gray-50'} p-4 mx-2 my-1 rounded-xl transition-all flex items-center justify-between group cursor-pointer border border-transparent ${isDarkMode ? 'hover:border-gray-800' : 'hover:border-gray-100'}`}
                          >
                            <div className="flex items-center gap-5">
                              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${task.status === 'done' ? (isDarkMode ? 'bg-emerald-500/10 text-emerald-400' : 'bg-emerald-50 text-emerald-600') : (isDarkMode ? 'bg-amber-500/10 text-amber-400' : 'bg-amber-50 text-amber-600')}`}>
                                {task.status === 'done' ? <CheckCircle2 size={20} strokeWidth={2.5} /> : <Clock size={20} strokeWidth={2.5} />}
                              </div>
                              <div>
                                <p className={`font-bold text-sm ${isDarkMode ? 'text-gray-200' : 'text-gray-900'}`}>{task.title}</p>
                                <p className="text-xs text-gray-500 font-medium flex items-center gap-1.5 mt-1">
                                  <Calendar size={12} /> {task.due_date ? new Date(task.due_date).toLocaleDateString() : 'No Due Date'}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-6">
                              <div className="flex -space-x-2 hidden sm:flex">
                                {/* Mock Assignee Avatars */}
                                <img src={`https://picsum.photos/seed/${task.id}/24/24`} className={`w-6 h-6 rounded-full border-2 ${isDarkMode ? 'border-[#121214]' : 'border-white'} z-10`} alt="Assignee" referrerPolicy="no-referrer" />
                              </div>
                              <span className={`text-[10px] uppercase tracking-wider font-bold px-2.5 py-1 rounded-md border ${getPriorityColor(task.priority)}`}>
                                {task.priority}
                              </span>
                              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isDarkMode ? 'bg-gray-800/50' : 'bg-white border shadow-sm'} group-hover:bg-indigo-500 group-hover:text-white group-hover:border-transparent transition-all`}>
                                <ChevronRight size={14} strokeWidth={3} className={isDarkMode ? 'text-gray-400 group-hover:text-white' : 'text-gray-400 group-hover:text-white'} />
                              </div>
                            </div>
                          </div>
                        ))}
                        {tasks.length === 0 && (
                          <div className="p-12 text-center flex flex-col items-center justify-center">
                            <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 ${isDarkMode ? 'bg-gray-800' : 'bg-gray-100'}`}>
                              <CheckSquare size={24} className={isDarkMode ? 'text-gray-600' : 'text-gray-400'} />
                            </div>
                            <p className={`font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>No recent tasks</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* 2. Active Tasks */}
                    <div className={`${isDarkMode ? 'bg-[#121214] border-gray-800' : 'bg-white border-gray-100'} rounded-[20px] border shadow-sm overflow-hidden`}>
                      <div className={`px-8 py-6 border-b ${isDarkMode ? 'border-gray-800' : 'border-gray-50'} flex items-center justify-between`}>
                        <h3 className={`font-bold tracking-wide ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>Active Tasks</h3>
                      </div>
                      <div className="p-6 space-y-6">
                        {(Array.isArray(tasks) ? tasks : []).filter(t => t.status === 'in_progress').slice(0, 3).map(task => (
                          <div key={task.id} className="group">
                            <div className="flex justify-between items-center mb-2">
                              <p className={`font-medium text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-800'}`}>{task.title}</p>
                              <p className="text-xs font-bold text-indigo-500 bg-indigo-500/10 px-2 py-0.5 rounded-full flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse"></span> Time running
                              </p>
                            </div>
                            <div className="w-full h-2 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
                              <div className="h-full bg-indigo-500 w-1/2 group-hover:w-3/4 transition-all duration-1000 ease-in-out"></div>
                            </div>
                          </div>
                        ))}
                        {tasks.filter(t => t.status === 'in_progress').length === 0 && (
                          <p className="text-center text-sm text-gray-500 py-4">No tasks currently in progress.</p>
                        )}
                      </div>
                    </div>

                    {/* 3. Activity Timeline */}
                    <div className={`${isDarkMode ? 'bg-[#121214] border-gray-800' : 'bg-white border-gray-100'} rounded-[20px] border shadow-sm overflow-hidden`}>
                      <div className={`px-8 py-6 border-b ${isDarkMode ? 'border-gray-800' : 'border-gray-50'} flex items-center justify-between`}>
                        <h3 className={`font-bold tracking-wide ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>Activity Timeline</h3>
                      </div>
                      <div className="p-6 pl-8">
                        <div className="space-y-6 border-l-2 border-indigo-500/20 pl-6 relative">
                          {/* Marker 1 */}
                          <div className="relative">
                            <span className="absolute -left-[33px] top-0.5 w-4 h-4 rounded-full bg-indigo-500 border-4 border-[#121214]"></span>
                            <p className={`text-sm font-bold ${isDarkMode ? 'text-gray-200' : 'text-gray-900'}`}>You completed a task</p>
                            <p className="text-xs text-gray-500 mt-1">"Update dashboard layout" • 2 hours ago</p>
                          </div>
                          {/* Marker 2 */}
                          <div className="relative">
                            <span className="absolute -left-[33px] top-0.5 w-4 h-4 rounded-full bg-gray-500 dark:bg-gray-700 border-4 border-[#121214]"></span>
                            <p className={`text-sm font-bold ${isDarkMode ? 'text-gray-200' : 'text-gray-900'}`}>AI generated report</p>
                            <p className="text-xs text-gray-500 mt-1">Weekly productivity analysis is ready • 5 hours ago</p>
                          </div>
                          {/* Marker 3 */}
                          <div className="relative">
                            <span className="absolute -left-[33px] top-0.5 w-4 h-4 rounded-full bg-gray-500 dark:bg-gray-700 border-4 border-[#121214]"></span>
                            <p className={`text-sm font-bold ${isDarkMode ? 'text-gray-200' : 'text-gray-900'}`}>Task updated</p>
                            <p className="text-xs text-gray-500 mt-1">"Fix database schema" status changed to In Progress • Yesterday</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* RIGHT COLUMN: AI + Control Panel */}
                  <div className="space-y-6">
                    {/* A. Role-Tailored AI Insights (KEY DIFFERENTIATOR) */}
                    {userProfile?.global_role === 'Global Admin' || isAdmin ? (
                      <AICommandCenter />
                    ) : userProfile?.global_role === 'Manager' ? (
                      <TeamInsights />
                    ) : (
                      <FocusAssistant />
                    )}

                    {/* B. Smart Suggestions */}
                    <div className={`${isDarkMode ? 'bg-[#121214] border-gray-800' : 'bg-white border-gray-100'} rounded-[20px] border shadow-sm p-6`}>
                      <h3 className={`font-bold tracking-wide mb-4 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>Smart Suggestions</h3>
                      <div className="space-y-3">
                        <button className={`w-full flex items-center justify-between p-3 rounded-xl border ${isDarkMode ? 'bg-[#1a1c1d] border-gray-800 hover:border-gray-600' : 'bg-gray-50 border-gray-200 hover:border-gray-300'} transition-all text-left group`}>
                          <div>
                            <p className={`text-sm font-bold ${isDarkMode ? 'text-gray-200' : 'text-gray-900'} group-hover:text-indigo-500 transition-colors`}>Break tasks into subtasks</p>
                            <p className="text-xs text-gray-500 mt-0.5">Automated breakdown</p>
                          </div>
                          <ChevronRight size={16} className="text-gray-400 group-hover:text-indigo-500" />
                        </button>
                        <button className={`w-full flex items-center justify-between p-3 rounded-xl border ${isDarkMode ? 'bg-[#1a1c1d] border-gray-800 hover:border-gray-600' : 'bg-gray-50 border-gray-200 hover:border-gray-300'} transition-all text-left group`}>
                          <div>
                            <p className={`text-sm font-bold ${isDarkMode ? 'text-gray-200' : 'text-gray-900'} group-hover:text-indigo-500 transition-colors`}>Reschedule overloaded day</p>
                            <p className="text-xs text-gray-500 mt-0.5">Optimize timeline</p>
                          </div>
                          <ChevronRight size={16} className="text-gray-400 group-hover:text-indigo-500" />
                        </button>
                      </div>
                    </div>

                    {/* C. Quick Actions Panel */}
                    <div className={`${isDarkMode ? 'bg-[#121214] border-gray-800' : 'bg-white border-gray-100'} rounded-[20px] border shadow-sm p-6`}>
                      <h3 className={`font-bold tracking-wide mb-4 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>Quick Actions</h3>
                      <div className="grid grid-cols-2 gap-3">
                        <button onClick={() => handleOpenModal()} className={`col-span-2 flex items-center justify-center gap-2 p-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-lg shadow-indigo-900/20 transition-all`}>
                          <Plus size={16} /> New Task
                        </button>
                        <button onClick={() => { setActiveReportTemplate('daily'); setIsReportBuilderOpen(true); }} className={`flex flex-col items-center justify-center gap-2 p-4 rounded-xl border ${isDarkMode ? 'bg-[#1a1c1d] border-gray-800 hover:bg-gray-800' : 'bg-gray-50 border-gray-200 hover:bg-gray-100'} transition-all`}>
                          <FileText size={20} className="text-indigo-500" />
                          <span className={`text-xs font-bold ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Generate Report</span>
                        </button>
                        <button onClick={() => setIsFocusModeOpen(true)} className={`flex flex-col items-center justify-center gap-2 p-4 rounded-xl border ${isDarkMode ? 'bg-[#1a1c1d] border-gray-800 hover:bg-gray-800' : 'bg-gray-50 border-gray-200 hover:bg-gray-100'} transition-all`}>
                          <Target size={20} className="text-emerald-500" />
                          <span className={`text-xs font-bold ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Focus Mode</span>
                        </button>
                      </div>
                    </div>
                    {/* C. Pomodoro Timer Widget */}
                    <PomodoroWidget onOpenFocusMode={() => setIsFocusModeOpen(true)} />
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'analytics' && (
              <TeamAnalytics />
            )}

            {activeTab === 'team' && (
              <TeamStructure />
            )}

            {activeTab === 'reports' && (
              <ReportsDashboard />
            )}

            {activeTab === 'tasks' && (
              <div className="relative">
                {/* View Tabs */}
                <div className={`flex items-center gap-2 mb-5`}>
                  <div className={`flex rounded-xl border p-1 gap-1 ${isDarkMode ? 'bg-[#121214] border-gray-800' : 'bg-white border-gray-100'}`}>
                    {(['all', 'matrix'] as const).map(v => (
                      <button key={v} onClick={() => setTasksView(v)}
                        className={`px-4 py-1.5 rounded-lg text-xs font-bold capitalize transition-all ${tasksView === v
                          ? 'bg-indigo-600 text-white shadow'
                          : isDarkMode ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-gray-800'
                          }`}>
                        {v === 'all' ? '⊞ All Tasks' : '🎯 Eisenhower Matrix'}
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={() => handleOpenModal()}
                    className="ml-auto text-xs font-bold px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white transition-all flex items-center gap-1.5"
                  >
                    <Plus size={14} /> Add Task
                  </button>
                </div>
                <AnimatePresence>
                  {isRefreshing && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="absolute top-0 left-1/2 -translate-x-1/2 bg-indigo-600 text-white px-4 py-2 rounded-full text-xs font-bold shadow-lg flex items-center gap-2 z-30"
                    >
                      <Loader2 size={12} className="animate-spin" />
                      Agent updated tasks
                    </motion.div>
                  )}
                </AnimatePresence>
                {/* Matrix view */}
                {tasksView === 'matrix' && <EisenhowerMatrix />}

                {/* All tasks (kanban cards) */}
                {tasksView === 'all' && (
                  <div className={`grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6 pb-20 mt-4 transition-opacity duration-300 ${isRefreshing ? 'opacity-50' : 'opacity-100'}`}>
                    {(Array.isArray(tasks) ? tasks : []).map(task => (
                      <motion.div
                        layout
                        key={task.id}
                        className={`${isDarkMode ? 'bg-[#121214] border-gray-800' : 'bg-white border-gray-100'} p-6 rounded-2xl border shadow-sm hover:shadow-md transition-shadow group relative`}
                      >
                        <div className="absolute top-4 right-4 flex items-center gap-1 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity z-20">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenModal(task);
                            }}
                            className={`p-1.5 ${isDarkMode ? 'text-gray-500 hover:text-indigo-400 hover:bg-gray-800' : 'text-gray-400 hover:text-indigo-600 hover:bg-indigo-50'} rounded-lg transition-all cursor-pointer`}
                          >
                            <Edit2 size={14} />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteTask(task.id);
                            }}
                            className={`p-1.5 ${isDarkMode ? 'text-gray-500 hover:text-red-400 hover:bg-gray-800' : 'text-gray-400 hover:text-red-600 hover:bg-red-50'} rounded-lg transition-all cursor-pointer`}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                        <div className="flex justify-between items-start mb-4">
                          <span className={`text-[10px] uppercase tracking-wider font-bold px-2 py-1 rounded-md border ${getPriorityColor(task.priority)}`}>
                            {task.priority}
                          </span>
                          <span className="text-xs text-gray-500">{new Date(task.created_at).toLocaleDateString()}</span>
                        </div>
                        <h4 className={`font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'} mb-2 pr-12`}>{task.title}</h4>
                        <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'} line-clamp-2 mb-4`}>{task.description}</p>
                        <div className={`flex items-center justify-between pt-4 border-t ${isDarkMode ? 'border-gray-800' : 'border-gray-50'}`}>
                          <div className="flex items-center gap-4 text-xs text-gray-500">
                            <div className="flex items-center gap-1">
                              <Clock size={14} />
                              <span>{task.estimated_hours}h est.</span>
                            </div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenTimeLogModal(task.id);
                              }}
                              className="flex items-center gap-1 text-indigo-500 hover:text-indigo-400 font-medium cursor-pointer"
                            >
                              <Plus size={12} /> Log Time
                            </button>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className={`px-3 py-1 rounded-full text-xs font-medium ${task.status === 'done' ? (isDarkMode ? 'bg-emerald-500/10 text-emerald-400' : 'bg-emerald-50 text-emerald-600') :
                              task.status === 'in_progress' ? (isDarkMode ? 'bg-blue-500/10 text-blue-400' : 'bg-blue-50 text-blue-600') :
                                (isDarkMode ? 'bg-gray-800 text-gray-400' : 'bg-gray-50 text-gray-600')
                              }`}>
                              {task.status.replace('_', ' ')}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                    {tasks.length === 0 && (
                      <div className="col-span-full py-20 text-center">
                        <div className={`w-16 h-16 ${isDarkMode ? 'bg-gray-800 text-gray-700' : 'bg-gray-50 text-gray-300'} rounded-2xl flex items-center justify-center mx-auto mb-4`}>
                          <CheckCircle2 size={32} />
                        </div>
                        <h3 className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'} mb-1`}>No tasks yet</h3>
                        <p className="text-gray-500 mb-6">Start by creating your first task manually or via AI.</p>
                        <button
                          onClick={() => handleOpenModal()}
                          className="bg-indigo-600 text-white px-6 py-2 rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-900/20"
                        >
                          Create Task
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'reports' && (
              <div className="max-w-4xl mx-auto space-y-8">
                <div className={`${isDarkMode ? 'bg-[#121214] border-gray-800' : 'bg-white border-gray-100'} p-8 rounded-3xl border shadow-xl relative overflow-hidden`}>
                  <div className="absolute top-0 right-0 p-8 opacity-10">
                    <TrendingUp size={120} />
                  </div>
                  <h3 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'} mb-2`}>Performance Intelligence</h3>
                  <p className="text-gray-500 mb-8">AI-generated insights based on your recent activity.</p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-6">
                      <div>
                        <h4 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-4">Total Productivity</h4>
                        <p className="text-4xl font-bold text-indigo-500 mb-6">{totalHours} Hours</p>

                        <h4 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-4">Skill Growth</h4>
                        <div className="space-y-4">
                          {[
                            { name: 'System Architecture', value: 85, color: 'bg-indigo-500' },
                            { name: 'Frontend Engineering', value: 70, color: 'bg-purple-500' },
                            { name: 'AI Integration', value: 92, color: 'bg-blue-500' }
                          ].map(skill => (
                            <div key={skill.name}>
                              <div className="flex justify-between text-sm mb-1">
                                <span className={`font-medium ${isDarkMode ? 'text-gray-300' : ''}`}>{skill.name}</span>
                                <span className="text-gray-500">{skill.value}%</span>
                              </div>
                              <div className={`h-2 ${isDarkMode ? 'bg-gray-800' : 'bg-gray-100'} rounded-full overflow-hidden`}>
                                <div className={`h-full ${skill.color}`} style={{ width: `${skill.value}%` }}></div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className={`${isDarkMode ? 'bg-indigo-500/10 border-indigo-500/20' : 'bg-indigo-50 border-indigo-100'} rounded-2xl p-6 border`}>
                      <h4 className={`${isDarkMode ? 'text-indigo-400' : 'text-indigo-900'} font-bold mb-4 flex items-center gap-2`}>
                        <AlertCircle size={18} />
                        AI Recommendation
                      </h4>
                      <p className={`${isDarkMode ? 'text-indigo-300/80' : 'text-indigo-700'} text-sm leading-relaxed`}>
                        You've spent 65% of your time on "Project Atlas" this week. Your deep work ratio is exceptionally high (4.2h avg). Consider scheduling a review for the "Internal Tools" backlog to prevent bottlenecks.
                      </p>
                      <button
                        onClick={() => {
                          setActiveTab('dashboard');
                          setInput('Generate a full performance report for me.');
                          setIsSidebarOpen(true);
                        }}
                        className="mt-4 w-full bg-indigo-600 text-white py-2 rounded-xl text-sm font-bold hover:bg-indigo-700 transition-colors"
                      >
                        Generate Full Report
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'support' && (
              <div className="max-w-5xl mx-auto">
                <SupportHub />
              </div>
            )}
          </div>
        </main>

        {/* AI Agent Sidebar */}
        <AnimatePresence>
          {isSidebarOpen && (
            <motion.aside
              initial={{ x: 400 }}
              animate={{ x: 0 }}
              exit={{ x: 400 }}
              className={`fixed inset-y-0 right-0 lg:relative w-80 sm:w-96 ${isDarkMode ? 'bg-[#121214] border-gray-800' : 'bg-white border-gray-200'} border-l flex flex-col shadow-2xl z-40 transition-colors duration-300`}
            >
              {/* Chat Header */}
              <div className={`p-6 border-b ${isDarkMode ? 'border-gray-800 bg-[#1A1A1C]/50' : 'border-gray-100 bg-gray-50/50'} flex items-center justify-between sticky top-0 z-10`}>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setIsChatHistoryOpen(!isChatHistoryOpen)}
                    className={`p-2 rounded-xl border ${isDarkMode ? 'bg-[#121214] border-gray-800 text-gray-400 hover:text-white hover:border-gray-600' : 'bg-white border-gray-200 text-gray-500 hover:text-gray-900'} transition-all`}
                  >
                    <History size={18} />
                  </button>
                  <div className="w-10 h-10 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-200 shrink-0">
                    <MessageSquare size={20} />
                  </div>
                  <div className="hidden sm:block">
                    <h3 className={`font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'} truncate`}>Work Agent</h3>
                    <div className="flex items-center gap-1.5">
                      <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
                      <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Online</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      createNewChatSession('main');
                      setIsChatHistoryOpen(false);
                    }}
                    className={`p-2 rounded-xl bg-indigo-500 text-white font-bold text-xs flex items-center gap-1 hover:bg-indigo-600 transition-colors shadow-md shadow-indigo-500/20`}
                    title="New Chat"
                  >
                    <Plus size={16} /> <span className="hidden sm:inline">New</span>
                  </button>
                  <button
                    onClick={() => setIsSidebarOpen(false)}
                    className="lg:hidden p-2 text-gray-400 hover:text-gray-600"
                  >
                    <Plus size={20} className="rotate-45" />
                  </button>
                </div>
              </div>

              {/* History Drawer Overlay */}
              {isChatHistoryOpen && (
                <ChatHistoryDrawer
                  sessions={mainChatSessions}
                  activeId={activeMainChatId}
                  isDarkMode={isDarkMode}
                  onSelect={async (id) => {
                    const msgs = await loadChatSession('main', id);
                    if (msgs) setMessages(msgs.map((m: any) => ({ ...m, timestamp: m.timestamp ? new Date(m.timestamp) : new Date() })));
                    setIsChatHistoryOpen(false);
                  }}
                  onRename={(id, title) => renameChatSession('main', id, title)}
                  onDelete={(id) => deleteChatSession('main', id)}
                  onDeleteAll={() => {
                    if (window.confirm('Delete ALL chat history? This cannot be undone.')) deleteAllChatSessions('main');
                  }}
                  onClose={() => setIsChatHistoryOpen(false)}
                />
              )}

              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {messages.map((msg, i) => (
                  <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[95%] p-4 rounded-2xl text-sm ${msg.role === 'user'
                      ? 'bg-indigo-600 text-white rounded-tr-none shadow-lg shadow-indigo-900/20'
                      : `${isDarkMode ? 'bg-[#1A1A1C] border-gray-800 text-gray-300' : 'bg-white border-gray-100 text-gray-700'} border rounded-tl-none shadow-sm`
                      }`}>
                      {msg.role === 'assistant' ? (
                        <div className={`prose prose-sm max-w-none ${isDarkMode ? 'prose-invert' : ''}`}>
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {msg.content}
                          </ReactMarkdown>
                        </div>
                      ) : (
                        msg.content
                      )}
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="flex justify-start">
                    <div className={`${isDarkMode ? 'bg-[#1A1A1C] border-gray-800' : 'bg-white border-gray-100'} border p-4 rounded-2xl rounded-tl-none shadow-sm flex items-center gap-2`}>
                      <Loader2 size={16} className="animate-spin text-indigo-600" />
                      <span className="text-xs text-gray-400 font-medium">Thinking...</span>
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              <div className={`p-6 border-t ${isDarkMode ? 'border-gray-800' : 'border-gray-100'}`}>
                <form onSubmit={handleSendMessage} className="relative">
                  <textarea
                    ref={(el) => {
                      if (el) {
                        el.style.height = 'auto';
                        el.style.height = `${Math.min(el.scrollHeight, 200)}px`;
                      }
                    }}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage(e as any);
                      }
                    }}
                    placeholder={isLoading ? 'Yukime is thinking...' : 'Ask me to create a task...'}
                    disabled={isLoading}
                    rows={1}
                    className={`w-full ${isDarkMode ? 'bg-[#1A1A1C] border-gray-700 text-white' : 'bg-gray-50 border-gray-200'} border rounded-2xl px-5 py-4 pr-14 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all disabled:opacity-60 resize-none overflow-hidden`}
                  />
                  {isLoading ? (
                    <button
                      type="button"
                      onClick={handleStopGeneration}
                      title="Stop generation"
                      className="absolute right-2 top-2 bottom-2 w-10 bg-red-500 text-white rounded-xl flex items-center justify-center hover:bg-red-600 transition-all animate-pulse"
                    >
                      <Square size={16} fill="white" />
                    </button>
                  ) : (
                    <button
                      type="submit"
                      disabled={!input.trim()}
                      className="absolute right-2 top-2 bottom-2 w-10 bg-indigo-600 text-white rounded-xl flex items-center justify-center hover:bg-indigo-700 disabled:opacity-50 transition-all"
                    >
                      <Send size={18} />
                    </button>
                  )}
                </form>
                <p className="text-[10px] text-gray-500 text-center mt-4 font-medium uppercase tracking-widest">
                  Powered by Yukime
                </p>
              </div>
            </motion.aside>
          )}
        </AnimatePresence>
        {/* Task Modal */}
        <AnimatePresence>
          {isModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsModalOpen(false)}
                className="absolute inset-0 bg-black/40 backdrop-blur-md"
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className={`${isDarkMode ? 'bg-[#121214] border-gray-800' : 'bg-white'} w-full max-w-2xl rounded-[32px] shadow-3xl relative z-10 overflow-hidden flex flex-col max-h-[90vh]`}
              >
                {/* AI Assist Header */}
                <div className={`p-4 ${isDarkMode ? 'bg-[#1A1A1C] border-b border-gray-800' : 'bg-indigo-50 border-b border-indigo-100'} sticky top-0 z-20`}>
                  <div className="relative">
                    <Sparkles className="absolute left-4 top-1/2 -translate-y-1/2 text-indigo-500" size={18} />
                    <input
                      type="text"
                      value={aiTaskPrompt}
                      onChange={(e) => setAiTaskPrompt(e.target.value)}
                      placeholder="AI Quick Fill: 'Design landing page by Friday, priority high...'"
                      className={`w-full pl-12 pr-4 py-3 rounded-2xl text-sm border-2 transition-all ${isDarkMode ? 'bg-[#0A0A0B] border-gray-800 focus:border-indigo-500 text-white' : 'bg-white border-transparent focus:border-indigo-500 text-gray-900 shadow-sm'}`}
                    />
                    <button
                      type="button"
                      onClick={handleMagicFill}
                      disabled={isLoading || !aiTaskPrompt.trim()}
                      className="absolute right-2 top-1/2 -translate-y-1/2 bg-indigo-600 text-white text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-lg hover:bg-indigo-700 transition-all disabled:opacity-50"
                    >
                      {isLoading ? <Loader2 className="animate-spin" size={14} /> : 'Magic Fill'}
                    </button>
                  </div>
                </div>

                <div className="p-8 overflow-y-auto custom-scrollbar flex-1">
                  <div className="flex items-center justify-between mb-8">
                    <h3 className={`text-2xl font-black italic tracking-tighter uppercase ${isDarkMode ? 'text-white' : 'text-gray-900'} flex items-center gap-3`}>
                      <PlusCircle className="text-indigo-500" />
                      {editingTask ? 'Manifest Task' : 'New Objective'}
                    </h3>
                    <div className="flex items-center gap-2">
                      {/* Priority / Status Badges here if needed */}
                    </div>
                  </div>

                  <form onSubmit={handleSaveTask} className="space-y-8">
                    {/* 🟢 1. Core Fields */}
                    <section className="space-y-6">
                      <div>
                        <label className="block text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-2.5 ml-1">Title</label>
                        <input
                          required
                          type="text"
                          value={formData.title}
                          onChange={e => setFormData(prev => ({ ...prev, title: e.target.value }))}
                          className={`w-full ${isDarkMode ? 'bg-[#1A1A1C] border-gray-800 text-white placeholder:text-gray-600' : 'bg-gray-50 border-gray-100 text-gray-900'} border-2 rounded-2xl px-5 py-3.5 text-base font-medium focus:border-indigo-500 outline-none transition-all`}
                          placeholder="Enter task title..."
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-6">
                        <div>
                          <label className="block text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-2.5 ml-1">Workspace / Project</label>
                          <div className="relative group">
                            <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-indigo-500 transition-colors" size={16} />
                            <select
                              value={formData.project_id}
                              onChange={e => setFormData(prev => ({ ...prev, project_id: parseInt(e.target.value) }))}
                              className={`w-full pl-12 pr-4 py-3.5 rounded-2xl border-2 appearance-none transition-all ${isDarkMode ? 'bg-[#1A1A1C] border-gray-800 text-white focus:border-indigo-500' : 'bg-gray-50 border-gray-100 focus:border-indigo-500'}`}
                            >
                              {projects.map(p => (
                                <option key={p.id} value={p.id}>{p.name}</option>
                              ))}
                            </select>
                            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
                          </div>
                        </div>
                        <div>
                          <label className="block text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-2.5 ml-1">Assignee</label>
                          <div className="relative group">
                            <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-indigo-500 transition-colors" size={16} />
                            <select
                              value={formData.assignee_id}
                              onChange={e => setFormData(prev => ({ ...prev, assignee_id: e.target.value }))}
                              disabled={userProfile?.global_role === 'Contributor'}
                              className={`w-full pl-12 pr-4 py-3.5 rounded-2xl border-2 appearance-none transition-all ${userProfile?.global_role === 'Contributor' ? 'opacity-50 cursor-not-allowed ' : ''}${isDarkMode ? 'bg-[#1A1A1C] border-gray-800 text-white focus:border-indigo-500' : 'bg-gray-50 border-gray-100 focus:border-indigo-500'}`}
                            >
                              <option value="">Select Citizen...</option>
                              {allProfiles.filter(p => {
                                const role = userProfile?.global_role;
                                if (role === 'Global Admin' || role === 'Department Admin' || isAdmin) return true;
                                if (role === 'Manager') {
                                  const myTeamIds = new Set(teams.filter(t => t.members?.some((m: any) => m.user_id === user?.id)).map(t => t.id));
                                  const myDeptIds = new Set(teams.filter(t => myTeamIds.has(t.id)).map(t => t.department_id));
                                  const allowedTeamIds = new Set(teams.filter(t => myDeptIds.has(t.department_id)).map(t => t.id));
                                  return teams.some(t => allowedTeamIds.has(t.id) && t.members?.some((m: any) => m.user_id === p.id));
                                }
                                return p.id === user?.id; // Contributor
                              }).map(p => (
                                <option key={p.id} value={p.id}>{p.full_name || p.email}</option>
                              ))}
                            </select>
                            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-6">
                        <div>
                          <label className="block text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-2.5 ml-1">Priority</label>
                          <div className="flex gap-2">
                            {['low', 'medium', 'high', 'urgent'].map(p => (
                              <button
                                key={p}
                                type="button"
                                onClick={() => setFormData(prev => ({ ...prev, priority: p as any }))}
                                className={`flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border-2 ${formData.priority === p
                                  ? (p === 'urgent' ? 'bg-red-500 border-red-500 text-white shadow-lg shadow-red-500/20' : 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-600/20')
                                  : (isDarkMode ? 'bg-[#1A1A1C] border-gray-800 text-gray-500 hover:border-indigo-500' : 'bg-gray-50 border-gray-100 text-gray-400 hover:border-gray-300')
                                  }`}
                              >
                                {p}
                              </button>
                            ))}
                          </div>
                        </div>
                        <div>
                          <label className="block text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-2.5 ml-1">Status</label>
                          <div className="relative group">
                            <select
                              value={formData.status}
                              onChange={e => setFormData(prev => ({ ...prev, status: e.target.value as any }))}
                              className={`w-full pl-5 pr-4 py-3 rounded-2xl border-2 appearance-none transition-all ${isDarkMode ? 'bg-[#1A1A1C] border-gray-800 text-white focus:border-indigo-500' : 'bg-gray-50 border-gray-100 focus:border-indigo-500'}`}
                            >
                              <option value="todo">To Do</option>
                              <option value="in_progress">In Progress</option>
                              <option value="done">Done</option>
                              <option value="blocked">Blocked</option>
                            </select>
                            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={12} />
                          </div>
                        </div>
                      </div>

                      <div>
                        <label className="block text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-2.5 ml-1">Intel / Description</label>
                        <textarea
                          value={formData.description}
                          onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
                          className={`w-full ${isDarkMode ? 'bg-[#1A1A1C] border-gray-800 text-white placeholder:text-gray-600' : 'bg-gray-50 border-gray-100'} border-2 rounded-2xl px-5 py-4 text-sm focus:border-indigo-500 outline-none transition-all min-h-[120px] resize-none font-sans leading-relaxed`}
                          placeholder="What needs to be done? Use Markdown if needed..."
                        />
                      </div>
                    </section>

                    {/* ⏱️ 2. Time & Scheduling */}
                    <section className="space-y-6 pt-6 border-t border-gray-100 dark:border-gray-800">
                      <div className="flex items-center gap-3 mb-6">
                        <Clock className="text-indigo-500" size={18} />
                        <h4 className={`text-sm font-black uppercase tracking-[0.2em] ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Timeline & Logistics</h4>
                      </div>
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2 ml-1">Start Time</label>
                          <input
                            type="datetime-local"
                            value={formData.start_date ? (() => {
                              const d = new Date(formData.start_date);
                              return isNaN(d.getTime()) ? '' : `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}-${d.getDate().toString().padStart(2, '0')}T${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
                            })() : ''}
                            onChange={e => setFormData(prev => ({ ...prev, start_date: e.target.value ? new Date(e.target.value).toISOString() : '' }))}
                            className={`w-full ${isDarkMode ? 'bg-[#1A1A1C] border-gray-800 text-white' : 'bg-gray-50 border-gray-100'} border-2 rounded-xl px-4 py-3 text-xs focus:border-indigo-500 transition-all`}
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2 ml-1">Due Time</label>
                          <input
                            type="datetime-local"
                            value={formData.due_date ? (() => {
                              const d = new Date(formData.due_date);
                              return isNaN(d.getTime()) ? '' : `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}-${d.getDate().toString().padStart(2, '0')}T${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
                            })() : ''}
                            onChange={e => setFormData(prev => ({ ...prev, due_date: e.target.value ? new Date(e.target.value).toISOString() : '' }))}
                            className={`w-full ${isDarkMode ? 'bg-[#1A1A1C] border-gray-800 text-white' : 'bg-gray-50 border-gray-100'} border-2 rounded-xl px-4 py-3 text-xs focus:border-indigo-500 transition-all`}
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2 ml-1">Estimate (Hrs)</label>
                          <input
                            type="number"
                            step="0.5"
                            value={formData.estimated_hours || ''}
                            onChange={e => setFormData(prev => ({ ...prev, estimated_hours: parseFloat(e.target.value) || 0 }))}
                            placeholder="Hours..."
                            className={`w-full ${isDarkMode ? 'bg-[#1A1A1C] border-gray-800 text-white' : 'bg-gray-50 border-gray-100'} border-2 rounded-xl px-4 py-3 text-xs focus:border-indigo-500 transition-all`}
                          />
                        </div>
                      </div>
                    </section>

                    {/* 🧱 3. Task Structure (Subtasks) */}
                    <section className="space-y-6 pt-6 border-t border-gray-100 dark:border-gray-800">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <CheckSquare className="text-indigo-500" size={18} />
                          <h4 className={`text-sm font-black uppercase tracking-[0.2em] ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Sub-Objectives</h4>
                        </div>
                        <span className="text-[10px] font-bold text-indigo-500 bg-indigo-500/10 px-2 py-1 rounded-md">
                          {formData.subtasks.length} Items
                        </span>
                      </div>

                      <div className="space-y-3">
                        {formData.subtasks.map((st, idx) => (
                          <div key={idx} className={`flex items-center gap-3 p-3 rounded-xl border-2 ${isDarkMode ? 'bg-[#0A0A0B] border-gray-800' : 'bg-white border-gray-100'}`}>
                            <input
                              type="checkbox"
                              checked={st.completed}
                              onChange={() => {
                                const updated = [...formData.subtasks];
                                updated[idx].completed = !updated[idx].completed;
                                setFormData(prev => ({ ...prev, subtasks: updated }));
                              }}
                              className="w-4 h-4 rounded-md border-2 border-indigo-500 text-indigo-600 focus:ring-indigo-500"
                            />
                            <input
                              type="text"
                              value={st.title}
                              onChange={(e) => {
                                const updated = [...formData.subtasks];
                                updated[idx].title = e.target.value;
                                setFormData(prev => ({ ...prev, subtasks: updated }));
                              }}
                              className={`flex-1 bg-transparent border-none outline-none text-sm ${st.completed ? 'line-through opacity-50' : (isDarkMode ? 'text-white' : 'text-gray-900')}`}
                            />
                            <button
                              type="button"
                              onClick={() => setFormData(prev => ({ ...prev, subtasks: prev.subtasks.filter((_, i) => i !== idx) }))}
                              className="text-red-500 hover:bg-red-500/10 p-1.5 rounded-lg"
                            >
                              <Plus className="rotate-45" size={14} />
                            </button>
                          </div>
                        ))}
                        <div className="relative">
                          <PlusCircle className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                          <input
                            type="text"
                            value={newSubtask}
                            onChange={(e) => setNewSubtask(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' && newSubtask.trim()) {
                                e.preventDefault();
                                setFormData(prev => ({ ...prev, subtasks: [...prev.subtasks, { title: newSubtask.trim(), completed: false }] }));
                                setNewSubtask('');
                              }
                            }}
                            placeholder="Add sub-objective and press Enter..."
                            className={`w-full pl-12 pr-4 py-3 rounded-2xl border-2 border-dashed transition-all ${isDarkMode ? 'bg-[#1A1A1C] border-gray-800 focus:border-indigo-500 hover:border-gray-700 text-white' : 'bg-gray-50 border-gray-200 focus:border-indigo-500 hover:border-gray-300 text-gray-900'}`}
                          />
                        </div>
                      </div>
                    </section>

                    {/* ⚙️ 8. Advanced Options (Collapsible) */}
                    <div className="pt-4">
                      <button
                        type="button"
                        onClick={() => setShowAdvanced(!showAdvanced)}
                        className={`w-full flex items-center justify-between p-4 rounded-2xl border-2 transition-all ${isDarkMode ? 'bg-[#1A1A1C] border-gray-800 hover:bg-gray-800 text-gray-300' : 'bg-gray-50 border-gray-100 hover:bg-gray-100 text-gray-700'}`}
                      >
                        <div className="flex items-center gap-3">
                          <Settings size={16} />
                          <span className="text-xs font-black uppercase tracking-widest">Advanced Recon & Budget</span>
                        </div>
                        {showAdvanced ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      </button>

                      <AnimatePresence>
                        {showAdvanced && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="overflow-hidden"
                          >
                            <div className="p-6 space-y-6 border-x-2 border-b-2 border-gray-100 dark:border-gray-800 rounded-b-2xl">
                              <div className="grid grid-cols-2 gap-6">
                                <div>
                                  <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2 ml-1">Dependencies (IDs)</label>
                                  <input
                                    type="text"
                                    placeholder="e.g. 102, 105"
                                    value={formData.dependencies?.join(', ') || ''}
                                    onChange={e => setFormData(prev => ({ ...prev, dependencies: e.target.value.split(',').map(t => parseInt(t.trim())).filter(n => !isNaN(n)) }))}
                                    className={`w-full ${isDarkMode ? 'bg-[#0A0A0B] border-gray-800 text-white' : 'bg-white border-gray-100'} border-2 rounded-xl px-4 py-3 text-sm`}
                                  />
                                </div>
                                <div>
                                  <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2 ml-1">Budget ($)</label>
                                  <input
                                    type="number"
                                    value={formData.budget || ''}
                                    onChange={e => setFormData(prev => ({ ...prev, budget: parseFloat(e.target.value) || 0 }))}
                                    className={`w-full ${isDarkMode ? 'bg-[#0A0A0B] border-gray-800 text-white' : 'bg-white border-gray-100'} border-2 rounded-xl px-4 py-3 text-sm`}
                                  />
                                </div>
                              </div>
                              <div className="flex items-center gap-4 pt-6">
                                <div className="flex items-center gap-3 group cursor-pointer" onClick={() => setFormData(prev => ({ ...prev, is_private: !prev.is_private }))}>
                                  <div className={`w-10 h-6 rounded-full transition-all relative ${formData.is_private ? 'bg-indigo-600' : 'bg-gray-400'}`}>
                                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${formData.is_private ? 'left-5' : 'left-1'}`} />
                                  </div>
                                  <span className={`text-[10px] font-black uppercase tracking-widest ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Private Objective</span>
                                </div>
                              </div>
                              <div>
                                <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2 ml-1">Direct Tags (Comma separated)</label>
                                <input
                                  type="text"
                                  placeholder="design, high-priority, q3"
                                  value={formData.tags.join(', ')}
                                  onChange={e => setFormData(prev => ({ ...prev, tags: e.target.value.split(',').map(t => t.trim()) }))}
                                  className={`w-full ${isDarkMode ? 'bg-[#0A0A0B] border-gray-800 text-white' : 'bg-white border-gray-100'} border-2 rounded-xl px-4 py-3 text-sm`}
                                />
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    {/* 🎯 9. Action Buttons */}
                    <div className="flex gap-4 pt-8 pb-4">
                      <button
                        type="button"
                        onClick={() => setIsModalOpen(false)}
                        className={`px-6 ${isDarkMode ? 'bg-gray-800 hover:bg-gray-700 text-gray-300' : 'bg-gray-100 hover:bg-gray-200 text-gray-600'} py-4 rounded-3xl font-black uppercase tracking-widest text-[10px] transition-all`}
                      >
                        Abort
                      </button>

                      {!editingTask && (
                        <button
                          type="button"
                          onClick={(e) => handleSaveTask(e, true)}
                          className={`px-6 ${isDarkMode ? 'bg-gray-800 border-2 border-indigo-500/30 hover:border-indigo-500 text-indigo-400' : 'bg-indigo-50 border-2 border-indigo-200 text-indigo-600'} py-4 rounded-3xl font-black uppercase tracking-widest text-[10px] transition-all flex items-center gap-2`}
                        >
                          <PlusCircle size={16} />
                          Add Another
                        </button>
                      )}

                      <button
                        type="submit"
                        className="flex-1 bg-indigo-600 text-white py-4 rounded-3xl font-black uppercase tracking-widest text-[10px] hover:bg-indigo-700 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-indigo-600/30 flex items-center justify-center gap-3"
                      >
                        {editingTask ? <History size={20} /> : <PlusCircle size={20} />}
                        {editingTask ? 'Commit Updates' : 'Manifest Task'}
                      </button>
                    </div>
                  </form>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
        {/* Project Modal */}
        <AnimatePresence>
          {isProjectModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsProjectModalOpen(false)}
                className="absolute inset-0 bg-black/20 backdrop-blur-sm"
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className={`${isDarkMode ? 'bg-[#121214] border-gray-800' : 'bg-white'} w-full max-w-lg rounded-3xl shadow-2xl relative z-10 overflow-hidden`}
              >
                <div className="p-8">
                  <h3 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'} mb-6`}>
                    {editingProject ? 'Edit Project' : 'Create New Project'}
                  </h3>

                  {editingProject && (
                    <div className="mb-6 flex justify-end">
                      <button
                        onClick={() => handleDeleteProject(editingProject.id)}
                        className="text-red-600 text-sm font-bold flex items-center gap-1 hover:text-red-700"
                      >
                        <Trash2 size={14} /> Delete Entire Project
                      </button>
                    </div>
                  )}

                  <form onSubmit={handleSaveProject} className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5">Project Name</label>
                      <input
                        required
                        type="text"
                        value={projectFormData.name}
                        onChange={e => setProjectFormData(prev => ({ ...prev, name: e.target.value }))}
                        className={`w-full ${isDarkMode ? 'bg-[#1A1A1C] border-gray-700 text-white placeholder:text-gray-500' : 'bg-gray-50 border-gray-200 text-gray-900'} rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all`}
                        placeholder="e.g. Marketing Q3"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5">Description</label>
                      <textarea
                        value={projectFormData.description}
                        onChange={e => setProjectFormData(prev => ({ ...prev, description: e.target.value }))}
                        className={`w-full ${isDarkMode ? 'bg-[#1A1A1C] border-gray-700 text-white placeholder:text-gray-500' : 'bg-gray-50 border-gray-200 text-gray-900'} rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all h-24 resize-none`}
                        placeholder="Project details..."
                      />
                    </div>

                    <div className="flex gap-3 pt-4">
                      <button
                        type="button"
                        onClick={() => setIsProjectModalOpen(false)}
                        className="flex-1 bg-gray-100 text-gray-600 py-3 rounded-xl font-bold hover:bg-gray-200 transition-all"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="flex-1 bg-indigo-600 text-white py-3 rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
                      >
                        {editingProject ? 'Save Changes' : 'Create Project'}
                      </button>
                    </div>
                  </form>

                  {!editingProject && projects.length > 0 && (
                    <div className="mt-8 border-t border-gray-100 pt-6">
                      <h4 className="text-sm font-bold text-gray-900 mb-4">Existing Projects</h4>
                      <div className="space-y-2 max-h-40 overflow-y-auto pr-2">
                        {projects.map(p => (
                          <div key={p.id} className={`flex items-center justify-between p-3 ${isDarkMode ? 'bg-[#1A1A1C] border-gray-800' : 'bg-gray-50 border-gray-100'} rounded-xl border`}>
                            <div>
                              <p className={`text-sm font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{p.name}</p>
                              <p className="text-xs text-gray-500 truncate max-w-[200px]">{p.description}</p>
                            </div>
                            <button
                              onClick={() => handleOpenProjectModal(p)}
                              className="text-indigo-600 text-xs font-bold hover:underline"
                            >
                              Edit
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Time Log Modal */}
        <AnimatePresence>
          {isTimeLogModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsTimeLogModalOpen(false)}
                className="absolute inset-0 bg-black/20 backdrop-blur-sm"
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className={`${isDarkMode ? 'bg-[#121214] border-gray-800' : 'bg-white'} w-full max-w-sm rounded-3xl shadow-2xl relative z-10 overflow-hidden`}
              >
                <div className="p-8">
                  <h3 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'} mb-6 flex items-center gap-2`}>
                    <Clock size={20} className="text-indigo-500" /> Log Time
                  </h3>
                  <form onSubmit={handleSaveTimeLog} className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5">Hours Spent</label>
                      <input
                        required
                        type="number"
                        step="0.1"
                        min="0.1"
                        value={timeLogFormData.hours || ''}
                        onChange={e => setTimeLogFormData(prev => ({ ...prev, hours: parseFloat(e.target.value) || 0 }))}
                        className={`w-full ${isDarkMode ? 'bg-[#1A1A1C] border-gray-700 text-white placeholder:text-gray-500' : 'bg-gray-50 border-gray-200 text-gray-900'} rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all`}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5">Date</label>
                      <input
                        required
                        type="date"
                        value={timeLogFormData.date}
                        onChange={e => setTimeLogFormData(prev => ({ ...prev, date: e.target.value }))}
                        className={`w-full ${isDarkMode ? 'bg-[#1A1A1C] border-gray-700 text-white placeholder:text-gray-500' : 'bg-gray-50 border-gray-200 text-gray-900'} rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all`}
                      />
                    </div>

                    <div className="flex gap-3 pt-4">
                      <button
                        type="button"
                        onClick={() => setIsTimeLogModalOpen(false)}
                        className="flex-1 bg-gray-100 text-gray-600 py-3 rounded-xl font-bold hover:bg-gray-200 transition-all"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={isLoading}
                        className="flex-1 bg-indigo-600 text-white py-3 rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 disabled:opacity-50"
                      >
                        {isLoading ? 'Saving...' : 'Save Time'}
                      </button>
                    </div>
                  </form>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Global Search Modal */}
        <AnimatePresence>
          {isSearchModalOpen && (
            <div className="fixed inset-0 z-50 flex items-start justify-center pt-[10vh] px-4 w-full h-full pointer-events-auto">
              <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                onClick={() => setIsSearchModalOpen(false)}
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: -20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -20 }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                className={`relative z-10 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col ${isDarkMode ? 'bg-[#161618] border border-gray-800' : 'bg-white border border-gray-200'}`}
              >
                <div className={`flex items-center px-4 py-3 border-b ${isDarkMode ? 'border-gray-800' : 'border-gray-100'}`}>
                  <Search size={20} className={isDarkMode ? 'text-gray-500' : 'text-gray-400'} />
                  <input
                    type="text"
                    autoFocus
                    placeholder="Ask Yukime AI, or search tasks, projects and people..."
                    className={`flex-1 bg-transparent border-none outline-none px-4 text-base ${isDarkMode ? 'text-white placeholder-gray-600' : 'text-gray-900 placeholder-gray-400'}`}
                  />
                  <div className={`px-2 py-1 rounded text-[10px] font-bold cursor-pointer hover:bg-gray-700 transition-colors ${isDarkMode ? 'bg-gray-800 text-gray-400' : 'bg-gray-100 text-gray-500'}`} onClick={() => setIsSearchModalOpen(false)}>ESC</div>
                </div>
                <div className={`p-4 min-h-[300px] max-h-[60vh] overflow-y-auto ${isDarkMode ? 'bg-[#0e0f10]' : 'bg-gray-50/50'}`}>
                  <div className="flex flex-col items-center justify-center h-48 text-center text-gray-500">
                    <Sparkles size={32} className={`mb-3 ${isDarkMode ? 'text-indigo-500/50' : 'text-indigo-400/50'}`} />
                    <p className="text-sm font-medium text-gray-300">What are you looking for?</p>
                    <p className="text-xs mt-1 max-w-sm opacity-80">Start typing to search across your workspace, or ask natural language questions to let Yukime find the relevant data.</p>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Global Workspace Settings Modal */}
        <AnimatePresence>
          {isWorkspaceSettingsModalOpen && (
            <WorkspaceSettings onClose={() => setIsWorkspaceSettingsModalOpen(false)} />
          )}
        </AnimatePresence>

        {/* Settings Modal (User Level) */}
        <AnimatePresence>
          {isSettingsModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsSettingsModalOpen(false)}
                className="absolute inset-0 bg-black/40 backdrop-blur-sm"
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className={`${isDarkMode ? 'bg-[#121214] border-gray-800' : 'bg-white border-gray-100'} w-full max-w-sm rounded-3xl border shadow-2xl relative z-10 overflow-hidden`}
              >
                <div className="p-8">
                  <h3 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'} mb-6 flex items-center gap-2`}>
                    <Settings size={20} className="text-indigo-500" /> Settings
                  </h3>
                  <div className="space-y-6">
                    {/* Dark Mode Toggle */}
                    <div className="flex items-center justify-between">
                      <div>
                        <p className={`text-sm font-bold ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>Dark Mode</p>
                        <p className="text-xs text-gray-500">Toggle dark theme</p>
                      </div>
                      <button
                        onClick={() => toggleDarkMode()}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${isDarkMode ? 'bg-indigo-600' : 'bg-gray-200'}`}
                      >
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isDarkMode ? 'translate-x-6' : 'translate-x-1'}`} />
                      </button>
                    </div>
                    <p className="text-xs text-gray-500">Edit your profile name, photo, security settings, and privacy preferences from the profile dropdown in the top-right corner.</p>

                    <div className="pt-4">
                      <button
                        onClick={() => setIsSettingsModalOpen(false)}
                        className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-900/20"
                      >
                        Done
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Throne Admin Modal */}
        <AnimatePresence>
          {isThroneModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsThroneModalOpen(false)}
                className="absolute inset-0 bg-black/60 backdrop-blur-md"
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className={`${isDarkMode ? 'bg-[#0F0F11] border-indigo-500/20' : 'bg-white border-gray-100'} w-full max-w-2xl rounded-3xl border shadow-[0_0_50px_-12px_rgba(79,70,229,0.3)] relative z-10 overflow-hidden max-h-[90vh] flex flex-col`}
              >
                <div className="p-8 overflow-y-auto">
                  <h3 className={`text-2xl font-black ${isDarkMode ? 'text-white' : 'text-gray-900'} mb-8 flex items-center gap-3 italic tracking-tight`}>
                    <Shield size={28} className="text-indigo-500 fill-indigo-500/10" /> THRONE
                  </h3>

                  <div className="space-y-10">
                    {/* Model & AI Config */}
                    <section className="space-y-6">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-1 h-4 bg-indigo-500 rounded-full"></div>
                        <h4 className={`text-xs font-bold ${isDarkMode ? 'text-gray-400' : 'text-gray-500'} uppercase tracking-[0.2em]`}>Intelligence Core</h4>
                      </div>

                      <div className={`p-6 rounded-2xl ${isDarkMode ? 'bg-indigo-500/5 border-indigo-500/10' : 'bg-indigo-50/50 border-indigo-100'} border space-y-6`}>
                        <div className="flex items-center justify-between">
                          <div>
                            <p className={`text-sm font-bold ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>Use Local Model</p>
                            <p className="text-xs text-gray-500 italic">Bypass Gemini Cloud for privacy</p>
                          </div>
                          <button
                            onClick={() => setUseLocalModel(!useLocalModel)}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-all duration-300 ${useLocalModel ? 'bg-indigo-600 shadow-[0_0_15px_-3px_rgba(79,70,229,0.6)]' : 'bg-gray-200'}`}
                          >
                            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${useLocalModel ? 'translate-x-6' : 'translate-x-1'}`} />
                          </button>
                        </div>

                        {useLocalModel ? (
                          <div className="space-y-3">
                            <label className="block text-[10px] font-bold text-indigo-500/70 uppercase tracking-widest ml-1">Local Server Endpoint</label>
                            <input
                              type="url"
                              value={localModelUrl}
                              onChange={e => setLocalModelUrl(e.target.value)}
                              placeholder="http://localhost:1234/v1"
                              className={`w-full ${isDarkMode ? 'bg-[#161618] border-gray-800 text-white' : 'bg-white border-gray-200'} border rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all font-mono`}
                            />
                          </div>
                        ) : (
                          <div className="space-y-3">
                            <label className="block text-[10px] font-bold text-indigo-500/70 uppercase tracking-widest ml-1">Gemini API Key</label>
                            <div className="relative">
                              <input
                                type="password"
                                value={geminiApiKey}
                                onChange={e => setGeminiApiKey(e.target.value)}
                                placeholder="Enter API key..."
                                className={`w-full ${isDarkMode ? 'bg-[#161618] border-gray-800 text-white' : 'bg-white border-gray-200'} border rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all font-mono`}
                              />
                              <Lock size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-600" />
                            </div>
                            <p className="text-[10px] text-gray-500 px-1">Keys are stored locally and never shared with Rickel Industries.</p>
                          </div>
                        )}
                      </div>
                    </section>

                    {/* User Management */}
                    <section className="space-y-6">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-1 h-4 bg-indigo-500 rounded-full"></div>
                        <h4 className={`text-xs font-bold ${isDarkMode ? 'text-gray-400' : 'text-gray-500'} uppercase tracking-[0.2em]`}>User Nexus</h4>
                      </div>

                      <div className={`p-6 rounded-2xl ${isDarkMode ? 'bg-gray-900/50 border-gray-800' : 'bg-gray-50/50 border-gray-100'} border space-y-6`}>
                        <form onSubmit={handleInviteUser} className="flex gap-2">
                          <input
                            type="email"
                            value={inviteEmail}
                            onChange={e => setInviteEmail(e.target.value)}
                            placeholder="Collaborator's email..."
                            className={`flex-1 ${isDarkMode ? 'bg-[#161618] border-gray-800 text-white' : 'bg-white border-gray-200'} border rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all`}
                          />
                          <button
                            type="submit"
                            className="bg-indigo-600 text-white px-6 py-2 rounded-xl text-sm font-bold hover:bg-indigo-700 transition-all flex items-center gap-2 whitespace-nowrap"
                          >
                            Send Magic Link
                          </button>
                        </form>

                        <div className="space-y-3">
                          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">Active Citizens</p>
                          <div className={`divide-y ${isDarkMode ? 'divide-gray-800' : 'divide-gray-100'} max-h-[200px] overflow-y-auto pr-2`}>
                            {isAdminPanelLoading ? (
                              <div className="py-8 text-center text-gray-500 flex flex-col items-center gap-2">
                                <Loader2 className="animate-spin text-indigo-500" />
                                <span className="text-xs italic">Summoning profiles...</span>
                              </div>
                            ) : (
                              allProfiles.map(p => (
                                <div key={p.id} className="py-3 flex items-center justify-between group">
                                  <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-gray-200 overflow-hidden ring-2 ring-indigo-500/0 group-hover:ring-indigo-500/20 transition-all">
                                      <img src={p.avatar_url || `https://picsum.photos/seed/${p.full_name}/32/32`} alt="" />
                                    </div>
                                    <div>
                                      <p className={`text-sm font-bold ${isDarkMode ? 'text-gray-200' : 'text-gray-900'}`}>{p.full_name || 'Incognito'}</p>
                                      <p className="text-[10px] text-gray-500 font-mono opacity-60">ID: {p.id.slice(0, 8)}...</p>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <button
                                      title="Reset Password"
                                      onClick={() => resetUserPassword(p.email).then(() => alert('Reset link sent to ' + p.email))}
                                      className={`p-1.5 rounded-lg transition-all ${isDarkMode ? 'text-gray-500 hover:text-amber-400 hover:bg-amber-400/10' : 'text-gray-400 hover:text-amber-600 hover:bg-amber-50'}`}
                                    >
                                      <Mail size={14} />
                                    </button>
                                    <button
                                      onClick={() => toggleUserAdmin(p.id, p.is_admin).then(() => fetchProfiles())}
                                      className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-tighter transition-all ${p.is_admin ? 'bg-indigo-500 text-white shadow-md shadow-indigo-500/20' : 'bg-gray-200 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-indigo-500/10 hover:text-indigo-400'}`}
                                    >
                                      {p.is_admin ? 'Admin' : 'Make Admin'}
                                    </button>
                                  </div>
                                </div>
                              ))
                            )}
                          </div>
                        </div>

                        {/* User Tokens Placeholder */}
                        <div className="pt-4 border-t border-gray-100 dark:border-gray-800">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className={`text-xs font-bold ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Citizen Tokens</p>
                              <p className="text-[10px] text-gray-500 italic">Manage API access for users</p>
                            </div>
                            <button className="text-[10px] bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 px-3 py-1.5 rounded-lg font-bold hover:bg-indigo-500 hover:text-white transition-all">
                              Generate All
                            </button>
                          </div>
                        </div>
                      </div>
                    </section>
                  </div>

                  <div className="mt-12">
                    <button
                      onClick={() => setIsThroneModalOpen(false)}
                      className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-4 rounded-2xl font-black uppercase tracking-widest hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-indigo-600/20 text-sm"
                    >
                      Exit Throne
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Global Modals */}
        <ReportBuilderModal />
        <ReportViewer />
        <AnimatePresence>
          {isFocusModeOpen && <FocusModeModal onClose={() => setIsFocusModeOpen(false)} />}
        </AnimatePresence>
      </div >
    </div >
  );
}
