"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { fetchApi } from '@/lib/api';
import Logo from '@/components/Logo';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { toast } from 'sonner';
import { Toaster } from '@/components/ui/sonner';

export default function LandingPage() {
  const router = useRouter();

  useEffect(() => {
    if (localStorage.getItem('token')) {
      router.replace('/dashboard');
    }
  }, [router]);

  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotStep, setForgotStep] = useState(1);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotOtp, setForgotOtp] = useState('');
  const [forgotNewPassword, setForgotNewPassword] = useState('');
  const [isProcessingForgot, setIsProcessingForgot] = useState(false);


  const handleSendForgotOtp = async () => {
    setIsProcessingForgot(true);
    try {
      await fetchApi('/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email: forgotEmail })
      });
      setForgotStep(2);
      toast.success('OTP sent! Check your email for the 6-digit code.');
    } catch (e: any) {
      toast.error(e.message || 'Failed to send OTP.');
    } finally {
      setIsProcessingForgot(false);
    }
  };

  const handleResetPassword = async () => {
    setIsProcessingForgot(true);
    try {
      await fetchApi('/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({ email: forgotEmail, otp: forgotOtp, newPassword: forgotNewPassword })
      });
      toast.success('Password reset successfully!');
      setTimeout(() => {
        setShowForgotModal(false);
        setIsLogin(true);
        setEmail(forgotEmail);
      }, 1500);
    } catch (e: any) {
      toast.error(e.message || 'Failed to reset password.');
    } finally {
      setIsProcessingForgot(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isLogin) {
        const response = await fetchApi('/auth/login', {
          method: 'POST',
          body: JSON.stringify({ email, password }),
        });
        localStorage.setItem('token', response.accessToken);
        router.replace('/dashboard');
      } else {
        const response = await fetchApi('/auth/register', {
          method: 'POST',
          body: JSON.stringify({ name, email, password }),
        });
        localStorage.setItem('token', response.accessToken);
        router.replace('/dashboard');
      }
    } catch (err: any) {
      toast.error(err.message || 'Authentication failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Toaster position="top-center" theme="dark" richColors />
      <nav className="fixed top-0 w-full z-50 bg-black border-b border-white/5 flex justify-between items-center px-6 md:px-10 h-20 shadow-[0_20px_50px_rgba(0,0,0,0.5)] font-manrope antialiased tracking-tight">
        <div className="flex items-center gap-3">
          <Logo className="w-8 h-8" />
          <div className="text-xl md:text-2xl font-black tracking-tighter text-white uppercase mt-1">Intervue</div>
        </div>
      </nav>

      <main className="relative pt-24 md:pt-32 pb-24 px-6 md:px-10 min-h-screen flex items-center justify-center">
        {/* Ambient Background Light */}
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-white/5 blur-[120px] rounded-full pointer-events-none"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-white/5 blur-[100px] rounded-full pointer-events-none"></div>

        <section className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-start w-full">
          {/* Hero Content (Editorial Asymmetry) */}
          <div className="lg:col-span-7 pt-12 text-center lg:text-left shadow-none">
            <h1 className="text-5xl md:text-6xl lg:text-8xl font-black tracking-tighter leading-[0.9] text-white mb-6 md:mb-8 mt-6">
              MASTER THE <br /> <span className="text-zinc-600">MOCK INTERVIEW.</span>
            </h1>
            <p className="text-xl md:text-2xl text-on-surface-variant font-light leading-relaxed max-w-xl mb-12">
              Ace your next interview with realistic AI-powered practice. Get instant feedback, track your progress, and build the confidence you need to land your dream job.
            </p>
          </div>

          {/* Auth Form (High-Transparency Glass) */}
          <div className="lg:col-span-5 relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-b from-white/10 to-transparent rounded-xl blur opacity-20 group-hover:opacity-40 transition duration-1000"></div>
            <div className="relative bg-[#0a0a0a] rounded-xl p-10 border border-white/10 shadow-[0_0_40px_rgba(255,255,255,0.05)]">
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-white mb-2">Login</h2>
                <p className="text-zinc-500 text-sm">Create your professional profile.</p>
              </div>


              <form className="space-y-6" onSubmit={handleSubmit}>
                {!isLogin && (
                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase tracking-widest text-zinc-400 font-bold ml-1">Full Name</label>
                    <input
                      required
                      className="w-full bg-transparent border-b border-outline-variant py-3 px-1 text-white placeholder:text-zinc-700 focus:outline-none focus:border-white transition-colors duration-300"
                      placeholder="Alien"
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                    />
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase tracking-widest text-zinc-400 font-bold ml-1">Email</label>
                  <input
                    required
                    className="w-full bg-transparent border-b border-outline-variant py-3 px-1 text-white placeholder:text-zinc-700 focus:outline-none focus:border-white transition-colors duration-300"
                    placeholder="name@company.com"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase tracking-widest text-zinc-400 font-bold ml-1">Password</label>
                  <input
                    required
                    className="w-full bg-transparent border-b border-outline-variant py-3 px-1 text-white placeholder:text-zinc-700 focus:outline-none focus:border-white transition-colors duration-300"
                    placeholder="••••••••"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
                {isLogin && (
                  <div className="flex justify-end mt-2">
                    <button type="button" onClick={() => { setShowForgotModal(true); setForgotStep(1); setForgotEmail(''); setForgotOtp(''); setForgotNewPassword(''); }} className="text-[10px] text-zinc-500 hover:text-white transition-colors font-bold tracking-widest uppercase mb-1">Forgot Password?</button>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 bg-white text-on-primary rounded-lg font-bold tracking-tight hover:bg-zinc-200 transition-all active:scale-[0.98] mt-4 disabled:opacity-50"
                >
                  {loading ? 'Processing...' : (isLogin ? 'Enter Workspace' : 'Register Profile')}
                </button>
              </form>

              <p className="mt-8 text-center text-xs text-zinc-600">
                {isLogin ? "New participant? " : "Existing participant? "}
                <button
                  onClick={() => setIsLogin(!isLogin)}
                  className="text-zinc-400 hover:text-white font-bold underline underline-offset-4 decoration-white/20 hover:decoration-white transition-all"
                >
                  {isLogin ? "Initiate Registration" : "Enter Portal"}
                </button>
              </p>

            </div>
          </div>
        </section>
      </main>

      {showForgotModal && (
        <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4">
          <div className="bg-[#050505] border border-white/10 rounded-2xl w-full max-w-md p-8 shadow-[0_0_50px_rgba(255,255,255,0.05)] animate-in zoom-in-95 duration-300">
            <h2 className="text-2xl font-black text-white mb-2">Password Recovery</h2>
            <p className="text-zinc-500 text-xs mb-8">
              {forgotStep === 1 ? "Enter your email to receive a recovery code." : "Enter your code and new password."}
            </p>


            {forgotStep === 1 ? (
              <div className="space-y-6">
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase tracking-widest text-zinc-400 font-bold ml-1">Account Email</label>
                  <input
                    className="w-full bg-transparent border-b border-outline-variant py-3 px-1 text-white placeholder:text-zinc-700 focus:outline-none focus:border-white transition-colors duration-300"
                    placeholder="name@company.com"
                    type="email"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                  />
                </div>
                <div className="flex gap-4 pt-4">
                  <button onClick={() => setShowForgotModal(false)} className="flex-1 py-3 text-xs bg-white/5 text-white rounded-lg font-bold hover:bg-white/10 transition-colors uppercase tracking-widest">Cancel</button>
                  <button onClick={handleSendForgotOtp} disabled={isProcessingForgot || !forgotEmail} className="flex-1 py-3 text-xs bg-white text-black rounded-lg font-bold hover:bg-zinc-200 transition-colors uppercase tracking-widest disabled:opacity-50">
                    {isProcessingForgot ? 'Sending...' : 'Send OTP'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase tracking-widest text-zinc-400 font-bold ml-1">6-Digit Code</label>
                  <div className="flex justify-center pt-1">
                    <InputOTP maxLength={6} value={forgotOtp} onChange={(val) => setForgotOtp(val)}>
                      <InputOTPGroup>
                        <InputOTPSlot index={0} />
                        <InputOTPSlot index={1} />
                        <InputOTPSlot index={2} />
                        <InputOTPSlot index={3} />
                        <InputOTPSlot index={4} />
                        <InputOTPSlot index={5} />
                      </InputOTPGroup>
                    </InputOTP>
                  </div>
                </div>
                <div className="space-y-1.5 pt-2">
                  <label className="text-[10px] uppercase tracking-widest text-zinc-400 font-bold ml-1">New Password</label>
                  <input
                    className="w-full bg-transparent border-b border-outline-variant py-3 px-1 text-white placeholder:text-zinc-700 focus:outline-none focus:border-white transition-colors duration-300"
                    placeholder="••••••••"
                    type="password"
                    value={forgotNewPassword}
                    onChange={(e) => setForgotNewPassword(e.target.value)}
                  />
                </div>
                <div className="flex gap-4 pt-4">
                  <button onClick={() => setShowForgotModal(false)} className="flex-1 py-3 text-xs bg-white/5 text-white rounded-lg font-bold hover:bg-white/10 transition-colors uppercase tracking-widest">Cancel</button>
                  <button onClick={handleResetPassword} disabled={isProcessingForgot || forgotOtp.length !== 6 || !forgotNewPassword} className="flex-1 py-3 text-xs bg-white text-black rounded-lg font-bold hover:bg-zinc-200 transition-colors uppercase tracking-widest disabled:opacity-50">
                    {isProcessingForgot ? 'Resetting...' : 'Reset Password'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

    </>
  );
}
