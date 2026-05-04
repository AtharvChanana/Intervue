"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { fetchApi } from '@/lib/api';
import MagicCard from '@/components/MagicCard';
import AnimatedIcon from '@/components/AnimatedIcon';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { Toaster } from '@/components/ui/sonner';

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
  const [dsaHistory, setDsaHistory] = useState<any[]>([]);
  const [latestReport, setLatestReport] = useState<SessionReport | null>(null);
  const [activeResume, setActiveResume] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/');
      return;
    }

    const loadDashboard = async () => {
      try {
        const [statsData, historyData, resumeData, profileData, dsaData] = await Promise.all([
          fetchApi('/dashboard/stats').catch(() => null),
          fetchApi('/dashboard/history').catch(() => []),
          fetchApi('/resume/latest').catch(() => null),
          fetchApi('/user/profile').catch(() => null),
          fetchApi('/dsa/all').catch(() => []),
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
        if (Array.isArray(dsaData)) setDsaHistory(dsaData);
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
      <div className="animate-in fade-in duration-500 pb-20">
        {/* Header skeleton */}
        <div className="flex justify-between items-end mb-16">
          <div className="space-y-3">
            <Skeleton className="h-12 w-64 bg-white/5" />
            <Skeleton className="h-3 w-48 bg-white/5" />
          </div>
        </div>

        {/* Top 3 stat cards */}
        <div className="grid grid-cols-12 gap-6 mb-8">
          {[1,2,3].map(i => (
            <div key={i} className="col-span-12 md:col-span-4 bg-[#010101] border border-white/5 rounded-3xl p-8 space-y-6">
              <div className="flex justify-between items-start">
                <Skeleton className="h-3 w-28 bg-white/5" />
                <Skeleton className="h-5 w-5 rounded bg-white/5" />
              </div>
              <Skeleton className="h-14 w-20 bg-white/5" />
              <Skeleton className="h-3 w-36 bg-white/5" />
            </div>
          ))}
        </div>

        {/* Middle row */}
        <div className="grid grid-cols-12 gap-8 mb-8">
          <div className="col-span-12 md:col-span-8 bg-[#010101] border border-white/5 rounded-3xl p-8 space-y-6">
            <Skeleton className="h-5 w-40 bg-white/5" />
            <Skeleton className="h-48 w-full bg-white/5 rounded-2xl" />
          </div>
          <div className="col-span-12 md:col-span-4 bg-[#010101] border border-white/5 rounded-3xl p-8 space-y-4">
            <Skeleton className="h-5 w-32 bg-white/5" />
            {[1,2,3].map(i => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="h-10 w-10 rounded-xl bg-white/5" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-3 w-full bg-white/5" />
                  <Skeleton className="h-2 w-3/4 bg-white/5" />
                </div>
                <Skeleton className="h-6 w-10 bg-white/5" />
              </div>
            ))}
          </div>
        </div>

        {/* Bottom row */}
        <div className="grid grid-cols-12 gap-8">
          <div className="col-span-12 md:col-span-4 bg-[#010101] border border-white/5 rounded-3xl p-8 space-y-4">
            <Skeleton className="h-5 w-28 bg-white/5" />
            <Skeleton className="h-32 w-32 rounded-full mx-auto bg-white/5" />
            <Skeleton className="h-3 w-full bg-white/5" />
            <Skeleton className="h-3 w-2/3 bg-white/5" />
          </div>
          <div className="col-span-12 md:col-span-8 bg-[#010101] border border-white/5 rounded-3xl p-8 space-y-4">
            <Skeleton className="h-5 w-36 bg-white/5" />
            {[1,2,3].map(i => (
              <div key={i} className="flex items-center gap-4 p-4 rounded-2xl border border-white/5">
                <Skeleton className="h-12 w-12 rounded-xl bg-white/5" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-48 bg-white/5" />
                  <Skeleton className="h-2 w-32 bg-white/5" />
                </div>
                <Skeleton className="h-8 w-12 bg-white/5" />
              </div>
            ))}
          </div>
        </div>
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
  // Anchor to THIS week's Sunday so the rightmost column is always the current week
  const todayCal = new Date();
  todayCal.setHours(0, 0, 0, 0);
  const thisWeekSunCal = new Date(todayCal);
  thisWeekSunCal.setDate(todayCal.getDate() - todayCal.getDay()); // roll back to Sunday
  const calendarStart = new Date(thisWeekSunCal);
  calendarStart.setDate(thisWeekSunCal.getDate() - 26 * 7); // 26 weeks back = start of 27-week window
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

  // === PROGRESS CHART — 52 rolling weeks, rightmost = current week ===
  const NUM_WEEKS = 52;
  const SVG_W = 700, SVG_H = 160;
  const PAD = { l: 35, r: 20, t: 18, b: 28 };
  const chartPW = SVG_W - PAD.l - PAD.r;
  const chartPH = SVG_H - PAD.t - PAD.b;

  // Anchor: find THIS week's Sunday so rightmost column is always the current week
  const todayChart = new Date();
  todayChart.setHours(0, 0, 0, 0);
  const thisWeekSun = new Date(todayChart);
  thisWeekSun.setDate(todayChart.getDate() - todayChart.getDay()); // roll back to Sunday

  const chartWeeks = Array.from({ length: NUM_WEEKS }, (_, i) => {
    const weeksAgo = NUM_WEEKS - 1 - i; // i=0 = oldest, i=51 = THIS week
    const ws = new Date(thisWeekSun);
    ws.setDate(thisWeekSun.getDate() - weeksAgo * 7);
    const we = new Date(ws);
    we.setDate(ws.getDate() + 6);
    we.setHours(23, 59, 59, 999);
    const weekSessions = history.filter(h =>
      h.status === 'COMPLETED' &&
      new Date(h.createdAt) >= ws && new Date(h.createdAt) <= we
    );
    const withScore = weekSessions.filter(h => h.totalScore != null);
    const avg = withScore.length > 0
      ? withScore.reduce((s, h) => s + (h.totalScore as number), 0) / withScore.length
      : (weekSessions.length > 0 ? 50 : null);
    const monthLabel = ws.getDate() <= 7 ? ws.toLocaleDateString('en', { month: 'short' }) : null;
    return { label: ws.toLocaleDateString('en', { month: 'short', day: 'numeric' }), monthLabel, avg, count: weekSessions.length, isCurrent: weeksAgo === 0 };
  });

  const gx = (i: number) => PAD.l + (i / (NUM_WEEKS - 1)) * chartPW;
  const gy = (score: number) => Math.max(PAD.t + 4, Math.min(PAD.t + chartPH - 4, PAD.t + chartPH - (score / 100) * chartPH));
  const chartDots = chartWeeks.map((w, i) => w.avg !== null ? { x: gx(i), y: gy(w.avg), score: w.avg, isCurrent: w.isCurrent } : null);
  // Build linePath — connect only consecutive non-null points (gaps for null weeks)
  let linePath = '';
  chartDots.forEach((p, i) => {
    if (!p) return;
    const prevDot = chartDots.slice(0, i).reverse().find(Boolean);
    linePath += prevDot && prevDot === chartDots[i - 1] ? ` L ${p.x} ${p.y}` : ` M ${p.x} ${p.y}`;
  });
  const first = chartDots.find(Boolean), last = [...chartDots].reverse().find(Boolean);
  const areaPath = first && last
    ? `M ${first.x} ${first.y}${linePath.replace(/^M [0-9.]+ [0-9.]+/, '')} L ${last.x} ${PAD.t + chartPH} L ${first.x} ${PAD.t + chartPH} Z`
    : '';




  return (
    <div className="animate-in fade-in duration-1000 pb-20">
      <div className="flex justify-between items-end mb-16">
        <div className="max-w-2xl">
          <h2 className="text-4xl lg:text-5xl font-black uppercase tracking-widest mb-4 text-transparent bg-clip-text bg-gradient-to-r from-white via-blue-100 to-white/20">Dashboard</h2>
          <p className="text-zinc-500 text-sm tracking-widest font-medium overflow-hidden whitespace-nowrap">YOUR RECENT PERFORMANCE METRICS</p>
          {error && <p className="text-red-400 mt-4 text-xs font-bold">WARNING: Offline Analytics Cache Served. Engine Connection Fault.</p>}
        </div>
      </div>

      {/* TOP MATRIX */}
      <div className="grid grid-cols-12 gap-6 mb-8">
        <MagicCard className="col-span-12 md:col-span-4 rounded-3xl">
            <div className="bg-[#010101] w-full h-full rounded-[23px] border border-white/5 p-8 relative flex flex-col justify-between hover:border-white/10 transition-colors">
                <div className="flex justify-between items-start mb-6 relative z-10">
                    <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-zinc-400">Average Score</span>
                    <AnimatedIcon name="token" className="text-white/50" />
                </div>
                <div className="flex items-baseline gap-2 relative z-10">
                    <h3 className="text-6xl font-black text-white px-2 tracking-tighter">{stats?.averageScore?.toFixed(0) || 0}</h3>
                    <span className="text-zinc-600 text-xs font-bold uppercase tracking-widest">/ 100</span>
                </div>
                <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-[0.2em] mt-6 relative z-10">Overall Average Score</p>
            </div>
        </MagicCard>

        <MagicCard className="col-span-12 md:col-span-4 rounded-3xl">
            <div className="bg-[#010101] w-full h-full rounded-[23px] border border-white/5 p-8 relative flex flex-col justify-between hover:border-white/10 transition-colors">
                <div className="flex justify-between items-start mb-6 relative z-10">
                    <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-zinc-400">Sessions Completed</span>
                    <AnimatedIcon name="verified" className="text-white/50" />
                </div>
                <h3 className="text-6xl font-black text-white px-2 tracking-tighter relative z-10">{stats?.completedSessions || 0}</h3>
                <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-[0.2em] mt-6 relative z-10">Total Interviews Finished</p>
            </div>
        </MagicCard>

        <MagicCard className="col-span-12 md:col-span-4 rounded-3xl">
            <div className="bg-[#010101] w-full h-full rounded-[23px] border border-white/5 p-8 relative flex flex-col justify-between hover:border-white/10 transition-colors">
                <div className="flex justify-between items-start mb-6 relative z-10">
                    <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-zinc-400">Roles Practiced</span>
                    <AnimatedIcon name="developer_mode" className="text-white/50" />
                </div>
                <h3 className="text-6xl font-black text-white px-2 tracking-tighter relative z-10">{stats?.distinctRolesPracticed || 0}</h3>
                <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-[0.2em] mt-6 relative z-10">Unique Job Profiles</p>
            </div>
        </MagicCard>
      </div>

      {/* ANALYTICS ENGINE */}
      <div className="grid grid-cols-12 gap-8 mb-8">
          <MagicCard className="col-span-12 lg:col-span-6 rounded-3xl">
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
                          <AnimatedIcon name="radar" className="text-zinc-600 text-4xl mb-4" />
                          <p className="text-zinc-500 text-xs font-bold tracking-widest uppercase mb-2">No Data Available</p>
                          <p className="text-zinc-600 text-[10px] uppercase">Complete an interview session.</p>
                      </div>
                  )}
              </div>
          </MagicCard>

          <MagicCard className="col-span-12 lg:col-span-6 rounded-3xl">
              <div className="bg-[#010101] w-full h-full rounded-[23px] border border-white/5 p-10 relative flex flex-col justify-between hover:border-white/10 transition-colors shadow-2xl">
                  <div className="flex items-center gap-3 mb-8 relative z-10">
                     <AnimatedIcon name="insights" className="text-white" />
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
          </MagicCard>
      </div>

      {/* STREAK TRACKER */}
      <MagicCard className="mb-8 rounded-3xl">
        <div className="bg-black rounded-[23px] border border-white/5 p-8 md:p-10 hover:border-white/10 transition-colors shadow-2xl relative">
          <div className="flex flex-col lg:flex-row gap-10">

            {/* Left: Streak stats */}
            <div className="flex-shrink-0 flex flex-col justify-between gap-6 lg:w-52">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <AnimatedIcon name="local_fire_department" className="text-white text-2xl" />
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
      </MagicCard>

        {/* PROGRESS CHART */}
      <MagicCard className="mb-8 rounded-3xl">
        <div className="bg-black rounded-[23px] border border-white/5 p-8 md:p-10 hover:border-white/10 transition-colors shadow-2xl">
          <div className="flex items-center gap-3 mb-6">
            <AnimatedIcon name="trending_up" className="text-white" />
            <h3 className="text-white text-xl font-black tracking-widest uppercase">Progress Over Time</h3>
            <span className="text-zinc-600 text-[10px] font-bold uppercase tracking-widest ml-auto">Avg score · last 52 weeks</span>
          </div>
          {history.filter(h => h.status === 'COMPLETED').length === 0 ? (
            <div className="h-40 flex flex-col items-center justify-center border border-dashed border-white/10 rounded-2xl">
              <AnimatedIcon name="show_chart" className="text-zinc-700 text-3xl mb-3" />
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
                {linePath && <path d={linePath} fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" strokeOpacity="0.85" />}
                {/* Dots: small for history, larger+bright for current week */}
                {chartDots.map((pt, i) => pt && (
                  <g key={i}>
                    {pt.isCurrent ? (
                      <>
                        <circle cx={pt.x} cy={pt.y} r="7" fill="white" fillOpacity="0.12" />
                        <circle cx={pt.x} cy={pt.y} r="4" fill="white" />
                        <text x={pt.x} y={pt.y - 10} fill="white" fillOpacity="0.9" fontSize="9" textAnchor="middle" fontWeight="bold">{Math.round(pt.score)}</text>
                      </>
                    ) : (
                      <circle cx={pt.x} cy={pt.y} r="2" fill="white" fillOpacity="0.7" />
                    )}
                    <title>{chartWeeks[i].label}: avg {pt.score.toFixed(0)} ({chartWeeks[i].count} session{chartWeeks[i].count !== 1 ? 's' : ''})</title>
                  </g>
                ))}
                {/* X axis: month labels only (at first week of each month) */}
                {chartWeeks.map((w, i) => w.monthLabel && (
                  <text key={i} x={gx(i)} y={SVG_H - 5} fill="white" fillOpacity="0.3" fontSize="8"
                    textAnchor={i === 0 ? 'start' : i >= NUM_WEEKS - 2 ? 'end' : 'middle'}>
                    {w.monthLabel}
                  </text>
                ))}


              </svg>
            </div>
          )}
        </div>
      </MagicCard>

      <MagicCard className="col-span-12 rounded-3xl">
          <div className="bg-[#010101] w-full h-full rounded-[23px] border border-white/5 hover:border-white/10 transition-colors">
            <div className="p-8 pb-6 border-b border-white/5">
              <h3 className="text-white text-lg font-black tracking-widest uppercase">Resume Parsing</h3>
              <p className="text-zinc-500 text-[10px] uppercase font-bold tracking-[0.1em] mt-1">AI Context Configuration</p>
            </div>

            {!activeResume ? (
              <div className="flex items-center gap-10 px-10 py-10">
                <div className="w-20 h-20 rounded-full border border-white/10 flex items-center justify-center bg-white/[0.02] shadow-inner cursor-pointer shrink-0" onClick={() => document.getElementById('upload-input')?.click()}>
                  {isUploading ? (
                    <AnimatedIcon name="refresh" className="text-3xl text-zinc-400 animate-spin" />
                  ) : (
                    <AnimatedIcon name="upload_file" className="text-3xl text-zinc-400" />
                  )}
                </div>
                <div className="flex-1">
                  <p className="text-white font-bold text-base mb-1">No resume uploaded</p>
                  <p className="text-zinc-500 text-sm leading-relaxed mb-6">Upload a PDF resume to give the AI context about your background for more personalized mock interviews.</p>
                  <label className={`inline-flex items-center gap-2 bg-white/10 hover:bg-white text-white hover:text-black px-8 py-3 text-[10px] font-black rounded-full uppercase tracking-[0.2em] transition-colors shadow-xl ${isUploading ? 'opacity-50 cursor-not-allowed pointer-events-none' : 'cursor-pointer'}`}>
                    <input
                      id="upload-input"
                      type="file" accept=".pdf" className="hidden" disabled={isUploading}
                      onChange={async (e) => {
                        if (e.target.files && e.target.files.length > 0) {
                          if (userProfile && !userProfile.emailVerified) {
                            toast.error('Email not verified. Please go to your Profile and verify your email first.');
                            e.target.value = '';
                            return;
                          }
                          const file = e.target.files[0];
                          const formData = new FormData();
                          formData.append("file", file);
                          setIsUploading(true);
                          try {
                            const resp = await fetchApi('/resume/upload', { method: 'POST', body: formData });
                            setActiveResume(resp);
                            toast.success('Resume uploaded successfully.');
                          } catch (err: any) {
                            toast.error('Upload failed: ' + err.message);
                          } finally {
                            setIsUploading(false);
                          }
                        }
                      }}
                    />
                    {isUploading ? 'UPLOADING...' : 'UPLOAD RESUME'}
                  </label>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-10 px-10 py-10">
                <div className="w-20 h-20 rounded-2xl border border-white/10 bg-white/[0.03] flex items-center justify-center shadow-inner shrink-0">
                  <AnimatedIcon name="description" className="text-white text-3xl" />
                </div>
                <div className="flex-1">
                  <p className="text-white font-bold text-base mb-1">{activeResume.fileName}</p>
                  <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest mb-3">Active System Context</p>
                  <p className="text-zinc-400 text-sm leading-relaxed">This resume is being used to personalize your AI mock interviews. Remove it to upload a different one.</p>
                </div>
                <button
                  onClick={async () => {
                    try {
                      await fetchApi('/resume', { method: 'DELETE' });
                      setActiveResume(null);
                      setConfirmDelete(false);
                      toast.success('Resume removed.');
                    } catch(err: any) {
                      toast.error('Removal failed.');
                    }
                  }}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-all border border-red-500/20 text-[10px] font-bold uppercase tracking-widest shrink-0"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 7V4a1 1 0 011-1h4a1 1 0 011 1v3M3 7h18" />
                  </svg>
                  Remove
                </button>
              </div>
            )}
          </div>
      </MagicCard>
      <Toaster position="top-center" theme="dark" richColors />
    </div>
  );
}
