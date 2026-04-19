"use client";
import { useEffect, useState } from 'react';
import { fetchApi } from '@/lib/api';

interface LeaderboardEntry {
  name: string;
  email: string;
  currentJobRole: string;
  totalScore: number;
  profilePictureUrl: string;
}

export default function LeaderboardPage() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const [res, user] = await Promise.all([
          fetchApi('/interview/leaderboard'),
          fetchApi('/user/profile').catch(() => null)
        ]);
        let sorted = Array.isArray(res) ? res : [];
        sorted.sort((a,b) => b.totalScore - a.totalScore);
        setLeaderboard(sorted);
        if (user) setCurrentUser(user);
      } catch (e: any) {
        console.error("Leaderboard fetch failed", e);
      } finally {
        setIsLoading(false);
      }
    };
    fetchLeaderboard();
  }, []);

  const totalPages = Math.ceil(leaderboard.length / itemsPerPage);
  const paginatedData = leaderboard.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  
  const userGlobalIdx = currentUser != null ? leaderboard.findIndex(e => e.email === currentUser.email) : -1;

  const getRankStyle = (globalIdx: number) => {
    if (globalIdx === 0) {
      return {
        bg: 'bg-gradient-to-br from-yellow-300 via-amber-500 to-yellow-600',
        text: 'text-black',
        shadow: 'shadow-[0_0_30px_rgba(251,191,36,0.6)]',
        scale: 'scale-125 z-10',
        icon: '👑', // Gold crown
        rowStyle: 'bg-amber-500/5 hover:bg-amber-500/10 border-l-[3px] border-amber-400'
      };
    } else if (globalIdx === 1) {
      return {
        bg: 'bg-gradient-to-br from-gray-200 via-zinc-400 to-gray-500',
        text: 'text-black',
        shadow: 'shadow-[0_0_20px_rgba(212,212,216,0.5)]',
        scale: 'scale-110 z-10',
        icon: '🥈', // Silver Medallion
        rowStyle: 'bg-zinc-400/5 hover:bg-zinc-400/10 border-l-[3px] border-zinc-300'
      };
    } else if (globalIdx === 2) {
      return {
        bg: 'bg-gradient-to-br from-orange-300 via-[#CD7F32] to-orange-800',
        text: 'text-black',
        shadow: 'shadow-[0_0_20px_rgba(205,127,50,0.4)]',
        scale: 'scale-110 z-10',
        icon: '🥉', // Bronze Medallion
        rowStyle: 'bg-[#CD7F32]/5 hover:bg-[#CD7F32]/10 border-l-[3px] border-[#CD7F32]'
      };
    }
    return {
      bg: 'bg-white/5 border border-white/10',
      text: 'text-zinc-400 font-bold',
      shadow: '',
      scale: '',
      icon: `${globalIdx + 1}`,
      rowStyle: 'hover:bg-white/[0.03]'
    };
  };

  if (isLoading) {
    return <div className="p-8 text-white animate-pulse tracking-widest uppercase text-xs font-bold w-full text-center mt-20">Syncing Global Rankings...</div>;
  }

  return (
    <div className="p-8 pb-32 animate-in fade-in duration-500">
      <div className="max-w-4xl mx-auto">
        
        <div className="flex flex-col items-center justify-center text-center mb-16 mt-8">
            <div className="mb-6 relative">
                <div className="absolute inset-0 bg-blue-500 blur-[80px] opacity-20 rounded-full"></div>
                <span className="material-symbols-outlined text-6xl text-white drop-shadow-[0_0_30px_rgba(255,255,255,0.8)] relative z-10">military_tech</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white to-white/50 uppercase tracking-[0.2em] mb-4 drop-shadow-2xl">
              Global Leaderboard
            </h1>
            <p className="text-zinc-400 text-sm tracking-wider max-w-lg">Rankings are evaluated against thousands of interactive simulations across the Mock Interview neural network.</p>
        </div>

        {currentUser && userGlobalIdx !== -1 && (
            <div className="mb-8 p-5 md:p-6 bg-white/[0.02] border border-white/5 rounded-2xl flex flex-col md:flex-row items-center justify-between backdrop-blur-xl animate-in fade-in duration-700 shadow-2xl relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.03] to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
                <div className="flex items-center gap-5 relative z-10">
                    <div className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-lg font-medium text-white shadow-inner">
                        #{userGlobalIdx + 1}
                    </div>
                    <div className="text-left">
                        <p className="text-zinc-500 text-[10px] uppercase tracking-[0.2em] font-semibold pb-1">Current Standing</p>
                        <p className="text-white text-lg font-medium tracking-wide">{currentUser.name}</p>
                    </div>
                </div>
                <div className="text-center md:text-right mt-4 md:mt-0 relative z-10">
                    <p className="text-zinc-500 text-[10px] uppercase tracking-[0.2em] font-semibold pb-1">Total Score</p>
                    <p className="text-white text-2xl font-light tracking-widest">{leaderboard[userGlobalIdx].totalScore.toFixed(0)}</p>
                </div>
            </div>
        )}

        <div className="bg-black/80 border border-white/10 rounded-3xl overflow-hidden shadow-[0_0_80px_rgba(0,0,0,0.8)] backdrop-blur-xl transition-all duration-500">
          <div className="overflow-x-auto min-h-[500px]">
              <table className="w-full text-left border-collapse whitespace-nowrap">
                <thead>
                  <tr className="bg-white/[0.02] border-b border-white/10 text-[10px] text-zinc-500 font-black tracking-[0.2em] uppercase">
                    <th className="py-6 px-8 w-24 text-center">Rank</th>
                    <th className="py-6 px-8">Candidate Profile</th>
                    <th className="py-6 px-8 hidden sm:table-cell">Target Domain</th>
                    <th className="py-6 px-8 text-right">Top Score</th>
                  </tr>
                </thead>
                <tbody className="relative">
                  {leaderboard.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-24 text-center text-zinc-500 text-sm tracking-widest uppercase font-bold animate-pulse">
                        No rankings established yet. Be the first!
                      </td>
                    </tr>
                  ) : (
                    paginatedData.map((entry, relativeIdx) => {
                      const globalIdx = (currentPage - 1) * itemsPerPage + relativeIdx;
                      const style = getRankStyle(globalIdx);
                      const isCurrentUser = currentUser && entry.email === currentUser.email;
                      
                      return (
                        <tr key={globalIdx} className={`border-b transition-all duration-300 ${isCurrentUser ? 'bg-white/[0.06] hover:bg-white/[0.08] relative z-10 border-l-[3px] border-white' : style.rowStyle} ${globalIdx < 3 ? 'border-none' : 'border-white/5'}`}>
                          <td className="py-5 px-8 text-center flex justify-center items-center h-full min-h-[70px]">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm md:text-base transition-all duration-500 ${style.bg} ${style.text} ${style.shadow} ${style.scale}`}>
                              <span className={globalIdx < 3 ? "animate-bounce mt-1" : ""}>{style.icon}</span>
                            </div>
                          </td>
                          <td className="py-5 px-8">
                            <div className="flex items-center gap-5">
                              <div className="relative">
                                  {globalIdx === 0 && <div className="absolute inset-0 bg-amber-400 blur-md opacity-40 rounded-full animate-pulse"></div>}
                                  {entry.profilePictureUrl ? (
                                      <img src={entry.profilePictureUrl} alt={entry.name} className={`w-12 h-12 rounded-full object-cover border-2 relative z-10 ${globalIdx === 0 ? 'border-amber-400' : 'border-white/10'}`} />
                                  ) : (
                                      <div className={`w-12 h-12 rounded-full relative z-10 flex items-center justify-center text-white font-black text-lg border-2 ${globalIdx === 0 ? 'bg-amber-900/50 border-amber-400' : 'bg-white/5 border-white/20'}`}>
                                          {entry.name.charAt(0).toUpperCase()}
                                      </div>
                                  )}
                              </div>
                              <span className={`font-black text-sm md:text-base tracking-wide ${globalIdx === 0 ? 'text-transparent bg-clip-text bg-gradient-to-r from-amber-200 to-yellow-500 drop-shadow-[0_0_10px_rgba(251,191,36,0.3)]' : globalIdx < 3 ? 'text-white' : 'text-zinc-300'}`}>
                                {entry.name}
                              </span>
                            </div>
                          </td>
                          <td className="py-5 px-8 text-zinc-400 text-[10px] sm:text-xs font-bold tracking-[0.1em] uppercase hidden sm:table-cell">
                            {entry.currentJobRole || 'Software Engineer'}
                          </td>
                          <td className="py-5 px-8 text-right">
                            <span className={`font-black tracking-[0.1em] ${globalIdx === 0 ? 'text-amber-400 text-2xl md:text-3xl drop-shadow-[0_0_15px_rgba(251,191,36,0.6)]' : globalIdx === 1 ? 'text-zinc-300 text-xl md:text-2xl drop-shadow-[0_0_10px_rgba(255,255,255,0.4)]' : globalIdx === 2 ? 'text-[#CD7F32] text-xl md:text-2xl drop-shadow-[0_0_10px_rgba(205,127,50,0.4)]' : 'text-white/80 text-lg md:text-xl'}`}>
                              {entry.totalScore?.toFixed(0)}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
              <div className="bg-black border-t border-white/10 py-4 px-8 flex items-center justify-between">
                  <p className="text-zinc-500 text-xs font-bold tracking-widest uppercase">
                      Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, leaderboard.length)} of {leaderboard.length}
                  </p>
                  <div className="flex gap-2">
                      <button 
                          onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                          disabled={currentPage === 1}
                          className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center text-white disabled:opacity-20 hover:bg-white/10 transition-colors"
                      >
                          <span className="material-symbols-outlined text-sm">chevron_left</span>
                      </button>
                      <button 
                          onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                          disabled={currentPage === totalPages}
                          className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center text-white disabled:opacity-20 hover:bg-white/10 transition-colors"
                      >
                          <span className="material-symbols-outlined text-sm">chevron_right</span>
                      </button>
                  </div>
              </div>
          )}
        </div>
      </div>
    </div>
  );
}
