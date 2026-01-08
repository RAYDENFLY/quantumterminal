'use client';

import { useEffect, useState } from 'react';
import TopBar from '@/components/TopBar';

/**
 * Client-only wrapper for pages that need to render TopBar but don't participate in
 * the single-page module switcher state (e.g. /terms, /privacy).
 */
export default function TopBarShell({ initialModule = 'market' }: { initialModule?: string }) {
  const [activeModule, setActiveModule] = useState(initialModule);

  // Keep in sync if the query param changes (e.g. user comes from /?module=research)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const sp = new URLSearchParams(window.location.search);
    const mod = sp.get('module');
    if (mod) setActiveModule(mod);
  }, []);

  return <TopBar activeModule={activeModule} setActiveModule={setActiveModule} />;
}
