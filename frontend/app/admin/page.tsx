"use client";

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { fetchApi } from '@/lib/api';
import AnimatedIcon from '@/components/AnimatedIcon';
import { toast, Toaster } from 'sonner';

type Tab = 'overview' | 'users' | 'sessions';

interface UserRecord {
  id: number;
  name: string;
  email: string;
  role: string;
  profilePictureUrl?: string;
  createdAt: string;
  emailVerified?: boolean;
  xp?: number;
  banned?: boolean;
  ipAddress?: string;
}

interface SessionRecord {
  id: number;
  userName: string;
  userEmail: string;
  jobRole: string;
  difficulty: string;
  interviewType: string;
  status: string;
  score?: number;
  createdAt: string;
}

interface Stats {
  totalUsers: number;
  totalSessions: number;
  completedSessions: number;
  totalJobRoles: number;
  platformAverageScore: number;
  totalSiteVisits: number;
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api';
const IMG_BASE = API_BASE.replace(/\/api$/, '');

function statusColor(status: string) {
  if (status === 'COMPLETED') return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
  if (status === 'IN_PROGRESS') return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
  return 'bg-red-500/10 text-red-400 border-red-500/20';
}

function difficultyColor(d: string) {
  if (d === 'HARD') return 'text-red-400';
  if (d === 'MEDIUM') return 'text-amber-400';
  if (d === 'EASY') return 'text-emerald-400';
  return 'text-[#B6A596]';
}

export default function AdminDashboard() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [stats, setStats] = useState<Stats | null>(null);
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [recentUsers, setRecentUsers] = useState<UserRecord[]>([]);
  const [sessions, setSessions] = useState<SessionRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sessionSearch, setSessionSearch] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<UserRecord | null>(null);
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  const loadData = useCallback(async () => {
    try {
      const results = await Promise.allSettled([
        fetchApi('/admin/stats'),
        fetchApi('/admin/users'),
        fetchApi('/admin/users/recent'),
        fetchApi('/admin/sessions'),
      ]);
      
      if (results[0].status === 'fulfilled') setStats(results[0].value);
      if (results[1].status === 'fulfilled') setUsers(results[1].value);
      if (results[2].status === 'fulfilled') setRecentUsers(results[2].value);
      if (results[3].status === 'fulfilled') setSessions(results[3].value);
      
      const failedCount = results.filter(r => r.status === 'rejected').length;
      if (failedCount > 0) {
        toast.warning(`Failed to load some data. Make sure backend is updated.`);
      }
    } catch {
      toast.error('Failed to connect to the server');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchApi('/user/profile').then(profile => {
      if (profile.role !== 'ADMIN') { router.replace('/dashboard'); return; }
      loadData();
    }).catch(() => router.replace('/'));
  }, [router, loadData]);

  const handleDelete = async (user: UserRecord) => {
    setActionLoading(user.id);
    try {
      await fetchApi(`/admin/users/${user.id}`, { method: 'DELETE' });
      toast.success(`${user.name} deleted`);
      setUsers(prev => prev.filter(u => u.id !== user.id));
      setDeleteTarget(null);
    } catch {
      toast.error('Failed to delete user');
    } finally {
      setActionLoading(null);
    }
  };

  const handleBan = async (user: UserRecord) => {
    setActionLoading(user.id);
    try {
      const res = await fetchApi(`/admin/users/${user.id}/ban`, { method: 'PATCH' });
      toast.success(res.message);
      setUsers(prev => prev.map(u => u.id === user.id ? { ...u, banned: res.banned } : u));
    } catch {
      toast.error('Failed to update ban status');
    } finally {
      setActionLoading(null);
    }
  };

  const filteredUsers = users.filter(u =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase()) ||
    (u.ipAddress && u.ipAddress.toLowerCase().includes(search.toLowerCase()))
  );

  const filteredSessions = sessions.filter(s =>
    s.userName.toLowerCase().includes(sessionSearch.toLowerCase()) ||
    s.jobRole.toLowerCase().includes(sessionSearch.toLowerCase()) ||
    s.status.toLowerCase().includes(sessionSearch.toLowerCase())
  );

  if (loading) return (
    <div className="min-h-screen bg-[#181818] flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-[#35211A] border-t-[#DC9F85] rounded-full animate-spin" />
    </div>
  );

  const tabs: { id: Tab; label: string; icon: string }[] = [
    { id: 'overview', label: 'Overview', icon: 'dashboard' },
    { id: 'users', label: `Users (${users.length})`, icon: 'group' },
    { id: 'sessions', label: `Sessions (${sessions.length})`, icon: 'play_arrow' },
  ];

  return (
    <div className="min-h-screen bg-[#181818] text-[#EBDCC4]" style={{ fontFamily: "'Inter', sans-serif" }}>
      <Toaster theme="dark" />

      {/* Delete Confirm Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-[#1A1512] border border-[#35211A] w-full max-w-sm p-8">
            <p className="text-[10px] uppercase tracking-[0.3em] text-[#DC9F85] mb-4">Confirm Delete</p>
            <p className="text-[#EBDCC4] font-bold text-lg mb-1">{deleteTarget.name}</p>
            <p className="text-[#B6A596] text-sm mb-6">{deleteTarget.email}</p>
            <p className="text-[#B6A596] text-xs mb-8">This action is permanent. All sessions, scores and data for this user will be deleted.</p>
            <div className="flex gap-3">
              <button
                onClick={() => handleDelete(deleteTarget)}
                disabled={actionLoading === deleteTarget.id}
                className="flex-1 bg-red-500/10 border border-red-500/30 text-red-400 py-3 text-xs font-bold uppercase tracking-widest hover:bg-red-500/20 transition-colors disabled:opacity-50"
              >
                {actionLoading === deleteTarget.id ? 'Deleting...' : 'Delete'}
              </button>
              <button
                onClick={() => setDeleteTarget(null)}
                className="flex-1 border border-[#35211A] text-[#B6A596] py-3 text-xs font-bold uppercase tracking-widest hover:bg-[#231E1A] transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-30 bg-[#181818] border-b border-[#35211A] flex items-center justify-between px-8 md:px-12 h-16">
        <div className="flex items-center gap-8">
          <h1 className="display-font font-black text-xl text-[#EBDCC4] tracking-widest uppercase">INTERVUE</h1>
          <span className="text-[10px] text-[#66473B] tracking-[0.3em] uppercase hidden md:block">// Admin Console</span>
        </div>
        <button
          onClick={() => { localStorage.removeItem('token'); router.replace('/'); }}
          className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-[#B6A596] hover:text-[#DC9F85] transition-colors"
        >
          <AnimatedIcon name="logout" className="text-sm" /> Sign Out
        </button>
      </header>

      {/* Tab Bar */}
      <div className="fixed top-16 left-0 right-0 z-20 bg-[#181818] border-b border-[#35211A] flex px-8 md:px-12">
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`flex items-center gap-2 py-4 px-1 mr-8 text-[10px] font-bold uppercase tracking-widest border-b-2 transition-colors ${
              activeTab === t.id
                ? 'border-[#DC9F85] text-[#DC9F85]'
                : 'border-transparent text-[#66473B] hover:text-[#B6A596]'
            }`}
          >
            <AnimatedIcon name={t.icon} className="text-sm" />
            {t.label}
          </button>
        ))}
      </div>

      {/* Main Content */}
      <main className="pt-36 px-8 md:px-12 pb-20 max-w-screen-xl mx-auto">

        {/* ── OVERVIEW TAB ── */}
        {activeTab === 'overview' && (
          <div className="space-y-12">
            {/* KPI Grid */}
            <section>
              <p className="text-[10px] uppercase tracking-[0.3em] text-[#66473B] mb-6">Platform Telemetry</p>
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
                {[
                  { label: 'Total Visits', value: stats?.totalSiteVisits ?? 0, icon: 'public' },
                  { label: 'Total Users', value: stats?.totalUsers ?? 0, icon: 'group' },
                  { label: 'Total Sessions', value: stats?.totalSessions ?? 0, icon: 'play_arrow' },
                  { label: 'Completed', value: stats?.completedSessions ?? 0, icon: 'task_alt' },
                  { label: 'Job Roles', value: stats?.totalJobRoles ?? 0, icon: 'work' },
                  { label: 'Avg Score', value: `${stats?.platformAverageScore ?? 0}%`, icon: 'sports_score' },
                ].map(card => (
                  <div key={card.label} className="bg-[#1A1512] border border-[#35211A] p-6 flex flex-col gap-3 hover:border-[#66473B] transition-colors">
                    <AnimatedIcon name={card.icon} className="text-[#66473B] text-xl" />
                    <p className="text-3xl font-black text-[#EBDCC4]">{card.value}</p>
                    <p className="text-[10px] uppercase tracking-widest text-[#66473B]">{card.label}</p>
                  </div>
                ))}
              </div>
            </section>

            {/* Recent Registrations */}
            <section>
              <p className="text-[10px] uppercase tracking-[0.3em] text-[#66473B] mb-6">Recent Registrations</p>
              <div className="bg-[#1A1512] border border-[#35211A]">
                {recentUsers.length === 0 ? (
                  <p className="p-8 text-center text-[#66473B] text-sm">No recent registrations.</p>
                ) : recentUsers.map((u, i) => (
                  <div key={u.id} className={`flex items-center justify-between px-6 py-4 ${i !== recentUsers.length - 1 ? 'border-b border-[#35211A]' : ''} hover:bg-[#231E1A] transition-colors`}>
                    <div className="flex items-center gap-4">
                      {u.profilePictureUrl ? (
                        <img src={`${IMG_BASE}${u.profilePictureUrl}`} alt={u.name} className="w-8 h-8 rounded-full object-cover border border-[#35211A]" />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-[#231E1A] border border-[#35211A] flex items-center justify-center text-[#DC9F85] text-xs font-bold">
                          {u.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div>
                        <p className="text-sm font-bold text-[#EBDCC4]">{u.name}</p>
                        <p className="text-[10px] text-[#B6A596]">{u.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      {u.ipAddress && (
                         <span className="text-[10px] text-[#B6A596] font-mono tracking-widest border border-[#35211A] px-2 py-1 bg-[#231E1A]">
                            IP: {u.ipAddress}
                         </span>
                      )}
                      <span className={`text-[9px] font-bold px-2 py-1 border uppercase tracking-widest ${u.role === 'ADMIN' ? 'bg-[#DC9F85]/10 text-[#DC9F85] border-[#DC9F85]/20' : 'bg-[#231E1A] text-[#B6A596] border-[#35211A]'}`}>
                        {u.role}
                      </span>
                      <span className="text-[10px] text-[#66473B]">
                        {new Date(u.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}

        {/* ── USERS TAB ── */}
        {activeTab === 'users' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <p className="text-[10px] uppercase tracking-[0.3em] text-[#66473B]">Registered Directory</p>
              <div className="relative">
                <AnimatedIcon name="search" className="absolute left-3 top-1/2 -translate-y-1/2 text-[#66473B] text-sm" />
                <input
                  type="text"
                  placeholder="Search users or IP..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="bg-[#1A1512] border border-[#35211A] text-[#EBDCC4] text-xs pl-8 pr-4 py-2.5 w-64 outline-none focus:border-[#66473B] placeholder:text-[#66473B] transition-colors"
                />
              </div>
            </div>

            <div className="bg-[#1A1512] border border-[#35211A] overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-[#35211A]">
                    {['User', 'Email', 'Role', 'IP Address', 'Joined', 'Actions'].map(h => (
                      <th key={h} className="px-5 py-4 text-[9px] font-bold uppercase tracking-widest text-[#66473B]">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map(u => (
                    <tr key={u.id} className={`border-b border-[#35211A] hover:bg-[#231E1A] transition-colors ${u.banned ? 'opacity-50' : ''}`}>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          {u.profilePictureUrl ? (
                            <img src={`${IMG_BASE}${u.profilePictureUrl}`} alt={u.name} className="w-8 h-8 rounded-full object-cover border border-[#35211A]" />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-[#231E1A] border border-[#35211A] flex items-center justify-center text-[#DC9F85] text-xs font-bold">
                              {u.name.charAt(0).toUpperCase()}
                            </div>
                          )}
                          <span className="text-sm font-semibold text-[#EBDCC4]">
                            {u.name} {u.banned && <span className="text-[9px] text-red-400 ml-1">[BANNED]</span>}
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-xs text-[#B6A596]">{u.email}</td>
                      <td className="px-5 py-4">
                        <span className={`text-[9px] font-bold px-2 py-1 border uppercase tracking-widest ${u.role === 'ADMIN' ? 'bg-[#DC9F85]/10 text-[#DC9F85] border-[#DC9F85]/20' : 'bg-[#231E1A] text-[#B6A596] border-[#35211A]'}`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-xs font-mono text-[#DC9F85] tracking-wider">{u.ipAddress || '—'}</td>
                      <td className="px-5 py-4 text-[10px] text-[#66473B]">
                        {new Date(u.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleBan(u)}
                            disabled={u.role === 'ADMIN' || actionLoading === u.id}
                            title={u.banned ? 'Unban user' : 'Ban user'}
                            className="text-[9px] font-bold uppercase tracking-widest px-3 py-1.5 border transition-colors disabled:opacity-30 disabled:cursor-not-allowed border-amber-500/30 text-amber-400 hover:bg-amber-500/10"
                          >
                            {actionLoading === u.id ? '...' : u.banned ? 'Unban' : 'Ban'}
                          </button>
                          <button
                            onClick={() => setDeleteTarget(u)}
                            disabled={u.role === 'ADMIN' || actionLoading === u.id}
                            title="Delete user"
                            className="text-[9px] font-bold uppercase tracking-widest px-3 py-1.5 border transition-colors disabled:opacity-30 disabled:cursor-not-allowed border-red-500/30 text-red-400 hover:bg-red-500/10"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredUsers.length === 0 && (
                    <tr><td colSpan={7} className="px-5 py-12 text-center text-[#66473B] text-sm">No users found.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── SESSIONS TAB ── */}
        {activeTab === 'sessions' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <p className="text-[10px] uppercase tracking-[0.3em] text-[#66473B]">All Sessions</p>
              <div className="relative">
                <AnimatedIcon name="search" className="absolute left-3 top-1/2 -translate-y-1/2 text-[#66473B] text-sm" />
                <input
                  type="text"
                  placeholder="Search sessions..."
                  value={sessionSearch}
                  onChange={e => setSessionSearch(e.target.value)}
                  className="bg-[#1A1512] border border-[#35211A] text-[#EBDCC4] text-xs pl-8 pr-4 py-2.5 w-64 outline-none focus:border-[#66473B] placeholder:text-[#66473B] transition-colors"
                />
              </div>
            </div>

            <div className="bg-[#1A1512] border border-[#35211A] overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-[#35211A]">
                    {['#', 'User', 'Role', 'Type', 'Difficulty', 'Status', 'Score', 'Date'].map(h => (
                      <th key={h} className="px-5 py-4 text-[9px] font-bold uppercase tracking-widest text-[#66473B]">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredSessions.map(s => (
                    <tr key={s.id} className="border-b border-[#35211A] hover:bg-[#231E1A] transition-colors">
                      <td className="px-5 py-4 text-[10px] text-[#66473B]">#{s.id}</td>
                      <td className="px-5 py-4">
                        <p className="text-sm font-semibold text-[#EBDCC4]">{s.userName}</p>
                        <p className="text-[10px] text-[#66473B]">{s.userEmail}</p>
                      </td>
                      <td className="px-5 py-4 text-xs text-[#B6A596]">{s.jobRole}</td>
                      <td className="px-5 py-4 text-[10px] text-[#B6A596] uppercase tracking-wider">{s.interviewType}</td>
                      <td className={`px-5 py-4 text-[10px] font-bold uppercase tracking-wider ${difficultyColor(s.difficulty)}`}>{s.difficulty}</td>
                      <td className="px-5 py-4">
                        <span className={`text-[9px] font-bold px-2 py-1 border uppercase tracking-widest ${statusColor(s.status)}`}>
                          {s.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-sm font-bold text-[#DC9F85]">
                        {s.score != null ? `${Math.round(s.score)}%` : '—'}
                      </td>
                      <td className="px-5 py-4 text-[10px] text-[#66473B]">
                        {new Date(s.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </td>
                    </tr>
                  ))}
                  {filteredSessions.length === 0 && (
                    <tr><td colSpan={8} className="px-5 py-12 text-center text-[#66473B] text-sm">No sessions found.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}
