"use client";

import type { ReactNode } from "react";
import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { usePlayerById } from "@/hooks/queries/usePlayers";
import { usePlayerTeamMemberships } from "@/hooks/queries/useTeams";
import { createPlayer, updatePlayer } from "@/services/players.service";
import {
  deleteTeamMembership,
  type TeamMembership,
} from "@/services/team-memberships.service";
import EditPageHeader from "@/components/admin/EditPageHeader";
import ImageUpload from "@/components/admin/ImageUpload";
import Button from "@/components/admin/Button";
import MembershipModal from "@/components/admin/MembershipModal";
import ConfirmDialog from "@/components/admin/ConfirmDialog";
import EditIcon from "@/components/icons/EditIcon";
import DeleteIcon from "@/components/icons/DeleteIcon";

const POSITION_OPTIONS = ["", "PG", "SG", "SF", "PF", "C"];
const VISIBILITY_OPTIONS = ["Default", "Visible", "Hidden"];

// ── Player form ───────────────────────────────────────────────────────────────

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

type FormErrors = Partial<Record<keyof FormState, string>>;

// ── Page ──────────────────────────────────────────────────────────────────────

export default function PlayerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const isNew = id === "new";
  const router = useRouter();

  const { data: player, isLoading, isError } = usePlayerById(isNew ? "" : id);
  const { data: memberships } = usePlayerTeamMemberships(
    isNew ? undefined : Number(id),
  );
  const queryClient = useQueryClient();

  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [errors, setErrors] = useState<FormErrors>({});
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "success" | "error">(
    "idle",
  );

  const [membershipModalOpen, setMembershipModalOpen] = useState(false);
  const [editingMembership, setEditingMembership] =
    useState<TeamMembership | null>(null);
  const [removingMembership, setRemovingMembership] =
    useState<TeamMembership | null>(null);
  const [removing, setRemoving] = useState(false);

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
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: undefined }));
    setSaveStatus("idle");
  }

  function validate(): FormErrors {
    if (!isNew) return {};
    const e: FormErrors = {};
    if (!form.first_name.trim()) e.first_name = "First name is required.";
    if (!form.last_name.trim()) e.last_name = "Last name is required.";
    if (!form.birth_year.trim()) e.birth_year = "Year of birth is required.";
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
      await queryClient.invalidateQueries({ queryKey: ["players/"] });
      if (isNew) {
        setTimeout(() => router.push("/players"), 1000);
      }
    } catch {
      setSaveStatus("error");
    } finally {
      setSaving(false);
    }
  }

  async function handleRemoveMembership() {
    if (!removingMembership) return;
    setRemoving(true);
    try {
      await deleteTeamMembership(removingMembership.id);
      setRemovingMembership(null);
      await queryClient.invalidateQueries({ queryKey: ["team-memberships/"] });
    } catch {
      // ignore
    } finally {
      setRemoving(false);
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

  if (!isNew && (isError || !player)) {
    return <p className="text-red-500 text-sm">Failed to load player.</p>;
  }

  const title = isNew ? "Create player" : "Edit player";
  const subtitle = isNew ? "" : (player?.full_name ?? "");

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="max-w-2xl space-y-6">
      <EditPageHeader
        title={title}
        subtitle={subtitle}
        breadcrumbs={[
          { label: "Players", href: "/players" },
          { label: isNew ? "Create new" : (player?.full_name ?? "") },
        ]}
      />

      <ImageUpload onFileChange={setImageFile} />

      {/* ── Player info ──────────────────────────────────────────────────── */}
      <div className="bg-card-bg border border-card-border rounded-lg p-6 space-y-5">
        <Field label="First name" required={isNew} error={errors.first_name}>
          <input
            type="text"
            value={form.first_name}
            onChange={(e) => handleChange("first_name", e.target.value)}
            className={inputCls(!!errors.first_name)}
          />
        </Field>

        <Field label="Last name" required={isNew} error={errors.last_name}>
          <input
            type="text"
            value={form.last_name}
            onChange={(e) => handleChange("last_name", e.target.value)}
            className={inputCls(!!errors.last_name)}
          />
        </Field>

        <Field label="Middle name">
          <input
            type="text"
            value={form.middle_name}
            onChange={(e) => handleChange("middle_name", e.target.value)}
            className={inputCls()}
          />
        </Field>

        <Field label="Position">
          <select
            value={form.position}
            onChange={(e) => handleChange("position", e.target.value)}
            className={inputCls()}
          >
            {POSITION_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>
                {opt || "Select option"}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Year of birth" required={isNew} error={errors.birth_year}>
          <input
            type="number"
            value={form.birth_year}
            onChange={(e) => handleChange("birth_year", e.target.value)}
            className={inputCls(!!errors.birth_year)}
            min={1950}
            max={2020}
          />
        </Field>

        <Field label="Visibility of player profile image on website">
          <select
            value={form.image_visibility}
            onChange={(e) => handleChange("image_visibility", e.target.value)}
            className={inputCls()}
          >
            {VISIBILITY_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
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

      {/* ── Teams (existing players only) ────────────────────────────────── */}
      {!isNew && (
        <div className="bg-card-bg border border-card-border rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-card-border flex items-center justify-between">
            <h2 className="text-sm font-semibold text-foreground">
              Teams ({memberships?.results.length ?? 0})
            </h2>
            <Button
              size="xs"
              onClick={() => {
                setEditingMembership(null);
                setMembershipModalOpen(true);
              }}
            >
              + Add Team
            </Button>
          </div>
          {!memberships || memberships.results.length === 0 ? (
            <p className="px-6 py-4 text-sm text-foreground/50">
              No team memberships yet.
            </p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-card-border bg-background">
                  {["Team", "No.", "Active", "Loan", ""].map((h) => (
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
                {memberships.results.map((m) => (
                  <tr
                    key={m.id}
                    className="border-b border-card-border last:border-0 hover:bg-black/3 transition-colors"
                  >
                    <td className="px-4 py-3 text-foreground font-medium">
                      {m.team_name}
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
                            setEditingMembership(m);
                            setMembershipModalOpen(true);
                          }}
                        >
                          <EditIcon className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="raw"
                          size="icon"
                          className="text-foreground/50 hover:text-red-500"
                          onClick={() => setRemovingMembership(m)}
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

      <MembershipModal
        open={membershipModalOpen}
        kind="team-member"
        fixedPlayer={isNew ? undefined : Number(id)}
        initialValues={editingMembership ?? undefined}
        onSaved={() =>
          queryClient.invalidateQueries({ queryKey: ["team-memberships/"] })
        }
        onClose={() => {
          setMembershipModalOpen(false);
          setEditingMembership(null);
        }}
      />

      <ConfirmDialog
        open={!!removingMembership}
        title="Remove team membership"
        message={`Remove ${player?.full_name ?? "this player"} from ${removingMembership?.team_name ?? "this team"}? This cannot be undone.`}
        confirmLabel="Remove"
        onConfirm={handleRemoveMembership}
        onCancel={() => setRemovingMembership(null)}
        loading={removing}
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
