"use client";

import { useEffect, useState, use, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { fetchApi } from '@/lib/api';
import AnimatedIcon from '@/components/AnimatedIcon';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";

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
        toast.success('Interview Complete!', {
          description: 'Your session has been scored. View your report below.',
          duration: 5000,
        });
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
      <div className="max-w-4xl mx-auto mt-16 animate-in fade-in duration-500 pb-20">
        {/* Hero */}
        <div className="text-center mb-12">
          <div className="w-20 h-20 rounded-2xl bg-[#DC9F85]/10 border border-[#DC9F85]/20 flex items-center justify-center mx-auto mb-6">
            <AnimatedIcon name="task_alt" className="text-4xl text-[#DC9F85]" />
          </div>
          <h2 className="text-3xl font-black text-[#EBDCC4] mb-2">Session Complete</h2>
          <p className="text-[#66473B] text-sm">Your performance report has been generated</p>
        </div>

        {!report ? (
           <div className="text-center text-[#66473B] animate-pulse py-10 tracking-widest text-sm uppercase">Computing scores...</div>
        ) : (
          <div className="space-y-6 animate-in slide-in-from-bottom-5">
            {/* Score Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { label: 'Total Score', value: report.totalScore, color: 'from-[#DC9F85]/20 to-[#DC9F85]/5', border: 'border-[#DC9F85]/20', text: 'text-[#DC9F85]' },
                { label: 'Technical', value: report.technicalScore, color: 'from-emerald-500/15 to-emerald-500/5', border: 'border-emerald-500/15', text: 'text-emerald-400' },
                { label: 'Communication', value: report.communicationScore, color: 'from-blue-500/15 to-blue-500/5', border: 'border-blue-500/15', text: 'text-blue-400' },
              ].map(c => (
                <div key={c.label} className={`bg-gradient-to-b ${c.color} border ${c.border} rounded-2xl p-8 text-center`}>
                  <p className="text-[9px] font-bold text-[#66473B] tracking-[0.3em] uppercase mb-3">{c.label}</p>
                  <p className={`text-5xl font-black ${c.text}`}>{c.value?.toFixed(0) ?? '—'}</p>
                </div>
              ))}
            </div>

            {/* Overall Feedback */}
            <div className="bg-[#0D0B0A] border border-[#35211A] rounded-2xl p-8">
              <h4 className="text-[9px] font-bold text-[#66473B] uppercase tracking-[0.3em] mb-4 flex items-center gap-2">
                <AnimatedIcon name="psychology" className="text-sm text-[#DC9F85]" /> Overall Feedback
              </h4>
              <p className="text-[#B6A596] text-sm leading-relaxed">{report.overallFeedback}</p>
            </div>

            {/* Strengths & Improvements */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-[#0D0B0A] border border-emerald-500/10 rounded-2xl p-6">
                <h4 className="text-[9px] font-bold uppercase tracking-[0.3em] flex items-center gap-2 mb-3 text-emerald-400/70">
                  <AnimatedIcon name="trending_up" className="text-sm" /> Strengths
                </h4>
                <p className="text-sm text-[#B6A596] leading-relaxed">{report.strengthsSummary}</p>
              </div>
              <div className="bg-[#0D0B0A] border border-amber-500/10 rounded-2xl p-6">
                <h4 className="text-[9px] font-bold uppercase tracking-[0.3em] flex items-center gap-2 mb-3 text-amber-400/70">
                  <AnimatedIcon name="flag" className="text-sm" /> Focus Areas
                </h4>
                <p className="text-sm text-[#B6A596] leading-relaxed">{report.improvementTips}</p>
              </div>
            </div>

            {/* Q&A Breakdown */}
            {report.qaBreakdown && report.qaBreakdown.length > 0 && (
              <div className="space-y-3">
                <h4 className="text-[9px] font-bold text-[#66473B] uppercase tracking-[0.3em] mb-2 flex items-center gap-2">
                  <AnimatedIcon name="assignment_turned_in" className="text-sm" /> Question Breakdown
                </h4>
                {report.qaBreakdown.map((q: any, idx: number) => {
                  const isCorrect = q.userAnswer === q.correctOption;
                  return (
                    <div key={idx} className={`bg-[#0D0B0A] rounded-2xl p-6 border ${isCorrect ? 'border-emerald-500/10' : 'border-red-500/10'}`}>
                      <p className="text-sm text-[#EBDCC4] font-bold mb-4">{idx + 1}. {q.question}</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                        <div className={`p-3 rounded-xl border ${isCorrect ? 'bg-emerald-500/5 border-emerald-500/15' : 'bg-red-500/5 border-red-500/15'}`}>
                          <span className="block text-[#66473B] uppercase tracking-widest mb-1 text-[9px]">Your Answer</span>
                          <span className={`font-bold ${isCorrect ? 'text-emerald-400' : 'text-red-400'}`}>
                            {q.userAnswer} - {q[`option${q.userAnswer}`] || ''}
                          </span>
                        </div>
                        <div className="p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/15">
                          <span className="block text-[#66473B] uppercase tracking-widest mb-1 text-[9px]">Correct Answer</span>
                          <span className="font-bold text-emerald-400">
                            {q.correctOption} - {q[`option${q.correctOption}`] || ''}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-4 justify-center pt-6 border-t border-[#35211A] flex-col sm:flex-row">
              <button onClick={() => router.push('/dashboard')} className="border border-[#35211A] text-[#B6A596] px-8 py-4 rounded-xl font-bold hover:bg-[#0D0B0A] transition-colors text-xs tracking-widest uppercase w-full sm:w-auto">
                Back to Dashboard
              </button>
              <button onClick={() => router.push('/dashboard')} className="relative group/new">
                <div className="absolute -inset-1 bg-gradient-to-r from-[#DC9F85] to-[#EBDCC4] rounded-xl opacity-40 blur-md group-hover/new:opacity-70 transition-opacity" />
                <div className="relative bg-[#DC9F85] text-[#0D0B0A] px-12 py-4 rounded-xl font-bold text-xs tracking-widest uppercase flex items-center justify-center gap-2 w-full sm:w-auto hover:brightness-110 transition-all">
                  New Session <AnimatedIcon name="replay" className="text-sm" />
                </div>
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  if (!currentQuestion) {
    return <div className="p-8 text-[#EBDCC4] animate-pulse">Initializing Neural Link...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto pb-20">
      <AlertDialog open={showEndConfirm} onOpenChange={setShowEndConfirm}>
        <AlertDialogContent className="bg-[#050505] border-[#66473B]/50 shadow-[0_0_50px_rgba(220,159,133,0.06)] sm:max-w-md gap-6">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-2xl font-black text-[#EBDCC4] text-center">End Session?</AlertDialogTitle>
            <AlertDialogDescription className="text-[#B6A596] text-sm text-center">
              Are you sure you want to end this interview? Your progress will be halted and this cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-4 flex-col sm:flex-col gap-3">
            <Button onClick={confirmEndSession} className="w-full bg-red-500/20 text-red-500 border border-red-500/20 py-4 rounded-lg font-bold tracking-widest uppercase text-[10px] hover:bg-red-500 hover:text-[#EBDCC4] transition-all">
              End It
            </Button>
            <AlertDialogCancel onClick={() => setShowEndConfirm(false)} className="w-full mt-0 sm:mt-0 bg-[#1F1A17] text-[#EBDCC4] py-4 rounded-lg font-bold tracking-widest uppercase text-[10px] hover:bg-[#231E1A] transition-colors border-[#66473B]/40">
              Stay
            </AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="flex justify-between items-center mb-10 pb-6 border-b border-[#35211A]">
        <div className="flex items-center gap-4">
          <span className="w-10 h-10 rounded-xl bg-[#DC9F85]/10 border border-[#DC9F85]/20 flex items-center justify-center">
            <AnimatedIcon name="psychology" className="text-[#DC9F85] text-lg" />
          </span>
          <div>
            <h2 className="text-lg font-black text-[#EBDCC4] tracking-widest uppercase">
              Mock Session
            </h2>
            <p className="text-[9px] uppercase tracking-[0.3em] text-[#66473B]">Session #{id}</p>
          </div>
        </div>
        <button onClick={endSession} className="flex items-center gap-2 text-xs font-bold text-red-400/70 hover:text-red-400 border border-red-500/15 bg-red-500/5 px-5 py-2.5 rounded-xl transition-colors">
          <AnimatedIcon name="stop_circle" className="text-sm" />
          End Session
        </button>
      </div>

      {!feedback ? (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
          {/* Question Card */}
          <div className="relative group">
            <div className="absolute -inset-[1px] rounded-2xl bg-gradient-to-br from-[#DC9F85]/30 via-transparent to-[#66473B]/20 opacity-60 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="relative bg-[#0D0B0A] rounded-2xl p-10 overflow-hidden">
              {/* Subtle glow */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-32 bg-[#DC9F85]/5 blur-3xl rounded-full pointer-events-none" />
              {/* Category + Question Number row */}
              <div className="flex items-center justify-between mb-6 relative z-10">
                <div className="flex items-center gap-3">
                  <span className="w-10 h-10 rounded-xl bg-[#DC9F85]/10 border border-[#DC9F85]/20 flex items-center justify-center text-[#DC9F85] text-sm font-black">
                    {String(currentQuestion.questionNumber).padStart(2, '0')}
                  </span>
                  <div>
                    <p className="text-[9px] uppercase tracking-[0.3em] text-[#66473B]">Question</p>
                    <p className="text-xs font-bold text-[#B6A596]">{currentQuestion.questionCategory}</p>
                  </div>
                </div>
                <span className="text-[9px] tracking-[0.2em] uppercase font-bold text-[#66473B] px-3 py-1.5 border border-[#35211A] bg-[#181818] rounded-lg">
                  {currentQuestion.questionFormat === 'OPEN_ENDED' ? 'Open Response' : 'Multiple Choice'}
                </span>
              </div>
              {/* Timer */}
              {timeLimit > 0 && (
                <div className={`flex items-center gap-3 mb-6 px-4 py-3 rounded-xl border ${
                  timeLeft / timeLimit > 0.5 ? 'bg-emerald-500/5 border-emerald-500/15 text-emerald-400' :
                  timeLeft / timeLimit > 0.25 ? 'bg-[#1F1A17] border-[#35211A] text-[#B6A596]' : 'bg-red-500/5 border-red-500/15 text-red-400'
                } ${timeLeft / timeLimit <= 0.25 && timerActive ? 'animate-pulse' : ''}`}>
                  <AnimatedIcon name="timer" className="text-lg" />
                  <span className="text-2xl font-black font-mono tracking-wider">
                    {Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, '0')}
                  </span>
                  {timesUp
                    ? <span className="text-red-400 text-xs font-bold uppercase tracking-widest ml-2">Time&apos;s up!</span>
                    : <span className="text-[10px] uppercase tracking-widest opacity-40 ml-1">remaining</span>}
                </div>
              )}
              {/* Question Text */}
              <p className="text-2xl text-[#EBDCC4] font-medium leading-relaxed relative z-10">
                {currentQuestion.questionText}
              </p>
            </div>
          </div>

          {currentQuestion.questionFormat === 'OPEN_ENDED' ? (
            <div className="mt-8 relative group">
              <div className="absolute -inset-[1px] rounded-xl bg-gradient-to-r from-[#DC9F85]/20 to-transparent opacity-0 group-focus-within:opacity-100 transition-opacity duration-500" />
              <textarea
                value={answerText}
                onChange={(e) => {
                  setAnswerText(e.target.value);
                  setSelectedOption(e.target.value);
                }}
                rows={6}
                placeholder="Formulate your comprehensive answer here..."
                className="relative w-full bg-[#0D0B0A] border border-[#35211A] rounded-xl p-6 text-[#EBDCC4] text-sm focus:outline-none focus:border-[#DC9F85]/50 transition-all duration-300 tracking-wide leading-relaxed resize-none"
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
                  className={`group/opt relative rounded-xl text-left transition-all duration-300 disabled:opacity-50 ${
                    selectedOption === opt.key ? 'scale-[1.02]' : 'hover:scale-[1.01]'
                  }`}
                >
                  <div className={`absolute -inset-[1px] rounded-xl transition-opacity duration-300 ${
                    selectedOption === opt.key
                      ? 'bg-gradient-to-br from-[#DC9F85]/60 to-[#DC9F85]/20 opacity-100'
                      : 'bg-gradient-to-br from-[#66473B]/30 to-transparent opacity-0 group-hover/opt:opacity-100'
                  }`} />
                  <div className={`relative bg-[#0D0B0A] rounded-xl p-6 border transition-all duration-300 ${
                    selectedOption === opt.key ? 'border-[#DC9F85]/40' : 'border-[#35211A] group-hover/opt:border-[#66473B]/60'
                  }`}>
                    <div className="flex items-center gap-4">
                      <span className={`w-10 h-10 rounded-xl border flex items-center justify-center font-bold text-sm flex-shrink-0 transition-all duration-300 ${
                        selectedOption === opt.key
                          ? 'bg-[#DC9F85] text-[#0D0B0A] border-[#DC9F85]/40 shadow-[0_0_20px_rgba(220,159,133,0.2)]'
                          : 'bg-[#181818] text-[#66473B] border-[#35211A] group-hover/opt:text-[#B6A596] group-hover/opt:border-[#66473B]/60'
                      }`}>
                        {opt.key}
                      </span>
                      <p className={`text-sm leading-relaxed transition-all duration-300 ${
                        selectedOption === opt.key
                          ? 'text-[#EBDCC4] font-semibold translate-x-0.5'
                          : 'text-[#B6A596] group-hover/opt:text-[#EBDCC4] group-hover/opt:translate-x-0.5'
                      }`}>{opt.text}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}

          <div className="flex justify-between items-center pt-8">
            {/* Hint button */}
            <div>
              {!hintRevealed ? (
                <button
                  onClick={revealHint}
                  className="flex items-center gap-2 text-[#66473B] text-xs font-bold uppercase tracking-widest hover:text-[#DC9F85] transition-colors py-2 group/hint"
                >
                  <span className="w-8 h-8 rounded-lg bg-amber-500/5 border border-amber-500/15 flex items-center justify-center group-hover/hint:bg-amber-500/10 transition-colors">
                    <AnimatedIcon name="lightbulb" className="text-sm text-amber-400/60 group-hover/hint:text-amber-400" />
                  </span>
                  Need a hint?
                </button>
              ) : (
                <div className="flex items-start gap-3 p-4 bg-amber-500/5 border border-amber-500/15 rounded-xl max-w-sm">
                  <span className="w-7 h-7 rounded-lg bg-amber-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <AnimatedIcon name="lightbulb" className="text-amber-400 text-sm" />
                  </span>
                  {isLoadingHint
                    ? <p className="text-amber-400/50 text-[10px] animate-pulse uppercase tracking-widest">Generating hint...</p>
                    : <p className="text-amber-200/80 text-xs leading-relaxed">{hintText}</p>}
                </div>
              )}
            </div>
            {/* Submit */}
            <button
              onClick={() => submitAnswer(selectedOption)}
              disabled={!selectedOption || isSubmitting}
              className="relative group/sub disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <div className="absolute -inset-1 bg-gradient-to-r from-[#DC9F85] to-[#EBDCC4] rounded-xl opacity-40 blur-md group-hover/sub:opacity-70 transition-opacity disabled:opacity-0" />
              <div className="relative bg-[#DC9F85] text-[#0D0B0A] px-8 py-4 rounded-xl font-bold tracking-wide hover:brightness-110 transition-all flex items-center gap-2 text-sm">
                {isSubmitting ? 'Evaluating...' : (currentQuestion.questionFormat === 'OPEN_ENDED' ? 'Submit Answer' : 'Submit Option')}
                {!isSubmitting && <AnimatedIcon name="send" className="text-sm" />}
              </div>
            </button>
          </div>
        </div>
      ) : (
        <div className="animate-in fade-in slide-in-from-bottom-8 duration-700 space-y-6">
          {/* Score Header Card */}
          <div className="relative">
            <div className={`absolute -inset-[1px] rounded-2xl bg-gradient-to-br ${
              feedback.score >= 70 ? 'from-emerald-500/30 via-transparent to-emerald-500/10' : 'from-red-500/30 via-transparent to-red-500/10'
            } opacity-60`} />
            <div className="relative bg-[#0D0B0A] rounded-2xl p-10 overflow-hidden">
              <div className={`absolute top-0 left-0 w-full h-1 bg-[#231E1A] overflow-hidden rounded-t-2xl`}>
                <div className={`h-full transition-all duration-1000 ease-out ${feedback.score >= 70 ? 'bg-gradient-to-r from-emerald-500 to-emerald-400' : 'bg-gradient-to-r from-red-500 to-red-400'}`} style={{ width: `${feedback.score}%` }} />
              </div>

              <div className="flex items-center justify-between mt-2">
                <div className="flex items-center gap-5">
                  {/* Score Circle */}
                  <div className={`relative w-20 h-20 rounded-2xl border-2 flex items-center justify-center ${
                    feedback.score >= 70 ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-red-500/30 bg-red-500/5'
                  }`}>
                    <span className={`text-3xl font-black ${feedback.score >= 70 ? 'text-emerald-400' : 'text-red-400'}`}>{feedback.score}</span>
                  </div>
                  <div>
                    <h3 className={`text-2xl font-black flex items-center gap-2 ${
                      currentQuestion.questionFormat === 'OPEN_ENDED'
                        ? (feedback.score >= 70 ? 'text-emerald-400' : 'text-[#B6A596]')
                        : (feedback.score === 100 ? 'text-emerald-400' : 'text-red-400')
                    }`}>
                      <AnimatedIcon name={feedback.score >= 70 ? 'check_circle' : 'cancel'} className="text-3xl" />
                      {currentQuestion.questionFormat === 'OPEN_ENDED'
                        ? `Score: ${feedback.score}/100`
                        : (feedback.score === 100 ? 'Correct' : 'Incorrect')}
                    </h3>
                    <p className="text-[#66473B] text-xs mt-1">Response evaluated against ideal parameters</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Correct Answer Card (MCQ only) */}
          {currentQuestion.questionFormat !== 'OPEN_ENDED' && feedback.score !== 100 && (
            <div className="bg-[#0D0B0A] border border-[#35211A] rounded-2xl p-6 flex items-center gap-4">
              <span className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 font-bold text-sm flex-shrink-0">
                <AnimatedIcon name="lightbulb" className="text-lg" />
              </span>
              <div>
                <p className="text-[9px] uppercase tracking-[0.3em] text-[#66473B] mb-1">Correct Answer</p>
                <p className="text-[#EBDCC4] font-bold">{feedback.idealAnswer}</p>
              </div>
            </div>
          )}

          {currentQuestion.questionFormat !== 'OPEN_ENDED' && feedback.score === 100 && (
            <div className="bg-emerald-500/5 border border-emerald-500/15 rounded-2xl p-6 flex items-center gap-4">
              <span className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center flex-shrink-0">
                <AnimatedIcon name="verified" className="text-emerald-400 text-lg" />
              </span>
              <p className="text-emerald-400 font-bold text-sm tracking-wide">Your response was accurate</p>
            </div>
          )}

          {/* Next / Finish Button */}
          <div className="flex justify-end pt-4">
            <button onClick={() => {
              if (feedback.isSessionComplete || !feedback.nextQuestion) {
                  setIsCompleted(true);
              } else {
                  nextQuestion();
              }
            }} className="relative group/next">
              <div className="absolute -inset-1 bg-gradient-to-r from-[#DC9F85] to-[#EBDCC4] rounded-xl opacity-40 blur-md group-hover/next:opacity-70 transition-opacity" />
              <div className="relative bg-[#DC9F85] text-[#0D0B0A] px-8 py-4 rounded-xl font-bold tracking-wide hover:brightness-110 transition-all flex items-center gap-2 text-sm">
                {(feedback.isSessionComplete || !feedback.nextQuestion) ? 'View Final Report' : 'Next Question'}
                <AnimatedIcon name="arrow_forward" className="text-sm" />
              </div>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
