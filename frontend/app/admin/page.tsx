"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { fetchApi } from '@/lib/api';
import Logo from '@/components/Logo';
import AnimatedIcon from '@/components/AnimatedIcon';

export default function AdminDashboard() {
  const router = useRouter();
  const [stats, setStats] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingUsers, setLoadingUsers] = useState(true);

  useEffect(() => {
    // Auth Guard
    fetchApi('/user/profile').then(profile => {
      if (profile.role !== 'ADMIN') {
        router.replace('/dashboard');
        return;
      }
      
      // Load stats
      fetchApi('/admin/stats').then(setStats).catch(console.error).finally(() => setLoading(false));
      fetchApi('/admin/users').then(setUsers).catch(console.error).finally(() => setLoadingUsers(false));
    }).catch(() => {
      router.replace('/');
    });
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    router.replace('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-telemetry-grid flex items-center justify-center font-manrope">
        <div className="w-10 h-10 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-telemetry-grid text-white font-manrope selection:bg-white/20 relative w-full overflow-x-hidden">
      
      {/* Top Navbar */}
      <nav className="fixed top-0 w-full z-50 bg-black border-b border-white/5 flex justify-between items-center px-6 md:px-10 h-20 shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
        <div className="flex items-center gap-3">
          <Logo className="w-10 h-10" />
          <div>
            <h1 className="font-bold text-lg text-white">Intervue Admin</h1>
            <p className="text-[10px] text-zinc-500 uppercase tracking-[0.2em]">Oversight Console</p>
          </div>
        </div>

        <button onClick={handleLogout} className="text-zinc-500 hover:text-white transition-colors flex items-center gap-2 text-xs font-bold uppercase tracking-widest bg-white/5 px-4 py-2 rounded-lg border border-white/5 hover:bg-white/10">
          Sign out <AnimatedIcon name="logout" className="text-sm" />
        </button>
      </nav>

      {/* Main Container */}
      <main className="pt-32 px-6 md:px-10 pb-20 max-w-7xl mx-auto w-full relative z-10">
        
        {/* KPI Cards */}
        <section className="mb-16">
          <h2 className="text-[10px] uppercase tracking-[0.3em] font-bold text-zinc-500 mb-6">Platform Telemetry</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
            
            <div className="bg-black border border-white/5 rounded-2xl p-6 flex flex-col items-center justify-center text-center shadow-lg hover:bg-white/5 transition-colors relative overflow-hidden group">
              <AnimatedIcon name="group" className="absolute -bottom-4 -right-4 text-7xl text-white/[0.02] group-hover:text-blue-500/[0.05] transition-colors pointer-events-none" />
              <p className="text-xs text-zinc-500 uppercase tracking-widest font-bold mb-2">Total Users</p>
              <p className="text-4xl font-black">{stats?.totalUsers || 0}</p>
            </div>

            <div className="bg-black border border-white/5 rounded-2xl p-6 flex flex-col items-center justify-center text-center shadow-lg hover:bg-white/5 transition-colors relative overflow-hidden group">
              <AnimatedIcon name="work" className="absolute -bottom-4 -right-4 text-7xl text-white/[0.02] group-hover:text-purple-500/[0.05] transition-colors pointer-events-none" />
              <p className="text-xs text-zinc-500 uppercase tracking-widest font-bold mb-2">Job Roles</p>
              <p className="text-4xl font-black">{stats?.totalJobRoles || 0}</p>
            </div>

            <div className="bg-black border border-white/5 rounded-2xl p-6 flex flex-col items-center justify-center text-center shadow-lg hover:bg-white/5 transition-colors relative overflow-hidden group">
              <AnimatedIcon name="play_arrow" className="absolute -bottom-4 -right-4 text-7xl text-white/[0.02] group-hover:text-green-500/[0.05] transition-colors pointer-events-none" />
              <p className="text-xs text-zinc-500 uppercase tracking-widest font-bold mb-2">Sessions Active</p>
              <p className="text-4xl font-black">{stats?.totalSessions || 0}</p>
            </div>

            <div className="bg-black border border-white/5 rounded-2xl p-6 flex flex-col items-center justify-center text-center shadow-lg hover:bg-white/5 transition-colors relative overflow-hidden group">
              <AnimatedIcon name="task_alt" className="absolute -bottom-4 -right-4 text-7xl text-white/[0.02] group-hover:text-amber-500/[0.05] transition-colors pointer-events-none" />
              <p className="text-xs text-zinc-500 uppercase tracking-widest font-bold mb-2">Completed</p>
              <p className="text-4xl font-black">{stats?.completedSessions || 0}</p>
            </div>

            <div className="bg-black border border-white/5 rounded-2xl p-6 flex flex-col items-center justify-center text-center shadow-lg hover:bg-white/5 transition-colors relative overflow-hidden group">
              <AnimatedIcon name="sports_score" className="absolute -bottom-4 -right-4 text-7xl text-white/[0.02] group-hover:text-red-500/[0.05] transition-colors pointer-events-none" />
              <p className="text-xs text-zinc-500 uppercase tracking-widest font-bold mb-2">Avg Score</p>
              <p className="text-4xl font-black text-white">{stats?.platformAverageScore || 0}</p>
            </div>

          </div>
        </section>

        {/* User Table */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-[10px] uppercase tracking-[0.3em] font-bold text-zinc-500">Registered Directory</h2>
            <span className="text-xs font-bold bg-white/5 px-3 py-1 rounded-full">{users.length} Users</span>
          </div>

          <div className="bg-black border border-white/5 rounded-2xl overflow-hidden shadow-2xl">
            {loadingUsers ? (
              <div className="p-10 flex justify-center"><div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin"></div></div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-white/[0.02] border-b border-white/5">
                      <th className="p-5 text-xs font-bold uppercase tracking-widest text-zinc-500">User</th>
                      <th className="p-5 text-xs font-bold uppercase tracking-widest text-zinc-500">Email Address</th>
                      <th className="p-5 text-xs font-bold uppercase tracking-widest text-zinc-500">Type</th>
                      <th className="p-5 text-xs font-bold uppercase tracking-widest text-zinc-500">Joined</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map(u => (
                      <tr key={u.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors group">
                        <td className="p-5">
                          <div className="flex items-center gap-4">
                            {u.profilePictureUrl ? (
                              <img src={`${(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api').replace(/\/api$/, '')}${u.profilePictureUrl}`} alt={u.name} className="w-10 h-10 rounded-full object-cover border border-white/10" />
                            ) : (
                              <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center border border-white/5">
                                <AnimatedIcon name="person" className="text-sm text-zinc-500" />
                              </div>
                            )}
                            <span className="font-bold text-sm tracking-wide">{u.name}</span>
                          </div>
                        </td>
                        <td className="p-5 text-sm text-zinc-400 tracking-wide">{u.email}</td>
                        <td className="p-5">
                          <span className={`text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest border ${u.role === 'ADMIN' ? 'bg-red-500/10 text-red-500 border-red-500/20' : 'bg-blue-500/10 text-blue-500 border-blue-500/20'}`}>
                            {u.role}
                          </span>
                        </td>
                        <td className="p-5 text-sm text-zinc-500">
                           {new Date(u.createdAt).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                    {users.length === 0 && (
                      <tr>
                        <td colSpan={4} className="p-10 text-center text-zinc-500 text-sm">No registered users found.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>

      </main>
    </div>
  );
}
