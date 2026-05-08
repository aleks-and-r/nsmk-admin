'use client';

import { useTheme } from 'next-themes';
import { useSyncExternalStore } from 'react';
import SunIcon from '@/components/icons/SunIcon';
import MoonIcon from '@/components/icons/MoonIcon';

// Returns false during SSR/hydration, true once mounted on the client.
const subscribe = () => () => {};
const useMounted = () => useSyncExternalStore(subscribe, () => true, () => false);

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const mounted = useMounted();

  if (!mounted) return <div className="h-9 w-9" />;

  const isDark = theme === 'dark';

  return (
    <button
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      aria-label="Toggle theme"
      className="flex h-9 w-9 items-center justify-center rounded-md border border-card-border bg-card-bg text-foreground transition-colors hover:bg-black/5 dark:hover:bg-white/5"
    >
      {isDark ? <SunIcon /> : <MoonIcon />}
    </button>
  );
}
