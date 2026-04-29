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
  const [code, setCode] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  
  // Report State
  const [report, setReport] = useState<any>(null);
  const [runResult, setRunResult] = useState<any>(null);

  // Layout State
  const [activeTab, setActiveTab] = useState('testcases'); // 'testcases' or 'run_results'
  const [showEndConfirm, setShowEndConfirm] = useState(false);

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
    } else if (timeLeft === 0 && session?.status !== "COMPLETED" && !isSubmitting && !isRunning) {
      handleSubmit(); // auto submit
    }
  }, [timeLeft, session, isSubmitting, isRunning]);

  // Handle Starter Code Swap
  useEffect(() => {
    if (session?.problem?.starterCode?.[language] && session.status !== "COMPLETED") {
      setCode(session.problem.starterCode[language]);
    }
  }, [language, session?.problem?.starterCode]);

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
        // Init timer
        if (res.problem?.timerMinutes) {
           setTimeLeft(res.problem.timerMinutes * 60);
        }
        if (res.problem?.starterCode && res.problem.starterCode["python"]) {
            setCode(res.problem.starterCode["python"]);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleRunCode = async () => {
    if (isRunning || session?.status === "COMPLETED") return;
    setIsRunning(true);
    setActiveTab('run_results');
    setRunResult(null);
    try {
      const res = await fetchApi(`/dsa/${id}/run`, {
        method: "POST",
        body: JSON.stringify({ code, language })
      });
      setRunResult(res.runResult);
    } catch (err) {
      console.error(err);
      alert("Failed to run code. " + err);
    } finally {
      setIsRunning(false);
    }
  };

  const handleSubmit = async () => {
    if (isSubmitting || isRunning || session?.status === "COMPLETED") return;
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
      <div className="fixed inset-0 bg-black flex flex-col items-center justify-center p-4 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(59,130,246,0.15),transparent_50%)]"></div>
        <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin z-10 mb-6"></div>
        <p className="text-blue-500 font-bold uppercase tracking-[0.3em] animate-pulse z-10 relative text-sm">
          Generating Problem Environment
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
    <div className="fixed inset-0 z-[100] flex flex-col bg-[#0A0A0A] text-white overflow-hidden font-sans">
      
      {/* Top Navbar */}
      <header className="h-16 border-b border-white/10 flex items-center justify-between px-6 bg-[#0F0F0F] shrink-0 z-50">
        <div className="flex items-center gap-4 flex-1">
          <div className="flex flex-col">
            <h1 className="font-bold text-sm tracking-wide text-zinc-100 mb-1">
                {problem.title || "Algorithm Challenge"}
            </h1>
            <div className="flex gap-2">
                {problem.difficulty && (
                <span className={`text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded-full bg-white/5 border border-white/10 ${
                    problem.difficulty === 'HARD' ? 'text-red-400' : problem.difficulty === 'MEDIUM' ? 'text-yellow-400' : 'text-green-400'
                }`}>
                    {problem.difficulty}
                </span>
                )}
            </div>
          </div>
        </div>

        {/* Center Timer */}
        {timeLeft !== null && !isCompleted && (
          <div className="flex-1 flex justify-center items-center">
            <div className={`px-5 py-2 flex items-center justify-center gap-3 rounded-xl transition-colors shadow-lg ${timeLeft < 300 ? 'text-red-400 bg-red-500/10 border border-red-500/20' : 'text-zinc-300 bg-white/5 border border-white/10'}`}>
               <span className="material-symbols-outlined text-[18px]">timer</span>
               <span className="font-mono text-lg font-black tracking-widest leading-none">{formatTime(timeLeft)}</span>
            </div>
          </div>
        )}
        {isCompleted && (
           <div className="flex-1 flex justify-center items-center">
               <span className="text-green-400 font-bold uppercase tracking-widest text-[11px] bg-green-500/10 px-4 py-1.5 rounded-full border border-green-500/20">Session Completed</span>
           </div>
        )}

        {/* Right Actions */}
        <div className="flex items-center gap-3 flex-1 justify-end">
          <button onClick={() => {
            if (isCompleted) router.push('/dashboard');
            else setShowEndConfirm(true);
          }} className="px-4 py-2 rounded-lg text-[10px] font-bold tracking-widest uppercase text-zinc-400 hover:text-white bg-white/5 hover:bg-white/10 transition-colors border border-white/10">
            {isCompleted ? 'Dashboard' : 'End Session'}
          </button>
          {!isCompleted && (
            <>
              <button 
                disabled={isRunning || isSubmitting}
                onClick={handleRunCode} 
                className="flex items-center gap-2 px-5 py-2 rounded-lg font-bold text-[10px] uppercase tracking-widest transition-colors leading-none bg-white/10 text-white hover:bg-white/20 border border-white/10 disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-[14px] leading-none">play_arrow</span>
                {isRunning ? "Running..." : "Run"}
              </button>
              <button 
                disabled={isRunning || isSubmitting}
                onClick={handleSubmit} 
                className="flex items-center gap-2 px-6 py-2.5 rounded-lg font-bold text-[10px] uppercase tracking-widest transition-transform leading-none bg-green-600/20 text-green-400 border border-green-500/30 hover:bg-green-600/30 hover:scale-105 disabled:opacity-50 disabled:scale-100"
              >
                <span className="material-symbols-outlined text-[14px] leading-none">cloud_upload</span>
                {isSubmitting ? "Submitting..." : "Submit"}
              </button>
            </>
          )}
        </div>
      </header>

      {/* Main Content Workspace */}
      <div className="flex flex-1 overflow-hidden">
        
        {/* Left Side: Problem Description */}
        <div className="w-[45%] border-r border-white/10 flex flex-col bg-[#050505] overflow-y-auto h-full scroll-smooth">
          
          {/* If completed, show Report Banner on top */}
          {isCompleted && report && (
            <div className="m-4 p-5 rounded-xl border liquid-glass border-white/10 shadow-[0_0_20px_rgba(255,255,255,0.05)] shrink-0">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold uppercase tracking-widest text-[#3b82f6] text-xs font-space-grotesk">AI Terminal Analysis</h3>
                <div className="flex items-center gap-2 bg-black px-3 py-1.5 rounded-lg border border-white/5">
                  <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-space-grotesk">Terminal Score</span>
                  <span className={`font-mono text-xl font-bold ${report.score >= 80 ? 'text-green-400' : report.score >= 50 ? 'text-yellow-400' : 'text-red-400'}`}>
                    {report.score}/100
                  </span>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="bg-black border border-white/5 p-3 rounded-lg flex flex-col gap-1">
                   <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-space-grotesk">Time Complexity</span>
                   <span className="font-mono text-sm font-bold text-white tracking-widest">{report.timeComplexity || "N/A"}</span>
                </div>
                <div className="bg-black border border-white/5 p-3 rounded-lg flex flex-col gap-1">
                   <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-space-grotesk">Space Complexity</span>
                   <span className="font-mono text-sm font-bold text-white tracking-widest">{report.spaceComplexity || "N/A"}</span>
                </div>
              </div>

              <div className="text-sm text-zinc-300 leading-relaxed bg-black/50 border border-white/5 p-4 rounded-lg mb-4 font-mono whitespace-pre-wrap">
                {report.feedback}
              </div>

              {report.testResults && report.testResults.length > 0 && (
                <div className="space-y-2 mt-6">
                  <h4 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-3">Hidden Test Cases</h4>
                  {report.testResults.map((tc: any, i: number) => (
                    <div key={i} className={`p-3 rounded-lg border flex flex-col gap-2 ${tc.passed ? 'border-green-500/20 bg-green-500/5' : 'border-red-500/20 bg-red-500/5'}`}>
                      <div className="flex items-center gap-2">
                         <span className={`material-symbols-outlined text-[14px] ${tc.passed ? 'text-green-400' : 'text-red-400'}`}>
                            {tc.passed ? 'check_circle' : 'cancel'}
                         </span>
                         <span className="font-bold text-xs uppercase tracking-widest text-zinc-200">{tc.name}</span>
                      </div>
                      <p className="text-[11px] text-zinc-500 font-mono tracking-tight leading-relaxed">{tc.details}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Problem Body */}
          <div className="p-8 pb-32">
            <h2 className="text-2xl font-black mb-6 leading-tight">{problem.title}</h2>
            
            <div className="prose prose-invert max-w-none text-zinc-300 text-sm leading-relaxed mb-10 pb-6 border-b border-white/5"
                 dangerouslySetInnerHTML={{__html: problem.description}}>
            </div>

            {/* Examples */}
            {problem.examples && problem.examples.length > 0 && (
              <div className="mb-10 space-y-4">
                <h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em] mb-4">Examples</h3>
                {problem.examples.map((ex: any, i: number) => (
                  <div key={i} className="bg-[#111] border border-white/5 rounded-xl p-5 font-mono text-xs space-y-3">
                    <div className="flex flex-col gap-1"><span className="text-zinc-500 tracking-widest font-bold uppercase text-[9px]">Input:</span> <span className="text-zinc-200">{ex.input}</span></div>
                    <div className="flex flex-col gap-1"><span className="text-zinc-500 tracking-widest font-bold uppercase text-[9px]">Output:</span> <span className="text-blue-300">{ex.output}</span></div>
                    {ex.explanation && (
                      <div className="pt-3 border-t border-white/5 mt-3 text-zinc-400 whitespace-pre-wrap leading-relaxed"><span className="text-zinc-500 tracking-widest font-bold uppercase text-[9px]">Explanation:</span><br/>{ex.explanation}</div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Constraints */}
            {problem.constraints && problem.constraints.length > 0 && (
              <div className="mb-10">
                <h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em] mb-4">Constraints</h3>
                <ul className="list-disc list-outside ml-4 space-y-2">
                  {problem.constraints.map((c: string, i: number) => (
                    <li key={i} className="text-[13px] font-mono text-zinc-400">{c}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Hints */}
            {problem.hints && problem.hints.length > 0 && !isCompleted && (
              <div className="mb-8 border-t border-white/5 pt-8">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em]">Hints</h3>
                  <span className="text-[10px] bg-white/5 px-2 py-1 rounded text-zinc-400 font-bold tracking-widest">{hintsRevealed} / {problem.hints.length}</span>
                </div>
                <div className="space-y-3">
                  {problem.hints.map((hint: string, i: number) => (
                    <div key={i} className="bg-[#111] border border-white/5 rounded-xl p-1 relative overflow-hidden group">
                      {i < hintsRevealed ? (
                        <div className="p-5 text-[13px] text-zinc-300 animate-in fade-in slide-in-from-top-2 duration-300 leading-relaxed">
                           <strong className="text-blue-400 tracking-widest block mb-2 text-[10px] uppercase">HINT {i+1}</strong>
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

        {/* Right Side: Monaco Editor + Panel */}
        <div className="flex-1 flex flex-col bg-[#1E1E1E] h-full overflow-hidden">
          {/* Editor Header Tools */}
          <div className="h-10 bg-[#1e1e1e] border-b border-black/50 flex items-center px-4 justify-between shrink-0 z-10 shadow-sm">
             <div className="flex items-center gap-3">
                 <span className="material-symbols-outlined text-[14px] text-zinc-500">code</span>
                 <select 
                    disabled={isCompleted}
                    className="bg-transparent text-xs text-zinc-300 focus:outline-none cursor-pointer tracking-widest uppercase appearance-none hover:text-white transition-colors"
                    value={language} 
                    onChange={e => setLanguage(e.target.value)}
                 >
                   <option value="python">Python 3</option>
                   <option value="javascript">JavaScript</option>
                   <option value="java">Java</option>
                   <option value="cpp">C++</option>
                 </select>
                 <span className="material-symbols-outlined text-[12px] text-zinc-600 pointer-events-none -ml-2">expand_more</span>
             </div>
          </div>
          
          <div className="flex-1 relative pb-2 min-h-[300px]">
            <Editor
              height="100%"
              language={getMonacoLanguage(language)}
              theme="vs-dark"
              value={code}
              onChange={(val) => setCode(val || "")}
              options={{
                minimap: { enabled: false },
                fontSize: 14,
                fontFamily: "'JetBrains Mono', 'Menlo', 'Monaco', 'Courier New', monospace",
                lineHeight: 24,
                padding: { top: 16, bottom: 16 },
                readOnly: isCompleted,
                scrollBeyondLastLine: false,
                smoothScrolling: true,
                cursorBlinking: "smooth",
                roundedSelection: true,
                wordWrap: "on"
              }}
            />
          </div>

          {/* Bottom Panel */}
          <div className="h-[280px] flex flex-col bg-[#111] border-t border-black shadow-[0_-5px_20px_rgba(0,0,0,0.5)] shrink-0 z-20">
             <div className="flex items-center px-2 h-10 border-b border-white/5 bg-[#0a0a0a]">
                 <button onClick={() => setActiveTab('testcases')} className={`text-[10px] font-bold uppercase tracking-widest h-full px-4 border-b-2 transition-colors ${activeTab === 'testcases' ? 'border-zinc-400 text-zinc-200' : 'border-transparent text-zinc-600 hover:text-zinc-400'}`}>Test Cases</button>
                 <button onClick={() => setActiveTab('run_results')} className={`text-[10px] flex items-center gap-2 font-bold uppercase tracking-widest h-full px-4 border-b-2 transition-colors ${activeTab === 'run_results' ? 'border-blue-500 text-blue-400' : 'border-transparent text-zinc-600 hover:text-zinc-400'}`}>
                    Test Results
                    {isRunning && <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse block"></span>}
                 </button>
             </div>
             
             <div className="flex-1 overflow-y-auto p-5 custom-scrollbar bg-[#111]">
                {activeTab === 'testcases' && (
                  <>
                    <h4 className="text-[10px] text-zinc-500 uppercase tracking-widest mb-4 font-bold flex items-center gap-2">
                      <span className="material-symbols-outlined text-[14px]">science</span> Public Test Cases
                    </h4>
                    {problem.publicTestCases ? problem.publicTestCases.map((tc: any, i: number) => (
                      <div key={i} className="mb-4 last:mb-0 bg-[#1A1A1A] border border-white/5 rounded-lg p-4">
                          <div className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest mb-3 border-b border-white/5 pb-2">Case {i+1}</div>
                          <div className="space-y-3">
                            <div className="flex flex-col gap-1">
                              <span className="font-mono text-[9px] uppercase tracking-widest text-zinc-600 font-bold">Input</span>
                              <div className="font-mono text-xs text-zinc-300 bg-black/40 p-2 rounded border border-white/5 break-words">{tc.input}</div>
                            </div>
                            <div className="flex flex-col gap-1">
                              <span className="font-mono text-[9px] uppercase tracking-widest text-zinc-600 font-bold">Expected Output</span>
                              <div className="font-mono text-xs text-zinc-300 bg-black/40 p-2 rounded border border-white/5">{tc.expectedOutput}</div>
                            </div>
                          </div>
                      </div>
                    )) : (
                      <div className="text-zinc-600 text-xs italic">No public test cases provided for this problem.</div>
                    )}
                  </>
                )}

                {activeTab === 'run_results' && runResult && (
                   <div className="space-y-5">
                      <div className="flex items-center gap-3 bg-[#1A1A1A] p-4 rounded-lg border border-white/5">
                         <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Status</span>
                         <span className={`text-sm font-black uppercase tracking-widest ${runResult.status === 'Accepted' ? 'text-green-500' : 'text-red-500'}`}>
                           {runResult.status}
                         </span>
                         {runResult.status === 'Accepted' && <span className="material-symbols-outlined text-green-500 text-[18px]">verified</span>}
                      </div>
                      
                      {runResult.results?.map((res: any, i: number) => (
                         <div key={i} className="bg-[#1A1A1A] rounded-lg p-1 border border-white/5">
                            <div className={`px-4 py-3 border-b border-white/5 flex justify-between items-center bg-black/50 rounded-t-lg ${res.passed ? '' : 'bg-red-500/5'}`}>
                               <div className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest flex items-center gap-2">
                                 Case {i+1}
                               </div>
                               <span className={`text-[10px] font-bold uppercase tracking-widest ${res.passed ? 'text-green-500' : 'text-red-500'}`}>
                                 {res.passed ? 'Passed' : 'Failed'}
                               </span>
                            </div>
                            <div className="p-4 space-y-3">
                              <div className="flex flex-col gap-1">
                                <span className="font-mono text-[9px] uppercase tracking-widest text-zinc-600 font-bold">Input</span>
                                <div className="font-mono text-xs text-zinc-300 bg-black/40 p-2 rounded border border-white/5">{res.input}</div>
                              </div>
                              <div className="flex flex-col gap-1">
                                <span className="font-mono text-[9px] uppercase tracking-widest text-zinc-600 font-bold">Expected</span>
                                <div className="font-mono text-xs text-zinc-300 bg-black/40 p-2 rounded border border-white/5">{res.expectedOutput}</div>
                              </div>
                              <div className="flex flex-col gap-1">
                                <span className="font-mono text-[9px] uppercase tracking-widest text-zinc-600 font-bold border-red-500">Actual Output</span>
                                <div className={`font-mono text-xs p-2 rounded border ${res.passed ? 'bg-green-500/5 border-green-500/20 text-green-300' : 'bg-red-500/5 border-red-500/20 text-red-300'}`}>
                                  {res.actualOutput || 'Empty'}
                                </div>
                              </div>
                              {res.stdout && (
                                <div className="flex flex-col gap-1 mt-2">
                                  <span className="font-mono text-[9px] uppercase tracking-widest text-blue-500 font-bold">Stdout (Logs)</span>
                                  <div className="font-mono text-xs text-zinc-300 bg-black p-3 rounded border border-blue-500/20 whitespace-pre-wrap">{res.stdout}</div>
                                </div>
                              )}
                            </div>
                         </div>
                      ))}
                   </div>
                )}
                {activeTab === 'run_results' && !runResult && !isRunning && (
                   <div className="h-full flex flex-col items-center justify-center text-center text-zinc-600 opacity-50">
                      <span className="material-symbols-outlined text-4xl mb-2">terminal</span>
                      <div className="text-xs font-bold uppercase tracking-widest">Awaiting Execution</div>
                      <p className="text-[10px] mt-1 max-w-xs leading-relaxed">Click "Run" against the public testcases to preview results and view terminal print logs.</p>
                   </div>
                )}
                {activeTab === 'run_results' && isRunning && (
                   <div className="h-full flex flex-col items-center justify-center text-center">
                      <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                      <div className="text-xs font-bold uppercase tracking-widest text-blue-500 animate-pulse">Simulating Execution Engine...</div>
                   </div>
                )}
             </div>
          </div>
        </div>

      </div>
      {showEndConfirm && (
        <div className="fixed inset-0 z-[150] bg-black/90 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-[#050505] border border-red-500/20 rounded-2xl p-10 max-w-md w-full shadow-[0_0_50px_rgba(239,68,68,0.1)] text-center animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-red-500/20 text-red-500">
              <span className="material-symbols-outlined text-3xl">warning</span>
            </div>
            <h2 className="text-3xl font-black text-white mb-4">Abort Session?</h2>
            <p className="text-zinc-400 text-sm mb-8 leading-relaxed">
              Are you sure you want to end this assessment early? Your current progress will be lost and the session will be marked as abandoned.
            </p>
            <div className="flex flex-col gap-3">
              <button 
                onClick={async () => {
                   setShowEndConfirm(false);
                   router.push('/dashboard');
                }} 
                className="w-full bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white py-4 rounded-lg font-bold tracking-widest uppercase text-xs transition-colors border border-red-500/20"
              >
                Yes, Abort Assessment
              </button>
              <button 
                onClick={() => setShowEndConfirm(false)} 
                className="w-full bg-white/5 text-white hover:bg-white/10 py-4 rounded-lg font-bold tracking-widest uppercase text-xs transition-colors"
              >
                Cancel & Return
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
