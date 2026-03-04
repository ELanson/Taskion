import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ChevronRight, X, User, Camera, Link, KeyRound, ShieldCheck,
    Eye, EyeOff, Bell, Globe, Lock, LogOut, Check, Upload,
    AlertTriangle, Smartphone, Monitor
} from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { supabase } from '../lib/supabase';

// ─── Types ───────────────────────────────────────────────────
type SubPanel = 'profile' | 'security' | 'privacy' | null;

// ─── Helpers ─────────────────────────────────────────────────
const inputCls = (dk: boolean) =>
    `w-full px-4 py-2.5 rounded-xl border text-sm outline-none transition-all focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 ${dk ? 'bg-[#0d0d0f] border-gray-700 text-white placeholder-gray-500' : 'bg-gray-50 border-gray-200 text-gray-900'
    }`;

const labelCls = 'block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5';

// ─── Sub Panels ──────────────────────────────────────────────

const EditProfilePanel: React.FC<{ onBack: () => void }> = ({ onBack }) => {
    const { isDarkMode, userProfile, setUserProfile } = useAppStore();
    const dk = isDarkMode;
    const [urlInput, setUrlInput] = useState(userProfile.avatar_url || '');
    const [photoTab, setPhotoTab] = useState<'url' | 'upload'>('url');
    const [name, setName] = useState(userProfile.name);
    const [role, setRole] = useState('Productivity Pro');
    const [saved, setSaved] = useState(false);
    const fileRef = useRef<HTMLInputElement>(null);

    const handleFilePick = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setUrlInput(URL.createObjectURL(file));
    };

    const handleSave = () => {
        setUserProfile({ name, avatar_url: urlInput });
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
    };

    return (
        <div className="space-y-5">
            <button onClick={onBack} className="flex items-center gap-1 text-xs text-gray-500 hover:text-indigo-400 transition-colors">
                <ChevronRight size={12} className="rotate-180" /> Back
            </button>

            {/* Avatar */}
            <div className="text-center">
                <div className="relative inline-block">
                    <div className="w-20 h-20 rounded-2xl overflow-hidden mx-auto ring-4 ring-indigo-500/20">
                        <img src={urlInput || `https://picsum.photos/seed/${name}/80/80`} alt="avatar" className="w-full h-full object-cover" />
                    </div>
                    <button onClick={() => fileRef.current?.click()}
                        className="absolute -bottom-2 -right-2 w-7 h-7 rounded-xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-600/30 hover:bg-indigo-700 transition-colors">
                        <Camera size={12} className="text-white" />
                    </button>
                    <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFilePick} />
                </div>
            </div>

            {/* Photo source tabs */}
            <div className={`flex rounded-xl overflow-hidden border p-0.5 gap-0.5 ${dk ? 'border-gray-800' : 'border-gray-200'}`}>
                {(['url', 'upload'] as const).map(t => (
                    <button key={t} onClick={() => setPhotoTab(t)}
                        className={`flex-1 py-1.5 text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 transition-all ${photoTab === t ? 'bg-indigo-600 text-white shadow' : dk ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-900'}`}>
                        {t === 'url' ? <><Link size={11} /> URL</> : <><Upload size={11} /> Upload</>}
                    </button>
                ))}
            </div>

            {photoTab === 'url' ? (
                <div>
                    <label className={labelCls}>Photo URL</label>
                    <input value={urlInput} onChange={e => setUrlInput(e.target.value)}
                        placeholder="https://example.com/photo.jpg" className={inputCls(dk)} />
                </div>
            ) : (
                <button onClick={() => fileRef.current?.click()}
                    className={`w-full py-5 rounded-xl border-2 border-dashed flex flex-col items-center gap-1.5 transition-colors text-sm ${dk ? 'border-gray-700 hover:border-indigo-500 text-gray-500 hover:text-indigo-400' : 'border-gray-200 hover:border-indigo-400 text-gray-400 hover:text-indigo-600'}`}>
                    <Upload size={18} />
                    <span className="text-xs font-medium">Click to choose image</span>
                    <span className="text-[10px] text-gray-500">PNG, JPG, WEBP</span>
                </button>
            )}

            {/* Divider */}
            <div className={`border-t ${dk ? 'border-gray-800' : 'border-gray-100'}`} />

            {/* Name & Role */}
            <div>
                <label className={labelCls}>Display Name</label>
                <input value={name} onChange={e => setName(e.target.value)} placeholder="Your name"
                    className={inputCls(dk)} maxLength={50} />
                <p className="text-[10px] text-gray-500 mt-1">{name.length}/50</p>
            </div>
            <div>
                <label className={labelCls}>Title / Role</label>
                <input value={role} onChange={e => setRole(e.target.value)} placeholder="e.g. Product Manager"
                    className={inputCls(dk)} />
            </div>

            {/* Preview */}
            <div className={`p-3 rounded-xl border flex items-center gap-3 ${dk ? 'border-gray-800 bg-gray-900/50' : 'border-gray-100 bg-gray-50'}`}>
                <div className="w-8 h-8 rounded-lg overflow-hidden shrink-0">
                    <img src={urlInput || `https://picsum.photos/seed/${name}/32/32`} alt="" className="w-full h-full object-cover" />
                </div>
                <div>
                    <p className={`text-sm font-bold ${dk ? 'text-white' : 'text-gray-900'}`}>{name || 'Your Name'}</p>
                    <p className="text-[10px] text-gray-500">{role}</p>
                </div>
            </div>

            <button onClick={handleSave} disabled={!name.trim()}
                className={`w-full py-2.5 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 ${saved ? 'bg-emerald-600 text-white' : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-600/20 disabled:opacity-50'}`}>
                {saved ? <><Check size={14} /> Saved!</> : 'Save Profile'}
            </button>
        </div>
    );
};

