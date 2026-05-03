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
  type: 'interview';
}

interface DsaSessionSummary {
  sessionId: number;
  topic: string;
  difficulty: string;
  status: string;
  score: number | null;
  createdAt: string;
  completedAt: string | null;
  type: 'dsa';
}

type AnySession = SessionSummary | DsaSessionSummary;

export default function SessionsArchivePage() {
  const router = useRouter();
  const [sessions, setSessions] = useState<SessionSummary[]>([]);
  const [dsaSessions, setDsaSessions] = useState<DsaSessionSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'interview' | 'dsa'>('all');

  useEffect(() => {
    const loadSessions = async () => {
      try {
        const [interviewData, dsaData] = await Promise.all([
          fetchApi('/interview/all?t=' + new Date().getTime()),
          fetchApi('/dsa/all?t=' + new Date().getTime()).catch(() => []),
        ]);

        if (interviewData && interviewData.API_CRASH_DEBUG_FLAG) {
          setApiError(interviewData.error);
          setSessions([]);
        } else {
          setSessions((interviewData || []).map((s: any) => ({ ...s, type: 'interview' })));
        }

        setDsaSessions((Array.isArray(dsaData) ? dsaData : []).map((s: any) => ({ ...s, type: 'dsa' })));
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

  const allSessions: AnySession[] = [
    ...sessions,
    ...dsaSessions,
  ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const filteredSessions = activeTab === 'all' ? allSessions
    : activeTab === 'interview' ? sessions
    : dsaSessions;

  const handleRowClick = (session: AnySession) => {
    if (session.type === 'interview') {
      if (session.status === 'COMPLETED' || session.status === 'IN_PROGRESS') {
        router.push(`/dashboard/session/${session.sessionId}`);
      }
    } else {
      router.push(`/dashboard/dsa/${session.sessionId}`);
    }
  };

  const getScore = (session: AnySession) => {
    if (session.type === 'interview') return session.totalScore;
    return session.score;
  };

  const getLabel = (session: AnySession) => {
    if (session.type === 'interview') {
      return session.jobRole || 'Practice Interview';
    }
    return session.topic?.replace(/_/g, ' ') || 'Algorithm Challenge';
  };

  const getTypeTag = (session: AnySession) => {
    if (session.type === 'dsa') {
      return <span className="px-2 py-1 bg-purple-500/10 text-purple-400 rounded text-[10px] uppercase font-bold tracking-wider">DSA</span>;
    }
    return <span className="px-2 py-1 bg-white/10 rounded text-[10px] uppercase font-bold text-white tracking-wider">{session.interviewType}</span>;
  };

  return (
    <div className="max-w-6xl mx-auto pb-20 animate-in fade-in duration-500">
      <div className="mb-10">
        <h2 className="text-3xl font-black text-white mb-2">Session Archive</h2>
        <p className="text-zinc-500 text-sm">Review your historical mock interviews, coding assessments, and AI evaluations.</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        {(['all', 'interview', 'dsa'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-colors ${
              activeTab === tab
                ? 'bg-white text-black'
                : 'bg-white/5 text-zinc-400 hover:bg-white/10 hover:text-white'
            }`}
          >
            {tab === 'all' ? 'All Sessions' : tab === 'interview' ? 'Interviews' : 'DSA Assessments'}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-4 border-white/20 border-t-white rounded-full animate-spin"></div>
        </div>
      ) : filteredSessions.length === 0 ? (
        <div className="bg-black border border-white/10 rounded-2xl p-16 text-center">
          <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6">
            <AnimatedIcon name="history" className="text-4xl text-zinc-600" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">No History Found</h3>
          <p className="text-zinc-500 text-sm mb-8">
            {activeTab === 'dsa' ? "You haven't completed any coding assessments yet." : "You haven't completed any mock sessions yet."} Start one to begin your journey.
          </p>
        </div>
      ) : (
        <div className="bg-black border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead className="bg-black border-b border-white/10">
                <tr>
                  <th className="p-6 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Date</th>
                  <th className="p-6 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Title</th>
                  <th className="p-6 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Type / Difficulty</th>
                  <th className="p-6 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Status</th>
                  <th className="p-6 text-[10px] font-bold text-zinc-500 uppercase tracking-widest text-right">Score</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredSessions.map((session, idx) => {
                  const score = getScore(session);
                  const isClickable = session.type === 'dsa' || session.status === 'COMPLETED' || session.status === 'IN_PROGRESS';
                  return (
                    <tr
                      key={`${session.type}-${session.sessionId}-${idx}`}
                      onClick={() => handleRowClick(session)}
                      className={`group transition-colors ${
                        isClickable
                          ? 'hover:bg-white/[0.02] cursor-pointer'
                          : 'opacity-50 grayscale cursor-not-allowed'
                      }`}
                    >
                      <td className="p-6">
                        <span className="text-sm font-medium text-white">{formatDate(session.createdAt)}</span>
                      </td>
                      <td className="p-6">
                        <span className="text-sm text-zinc-300 font-bold">{getLabel(session)}</span>
                      </td>
                      <td className="p-6">
                        <div className="flex items-center gap-2">
                          {getTypeTag(session)}
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
                        {score != null ? (
                          <div className="inline-flex items-end gap-1">
                            <span className="text-2xl font-black text-white">{Number(score).toFixed(0)}</span>
                            <span className="text-zinc-500 text-[10px] uppercase tracking-widest font-bold mb-1">/ 100</span>
                          </div>
                        ) : (
                          <span className="text-sm text-zinc-600 font-medium">--</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {apiError && (
        <p className="text-red-400 text-xs mt-4 font-bold">API Error: {apiError}</p>
      )}
    </div>
  );
}
