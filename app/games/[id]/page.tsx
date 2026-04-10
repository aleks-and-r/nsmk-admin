"use client";

import type { ReactNode } from "react";
import { useEffect, useState, use, useRef } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { useGame } from "@/hooks/queries/useGames";
import { useLeagues, useLeague } from "@/hooks/queries/useLeagues";
import {
  createGame,
  updateGame,
  updateGameScore,
  type GamePayload,
  type GameScorePayload,
  type GameStatus,
} from "@/services/games.service";
import EditPageHeader from "@/components/admin/EditPageHeader";

const STATUS_OPTIONS: { value: GameStatus; label: string }[] = [
  { value: "scheduled", label: "Scheduled" },
  { value: "in_progress", label: "In Progress" },
  { value: "finished", label: "Finished" },
  { value: "cancelled", label: "Cancelled" },
  { value: "postponed", label: "Postponed" },
];

// ── Form state ────────────────────────────────────────────────────────────────

interface FormState {
  league: string;
  round: string;
  playoff_bracket: string;
  home_team: string;
  away_team: string;
  venue: string;
  scheduled_at: string;
  court_name: string;
  status: GameStatus;
  notes: string;
}

const EMPTY_FORM: FormState = {
  league: "",
  round: "",
  playoff_bracket: "",
  home_team: "",
  away_team: "",
  venue: "",
  scheduled_at: "",
  court_name: "",
  status: "scheduled",
  notes: "",
};

type FormErrors = Partial<Record<keyof FormState, string>>;

// ── Score state ───────────────────────────────────────────────────────────────

interface ScoreState {
  home_q1: string;
  home_q2: string;
  home_q3: string;
  home_q4: string;
  away_q1: string;
  away_q2: string;
  away_q3: string;
  away_q4: string;
}

