"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { fetchApi } from '@/lib/api';
import AnimatedIcon from '@/components/AnimatedIcon';
import { Skeleton } from '@/components/ui/skeleton';
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
  const [latestReport, setLatestReport] = useState<SessionReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [isNewUser, setIsNewUser] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/');
      return;
    }

    const loadDashboard = async () => {
      try {
        const [statsData, historyData] = await Promise.all([
          fetchApi('/dashboard/stats').catch(() => null),
          fetchApi('/dashboard/history').catch(() => []),
        ]);
        
        if (statsData) setStats(statsData);
        if (historyData) {
            setHistory(historyData);
            // Detect new user: no sessions at all
            if (historyData.length === 0 && (!statsData || statsData.totalSessions === 0)) {
              setIsNewUser(true);
            }
            const latestCompleted = historyData.find((h: any) => h.status === 'COMPLETED');
            if (latestCompleted) {
                const reportData = await fetchApi('/dashboard/session/' + latestCompleted.sessionId).catch(() => null);
                if (reportData) setLatestReport(reportData);
            }
        }
      } catch {
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
            <Skeleton className="h-12 w-64 bg-[#1F1A17]" />
            <Skeleton className="h-3 w-48 bg-[#1F1A17]" />
          </div>
        </div>

        {/* Top 3 stat cards */}
        <div className="grid grid-cols-12 gap-6 mb-8">
          {[1,2,3].map(i => (
            <div key={i} className="col-span-12 md:col-span-4 bg-[#1A1512] border border-[#66473B]/40 rounded-3xl p-8 space-y-6">
              <div className="flex justify-between items-start">
                <Skeleton className="h-3 w-28 bg-[#1F1A17]" />
                <Skeleton className="h-5 w-5 rounded bg-[#1F1A17]" />
              </div>
              <Skeleton className="h-14 w-20 bg-[#1F1A17]" />
              <Skeleton className="h-3 w-36 bg-[#1F1A17]" />
            </div>
          ))}
        </div>

        {/* Middle row */}
        <div className="grid grid-cols-12 gap-8 mb-8">
          <div className="col-span-12 md:col-span-8 bg-[#1A1512] border border-[#66473B]/40 rounded-3xl p-8 space-y-6">
            <Skeleton className="h-5 w-40 bg-[#1F1A17]" />
            <Skeleton className="h-48 w-full bg-[#1F1A17] rounded-2xl" />
          </div>
          <div className="col-span-12 md:col-span-4 bg-[#1A1512] border border-[#66473B]/40 rounded-3xl p-8 space-y-4">
            <Skeleton className="h-5 w-32 bg-[#1F1A17]" />
            {[1,2,3].map(i => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="h-10 w-10 rounded-xl bg-[#1F1A17]" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-3 w-full bg-[#1F1A17]" />
                  <Skeleton className="h-2 w-3/4 bg-[#1F1A17]" />
                </div>
                <Skeleton className="h-6 w-10 bg-[#1F1A17]" />
              </div>
            ))}
          </div>
        </div>

        {/* Bottom row */}
        <div className="grid grid-cols-12 gap-8">
          <div className="col-span-12 md:col-span-4 bg-[#1A1512] border border-[#66473B]/40 rounded-3xl p-8 space-y-4">
            <Skeleton className="h-5 w-28 bg-[#1F1A17]" />
            <Skeleton className="h-32 w-32 rounded-full mx-auto bg-[#1F1A17]" />
            <Skeleton className="h-3 w-full bg-[#1F1A17]" />
            <Skeleton className="h-3 w-2/3 bg-[#1F1A17]" />
          </div>
          <div className="col-span-12 md:col-span-8 bg-[#1A1512] border border-[#66473B]/40 rounded-3xl p-8 space-y-4">
            <Skeleton className="h-5 w-36 bg-[#1F1A17]" />
            {[1,2,3].map(i => (
              <div key={i} className="flex items-center gap-4 p-4 rounded-2xl border border-[#66473B]/40">
                <Skeleton className="h-12 w-12 rounded-xl bg-[#1F1A17]" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-48 bg-[#1F1A17]" />
                  <Skeleton className="h-2 w-32 bg-[#1F1A17]" />
                </div>
                <Skeleton className="h-8 w-12 bg-[#1F1A17]" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }



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
    if (!count) return 'bg-[#231E1A] border border-[#35211A]';
    if (count === 1) return 'bg-[#3D2920] border border-[#66473B]/60';
    if (count === 2) return 'bg-[#66473B]';
    return 'bg-[#DC9F85] shadow-[0_0_8px_rgba(220,159,133,0.6)]';
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
      <div className="flex justify-between items-end mb-8 md:mb-16">
        <div className="max-w-2xl">
          <h2 className="display-font text-3xl md:text-4xl lg:text-5xl font-black uppercase tracking-widest mb-2 md:mb-4 text-[#EBDCC4]">Dashboard</h2>
          <p className="text-[#B6A596] text-xs md:text-sm tracking-widest font-medium overflow-hidden whitespace-nowrap">YOUR RECENT PERFORMANCE METRICS</p>
          {error && <p className="text-red-400 mt-4 text-xs font-bold">WARNING: Offline Analytics Cache Served. Engine Connection Fault.</p>}
        </div>
      </div>

      {/* NEW USER EMPTY STATE */}
      {isNewUser ? (
        <div className="flex flex-col items-center justify-center min-h-[60vh] animate-in fade-in duration-700">
          {/* Decorative ring */}
          <div className="relative mb-10">
            <div className="w-40 h-40 rounded-full border border-[#66473B]/20 flex items-center justify-center">
              <div className="w-28 h-28 rounded-full border border-[#66473B]/30 flex items-center justify-center">
                <div className="w-16 h-16 rounded-full bg-[#1A1512] border border-[#66473B]/50 flex items-center justify-center shadow-[0_0_40px_rgba(220,159,133,0.08)]">
                  <AnimatedIcon name="mic" className="text-[#DC9F85] text-3xl" />
                </div>
              </div>
            </div>
            {/* Orbiting dots */}
            <div className="absolute top-2 right-2 w-2.5 h-2.5 rounded-full bg-[#DC9F85]/40 shadow-[0_0_8px_rgba(220,159,133,0.4)]"></div>
            <div className="absolute bottom-4 left-0 w-1.5 h-1.5 rounded-full bg-[#66473B]/60"></div>
          </div>

          <div className="text-center max-w-md mb-10">
            <h3 className="display-font text-2xl md:text-3xl font-black text-[#EBDCC4] tracking-widest uppercase mb-3">
              No Sessions Yet
            </h3>
            <p className="text-[#B6A596] text-sm leading-relaxed">
              Your performance metrics, skill analytics, and progress charts will appear here once you complete your first interview session.
            </p>
          </div>

          <button
            onClick={() => window.dispatchEvent(new Event('open_session_modal'))}
            className="group relative flex items-center gap-3 px-10 py-4 bg-[#DC9F85] text-[#181818] rounded-full font-black text-sm uppercase tracking-[0.2em] shadow-[0_0_30px_rgba(220,159,133,0.3)] hover:shadow-[0_0_50px_rgba(220,159,133,0.5)] hover:scale-105 transition-all duration-300"
          >
            <AnimatedIcon name="play_arrow" className="text-xl" />
            Start Your First Session
            <span className="absolute inset-0 rounded-full bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </button>

          <p className="text-[#66473B] text-[10px] uppercase tracking-widest mt-6 font-bold">
            AI-powered · Personalized · Real-time feedback
          </p>
        </div>
      ) : (<>

      {/* TOP MATRIX */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-6 md:mb-8">
        {/* Metric 01 */}
        <div className="dashboard-card dashboard-card-mobile flex flex-col justify-between">
          <div className="flex justify-between items-start mb-6 md:mb-12">
            <span className="text-[10px] uppercase tracking-[0.4em] text-[#B6A596]">Average Score</span>
            <div className="w-2 h-2 rounded-full bg-[#DC9F85] shadow-[0_0_8px_rgba(220,159,133,0.6)]"></div>
          </div>
          <div>
            <h3 className="display-font text-5xl md:text-7xl lg:text-8xl font-black text-[#EBDCC4] tracking-tighter">{stats?.averageScore?.toFixed(0) || 0}</h3>
            <span className="text-[10px] uppercase tracking-widest text-[#B6A596] block mt-2 md:mt-4">Global Percentile</span>
          </div>
        </div>

        {/* Metric 02 */}
        <div className="dashboard-card dashboard-card-mobile flex flex-col justify-between">
          <div className="flex justify-between items-start mb-6 md:mb-12">
            <span className="text-[10px] uppercase tracking-[0.4em] text-[#B6A596]">Sessions Completed</span>
          </div>
          <div>
            <h3 className="display-font text-5xl md:text-7xl lg:text-8xl font-black text-[#EBDCC4] tracking-tighter">{stats?.completedSessions || 0}</h3>
            <span className="text-[10px] uppercase tracking-widest text-[#B6A596] block mt-2 md:mt-4">Total Interviews</span>
          </div>
        </div>

        {/* Metric 03 */}
        <div className="dashboard-card dashboard-card-mobile flex flex-col justify-between">
          <div className="flex justify-between items-start mb-6 md:mb-12">
            <span className="text-[10px] uppercase tracking-[0.4em] text-[#B6A596]">Roles Practiced</span>
          </div>
          <div>
            <h3 className="display-font text-5xl md:text-7xl lg:text-8xl font-black text-[#EBDCC4] tracking-tighter">{stats?.distinctRolesPracticed || 0}</h3>
            <span className="text-[10px] uppercase tracking-widest text-[#B6A596] block mt-2 md:mt-4">Unique Job Profiles</span>
          </div>
        </div>
      </div>

      {/* ANALYTICS ENGINE */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mb-6 md:mb-8">
        {/* Skill Analytics */}
        <div className="dashboard-card dashboard-card-mobile flex flex-col">
          <div className="flex items-center justify-between mb-6 md:mb-12">
            <h3 className="text-[10px] uppercase tracking-[0.4em] text-[#B6A596]">Skill Analytics</h3>
            {latestReport && <span className="text-[10px] uppercase tracking-widest text-[#DC9F85] font-bold">LATEST SESSION</span>}
          </div>
          
          {latestReport ? (
          <div className="space-y-10">
            <div>
              <div className="flex justify-between items-end mb-3">
                <span className="text-[11px] uppercase tracking-widest text-[#EBDCC4]">Technical Depth</span>
                <span className="display-font text-xl font-bold text-[#DC9F85]">{latestReport.technicalScore}%</span>
              </div>
              <div className="progress-bar-container"><div className="progress-bar-fill" style={{width: `${latestReport.technicalScore}%`}}></div></div>
            </div>

            <div>
              <div className="flex justify-between items-end mb-3">
                <span className="text-[11px] uppercase tracking-widest text-[#EBDCC4]">Communication</span>
                <span className="display-font text-xl font-bold text-[#DC9F85]">{latestReport.communicationScore}%</span>
              </div>
              <div className="progress-bar-container"><div className="progress-bar-fill" style={{width: `${latestReport.communicationScore}%`}}></div></div>
            </div>

            <div>
              <div className="flex justify-between items-end mb-3">
                <span className="text-[11px] uppercase tracking-widest text-[#EBDCC4]">Problem Solving</span>
                <span className="display-font text-xl font-bold text-[#DC9F85]">{latestReport.problemSolvingScore}%</span>
              </div>
              <div className="progress-bar-container"><div className="progress-bar-fill" style={{width: `${latestReport.problemSolvingScore}%`}}></div></div>
            </div>

            <div>
              <div className="flex justify-between items-end mb-3">
                <span className="text-[11px] uppercase tracking-widest text-[#EBDCC4]">Relevance</span>
                <span className="display-font text-xl font-bold text-[#DC9F85]">{latestReport.relevanceScore}%</span>
              </div>
              <div className="progress-bar-container"><div className="progress-bar-fill" style={{width: `${latestReport.relevanceScore}%`}}></div></div>
            </div>

            <div>
              <div className="flex justify-between items-end mb-3">
                <span className="text-[11px] uppercase tracking-widest text-[#EBDCC4]">Confidence</span>
                <span className="display-font text-xl font-bold text-[#DC9F85]">{latestReport.confidenceScore}%</span>
              </div>
              <div className="progress-bar-container"><div className="progress-bar-fill" style={{width: `${latestReport.confidenceScore}%`}}></div></div>
            </div>
          </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center border border-[#66473B]/40 bg-[#181818] rounded-2xl relative z-10 min-h-[250px]">
                <AnimatedIcon name="radar" className="text-[#B6A596] text-4xl mb-4" />
                <p className="text-[#B6A596] text-xs font-bold tracking-widest uppercase mb-2">No Data Available</p>
                <p className="text-[#B6A596] text-[10px] uppercase">Complete an interview session.</p>
            </div>
          )}
        </div>

        {/* AI Performance Report */}
        <div className="dashboard-card dashboard-card-mobile flex flex-col">
          <div className="flex items-center justify-between mb-6 md:mb-12">
            <h3 className="text-[10px] uppercase tracking-[0.4em] text-[#DC9F85] font-bold">AI Performance Report</h3>
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-[#DC9F85] animate-pulse"></div>
              <span className="text-[10px] uppercase tracking-widest text-[#B6A596]">Generated Analysis</span>
            </div>
          </div>
          
          <div className="flex-1 space-y-8">
            {latestReport?.improvementTips || latestReport?.overallFeedback ? (
            <>
            <div>
              <span className="text-[10px] uppercase tracking-widest text-[#66473B] block mb-4">Core Strengths</span>
              <p className="text-lg font-light leading-relaxed text-[#EBDCC4]">
                {((latestReport as any).strengthsSummary || latestReport.overallFeedback || "Effective communication and structured context mapping.")}
              </p>
            </div>
            
            <div className="h-[1px] w-full bg-[#35211A]"></div>

            <div>
              <span className="text-[10px] uppercase tracking-widest text-[#66473B] block mb-4">Critical Improvement Areas</span>
              <p className="text-lg font-light leading-relaxed text-[#B6A596]">
                {(latestReport.improvementTips || "Focus closely on expanding your system design patterns and practicing real-time constraints.")}
              </p>
            </div>
            </>
            ) : (
                <p className="text-[#B6A596] text-xs font-bold tracking-widest uppercase bg-[#231E1A] p-8 rounded-xl border border-[#66473B]/40 text-center mt-4 border-dashed">
                    Report not generated.
                </p>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Row: Streak Tracking */}
      <div className="grid grid-cols-1 gap-4 md:gap-6 mb-6 md:mb-8">
        <div className="dashboard-card dashboard-card-mobile border-[#66473B]">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 md:gap-8 mb-6 md:mb-8">
            <div className="flex items-center gap-6 md:gap-12">
              <div className="flex flex-col">
                <span className="text-[10px] uppercase tracking-[0.4em] text-[#B6A596] mb-1 md:mb-2">Current Streak</span>
                <h4 className="display-font text-4xl md:text-6xl lg:text-7xl font-black text-[#DC9F85] tracking-tighter">{currentStreak} DAYS</h4>
              </div>
              <div className="h-8 md:h-12 w-[1px] bg-[#35211A] hidden md:block"></div>
              <div className="flex flex-col">
                <span className="text-[10px] uppercase tracking-[0.4em] text-[#B6A596] mb-1 md:mb-2">Total Active</span>
                <h4 className="display-font text-4xl md:text-6xl lg:text-7xl font-black text-[#EBDCC4] tracking-tighter">{totalActiveDays} DAYS</h4>
              </div>
            </div>
            
            <div className="w-full md:w-auto">
              <div className="flex items-center gap-2 md:justify-end">
                <span className="text-[10px] uppercase tracking-widest text-[#B6A596]">Protocol Consistency Rank:</span>
                <span className="text-[10px] uppercase tracking-widest text-[#DC9F85] font-bold">
                  {currentStreak >= 7 ? 'VANGUARD ELITE' : currentStreak >= 3 ? 'ACTIVE ROSTER' : 'INITIATE'}
                </span>
              </div>
            </div>
          </div>
          
          <div className="w-full flex-1 min-w-0">
            <div className="flex justify-between items-center mb-3">
                <p className="text-[#B6A596] text-[10px] font-bold uppercase tracking-[0.2em]">Last 6 months activity</p>
                <div className="flex items-center gap-1.5">
                  <span className="text-zinc-700 text-[9px] font-bold uppercase">Less</span>
                  {['bg-[#231E1A] border border-[#35211A]','bg-[#3D2920] border border-[#66473B]/60','bg-[#66473B]','bg-[#DC9F85] shadow-[0_0_8px_rgba(220,159,133,0.6)]'].map((c,i) => (
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
                          {ml && <span className="text-[9px] text-[#B6A596] font-bold uppercase">{ml.label}</span>}
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

      {/* PROGRESS CHART */}
      <div className="dashboard-card dashboard-card-mobile mb-6 md:mb-8 flex flex-col">
        <div className="flex items-center gap-3 mb-6">
          <AnimatedIcon name="trending_up" className="text-[#EBDCC4]" />
          <h3 className="text-[#EBDCC4] text-base md:text-xl font-black tracking-widest uppercase">Progress Over Time</h3>
          <span className="text-[#B6A596] text-[9px] md:text-[10px] font-bold uppercase tracking-widest ml-auto">Avg score · last 52 weeks</span>
        </div>
        {history.filter(h => h.status === 'COMPLETED').length === 0 ? (
          <div className="h-40 flex flex-col items-center justify-center border border-dashed border-[#66473B]/50 rounded-2xl">
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

      </>)}
      <Toaster position="top-center" theme="dark" richColors />
    </div>
  );
}
