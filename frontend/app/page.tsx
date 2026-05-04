"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { fetchApi } from '@/lib/api';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { toast } from 'sonner';
import { Toaster } from '@/components/ui/sonner';

const REVIEWS = [
  { name: "Arjun Mehta", role: "SWE @ Google", stars: 5, text: "Intervue's AI questions were scarily close to my actual Google L4 interviews. Nailed the offer after 3 weeks of practice." },
  { name: "Priya Sharma", role: "PM @ Microsoft", stars: 5, text: "The behavioral module is phenomenal. It identified my weak points in STAR format and I improved drastically within days." },
  { name: "James O'Brien", role: "Backend Eng @ Stripe", stars: 5, text: "I used 6 platforms before this. Intervue is the only one that actually gave me contextual feedback on my code explanations." },
  { name: "Ananya Rao", role: "ML Eng @ Amazon", stars: 5, text: "The leaderboard kept me competitive. Finished top 10 and got shortlisted by 4 companies in the same week." },
  { name: "Carlos Vega", role: "Frontend Dev @ Meta", stars: 5, text: "Real-time feedback after every answer was game-changing. I knew exactly what I was messing up before my actual interviews." },
  { name: "Shreya Patel", role: "Fullstack @ Atlassian", stars: 5, text: "The DSA assessment interface is identical to the real thing. Zero shock factor on interview day — I was completely prepared." },
  { name: "David Kim", role: "DevOps @ Cloudflare", stars: 5, text: "I practiced mock sessions every day for 2 weeks. The AI never repeated a question. Got my dream role at Cloudflare." },
  { name: "Nidhi Kapoor", role: "Data Eng @ Swiggy", stars: 5, text: "The scoring system is brutally honest. It doesn't inflate your confidence — it shows you exactly where you need to grow." },
  { name: "Rohan Desai", role: "iOS Eng @ Apple", stars: 5, text: "I went from failing screening rounds to clearing 5 of 6 final interviews. The progress tracking feature kept me on track." },
  { name: "Sophie Laurent", role: "SRE @ Spotify", stars: 5, text: "The mixed interview mode combining tech and behavioral is unique. Nothing else on the market does this as well as Intervue." },
];

// Duplicate for seamless infinite loop
const ROW_1 = [...REVIEWS.slice(0, 6), ...REVIEWS.slice(0, 6)];
const ROW_2 = [...REVIEWS.slice(4), ...REVIEWS.slice(0, 4), ...REVIEWS.slice(4), ...REVIEWS.slice(0, 4)];

function StarRating({ count }: { count: number }) {
  return (
    <div className="flex gap-0.5 mb-3">
      {Array.from({ length: count }).map((_, i) => (
        <span key={i} style={{ color: 'var(--coral-rust)', fontSize: '11px' }}>★</span>
      ))}
    </div>
  );
}

function ReviewCard({ review }: { review: typeof REVIEWS[0] }) {
  return (
    <div
      className="flex-shrink-0 w-72 p-5 mx-3"
      style={{
        backgroundColor: 'var(--burnt-umber)',
        border: '1px solid var(--deep-earth)',
        borderRadius: '2px',
      }}
    >
      <StarRating count={review.stars} />
      <p className="text-[12px] leading-relaxed mb-4" style={{ color: 'var(--warm-beige)', fontFamily: 'General Sans, sans-serif' }}>
        "{review.text}"
      </p>
      <div className="border-t pt-3" style={{ borderColor: 'var(--deep-earth)' }}>
        <p className="text-[11px] font-bold uppercase tracking-widest" style={{ color: 'var(--coral-rust)' }}>{review.name}</p>
        <p className="text-[10px] uppercase tracking-widest mt-0.5" style={{ color: 'var(--muted-sage)' }}>{review.role}</p>
      </div>
    </div>
  );
}

