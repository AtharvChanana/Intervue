export default function Logo({ className = "w-8 h-8" }: { className?: string }) {
  return (
    <div className={`relative flex items-center justify-center rounded-xl bg-gradient-to-br from-white to-zinc-500 p-[1px] shadow-[0_0_20px_rgba(255,255,255,0.15)] ${className}`}>
      <div className="w-full h-full bg-[#0a0a0a] rounded-[11px] flex items-center justify-center relative overflow-hidden">
        {/* Ambient Glass Glow */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent"></div>
        
        {/* The SVG Geometry */}
        <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-[60%] h-[60%] z-10 drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]">
          {/* the "I" Structure */}
          <path d="M16 6V26" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
          <path d="M10 6H22" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
          <path d="M10 26H22" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
          
          {/* The "Sight" / Precision Target overlay */}
          <circle cx="16" cy="16" r="5" fill="#0a0a0a" stroke="white" strokeWidth="2" />
          <circle cx="16" cy="16" r="1.5" fill="white" className="animate-pulse" />
        </svg>
      </div>
    </div>
  );
}
