"use client";

import type { ReactNode } from "react";
import { useEffect, useState, use, useRef } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { usePlayerById } from "@/hooks/queries/usePlayers";
import { useTeams } from "@/hooks/queries/useTeams";
import { createPlayer, updatePlayer } from "@/services/players.service";
import {
  createTeamMembership,
  type TeamMembershipPayload,
} from "@/services/team-memberships.service";
import EditPageHeader from "@/components/admin/EditPageHeader";
import ImageUpload from "@/components/admin/ImageUpload";

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

// ── Team membership form ──────────────────────────────────────────────────────

interface MembershipForm {
  team: string;
  number: string;
  loan: boolean;
  is_active: boolean;
  joined_at: string;
  left_at: string;
}

const EMPTY_MEMBERSHIP: MembershipForm = {
  team: "",
  number: "",
  loan: false,
  is_active: true,
  joined_at: "",
  left_at: "",
};

type MembershipErrors = Partial<Record<keyof MembershipForm, string>>;

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
  const { data: teamsData } = useTeams();
  const queryClient = useQueryClient();

  // Player form state
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [errors, setErrors] = useState<FormErrors>({});
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "success" | "error">(
    "idle",
  );

  // Membership form state
  const [membership, setMembership] = useState<MembershipForm>(EMPTY_MEMBERSHIP);
  const [membershipErrors, setMembershipErrors] = useState<MembershipErrors>({});
  const [membershipSaving, setMembershipSaving] = useState(false);
  const [membershipStatus, setMembershipStatus] = useState<
    "idle" | "success" | "error"
  >("idle");
  const [membershipServerError, setMembershipServerError] = useState("");

  const teamOptions =
    teamsData?.results.map((t) => ({
      value: String(t.id),
      label: `${t.name} — ${t.club_name} (${t.season_name})`,
    })) ?? [];

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

  function handleMembershipChange(
    key: keyof MembershipForm,
    value: string | boolean,
  ) {
    setMembership((prev) => ({ ...prev, [key]: value }));
    if (membershipErrors[key])
      setMembershipErrors((prev) => ({ ...prev, [key]: undefined }));
    setMembershipStatus("idle");
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

  function validateMembership(): MembershipErrors {
    const e: MembershipErrors = {};
    if (!membership.team) e.team = "Team is required.";
    return e;
  }

  async function handleMembershipSave() {
    const e = validateMembership();
    if (Object.keys(e).length > 0) {
      setMembershipErrors(e);
      return;
    }

    setMembershipSaving(true);
    setMembershipStatus("idle");
    setMembershipServerError("");
    try {
      const payload: TeamMembershipPayload = {
        player: Number(id),
        team: Number(membership.team),
        is_active: membership.is_active,
        loan: membership.loan,
        ...(membership.number && { number: Number(membership.number) }),
        ...(membership.joined_at && { joined_at: membership.joined_at }),
        ...(membership.left_at && { left_at: membership.left_at }),
      };
      await createTeamMembership(payload);
      setMembershipStatus("success");
      setMembership(EMPTY_MEMBERSHIP);
    } catch (err) {
      setMembershipStatus("error");
      const data = (err as { response?: { data?: Record<string, unknown> } })
        ?.response?.data;
      if (data && typeof data === "object") {
        const fieldErrors: Partial<Record<keyof MembershipForm, string>> = {};
        const serverMsgs: string[] = [];
        Object.entries(data).forEach(([key, val]) => {
          const msgs = Array.isArray(val) ? val.map(String) : [String(val)];
          if (key in EMPTY_MEMBERSHIP) {
            fieldErrors[key as keyof MembershipForm] = msgs[0];
          } else {
            serverMsgs.push(...msgs);
          }
        });
        if (Object.keys(fieldErrors).length) setMembershipErrors(fieldErrors);
        setMembershipServerError(serverMsgs.join(" "));
      }
    } finally {
      setMembershipSaving(false);
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

      {/* ── Assign to team (existing players only) ───────────────────────── */}
      {!isNew && (
        <div className="bg-card-bg border border-card-border rounded-lg p-6 space-y-5">
          <h2 className="text-sm font-semibold text-foreground/50 uppercase tracking-wider">
            Assign to Team
          </h2>

          <Field label="Team" required error={membershipErrors.team}>
            <SearchableSelect
              options={teamOptions}
              value={membership.team}
              onChange={(v) => handleMembershipChange("team", v)}
              placeholder="Select team…"
              hasError={!!membershipErrors.team}
            />
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Jersey Number">
              <input
                type="number"
                value={membership.number}
                onChange={(e) =>
                  handleMembershipChange("number", e.target.value)
                }
                className={inputCls()}
                min={0}
                max={99}
              />
            </Field>

            <Field label="Joined At">
              <input
                type="date"
                value={membership.joined_at}
                onChange={(e) =>
                  handleMembershipChange("joined_at", e.target.value)
                }
                className={inputCls()}
              />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Left At">
              <input
                type="date"
                value={membership.left_at}
                onChange={(e) =>
                  handleMembershipChange("left_at", e.target.value)
                }
                className={inputCls()}
              />
            </Field>
          </div>

          <div className="flex items-center gap-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={membership.is_active}
                onChange={(e) =>
                  handleMembershipChange("is_active", e.target.checked)
                }
                className="w-4 h-4 accent-accent"
              />
              <span className="text-sm text-foreground">Active</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={membership.loan}
                onChange={(e) =>
                  handleMembershipChange("loan", e.target.checked)
                }
                className="w-4 h-4 accent-accent"
              />
              <span className="text-sm text-foreground">On loan</span>
            </label>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={handleMembershipSave}
              disabled={membershipSaving}
              className="px-6 py-2 bg-accent hover:bg-accent/90 disabled:opacity-60 text-white font-semibold rounded text-sm transition-colors"
            >
              {membershipSaving ? "Assigning…" : "Assign to Team"}
            </button>

            {membershipStatus === "success" && (
              <span className="text-sm text-green-600">
                Player assigned successfully.
              </span>
            )}
            {membershipStatus === "error" && (
              <div className="flex flex-col gap-0.5">
                <span className="text-sm text-red-500">
                  Failed to assign. Please try again.
                </span>
                {membershipServerError && (
                  <span className="text-xs text-red-400">
                    {membershipServerError}
                  </span>
                )}
              </div>
            )}
          </div>
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
