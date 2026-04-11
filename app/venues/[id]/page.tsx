"use client";

import type { ReactNode } from "react";
import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { useVenue } from "@/hooks/queries/useVenues";
import { createVenue, updateVenue } from "@/services/venues.service";
import EditPageHeader from "@/components/admin/EditPageHeader";

// ── Form ──────────────────────────────────────────────────────────────────────

interface FormState {
  name: string;
  address: string;
  city: string;
  court_count: string;
  is_active: boolean;
}

const EMPTY: FormState = {
  name: "",
  address: "",
  city: "",
  court_count: "",
  is_active: true,
};

type FormErrors = Partial<Record<keyof FormState, string>>;

// ── Page ──────────────────────────────────────────────────────────────────────

export default function VenuePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const isNew = id === "new";
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data: venue, isLoading, isError } = useVenue(isNew ? "" : id);

  const [form, setForm] = useState<FormState>(EMPTY);
  const [errors, setErrors] = useState<FormErrors>({});
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "success" | "error">(
    "idle",
  );

  useEffect(() => {
    if (venue) {
      setForm({
        name: venue.name ?? "",
        address: venue.address ?? "",
        city: venue.city ?? "",
        court_count: venue.court_count != null ? String(venue.court_count) : "",
        is_active: venue.is_active ?? true,
      });
    }
  }, [venue]);

  function handleChange(key: keyof FormState, value: string | boolean) {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: undefined }));
    setSaveStatus("idle");
  }

  function validate(): FormErrors {
    const e: FormErrors = {};
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
    try {
      const payload = {
        name: form.name,
        address: form.address,
        city: form.city,
        ...(form.court_count !== "" && {
          court_count: Number(form.court_count),
        }),
        is_active: form.is_active,
      };

      if (isNew) {
        await createVenue(payload);
      } else {
        await updateVenue(id, payload);
      }

      setSaveStatus("success");
      await queryClient.invalidateQueries({ queryKey: ["venues/"] });
      if (isNew) {
        setTimeout(() => router.push("/venues"), 1000);
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

  if (!isNew && (isError || !venue)) {
    return <p className="text-red-500 text-sm">Failed to load venue.</p>;
  }

  const title = isNew ? "Create venue" : "Edit venue";
  const subtitle = isNew ? "" : (venue?.name ?? "");

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="max-w-2xl space-y-6">
      <EditPageHeader
        title={title}
        subtitle={subtitle}
        breadcrumbs={[
          { label: "Venues", href: "/venues" },
          { label: isNew ? "Create new" : (venue?.name ?? "") },
        ]}
      />

      <div className="bg-card-bg border border-card-border rounded-lg p-6 space-y-5">
        <Field label="Name" required error={errors.name}>
          <input
            type="text"
            value={form.name}
            onChange={(e) => handleChange("name", e.target.value)}
            className={inputCls(!!errors.name)}
            placeholder="e.g. Spens"
          />
        </Field>

        <div className="grid grid-cols-2 gap-4">
          <Field label="City">
            <input
              type="text"
              value={form.city}
              onChange={(e) => handleChange("city", e.target.value)}
              className={inputCls()}
              placeholder="e.g. Novi Sad"
            />
          </Field>

          <Field label="Number of Courts">
            <input
              type="number"
              value={form.court_count}
              onChange={(e) => handleChange("court_count", e.target.value)}
              className={inputCls()}
              min={0}
              placeholder="e.g. 2"
            />
          </Field>
        </div>

        <Field label="Address">
          <input
            type="text"
            value={form.address}
            onChange={(e) => handleChange("address", e.target.value)}
            className={inputCls()}
            placeholder="e.g. Sutjeska 2, 21000 Novi Sad"
          />
        </Field>

        <Field label="Status">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={form.is_active}
              onChange={(e) => handleChange("is_active", e.target.checked)}
              className="w-4 h-4 accent-accent"
            />
            <span className="text-sm text-foreground">Active</span>
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
