"use client";

import type { ReactNode } from "react";
import { useEffect, useState, use, useRef } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { useTeam } from "@/hooks/queries/useTeams";
import { useSeasons } from "@/hooks/queries/useSeasons";
import {
  createTeam,
  updateTeam,
  type TeamPayload,
} from "@/services/teams.service";
import EditPageHeader from "@/components/admin/EditPageHeader";

// ── Form state ────────────────────────────────────────────────────────────────

interface FormState {
  name: string;
  age_group_label: string;
  season: string;
  is_active: boolean;
}

const EMPTY: FormState = {
  name: "",
  age_group_label: "",
  season: "",
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

  const { data: team, isLoading, isError } = useTeam(isNew ? "" : id);
  const { data: seasonsData } = useSeasons();

  const seasonOptions =
    seasonsData?.results.map((s) => ({
      value: String(s.id),
      label: s.name,
    })) ?? [];

  const [form, setForm] = useState<FormState>(EMPTY);
  const [errors, setErrors] = useState<FormErrors>({});
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "success" | "error">(
    "idle",
  );

  useEffect(() => {
    if (team) {
      setForm({
        name: team.name ?? "",
        age_group_label: team.age_group_label ?? "",
        season: String(team.season ?? ""),
        is_active: team.is_active ?? true,
      });
    }
  }, [team]);

  function handleChange(key: keyof FormState, value: string | boolean) {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (errors[key as keyof FormErrors])
      setErrors((prev) => ({ ...prev, [key]: undefined }));
    setSaveStatus("idle");
  }

  function validate(): FormErrors {
    const e: FormErrors = {};
    if (!form.name.trim()) e.name = "Name is required.";
    if (!form.season) e.season = "Season is required.";
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
        club: team?.club ?? 0,
        name: form.name,
        age_group_label: form.age_group_label,
        season: Number(form.season),
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

        <Field label="Age Group Label">
          <input
            type="text"
            value={form.age_group_label}
            onChange={(e) => handleChange("age_group_label", e.target.value)}
            className={inputCls()}
          />
        </Field>

        <Field label="Season" required error={errors.season}>
          <SearchableSelect
            options={seasonOptions}
            value={form.season}
            onChange={(v) => handleChange("season", v)}
            placeholder="Select season…"
            hasError={!!errors.season}
          />
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

      {/* ── Players (read-only) ───────────────────────────────────────────── */}
      {!isNew && team && team.players.length > 0 && (
        <div className="bg-card-bg border border-card-border rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-card-border">
            <h2 className="text-sm font-semibold text-foreground">
              Players ({team.players.length})
            </h2>
          </div>
          <table className="w-full">
            <thead>
              <tr className="border-b border-card-border">
                {["#", "Name"].map((h) => (
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
              {team.players.map((p, i) => (
                <tr
                  key={p.id}
                  className="border-b border-card-border last:border-0 hover:bg-black/3 transition-colors"
                >
                  <td className="px-4 py-3 text-sm text-foreground/50 w-12">
                    {i + 1}
                  </td>
                  <td className="px-4 py-3 text-sm text-foreground font-medium">
                    {p.name}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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
              <li
                key={i}
                className="px-4 py-3 text-sm text-foreground"
              >
                {String(c)}
              </li>
            ))}
          </ul>
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
        onClick={() => setOpen((prev) => !prev)}
        className={`w-full px-3 py-2 bg-background border rounded text-sm text-left flex items-center justify-between cursor-pointer focus:outline-none focus:ring-2 ${borderCls}`}
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
