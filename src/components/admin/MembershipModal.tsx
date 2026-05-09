"use client";

import { useEffect, useRef, useState } from "react";
import { usePaginatedData } from "@/hooks/queries/usePaginatedData";
import { useTeams } from "@/hooks/queries/useTeams";
import type { TeamMembership, TeamMembershipPayload } from "@/services/team-memberships.service";
import {
  createTeamMembership,
  updateTeamMembership,
} from "@/services/team-memberships.service";
import type { LeagueMembership, LeagueMembershipPayload } from "@/services/league-memberships.service";
import {
  createLeagueMembership,
  updateLeagueMembership,
} from "@/services/league-memberships.service";
import type { PlayerDetail } from "@/services/players.service";
import Button from "./Button";

export type MembershipKind = "team-member" | "league-member";

export interface MembershipModalProps {
  open: boolean;
  kind: MembershipKind;
  fixedTeam?: number;
  fixedPlayer?: number;
  fixedLeague?: number;
  initialValues?: TeamMembership | LeagueMembership;
  onSaved: () => void;
  onClose: () => void;
}

// ── Team-member form ──────────────────────────────────────────────────────────

interface TeamMemberForm {
  player: string;
  team: string;
  number: string;
  loan: boolean;
  is_active: boolean;
  joined_at: string;
  left_at: string;
}

const EMPTY_TM: TeamMemberForm = {
  player: "",
  team: "",
  number: "",
  loan: false,
  is_active: true,
  joined_at: "",
  left_at: "",
};

type TeamMemberErrors = Partial<Record<keyof TeamMemberForm, string>>;

// ── League-member form ────────────────────────────────────────────────────────

interface LeagueMemberForm {
  team: string;
  league: string;
  in_competition: boolean;
  is_withdrawn: boolean;
}

const EMPTY_LM: LeagueMemberForm = {
  team: "",
  league: "",
  in_competition: true,
  is_withdrawn: false,
};

type LeagueMemberErrors = Partial<Record<keyof LeagueMemberForm, string>>;

// ── Modal ─────────────────────────────────────────────────────────────────────

