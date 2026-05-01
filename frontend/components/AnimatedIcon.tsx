"use client";

import React, { useRef, useState, useEffect } from 'react';
import { motion, useAnimation, type Variants } from 'motion/react';

/**
 * AnimatedIcon — Drop-in replacement for <span className="material-symbols-outlined">
 * Adds hover-triggered micro-animations to every icon automatically.
 * 
 * Usage: <AnimatedIcon name="settings" className="text-xl" />
 * 
 * Supports animateOnHover (default true) and animateOnView.
 */

// Icon-specific animation presets
const iconAnimations: Record<string, Variants> = {
  // Rotation-based
  settings: {
    initial: { rotate: 0 },
    animate: { rotate: [0, 90, 0], transition: { duration: 0.6, ease: 'easeInOut' } },
  },
  refresh: {
    initial: { rotate: 0 },
    animate: { rotate: [0, 360], transition: { duration: 0.5, ease: 'easeInOut' } },
  },
  sync: {
    initial: { rotate: 0 },
    animate: { rotate: [0, 360], transition: { duration: 0.5, ease: 'easeInOut' } },
  },

  // Bell/notification ring
  notifications: {
    initial: { rotate: 0, transformOrigin: 'top center' },
    animate: { rotate: [0, 15, -10, 8, -5, 3, 0], transition: { duration: 0.7, ease: 'easeInOut' } },
  },

  // Bounce/scale
  token: {
    initial: { scale: 1 },
    animate: { scale: [1, 1.25, 0.95, 1.1, 1], transition: { duration: 0.5 } },
  },
  verified: {
    initial: { scale: 1 },
    animate: { scale: [1, 1.2, 0.95, 1.05, 1], transition: { duration: 0.4 } },
  },
  star: {
    initial: { scale: 1, rotate: 0 },
    animate: { scale: [1, 1.3, 1], rotate: [0, 72, 0], transition: { duration: 0.5 } },
  },
  workspace_premium: {
    initial: { scale: 1 },
    animate: { scale: [1, 1.2, 0.95, 1.1, 1], transition: { duration: 0.5 } },
  },
  military_tech: {
    initial: { scale: 1 },
    animate: { scale: [1, 1.15, 0.9, 1.08, 1], transition: { duration: 0.5 } },
  },
  developer_mode: {
    initial: { scale: 1 },
    animate: { scale: [1, 1.15, 0.95, 1], transition: { duration: 0.4 } },
  },

  // Shake
  warning: {
    initial: { x: 0 },
    animate: { x: [0, -4, 4, -3, 3, -1, 0], transition: { duration: 0.5, ease: 'easeInOut' } },
  },
  block: {
    initial: { x: 0 },
    animate: { x: [0, -3, 3, -2, 2, 0], transition: { duration: 0.4 } },
  },
  error: {
    initial: { x: 0 },
    animate: { x: [0, -4, 4, -3, 3, -1, 0], transition: { duration: 0.5 } },
  },

  // Pulse/glow
  local_fire_department: {
    initial: { scale: 1, y: 0 },
    animate: { scale: [1, 1.1, 1.05, 1.15, 1], y: [0, -2, 0, -1, 0], transition: { duration: 0.6 } },
  },
  lightbulb: {
    initial: { scale: 1, filter: 'brightness(1)' },
    animate: { scale: [1, 1.1, 1], filter: ['brightness(1)', 'brightness(1.5)', 'brightness(1)'], transition: { duration: 0.5 } },
  },
  insights: {
    initial: { scale: 1 },
    animate: { scale: [1, 1.12, 0.96, 1], transition: { duration: 0.4 } },
  },

  // Slide/enter
  arrow_forward: {
    initial: { x: 0 },
    animate: { x: [0, 6, 0], transition: { duration: 0.4, ease: 'easeInOut' } },
  },
  send: {
    initial: { x: 0, y: 0 },
    animate: { x: [0, 4, 0], y: [0, -3, 0], transition: { duration: 0.4 } },
  },
  play_arrow: {
    initial: { scale: 1 },
    animate: { scale: [1, 1.2, 1], transition: { duration: 0.3 } },
  },
  logout: {
    initial: { x: 0 },
    animate: { x: [0, 5, 0], transition: { duration: 0.3 } },
  },

  // Float up
  upload: {
    initial: { y: 0 },
    animate: { y: [0, -4, 0], transition: { duration: 0.4, ease: 'easeInOut' } },
  },
  upload_file: {
    initial: { y: 0 },
    animate: { y: [0, -4, 0], transition: { duration: 0.4 } },
  },
  cloud_upload: {
    initial: { y: 0 },
    animate: { y: [0, -4, 0], transition: { duration: 0.4 } },
  },

  // Flip/wink
  person: {
    initial: { rotateY: 0 },
    animate: { rotateY: [0, 180, 360], transition: { duration: 0.5, ease: 'easeInOut' } },
  },
  account_circle: {
    initial: { rotateY: 0 },
    animate: { rotateY: [0, 180, 360], transition: { duration: 0.5, ease: 'easeInOut' } },
  },
  group: {
    initial: { scale: 1 },
    animate: { scale: [1, 1.1, 1], transition: { duration: 0.4 } },
  },

  // Pencil/edit
  edit: {
    initial: { rotate: 0 },
    animate: { rotate: [0, -15, 0], transition: { duration: 0.3 } },
  },

  // Code pulse
  code: {
    initial: { scaleX: 1 },
    animate: { scaleX: [1, 1.15, 0.95, 1], transition: { duration: 0.4 } },
  },
  terminal: {
    initial: { opacity: 1 },
    animate: { opacity: [1, 0.5, 1], transition: { duration: 0.6, repeat: 1 } },
  },

  // Menu toggle
  menu: {
    initial: { rotate: 0 },
    animate: { rotate: [0, 90, 0], transition: { duration: 0.3 } },
  },
  close: {
    initial: { rotate: 0, scale: 1 },
    animate: { rotate: [0, 90, 0], scale: [1, 0.8, 1], transition: { duration: 0.3 } },
  },

  // Expand
  expand_more: {
    initial: { y: 0 },
    animate: { y: [0, 3, 0], transition: { duration: 0.3 } },
  },
  unfold_more: {
    initial: { scaleY: 1 },
    animate: { scaleY: [1, 1.3, 1], transition: { duration: 0.3 } },
  },

  // Chart
  show_chart: {
    initial: { scaleY: 1, transformOrigin: 'bottom' },
    animate: { scaleY: [1, 1.2, 1], transition: { duration: 0.4 } },
  },
  leaderboard: {
    initial: { scaleY: 1, transformOrigin: 'bottom' },
    animate: { scaleY: [0.8, 1.05, 1], transition: { duration: 0.4 } },
  },
  trending_up: {
    initial: { y: 0 },
    animate: { y: [0, -3, 0], transition: { duration: 0.4 } },
  },

  // Misc
  history: {
    initial: { rotate: 0 },
    animate: { rotate: [0, -360], transition: { duration: 0.6, ease: 'easeInOut' } },
  },
  timer: {
    initial: { rotate: 0 },
    animate: { rotate: [0, 15, -15, 0], transition: { duration: 0.4 } },
  },
  description: {
    initial: { y: 0 },
    animate: { y: [0, -2, 0], transition: { duration: 0.3 } },
  },
  add: {
    initial: { rotate: 0, scale: 1 },
    animate: { rotate: [0, 90, 0], scale: [1, 1.2, 1], transition: { duration: 0.3 } },
  },
  remove: {
    initial: { scale: 1 },
    animate: { scale: [1, 0.8, 1.1, 1], transition: { duration: 0.3 } },
  },
  check_circle: {
    initial: { scale: 1 },
    animate: { scale: [1, 1.2, 0.95, 1], transition: { duration: 0.4 } },
  },
  task_alt: {
    initial: { scale: 1 },
    animate: { scale: [1, 1.2, 0.95, 1], transition: { duration: 0.4 } },
  },
  lock_person: {
    initial: { y: 0 },
    animate: { y: [0, -3, 0, -1, 0], transition: { duration: 0.5 } },
  },
  mark_email_read: {
    initial: { scale: 1 },
    animate: { scale: [1, 1.1, 1], transition: { duration: 0.4 } },
  },
  psychology: {
    initial: { rotate: 0 },
    animate: { rotate: [0, 10, -10, 5, -5, 0], transition: { duration: 0.6 } },
  },
  science: {
    initial: { rotate: 0 },
    animate: { rotate: [0, 8, -8, 4, 0], transition: { duration: 0.5 } },
  },
  radar: {
    initial: { rotate: 0 },
    animate: { rotate: [0, 360], transition: { duration: 1, ease: 'linear' } },
  },
  sports_score: {
    initial: { x: 0 },
    animate: { x: [0, 3, 0], transition: { duration: 0.3 } },
  },
  flag: {
    initial: { rotate: 0, transformOrigin: 'bottom left' },
    animate: { rotate: [0, -5, 5, -3, 0], transition: { duration: 0.5 } },
  },
  video_call: {
    initial: { scale: 1 },
    animate: { scale: [1, 1.1, 1], transition: { duration: 0.3, repeat: 1 } },
  },
  work: {
    initial: { y: 0 },
    animate: { y: [0, -2, 0], transition: { duration: 0.3 } },
  },
  grid_view: {
    initial: { scale: 1 },
    animate: { scale: [1, 1.1, 1], transition: { duration: 0.3 } },
  },
  replay: {
    initial: { rotate: 0 },
    animate: { rotate: [0, -360], transition: { duration: 0.5 } },
  },
  add_a_photo: {
    initial: { scale: 1 },
    animate: { scale: [1, 1.1, 0.95, 1], transition: { duration: 0.4 } },
  },
  assignment_turned_in: {
    initial: { scale: 1 },
    animate: { scale: [1, 1.15, 1], transition: { duration: 0.3 } },
  },
};

