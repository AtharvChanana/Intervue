"use client";

import { useEffect, useRef } from 'react';
import { fetchApi } from '@/lib/api';

export default function VisitTracker() {
  const tracked = useRef(false);

  useEffect(() => {
    if (!tracked.current) {
      tracked.current = true;
      fetchApi('/analytics/visit', { method: 'POST' }).catch(() => {
        // Ignore tracking errors
      });
    }
  }, []);

  return null;
}
