"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { fetchApi } from '@/lib/api';
import AnimatedIcon from '@/components/AnimatedIcon';

interface SessionSummary {
  sessionId: number;
  jobRole: string;
  difficulty: string;
  interviewType: string;
  status: string;
  totalQuestions: number;
  totalScore: number | null;
  createdAt: string;
  completedAt: string | null;
}

export default function SessionsArchivePage() {
  const router = useRouter();
  const [sessions, setSessions] = useState<SessionSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);

  useEffect(() => {
    const loadSessions = async () => {
      try {
        const data = await fetchApi('/interview/all?t=' + new Date().getTime());
        if (data && data.API_CRASH_DEBUG_FLAG) {
           setApiError(data.error);
           setSessions([]);
        } else {
           setSessions(data);
        }
      } catch (e: any) {
        console.error("Failed to load sessions:", e);
        setApiError(e.message || "Unknown API Error");
      } finally {
        setIsLoading(false);
      }
    };
    loadSessions();
  }, []);

  const formatDate = (dateStr: string) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric'
    }).format(new Date(dateStr));
  };

  return (
    <div className="max-w-6xl mx-auto pb-20 animate-in fade-in duration-500">
      <div className="mb-10">
        <h2 className="text-3xl font-black text-white mb-2">Session Archive</h2>
        <p className="text-zinc-500 text-sm">Review your historical mock interviews, performance analytics, and AI evaluations.</p>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-4 border-white/20 border-t-white rounded-full animate-spin"></div>
        </div>
      ) : sessions.length === 0 ? (
        <div className="bg-black border border-white/10 rounded-2xl p-16 text-center">
          <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6">
            <AnimatedIcon name="history" className="text-4xl text-zinc-600" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">No History Found</h3>
          <p className="text-zinc-500 text-sm mb-8">You haven't completed any mock sessions yet. Start a new session to begin your journey.</p>
        </div>
      ) : (
        <div className="bg-black border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead className="bg-black border-b border-white/10">
                <tr>
                  <th className="p-6 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Date</th>
                  <th className="p-6 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Job Role</th>
                  <th className="p-6 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Type / Difficulty</th>
                  <th className="p-6 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Status</th>
                  <th className="p-6 text-[10px] font-bold text-zinc-500 uppercase tracking-widest text-right">Score</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {sessions.map((session) => (
                  <tr 
                    key={session.sessionId} 
                    onClick={() => {
                        if (session.status === 'COMPLETED' || session.status === 'IN_PROGRESS') {
                            router.push(`/dashboard/session/${session.sessionId}`);
                        }
                    }}
                    className={`group transition-colors ${
                      session.status === 'COMPLETED' || session.status === 'IN_PROGRESS' 
                      ? 'hover:bg-white/[0.02] cursor-pointer' 
                      : 'opacity-50 grayscale cursor-not-allowed'
                    }`}
                  >
                    <td className="p-6">
                      <span className="text-sm font-medium text-white">{formatDate(session.createdAt)}</span>
                    </td>
                    <td className="p-6">
                      <span className="text-sm text-zinc-300 font-bold">{session.jobRole}</span>
                    </td>
                    <td className="p-6">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-1 bg-white/10 rounded text-[10px] uppercase font-bold text-white tracking-wider">{session.interviewType}</span>
                        <span className={`px-2 py-1 rounded text-[10px] uppercase font-bold tracking-wider ${
                          session.difficulty === 'HARD' ? 'bg-red-500/10 text-red-400' :
                          session.difficulty === 'MEDIUM' ? 'bg-amber-500/10 text-amber-400' :
                          'bg-emerald-500/10 text-emerald-400'
                        }`}>
                          {session.difficulty}
                        </span>
                      </div>
                    </td>
                    <td className="p-6">
                      <div className="flex items-center gap-2">
                        {session.status === 'COMPLETED' && <span className="w-2 h-2 rounded-full bg-emerald-500"></span>}
                        {session.status === 'IN_PROGRESS' && <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>}
                        {session.status === 'ABANDONED' && <span className="w-2 h-2 rounded-full bg-red-500"></span>}
                        <span className="text-xs font-bold text-zinc-400">{session.status.replace('_', ' ')}</span>
                      </div>
                    </td>
                    <td className="p-6 text-right">
                      {session.totalScore ? (
                         <div className="inline-flex items-end gap-1">
                             <span className="text-2xl font-black text-white">{session.totalScore.toFixed(0)}</span>
                             <span className="text-zinc-500 text-[10px] uppercase tracking-widest font-bold mb-1">/ 100</span>
                         </div>
                      ) : (
                         <span className="text-sm text-zinc-600 font-medium">--</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
