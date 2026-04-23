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
  const [userProfile, setUserProfile] = useState<any>(null);
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
        const [statsData, historyData, resumeData, profileData] = await Promise.all([
          fetchApi('/dashboard/stats').catch(() => null),
          fetchApi('/dashboard/history').catch(() => []),
          fetchApi('/resume/latest').catch(() => null),
          fetchApi('/user/profile').catch(() => null)
        ]);
        
        if (statsData) setStats(statsData);
        if (profileData) setUserProfile(profileData);
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

  // === STREAK & ACTIVITY COMPUTATION (derived from history, no extra API call) ===
  const activityMap: Record<string, number> = {};
  history.forEach(h => {
    const day = new Date(h.createdAt).toISOString().split('T')[0];
    activityMap[day] = (activityMap[day] || 0) + 1;
  });
  const activeDays = Object.keys(activityMap).sort();
  const totalActiveDays = activeDays.length;

  // Current streak — count backwards from today; still counts if last session was yesterday
  const todayStr = new Date().toISOString().split('T')[0];
  const yesterdayStr = new Date(Date.now() - 86400000).toISOString().split('T')[0];
  let currentStreak = 0;
  if (activeDays.length > 0) {
    const lastDay = activeDays[activeDays.length - 1];
    if (lastDay === todayStr || lastDay === yesterdayStr) {
      const cursor = new Date();
      cursor.setHours(0, 0, 0, 0);
      while (true) {
        const d = cursor.toISOString().split('T')[0];
        if (activityMap[d]) { currentStreak++; cursor.setDate(cursor.getDate() - 1); }
        else break;
      }
    }
  }

  // Longest streak — scan sorted active-days
  let longestStreak = 0, tempStreak = 0;
  let prevDay: Date | null = null;
  for (const day of activeDays) {
    const d = new Date(day);
    if (prevDay && (d.getTime() - prevDay.getTime()) / 86400000 === 1) {
      tempStreak++;
    } else {
      tempStreak = 1;
    }
    longestStreak = Math.max(longestStreak, tempStreak);
    prevDay = d;
  }
  longestStreak = Math.max(longestStreak, currentStreak);

  // Build 27-week calendar grid (col = week, row = day-of-week Sun–Sat)
  const calendarStart = new Date();
  calendarStart.setHours(0, 0, 0, 0);
  calendarStart.setDate(calendarStart.getDate() - 188); // ~27 weeks back
  calendarStart.setDate(calendarStart.getDate() - calendarStart.getDay()); // align to Sunday
  const calendarWeeks: string[][] = [];
  for (let w = 0; w < 27; w++) {
    const week: string[] = [];
    for (let d = 0; d < 7; d++) {
      const dt = new Date(calendarStart);
      dt.setDate(calendarStart.getDate() + w * 7 + d);
      week.push(dt.toISOString().split('T')[0]);
    }
    calendarWeeks.push(week);
  }

  // Generate month labels (one label per month change)
  const monthLabels: { weekIndex: number; label: string }[] = [];
  let lastMonth = -1;
  calendarWeeks.forEach((week, wi) => {
    const m = new Date(week[0]).getMonth();
    if (m !== lastMonth) {
      monthLabels.push({ weekIndex: wi, label: new Date(week[0]).toLocaleString('default', { month: 'short' }) });
      lastMonth = m;
    }
  });

  const cellColor = (count: number) => {
    if (!count) return 'bg-white/[0.04] border border-white/[0.06]';
    if (count === 1) return 'bg-blue-950 border border-blue-800/40';
    if (count === 2) return 'bg-blue-700/80';
    return 'bg-blue-400 shadow-[0_0_8px_rgba(96,165,250,0.6)]';
  };

  // === PROGRESS CHART (last 8 weeks of completed sessions) ===
  const SVG_W = 700, SVG_H = 160;
  const PAD = { l: 32, r: 12, t: 15, b: 30 };
  const chartPW = SVG_W - PAD.l - PAD.r;
  const chartPH = SVG_H - PAD.t - PAD.b;
  const chartWeeks = Array.from({ length: 8 }, (_, i) => {
    const weekOffset = 7 - i;
    const ws = new Date();
    ws.setHours(0, 0, 0, 0);
    ws.setDate(ws.getDate() - (ws.getDay() + weekOffset * 7));
    const we = new Date(ws);
    we.setDate(ws.getDate() + 6);
    we.setHours(23, 59, 59, 999);
    // Include ALL completed sessions within the week, regardless of score
    const weekSessions = history.filter(h =>
      h.status === 'COMPLETED' &&
      new Date(h.createdAt) >= ws && new Date(h.createdAt) <= we
    );
    const withScore = weekSessions.filter(h => h.totalScore != null);
    // avg based only on sessions that have a score; null if none scored yet
    const avg = withScore.length > 0
      ? withScore.reduce((s, h) => s + (h.totalScore as number), 0) / withScore.length
      : (weekSessions.length > 0 ? 50 : null); // fallback: show at 50 if session exists but score not yet computed
    return { label: ws.toLocaleDateString('en', { month: 'short', day: 'numeric' }), avg, count: weekSessions.length };
  });
  // Clamp gy so 0-score dots still render 8px above baseline
  const gx = (i: number) => PAD.l + (i / (chartWeeks.length - 1)) * chartPW;
  const gy = (score: number) => Math.min(PAD.t + chartPH - 8, PAD.t + chartPH - (Math.max(score, 0) / 100) * chartPH);
  const chartDots = chartWeeks.map((w, i) => w.avg !== null ? { x: gx(i), y: gy(w.avg), score: w.avg } : null);
  let linePath = ''; chartDots.forEach((p, i) => { if (!p) return; const prev = chartDots[i - 1]; linePath += prev ? ` L ${p.x} ${p.y}` : ` M ${p.x} ${p.y}`; });
  const first = chartDots.find(Boolean), last = [...chartDots].reverse().find(Boolean);
  const areaPath = first && last ? `M ${first.x} ${first.y}${linePath.replace(/^M [0-9.]+ [0-9.]+/, '')} L ${last.x} ${PAD.t + chartPH} L ${first.x} ${PAD.t + chartPH} Z` : '';


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

      {/* STREAK TRACKER */}
      <div className="mb-8 relative group/box rounded-3xl p-[1px] overflow-hidden">
        <div className="absolute inset-[-150%] animate-[spin_6s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,#000000_0%,#1e40af_50%,#000000_100%)] opacity-0 group-hover/box:opacity-20 transition-opacity duration-700"></div>
        <div className="bg-black rounded-[23px] border border-white/5 p-8 md:p-10 hover:border-white/10 transition-colors shadow-2xl relative">
          <div className="flex flex-col lg:flex-row gap-10">

            {/* Left: Streak stats */}
            <div className="flex-shrink-0 flex flex-col justify-between gap-6 lg:w-52">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="material-symbols-outlined text-white text-2xl">local_fire_department</span>
                  <h3 className="text-white text-xl font-black tracking-widest uppercase">Streak</h3>
                </div>
                <p className="text-zinc-600 text-[10px] font-bold uppercase tracking-widest">Practice consistency tracker</p>
              </div>

              <div className="space-y-3">
                <div className="bg-white/[0.03] border border-white/5 rounded-2xl p-5">
                  <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-[0.2em] mb-2">Current Streak</p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-5xl font-black text-white">{currentStreak}</span>
                    <span className="text-zinc-600 text-xs font-bold uppercase">days</span>
                  </div>
                  {currentStreak > 0
                    ? <p className="text-blue-400 text-[10px] font-bold uppercase tracking-widest mt-2 animate-pulse">● Active streak</p>
                    : <p className="text-zinc-700 text-[10px] font-bold uppercase tracking-widest mt-2">— Start today</p>}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-white/[0.02] border border-white/5 rounded-xl p-4">
                    <p className="text-zinc-600 text-[10px] font-bold uppercase tracking-widest mb-1">Best</p>
                    <p className="text-2xl font-black text-white">{longestStreak}<span className="text-zinc-600 text-[10px] font-bold ml-1">d</span></p>
                  </div>
                  <div className="bg-white/[0.02] border border-white/5 rounded-xl p-4">
                    <p className="text-zinc-600 text-[10px] font-bold uppercase tracking-widest mb-1">Total</p>
                    <p className="text-2xl font-black text-white">{totalActiveDays}<span className="text-zinc-600 text-[10px] font-bold ml-1">d</span></p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Calendar heatmap */}
            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-center mb-3">
                <p className="text-zinc-600 text-[10px] font-bold uppercase tracking-[0.2em]">Last 6 months activity</p>
                <div className="flex items-center gap-1.5">
                  <span className="text-zinc-700 text-[9px] font-bold uppercase">Less</span>
                  {['bg-white/[0.04] border border-white/[0.06]','bg-blue-950 border border-blue-800/40','bg-blue-700/80','bg-blue-400'].map((c,i) => (
                    <div key={i} className={`w-2.5 h-2.5 rounded-[2px] ${c}`} />
                  ))}
                  <span className="text-zinc-700 text-[9px] font-bold uppercase">More</span>
                </div>
              </div>

              <div className="overflow-x-auto pb-2">
                <div className="inline-block min-w-max">
                  {/* Month labels */}
                  <div className="flex mb-1 pl-6">
                    {calendarWeeks.map((week, wi) => {
                      const ml = monthLabels.find(m => m.weekIndex === wi);
                      return (
                        <div key={wi} className="w-4 flex-shrink-0 mr-[3px]">
                          {ml && <span className="text-[9px] text-zinc-500 font-bold uppercase">{ml.label}</span>}
                        </div>
                      );
                    })}
                  </div>

                  {/* Grid: rows = days (Sun–Sat), cols = weeks */}
                  <div className="flex gap-[3px]">
                    {/* Day-of-week labels */}
                    <div className="flex flex-col gap-[3px] mr-1 mt-[1px]">
                      {['S','M','T','W','T','F','S'].map((label, i) => (
                        <div key={i} className="w-4 h-4 flex items-center justify-center">
                          {i % 2 !== 0 && <span className="text-[8px] text-zinc-700 font-bold">{label}</span>}
                        </div>
                      ))}
                    </div>

                    {/* Week columns */}
                    {calendarWeeks.map((week, wi) => (
                      <div key={wi} className="flex flex-col gap-[3px]">
                        {week.map(dayStr => {
                          const count = activityMap[dayStr] || 0;
                          const isFuture = dayStr > todayStr;
                          return (
                            <div
                              key={dayStr}
                              title={isFuture ? '' : `${dayStr}: ${count} session${count !== 1 ? 's' : ''}`}
                              className={`w-4 h-4 rounded-[2px] transition-all duration-200 cursor-default hover:scale-125 hover:z-10 relative ${
                                isFuture ? 'opacity-0' : cellColor(count)
                              }`}
                            />
                          );
                        })}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* PROGRESS CHART */}
      <div className="mb-8 relative group/box rounded-3xl p-[1px] overflow-hidden">
        <div className="absolute inset-[-150%] animate-[spin_6s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,#000000_0%,#ffffff_50%,#000000_100%)] opacity-0 group-hover/box:opacity-15 transition-opacity duration-700"></div>
        <div className="bg-black rounded-[23px] border border-white/5 p-8 md:p-10 hover:border-white/10 transition-colors shadow-2xl">
          <div className="flex items-center gap-3 mb-6">
            <span className="material-symbols-outlined text-white">trending_up</span>
            <h3 className="text-white text-xl font-black tracking-widest uppercase">Progress Over Time</h3>
            <span className="text-zinc-600 text-[10px] font-bold uppercase tracking-widest ml-auto">Avg score · last 8 weeks</span>
          </div>
          {history.filter(h => h.status === 'COMPLETED').length === 0 ? (
            <div className="h-40 flex flex-col items-center justify-center border border-dashed border-white/10 rounded-2xl">
              <span className="material-symbols-outlined text-zinc-700 text-3xl mb-3">show_chart</span>
              <p className="text-zinc-700 text-xs font-bold uppercase tracking-widest">Complete sessions to see your trend</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <svg viewBox={`0 0 ${SVG_W} ${SVG_H}`} className="w-full min-w-[340px]" style={{ height: SVG_H }}>
                <defs>
                  <linearGradient id="chartAreaGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="white" stopOpacity="0.08" />
                    <stop offset="100%" stopColor="white" stopOpacity="0" />
                  </linearGradient>
                </defs>
                {/* Grid lines */}
                {[0, 25, 50, 75, 100].map(score => (
                  <g key={score}>
                    <line x1={PAD.l} y1={gy(score)} x2={PAD.l + chartPW} y2={gy(score)} stroke="white" strokeOpacity="0.04" />
                    <text x={PAD.l - 4} y={gy(score) + 4} fill="white" fillOpacity="0.25" fontSize="9" textAnchor="end">{score}</text>
                  </g>
                ))}
                {areaPath && <path d={areaPath} fill="url(#chartAreaGrad)" />}
                {linePath && <path d={linePath} fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />}
                {chartDots.map((pt, i) => pt && (
                  <g key={i}>
                    {/* Glow ring */}
                    <circle cx={pt.x} cy={pt.y} r="8" fill="white" fillOpacity="0.08" />
                    {/* White dot */}
                    <circle cx={pt.x} cy={pt.y} r="3.5" fill="white" />
                    {/* Score label above dot */}
                    <text x={pt.x} y={pt.y - 10} fill="white" fillOpacity="0.7" fontSize="9" textAnchor="middle" fontWeight="bold">
                      {Math.round(pt.score)}
                    </text>
                    <title>{chartWeeks[i].label}: avg {pt.score.toFixed(0)} ({chartWeeks[i].count} sessions)</title>
                  </g>
                ))}
                {/* X axis week labels */}
                {chartWeeks.map((w, i) => (
                  <text key={i} x={gx(i)} y={SVG_H - 6} fill="white" fillOpacity="0.25" fontSize="8" textAnchor="middle">{w.label}</text>
                ))}

              </svg>
            </div>
          )}
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
                          // Block unverified users — direct them to verify from Profile
                          if (userProfile && !userProfile.emailVerified) {
                            showToast('Email not verified. Please go to your Profile and verify your email first.', 'error');
                            e.target.value = ''; // reset the input
                            return;
                          }
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
