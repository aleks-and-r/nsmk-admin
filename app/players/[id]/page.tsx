"use client";

import type { ReactNode } from "react";
import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { usePlayerById } from "@/hooks/queries/usePlayers";
import { createPlayer, updatePlayer } from "@/services/players.service";
import EditPageHeader from "@/components/admin/EditPageHeader";
import ImageUpload from "@/components/admin/ImageUpload";

const POSITION_OPTIONS = [
  "",
  "Point guard",
  "Shooting guard",
  "Small forward",
  "Power forward",
  "Center",
];
const VISIBILITY_OPTIONS = ["Default", "Visible", "Hidden"];

interface FormState {
  first_name: string;
  last_name: string;
  middle_name: string;
  position: string;
  birth_year: string;
  image_visibility: string;
}

const EMPTY_FORM: FormState = {
  first_name: "",
  last_name: "",
  middle_name: "",
  position: "",
  birth_year: "",
  image_visibility: "Default",
};

export default function PlayerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const isNew = id === "new";
  const router = useRouter();

  // Pass empty string when creating — disables the query (enabled: !!id)
  const { data: player, isLoading, isError } = usePlayerById(isNew ? "" : id);

  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "success" | "error">(
    "idle",
  );

  useEffect(() => {
    if (player) {
      setForm({
        first_name: player.first_name ?? "",
        last_name: player.last_name ?? "",
        middle_name: "",
        position: player.position ?? "",
        birth_year: String(player.birth_year ?? ""),
        image_visibility: "Default",
      });
    }
  }, [player]);

  function handleChange(key: keyof FormState, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setSaveStatus("idle");
  }

  async function handleSave() {
    setSaving(true);
    setSaveStatus("idle");
    try {
      const payload = {
        first_name: form.first_name,
        last_name: form.last_name,
        position: form.position,
        birth_year: form.birth_year ? Number(form.birth_year) : undefined,
      };

      if (imageFile) {
        const fd = new FormData();
        Object.entries(payload).forEach(
          ([k, v]) => v !== undefined && fd.append(k, String(v)),
        );
        fd.append("image", imageFile);
        if (isNew) {
          await createPlayer(fd);
        } else {
          await updatePlayer(id, fd);
        }
      } else {
        if (isNew) {
          await createPlayer(payload);
        } else {
          await updatePlayer(id, payload);
        }
      }

      setSaveStatus("success");
      if (isNew) {
        setTimeout(() => router.push("/players"), 1000);
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

  if (!isNew && (isError || !player)) {
    return <p className="text-red-500 text-sm">Failed to load player.</p>;
  }

  const title = isNew ? "Create player" : "Edit player";
  const subtitle = isNew ? "" : (player?.full_name ?? "");

  return (
    <div className="max-w-2xl">
      <EditPageHeader
        title={title}
        subtitle={subtitle}
        breadcrumbs={[
          { label: "Players", href: "/players" },
          { label: isNew ? "Create new" : (player?.full_name ?? "") },
        ]}
      />

      <ImageUpload onFileChange={setImageFile} />

      <div className="bg-card-bg border border-card-border rounded-lg p-6 space-y-5">
        <Field label="First name">
          <input
            type="text"
            value={form.first_name}
            onChange={(e) => handleChange("first_name", e.target.value)}
            className={inputCls}
          />
        </Field>

        <Field label="Last name">
          <input
            type="text"
            value={form.last_name}
            onChange={(e) => handleChange("last_name", e.target.value)}
            className={inputCls}
          />
        </Field>

        <Field label="Middle name">
          <input
            type="text"
            value={form.middle_name}
            onChange={(e) => handleChange("middle_name", e.target.value)}
            className={inputCls}
          />
        </Field>

        <Field label="Position">
          <select
            value={form.position}
            onChange={(e) => handleChange("position", e.target.value)}
            className={inputCls}
          >
            {POSITION_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>
                {opt || "Select option"}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Year of birth">
          <input
            type="number"
            value={form.birth_year}
            onChange={(e) => handleChange("birth_year", e.target.value)}
            className={inputCls}
            min={1950}
            max={2020}
          />
        </Field>

        <Field label="Visibility of player profile image on website">
          <select
            value={form.image_visibility}
            onChange={(e) => handleChange("image_visibility", e.target.value)}
            className={inputCls}
          >
            {VISIBILITY_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
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

const inputCls =
  "w-full px-3 py-2 bg-background border border-card-border rounded text-sm text-foreground focus:ring-2 focus:ring-accent focus:outline-none";

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-foreground mb-1">
        {label}
      </label>
      {children}
    </div>
  );
}
