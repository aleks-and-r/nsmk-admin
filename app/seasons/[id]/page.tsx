"use client";

import type { ReactNode } from "react";
import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { useSeason } from "@/hooks/queries/useSeasons";
import { createSeason, updateSeason } from "@/services/seasons.service";
import { applyServerErrors } from "@/lib/formErrors";
import EditPageHeader from "@/components/admin/EditPageHeader";

interface FormState {
  code: string;
  name: string;
  start_date: string;
  end_date: string;
  is_active: boolean;
}

const EMPTY: FormState = {
  code: "",
  name: "",
  start_date: "",
  end_date: "",
  is_active: true,
};

type FormErrors = Partial<Record<keyof FormState, string>>;

export default function SeasonPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const isNew = id === "new";
  const router = useRouter();

  const queryClient = useQueryClient();
  const { data: season, isLoading, isError } = useSeason(isNew ? "" : id);

  const [form, setForm] = useState<FormState>(EMPTY);
  const [errors, setErrors] = useState<FormErrors>({});
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "success" | "error">("idle");
  const [serverError, setServerError] = useState("");

  useEffect(() => {
    if (season) {
      setForm({
        code: season.code ?? "",
        name: season.name ?? "",
        start_date: season.start_date ?? "",
        end_date: season.end_date ?? "",
        is_active: season.is_active ?? true,
      });
    }
  }, [season]);

  function handleChange(key: keyof FormState, value: string | boolean) {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: undefined }));
    setSaveStatus("idle");
    setServerError("");
  }

  function validate(): FormErrors {
    const e: FormErrors = {};
    if (!form.code.trim()) e.code = "Code is required.";
    if (!form.name.trim()) e.name = "Name is required.";
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
    setServerError("");
    try {
      const payload = {
        code: form.code,
        name: form.name,
        start_date: form.start_date,
        end_date: form.end_date,
        is_active: form.is_active,
      };

      if (isNew) {
        await createSeason(payload);
      } else {
        await updateSeason(id, payload);
      }

      setSaveStatus("success");
      await queryClient.invalidateQueries({ queryKey: ["seasons"] });
      if (isNew) {
        setTimeout(() => router.push("/seasons"), 1000);
      }
    } catch (err: unknown) {
      applyServerErrors(err, setErrors, setServerError);
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

  if (!isNew && (isError || !season)) {
    return <p className="text-red-500 text-sm">Failed to load season.</p>;
  }

  const title = isNew ? "Create season" : "Edit season";
  const subtitle = isNew ? "" : (season?.name ?? "");

  return (
    <div className="max-w-2xl">
      <EditPageHeader
        title={title}
        subtitle={subtitle}
        breadcrumbs={[
          { label: "Seasons", href: "/seasons" },
          { label: isNew ? "Create new" : (season?.name ?? "") },
        ]}
      />

      <div className="bg-card-bg border border-card-border rounded-lg p-6 space-y-5">
        <Field label="Code" required error={errors.code}>
          <input
            type="text"
            value={form.code}
            onChange={(e) => handleChange("code", e.target.value)}
            className={inputCls(!!errors.code)}
            placeholder="e.g. Seed 2024-25"
          />
        </Field>

        <Field label="Name" required error={errors.name}>
          <input
            type="text"
            value={form.name}
            onChange={(e) => handleChange("name", e.target.value)}
            className={inputCls(!!errors.name)}
          />
        </Field>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Start Date" error={errors.start_date}>
            <input
              type="date"
              value={form.start_date}
              onChange={(e) => handleChange("start_date", e.target.value)}
              className={inputCls(!!errors.start_date)}
            />
          </Field>

          <Field label="End Date" error={errors.end_date}>
            <input
              type="date"
              value={form.end_date}
              onChange={(e) => handleChange("end_date", e.target.value)}
              className={inputCls(!!errors.end_date)}
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
            <span className="text-sm text-foreground">Season is active</span>
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

          {serverError && (
            <span className="text-sm text-red-500">{serverError}</span>
          )}
          {saveStatus === "success" && (
            <span className="text-sm text-green-600">
              {isNew ? "Created successfully. Redirecting…" : "Saved successfully."}
            </span>
          )}
        </div>
      </div>

      {/* Leagues section (read-only) */}
      {!isNew && season && season.leagues.length > 0 && (
        <div className="mt-6 bg-card-bg border border-card-border rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-card-border">
            <h2 className="text-sm font-semibold text-foreground">
              Leagues ({season.leagues.length})
            </h2>
          </div>
          <table className="w-full">
            <thead>
              <tr className="border-b border-card-border">
                {["ID", "Name"].map((h) => (
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
              {season.leagues.map((league) => (
                <tr
                  key={league.id}
                  className="border-b border-card-border last:border-0 hover:bg-black/3 transition-colors"
                >
                  <td className="px-4 py-3 text-sm text-foreground/50">{league.id}</td>
                  <td className="px-4 py-3 text-sm text-foreground font-medium">{league.name}</td>
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