const SecurityPanel: React.FC<{ onBack: () => void }> = ({ onBack }) => {
    const { isDarkMode } = useAppStore();
    const dk = isDarkMode;
    const [currentPw, setCurrentPw] = useState('');
    const [newPw, setNewPw] = useState('');
    const [confirmPw, setConfirmPw] = useState('');
    const [show, setShow] = useState({ current: false, new: false, confirm: false });
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [errorMsg, setErrorMsg] = useState('');
    const [twoFA, setTwoFA] = useState(false);
    const [sessions] = useState([
        { device: 'Chrome on Windows', location: 'Nairobi, KE', time: 'Now', current: true, icon: <Monitor size={14} /> },
        { device: 'Safari on iPhone', location: 'Nairobi, KE', time: '2h ago', current: false, icon: <Smartphone size={14} /> },
    ]);

    const strength = () => {
        if (newPw.length === 0) return 0;
        let s = 0;
        if (newPw.length >= 8) s++;
        if (/[A-Z]/.test(newPw)) s++;
        if (/[0-9]/.test(newPw)) s++;
        if (/[^A-Za-z0-9]/.test(newPw)) s++;
        return s;
    };
    const strengthLabel = ['', 'Weak', 'Fair', 'Good', 'Strong'];
    const strengthColor = ['', 'bg-rose-500', 'bg-amber-500', 'bg-indigo-500', 'bg-emerald-500'];
    const s = strength();

    const handleChangePassword = async () => {
        if (newPw !== confirmPw) { setErrorMsg('Passwords do not match'); setStatus('error'); return; }
        if (newPw.length < 8) { setErrorMsg('Password must be at least 8 characters'); setStatus('error'); return; }
        setStatus('loading');
        try {
            const { error } = await supabase.auth.updateUser({ password: newPw });
            if (error) { setErrorMsg(error.message); setStatus('error'); }
            else { setStatus('success'); setCurrentPw(''); setNewPw(''); setConfirmPw(''); }
        } catch { setStatus('error'); setErrorMsg('Failed to update password'); }
        setTimeout(() => setStatus('idle'), 3000);
    };

    const handleResetLink = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (user?.email) {
            await supabase.auth.resetPasswordForEmail(user.email);
            alert(`Password reset link sent to ${user.email}`);
        }
    };

    return (
        <div className="space-y-5">
            <button onClick={onBack} className="flex items-center gap-1 text-xs text-gray-500 hover:text-indigo-400 transition-colors">
                <ChevronRight size={12} className="rotate-180" /> Back
            </button>
            <div>
                <h4 className={`text-base font-black mb-1 ${dk ? 'text-white' : 'text-gray-900'}`}>Account Security</h4>
                <p className="text-xs text-gray-500">Manage password and two-factor authentication.</p>
            </div>

            {/* Change password */}
            <div className={`p-4 rounded-2xl border space-y-3 ${dk ? 'border-gray-800 bg-gray-900/50' : 'border-gray-100 bg-gray-50'}`}>
                <p className={`text-xs font-bold ${dk ? 'text-gray-300' : 'text-gray-700'}`}>Change Password</p>
                {(['current', 'new', 'confirm'] as const).map(f => (
                    <div key={f} className="relative">
                        <input
                            type={show[f] ? 'text' : 'password'}
                            value={f === 'current' ? currentPw : f === 'new' ? newPw : confirmPw}
                            onChange={e => f === 'current' ? setCurrentPw(e.target.value) : f === 'new' ? setNewPw(e.target.value) : setConfirmPw(e.target.value)}
                            placeholder={f === 'current' ? 'Current password' : f === 'new' ? 'New password' : 'Confirm new password'}
                            className={inputCls(dk) + ' pr-10'}
                        />
                        <button onClick={() => setShow(p => ({ ...p, [f]: !p[f] }))} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">
                            {show[f] ? <EyeOff size={14} /> : <Eye size={14} />}
                        </button>
                    </div>
                ))}
                {newPw && (
                    <div className="space-y-1">
                        <div className="flex gap-1">
                            {[1, 2, 3, 4].map(i => <div key={i} className={`h-1 flex-1 rounded-full transition-all ${i <= s ? strengthColor[s] : dk ? 'bg-gray-800' : 'bg-gray-200'}`} />)}
                        </div>
                        <p className={`text-[10px] font-medium ${s <= 1 ? 'text-rose-400' : s === 2 ? 'text-amber-400' : s === 3 ? 'text-indigo-400' : 'text-emerald-400'}`}>{strengthLabel[s]}</p>
                    </div>
                )}
                {status === 'error' && <p className="text-xs text-rose-400 flex items-center gap-1"><AlertTriangle size={11} /> {errorMsg}</p>}
                {status === 'success' && <p className="text-xs text-emerald-400 flex items-center gap-1"><Check size={11} /> Password updated!</p>}
                <div className="flex gap-2">
                    <button onClick={handleChangePassword} disabled={!newPw || !confirmPw || status === 'loading'}
                        className="flex-1 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold disabled:opacity-50 hover:bg-indigo-700 transition-colors">
                        {status === 'loading' ? 'Updating…' : 'Update Password'}
                    </button>
                    <button onClick={handleResetLink} className={`px-3 py-2 rounded-xl text-xs font-bold border transition-colors ${dk ? 'border-gray-700 text-gray-400 hover:border-gray-600' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}>
                        Email Reset Link
                    </button>
                </div>
            </div>

            {/* 2FA */}
            <div className={`p-4 rounded-2xl border ${dk ? 'border-gray-800 bg-gray-900/50' : 'border-gray-100 bg-gray-50'}`}>
                <div className="flex items-center justify-between">
                    <div>
                        <p className={`text-xs font-bold ${dk ? 'text-gray-300' : 'text-gray-700'}`}>Two-Factor Auth</p>
                        <p className="text-[10px] text-gray-500">Add a second layer of security</p>
                    </div>
                    <button onClick={() => setTwoFA(!twoFA)} className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${twoFA ? 'bg-emerald-600' : dk ? 'bg-gray-700' : 'bg-gray-200'}`}>
                        <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${twoFA ? 'translate-x-4' : 'translate-x-0.5'}`} />
                    </button>
                </div>
                {twoFA && <p className="text-[10px] text-emerald-400 mt-2 flex items-center gap-1"><Check size={10} /> 2FA enabled — authenticator app required on next login</p>}
            </div>

            {/* Active sessions */}
            <div className={`p-4 rounded-2xl border ${dk ? 'border-gray-800 bg-gray-900/50' : 'border-gray-100 bg-gray-50'}`}>
                <p className={`text-xs font-bold mb-3 ${dk ? 'text-gray-300' : 'text-gray-700'}`}>Active Sessions</p>
                <div className="space-y-2">
                    {sessions.map((sess, i) => (
                        <div key={i} className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${dk ? 'bg-gray-800' : 'bg-gray-100'} text-gray-500`}>{sess.icon}</div>
                                <div>
                                    <p className={`text-xs font-medium ${dk ? 'text-gray-200' : 'text-gray-800'}`}>{sess.device}</p>
                                    <p className="text-[10px] text-gray-500">{sess.location} · {sess.time}</p>
                                </div>
                            </div>
                            {sess.current ? <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 font-bold">Current</span>
                                : <button className="text-[10px] text-rose-400 hover:text-rose-300 font-bold">Revoke</button>}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

