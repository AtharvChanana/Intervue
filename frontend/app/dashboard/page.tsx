"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { fetchApi } from '@/lib/api';

interface DashboardStats {
  totalSessions: number;
  completedSessions: number;
  abandonedSessions: number;
  averageScore: number;
  distinctRolesPracticed: number;
}

interface SessionHistory {
  sessionId: number;
  jobRole: string;
  difficulty: string;
  interviewType: string;
  status: string;
  totalScore: number;
  createdAt: string;
  completedAt: string;
}

interface SessionReport {
  sessionId: number;
  technicalScore: number;
  communicationScore: number;
  problemSolvingScore: number;
  confidenceScore: number;
  relevanceScore: number;
  overallFeedback: string;
  improvementTips: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [history, setHistory] = useState<SessionHistory[]>([]);
  const [latestReport, setLatestReport] = useState<SessionReport | null>(null);
  const [activeResume, setActiveResume] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState(false);
  const [toast, setToast] = useState<{message: string, type: 'success' | 'error'} | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/');
      return;
    }

    const loadDashboard = async () => {
      try {
        const [statsData, historyData, resumeData] = await Promise.all([
          fetchApi('/dashboard/stats').catch(() => null),
          fetchApi('/dashboard/history').catch(() => []),
          fetchApi('/resume/latest').catch(() => null)
        ]);
        
        if (statsData) setStats(statsData);
        if (historyData) {
            setHistory(historyData);
            const latestCompleted = historyData.find((h: any) => h.status === 'COMPLETED');
            if (latestCompleted) {
                const reportData = await fetchApi('/dashboard/session/' + latestCompleted.sessionId).catch(() => null);
                if (reportData) setLatestReport(reportData);
            }
        }
        if (resumeData) setActiveResume(resumeData);
      } catch (e) {
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, [router]);

  if (loading) {
    return (
        <div className="flex flex-col items-center justify-center p-20 animate-in fade-in duration-1000">
            <div className="w-16 h-16 border-t-2 border-r-2 border-blue-500 rounded-full animate-spin mb-8"></div>
            <div className="text-blue-500 text-xs font-black uppercase tracking-[0.3em] overflow-hidden whitespace-nowrap border-r-4 border-blue-500 animate-[typing_1.5s_steps(40,end),blink-caret_.75s_step-end_infinite]">INITIALIZING NEURAL OVERVIEW...</div>
        </div>
    );
  }

  const handleRetry = (jobRole: string, difficulty: string, interviewType: string) => {
      router.push('/dashboard/session');
  };

  const MetricSlider = ({ label, score, color }: { label: string, score: number, color: string }) => (
      <div className="mb-6 group">
          <div className="flex justify-between items-end mb-2">
              <span className="text-white text-xs font-bold uppercase tracking-widest">{label}</span>
              <span className={`text-xl font-black ${color}`}>{score || 0}</span>
          </div>
          <div className="h-1.5 w-full bg-white/[0.02] rounded-full overflow-hidden border border-white/5 relative">
              <div 
                  className={`absolute top-0 left-0 h-full rounded-full transition-all duration-[2000ms] shadow-[0_0_15px_currentColor]`}
                  style={{ width: `${score || 0}%`, backgroundColor: 'currentColor', color: color.replace('text-', '') }}
              ></div>
          </div>
      </div>
  );

  return (
    <div className="animate-in fade-in duration-1000 pb-20">
      <div className="flex justify-between items-end mb-16">
        <div className="max-w-2xl">
          <h2 className="text-4xl lg:text-5xl font-black uppercase tracking-widest mb-4 text-transparent bg-clip-text bg-gradient-to-r from-white via-blue-100 to-white/20">Overview</h2>
          <p className="text-zinc-500 text-sm tracking-widest font-medium overflow-hidden whitespace-nowrap">YOUR RECENT PERFORMANCE METRICS</p>
          {error && <p className="text-red-400 mt-4 text-xs font-bold">WARNING: Offline Analytics Cache Served. Engine Connection Fault.</p>}
        </div>
      </div>

      {/* TOP MATRIX */}
      <div className="grid grid-cols-12 gap-6 mb-8">
        <div className="col-span-12 md:col-span-4 relative group/box rounded-3xl p-[1px] overflow-hidden">
            <div className="absolute inset-[-150%] animate-[spin_5s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,#000000_0%,#ffffff_50%,#000000_100%)] opacity-0 group-hover/box:opacity-30 transition-opacity duration-500"></div>
            <div className="bg-[#010101] w-full h-full rounded-[23px] border border-white/5 p-8 relative flex flex-col justify-between hover:border-white/10 transition-colors">
                <div className="flex justify-between items-start mb-6 relative z-10">
                    <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-zinc-400">Average Score</span>
                    <span className="material-symbols-outlined text-white/50">token</span>
                </div>
                <div className="flex items-baseline gap-2 relative z-10">
                    <h3 className="text-6xl font-black text-white px-2 tracking-tighter">{stats?.averageScore?.toFixed(0) || 0}</h3>
                    <span className="text-zinc-600 text-xs font-bold uppercase tracking-widest">/ 100</span>
                </div>
                <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-[0.2em] mt-6 relative z-10">Overall Average Score</p>
            </div>
        </div>

        <div className="col-span-12 md:col-span-4 relative group/box rounded-3xl p-[1px] overflow-hidden">
            <div className="absolute inset-[-150%] animate-[spin_5s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,#000000_0%,#ffffff_50%,#000000_100%)] opacity-0 group-hover/box:opacity-30 transition-opacity duration-500"></div>
            <div className="bg-[#010101] w-full h-full rounded-[23px] border border-white/5 p-8 relative flex flex-col justify-between hover:border-white/10 transition-colors">
                <div className="flex justify-between items-start mb-6 relative z-10">
                    <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-zinc-400">Sessions Completed</span>
                    <span className="material-symbols-outlined text-white/50">verified</span>
                </div>
                <h3 className="text-6xl font-black text-white px-2 tracking-tighter relative z-10">{stats?.completedSessions || 0}</h3>
                <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-[0.2em] mt-6 relative z-10">Total Interviews Finished</p>
            </div>
        </div>

        <div className="col-span-12 md:col-span-4 relative group/box rounded-3xl p-[1px] overflow-hidden">
            <div className="absolute inset-[-150%] animate-[spin_5s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,#000000_0%,#ffffff_50%,#000000_100%)] opacity-0 group-hover/box:opacity-30 transition-opacity duration-500"></div>
            <div className="bg-[#010101] w-full h-full rounded-[23px] border border-white/5 p-8 relative flex flex-col justify-between hover:border-white/10 transition-colors">
                <div className="flex justify-between items-start mb-6 relative z-10">
                    <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-zinc-400">Roles Practiced</span>
                    <span className="material-symbols-outlined text-white/50">developer_mode</span>
                </div>
                <h3 className="text-6xl font-black text-white px-2 tracking-tighter relative z-10">{stats?.distinctRolesPracticed || 0}</h3>
                <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-[0.2em] mt-6 relative z-10">Unique Job Profiles</p>
            </div>
        </div>
      </div>

      {/* ANALYTICS ENGINE */}
      <div className="grid grid-cols-12 gap-8 mb-8">
          <div className="col-span-12 lg:col-span-6 relative group/box rounded-3xl p-[1px] overflow-hidden">
              <div className="absolute inset-[-150%] animate-[spin_5s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,#000000_0%,#ffffff_50%,#000000_100%)] opacity-0 group-hover/box:opacity-30 transition-opacity duration-500"></div>
              <div className="bg-black w-full h-full rounded-[23px] border border-white/5 p-10 relative flex flex-col hover:border-white/10 transition-colors shadow-2xl">
                  <h3 className="text-white text-xl font-black tracking-widest uppercase mb-10 flex items-center gap-3 relative z-10">
                    Skill Analytics
                    {latestReport && <span className="w-2 h-2 rounded-full bg-white animate-pulse"></span>}
                  </h3>
                  
                  {latestReport ? (
                      <div className="space-y-4 relative z-10 mt-6 flex-1">
                          <MetricSlider label="Technical Score" score={latestReport.technicalScore} color="text-white" />
                          <MetricSlider label="Problem Solving" score={latestReport.problemSolvingScore} color="text-white" />
                          <MetricSlider label="Communication" score={latestReport.communicationScore} color="text-white" />
                          <MetricSlider label="Relevance" score={latestReport.relevanceScore} color="text-white" />
                          <MetricSlider label="Confidence" score={latestReport.confidenceScore} color="text-white" />
                      </div>
                  ) : (
                      <div className="flex-1 flex flex-col items-center justify-center border border-white/5 bg-white/[0.01] rounded-2xl relative z-10 min-h-[250px]">
                          <span className="material-symbols-outlined text-zinc-600 text-4xl mb-4">radar</span>
                          <p className="text-zinc-500 text-xs font-bold tracking-widest uppercase mb-2">No Data Available</p>
                          <p className="text-zinc-600 text-[10px] uppercase">Complete an interview session.</p>
                      </div>
                  )}
              </div>
          </div>

          <div className="col-span-12 lg:col-span-6 relative group/box rounded-3xl p-[1px] overflow-hidden">
              <div className="absolute inset-[-150%] animate-[spin_5s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,#000000_0%,#ffffff_50%,#000000_100%)] opacity-0 group-hover/box:opacity-30 transition-opacity duration-500"></div>
              <div className="bg-[#010101] w-full h-full rounded-[23px] border border-white/5 p-10 relative flex flex-col justify-between hover:border-white/10 transition-colors shadow-2xl">
                  <div className="flex items-center gap-3 mb-8 relative z-10">
                     <span className="material-symbols-outlined text-white">insights</span>
                     <h3 className="text-white text-xl font-black tracking-widest uppercase">AI Performance Report</h3>
                  </div>
                  <div className="relative z-10 flex-1 flex flex-col justify-center">
                      {latestReport?.improvementTips || latestReport?.overallFeedback ? (
                          <div>
                              <p className="text-zinc-300 text-sm leading-7 mb-4">
                                 Based on your recent performance, your key strengths include <strong>{((latestReport as any).strengthsSummary || latestReport.overallFeedback || "effective communication and structured context mapping")}</strong>. 
                                 Moving forward, the system recommends that you focus closely on <strong>{(latestReport.improvementTips || "expanding your system design patterns and practicing real-time constraints")}</strong> to elevate your global trajectory index.
                              </p>
                          </div>
                      ) : (
                          <p className="text-zinc-500 text-xs font-bold tracking-widest uppercase bg-white/[0.02] p-8 rounded-xl border border-white/5 text-center mt-4 border-dashed">
                             Report not generated.
                          </p>
                      )}
                  </div>
              </div>
          </div>
      </div>

      <div className="grid grid-cols-12 gap-8 mb-12 items-start">
        <div className="col-span-12 lg:col-span-4 relative group/box rounded-3xl p-[1px] overflow-hidden">
            <div className="absolute inset-[-150%] animate-[spin_5s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,#000000_0%,#ffffff_50%,#000000_100%)] opacity-0 group-hover/box:opacity-30 transition-opacity duration-500"></div>
            <div className="bg-[#010101] w-full h-full rounded-[23px] border border-white/5 flex flex-col relative hover:border-white/10 transition-colors">
                <div className="p-8 relative z-10 pb-2">
                     <h3 className="text-white text-lg font-black tracking-widest uppercase mb-2">Resume Parsing</h3>
                </div>
          
          {!activeResume ? (
             <div className="flex-1 flex flex-col items-center justify-center px-10 pb-10 pt-4 relative z-10">
                <div className="w-16 h-16 rounded-full border border-white/10 flex items-center justify-center mb-6 bg-white/[0.02] shadow-inner cursor-pointer" onClick={() => document.getElementById('upload-input')?.click()}>
                    {isUploading ? (
                      <span className="material-symbols-outlined text-2xl text-zinc-400 animate-spin">refresh</span>
                    ) : (
                      <span className="material-symbols-outlined text-2xl text-zinc-400 group-hover:text-white transition-colors">upload_file</span>
                    )}
                </div>
              
                {isUploading ? (
                    <p className="text-zinc-400 text-[10px] font-bold uppercase tracking-[0.2em] text-center mb-8 animate-pulse text-shadow-sm">Uploading...</p>
                ) : (
                    <p className="text-zinc-600 text-center text-xs font-medium mb-8 leading-relaxed max-w-[200px] group-hover:text-zinc-400 transition-colors">Upload a PDF resume to improve AI context.</p>
                )}
              
                <label className={`w-full bg-white/10 hover:bg-white text-white hover:text-black py-4 text-[10px] text-center font-black rounded-full uppercase tracking-[0.2em] transition-colors shadow-xl ${isUploading ? 'opacity-50 cursor-not-allowed pointer-events-none' : 'cursor-pointer'}`}>
                    <input 
                      id="upload-input"
                      type="file" accept=".pdf" className="hidden" disabled={isUploading}
                      onChange={async (e) => {
                        if (e.target.files && e.target.files.length > 0) {
                          const file = e.target.files[0];
                          const formData = new FormData();
                          formData.append("file", file);
                          setIsUploading(true);
                          try {
                            const resp = await fetchApi('/resume/upload', {
                              method: 'POST', body: formData
                            });
                            setActiveResume(resp);
                            showToast('Resume uploaded successfully.');
                          } catch (err: any) {
                            showToast('Upload failed: ' + err.message, 'error');
                          } finally {
                            setIsUploading(false);
                          }
                        }
                      }} 
                    />
                    {isUploading ? 'UPLOADING...' : 'UPLOAD RESUME'}
                </label>
             </div>
          ) : (
             <div className="p-8 relative z-10 pt-4">
                <div className="w-full relative overflow-hidden rounded-2xl group/resume p-[1px]">
                    <div className="absolute inset-[-150%] animate-[spin_5s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,#000000_0%,#ffffff_50%,#000000_100%)] opacity-30"></div>
                    <div className="w-full h-full bg-[#050505] relative rounded-[15px] px-6 py-8 shadow-2xl flex flex-col justify-center items-center">
                        <span className="material-symbols-outlined text-white text-3xl mb-3">description</span>
                        <p className="text-white text-sm font-bold truncate tracking-wide max-w-full mb-1">{activeResume.fileName}</p>
                        <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest mb-4">Active System Context</p>

                        <button 
                            onClick={async () => {
                              try {
                                await fetchApi('/resume', { method: 'DELETE' });
                                setActiveResume(null);
                                setConfirmDelete(false);
                                showToast('Resume removed.');
                              } catch(err: any) {
                                showToast('Removal failed.', 'error');
                              }
                            }} 
                            className="absolute top-4 right-4 w-9 h-9 flex items-center justify-center rounded-full bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all group/delete"
                            title="Delete Configuration"
                        >
                            <svg className="w-4 h-4 overflow-visible" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6" />
                                <path className="origin-bottom-left transition-transform duration-300 group-hover/delete:-rotate-12 group-hover/delete:-translate-y-1 group-hover/delete:-translate-x-0.5" strokeLinecap="round" strokeLinejoin="round" d="M9 7V4a1 1 0 011-1h4a1 1 0 011 1v3M3 7h18" />
                            </svg>
                        </button>
                    </div>
                </div>
             </div>
          )}
            </div>
        </div>

        <div className="col-span-12 lg:col-span-8 relative group/box rounded-3xl p-[1px] overflow-hidden">
            <div className="absolute inset-[-150%] animate-[spin_5s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,#000000_0%,#ffffff_50%,#000000_100%)] opacity-0 group-hover/box:opacity-30 transition-opacity duration-500"></div>
            <div className="bg-black w-full h-full rounded-[23px] border border-white/5 p-10 relative hover:border-white/10 transition-colors shadow-2xl overflow-hidden">
                <div className="absolute top-0 right-0 w-[500px] h-1 opacity-20 bg-gradient-to-l from-white to-transparent"></div>
                <div className="flex justify-between items-end mb-10 border-b border-white/5 pb-6 relative z-10">
                   <div>
                       <h3 className="text-white text-xl font-black tracking-widest uppercase mb-1">Recent Sessions</h3>
                       <p className="text-zinc-500 text-[10px] uppercase font-bold tracking-[0.1em]">Interview History</p>
                   </div>
                   <span className="text-zinc-600 text-xs font-black uppercase tracking-widest bg-white/5 px-4 py-2 rounded-full">{history.length} Logs</span>
                </div>

                <div className="space-y-4 max-h-[350px] overflow-y-auto pr-4 custom-scrollbar">
                  {history.length === 0 ? (
                    <div className="h-40 flex items-center justify-center border border-dashed border-white/10 rounded-2xl bg-white/[0.01]">
                        <p className="text-xs text-zinc-600 uppercase tracking-[0.3em] font-bold">No history found.</p>
                    </div>
                  ) : (
                    history.map((session, idx) => (
                      <div key={idx} className="flex flex-col md:flex-row md:items-center justify-between gap-6 p-5 rounded-2xl bg-white/[0.01] hover:bg-white/[0.03] border border-transparent hover:border-white/5 transition-all group relative overflow-hidden cursor-default shadow-lg hover:shadow-xl">
                          <div className={`absolute left-0 top-0 w-1 h-full transition-colors ${session.status === 'COMPLETED' ? 'bg-white/30 group-hover:bg-white' : 'bg-zinc-800 group-hover:bg-zinc-600'}`}></div>
                          
                          <div className="flex items-center gap-5">
                             <div className="w-12 h-12 rounded-xl bg-black border border-white/5 flex items-center justify-center shadow-inner group-hover:border-white/10 transition-colors">
                                <span className={`material-symbols-outlined text-lg ${session.status === 'COMPLETED' ? 'text-white' : 'text-zinc-600'}`}>
                                   {session.interviewType === 'BEHAVIORAL' ? 'psychology' : 'code'}
                                </span>
                             </div>
                             <div>
                                <h4 className="font-bold text-white text-sm tracking-wide mb-1 group-hover:translate-x-1 transition-transform">{session.jobRole || 'Practice Interview'}</h4>
                                <p className="text-[10px] text-zinc-500 uppercase tracking-[0.2em] font-bold flex items-center gap-2">
                                  {new Date(session.createdAt).toLocaleDateString()} 
                                  <span className="w-1 h-1 rounded-full bg-zinc-700"></span> 
                                  <span className={session.difficulty === 'HARD' ? 'text-red-400' : session.difficulty === 'MEDIUM' ? 'text-amber-400' : 'text-emerald-400'}>{session.difficulty}</span> 
                                  <span className="w-1 h-1 rounded-full bg-zinc-700"></span> 
                                  {session.status}
                                </p>
                             </div>
                          </div>

                          <div className="flex items-center gap-8">
                              {session.status === 'COMPLETED' && (
                                <div className="text-right">
                                  <p className="text-zinc-600 text-[10px] uppercase font-bold tracking-widest pl-1 mb-1">Score</p>
                                  <p className="text-2xl font-black text-white px-2">{session.totalScore?.toFixed(0) || "0"}</p>
                                </div>
                              )}

                          </div>
                      </div>
                    ))
                  )}
                </div>
            </div>
        </div>
      </div>

      {toast && (
        <div className={`fixed bottom-8 right-8 z-[200] max-w-sm w-full p-4 rounded-xl shadow-[0_20px_60px_rgba(0,0,0,0.8)] border backdrop-blur-2xl animate-in slide-in-from-bottom-5 fade-in duration-300 flex items-start gap-4 ${toast.type === 'error' ? 'bg-red-950/80 border-red-500/50' : 'bg-black/90 border-white/20'}`}>
           <span className={`material-symbols-outlined mt-0.5 ${toast.type === 'error' ? 'text-red-500' : 'text-white'}`}>
             {toast.type === 'error' ? 'error' : 'memory'}
           </span>
           <div>
             <h4 className={`text-xs font-black uppercase tracking-widest ${toast.type === 'error' ? 'text-red-500' : 'text-white'}`}>
               {toast.type === 'error' ? 'System Fault' : 'Network Update'}
             </h4>
             <p className="text-zinc-300 text-xs mt-1.5 leading-relaxed font-medium tracking-wide">{toast.message}</p>
           </div>
        </div>
      )}
    </div>
  );
}
