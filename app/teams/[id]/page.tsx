"use client";

import type { ReactNode } from "react";
import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { useTeam, useTeamMemberships } from "@/hooks/queries/useTeams";
import { useLeagueMembershipsByTeam } from "@/hooks/queries/useLeagueMemberships";
import { useLeagues } from "@/hooks/queries/useLeagues";
import { useClubs } from "@/hooks/queries/useClubs";
import {
  createTeam,
  updateTeam,
  type TeamPayload,
} from "@/services/teams.service";
import {
  deleteTeamMembership,
  bulkUpdateTeamMemberships,
  type TeamMembership,
} from "@/services/team-memberships.service";
import {
  deleteLeagueMembership,
  type LeagueMembership,
} from "@/services/league-memberships.service";
import EditPageHeader from "@/components/admin/EditPageHeader";
import Button from "@/components/admin/Button";
import MembershipModal from "@/components/admin/MembershipModal";
import ConfirmDialog from "@/components/admin/ConfirmDialog";
import EditIcon from "@/components/icons/EditIcon";
import DeleteIcon from "@/components/icons/DeleteIcon";

// ── Form state ────────────────────────────────────────────────────────────────

interface FormState {
  name: string;
  club: string;
  is_active: boolean;
}

const EMPTY: FormState = {
  name: "",
  club: "",
  is_active: true,
};

type FormErrors = Partial<Record<keyof FormState, string>>;

// ── Page ──────────────────────────────────────────────────────────────────────

