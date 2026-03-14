'use client';

import { useEffect } from 'react';
import { usePlayers } from '@/hooks/queries/usePlayers';

export default function TakmicenjaPage() {
  const { data: players, isLoading, isError } = usePlayers();

  useEffect(() => {
    if (players) {
      console.log('players', players);
    }
  }, [players]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="mb-6 text-xl font-bold tracking-[0.25em] text-[#e07b35] uppercase">
        Takmičenja
      </h1>
      {isLoading && <p className="text-zinc-400">Loading...</p>}
      {isError && <p className="text-red-400">Failed to load players.</p>}
    </div>
  );
}
