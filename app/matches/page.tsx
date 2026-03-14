'use client';

import { useMatches } from '@/hooks/queries/useMatches';

export default function MatchesPage() {
  const { data: matches, isLoading, isError } = useMatches();

  if (isLoading) return <p className="text-zinc-500">Loading matches...</p>;
  if (isError) return <p className="text-red-500">Failed to load matches.</p>;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold text-zinc-900 dark:text-zinc-50">Matches</h1>
      {matches && matches.length > 0 ? (
        <ul className="space-y-3">
          {matches.map((match) => (
            <li
              key={match.id}
              className="flex items-center justify-between rounded-lg border border-zinc-200 bg-white px-4 py-3 dark:border-zinc-800 dark:bg-zinc-900"
            >
              <span className="font-medium text-zinc-900 dark:text-zinc-50">{match.homeClub}</span>
              <span className="text-sm font-semibold text-zinc-500">
                {match.homeScore} – {match.awayScore}
              </span>
              <span className="font-medium text-zinc-900 dark:text-zinc-50">{match.awayClub}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-zinc-500">No matches found.</p>
      )}
    </div>
  );
}