const PrivacyPanel: React.FC<{ onBack: () => void }> = ({ onBack }) => {
    const { isDarkMode } = useAppStore();
    const dk = isDarkMode;
    const [prefs, setPrefs] = useState({
        showOnlineStatus: true,
        activityFeed: true,
        profileVisible: true,
        taskVisibility: false,
        analyticsShare: true,
        emailNotifs: true,
        mentionNotifs: true,
        weeklyDigest: false,
    });

    const toggle = (key: keyof typeof prefs) => setPrefs(p => ({ ...p, [key]: !p[key] }));

    const Row = ({ label, sub, pref, icon }: { label: string; sub: string; pref: keyof typeof prefs; icon: React.ReactNode }) => (
        <div className="flex items-center justify-between py-3">
            <div className="flex items-center gap-3">
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${dk ? 'bg-gray-800 text-gray-400' : 'bg-gray-100 text-gray-500'}`}>{icon}</div>
                <div>
                    <p className={`text-xs font-bold ${dk ? 'text-gray-200' : 'text-gray-800'}`}>{label}</p>
                    <p className="text-[10px] text-gray-500">{sub}</p>
                </div>
            </div>
            <button onClick={() => toggle(pref)} className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors shrink-0 ${prefs[pref] ? 'bg-indigo-600' : dk ? 'bg-gray-700' : 'bg-gray-200'}`}>
                <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${prefs[pref] ? 'translate-x-4' : 'translate-x-0.5'}`} />
            </button>
        </div>
    );

    return (
        <div className="space-y-4">
            <button onClick={onBack} className="flex items-center gap-1 text-xs text-gray-500 hover:text-indigo-400 transition-colors">
                <ChevronRight size={12} className="rotate-180" /> Back
            </button>
            <div>
                <h4 className={`text-base font-black mb-1 ${dk ? 'text-white' : 'text-gray-900'}`}>Privacy Settings</h4>
                <p className="text-xs text-gray-500">Control who sees your activity and data.</p>
            </div>

            {/* Visibility */}
            <div className={`rounded-2xl border ${dk ? 'border-gray-800' : 'border-gray-100'} divide-y ${dk ? 'divide-gray-800' : 'divide-gray-100'} px-4`}>
                <p className={`text-[10px] font-bold uppercase tracking-widest text-gray-500 py-2.5`}>Visibility</p>
                <Row label="Online Status" sub="Show when you're active" pref="showOnlineStatus" icon={<Globe size={13} />} />
                <Row label="Profile Visible" sub="Others can see your profile" pref="profileVisible" icon={<User size={13} />} />
                <Row label="Activity Feed" sub="Show your activity in team feed" pref="activityFeed" icon={<Eye size={13} />} />
                <Row label="Private Tasks" sub="Hide personal tasks from team" pref="taskVisibility" icon={<Lock size={13} />} />
            </div>

            {/* Notifications */}
            <div className={`rounded-2xl border ${dk ? 'border-gray-800' : 'border-gray-100'} divide-y ${dk ? 'divide-gray-800' : 'divide-gray-100'} px-4`}>
                <p className={`text-[10px] font-bold uppercase tracking-widest text-gray-500 py-2.5`}>Notifications</p>
                <Row label="Email Notifications" sub="Receive email updates" pref="emailNotifs" icon={<Bell size={13} />} />
                <Row label="@Mention Alerts" sub="Notify when mentioned" pref="mentionNotifs" icon={<Bell size={13} />} />
                <Row label="Weekly Digest" sub="Summary email every Monday" pref="weeklyDigest" icon={<Bell size={13} />} />
            </div>

            {/* Data */}
            <div className={`rounded-2xl border ${dk ? 'border-gray-800' : 'border-gray-100'} divide-y ${dk ? 'divide-gray-800' : 'divide-gray-100'} px-4`}>
                <p className={`text-[10px] font-bold uppercase tracking-widest text-gray-500 py-2.5`}>Data & Analytics</p>
                <Row label="Share Analytics" sub="Help improve TICKEL AI" pref="analyticsShare" icon={<ShieldCheck size={13} />} />
            </div>
        </div>
    );
};

// ─── Main Component ───────────────────────────────────────────

export const UserProfileMenu: React.FC = () => {
    const { isDarkMode, userProfile, isAdmin, user } = useAppStore();
    const dk = isDarkMode;
    const [isOpen, setIsOpen] = useState(false);
    const [showPanel, setShowPanel] = useState(false);
    const [activePanel, setActivePanel] = useState<SubPanel>(null);
    const ref = useRef<HTMLDivElement>(null);

    // Close on outside click
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) {
                setIsOpen(false);
                setShowPanel(false);
                setActivePanel(null);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const openPanel = (p: SubPanel) => { setActivePanel(p); setShowPanel(true); };
    const backToMenu = () => { setActivePanel(null); setShowPanel(false); };

    const handleSignOut = async () => {
        await supabase.auth.signOut();
        setIsOpen(false);
    };

    const menuItems = [
        { icon: <User size={15} />, label: 'Edit Profile', sub: 'Photo, name & display title', panel: 'profile' as SubPanel },
        { icon: <KeyRound size={15} />, label: 'Account Security', sub: 'Password & 2-factor auth', panel: 'security' as SubPanel },
        { icon: <ShieldCheck size={15} />, label: 'Privacy Settings', sub: 'Visibility & notifications', panel: 'privacy' as SubPanel },
    ];

    return (
        <div className="relative" ref={ref}>
            {/* Trigger */}
            <button
                onClick={() => { setIsOpen(o => !o); setShowPanel(false); setActivePanel(null); }}
                className={`flex items-center gap-3 pr-4 border-r transition-all ${isDarkMode ? 'border-gray-800 hover:opacity-80' : 'border-gray-100 hover:opacity-80'}`}
            >
                <div className="text-right hidden sm:block">
                    <div className="flex items-center justify-end gap-2">
                        {isAdmin && (
                            <span className="px-1.5 py-0.5 rounded-md bg-indigo-500/10 border border-indigo-500/20 text-[10px] font-bold text-indigo-500 uppercase tracking-tighter">
                                Admin
                            </span>
                        )}
                        <p className={`text-sm font-bold ${dk ? 'text-white' : 'text-gray-900'}`}>{userProfile.name}</p>
                    </div>
                    <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">Productivity Pro</p>
                </div>
                <div className={`w-10 h-10 rounded-xl border-2 ${dk ? 'border-indigo-500/30' : 'border-white'} bg-gray-200 overflow-hidden shadow-sm`}>
                    <img src={userProfile.avatar_url || `https://picsum.photos/seed/${userProfile.name}/40/40`} alt="user" referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                </div>
            </button>

            {/* Dropdown */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: -8 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: -8 }}
                        transition={{ duration: 0.15 }}
                        className={`absolute right-0 top-14 w-80 rounded-3xl border shadow-2xl overflow-hidden z-50 ${dk ? 'bg-[#121214] border-gray-800 shadow-black/60' : 'bg-white border-gray-100 shadow-gray-200/60'}`}
                    >
                        <AnimatePresence mode="wait">
                            {!showPanel ? (
                                <motion.div key="menu" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} transition={{ duration: 0.12 }}>
                                    {/* Header */}
                                    <div className={`p-5 border-b ${dk ? 'border-gray-800 bg-gradient-to-br from-indigo-900/20 to-transparent' : 'border-gray-100 bg-gradient-to-br from-indigo-50 to-transparent'}`}>
                                        <div className="flex items-center gap-3">
                                            <div className="w-12 h-12 rounded-2xl overflow-hidden ring-2 ring-indigo-500/20 shrink-0">
                                                <img src={userProfile.avatar_url || `https://picsum.photos/seed/${userProfile.name}/48/48`} alt="" className="w-full h-full object-cover" />
                                            </div>
                                            <div className="min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <p className={`font-black text-sm truncate ${dk ? 'text-white' : 'text-gray-900'}`}>{userProfile.name}</p>
                                                    {isAdmin && <span className="shrink-0 px-1.5 py-0.5 rounded-md bg-indigo-500/10 border border-indigo-500/20 text-[9px] font-bold text-indigo-400 uppercase">Admin</span>}
                                                </div>
                                                <p className="text-[11px] text-gray-500 truncate">{user?.email || 'No email'}</p>
                                            </div>
                                            <button onClick={() => setIsOpen(false)} className={`ml-auto p-1.5 rounded-lg ${dk ? 'hover:bg-gray-800' : 'hover:bg-gray-100'} text-gray-400 shrink-0`}><X size={14} /></button>
                                        </div>
                                    </div>

                                    {/* Edit Profile section */}
                                    <div className="p-3">
                                        <p className={`text-[10px] font-bold uppercase tracking-widest px-2 mb-2 ${dk ? 'text-gray-600' : 'text-gray-400'}`}>Edit Profile</p>
                                        <div className="space-y-0.5">
                                            {menuItems.map(item => (
                                                <button key={item.panel} onClick={() => openPanel(item.panel)}
                                                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all group text-left ${dk ? 'hover:bg-gray-800/80' : 'hover:bg-gray-50'}`}>
                                                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-colors ${dk ? 'bg-gray-800 text-gray-400 group-hover:bg-indigo-500/10 group-hover:text-indigo-400' : 'bg-gray-100 text-gray-500 group-hover:bg-indigo-50 group-hover:text-indigo-600'}`}>
                                                        {item.icon}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className={`text-sm font-bold ${dk ? 'text-gray-200' : 'text-gray-800'}`}>{item.label}</p>
                                                        <p className="text-[10px] text-gray-500 truncate">{item.sub}</p>
                                                    </div>
                                                    <ChevronRight size={14} className="text-gray-500 shrink-0 group-hover:text-indigo-400 transition-colors" />
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Sign out */}
                                    <div className={`p-3 border-t ${dk ? 'border-gray-800' : 'border-gray-100'}`}>
                                        <button onClick={handleSignOut}
                                            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-rose-500 hover:text-rose-400 ${dk ? 'hover:bg-rose-500/10' : 'hover:bg-rose-50'}`}>
                                            <LogOut size={15} />
                                            <span className="text-sm font-bold">Sign Out</span>
                                        </button>
                                    </div>
                                </motion.div>
                            ) : (
                                <motion.div key="panel" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} transition={{ duration: 0.12 }}
                                    className="p-5 max-h-[80vh] overflow-y-auto">
                                    {activePanel === 'profile' && <EditProfilePanel onBack={backToMenu} />}
                                    {activePanel === 'security' && <SecurityPanel onBack={backToMenu} />}
                                    {activePanel === 'privacy' && <PrivacyPanel onBack={backToMenu} />}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