export default function TeamPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const isNew = id === "new";
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data: team, isLoading, isError, refetch: refetchTeam } = useTeam(isNew ? "" : id);
  const { data: clubsData, refetch: refetchClubs } = useClubs();
  const { data: playerMemberships, refetch: refetchPlayerMemberships } = useTeamMemberships(isNew ? "" : id);
  const { data: leagueMemberships, refetch: refetchLeagueMemberships } = useLeagueMembershipsByTeam(
    isNew ? "" : id,
  );
  const { refetch: refetchLeagues } = useLeagues();

  useEffect(() => {
    refetchClubs();
    refetchLeagues();
    if (!isNew) {
      refetchTeam();
      refetchPlayerMemberships();
      refetchLeagueMemberships();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [form, setForm] = useState<FormState>(EMPTY);
  const [errors, setErrors] = useState<FormErrors>({});
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "success" | "error">(
    "idle",
  );

  // Player membership modal state
  const [playerModalOpen, setPlayerModalOpen] = useState(false);
  const [editingPlayer, setEditingPlayer] = useState<TeamMembership | null>(
    null,
  );
  const [removingPlayer, setRemovingPlayer] = useState<TeamMembership | null>(
    null,
  );
  const [removingPlayerLoading, setRemovingPlayerLoading] = useState(false);

  // Bulk deactivate state
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [bulkDeactivating, setBulkDeactivating] = useState(false);

  // League membership modal state
  const [leagueModalOpen, setLeagueModalOpen] = useState(false);
  const [editingLeague, setEditingLeague] = useState<LeagueMembership | null>(
    null,
  );
  const [removingLeague, setRemovingLeague] = useState<LeagueMembership | null>(
    null,
  );
  const [removingLeagueLoading, setRemovingLeagueLoading] = useState(false);

  useEffect(() => {
    if (team) {
      setForm({
        name: team.name ?? "",
        club: String(team.club ?? ""),
        is_active: team.is_active ?? true,
      });
    }
  }, [team]);

  // Clear selection when player memberships change
  useEffect(() => {
    setSelectedIds(new Set());
  }, [playerMemberships]);

  function handleChange(key: keyof FormState, value: string | boolean) {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (errors[key as keyof FormErrors])
      setErrors((prev) => ({ ...prev, [key]: undefined }));
    setSaveStatus("idle");
  }

  function validate(): FormErrors {
    const e: FormErrors = {};
    if (!form.name.trim()) e.name = "Name is required.";
    if (!form.club) e.club = "Club is required.";
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
      const payload: TeamPayload = {
        club: Number(form.club),
        name: form.name,
        is_active: form.is_active,
      };

      if (isNew) {
        await createTeam(payload);
      } else {
        await updateTeam(id, payload);
      }

      setSaveStatus("success");
      await queryClient.invalidateQueries({ queryKey: ["teams/"] });
      if (isNew) {
        setTimeout(() => router.push("/teams"), 1000);
      }
    } catch {
      setSaveStatus("error");
    } finally {
      setSaving(false);
    }
  }

  async function handleRemovePlayer() {
    if (!removingPlayer) return;
    setRemovingPlayerLoading(true);
    try {
      await deleteTeamMembership(removingPlayer.id);
      setRemovingPlayer(null);
      await queryClient.invalidateQueries({ queryKey: ["team-memberships/"] });
    } catch {
      // ignore
    } finally {
      setRemovingPlayerLoading(false);
    }
  }

  async function handleBulkDeactivate() {
    if (selectedIds.size === 0) return;
    setBulkDeactivating(true);
    try {
      await bulkUpdateTeamMemberships([...selectedIds], { is_active: false });
      setSelectedIds(new Set());
      await queryClient.invalidateQueries({ queryKey: ["team-memberships/"] });
    } catch {
      // ignore
    } finally {
      setBulkDeactivating(false);
    }
  }

  async function handleRemoveLeague() {
    if (!removingLeague) return;
    setRemovingLeagueLoading(true);
    try {
      await deleteLeagueMembership(removingLeague.id);
      setRemovingLeague(null);
      await queryClient.invalidateQueries({
        queryKey: ["league-memberships/"],
      });
    } catch {
      // ignore
    } finally {
      setRemovingLeagueLoading(false);
    }
  }

  function toggleSelect(id: number) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleSelectAll() {
    const all = playerMemberships?.results ?? [];
    if (selectedIds.size === all.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(all.map((m) => m.id)));
    }
  }

  // ── Loading / error ───────────────────────────────────────────────────────

  if (!isNew && isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-64 rounded bg-card-border animate-pulse" />
        <div className="h-4 w-full max-w-lg rounded bg-card-border animate-pulse" />
      </div>
    );
  }

  if (!isNew && (isError || !team)) {
    return <p className="text-red-500 text-sm">Failed to load team.</p>;
  }

  const title = isNew ? "Create team" : "Edit team";
  const subtitle = isNew ? "" : (team?.name ?? "");
  const players = playerMemberships?.results ?? [];
  const leagues = leagueMemberships?.results ?? [];
  const allSelected = players.length > 0 && selectedIds.size === players.length;

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="max-w-2xl space-y-6">
      <EditPageHeader
        title={title}
        subtitle={subtitle}
        breadcrumbs={[
          { label: "Teams", href: "/teams" },
          { label: isNew ? "Create new" : (team?.name ?? "") },
        ]}
      />

      {/* ── Team info ──────────────────────────────────────────────────────── */}
      <div className="bg-card-bg border border-card-border rounded-lg p-6 space-y-5">
        <Field label="Name" required error={errors.name}>
          <input
            type="text"
            value={form.name}
            onChange={(e) => handleChange("name", e.target.value)}
            className={inputCls(!!errors.name)}
          />
        </Field>

        <Field label="Club" required error={errors.club}>
          <select
            value={form.club}
            onChange={(e) => handleChange("club", e.target.value)}
            className={inputCls(!!errors.club)}
          >
            <option value="">Select club…</option>
            {clubsData?.results.map((c) => (
              <option key={c.id} value={String(c.id)}>
                {c.name}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Active">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={form.is_active}
              onChange={(e) => handleChange("is_active", e.target.checked)}
              className="w-4 h-4 accent-accent"
            />
            <span className="text-sm text-foreground">Team is active</span>
          </label>
        </Field>

        <div className="flex items-center gap-3 pt-2">
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Saving…" : "Save"}
          </Button>

          {saveStatus === "success" && (
            <span className="text-sm text-green-600">
              {isNew
                ? "Created successfully. Redirecting…"
                : "Saved successfully."}
            </span>
          )}
          {saveStatus === "error" && (
            <span className="text-sm text-red-500">
              Failed to save. Please try again.
            </span>
          )}
        </div>
      </div>

      {/* ── Players ───────────────────────────────────────────────────────── */}
      {!isNew && (
        <div className="bg-card-bg border border-card-border rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-card-border flex items-center justify-between gap-3">
            <h2 className="text-sm font-semibold text-foreground">
              Players ({players.length})
            </h2>
            <div className="flex items-center gap-2">
              {selectedIds.size > 0 && (
                <Button
                  size="xs"
                  variant="ghost"
                  onClick={handleBulkDeactivate}
                  disabled={bulkDeactivating}
                >
                  {bulkDeactivating
                    ? "Deactivating…"
                    : `Deactivate (${selectedIds.size})`}
                </Button>
              )}
              <Button
                size="xs"
                onClick={() => {
                  setEditingPlayer(null);
                  setPlayerModalOpen(true);
                }}
              >
                + Add Player
              </Button>
            </div>
          </div>
          {players.length === 0 ? (
            <p className="px-6 py-4 text-sm text-foreground/50">
              No players yet.
            </p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-card-border bg-background">
                  <th className="px-4 py-3 w-8">
                    <input
                      type="checkbox"
                      checked={allSelected}
                      onChange={toggleSelectAll}
                      className="w-4 h-4 accent-accent"
                    />
                  </th>
                  {["Name", "No.", "Active", "Loan", ""].map((h) => (
                    <th
                      key={h}
                      className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-foreground/50"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {players.map((m) => (
                  <tr
                    key={m.id}
                    className="border-b border-card-border last:border-0 hover:bg-black/3 transition-colors"
                  >
                    <td className="px-4 py-3 w-8">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(m.id)}
                        onChange={() => toggleSelect(m.id)}
                        className="w-4 h-4 accent-accent"
                      />
                    </td>
                    <td className="px-4 py-3 text-foreground font-medium">
                      {m.player_name}
                    </td>
                    <td className="px-4 py-3 text-foreground">
                      {m.number ?? "—"}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block px-1.5 py-0.5 rounded text-xs font-medium ${
                          m.is_active
                            ? "bg-green-500/15 text-green-600"
                            : "bg-foreground/10 text-foreground/50"
                        }`}
                      >
                        {m.is_active ? "Yes" : "No"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-foreground/60 text-xs">
                      {m.loan ? "Yes" : "No"}
                    </td>
                    <td className="px-4 py-2">
                      <div className="flex items-center gap-1 justify-end">
                        <Button
                          variant="raw"
                          size="icon"
                          className="text-foreground/50 hover:text-accent"
                          onClick={() => {
                            setEditingPlayer(m);
                            setPlayerModalOpen(true);
                          }}
                        >
                          <EditIcon className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="raw"
                          size="icon"
                          className="text-foreground/50 hover:text-red-500"
                          onClick={() => setRemovingPlayer(m)}
                        >
                          <DeleteIcon className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* ── Leagues ───────────────────────────────────────────────────────── */}
      {!isNew && (
        <div className="bg-card-bg border border-card-border rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-card-border flex items-center justify-between">
            <h2 className="text-sm font-semibold text-foreground">
              Leagues ({leagues.length})
            </h2>
            <Button
              size="xs"
              onClick={() => {
                setEditingLeague(null);
                setLeagueModalOpen(true);
              }}
            >
              + Add to League
            </Button>
          </div>
          {leagues.length === 0 ? (
            <p className="px-6 py-4 text-sm text-foreground/50">
              Not in any league yet.
            </p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-card-border bg-background">
                  {["League", "In Competition", "Withdrawn", ""].map((h) => (
                    <th
                      key={h}
                      className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-foreground/50"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {leagues.map((m) => (
                  <tr
                    key={m.id}
                    className="border-b border-card-border last:border-0 hover:bg-black/3 transition-colors"
                  >
                    <td className="px-4 py-3 text-foreground font-medium">
                      {m.team_name}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block px-1.5 py-0.5 rounded text-xs font-medium ${
                          m.in_competition
                            ? "bg-green-500/15 text-green-600"
                            : "bg-foreground/10 text-foreground/50"
                        }`}
                      >
                        {m.in_competition ? "Yes" : "No"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block px-1.5 py-0.5 rounded text-xs font-medium ${
                          m.is_withdrawn
                            ? "bg-red-500/10 text-red-500"
                            : "bg-foreground/10 text-foreground/50"
                        }`}
                      >
                        {m.is_withdrawn ? "Yes" : "No"}
                      </span>
                    </td>
                    <td className="px-4 py-2">
                      <div className="flex items-center gap-1 justify-end">
                        <Button
                          variant="raw"
                          size="icon"
                          className="text-foreground/50 hover:text-accent"
                          onClick={() => {
                            setEditingLeague(m);
                            setLeagueModalOpen(true);
                          }}
                        >
                          <EditIcon className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="raw"
                          size="icon"
                          className="text-foreground/50 hover:text-red-500"
                          onClick={() => setRemovingLeague(m)}
                        >
                          <DeleteIcon className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* ── Coaches (read-only) ───────────────────────────────────────────── */}
      {!isNew && team && team.coaches.length > 0 && (
        <div className="bg-card-bg border border-card-border rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-card-border">
            <h2 className="text-sm font-semibold text-foreground">
              Coaches ({team.coaches.length})
            </h2>
          </div>
          <ul className="divide-y divide-card-border">
            {team.coaches.map((c, i) => (
              <li key={i} className="px-4 py-3 text-sm text-foreground">
                {String(c)}
              </li>
            ))}
          </ul>
        </div>
      )}

      <MembershipModal
        open={playerModalOpen}
        kind="team-member"
        fixedTeam={isNew ? undefined : Number(id)}
        initialValues={editingPlayer ?? undefined}
        onSaved={() =>
          queryClient.invalidateQueries({ queryKey: ["team-memberships/"] })
        }
        onClose={() => {
          setPlayerModalOpen(false);
          setEditingPlayer(null);
        }}
      />

      <ConfirmDialog
        open={!!removingPlayer}
        title="Remove player from team"
        message={`Remove ${removingPlayer?.player_name ?? "this player"} from the team? This cannot be undone.`}
        confirmLabel="Remove"
        onConfirm={handleRemovePlayer}
        onCancel={() => setRemovingPlayer(null)}
        loading={removingPlayerLoading}
      />

      <MembershipModal
        open={leagueModalOpen}
        kind="league-member"
        fixedTeam={isNew ? undefined : Number(id)}
        initialValues={editingLeague ?? undefined}
        onSaved={() =>
          queryClient.invalidateQueries({ queryKey: ["league-memberships/"] })
        }
        onClose={() => {
          setLeagueModalOpen(false);
          setEditingLeague(null);
        }}
      />

      <ConfirmDialog
        open={!!removingLeague}
        title="Remove league membership"
        message={`Remove this team from league ${removingLeague?.league ?? ""}? This cannot be undone.`}
        confirmLabel="Remove"
        onConfirm={handleRemoveLeague}
        onCancel={() => setRemovingLeague(null)}
        loading={removingLeagueLoading}
      />
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
