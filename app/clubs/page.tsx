'use client';

import { useClubs } from '@/hooks/queries/useClubs';

export default function ClubsPage() {
  const { data: clubs, isLoading, isError } = useClubs();

  if (isLoading) return <p className="text-zinc-500">Loading clubs...</p>;
  if (isError) return <p className="text-red-500">Failed to load clubs.</p>;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold text-zinc-900 dark:text-zinc-50">Clubs</h1>
      {clubs && clubs.length > 0 ? (
        <ul className="space-y-3">
          {clubs.map((club) => (
            <li
              key={club.id}
              className="flex items-center justify-between rounded-lg border border-zinc-200 bg-white px-4 py-3 dark:border-zinc-800 dark:bg-zinc-900"
            >
              <div>
                <p className="font-medium text-zinc-900 dark:text-zinc-50">{club.name}</p>
                <p className="text-sm text-zinc-500">{club.city}</p>
              </div>
              <div className="text-right text-sm font-medium text-zinc-700 dark:text-zinc-300">
                <p>{club.points} pts</p>
                <p className="text-xs text-zinc-400">{club.wins}W {club.draws}D {club.losses}L</p>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-zinc-500">No clubs found.</p>
      )}
    </div>
  );
}
