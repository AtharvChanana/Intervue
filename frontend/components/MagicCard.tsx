"use client";

import React, { useRef, useEffect, useCallback, ReactNode } from 'react';
import { gsap } from 'gsap';

interface MagicCardProps {
  children: ReactNode;
  className?: string;
  enableSpotlight?: boolean;
  enableBorderGlow?: boolean;
  enableTilt?: boolean;
  enableMagnetism?: boolean;
  enableParticles?: boolean;
  clickRipple?: boolean;
  particleCount?: number;
  spotlightRadius?: number;
  glowColor?: string; // RGB string e.g. "255, 255, 255"
}

const createParticle = (x: number, y: number, color: string): HTMLDivElement => {
  const el = document.createElement('div');
  el.style.cssText = `
    position: absolute;
    width: 3px;
    height: 3px;
    border-radius: 50%;
    background: rgba(${color}, 0.9);
    box-shadow: 0 0 6px rgba(${color}, 0.5);
    pointer-events: none;
    z-index: 100;
    left: ${x}px;
    top: ${y}px;
  `;
  return el;
};

export default function MagicCard({
  children,
  className = '',
  enableSpotlight = true,
  enableBorderGlow = true,
  enableTilt = true,
  enableMagnetism = true,
  enableParticles = true,
  clickRipple = true,
  particleCount = 10,
  spotlightRadius = 300,
  glowColor = '255, 255, 255',
}: MagicCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const particlesRef = useRef<HTMLDivElement[]>([]);
  const timeoutsRef = useRef<number[]>([]);
  const isHoveredRef = useRef(false);
  const magnetRef = useRef<gsap.core.Tween | null>(null);

  const clearParticles = useCallback(() => {
    timeoutsRef.current.forEach(clearTimeout);
    timeoutsRef.current = [];
    magnetRef.current?.kill();
    particlesRef.current.forEach(p => {
      gsap.to(p, {
        scale: 0, opacity: 0, duration: 0.3, ease: 'back.in(1.7)',
        onComplete: () => p.parentNode?.removeChild(p),
      });
    });
    particlesRef.current = [];
  }, []);

  const spawnParticles = useCallback(() => {
    if (!cardRef.current || !isHoveredRef.current) return;
    const { width, height } = cardRef.current.getBoundingClientRect();

    for (let i = 0; i < particleCount; i++) {
      const tid = window.setTimeout(() => {
        if (!isHoveredRef.current || !cardRef.current) return;
        const x = Math.random() * width;
        const y = Math.random() * height;
        const particle = createParticle(x, y, glowColor);
        cardRef.current.appendChild(particle);
        particlesRef.current.push(particle);

        gsap.fromTo(particle,
          { scale: 0, opacity: 0 },
          { scale: 1, opacity: 1, duration: 0.3, ease: 'back.out(1.7)' }
        );
        gsap.to(particle, {
          x: (Math.random() - 0.5) * 80,
          y: (Math.random() - 0.5) * 80,
          rotation: Math.random() * 360,
          duration: 2 + Math.random() * 2,
          ease: 'none',
          repeat: -1,
          yoyo: true,
        });
      }, i * 100);
      timeoutsRef.current.push(tid);
    }
  }, [particleCount, glowColor]);

  useEffect(() => {
    const el = cardRef.current;
    if (!el) return;

    const onEnter = () => {
      isHoveredRef.current = true;
      if (enableParticles) spawnParticles();
    };

    const onLeave = () => {
      isHoveredRef.current = false;
      clearParticles();
      gsap.to(el, { rotateX: 0, rotateY: 0, x: 0, y: 0, duration: 0.4, ease: 'power2.out' });
    };

    const onMove = (e: MouseEvent) => {
      const rect = el.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const cx = rect.width / 2;
      const cy = rect.height / 2;

      // Spotlight + border glow via CSS custom props
      el.style.setProperty('--mouse-x', `${x}px`);
      el.style.setProperty('--mouse-y', `${y}px`);

      if (enableTilt) {
        const rx = ((y - cy) / cy) * -5;
        const ry = ((x - cx) / cx) * 5;
        gsap.to(el, { rotateX: rx, rotateY: ry, duration: 0.1, ease: 'power2.out', transformPerspective: 1000 });
      }

      if (enableMagnetism) {
        const mx = (x - cx) * 0.03;
        const my = (y - cy) * 0.03;
        magnetRef.current = gsap.to(el, { x: mx, y: my, duration: 0.3, ease: 'power2.out' });
      }
    };

    const onClick = (e: MouseEvent) => {
      if (!clickRipple) return;
      const rect = el.getBoundingClientRect();
      const rx = e.clientX - rect.left;
      const ry = e.clientY - rect.top;
      const ripple = document.createElement('div');
      ripple.style.cssText = `
        position: absolute;
        width: 10px; height: 10px;
        border-radius: 50%;
        background: rgba(${glowColor}, 0.3);
        left: ${rx}px; top: ${ry}px;
        pointer-events: none; z-index: 1000;
      `;
      el.appendChild(ripple);
      gsap.fromTo(ripple,
        { scale: 0, opacity: 1 },
        { scale: 40, opacity: 0, duration: 0.7, ease: 'power2.out', onComplete: () => ripple.remove() }
      );
    };

    el.addEventListener('mouseenter', onEnter);
    el.addEventListener('mouseleave', onLeave);
    el.addEventListener('mousemove', onMove);
    el.addEventListener('click', onClick);

    return () => {
      el.removeEventListener('mouseenter', onEnter);
      el.removeEventListener('mouseleave', onLeave);
      el.removeEventListener('mousemove', onMove);
      el.removeEventListener('click', onClick);
      clearParticles();
    };
  }, [spawnParticles, clearParticles, enableTilt, enableMagnetism, enableParticles, clickRipple, glowColor]);

  return (
    <div
      ref={cardRef}
      className={`magic-card ${className}`}
      style={{ position: 'relative', overflow: 'hidden' }}
    >
      {/* Spotlight overlay */}
      {enableSpotlight && (
        <div
          className="magic-spotlight"
          style={{
            position: 'absolute',
            inset: 0,
            pointerEvents: 'none',
            background: `radial-gradient(${spotlightRadius}px circle at var(--mouse-x, 50%) var(--mouse-y, 50%), rgba(${glowColor}, 0.08), transparent 80%)`,
            opacity: 0,
            transition: 'opacity 0.3s ease',
            zIndex: 1,
          }}
        />
      )}

      {/* Border glow overlay */}
      {enableBorderGlow && (
        <div
          className="magic-border-glow"
          style={{
            position: 'absolute',
            inset: 0,
            pointerEvents: 'none',
            borderRadius: 'inherit',
            padding: '1px',
            background: `radial-gradient(${spotlightRadius}px circle at var(--mouse-x, 50%) var(--mouse-y, 50%), rgba(${glowColor}, 0.6), transparent 40%)`,
            WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
            mask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
            WebkitMaskComposite: 'xor',
            maskComposite: 'exclude',
            opacity: 0,
            transition: 'opacity 0.3s ease',
            zIndex: 2,
          }}
        />
      )}

      {/* Content — always above overlays */}
      <div style={{ position: 'relative', zIndex: 3 }}>
        {children}
      </div>

      {/* Hover-activated CSS for overlays */}
      <style>{`
        .magic-card:hover .magic-spotlight { opacity: 1 !important; }
        .magic-card:hover .magic-border-glow { opacity: 1 !important; }
      `}</style>
    </div>
  );
}
