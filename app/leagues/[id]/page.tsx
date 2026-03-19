"use client";

import type { ReactNode } from "react";
import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { useLeague } from "@/hooks/queries/useLeagues";
import { createLeague, updateLeague, type LeaguePayload } from "@/services/leagues.service";
import EditPageHeader from "@/components/admin/EditPageHeader";

const AGE_GROUP_OPTIONS = ["U8", "U10", "U12", "U14", "U16", "U18", "Senior"];

interface FormState {
  name: string;
  age_group: string;
  season: string;
  reference_birth_year: string;
  points_for_win: string;
  points_for_loss: string;
  points_for_forfeit: string;
  is_active: boolean;
}

const EMPTY: FormState = {
  name: "",
  age_group: "U14",
  season: "",
  reference_birth_year: "",
  points_for_win: "2",
  points_for_loss: "1",
  points_for_forfeit: "0",
  is_active: true,
};

type FormErrors = Partial<Record<keyof FormState, string>>;

export default function LeaguePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const isNew = id === "new";
  const router = useRouter();

  const queryClient = useQueryClient();
  const { data: league, isLoading, isError } = useLeague(isNew ? "" : id);

  const [form, setForm] = useState<FormState>(EMPTY);
  const [errors, setErrors] = useState<FormErrors>({});
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "success" | "error">("idle");

  useEffect(() => {
    if (league) {
      setForm({
        name: league.name ?? "",
        age_group: league.age_group ?? "U14",
        season: String(league.season ?? ""),
        reference_birth_year: String(league.reference_birth_year ?? ""),
        points_for_win: String(league.points_for_win ?? 2),
        points_for_loss: String(league.points_for_loss ?? 1),
        points_for_forfeit: String(league.points_for_forfeit ?? 0),
        is_active: league.is_active ?? true,
      });
    }
  }, [league]);

  function handleChange(key: keyof FormState, value: string | boolean) {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: undefined }));
    setSaveStatus("idle");
  }

  function validate(): FormErrors {
    const e: FormErrors = {};
    if (!form.name.trim()) e.name = "Name is required.";
    if (!form.season.trim()) e.season = "Season is required.";
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
      const payload = {
        name: form.name,
        age_group: form.age_group,
        season: Number(form.season),
        reference_birth_year: form.reference_birth_year ? Number(form.reference_birth_year) : undefined,
        points_for_win: Number(form.points_for_win),
        points_for_loss: Number(form.points_for_loss),
        points_for_forfeit: Number(form.points_for_forfeit),
        is_active: form.is_active,
      };

      if (isNew) {
        await createLeague(payload);
      } else {
        await updateLeague(id, payload);
      }

      setSaveStatus("success");
      await queryClient.invalidateQueries({ queryKey: ["leagues"] });
      if (isNew) {
        setTimeout(() => router.push("/leagues"), 1000);
      }
    } catch {
      setSaveStatus("error");
    } finally {
      setSaving(false);
    }
  }

  if (!isNew && isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-64 rounded bg-card-border animate-pulse" />
        <div className="h-4 w-full max-w-lg rounded bg-card-border animate-pulse" />
      </div>
    );
  }

  if (!isNew && (isError || !league)) {
    return <p className="text-red-500 text-sm">Failed to load league.</p>;
  }

  const title = isNew ? "Create league" : "Edit league";
  const subtitle = isNew ? "" : `${league?.name ?? ""} — ${league?.season_name ?? ""}`;

  return (
    <div className="max-w-2xl">
      <EditPageHeader
        title={title}
        subtitle={subtitle}
        breadcrumbs={[
          { label: "Leagues", href: "/leagues" },
          { label: isNew ? "Create new" : (league?.name ?? "") },
        ]}
      />

      <div className="bg-card-bg border border-card-border rounded-lg p-6 space-y-5">
        <Field label="Name" required error={errors.name}>
          <input
            type="text"
            value={form.name}
            onChange={(e) => handleChange("name", e.target.value)}
            className={inputCls(!!errors.name)}
          />
        </Field>

        <Field label="Season ID" required error={errors.season}>
          <input
            type="number"
            value={form.season}
            onChange={(e) => handleChange("season", e.target.value)}
            className={inputCls(!!errors.season)}
          />
        </Field>

        <Field label="Age Group">
          <select
            value={form.age_group}
            onChange={(e) => handleChange("age_group", e.target.value)}
            className={inputCls()}
          >
            {AGE_GROUP_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Reference Birth Year">
          <input
            type="number"
            value={form.reference_birth_year}
            onChange={(e) => handleChange("reference_birth_year", e.target.value)}
            className={inputCls()}
            min={1990}
            max={2030}
          />
        </Field>

        <div className="grid grid-cols-3 gap-4">
          <Field label="Points for Win">
            <input
              type="number"
              value={form.points_for_win}
              onChange={(e) => handleChange("points_for_win", e.target.value)}
              className={inputCls()}
              min={0}
            />
          </Field>
          <Field label="Points for Loss">
            <input
              type="number"
              value={form.points_for_loss}
              onChange={(e) => handleChange("points_for_loss", e.target.value)}
              className={inputCls()}
              min={0}
            />
          </Field>
          <Field label="Points for Forfeit">
            <input
              type="number"
              value={form.points_for_forfeit}
              onChange={(e) => handleChange("points_for_forfeit", e.target.value)}
              className={inputCls()}
              min={0}
            />
          </Field>
        </div>

        <Field label="Active">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={form.is_active}
              onChange={(e) => handleChange("is_active", e.target.checked)}
              className="w-4 h-4 accent-accent"
            />
            <span className="text-sm text-foreground">League is active</span>
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
            <span className="text-sm text-red-500">Failed to save. Please try again.</span>
          )}
        </div>
      </div>

      {/* Teams section (read-only) */}
      {!isNew && league && league.teams.length > 0 && (
        <div className="mt-6 bg-card-bg border border-card-border rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-card-border">
            <h2 className="text-sm font-semibold text-foreground">
              Teams ({league.teams.length})
            </h2>
          </div>
          <table className="w-full">
            <thead>
              <tr className="border-b border-card-border">
                {["Name", "Club", "Active"].map((h) => (
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
              {league.teams.map((team) => (
                <tr
                  key={team.id}
                  className="border-b border-card-border last:border-0 hover:bg-black/3 transition-colors"
                >
                  <td className="px-4 py-3 text-sm text-foreground font-medium">{team.name}</td>
                  <td className="px-4 py-3 text-sm text-foreground">{team.club_name}</td>
                  <td className="px-4 py-3 text-sm">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                        team.is_active
                          ? "bg-green-500/10 text-green-600"
                          : "bg-foreground/10 text-foreground/50"
                      }`}
                    >
                      {team.is_active ? "Active" : "Inactive"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

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
