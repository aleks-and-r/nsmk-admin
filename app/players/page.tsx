"use client";

import { usePlayers } from "@/hooks/queries/usePlayers";

export default function PlayersPage() {
  const { data: players, isLoading, isError } = usePlayers();

  if (isLoading) return <p className="text-zinc-500">Loading players...</p>;
  if (isError) return <p className="text-red-500">Failed to load players.</p>;

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-zinc-900 dark:text-zinc-50">
        Players
      </h1>
      {players && players.length > 0 ? (
        <ul className="space-y-3">
          {players.map((player) => (
            <li
              key={player.id}
              className="flex items-center justify-between rounded-lg border border-zinc-200 bg-white px-4 py-3 dark:border-zinc-800 dark:bg-zinc-900"
            >
              <div>
                <p className="font-medium text-zinc-900 dark:text-zinc-50">
                  {player.name}
                </p>
                <p className="text-sm text-zinc-500">
                  {player.clubName} · {player.position}
                </p>
              </div>
              <div className="text-right text-sm text-zinc-500">
                <p>{player.goals} goals</p>
                <p>{player.assists} assists</p>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-zinc-500">No players found.</p>
      )}
    </div>
  );
}
