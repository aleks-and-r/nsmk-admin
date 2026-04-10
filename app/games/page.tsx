"use client";

import DataTable from "@/components/admin/DataTable";
import type { GameStatus } from "@/services/games.service";

interface GameRow {
  id: number;
  home_team_name: string;
  away_team_name: string;
  home_score: number | null;
  away_score: number | null;
  scheduled_at: string;
  league_name: string;
  round_name: string;
  status: GameStatus;
}

function formatDate(value: unknown): string {
  if (!value || typeof value !== "string") return "—";
  const d = new Date(value);
  return d.toLocaleDateString("sr-Latn", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const STATUS_STYLES: Record<GameStatus, string> = {
  scheduled: "bg-foreground/10 text-foreground/60",
  in_progress: "bg-yellow-500/10 text-yellow-600",
  finished: "bg-green-500/10 text-green-600",
  cancelled: "bg-red-500/10 text-red-500",
  postponed: "bg-orange-500/10 text-orange-500",
};

const STATUS_LABELS: Record<GameStatus, string> = {
  scheduled: "Scheduled",
  in_progress: "In Progress",
  finished: "Finished",
  cancelled: "Cancelled",
  postponed: "Postponed",
};

const gameColumns = [
  { key: "home_team_name", header: "Home" },
  {
    key: "home_score",
    header: "Score",
    render: (_value: unknown, row: GameRow) => (
      <span className="font-mono font-semibold text-foreground">
        {row.home_score != null && row.away_score != null
          ? `${row.home_score} – ${row.away_score}`
          : "– : –"}
      </span>
    ),
  },
  { key: "away_team_name", header: "Away" },
  {
    key: "scheduled_at",
    header: "Date",
    render: (value: unknown) => (
      <span className="text-foreground/70">{formatDate(value)}</span>
    ),
  },
  { key: "league_name", header: "League" },
  { key: "round_name", header: "Round" },
  {
    key: "status",
    header: "Status",
    render: (value: unknown) => {
      const s = (value as GameStatus) ?? "scheduled";
      return (
        <span
          className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${STATUS_STYLES[s] ?? STATUS_STYLES.scheduled}`}
        >
          {STATUS_LABELS[s] ?? s}
        </span>
      );
    },
  },
];

export default function GamesPage() {
  return (
    <DataTable<GameRow>
      title="Games"
      url="games/"
      columns={gameColumns}
      editBasePath="/games"
    />
  );
}
