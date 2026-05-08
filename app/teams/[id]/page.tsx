"use client";

import type { ReactNode } from "react";
import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { useTeam } from "@/hooks/queries/useTeams";
import { useClubs } from "@/hooks/queries/useClubs";
import {
  createTeam,
  updateTeam,
  type TeamPayload,
} from "@/services/teams.service";
import EditPageHeader from "@/components/admin/EditPageHeader";
import Button from "@/components/admin/Button";

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

  const { data: team, isLoading, isError } = useTeam(isNew ? "" : id);
  const { data: clubsData } = useClubs();

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
        club: String(team.club ?? ""),
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