function FeaturesSection() {
  const features = [
    {
      num: '01',
      title: 'AI-Powered Mock Sessions',
      desc: 'Realistic behavioural and technical interview rounds designed to simulate high-stakes environments with precision. The AI adapts to your role and experience level.',
    },
    {
      num: '02',
      title: 'DSA Code Assessments',
      desc: 'Real coding problems integrated into a high-performance live IDE with instant compilation. Practice LeetCode-style questions under timed conditions.',
    },
    {
      num: '03',
      title: 'Instant AI Feedback',
      desc: 'Quantified scoring across technical and soft-skill metrics with granular insight into strengths and improvement areas — delivered the moment your session ends.',
    },
    {
      num: '04',
      title: 'Global Leaderboard',
      desc: 'Benchmark your performance against the global talent pool. Earn XP, climb protocol ranks, and track improvement over weeks of consistent practice.',
    },
  ];

  const stats = [
    { label: 'Mock Sessions Run',   value: '12,400+' },
    { label: 'Avg Score Improvement', value: '31%' },
    { label: 'Companies Placed At', value: '80+' },
    { label: 'Questions in Bank',   value: '2,000+' },
  ];

  return (
    <div className="w-full bg-transparent">
      {/* Top divider */}
      <div className="h-[1px] w-full" style={{ backgroundColor: 'var(--burnt-umber)' }} />

      <div className="max-w-[1440px] mx-auto px-8 md:px-12 py-24 md:py-32">

        {/* Section Header */}
        <div className="mb-20 flex flex-col md:flex-row md:items-end md:justify-between gap-6">
          <div>
            <span className="text-[10px] uppercase tracking-[0.4em] block mb-4" style={{ color: 'var(--burnt-umber)' }}>
              Protocol Capabilities
            </span>
            <h2 className="display-font text-5xl md:text-7xl font-bold uppercase leading-[0.85] tracking-tight" style={{ color: 'var(--warm-beige)' }}>
              System<br />Features
            </h2>
          </div>
          <p className="text-sm font-light leading-relaxed max-w-sm" style={{ color: 'var(--muted-sage)' }}>
            Every module is precision-engineered to expose your exact gaps and close them — faster than any other platform.
          </p>
        </div>

        {/* 4-column feature grid — editorial numbered cells */}
        <div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4"
          style={{ borderTop: '1px solid var(--burnt-umber)', borderLeft: '1px solid var(--burnt-umber)' }}
        >
          {features.map((f) => (
            <div
              key={f.num}
              className="p-10 flex flex-col justify-between group transition-colors duration-300"
              style={{
                minHeight: '420px',
                borderRight: '1px solid var(--burnt-umber)',
                borderBottom: '1px solid var(--burnt-umber)',
              }}
              onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'var(--ed-card, #1F1A17)')}
              onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
            >
              <div>
                {/* Oversized number */}
                <span
                  className="display-font font-bold block mb-8 leading-none select-none transition-colors duration-300 group-hover:text-opacity-80"
                  style={{ fontSize: 'clamp(72px, 8vw, 120px)', color: 'var(--burnt-umber)', lineHeight: 1 }}
                >
                  {f.num}
                </span>
                {/* Thin divider */}
                <div className="h-[1px] mb-6" style={{ backgroundColor: 'var(--deep-earth)' }} />
                <h3 className="display-font text-xl font-bold uppercase tracking-tight mb-4" style={{ color: 'var(--warm-beige)' }}>
                  {f.title}
                </h3>
              </div>
              <p className="text-[11px] leading-loose uppercase tracking-[0.18em]" style={{ color: 'var(--muted-sage)' }}>
                {f.desc}
              </p>
            </div>
          ))}
        </div>

        {/* Stats bar */}
        <div
          className="mt-0 grid grid-cols-2 md:grid-cols-4"
          style={{ borderLeft: '1px solid var(--burnt-umber)', borderBottom: '1px solid var(--burnt-umber)' }}
        >
          {stats.map((s) => (
            <div
              key={s.label}
              className="px-10 py-8 flex flex-col gap-2"
              style={{ borderRight: '1px solid var(--burnt-umber)' }}
            >
              <span className="display-font text-3xl md:text-4xl font-bold" style={{ color: 'var(--coral-rust)' }}>
                {s.value}
              </span>
              <span className="text-[10px] uppercase tracking-[0.25em]" style={{ color: 'var(--burnt-umber)' }}>
                {s.label}
              </span>
            </div>
          ))}
        </div>

        {/* Closing editorial statement */}
        <div className="mt-24 flex flex-col md:flex-row items-end justify-between gap-12">
          <h2 className="display-font text-4xl md:text-6xl font-bold uppercase leading-[0.85] tracking-tight max-w-2xl" style={{ color: 'var(--warm-beige)' }}>
            Built for those who prepare like professionals.
          </h2>
          <div className="flex flex-col gap-3 shrink-0">
            {[
              ['Interview Types', 'Technical · Behavioural · Mixed'],
              ['Feedback Latency', '< 3 Seconds'],
              ['Session Length', '15 – 45 Min'],
            ].map(([label, value]) => (
              <div key={label} className="flex items-center gap-6">
                <span className="text-[10px] uppercase tracking-widest" style={{ color: 'var(--muted-sage)' }}>{label}</span>
                <span className="text-[10px] uppercase tracking-widest font-bold" style={{ color: 'var(--warm-beige)' }}>{value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom ruled line with centred label */}
        <div className="mt-20 flex items-center gap-6">
          <div className="h-[1px] flex-1" style={{ backgroundColor: 'var(--burnt-umber)' }} />
          <span className="text-[10px] uppercase tracking-[0.5em] font-bold" style={{ color: 'var(--coral-rust)' }}>
            Optimised for the Serious Candidate
          </span>
          <div className="h-[1px] flex-1" style={{ backgroundColor: 'var(--burnt-umber)' }} />
        </div>
      </div>
    </div>
  );
}

function ReviewsTicker() {
  return (
    <div className="w-full overflow-hidden py-10" style={{ borderTop: '1px solid var(--burnt-umber)', borderBottom: '1px solid var(--burnt-umber)' }}>
      {/* Label */}
      <div className="px-8 md:px-12 mb-6 flex items-center gap-4">
        <div className="w-6 h-[1px]" style={{ backgroundColor: 'var(--coral-rust)' }} />
        <span className="text-[10px] uppercase tracking-[0.25em] font-semibold" style={{ color: 'var(--muted-sage)' }}>
          What Interviewers Say
        </span>
      </div>

      {/* Row 1 — moves left */}
      <div className="relative mb-4">
        <div
          className="flex"
          style={{
            animation: 'ticker-left 40s linear infinite',
            width: 'max-content',
          }}
        >
          {ROW_1.map((r, i) => <ReviewCard key={`r1-${i}`} review={r} />)}
        </div>
      </div>

      {/* Row 2 — moves left (slightly faster, offset) */}
      <div className="relative">
        <div
          className="flex"
          style={{
            animation: 'ticker-left 55s linear infinite',
            width: 'max-content',
            animationDelay: '-12s',
          }}
        >
          {ROW_2.map((r, i) => <ReviewCard key={`r2-${i}`} review={r} />)}
        </div>
      </div>

      <style>{`
        @keyframes ticker-left {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        @media (prefers-reduced-motion: reduce) {
          @keyframes ticker-left { 0%, 100% { transform: translateX(0); } }
        }
      `}</style>
    </div>
  );
}


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

      {/* Google Fonts */}
      <style>{`
        @import url('https://api.fontshare.com/v2/css?f[]=clash-grotesk@700&f[]=general-sans@300,400,500,700&display=swap');
        :root {
          --matte-black: #181818;
          --warm-beige: #EBDCC4;
          --muted-sage: #B6A596;
          --coral-rust: #DC9F85;
          --deep-earth: #66473B;
          --burnt-umber: #35211A;
        }
        .display-font { font-family: 'Clash Grotesk', sans-serif; }
        .body-font { font-family: 'General Sans', sans-serif; }
        .headline-outline {
          -webkit-text-stroke: 1px var(--deep-earth);
          color: transparent;
          transform: translate(4px, 4px);
        }
        .text-layer-container { display: grid; grid-template-columns: 1fr; }
        .text-layer-container > * { grid-area: 1 / 1; }
        ::selection { background: var(--coral-rust); color: var(--matte-black); }
      `}</style>

      <div className="min-h-screen flex flex-col relative body-font" style={{ color: 'var(--warm-beige)' }}>

        {/* Nav */}
        <nav className="absolute top-0 w-full px-8 md:px-12 py-10 flex items-center justify-between z-50">
          <div className="flex items-center gap-4">
            <span className="text-[10px] tracking-[0.3em] font-medium" style={{ color: 'var(--muted-sage)' }}>INTERVUE—PROTOCOL 01</span>
          </div>
          <div className="flex-1 mx-12 hidden md:block">
            <div className="h-[1px] w-full" style={{ backgroundColor: 'var(--burnt-umber)' }} />
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[10px] tracking-widest font-bold" style={{ color: 'var(--burnt-umber)' }}>PRECISION TRAINING</span>
          </div>
        </nav>

        {/* Hero */}
        <main className="flex-1 flex flex-col pt-40 md:pt-52">
          <div className="px-8 md:px-12 mb-6">
            <div className="flex items-center gap-4">
              <div className="w-6 h-[1px]" style={{ backgroundColor: 'var(--coral-rust)' }} />
              <span className="text-xs uppercase tracking-[0.2em] font-semibold" style={{ color: 'var(--muted-sage)' }}>AI Mock Interview Platform</span>
            </div>
          </div>

          <section className="px-4 md:px-8">
            <div className="text-layer-container">
              <h1 className="display-font font-bold uppercase leading-[0.85] tracking-tighter headline-outline select-none" style={{ fontSize: 'clamp(60px, 14vw, 180px)' }}>
                INTERVUE
              </h1>
              <h1 className="display-font font-bold uppercase leading-[0.85] tracking-tighter" style={{ fontSize: 'clamp(60px, 14vw, 180px)', color: 'var(--warm-beige)' }}>
                INTERVUE
              </h1>
            </div>
          </section>

          {/* Bottom Content Grid */}
          <div className="mt-12 md:mt-20 w-full">
            <div className="divider-line w-full" />
            <div className="max-w-[1440px] mx-auto px-8 md:px-12 py-12 grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-0">

              {/* Left Statement */}
              <div className="lg:col-span-5 flex flex-col justify-between gap-8">
                <p className="text-xl md:text-2xl font-light leading-relaxed max-w-lg" style={{ color: 'var(--warm-beige)' }}>
                  Master your next interview with realistic AI-powered sessions. Get instant feedback, track your progress, and build the confidence to land your dream role.
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: 'var(--coral-rust)' }} />
                  <span className="text-xs uppercase tracking-widest font-medium" style={{ color: 'var(--muted-sage)' }}>Sessions Active Now</span>
                </div>
              </div>

              {/* Right Auth Form */}
              <div className="lg:col-start-7 lg:col-span-6 flex flex-col">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-[10px] uppercase tracking-widest" style={{ color: 'var(--muted-sage)' }}>
                    {isLogin ? 'Access Your Profile' : 'Register Protocol'}
                  </span>
                  <button
                    onClick={() => setIsLogin(!isLogin)}
                    className="text-[10px] uppercase tracking-widest font-bold transition-colors"
                    style={{ color: 'var(--coral-rust)' }}
                  >
                    {isLogin ? 'Register →' : '← Login'}
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="flex flex-col gap-3">
                  {!isLogin && (
                    <input
                      required
                      type="text"
                      placeholder="FULL NAME"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="form-input-editorial w-full px-4 py-4 text-sm tracking-widest rounded-sm"
                    />
                  )}
                  <input
                    required
                    type="email"
                    placeholder="EMAIL@PROTOCOL.SH"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="form-input-editorial w-full px-4 py-4 text-sm tracking-widest rounded-sm"
                  />
                  <div className="flex flex-row w-full">
                    <input
                      required
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="form-input-editorial flex-1 px-4 py-4 text-sm tracking-widest"
                      style={{ borderRadius: '2px 0 0 2px' }}
                    />
                    <button
                      type="submit"
                      disabled={loading}
                      className="editorial-btn px-8 md:px-10 py-4 text-xs font-bold uppercase tracking-widest whitespace-nowrap"
                      style={{ borderRadius: '0 2px 2px 0' }}
                    >
                      {loading ? '...' : (isLogin ? 'Enter' : 'Register')}
                    </button>
                  </div>
                </form>

                {isLogin && (
                  <button
                    onClick={() => { setShowForgotModal(true); setForgotStep(1); setForgotEmail(''); setForgotOtp(''); setForgotNewPassword(''); }}
                    className="mt-3 text-[10px] uppercase tracking-[0.2em] text-left transition-colors"
                    style={{ color: 'var(--burnt-umber)' }}
                    onMouseEnter={e => (e.currentTarget.style.color = 'var(--muted-sage)')}
                    onMouseLeave={e => (e.currentTarget.style.color = 'var(--burnt-umber)')}
                  >
                    Forgot Password? →
                  </button>
                )}
              </div>
            </div>
          </div>
        </main>

        {/* Reviews Ticker */}
        <ReviewsTicker />

        {/* Features Section */}
        <FeaturesSection />

        {/* Footer */}
        <footer className="px-8 md:px-12 py-10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex gap-8 text-[10px] tracking-widest uppercase font-medium" style={{ color: 'var(--burnt-umber)' }}>
            <span>© 2025 INTERVUE SYSTEMS</span>
          </div>
          <div className="text-[10px] tracking-widest uppercase font-medium" style={{ color: 'var(--burnt-umber)' }}>
            ALL RIGHTS RESERVED
          </div>
        </footer>

        {/* Rotating Badge */}
        <div className="fixed bottom-8 right-8 z-50 pointer-events-none md:pointer-events-auto">
          <div className="relative w-24 h-24 flex items-center justify-center">
            <svg className="rotating-text w-full h-full" viewBox="0 0 100 100">
              <defs>
                <path id="circlePath" d="M 50, 50 m -37, 0 a 37,37 0 1,1 74,0 a 37,37 0 1,1 -74,0" />
              </defs>
              <text fontSize="7.5" fontWeight="bold" fill="#35211A" letterSpacing="2">
                <textPath xlinkHref="#circlePath">AI INTERVIEW • AI INTERVIEW • AI INTERVIEW •</textPath>
              </text>
            </svg>
            <div className="absolute w-20 h-20 rounded-full border" style={{ borderColor: 'var(--burnt-umber)' }} />
          </div>
        </div>

        {/* Forgot Password Modal */}
        {showForgotModal && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(24,24,24,0.97)' }}>
            <div className="w-full max-w-md border p-8 animate-in zoom-in-95 duration-200" style={{ backgroundColor: 'var(--matte-black)', borderColor: 'var(--deep-earth)', borderRadius: '2px' }}>
              <div className="mb-2">
                <span className="text-[10px] uppercase tracking-[0.3em] font-medium" style={{ color: 'var(--muted-sage)' }}>Password Recovery Protocol</span>
              </div>
              <h2 className="display-font text-2xl font-bold uppercase mb-6" style={{ color: 'var(--warm-beige)' }}>
                {forgotStep === 1 ? 'Enter Email' : 'Enter Code'}
              </h2>
              <div className="h-[1px] mb-6" style={{ backgroundColor: 'var(--burnt-umber)' }} />

              {forgotStep === 1 ? (
                <div className="space-y-4">
                  <input
                    className="form-input-editorial w-full px-4 py-4 text-sm tracking-widest rounded-sm"
                    placeholder="EMAIL@PROTOCOL.SH"
                    type="email"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                  />
                  <div className="flex gap-3 pt-2">
                    <button onClick={() => setShowForgotModal(false)} className="flex-1 py-3 text-xs uppercase tracking-widest font-bold transition-colors border" style={{ color: 'var(--muted-sage)', borderColor: 'var(--deep-earth)', background: 'transparent', borderRadius: '2px' }}>
                      Cancel
                    </button>
                    <button onClick={handleSendForgotOtp} disabled={isProcessingForgot || !forgotEmail} className="editorial-btn flex-1 py-3 text-xs font-bold uppercase tracking-widest rounded-sm">
                      {isProcessingForgot ? 'Sending...' : 'Send OTP'}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-5">
                  <div>
                    <p className="text-[10px] uppercase tracking-widest mb-3" style={{ color: 'var(--muted-sage)' }}>6-Digit Code</p>
                    <div className="flex justify-center">
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
                  <div>
                    <p className="text-[10px] uppercase tracking-widest mb-2" style={{ color: 'var(--muted-sage)' }}>New Password</p>
                    <input
                      className="form-input-editorial w-full px-4 py-4 text-sm tracking-widest rounded-sm"
                      placeholder="••••••••"
                      type="password"
                      value={forgotNewPassword}
                      onChange={(e) => setForgotNewPassword(e.target.value)}
                    />
                  </div>
                  <div className="flex gap-3 pt-2">
                    <button onClick={() => setShowForgotModal(false)} className="flex-1 py-3 text-xs uppercase tracking-widest font-bold border transition-colors" style={{ color: 'var(--muted-sage)', borderColor: 'var(--deep-earth)', background: 'transparent', borderRadius: '2px' }}>
                      Cancel
                    </button>
                    <button onClick={handleResetPassword} disabled={isProcessingForgot || forgotOtp.length !== 6 || !forgotNewPassword} className="editorial-btn flex-1 py-3 text-xs font-bold uppercase tracking-widest rounded-sm">
                      {isProcessingForgot ? 'Resetting...' : 'Reset Password'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
