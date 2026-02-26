import React, { useState, useEffect, useRef } from 'react';
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
  Trash2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface Task {
  id: number;
  title: string;
  description: string;
  project_id: number;
  project_name: string;
  priority: 'low' | 'medium' | 'high';
  status: 'todo' | 'in_progress' | 'done';
  estimated_hours: number;
  created_at: string;
}

interface Project {
  id: number;
  name: string;
  description: string;
  status: string;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export default function App() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [totalHours, setTotalHours] = useState(0);
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: 'Hello! I am your Work Intelligence Agent. How can I help you manage your tasks today?' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'tasks' | 'reports'>('dashboard');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [isTimeLogModalOpen, setIsTimeLogModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [selectedTaskIdForTimeLog, setSelectedTaskIdForTimeLog] = useState<number | null>(null);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    project_id: 0,
    priority: 'medium' as 'low' | 'medium' | 'high',
    estimated_hours: 0,
    status: 'todo' as 'todo' | 'in_progress' | 'done'
  });
  const [projectFormData, setProjectFormData] = useState({
    name: '',
    description: '',
    status: 'active'
  });
  const [timeLogFormData, setTimeLogFormData] = useState({
    hours: 0,
    date: new Date().toISOString().split('T')[0]
  });

  const [isNavOpen, setIsNavOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const fetchData = async () => {
    try {
      const [tasksRes, projectsRes, metricsRes] = await Promise.all([
        fetch('/api/tasks'),
        fetch('/api/projects'),
        fetch('/api/metrics')
      ]);
      const tasksData = await tasksRes.json();
      const projectsData = await projectsRes.json();
      const metricsData = await metricsRes.json();

      setTasks(Array.isArray(tasksData) ? tasksData : []);
      setProjects(Array.isArray(projectsData) ? projectsData : []);
      if (metricsData && typeof metricsData.totalHours === 'number') {
        setTotalHours(metricsData.totalHours);
      }

      // Set default project if none selected and projects exist
      if (formData.project_id === 0 && Array.isArray(projectsData) && projectsData.length > 0) {
        setFormData(prev => ({ ...prev, project_id: projectsData[0].id }));
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

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
        status: task.status
      });
    } else {
      setEditingTask(null);
      setFormData({
        title: '',
        description: '',
        project_id: projects[0]?.id || 0,
        priority: 'medium',
        estimated_hours: 0,
        status: 'todo'
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

  const handleSaveTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.project_id === 0) {
      alert("A valid project must be selected.");
      return;
    }

    const url = editingTask ? `/api/tasks/${editingTask.id}` : '/api/tasks';
    const method = editingTask ? 'PATCH' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        setIsModalOpen(false);
        fetchData();
      } else {
        const data = await res.json();
        alert(`Error: ${data.error}`);
      }
    } catch (error) {
      console.error('Error saving task:', error);
    }
  };

  const handleDeleteTask = async (id: number) => {
    if (!confirm('Are you sure you want to delete this task?')) return;
    try {
      const res = await fetch(`/api/tasks/${id}`, { method: 'DELETE' });
      if (res.ok) fetchData();
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

    const url = editingProject ? `/api/projects/${editingProject.id}` : '/api/projects';
    const method = editingProject ? 'PATCH' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(projectFormData)
      });
      if (res.ok) {
        setIsProjectModalOpen(false);
        fetchData();
      } else {
        const data = await res.json();
        alert(`Error: ${data.error}`);
      }
    } catch (error) {
      console.error('Error saving project:', error);
    }
  };

  const handleDeleteProject = async (id: number) => {
    if (!confirm('Are you sure you want to delete this project? All associated tasks will also be deleted.')) return;
    try {
      const res = await fetch(`/api/projects/${id}`, { method: 'DELETE' });
      if (res.ok) fetchData();
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
      // Simulate action via agent endpoint / chat since we only made the tool for it, 
      // or optionally we could make a direct express route later if needed.
      // But we will just simulate hitting the AI via chat for now or do a fetch to a new endpoint if we had it.
      // Easiest is to send the hidden chat command if no route exists, but let's just make it robust.

      // We will just hit chat with a structured tool call message behind the scenes
      setIsLoading(true);
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: `Log ${timeLogFormData.hours} hours on task ${selectedTaskIdForTimeLog} for date ${timeLogFormData.date}` })
      });
      if (res.ok) {
        setIsTimeLogModalOpen(false);
        setIsRefreshing(true);
        await fetchData();
        setTimeout(() => setIsRefreshing(false), 1000);
      }
    } catch (error) {
      console.error('Error logging time:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMessage })
      });
      const data = await res.json();
      setMessages(prev => [...prev, { role: 'assistant', content: data.text }]);

      // Show visual refresh cue
      setIsRefreshing(true);
      await fetchData();
      setTimeout(() => setIsRefreshing(false), 1000);

    } catch (error) {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, I encountered an error processing your request.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-500 bg-red-50 border-red-100';
      case 'medium': return 'text-amber-500 bg-amber-50 border-amber-100';
      default: return 'text-emerald-500 bg-emerald-50 border-emerald-100';
    }
  };

  return (
    <div className="flex h-screen bg-[#F8F9FA] text-[#1A1A1A] font-sans overflow-hidden">
      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 flex flex-col transition-transform duration-300 transform
        lg:translate-x-0 lg:static lg:inset-0
        ${isNavOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2 text-indigo-600 font-bold text-xl">
            <TrendingUp size={24} />
            <span>CAudio Tracker</span>
          </div>
          <button onClick={() => setIsNavOpen(false)} className="lg:hidden p-2 text-gray-400">
            <Plus size={20} className="rotate-45" />
          </button>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          <button
            onClick={() => { setActiveTab('dashboard'); setIsNavOpen(false); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'dashboard' ? 'bg-indigo-50 text-indigo-600' : 'text-gray-500 hover:bg-gray-50'}`}
          >
            <LayoutDashboard size={20} />
            <span className="font-medium">Dashboard</span>
          </button>
          <button
            onClick={() => { setActiveTab('tasks'); setIsNavOpen(false); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'tasks' ? 'bg-indigo-50 text-indigo-600' : 'text-gray-500 hover:bg-gray-50'}`}
          >
            <CheckCircle2 size={20} />
            <span className="font-medium">My Tasks</span>
          </button>
          <button
            onClick={() => { setActiveTab('reports'); setIsNavOpen(false); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'reports' ? 'bg-indigo-50 text-indigo-600' : 'text-gray-500 hover:bg-gray-50'}`}
          >
            <BarChart3 size={20} />
            <span className="font-medium">Intelligence</span>
          </button>
        </nav>

        <div className="p-4 border-t border-gray-100">
          <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl p-4 text-white">
            <p className="text-xs font-medium opacity-80 uppercase tracking-wider mb-1">Pro Plan</p>
            <p className="text-sm font-bold mb-3">AI Insights Active</p>
            <div className="h-1 bg-white/20 rounded-full overflow-hidden">
              <div className="h-full bg-white w-3/4"></div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 sm:px-8">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsNavOpen(true)}
              className="lg:hidden p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-all"
            >
              <LayoutDashboard size={20} />
            </button>
            <h2 className="text-lg font-semibold capitalize hidden sm:block">{activeTab}</h2>
            {activeTab === 'tasks' && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleOpenProjectModal()}
                  className="flex items-center gap-2 bg-white border border-gray-200 text-gray-700 px-4 py-1.5 rounded-lg text-sm font-bold hover:bg-gray-50 transition-all shadow-sm"
                >
                  <Briefcase size={16} />
                  Projects
                </button>
                <button
                  onClick={() => handleOpenModal()}
                  className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-1.5 rounded-lg text-sm font-bold hover:bg-indigo-700 transition-all shadow-sm shadow-indigo-100"
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
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="lg:hidden p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-all"
            >
              <MessageSquare size={20} />
            </button>
            <div className="flex -space-x-2">
              {[1, 2, 3].map(i => (
                <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-gray-200 overflow-hidden">
                  <img src={`https://picsum.photos/seed/${i}/32/32`} alt="user" referrerPolicy="no-referrer" />
                </div>
              ))}
            </div>
            <button
              onClick={() => alert('No new notifications')}
              className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <AlertCircle size={20} />
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-8">
          {activeTab === 'dashboard' && (
            <div className="space-y-8">
              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                      <Clock size={20} />
                    </div>
                    <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">+12%</span>
                  </div>
                  <h3 className="text-gray-500 text-sm font-medium">Total Hours</h3>
                  <p className="text-2xl font-bold mt-1">{totalHours}h</p>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
                      <TrendingUp size={20} />
                    </div>
                    <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">High</span>
                  </div>
                  <h3 className="text-gray-500 text-sm font-medium">Impact Score</h3>
                  <p className="text-2xl font-bold mt-1">8.4/10</p>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-2 bg-orange-50 text-orange-600 rounded-lg">
                      <CheckCircle2 size={20} />
                    </div>
                    <span className="text-xs font-medium text-gray-400">Target: 10</span>
                  </div>
                  <h3 className="text-gray-500 text-sm font-medium">Tasks Completed</h3>
                  <p className="text-2xl font-bold mt-1">{(Array.isArray(tasks) ? tasks : []).filter(t => t.status === 'done').length}</p>
                </div>
              </div>

              {/* Recent Tasks */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-gray-50 flex items-center justify-between">
                  <h3 className="font-bold text-gray-800">Recent Tasks</h3>
                  <button
                    onClick={() => setActiveTab('tasks')}
                    className="text-indigo-600 text-sm font-medium hover:underline cursor-pointer"
                  >
                    View All
                  </button>
                </div>
                <div className="divide-y divide-gray-50">
                  {(Array.isArray(tasks) ? tasks : []).slice(0, 5).map(task => (
                    <div
                      key={task.id}
                      onClick={() => handleOpenModal(task)}
                      className="p-4 hover:bg-gray-50 transition-colors flex items-center justify-between group cursor-pointer"
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-2 h-2 rounded-full ${task.status === 'done' ? 'bg-emerald-500' : 'bg-amber-500'}`}></div>
                        <div>
                          <p className="font-medium text-gray-900">{task.title}</p>
                          <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                            <Briefcase size={12} /> {task.project_name}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`text-[10px] uppercase tracking-wider font-bold px-2 py-1 rounded-md border ${getPriorityColor(task.priority)}`}>
                          {task.priority}
                        </span>
                        <ChevronRight size={16} className="text-gray-300 group-hover:text-gray-500 transition-colors" />
                      </div>
                    </div>
                  ))}
                  {tasks.length === 0 && (
                    <div className="p-8 text-center text-gray-400">
                      No tasks found. Use the AI agent to create one!
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'tasks' && (
            <div className="relative">
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
              <div className={`grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6 pb-20 mt-4 transition-opacity duration-300 ${isRefreshing ? 'opacity-50' : 'opacity-100'}`}>
                {(Array.isArray(tasks) ? tasks : []).map(task => (
                  <motion.div
                    layout
                    key={task.id}
                    className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow group relative"
                  >
                    <div className="absolute top-4 right-4 flex items-center gap-1 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity z-20">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenModal(task);
                        }}
                        className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all cursor-pointer"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteTask(task.id);
                        }}
                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all cursor-pointer"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                    <div className="flex justify-between items-start mb-4">
                      <span className={`text-[10px] uppercase tracking-wider font-bold px-2 py-1 rounded-md border ${getPriorityColor(task.priority)}`}>
                        {task.priority}
                      </span>
                      <span className="text-xs text-gray-400">{new Date(task.created_at).toLocaleDateString()}</span>
                    </div>
                    <h4 className="font-bold text-gray-900 mb-2 pr-12">{task.title}</h4>
                    <p className="text-sm text-gray-500 line-clamp-2 mb-4">{task.description}</p>
                    <div className="flex items-center justify-between pt-4 border-t border-gray-50">
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
                          className="flex items-center gap-1 text-indigo-600 hover:text-indigo-800 font-medium cursor-pointer"
                        >
                          <Plus size={12} /> Log Time
                        </button>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className={`px-3 py-1 rounded-full text-xs font-medium ${task.status === 'done' ? 'bg-emerald-50 text-emerald-600' :
                          task.status === 'in_progress' ? 'bg-blue-50 text-blue-600' :
                            'bg-gray-50 text-gray-600'
                          }`}>
                          {task.status.replace('_', ' ')}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
                {tasks.length === 0 && (
                  <div className="col-span-full py-20 text-center">
                    <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-300 mx-auto mb-4">
                      <CheckCircle2 size={32} />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 mb-1">No tasks yet</h3>
                    <p className="text-gray-500 mb-6">Start by creating your first task manually or via AI.</p>
                    <button
                      onClick={() => handleOpenModal()}
                      className="bg-indigo-600 text-white px-6 py-2 rounded-xl font-bold hover:bg-indigo-700 transition-all"
                    >
                      Create Task
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'reports' && (
            <div className="max-w-4xl mx-auto space-y-8">
              <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-10">
                  <TrendingUp size={120} />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Performance Intelligence</h3>
                <p className="text-gray-500 mb-8">AI-generated insights based on your recent activity.</p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-6">
                    <div>
                      <h4 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">Total Productivity</h4>
                      <p className="text-4xl font-bold text-indigo-600 mb-6">{totalHours} Hours</p>

                      <h4 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">Skill Growth</h4>
                      <div className="space-y-4">
                        {[
                          { name: 'System Architecture', value: 85, color: 'bg-indigo-500' },
                          { name: 'Frontend Engineering', value: 70, color: 'bg-purple-500' },
                          { name: 'AI Integration', value: 92, color: 'bg-blue-500' }
                        ].map(skill => (
                          <div key={skill.name}>
                            <div className="flex justify-between text-sm mb-1">
                              <span className="font-medium">{skill.name}</span>
                              <span className="text-gray-400">{skill.value}%</span>
                            </div>
                            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                              <div className={`h-full ${skill.color}`} style={{ width: `${skill.value}%` }}></div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="bg-indigo-50 rounded-2xl p-6 border border-indigo-100">
                    <h4 className="text-indigo-900 font-bold mb-4 flex items-center gap-2">
                      <AlertCircle size={18} />
                      AI Recommendation
                    </h4>
                    <p className="text-indigo-700 text-sm leading-relaxed">
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
        </div>
      </main>

      {/* AI Agent Sidebar */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.aside
            initial={{ x: 400 }}
            animate={{ x: 0 }}
            exit={{ x: 400 }}
            className="fixed inset-y-0 right-0 lg:relative w-80 sm:w-96 bg-white border-l border-gray-200 flex flex-col shadow-2xl z-40"
          >
            <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-200">
                  <MessageSquare size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">Work Agent</h3>
                  <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Online</span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setIsSidebarOpen(false)}
                className="lg:hidden p-2 text-gray-400 hover:text-gray-600"
              >
                <Plus size={20} className="rotate-45" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] p-4 rounded-2xl text-sm ${msg.role === 'user'
                    ? 'bg-indigo-600 text-white rounded-tr-none shadow-lg shadow-indigo-100'
                    : 'bg-white border border-gray-100 text-gray-700 rounded-tl-none shadow-sm'
                    }`}>
                    {msg.content}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-white border border-gray-100 p-4 rounded-2xl rounded-tl-none shadow-sm flex items-center gap-2">
                    <Loader2 size={16} className="animate-spin text-indigo-600" />
                    <span className="text-xs text-gray-400 font-medium">Thinking...</span>
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            <div className="p-6 border-t border-gray-100">
              <form onSubmit={handleSendMessage} className="relative">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask me to create a task..."
                  className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-5 py-4 pr-14 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                />
                <button
                  type="submit"
                  disabled={isLoading || !input.trim()}
                  className="absolute right-2 top-2 bottom-2 w-10 bg-indigo-600 text-white rounded-xl flex items-center justify-center hover:bg-indigo-700 disabled:opacity-50 transition-all"
                >
                  <Send size={18} />
                </button>
              </form>
              <p className="text-[10px] text-gray-400 text-center mt-4 font-medium uppercase tracking-widest">
                Powered by Gemini 2.0 Flash
              </p>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-black/20 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white w-full max-w-lg rounded-3xl shadow-2xl relative z-10 overflow-hidden"
            >
              <div className="p-8">
                <h3 className="text-xl font-bold text-gray-900 mb-6">
                  {editingTask ? 'Edit Task' : 'Create New Task'}
                </h3>
                <form onSubmit={handleSaveTask} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5">Title</label>
                    <input
                      required
                      type="text"
                      value={formData.title}
                      onChange={e => setFormData(prev => ({ ...prev, title: e.target.value }))}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                      placeholder="Task title..."
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5">Description</label>
                    <textarea
                      value={formData.description}
                      onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all h-24 resize-none"
                      placeholder="What needs to be done?"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5">Project</label>
                      <select
                        value={formData.project_id}
                        onChange={e => setFormData(prev => ({ ...prev, project_id: parseInt(e.target.value) }))}
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                      >
                        {projects.map(p => (
                          <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5">Priority</label>
                      <select
                        value={formData.priority}
                        onChange={e => setFormData(prev => ({ ...prev, priority: e.target.value as any }))}
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                      >
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5">Est. Hours</label>
                      <input
                        type="number"
                        value={formData.estimated_hours || ''}
                        onChange={e => {
                          const val = e.target.value === '' ? 0 : parseFloat(e.target.value);
                          setFormData(prev => ({ ...prev, estimated_hours: isNaN(val) ? 0 : val }));
                        }}
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5">Status</label>
                      <select
                        value={formData.status}
                        onChange={e => setFormData(prev => ({ ...prev, status: e.target.value as any }))}
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                      >
                        <option value="todo">To Do</option>
                        <option value="in_progress">In Progress</option>
                        <option value="done">Done</option>
                      </select>
                    </div>
                  </div>
                  <div className="flex gap-3 pt-4">
                    <button
                      type="button"
                      onClick={() => setIsModalOpen(false)}
                      className="flex-1 bg-gray-100 text-gray-600 py-3 rounded-xl font-bold hover:bg-gray-200 transition-all"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="flex-1 bg-indigo-600 text-white py-3 rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
                    >
                      {editingTask ? 'Save Changes' : 'Create Task'}
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
              className="bg-white w-full max-w-lg rounded-3xl shadow-2xl relative z-10 overflow-hidden"
            >
              <div className="p-8">
                <h3 className="text-xl font-bold text-gray-900 mb-6">
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
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                      placeholder="e.g. Marketing Q3"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5">Description</label>
                    <textarea
                      value={projectFormData.description}
                      onChange={e => setProjectFormData(prev => ({ ...prev, description: e.target.value }))}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all h-24 resize-none"
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
                        <div key={p.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100">
                          <div>
                            <p className="text-sm font-bold text-gray-900">{p.name}</p>
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
              className="bg-white w-full max-w-sm rounded-3xl shadow-2xl relative z-10 overflow-hidden"
            >
              <div className="p-8">
                <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                  <Clock size={20} className="text-indigo-600" /> Log Time
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
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5">Date</label>
                    <input
                      required
                      type="date"
                      value={timeLogFormData.date}
                      onChange={e => setTimeLogFormData(prev => ({ ...prev, date: e.target.value }))}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
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
    </div>
  );
}