// Default animation for icons without a specific preset
const defaultAnimation: Variants = {
  initial: { scale: 1 },
  animate: { scale: [1, 1.12, 0.96, 1], transition: { duration: 0.35 } },
};

interface AnimatedIconProps {
  name: string;
  className?: string;
  animateOnHover?: boolean;
  animateOnView?: boolean;
  style?: React.CSSProperties;
  title?: string;
}

export default function AnimatedIcon({
  name,
  className = '',
  animateOnHover = true,
  animateOnView = false,
  style,
  title,
}: AnimatedIconProps) {
  const controls = useAnimation();
  const ref = useRef<HTMLSpanElement>(null);
  const [hasAnimated, setHasAnimated] = useState(false);

  // IntersectionObserver for animateOnView
  useEffect(() => {
    if (!animateOnView || !ref.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated) {
          controls.start('animate');
          setHasAnimated(true);
        }
      },
      { threshold: 0.5 }
    );
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, [animateOnView, controls, hasAnimated]);

  const variants = iconAnimations[name] || defaultAnimation;

  return (
    <motion.span
      ref={ref}
      className={`material-symbols-outlined ${className}`}
      style={{ display: 'inline-flex', ...style }}
      variants={variants}
      initial="initial"
      animate={controls}
      onHoverStart={() => {
        if (animateOnHover) controls.start('animate');
      }}
      onHoverEnd={() => {
        if (animateOnHover) controls.start('initial');
      }}
      title={title}
    >
      {name}
    </motion.span>
  );
}