export default function MembershipModal({
  open,
  kind,
  fixedTeam,
  fixedPlayer,
  fixedLeague,
  initialValues,
  onSaved,
  onClose,
}: MembershipModalProps) {
  const isEdit = !!initialValues;

  const [tmForm, setTmForm] = useState<TeamMemberForm>(EMPTY_TM);
  const [tmErrors, setTmErrors] = useState<TeamMemberErrors>({});
  const [lmForm, setLmForm] = useState<LeagueMemberForm>(EMPTY_LM);
  const [lmErrors, setLmErrors] = useState<LeagueMemberErrors>({});
  const [saving, setSaving] = useState(false);
  const [serverError, setServerError] = useState("");

  const { data: teamsData } = useTeams();
  const teamOptions = teamsData?.results ?? [];

  // Populate form from initialValues on open
  useEffect(() => {
    if (!open) return;
    setServerError("");
    if (kind === "team-member") {
      if (initialValues) {
        const v = initialValues as TeamMembership;
        setTmForm({
          player: String(v.player),
          team: String(v.team),
          number: v.number != null ? String(v.number) : "",
          loan: v.loan,
          is_active: v.is_active,
          joined_at: v.joined_at ?? "",
          left_at: v.left_at ?? "",
        });
      } else {
        setTmForm({
          ...EMPTY_TM,
          player: fixedPlayer != null ? String(fixedPlayer) : "",
          team: fixedTeam != null ? String(fixedTeam) : "",
        });
      }
      setTmErrors({});
    } else {
      if (initialValues) {
        const v = initialValues as LeagueMembership;
        setLmForm({
          team: String(v.team),
          league: String(v.league),
          in_competition: v.in_competition,
          is_withdrawn: v.is_withdrawn,
        });
      } else {
        setLmForm({
          ...EMPTY_LM,
          team: fixedTeam != null ? String(fixedTeam) : "",
          league: fixedLeague != null ? String(fixedLeague) : "",
        });
      }
      setLmErrors({});
    }
  }, [open, kind, initialValues, fixedTeam, fixedPlayer, fixedLeague]);

  if (!open) return null;

  // ── Submit ──────────────────────────────────────────────────────────────────

  async function handleSubmit() {
    setServerError("");
    setSaving(true);
    try {
      if (kind === "team-member") {
        const errs: TeamMemberErrors = {};
        if (!tmForm.player) errs.player = "Player is required.";
        if (!tmForm.team) errs.team = "Team is required.";
        if (Object.keys(errs).length) { setTmErrors(errs); setSaving(false); return; }

        const payload: TeamMembershipPayload = {
          player: Number(tmForm.player),
          team: Number(tmForm.team),
          ...(tmForm.number !== "" && { number: Number(tmForm.number) }),
          loan: tmForm.loan,
          is_active: tmForm.is_active,
          ...(tmForm.joined_at && { joined_at: tmForm.joined_at }),
          ...(tmForm.left_at && { left_at: tmForm.left_at }),
        };
        if (isEdit) {
          await updateTeamMembership((initialValues as TeamMembership).id, payload);
        } else {
          await createTeamMembership(payload);
        }
      } else {
        const errs: LeagueMemberErrors = {};
        if (!lmForm.team) errs.team = "Team is required.";
        if (!lmForm.league) errs.league = "League is required.";
        if (Object.keys(errs).length) { setLmErrors(errs); setSaving(false); return; }

        const payload: LeagueMembershipPayload = {
          league: Number(lmForm.league),
          team: Number(lmForm.team),
          in_competition: lmForm.in_competition,
          is_withdrawn: lmForm.is_withdrawn,
        };
        if (isEdit) {
          await updateLeagueMembership((initialValues as LeagueMembership).id, payload);
        } else {
          await createLeagueMembership(payload);
        }
      }
      onSaved();
      onClose();
    } catch (err: unknown) {
      const data = (err as { response?: { data?: Record<string, unknown> } })?.response?.data;
      if (data && typeof data === "object") {
        const msgs: string[] = [];
        Object.entries(data).forEach(([key, val]) => {
          const m = Array.isArray(val) ? val.map(String) : [String(val)];
          if (kind === "team-member" && key in EMPTY_TM) {
            setTmErrors((prev) => ({ ...prev, [key]: m[0] }));
          } else if (kind === "league-member" && key in EMPTY_LM) {
            setLmErrors((prev) => ({ ...prev, [key]: m[0] }));
          } else {
            msgs.push(...m);
          }
        });
        if (msgs.length) setServerError(msgs.join(" "));
        else if (!Object.keys(data).length) setServerError("Failed to save. Please try again.");
      } else {
        setServerError("Failed to save. Please try again.");
      }
    } finally {
      setSaving(false);
    }
  }

  const title = kind === "team-member"
    ? (isEdit ? "Edit Player Membership" : "Add Player to Team")
    : (isEdit ? "Edit League Membership" : "Add Team to League");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-card-bg border border-card-border rounded-lg w-full max-w-lg shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-card-border">
          <h2 className="text-base font-semibold text-foreground">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded hover:bg-foreground/10 text-foreground/50 transition-colors"
            aria-label="Close"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4">
          {kind === "team-member" ? (
            <>
              {fixedPlayer == null && (
                <Field label="Player" required error={tmErrors.player}>
                  <PlayerCombobox
                    value={tmForm.player}
                    onChange={(id) => {
                      setTmForm((f) => ({ ...f, player: id }));
                      setTmErrors((e) => ({ ...e, player: undefined }));
                    }}
                  />
                </Field>
              )}
              {fixedTeam == null && (
                <Field label="Team" required error={tmErrors.team}>
                  <SearchableSelect
                    options={teamOptions.map((t) => ({ value: String(t.id), label: t.name }))}
                    value={tmForm.team}
                    onChange={(v) => {
                      setTmForm((f) => ({ ...f, team: v }));
                      setTmErrors((e) => ({ ...e, team: undefined }));
                    }}
                    placeholder="Select team…"
                    hasError={!!tmErrors.team}
                  />
                </Field>
              )}
              <div className="grid grid-cols-2 gap-4">
                <Field label="Jersey Number" error={tmErrors.number}>
                  <input
                    type="number"
                    value={tmForm.number}
                    onChange={(e) => setTmForm((f) => ({ ...f, number: e.target.value }))}
                    className={inputCls()}
                    min={0}
                    max={99}
                  />
                </Field>
                <div className="flex flex-col gap-3 pt-6">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={tmForm.is_active}
                      onChange={(e) => setTmForm((f) => ({ ...f, is_active: e.target.checked }))}
                      className="w-4 h-4 accent-accent"
                    />
                    <span className="text-sm text-foreground">Active</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={tmForm.loan}
                      onChange={(e) => setTmForm((f) => ({ ...f, loan: e.target.checked }))}
                      className="w-4 h-4 accent-accent"
                    />
                    <span className="text-sm text-foreground">On Loan</span>
                  </label>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Joined At">
                  <input
                    type="date"
                    value={tmForm.joined_at}
                    onChange={(e) => setTmForm((f) => ({ ...f, joined_at: e.target.value }))}
                    className={inputCls()}
                  />
                </Field>
                <Field label="Left At">
                  <input
                    type="date"
                    value={tmForm.left_at}
                    onChange={(e) => setTmForm((f) => ({ ...f, left_at: e.target.value }))}
                    className={inputCls()}
                  />
                </Field>
              </div>
            </>
          ) : (
            <>
              {fixedTeam == null && (
                <Field label="Team" required error={lmErrors.team}>
                  <SearchableSelect
                    options={teamOptions.map((t) => ({ value: String(t.id), label: t.name }))}
                    value={lmForm.team}
                    onChange={(v) => {
                      setLmForm((f) => ({ ...f, team: v }));
                      setLmErrors((e) => ({ ...e, team: undefined }));
                    }}
                    placeholder="Select team…"
                    hasError={!!lmErrors.team}
                  />
                </Field>
              )}
              <div className="flex gap-6 pt-1">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={lmForm.in_competition}
                    onChange={(e) => setLmForm((f) => ({ ...f, in_competition: e.target.checked }))}
                    className="w-4 h-4 accent-accent"
                  />
                  <span className="text-sm text-foreground">In Competition</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={lmForm.is_withdrawn}
                    onChange={(e) => setLmForm((f) => ({ ...f, is_withdrawn: e.target.checked }))}
                    className="w-4 h-4 accent-accent"
                  />
                  <span className="text-sm text-foreground">Withdrawn</span>
                </label>
              </div>
            </>
          )}

          {serverError && (
            <p className="text-sm text-red-500">{serverError}</p>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-card-border">
          <Button variant="ghost" size="sm" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button size="sm" onClick={handleSubmit} disabled={saving}>
            {saving ? "Saving…" : isEdit ? "Update" : "Add"}
          </Button>
        </div>
      </div>
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
  children: React.ReactNode;
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

// ── PlayerCombobox ────────────────────────────────────────────────────────────

function PlayerCombobox({
  value,
  onChange,
}: {
  value: string;
  onChange: (id: string) => void;
}) {
  const [inputText, setInputText] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(inputText), 300);
    return () => clearTimeout(t);
  }, [inputText]);

  const { data } = usePaginatedData<PlayerDetail>("players/", 1, debouncedSearch);
  const options = data?.results ?? [];

  useEffect(() => {
    function onOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", onOutside);
    return () => document.removeEventListener("mousedown", onOutside);
  }, [open]);

  return (
    <div ref={containerRef} className="relative">
      <input
        type="text"
        value={inputText}
        onChange={(e) => { setInputText(e.target.value); onChange(""); setOpen(true); }}
        onFocus={() => setOpen(true)}
        placeholder="Search by name…"
        className={inputCls()}
      />
      {open && options.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-card-bg border border-card-border rounded shadow-lg max-h-48 overflow-y-auto">
          {options.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => { onChange(String(p.id)); setInputText(p.full_name); setOpen(false); }}
              className={`w-full text-left px-3 py-2 text-sm transition-colors hover:bg-accent/10 ${
                String(p.id) === value ? "text-accent font-medium bg-accent/5" : "text-foreground"
              }`}
            >
              {p.full_name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── SearchableSelect ──────────────────────────────────────────────────────────

interface SelectOption { value: string; label: string; }

function SearchableSelect({
  options,
  value,
  onChange,
  placeholder = "Select…",
  hasError = false,
}: {
  options: SelectOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
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
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
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
        onClick={() => setOpen((p) => !p)}
        className={`w-full px-3 py-2 bg-background border rounded text-sm text-left flex items-center justify-between cursor-pointer focus:outline-none focus:ring-2 ${borderCls}`}
      >
        <span className={selected ? "text-foreground" : "text-foreground/40"}>
          {selected ? selected.label : placeholder}
        </span>
        <svg className={`w-4 h-4 text-foreground/40 shrink-0 transition-transform ${open ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
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
              <p className="px-3 py-2 text-sm text-foreground/50">No results.</p>
            ) : (
              filtered.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => { onChange(opt.value); setOpen(false); setSearch(""); }}
                  className={`w-full text-left px-3 py-2 text-sm transition-colors hover:bg-accent/10 ${
                    opt.value === value ? "text-accent font-medium bg-accent/5" : "text-foreground"
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
