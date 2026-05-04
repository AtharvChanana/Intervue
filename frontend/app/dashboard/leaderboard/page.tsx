"use client";

import { useEffect, useState } from "react";
import { fetchApi } from "@/lib/api";
import AnimatedIcon from '@/components/AnimatedIcon';
import UserAvatar from '@/components/UserAvatar';
import { Skeleton } from '@/components/ui/skeleton';

type LeaderboardUser = {
  name: string;
  email: string;
  currentJobRole: string;
  xp: number;
  profilePictureUrl: string | null;
};

export default function LeaderboardPage() {
  const [users, setUsers] = useState<LeaderboardUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentUserEmail, setCurrentUserEmail] = useState<string>("");

  useEffect(() => {
    async function loadData() {
      try {
        const [profile, leaderboard] = await Promise.all([
          fetchApi("/user/profile").catch(() => null),
          fetchApi("/interview/leaderboard")
        ]);
        if (profile) setCurrentUserEmail(profile.email);
        setUsers(leaderboard);
      } catch (err: any) {
        setError(err.message || "Failed to load leaderboard");
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto p-4 md:p-8 mt-24 space-y-6">
        <div className="text-center space-y-3 mb-12">
          <Skeleton className="h-10 w-64 mx-auto rounded-xl" />
          <Skeleton className="h-4 w-96 mx-auto rounded-lg" />
        </div>
        <div className="flex justify-center items-end gap-6 mb-12">
          {[1, 0, 2].map((i) => (
            <div key={i} className="flex flex-col items-center gap-3">
              <Skeleton className={`rounded-full ${i === 0 ? 'w-28 h-28' : 'w-20 h-20'}`} />
              <Skeleton className={`rounded-2xl w-32 ${i === 0 ? 'h-44' : 'h-32'}`} />
            </div>
          ))}
        </div>
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-16 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 max-w-4xl mx-auto mt-10 bg-red-500/10 border border-red-500/20 rounded-xl text-center">
        <h2 className="text-red-500 font-bold mb-2">Error Loading Leaderboard</h2>
        <p className="text-red-400/80 text-sm">{error}</p>
      </div>
    );
  }

  const topThree = users.slice(0, 3);
  const restOfUsers = users.slice(3);

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-8 mt-24">
      <div className="mb-12 text-center">
        <h1 className="text-4xl md:text-5xl font-black text-[#EBDCC4] tracking-widest uppercase mb-4">
          Global <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-500 to-amber-300">Rankings</span>
        </h1>
        <p className="text-[#B6A596] text-sm uppercase tracking-widest max-w-2xl mx-auto">
          Complete Mock Interviews and Code Assessments to earn XP and climb the leaderboard.
        </p>
      </div>

      {/* Top 3 Podium */}
      <div className="flex flex-col md:flex-row justify-center items-end gap-6 mb-16">
        {/* Silver (2nd) */}
        {topThree[1] && (
          <div className="flex flex-col items-center order-2 md:order-1 animate-in slide-in-from-bottom-8 duration-700 delay-100">
            <div className="text-[#EBDCC4] mb-2 font-bold text-lg"><AnimatedIcon name="workspace_premium" className="text-3xl" /></div>
            <UserAvatar
              name={topThree[1].name}
              profilePictureUrl={topThree[1].profilePictureUrl}
              className="w-20 h-20 border-4 border-zinc-300 shadow-[0_0_30px_rgba(212,212,216,0.2)] mb-4"
              fallbackClassName="text-lg"
            />
            <div className="bg-gradient-to-t from-[#1F1A17] to-[#1F1A17]/20 border border-[#66473B]/40 rounded-t-2xl w-32 md:h-32 p-4 text-center flex flex-col items-center justify-start">
              <span className="font-bold text-[#EBDCC4] text-sm truncate w-full">{topThree[1].name}</span>
              <span className="text-[#B6A596] text-[10px] uppercase font-bold tracking-widest mt-1">{topThree[1].xp} XP</span>
              <span className="text-[60px] font-black text-zinc-700/50 -mt-2">2</span>
            </div>
          </div>
        )}

        {/* Gold (1st) */}
        {topThree[0] && (
          <div className="flex flex-col items-center order-1 md:order-2 z-10 animate-in slide-in-from-bottom-12 duration-700">
            <div className="text-[#DC9F85] mb-2 font-bold text-xl drop-shadow-[0_0_15px_rgba(250,204,21,0.5)]"><AnimatedIcon name="military_tech" className="text-5xl" /></div>
            <UserAvatar
              name={topThree[0].name}
              profilePictureUrl={topThree[0].profilePictureUrl}
              className="w-28 h-28 border-4 border-[#DC9F85] shadow-[0_0_40px_rgba(250,204,21,0.3)] mb-4"
              fallbackClassName="text-2xl"
            />
            <div className="bg-gradient-to-t from-yellow-500/20 to-yellow-500/5 border border-[#DC9F85]/30 rounded-t-2xl w-40 md:h-44 p-4 text-center flex flex-col items-center justify-start relative overflow-hidden">
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(250,204,21,0.1),transparent_50%)]"></div>
              <span className="font-bold text-[#EBDCC4] text-base truncate w-full relative">{topThree[0].name}</span>
              <span className="text-[#DC9F85]/80 text-[11px] uppercase font-bold tracking-widest mt-1 relative">{topThree[0].xp} XP</span>
              <span className="text-[80px] font-black text-[#DC9F85]/10 -mt-4 relative">1</span>
            </div>
          </div>
        )}

        {/* Bronze (3rd) */}
        {topThree[2] && (
          <div className="flex flex-col items-center order-3 md:order-3 animate-in slide-in-from-bottom-4 duration-700 delay-200">
            <div className="text-amber-600 mb-2 font-bold text-lg"><AnimatedIcon name="workspace_premium" className="text-3xl" /></div>
            <UserAvatar
              name={topThree[2].name}
              profilePictureUrl={topThree[2].profilePictureUrl}
              className="w-20 h-20 border-4 border-[#66473B] shadow-[0_0_30px_rgba(217,119,6,0.2)] mb-4"
              fallbackClassName="text-lg"
            />
            <div className="bg-gradient-to-t from-amber-900/40 to-amber-900/10 border border-[#66473B]/10 rounded-t-2xl w-32 md:h-24 p-4 text-center flex flex-col items-center justify-start">
              <span className="font-bold text-[#EBDCC4] text-sm truncate w-full">{topThree[2].name}</span>
              <span className="text-[#B6A596]/80 text-[10px] uppercase font-bold tracking-widest mt-1">{topThree[2].xp} XP</span>
              <span className="text-[50px] font-black text-amber-700/30 -mt-2">3</span>
            </div>
          </div>
        )}
      </div>

      {/* Rest of the List */}
      <div className="max-w-3xl mx-auto space-y-3">
        <div className="flex items-center px-6 py-3 text-[10px] uppercase tracking-widest font-bold text-[#B6A596]">
          <div className="w-12 text-center">Rank</div>
          <div className="flex-1 px-4">Interviewer</div>
          <div className="w-24 text-right">XP</div>
        </div>

        {restOfUsers.length === 0 && topThree.length === 0 && (
          <div className="text-center p-12 text-[#B6A596]">No ranked users yet. Be the first!</div>
        )}

        {restOfUsers.map((user, idx) => {
          const rank = idx + 4;
          const isMe = user.email === currentUserEmail;
          return (
            <div key={user.email} className={`flex items-center bg-[#1F1A17] border ${isMe ? 'border-[#66473B] bg-[#1F1A17] relative overflow-hidden' : 'border-[#66473B]/40'} hover:bg-[#151515] transition-colors rounded-xl p-4`}>
              {isMe && <div className="absolute left-0 top-0 bottom-0 w-1 bg-white"></div>}
              <div className="w-12 text-center text-[#B6A596] font-bold text-sm">#{rank}</div>
              <div className="flex-1 flex items-center gap-4 px-4">
                <UserAvatar
                  name={user.name}
                  profilePictureUrl={user.profilePictureUrl}
                  className="w-10 h-10"
                />
                <div className="flex flex-col">
                  <span className={`font-bold text-sm ${isMe ? 'text-[#EBDCC4]' : 'text-[#EBDCC4]'} truncate`}>
                    {user.name} {isMe && <span className="ml-2 text-[9px] uppercase bg-[#DC9F85] text-[#181818] px-1.5 py-0.5 rounded tracking-widest">You</span>}
                  </span>
                  <span className="text-[#B6A596] text-[10px] uppercase tracking-widest truncate">{user.currentJobRole || 'Candidate'}</span>
                </div>
              </div>
              <div className="w-24 text-right">
                <div className="font-black text-[#EBDCC4] tabular-nums tracking-widest">{user.xp.toLocaleString()}</div>
                <div className="text-[#B6A596] text-[9px] uppercase tracking-widest font-bold">XP</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
