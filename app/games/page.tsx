"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import DataTable from "@/components/admin/DataTable";
import ConfirmDialog from "@/components/admin/ConfirmDialog";
import type { GameStatus } from "@/services/games.service";
import { deleteGame, importGameStats } from "@/services/games.service";
import { useGameStats } from "@/hooks/queries/useGames";
import { useTeams } from "@/hooks/queries/useTeams";

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

interface StatForm {
  player: string;
  team: string;
  ft_made: string;
  two_pt_made: string;
  three_pt_made: string;
}

const EMPTY_STAT_FORM: StatForm = {
  player: "",
  team: "",
  ft_made: "0",
  two_pt_made: "0",
  three_pt_made: "0",
};

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
  // ── Delete state ─────────────────────────────────────────────────────────────
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  // ── Stats modal state ─────────────────────────────────────────────────────
  const [statsGameId, setStatsGameId] = useState<string | null>(null);
  const [statsGameLabel, setStatsGameLabel] = useState("");
  const [statForm, setStatForm] = useState<StatForm>(EMPTY_STAT_FORM);
  const [statSaving, setStatSaving] = useState(false);
  const [statError, setStatError] = useState("");
  const [statSuccess, setStatSuccess] = useState(false);

  const queryClient = useQueryClient();
  const { data: statsData, refetch: refetchStats, isLoading: statsLoading } =
    useGameStats(statsGameId ?? "");
  const { data: teamsData } = useTeams();

  const teamOptions =
    teamsData?.results.map((t) => ({
      value: String(t.id),
      label: `${t.name} — ${t.club_name} (${t.season_name})`,
    })) ?? [];

  // ── Delete handlers ───────────────────────────────────────────────────────
  async function handleDelete() {
    if (!deleteTargetId) return;
    setDeleting(true);
    try {
      await deleteGame(deleteTargetId);
      await queryClient.invalidateQueries({ queryKey: ["games/"] });
      setDeleteTargetId(null);
    } finally {
      setDeleting(false);
    }
  }

  // ── Stats handlers ────────────────────────────────────────────────────────
  function openStats(row: GameRow) {
    setStatsGameId(String(row.id));
    setStatsGameLabel(`${row.home_team_name} vs ${row.away_team_name}`);
    setStatForm(EMPTY_STAT_FORM);
    setStatError("");
    setStatSuccess(false);
  }

  function closeStats() {
    setStatsGameId(null);
  }

  async function handleAddStat() {
    if (!statsGameId) return;
    if (!statForm.player) {
      setStatError("Player ID is required.");
      return;
    }
    if (!statForm.team) {
      setStatError("Team is required.");
      return;
    }
    setStatSaving(true);
    setStatError("");
    setStatSuccess(false);
    try {
      await importGameStats(statsGameId, [
        {
          player: Number(statForm.player),
          team: Number(statForm.team),
          ft_made: Number(statForm.ft_made) || 0,
          two_pt_made: Number(statForm.two_pt_made) || 0,
          three_pt_made: Number(statForm.three_pt_made) || 0,
        },
      ]);
      setStatSuccess(true);
      setStatForm(EMPTY_STAT_FORM);
      await refetchStats();
    } catch {
      setStatError("Failed to add stats. Please try again.");
    } finally {
      setStatSaving(false);
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <>
      <DataTable<GameRow>
        title="Games"
        url="games/"
        columns={gameColumns}
        editBasePath="/games"
        onDelete={(id) => setDeleteTargetId(id)}
        extraActions={(row) => (
          <button
            type="button"
            onClick={() => openStats(row)}
            className="inline-flex items-center justify-center w-7 h-7 rounded bg-foreground/10 hover:bg-foreground/20 text-foreground transition-colors"
            aria-label="View stats"
            title="Game stats"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-3.5 h-3.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
              />
            </svg>
          </button>
        )}
      />

      {/* ── Delete confirm dialog ─────────────────────────────────────────── */}
      <ConfirmDialog
        open={!!deleteTargetId}
        title="Delete game"
        message="Are you sure? This action cannot be undone."
        confirmLabel="Delete"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTargetId(null)}
        loading={deleting}
      />

      {/* ── Stats modal ───────────────────────────────────────────────────── */}
      {statsGameId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/50" onClick={closeStats} />

          {/* Panel */}
          <div className="relative bg-card-bg border border-card-border rounded-lg w-full max-w-3xl max-h-[85vh] flex flex-col shadow-xl">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-card-border shrink-0">
              <div>
                <h2 className="text-base font-semibold text-foreground">
                  Game Stats
                </h2>
                <p className="text-xs text-foreground/50 mt-0.5">
                  {statsGameLabel}
                </p>
              </div>
              <button
                type="button"
                onClick={closeStats}
                className="p-1.5 rounded hover:bg-foreground/10 text-foreground/50 transition-colors"
                aria-label="Close"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            {/* Scrollable body */}
            <div className="overflow-y-auto flex-1 p-6 space-y-6">
              {/* Stats table */}
              <div className="space-y-2">
                <p className="text-xs font-semibold text-foreground/50 uppercase tracking-wider">
                  Player Statistics
                </p>

                {statsLoading && (
                  <div className="space-y-2">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <div
                        key={i}
                        className="h-9 rounded bg-card-border animate-pulse"
                      />
                    ))}
                  </div>
                )}

                {!statsLoading &&
                  (!statsData?.results || statsData.results.length === 0) && (
                    <p className="text-sm text-foreground/40 py-4 text-center">
                      No stats recorded yet.
                    </p>
                  )}

                {!statsLoading &&
                  statsData?.results &&
                  statsData.results.length > 0 && (
                    <div className="overflow-hidden rounded border border-card-border">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-card-border bg-background text-xs font-semibold text-foreground/50 uppercase tracking-wider">
                            <th className="px-3 py-2 text-left">Player</th>
                            <th className="px-3 py-2 text-left">Team</th>
                            <th className="px-3 py-2 text-right">FT</th>
                            <th className="px-3 py-2 text-right">2PT</th>
                            <th className="px-3 py-2 text-right">3PT</th>
                            <th className="px-3 py-2 text-right font-bold">
                              PTS
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {statsData.results.map((s) => (
                            <tr
                              key={s.id}
                              className="border-b border-card-border last:border-0"
                            >
                              <td className="px-3 py-2 text-foreground">
                                {s.player_name}
                              </td>
                              <td className="px-3 py-2 text-foreground/70">
                                {s.team_name}
                              </td>
                              <td className="px-3 py-2 text-right text-foreground/70">
                                {s.ft_made}
                              </td>
                              <td className="px-3 py-2 text-right text-foreground/70">
                                {s.two_pt_made}
                              </td>
                              <td className="px-3 py-2 text-right text-foreground/70">
                                {s.three_pt_made}
                              </td>
                              <td className="px-3 py-2 text-right font-semibold text-foreground">
                                {s.points}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
              </div>

              {/* Add stat form */}
              <div className="space-y-4 border-t border-card-border pt-5">
                <p className="text-xs font-semibold text-foreground/50 uppercase tracking-wider">
                  Add Stats
                </p>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">
                      Player ID <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      value={statForm.player}
                      onChange={(e) =>
                        setStatForm((f) => ({ ...f, player: e.target.value }))
                      }
                      className="w-full px-3 py-2 bg-background border border-card-border rounded text-sm text-foreground focus:ring-2 focus:ring-accent focus:outline-none"
                      min={1}
                      placeholder="e.g. 583"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">
                      Team <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={statForm.team}
                      onChange={(e) =>
                        setStatForm((f) => ({ ...f, team: e.target.value }))
                      }
                      className="w-full px-3 py-2 bg-background border border-card-border rounded text-sm text-foreground focus:ring-2 focus:ring-accent focus:outline-none"
                    >
                      <option value="">Select team…</option>
                      {teamOptions.map((t) => (
                        <option key={t.value} value={t.value}>
                          {t.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">
                      Free Throws
                    </label>
                    <input
                      type="number"
                      value={statForm.ft_made}
                      onChange={(e) =>
                        setStatForm((f) => ({ ...f, ft_made: e.target.value }))
                      }
                      className="w-full px-3 py-2 bg-background border border-card-border rounded text-sm text-foreground focus:ring-2 focus:ring-accent focus:outline-none"
                      min={0}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">
                      2-Pointers
                    </label>
                    <input
                      type="number"
                      value={statForm.two_pt_made}
                      onChange={(e) =>
                        setStatForm((f) => ({
                          ...f,
                          two_pt_made: e.target.value,
                        }))
                      }
                      className="w-full px-3 py-2 bg-background border border-card-border rounded text-sm text-foreground focus:ring-2 focus:ring-accent focus:outline-none"
                      min={0}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">
                      3-Pointers
                    </label>
                    <input
                      type="number"
                      value={statForm.three_pt_made}
                      onChange={(e) =>
                        setStatForm((f) => ({
                          ...f,
                          three_pt_made: e.target.value,
                        }))
                      }
                      className="w-full px-3 py-2 bg-background border border-card-border rounded text-sm text-foreground focus:ring-2 focus:ring-accent focus:outline-none"
                      min={0}
                    />
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={handleAddStat}
                    disabled={statSaving}
                    className="px-5 py-2 bg-accent hover:bg-accent/90 disabled:opacity-60 text-white font-semibold rounded text-sm transition-colors"
                  >
                    {statSaving ? "Saving…" : "Add Stats"}
                  </button>

                  {statSuccess && (
                    <span className="text-sm text-green-600">
                      Stats added successfully.
                    </span>
                  )}
                  {statError && (
                    <span className="text-sm text-red-500">{statError}</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