const EMPTY_SCORE: ScoreState = {
  home_q1: "",
  home_q2: "",
  home_q3: "",
  home_q4: "",
  away_q1: "",
  away_q2: "",
  away_q3: "",
  away_q4: "",
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function toDatetimeLocal(iso: string): string {
  if (!iso) return "";
  return iso.slice(0, 16);
}

function numStr(v: number | null | undefined): string {
  return v != null ? String(v) : "";
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function GamePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const isNew = id === "new";
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data: game, isLoading, isError } = useGame(isNew ? "" : id);

  // All leagues for the league dropdown
  const { data: leaguesData } = useLeagues();
  const leagueOptions =
    leaguesData?.results.map((l) => ({
      value: String(l.id),
      label: `${l.name} — ${l.season_name}`,
    })) ?? [];

  // Game info form
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [errors, setErrors] = useState<FormErrors>({});
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "success" | "error">(
    "idle",
  );

  // Teams for the selected league
  const { data: leagueDetail } = useLeague(form.league);
  const teamOptions =
    leagueDetail?.teams.map((t) => ({
      value: String(t.team),
      label: t.team_name,
    })) ?? [];

  // Score form
  const [score, setScore] = useState<ScoreState>(EMPTY_SCORE);
  const [scoreSaving, setScoreSaving] = useState(false);
  const [scoreStatus, setScoreStatus] = useState<"idle" | "success" | "error">(
    "idle",
  );

  useEffect(() => {
    if (game) {
      setForm({
        league: String(game.league ?? ""),
        round: numStr(game.round),
        playoff_bracket: numStr(game.playoff_bracket),
        home_team: String(game.home_team ?? ""),
        away_team: String(game.away_team ?? ""),
        venue: numStr(game.venue),
        scheduled_at: toDatetimeLocal(game.scheduled_at ?? ""),
        court_name: game.court_name ?? "",
        status: game.status ?? "scheduled",
        notes: game.notes ?? "",
      });
      setScore({
        home_q1: numStr(game.home_q1),
        home_q2: numStr(game.home_q2),
        home_q3: numStr(game.home_q3),
        home_q4: numStr(game.home_q4),
        away_q1: numStr(game.away_q1),
        away_q2: numStr(game.away_q2),
        away_q3: numStr(game.away_q3),
        away_q4: numStr(game.away_q4),
      });
    }
  }, [game]);

  function handleChange(key: keyof FormState, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: undefined }));
    setSaveStatus("idle");
  }

  function handleLeagueChange(value: string) {
    setForm((prev) => ({ ...prev, league: value, home_team: "", away_team: "" }));
    if (errors.league) setErrors((prev) => ({ ...prev, league: undefined }));
    setSaveStatus("idle");
  }

  function handleScoreChange(key: keyof ScoreState, value: string) {
    setScore((prev) => ({ ...prev, [key]: value }));
    setScoreStatus("idle");
  }

  function validate(): FormErrors {
    const e: FormErrors = {};
    if (!form.league.trim()) e.league = "League is required.";
    if (!form.home_team.trim()) e.home_team = "Home team is required.";
    if (!form.away_team.trim()) e.away_team = "Away team is required.";
    if (!form.scheduled_at.trim()) e.scheduled_at = "Scheduled date is required.";
    return e;
  }

  async function handleSave() {
    const e = validate();
    if (Object.keys(e).length > 0) {
      setErrors(e);
      return;
    }

    setSaving(true);
    setSaveStatus("idle");
    try {
      const payload: GamePayload = {
        league: Number(form.league),
        home_team: Number(form.home_team),
        away_team: Number(form.away_team),
        scheduled_at: form.scheduled_at,
        status: form.status,
        ...(form.round && { round: Number(form.round) }),
        ...(form.playoff_bracket && {
          playoff_bracket: Number(form.playoff_bracket),
        }),
        ...(form.venue && { venue: Number(form.venue) }),
        ...(form.court_name && { court_name: form.court_name }),
        ...(form.notes && { notes: form.notes }),
      };

      if (isNew) {
        await createGame(payload);
      } else {
        await updateGame(id, payload);
      }

      setSaveStatus("success");
      await queryClient.invalidateQueries({ queryKey: ["games/"] });
      if (isNew) {
        setTimeout(() => router.push("/games"), 1000);
      }
    } catch {
      setSaveStatus("error");
    } finally {
      setSaving(false);
    }
  }

  async function handleScoreSave() {
    setScoreSaving(true);
    setScoreStatus("idle");
    try {
      const toNum = (v: string) => (v.trim() !== "" ? Number(v) : null);
      const payload: GameScorePayload = {
        home_q1: toNum(score.home_q1),
        home_q2: toNum(score.home_q2),
        home_q3: toNum(score.home_q3),
        home_q4: toNum(score.home_q4),
        away_q1: toNum(score.away_q1),
        away_q2: toNum(score.away_q2),
        away_q3: toNum(score.away_q3),
        away_q4: toNum(score.away_q4),
      };
      await updateGameScore(id, payload);
      setScoreStatus("success");
      await queryClient.invalidateQueries({ queryKey: ["games", id] });
    } catch {
      setScoreStatus("error");
    } finally {
      setScoreSaving(false);
    }
  }

  // ── Loading / error states ──────────────────────────────────────────────────

  if (!isNew && isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-64 rounded bg-card-border animate-pulse" />
        <div className="h-4 w-full max-w-lg rounded bg-card-border animate-pulse" />
      </div>
    );
  }

  if (!isNew && (isError || !game)) {
    return <p className="text-red-500 text-sm">Failed to load game.</p>;
  }

  const title = isNew ? "Create game" : "Edit game";
  const subtitle = isNew
    ? ""
    : `${game?.home_team_name ?? ""} vs ${game?.away_team_name ?? ""}`;

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="max-w-2xl space-y-6">
      <EditPageHeader
        title={title}
        subtitle={subtitle}
        breadcrumbs={[
          { label: "Games", href: "/games" },
          {
            label: isNew
              ? "Create new"
              : `${game?.home_team_name ?? ""} vs ${game?.away_team_name ?? ""}`,
          },
        ]}
      />

      {/* ── Game Info ──────────────────────────────────────────────────────── */}
      <div className="bg-card-bg border border-card-border rounded-lg p-6 space-y-5">
        <h2 className="text-sm font-semibold text-foreground/50 uppercase tracking-wider">
          Game Info
        </h2>

        <div className="grid grid-cols-2 gap-4">
          <Field label="League" required error={errors.league}>
            <SearchableSelect
              options={leagueOptions}
              value={form.league}
              onChange={handleLeagueChange}
              placeholder="Select league…"
              hasError={!!errors.league}
            />
          </Field>

          <Field label="Round">
            <input
              type="number"
              value={form.round}
              onChange={(e) => handleChange("round", e.target.value)}
              className={inputCls()}
              min={1}
            />
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Home Team" required error={errors.home_team}>
            <SearchableSelect
              options={teamOptions}
              value={form.home_team}
              onChange={(v) => {
                handleChange("home_team", v);
              }}
              placeholder={form.league ? "Select home team…" : "Select a league first"}
              disabled={!form.league}
              hasError={!!errors.home_team}
            />
          </Field>

          <Field label="Away Team" required error={errors.away_team}>
            <SearchableSelect
              options={teamOptions}
              value={form.away_team}
              onChange={(v) => {
                handleChange("away_team", v);
              }}
              placeholder={form.league ? "Select away team…" : "Select a league first"}
              disabled={!form.league}
              hasError={!!errors.away_team}
            />
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Venue ID">
            <input
              type="number"
              value={form.venue}
              onChange={(e) => handleChange("venue", e.target.value)}
              className={inputCls()}
              min={1}
            />
          </Field>

          <Field label="Playoff Bracket">
            <input
              type="number"
              value={form.playoff_bracket}
              onChange={(e) => handleChange("playoff_bracket", e.target.value)}
              className={inputCls()}
              min={1}
            />
          </Field>
        </div>

        <Field label="Scheduled At" required error={errors.scheduled_at}>
          <input
            type="datetime-local"
            value={form.scheduled_at}
            onChange={(e) => handleChange("scheduled_at", e.target.value)}
            className={inputCls(!!errors.scheduled_at)}
          />
        </Field>

        <Field label="Court Name">
          <input
            type="text"
            value={form.court_name}
            onChange={(e) => handleChange("court_name", e.target.value)}
            className={inputCls()}
          />
        </Field>

        <Field label="Status">
          <select
            value={form.status}
            onChange={(e) =>
              handleChange("status", e.target.value as GameStatus)
            }
            className={inputCls()}
          >
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Notes">
          <textarea
            value={form.notes}
            onChange={(e) => handleChange("notes", e.target.value)}
            className={`${inputCls()} resize-none`}
            rows={3}
          />
        </Field>

        <div className="flex items-center gap-3 pt-2">
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-2 bg-accent hover:bg-accent/90 disabled:opacity-60 text-white font-semibold rounded text-sm transition-colors"
          >
            {saving ? "Saving…" : "Save"}
          </button>

          {saveStatus === "success" && (
            <span className="text-sm text-green-600">
              {isNew ? "Created successfully. Redirecting…" : "Saved successfully."}
            </span>
          )}
          {saveStatus === "error" && (
            <span className="text-sm text-red-500">
              Failed to save. Please try again.
            </span>
          )}
        </div>
      </div>

      {/* ── Score Entry (existing games only) ─────────────────────────────── */}
      {!isNew && (
        <div className="bg-card-bg border border-card-border rounded-lg p-6 space-y-5">
          <div>
            <h2 className="text-sm font-semibold text-foreground/50 uppercase tracking-wider">
              Score Entry
            </h2>
            {game?.quarter_scores_display && (
              <p className="mt-1 text-xs text-foreground/50">
                {game.quarter_scores_display}
              </p>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr>
                  <th className="text-left text-xs font-semibold uppercase tracking-wider text-foreground/50 pb-2 pr-4 w-24">
                    Team
                  </th>
                  {["Q1", "Q2", "Q3", "Q4"].map((q) => (
                    <th
                      key={q}
                      className="text-center text-xs font-semibold uppercase tracking-wider text-foreground/50 pb-2 px-2 w-20"
                    >
                      {q}
                    </th>
                  ))}
                  <th className="text-center text-xs font-semibold uppercase tracking-wider text-foreground/50 pb-2 pl-4 w-20">
                    Total
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-card-border">
                <tr>
                  <td className="py-2 pr-4 text-foreground font-medium truncate max-w-24">
                    {game?.home_team_name ?? "Home"}
                  </td>
                  {(
                    ["home_q1", "home_q2", "home_q3", "home_q4"] as const
                  ).map((k) => (
                    <td key={k} className="py-2 px-2">
                      <input
                        type="number"
                        value={score[k]}
                        onChange={(e) => handleScoreChange(k, e.target.value)}
                        className={`${inputCls()} text-center`}
                        min={0}
                      />
                    </td>
                  ))}
                  <td className="py-2 pl-4 text-center font-mono font-semibold text-foreground">
                    {game?.home_score != null ? game.home_score : "—"}
                  </td>
                </tr>

                <tr>
                  <td className="py-2 pr-4 text-foreground font-medium truncate max-w-24">
                    {game?.away_team_name ?? "Away"}
                  </td>
                  {(
                    ["away_q1", "away_q2", "away_q3", "away_q4"] as const
                  ).map((k) => (
                    <td key={k} className="py-2 px-2">
                      <input
                        type="number"
                        value={score[k]}
                        onChange={(e) => handleScoreChange(k, e.target.value)}
                        className={`${inputCls()} text-center`}
                        min={0}
                      />
                    </td>
                  ))}
                  <td className="py-2 pl-4 text-center font-mono font-semibold text-foreground">
                    {game?.away_score != null ? game.away_score : "—"}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={handleScoreSave}
              disabled={scoreSaving}
              className="px-6 py-2 bg-accent hover:bg-accent/90 disabled:opacity-60 text-white font-semibold rounded text-sm transition-colors"
            >
              {scoreSaving ? "Updating…" : "Update Score"}
            </button>

            {scoreStatus === "success" && (
              <span className="text-sm text-green-600">Score updated.</span>
            )}
            {scoreStatus === "error" && (
              <span className="text-sm text-red-500">
                Failed to update score.
              </span>
            )}
          </div>
        </div>
      )}

      {/* ── Game Details (existing games only) ────────────────────────────── */}
      {!isNew && game && (
        <div className="bg-card-bg border border-card-border rounded-lg p-6">
          <h2 className="text-sm font-semibold text-foreground/50 uppercase tracking-wider mb-4">
            Details
          </h2>
          <dl className="grid grid-cols-2 gap-x-8 gap-y-3 text-sm">
            <DetailRow label="League" value={game.league_name} />
            <DetailRow label="Round" value={game.round_name} />
            <DetailRow label="Venue" value={game.venue_name} />
            <DetailRow label="Court" value={game.court_name} />
            <DetailRow
              label="Home Score"
              value={game.home_score != null ? String(game.home_score) : "—"}
            />
            <DetailRow
              label="Away Score"
              value={game.away_score != null ? String(game.away_score) : "—"}
            />
            {game.notes && (
              <div className="col-span-2">
                <DetailRow label="Notes" value={game.notes} />
              </div>
            )}
          </dl>
        </div>
      )}
    </div>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const inputCls = (hasError = false) =>
  `w-full px-3 py-2 bg-background border rounded text-sm text-foreground focus:ring-2 focus:outline-none ${
    hasError
      ? "border-red-500 focus:ring-red-500"
      : "border-card-border focus:ring-accent"
  }`;

function Field({
  label,
  required,
  error,
  children,
}: {
  label: string;
  required?: boolean;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-foreground mb-1">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-medium text-foreground/50 uppercase tracking-wider">
        {label}
      </dt>
      <dd className="mt-0.5 text-foreground">{value || "—"}</dd>
    </div>
  );
}

// ── SearchableSelect ──────────────────────────────────────────────────────────

interface SelectOption {
  value: string;
  label: string;
}

function SearchableSelect({
  options,
  value,
  onChange,
  placeholder = "Select…",
  disabled = false,
  hasError = false,
}: {
  options: SelectOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  hasError?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  const selected = options.find((o) => o.value === value);
  const filtered = options.filter((o) =>
    o.label.toLowerCase().includes(search.toLowerCase()),
  );

  useEffect(() => {
    function handleOutside(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
        setSearch("");
      }
    }
    if (open) document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, [open]);

  const borderCls = hasError
    ? "border-red-500 focus:ring-red-500"
    : "border-card-border focus:ring-accent";

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => !disabled && setOpen((prev) => !prev)}
        disabled={disabled}
        className={`w-full px-3 py-2 bg-background border rounded text-sm text-left flex items-center justify-between transition-colors focus:outline-none focus:ring-2 ${borderCls} ${
          disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
        }`}
      >
        <span className={selected ? "text-foreground" : "text-foreground/40"}>
          {selected ? selected.label : placeholder}
        </span>
        <svg
          className={`w-4 h-4 text-foreground/40 shrink-0 transition-transform ${open ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {open && (
        <div className="absolute z-50 w-full mt-1 bg-card-bg border border-card-border rounded shadow-lg flex flex-col max-h-60">
          <div className="p-2 border-b border-card-border shrink-0">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search…"
              className="w-full px-2 py-1.5 bg-background border border-card-border rounded text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-accent"
              autoFocus
            />
          </div>
          <div className="overflow-y-auto">
            {filtered.length === 0 ? (
              <p className="px-3 py-2 text-sm text-foreground/50">
                No results.
              </p>
            ) : (
              filtered.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => {
                    onChange(opt.value);
                    setOpen(false);
                    setSearch("");
                  }}
                  className={`w-full text-left px-3 py-2 text-sm transition-colors hover:bg-accent/10 ${
                    opt.value === value
                      ? "text-accent font-medium bg-accent/5"
                      : "text-foreground"
                  }`}
                >
                  {opt.label}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
