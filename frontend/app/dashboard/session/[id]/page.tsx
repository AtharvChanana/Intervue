"use client";

import { useEffect, useState, use, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { fetchApi } from '@/lib/api';

interface QuestionResponse {
  questionId: number;
  questionText: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  questionCategory: string;
  questionNumber: number;
  questionFormat: string;
}

interface FeedbackResponse {
  answerId: number;
  score: number;
  feedback: string;
  idealAnswer: string;
  strengths: string;
  areasForImprovement: string;
  nextQuestion: QuestionResponse | null;
  isSessionComplete: boolean;
  questionNumber: number;
  totalQuestions: number;
}

export default function SessionPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = use(params);
  
  const [questions, setQuestions] = useState<QuestionResponse[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState<QuestionResponse | null>(null);
  const [answerText, setAnswerText] = useState("");
  const [selectedOption, setSelectedOption] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<FeedbackResponse | null>(null);
  const [isCompleted, setIsCompleted] = useState(false);
  const [report, setReport] = useState<any>(null);
  const [showEndConfirm, setShowEndConfirm] = useState(false);

  // Timer
  const [timeLimit, setTimeLimit] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [timerActive, setTimerActive] = useState(false);
  const [timesUp, setTimesUp] = useState(false);
  // Hint
  const [hintText, setHintText] = useState('');
  const [isLoadingHint, setIsLoadingHint] = useState(false);
  const [hintRevealed, setHintRevealed] = useState(false);
  // Ref to avoid stale closure on auto-submit
  const currentAnswerRef = useRef('');

  useEffect(() => {
    if (isCompleted) {
      const getReport = async () => {
        try {
          const res = await fetchApi(`/interview/${id}/score`);
          if (res && res.status !== 'pending') {
            setReport(res);
          }
        } catch (e: any) {
          console.error("Failed to load score", e);
        }
      };
      getReport();
    }
  }, [isCompleted, id]);

  useEffect(() => {
    // Initial fetch to get session state
    const initSession = async () => {
      try {
        const qData = await fetchApi(`/interview/${id}/questions`);
        if (qData && qData.length > 0) {
          setQuestions(qData);
          setCurrentQuestion(qData[qData.length - 1]); // Last item is current
        }
      } catch (e: any) {
        console.error("Failed to fetch session state", e);
      }
    };
    initSession();
  }, [id]);

  // Read time limit from localStorage (set by layout on session start)
  useEffect(() => {
    const stored = localStorage.getItem(`sessionTimer_${id}`);
    if (stored) setTimeLimit(parseInt(stored) || 0);
  }, [id]);

  // Restart timer whenever a new question appears
  useEffect(() => {
    if (!currentQuestion || timeLimit <= 0) return;
    setTimeLeft(timeLimit);
    setTimerActive(true);
    setTimesUp(false);
    setHintText('');
    setHintRevealed(false);
  }, [currentQuestion?.questionId, timeLimit]);

  // Countdown tick (uses setTimeout so deps stay fresh)
  useEffect(() => {
    if (!timerActive || !!feedback) return;
    if (timeLeft <= 0) { setTimesUp(true); setTimerActive(false); return; }
    const tick = setTimeout(() => setTimeLeft(t => t - 1), 1000);
    return () => clearTimeout(tick);
  }, [timerActive, timeLeft, feedback]);

  // Keep answer ref fresh for auto-submit closure
  useEffect(() => { currentAnswerRef.current = selectedOption || answerText; }, [selectedOption, answerText]);

  // Auto-submit when timer expires
  useEffect(() => {
    if (!timesUp || isSubmitting || !currentQuestion || !!feedback) return;
    const ans = currentAnswerRef.current ||
      (currentQuestion.questionFormat === 'OPEN_ENDED' ? 'Time expired — no answer provided.' : 'A');
    submitAnswer(ans);
    setTimesUp(false);
  }, [timesUp, isSubmitting, currentQuestion, feedback]);

  const submitAnswer = async (answerToSubmit: string) => {
    if (!currentQuestion) return;
    setTimerActive(false); // stop countdown immediately
    setTimesUp(false);
    setAnswerText(selectedOption);
    setIsSubmitting(true);
    try {
      const response = await fetchApi(`/interview/${id}/answer`, {
        method: 'POST',
        body: JSON.stringify({
          questionId: currentQuestion.questionId,
          answerText: answerToSubmit
        })
      });
      
      setFeedback(response);
      if (response.sessionComplete || response.isSessionComplete || !response.nextQuestion) {
        const timeStr = new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: 'numeric', hour12: true }).format(new Date());
        window.dispatchEvent(new CustomEvent('new_notification', {
          detail: { id: Date.now().toString(), message: `Session ${id} successfully completed. Score computed.`, time: timeStr, read: false }
        }));
      }
    } catch (e: any) {
      alert(e.message || "Failed to evaluate answer. A system interrupt occurred.");
      const timeStr = new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: 'numeric', hour12: true }).format(new Date());
      window.dispatchEvent(new CustomEvent('new_notification', {
          detail: { id: Date.now().toString(), message: `Session failed to synchronize: ${e.message}`, time: timeStr, read: false }
      }));
    } finally {
      setIsSubmitting(false);
    }
  };

  const nextQuestion = () => {
    if (feedback?.nextQuestion) {
      setQuestions([...questions, feedback.nextQuestion]);
      setCurrentQuestion(feedback.nextQuestion);
      setAnswerText("");
      setSelectedOption("");
      setFeedback(null);
      setHintText('');
      setHintRevealed(false);
    }
  };

  const revealHint = async () => {
    if (!currentQuestion || hintRevealed) return;
    setHintRevealed(true);
    setIsLoadingHint(true);
    try {
      const resp = await fetchApi(`/interview/${id}/hint/${currentQuestion.questionId}`);
      setHintText(resp.hint || 'Think about the core concepts related to this topic.');
    } catch {
      setHintText('Consider the fundamental principles underlying this type of question.');
    } finally {
      setIsLoadingHint(false);
    }
  };

  const endSession = () => setShowEndConfirm(true);

  const confirmEndSession = async () => {
    setShowEndConfirm(false);
    try {
      await fetchApi(`/interview/${id}/abandon`, { method: 'POST' });
      const timeStr = new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: 'numeric', hour12: true }).format(new Date());
      window.dispatchEvent(new CustomEvent('new_notification', {
          detail: { id: Date.now().toString(), message: `Session ${id} was ended.`, time: timeStr, read: false }
      }));
      router.push('/dashboard');
    } catch(e: any) {
      console.error("End session fail: ", e);
      const timeStr = new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: 'numeric', hour12: true }).format(new Date());
      window.dispatchEvent(new CustomEvent('new_notification', {
          detail: { id: Date.now().toString(), message: `Failed to end session. Connection terminated.`, time: timeStr, read: false }
      }));
    }
  };

  if (isCompleted) {
    return (
      <div className="max-w-4xl mx-auto mt-20 animate-in fade-in duration-500 pb-20">
        <div className="w-24 h-24 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-8 shadow-[0_0_50px_rgba(255,255,255,0.1)]">
          <span className="material-symbols-outlined text-5xl text-white">task_alt</span>
        </div>
        <div className="text-center mb-12">
          <h2 className="text-4xl font-black text-white mb-4">Session Evaluated</h2>
          <p className="text-zinc-400">Your final scores have been computed and apprehended by the Neural Link.</p>
        </div>

        {!report ? (
           <div className="text-center text-zinc-500 animate-pulse py-10 tracking-widest text-sm uppercase">Decrypting Final Analysis...</div>
        ) : (
          <div className="liquid-glass p-10 rounded-xl space-y-10 animate-in slide-in-from-bottom-5">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-6 bg-white/5 border border-white/10 rounded-lg text-center">
                <p className="text-xs font-bold text-zinc-500 tracking-widest uppercase mb-2">Total Score</p>
                <p className="text-5xl font-black text-white">{report.totalScore?.toFixed(0)}</p>
              </div>
              <div className="p-6 bg-white/5 border border-white/10 rounded-lg text-center">
                <p className="text-xs font-bold text-zinc-500 tracking-widest uppercase mb-2">Technical Ability</p>
                <p className="text-5xl font-black text-white">{report.technicalScore?.toFixed(0)}</p>
              </div>
              <div className="p-6 bg-white/5 border border-white/10 rounded-lg text-center">
                <p className="text-xs font-bold text-zinc-500 tracking-widest uppercase mb-2">Communication</p>
                <p className="text-5xl font-black text-white">{report.communicationScore?.toFixed(0)}</p>
              </div>
            </div>

            <div className="bg-black p-8 rounded-lg border border-white/10">
              <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-4 flex items-center gap-2"><span className="material-symbols-outlined text-sm">psychology</span> Overall Feedback</h4>
              <p className="text-white text-sm leading-relaxed">{report.overallFeedback}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-white/5 p-6 rounded-lg border border-white/5">
                <h4 className="text-xs font-bold text-white uppercase tracking-widest flex items-center gap-2 mb-3">
                  <span className="material-symbols-outlined text-green-400 text-sm">trending_up</span> Core Strengths
                </h4>
                <p className="text-sm text-zinc-400 leading-relaxed italic">{report.strengthsSummary}</p>
              </div>
              <div className="bg-white/5 p-6 rounded-lg border border-white/5">
                <h4 className="text-xs font-bold text-white uppercase tracking-widest flex items-center gap-2 mb-3">
                  <span className="material-symbols-outlined text-amber-400 text-sm">flag</span> Focus Areas
                </h4>
                <p className="text-sm text-zinc-400 leading-relaxed italic">{report.improvementTips}</p>
              </div>
            </div>

            {report.qaBreakdown && report.qaBreakdown.length > 0 && (
              <div className="space-y-4">
                <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-4 flex items-center gap-2"><span className="material-symbols-outlined text-sm">assignment_turned_in</span> Question Breakdown</h4>
                {report.qaBreakdown.map((q: any, idx: number) => {
                  const isCorrect = q.userAnswer === q.correctOption;
                  return (
                    <div key={idx} className="bg-black p-6 rounded-lg border border-white/5">
                      <p className="text-sm text-white font-bold mb-4">{idx + 1}. {q.question}</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs flex-col flex sm:grid">
                        <div className="bg-white/5 p-3 rounded-md border border-white/5">
                          <span className="block text-zinc-500 uppercase tracking-widest mb-1">Your Answer</span>
                          <span className={`font-bold ${isCorrect ? 'text-green-400' : 'text-red-400'}`}>
                            {q.userAnswer} - {q[`option${q.userAnswer}`] || ''}
                          </span>
                        </div>
                        <div className="bg-white/5 p-3 rounded-md border border-white/5">
                          <span className="block text-zinc-500 uppercase tracking-widest mb-1">Correct Answer</span>
                          <span className="font-bold text-green-400">
                            {q.correctOption} - {q[`option${q.correctOption}`] || ''}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="flex gap-4 justify-center pt-8 border-t border-white/10 flex-col sm:flex-row">
              <button onClick={() => router.push('/dashboard')} className="bg-transparent border border-white/20 text-white px-8 py-4 rounded-md font-bold hover:bg-white/5 transition-all text-sm tracking-widest uppercase w-full sm:w-auto">
                Back to Dashboard
              </button>
              <button onClick={() => router.push('/dashboard')} className="bg-white text-black px-12 py-4 rounded-md font-bold hover:scale-105 transition-all text-sm tracking-widest uppercase shadow-[0_0_30px_rgba(255,255,255,0.2)] flex items-center justify-center gap-2 w-full sm:w-auto">
                Attempt New Session <span className="material-symbols-outlined text-sm">replay</span>
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  if (!currentQuestion) {
    return <div className="p-8 text-white animate-pulse">Initializing Neural Link...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto pb-20">
      {showEndConfirm && (
        <div className="fixed inset-0 z-[200] bg-black/90 flex items-center justify-center p-4">
          <div className="bg-black border border-white/10 rounded-xl p-10 max-w-sm w-[95%] md:w-full shadow-2xl animate-in zoom-in-95 duration-200">
            <h2 className="text-2xl font-black text-white mb-2">End Session?</h2>
            <p className="text-zinc-400 text-sm mb-8">Are you sure you want to end this interview? Your progress will be halted and this cannot be undone.</p>
            <div className="flex gap-4">
               <button onClick={() => setShowEndConfirm(false)} className="flex-1 bg-white/5 text-white py-4 rounded-lg font-bold tracking-widest uppercase text-[10px] hover:bg-white/10 transition-colors border border-white/5">Stay</button>
               <button onClick={confirmEndSession} className="flex-1 bg-red-500/20 text-red-500 border border-red-500/20 py-4 rounded-lg font-bold tracking-widest uppercase text-[10px] hover:bg-red-500 hover:text-white transition-all">
                End It
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-between items-center mb-10">
        <h2 className="text-xl font-bold text-white tracking-widest uppercase">
          MOCK SESSION
        </h2>
        <button onClick={endSession} className="text-sm font-bold text-red-500 hover:text-red-400 border border-red-500/20 bg-red-500/10 px-4 py-2 rounded-md">
          End Session
        </button>
      </div>

      {!feedback ? (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
          <div className="liquid-glass rounded-xl p-10 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 border-b border-l border-white/10 bg-white/5 rounded-bl-lg">
              <span className="text-[10px] tracking-[0.2em] uppercase font-bold text-zinc-400">
                {currentQuestion.questionCategory}
              </span>
            </div>
            <h3 className="text-zinc-500 text-xs font-bold uppercase tracking-widest mb-3">
              Query 0{currentQuestion.questionNumber}
            </h3>
            {/* Timer display */}
            {timeLimit > 0 && (
              <div className={`flex items-center gap-2 mb-4 ${
                timeLeft / timeLimit > 0.5 ? 'text-emerald-400' :
                timeLeft / timeLimit > 0.25 ? 'text-amber-400' : 'text-red-400'
              } ${timeLeft / timeLimit <= 0.25 && timerActive ? 'animate-pulse' : ''}`}>
                <span className="material-symbols-outlined text-base">timer</span>
                <span className="text-xl font-black font-mono">
                  {Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, '0')}
                </span>
                {timesUp
                  ? <span className="text-red-400 text-xs font-bold uppercase tracking-widest ml-1">Time&apos;s up!</span>
                  : <span className="text-[10px] uppercase tracking-widest opacity-40">left</span>}
              </div>
            )}
            <p className="text-2xl text-white font-medium leading-relaxed">
              {currentQuestion.questionText}
            </p>
          </div>

          {currentQuestion.questionFormat === 'OPEN_ENDED' ? (
            <div className="mt-8">
              <textarea
                value={answerText}
                onChange={(e) => {
                  setAnswerText(e.target.value);
                  setSelectedOption(e.target.value);
                }}
                rows={6}
                placeholder="Formulate your comprehensive answer here..."
                className="w-full bg-black/50 border border-white/10 rounded-xl p-6 text-white text-sm focus:outline-none focus:border-white transition-colors tracking-wide leading-relaxed resize-none shadow-inner"
              />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { key: 'A', text: currentQuestion.optionA },
                { key: 'B', text: currentQuestion.optionB },
                { key: 'C', text: currentQuestion.optionC },
                { key: 'D', text: currentQuestion.optionD }
              ].map((opt) => (
                <button
                  key={opt.key}
                  onClick={() => setSelectedOption(opt.key)}
                  disabled={isSubmitting}
                  className={`group relative liquid-glass border ${selectedOption === opt.key ? 'border-white bg-white/10' : 'border-white/5'} rounded-xl p-6 text-left hover:border-white transition-all duration-300 disabled:opacity-50`}
                >
                  <div className="flex items-center gap-4">
                    <span className={`w-8 h-8 rounded-lg border flex items-center justify-center font-bold text-xs transition-all ${selectedOption === opt.key ? 'bg-white text-black border-white/5' : 'bg-white/5 text-zinc-500 border-white/10 group-hover:bg-white group-hover:text-black'}`}>
                      {opt.key}
                    </span>
                    <p className={`text-white transition-transform ${selectedOption === opt.key ? 'translate-x-1 font-semibold' : 'group-hover:translate-x-1'}`}>{opt.text}</p>
                  </div>
                </button>
              ))}
            </div>
          )}

          <div className="flex justify-between items-center pt-6">
            {/* Hint button */}
            <div>
              {!hintRevealed ? (
                <button
                  onClick={revealHint}
                  className="flex items-center gap-2 text-zinc-600 text-xs font-bold uppercase tracking-wider hover:text-amber-400 transition-colors py-2"
                >
                  <span className="material-symbols-outlined text-sm">lightbulb</span>
                  Need a hint?
                </button>
              ) : (
                <div className="flex items-start gap-2 p-3 bg-amber-500/5 border border-amber-400/20 rounded-xl max-w-sm">
                  <span className="material-symbols-outlined text-amber-400 text-sm flex-shrink-0 mt-0.5">lightbulb</span>
                  {isLoadingHint
                    ? <p className="text-amber-400/50 text-[10px] animate-pulse uppercase tracking-widest">Generating hint...</p>
                    : <p className="text-amber-200 text-xs leading-relaxed">{hintText}</p>}
                </div>
              )}
            </div>
            <button
              onClick={() => submitAnswer(selectedOption)}
              disabled={!selectedOption || isSubmitting}
              className="bg-white text-black px-8 py-4 rounded-md font-bold tracking-tight hover:scale-105 transition-transform flex items-center gap-2 disabled:opacity-50 disabled:hover:scale-100 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Evaluating...' : (currentQuestion.questionFormat === 'OPEN_ENDED' ? 'Submit Answer' : 'Submit Option')}
              {!isSubmitting && <span className="material-symbols-outlined text-sm">send</span>}
            </button>
          </div>
        </div>
      ) : (
        <div className="liquid-glass rounded-xl p-10 animate-in flip-in-y duration-700 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-white/10">
            <div className="h-full bg-white" style={{ width: `${feedback.score}%`}}></div>
          </div>
          
          <div className="flex justify-between items-start mb-10 mt-4">
            <div>
              <h3 className={`text-3xl font-black mb-2 flex items-center gap-3 ${currentQuestion.questionFormat === 'OPEN_ENDED' ? (feedback.score >= 70 ? 'text-green-400' : 'text-amber-400') : (feedback.score === 100 ? 'text-green-400' : 'text-red-400')}`}>
                <span className="material-symbols-outlined text-4xl">{currentQuestion.questionFormat === 'OPEN_ENDED' ? (feedback.score >= 70 ? 'check_circle' : 'change_history') : (feedback.score === 100 ? 'check_circle' : 'cancel')}</span>
                {currentQuestion.questionFormat === 'OPEN_ENDED' ? `Evaluation Score: ${feedback.score}/100` : (feedback.score === 100 ? 'Correct Answer' : 'Incorrect')}
              </h3>
              <p className="text-zinc-500 text-sm">Response calibrated against ideal parameters.</p>
            </div>
            <div className="text-right">
              <span className="text-[10px] uppercase tracking-widest text-zinc-500 block mb-1">Score Matrix</span>
              <span className="text-5xl font-black text-white">{feedback.score}</span>
            </div>
          </div>

          <div className="bg-black p-6 rounded-lg mb-10 border border-white/5 flex items-center justify-center min-h-[100px]">
             {feedback.score === 100 ? (
                <p className="text-green-400 font-bold tracking-widest uppercase text-sm">Your Response was Accurate</p>
             ) : (
                <p className="text-red-400 font-bold uppercase tracking-widest text-sm flex items-center gap-3">
                   Correct Option: <span className="px-5 py-2 bg-white/10 border border-white/10 text-white rounded-md ml-1">{feedback.idealAnswer}</span>
                </p>
             )}
          </div>

          <div className="flex justify-end pt-6 border-t border-white/10">
            <button onClick={() => {
              if (feedback.isSessionComplete || !feedback.nextQuestion) {
                  setIsCompleted(true);
              } else {
                  nextQuestion();
              }
            }} className="bg-white text-black px-8 py-4 rounded-md font-bold tracking-tight hover:scale-105 transition-transform flex items-center gap-2">
              {(feedback.isSessionComplete || !feedback.nextQuestion) ? 'FINISH SESSION PORTION' : 'PROCEED TO NEXT QUESTION'}
              <span className="material-symbols-outlined text-sm">arrow_forward</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
