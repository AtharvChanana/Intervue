"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { fetchApi } from "@/lib/api";
import Editor, { useMonaco } from "@monaco-editor/react";

export default function DsaSessionPage() {
  const { id } = useParams();
  const router = useRouter();
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  // Editor State
  const [language, setLanguage] = useState("python");
  const [code, setCode] = useState("# Write your solution here\n");
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Report State
  const [report, setReport] = useState<any>(null);

  // Timer state
  const [timeLeft, setTimeLeft] = useState<number | null>(null);

  // Hints
  const [hintsRevealed, setHintsRevealed] = useState(0);

  useEffect(() => {
    loadSession();
  }, [id]);

  useEffect(() => {
    if (timeLeft !== null && timeLeft > 0 && session?.status !== "COMPLETED") {
      const timer = setInterval(() => setTimeLeft((prev) => (prev ? prev - 1 : 0)), 1000);
      return () => clearInterval(timer);
    } else if (timeLeft === 0 && session?.status !== "COMPLETED" && !isSubmitting) {
      handleSubmit(); // auto submit
    }
  }, [timeLeft, session, isSubmitting]);

  const loadSession = async () => {
    try {
      setLoading(true);
      const res = await fetchApi(`/dsa/${id}/report`);
      setSession(res);
      if (res.status === "COMPLETED") {
        setReport(res.evaluation);
        setCode(res.code || "");
        setLanguage(res.language || "python");
      } else {
        // Init timer based on createdAt + timerMinutes
        if (res.problem?.timerMinutes) {
           // We'll just use a local timer for now, real implementation would sync with server
           setTimeLeft(res.problem.timerMinutes * 60);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      const res = await fetchApi(`/dsa/${id}/submit`, {
        method: "POST",
        body: JSON.stringify({ code, language })
      });
      setSession(res);
      setReport(res.evaluation);
    } catch (err) {
      console.error(err);
      alert("Failed to submit code. " + err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  // Editor language mapping for Monaco
  const getMonacoLanguage = (lang: string) => {
    switch (lang) {
      case "python": return "python";
      case "javascript": return "javascript";
      case "java": return "java";
      case "cpp": return "cpp";
      default: return "python";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center p-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(59,130,246,0.15),transparent_50%)]"></div>
        <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin z-10 mb-6"></div>
        <p className="text-blue-500 font-bold uppercase tracking-[0.3em] animate-pulse z-10 relative text-sm">
          Generating Problem
          <span className="absolute -top-1 -right-4 w-2 h-2 bg-white rounded-full animate-ping"></span>
        </p>
      </div>
    );
  }

  if (!session || !session.problem) {
    return <div className="p-8 text-white">Error loading problem.</div>;
  }

  const { problem } = session;
  const isCompleted = session.status === "COMPLETED";

  return (
    <div className="h-screen flex flex-col bg-[#0A0A0A] text-white overflow-hidden font-sans">
      
      {/* Top Navbar */}
      <header className="h-14 border-b border-white/10 flex items-center justify-between px-6 bg-black shrink-0">
        <div className="flex items-center gap-4">
          <button onClick={() => router.push('/dashboard')} className="text-zinc-500 hover:text-white transition-colors">
             <span className="material-symbols-outlined text-sm">arrow_back</span>
          </button>
          <div className="h-4 w-[1px] bg-white/20"></div>
          <h1 className="font-bold text-sm tracking-wide text-zinc-200">
            {problem.title || "Algorithm Challenge"}
          </h1>
          {problem.difficulty && (
            <span className={`text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded-full bg-white/5 border border-white/10 ${
                problem.difficulty === 'HARD' ? 'text-red-400' : problem.difficulty === 'MEDIUM' ? 'text-yellow-400' : 'text-green-400'
            }`}>
              {problem.difficulty}
            </span>
          )}
        </div>

        <div className="flex items-center gap-4 border border-white/10 p-1 rounded-xl bg-[#111]">
          {timeLeft !== null && !isCompleted && (
            <div className={`px-4 py-1.5 flex items-center gap-2 rounded-lg ${timeLeft < 300 ? 'text-red-400 bg-red-500/10' : 'text-zinc-400'}`}>
               <span className="material-symbols-outlined text-[14px]">timer</span>
               <span className="font-mono text-xs font-bold tracking-widest leading-none">{formatTime(timeLeft)}</span>
            </div>
          )}
          
          <button 
            disabled={isCompleted || isSubmitting}
            onClick={handleSubmit} 
            className={`flex items-center gap-2 px-6 py-2 rounded-lg font-bold text-[10px] uppercase tracking-widest transition-transform leading-none ${
              isCompleted 
                ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed' 
                : 'bg-green-600/20 text-green-400 border border-green-500/30 hover:bg-green-600/30 hover:scale-105'
            }`}
          >
             <span className="material-symbols-outlined text-[14px] leading-none">play_arrow</span>
             {isSubmitting ? "Running..." : isCompleted ? "Submitted" : "Run Code"}
          </button>
        </div>
      </header>

      {/* Main Content Workspace */}
      <div className="flex flex-1 overflow-hidden h-[calc(100vh-3.5rem)]">
        
        {/* Left Side: Problem Description */}
        <div className="w-[45%] border-r border-white/10 flex flex-col bg-[#0A0A0A] overflow-y-auto custom-scrollbar">
          
          {/* If completed, show Report Banner on top */}
          {isCompleted && report && (
            <div className="m-4 p-5 rounded-xl border bg-black border-white/10 shadow-[0_4px_20px_rgba(0,0,0,0.5)]">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold uppercase tracking-widest text-[#3b82f6] text-xs">Evaluation Results</h3>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-zinc-500 uppercase tracking-widest">Score</span>
                  <span className={`font-mono text-xl font-bold ${report.score >= 80 ? 'text-green-400' : report.score >= 50 ? 'text-yellow-400' : 'text-red-400'}`}>
                    {report.score}/100
                  </span>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="bg-[#111] border border-white/5 p-3 rounded-lg flex items-center justify-between">
                   <span className="text-[10px] text-zinc-500 uppercase tracking-widest">Time</span>
                   <span className="font-mono text-xs font-bold text-white tracking-widest">{report.timeComplexity || "N/A"}</span>
                </div>
                <div className="bg-[#111] border border-white/5 p-3 rounded-lg flex items-center justify-between">
                   <span className="text-[10px] text-zinc-500 uppercase tracking-widest">Space</span>
                   <span className="font-mono text-xs font-bold text-white tracking-widest">{report.spaceComplexity || "N/A"}</span>
                </div>
              </div>

              <div className="text-sm text-zinc-300 leading-relaxed bg-[#111] border border-white/5 p-4 rounded-lg mb-4">
                {report.feedback}
              </div>

              {report.testResults && report.testResults.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest mb-2">Test Cases</h4>
                  {report.testResults.map((tc: any, i: number) => (
                    <div key={i} className={`p-3 rounded-lg border flex flex-col gap-2 ${tc.passed ? 'border-green-500/20 bg-green-500/5' : 'border-red-500/20 bg-red-500/5'}`}>
                      <div className="flex items-center gap-2">
                         <span className={`material-symbols-outlined text-[14px] ${tc.passed ? 'text-green-400' : 'text-red-400'}`}>
                            {tc.passed ? 'check_circle' : 'cancel'}
                         </span>
                         <span className="font-bold text-xs uppercase tracking-widest text-zinc-200">{tc.name}</span>
                      </div>
                      <p className="text-[11px] text-zinc-500 font-mono tracking-tight">{tc.details}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Problem Body */}
          <div className="p-6">
            <h2 className="text-2xl font-black mb-6">{problem.title}</h2>
            
            <div className="prose prose-invert max-w-none text-zinc-300 text-sm leading-relaxed mb-8"
                 dangerouslySetInnerHTML={{__html: problem.description}}>
            </div>

            {/* Examples */}
            {problem.examples && problem.examples.length > 0 && (
              <div className="mb-8 space-y-4">
                <h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em] mb-4">Examples</h3>
                {problem.examples.map((ex: any, i: number) => (
                  <div key={i} className="bg-[#111] border border-white/10 rounded-xl p-4 font-mono text-xs space-y-2">
                    <div><span className="text-zinc-500 tracking-widest font-bold">Input:</span> <span className="text-zinc-300">{ex.input}</span></div>
                    <div><span className="text-zinc-500 tracking-widest font-bold">Output:</span> <span className="text-blue-300">{ex.output}</span></div>
                    {ex.explanation && (
                      <div className="pt-2 border-t border-white/5 mt-2 text-zinc-400 whitespace-pre-wrap"><span className="text-zinc-500 tracking-widest font-bold">Explanation:</span><br/>{ex.explanation}</div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Constraints */}
            {problem.constraints && problem.constraints.length > 0 && (
              <div className="mb-8">
                <h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em] mb-4">Constraints</h3>
                <ul className="list-disc list-inside space-y-1">
                  {problem.constraints.map((c: string, i: number) => (
                    <li key={i} className="text-xs font-mono text-zinc-400 bg-white/5 inline-block px-3 py-1 rounded-md mb-2 mr-2 border border-white/5">{c}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Hints */}
            {problem.hints && problem.hints.length > 0 && !isCompleted && (
              <div className="mb-8 border-t border-white/10 pt-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em]">Hints</h3>
                  <span className="text-[10px] text-zinc-600 font-bold">{hintsRevealed} / {problem.hints.length}</span>
                </div>
                <div className="space-y-3">
                  {problem.hints.map((hint: string, i: number) => (
                    <div key={i} className="bg-[#1A1A1A] border border-white/5 rounded-xl p-1 relative overflow-hidden group">
                      {i < hintsRevealed ? (
                        <div className="p-4 text-xs text-zinc-300 animate-in fade-in slide-in-from-top-2 duration-300">
                           <strong className="text-blue-500 tracking-widest block mb-1">HINT {i+1}</strong>
                           {hint}
                        </div>
                      ) : (
                        <button 
                          disabled={i > hintsRevealed}
                          onClick={() => setHintsRevealed(i + 1)}
                          className={`w-full p-4 flex items-center justify-between text-xs font-bold tracking-widest uppercase transition-colors ${
                            i === hintsRevealed 
                              ? 'text-zinc-400 hover:bg-white/5 hover:text-white cursor-pointer' 
                              : 'text-zinc-700 cursor-not-allowed'
                          }`}
                        >
                          <span>Reveal Hint {i+1}</span>
                          <span className="material-symbols-outlined text-[14px]">{i === hintsRevealed ? 'visibility' : 'lock'}</span>
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Monaco Editor */}
        <div className="flex-1 flex flex-col bg-[#1E1E1E]">
          {/* Editor Header Tools */}
          <div className="h-10 bg-[#1e1e1e] border-b border-zinc-800 flex items-center px-4 justify-between shrink-0">
             <div className="flex items-center gap-2">
                 <span className="material-symbols-outlined text-[14px] text-zinc-500">code</span>
                 <select 
                    disabled={isCompleted}
                    className="bg-transparent text-xs text-zinc-300 focus:outline-none cursor-pointer tracking-widest uppercase appearance-none"
                    value={language} 
                    onChange={e => setLanguage(e.target.value)}
                 >
                   <option value="python">Python 3</option>
                   <option value="javascript">JavaScript</option>
                   <option value="java">Java</option>
                   <option value="cpp">C++</option>
                 </select>
             </div>
             <div>
                <button className="text-zinc-500 hover:text-white transition-colors" title="Settings">
                   <span className="material-symbols-outlined text-[14px]">settings</span>
                </button>
             </div>
          </div>
          
          <div className="flex-1 relative">
            <Editor
              height="100%"
              language={getMonacoLanguage(language)}
              theme="vs-dark"
              value={code}
              onChange={(val) => setCode(val || "")}
              options={{
                minimap: { enabled: false },
                fontSize: 14,
                fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                lineHeight: 24,
                padding: { top: 16 },
                readOnly: isCompleted,
                scrollBeyondLastLine: false,
                smoothScrolling: true,
                cursorBlinking: "smooth",
                roundedSelection: true,
              }}
            />
          </div>
        </div>

      </div>
    </div>
  );
}
