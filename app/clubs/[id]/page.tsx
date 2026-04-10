"use client";

import type { ReactNode } from "react";
import { useEffect, useState, use, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useQueryClient } from "@tanstack/react-query";
import { useClub } from "@/hooks/queries/useClubs";
import { useTeams } from "@/hooks/queries/useTeams";
import { useSeasons } from "@/hooks/queries/useSeasons";
import { createClub, updateClub } from "@/services/clubs.service";
import { createTeam, type TeamPayload } from "@/services/teams.service";
import EditPageHeader from "@/components/admin/EditPageHeader";
import ImageUpload from "@/components/admin/ImageUpload";

// ── Club form ─────────────────────────────────────────────────────────────────

interface FormState {
  name: string;
  short_name: string;
  owner: string;
  contact_email: string;
  contact_phone: string;
  website: string;
  facebook_url: string;
  twitter_url: string;
  instagram_url: string;
}

const EMPTY: FormState = {
  name: "",
  short_name: "",
  owner: "",
  contact_email: "",
  contact_phone: "",
  website: "",
  facebook_url: "",
  twitter_url: "",
  instagram_url: "",
};

type FormErrors = Partial<Record<keyof FormState, string>>;

// ── Team create form ──────────────────────────────────────────────────────────

interface TeamForm {
  name: string;
  age_group_label: string;
  season: string;
  is_active: boolean;
}

const EMPTY_TEAM: TeamForm = {
  name: "",
  age_group_label: "",
  season: "",
  is_active: true,
};

type TeamFormErrors = Partial<Record<keyof TeamForm, string>>;

// ── Page ──────────────────────────────────────────────────────────────────────

export default function ClubPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const isNew = id === "new";
  const router = useRouter();

  const queryClient = useQueryClient();
  const { data: club, isLoading, isError } = useClub(isNew ? "" : id);
  const { data: teamsData } = useTeams();
  const { data: seasonsData } = useSeasons();

  const [activeTab, setActiveTab] = useState<"info" | "teams">("info");

  // Club form
  const [form, setForm] = useState<FormState>(EMPTY);
  const [errors, setErrors] = useState<FormErrors>({});
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "success" | "error">(
    "idle",
  );

  // Team create form
  const [teamForm, setTeamForm] = useState<TeamForm>(EMPTY_TEAM);
  const [teamErrors, setTeamErrors] = useState<TeamFormErrors>({});
  const [teamSaving, setTeamSaving] = useState(false);
  const [teamStatus, setTeamStatus] = useState<"idle" | "success" | "error">(
    "idle",
  );
  const [teamServerError, setTeamServerError] = useState("");

  const clubTeams =
    teamsData?.results.filter((t) => t.club === Number(id)) ?? [];

  const seasonOptions =
    seasonsData?.results.map((s) => ({
      value: String(s.id),
      label: s.name,
    })) ?? [];

  useEffect(() => {
    if (club) {
      setForm({
        name: club.name ?? "",
        short_name: club.short_name ?? "",
        owner: club.owner ?? "",
        contact_email: club.contact_email ?? "",
        contact_phone: club.contact_phone ?? "",
        website: club.website ?? "",
        facebook_url: club.facebook_url ?? "",
        twitter_url: club.twitter_url ?? "",
        instagram_url: club.instagram_url ?? "",
      });
    }
  }, [club]);

  function handleChange(key: keyof FormState, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: undefined }));
    setSaveStatus("idle");
  }

  function handleTeamChange(key: keyof TeamForm, value: string | boolean) {
    setTeamForm((prev) => ({ ...prev, [key]: value }));
    if (teamErrors[key as keyof TeamFormErrors])
      setTeamErrors((prev) => ({ ...prev, [key]: undefined }));
    setTeamStatus("idle");
    setTeamServerError("");
  }

  function validate(): FormErrors {
    if (!isNew) return {};
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
      if (imageFile) {
        const fd = new FormData();
        Object.entries(form).forEach(([k, v]) => fd.append(k, v));
        fd.append("image", imageFile);
        if (isNew) {
          await createClub(fd);
        } else {
          await updateClub(id, fd);
        }
      } else {
        if (isNew) {
          await createClub(form);
        } else {
          await updateClub(id, form);
        }
      }

      setSaveStatus("success");
      await queryClient.invalidateQueries({ queryKey: ["clubs/"] });
      if (isNew) {
        setTimeout(() => router.push("/clubs"), 1000);
      }
    } catch {
      setSaveStatus("error");
    } finally {
      setSaving(false);
    }
  }

  function validateTeam(): TeamFormErrors {
    const e: TeamFormErrors = {};
    if (!teamForm.name.trim()) e.name = "Name is required.";
    if (!teamForm.season) e.season = "Season is required.";
    return e;
  }

  async function handleTeamSave() {
    const e = validateTeam();
    if (Object.keys(e).length > 0) {
      setTeamErrors(e);
      return;
    }

    setTeamSaving(true);
    setTeamStatus("idle");
    setTeamServerError("");
    try {
      const payload: TeamPayload = {
        club: Number(id),
        name: teamForm.name,
        age_group_label: teamForm.age_group_label,
        season: Number(teamForm.season),
        is_active: teamForm.is_active,
      };
      await createTeam(payload);
      setTeamStatus("success");
      setTeamForm(EMPTY_TEAM);
      await queryClient.invalidateQueries({ queryKey: ["teams/"] });
    } catch (err) {
      setTeamStatus("error");
      const data = (err as { response?: { data?: Record<string, unknown> } })
        ?.response?.data;
      if (data && typeof data === "object") {
        const fieldErrors: TeamFormErrors = {};
        const serverMsgs: string[] = [];
        Object.entries(data).forEach(([key, val]) => {
          const msgs = Array.isArray(val) ? val.map(String) : [String(val)];
          if (key in EMPTY_TEAM) {
            fieldErrors[key as keyof TeamForm] = msgs[0];
          } else {
            serverMsgs.push(...msgs);
          }
        });
        if (Object.keys(fieldErrors).length) setTeamErrors(fieldErrors);
        if (serverMsgs.length) setTeamServerError(serverMsgs.join(" "));
      }
    } finally {
      setTeamSaving(false);
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

  if (!isNew && (isError || !club)) {
    return <p className="text-red-500 text-sm">Failed to load club.</p>;
  }

  const title = isNew ? "Create club" : "Edit club";
  const subtitle = isNew ? "" : (club?.name ?? "");

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="max-w-2xl">
      <EditPageHeader
        title={title}
        subtitle={subtitle}
        breadcrumbs={[
          { label: "Clubs", href: "/clubs" },
          { label: isNew ? "Create new" : (club?.name ?? "") },
        ]}
      />

      {/* ── Tab bar (edit mode only) ────────────────────────────────────── */}
      {!isNew && (
        <div className="flex border-b border-card-border mb-6">
          {(["info", "teams"] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`px-5 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px capitalize ${
                activeTab === tab
                  ? "border-accent text-accent"
                  : "border-transparent text-foreground/50 hover:text-foreground"
              }`}
            >
              {tab === "info" ? "Club Info" : "Teams"}
            </button>
          ))}
        </div>
      )}

      {/* ── Club Info tab ───────────────────────────────────────────────── */}
      {(isNew || activeTab === "info") && (
        <>
          <ImageUpload onFileChange={setImageFile} />

          <div className="bg-card-bg border border-card-border rounded-lg p-6 space-y-5">
            <Field label="Name" required={isNew} error={errors.name}>
              <input
                type="text"
                value={form.name}
                onChange={(e) => handleChange("name", e.target.value)}
                className={inputCls(!!errors.name)}
              />
            </Field>

            <Field label="Short name">
              <input
                type="text"
                value={form.short_name}
                onChange={(e) => handleChange("short_name", e.target.value)}
                className={inputCls()}
              />
            </Field>

            <Field label="Owner">
              <input
                type="text"
                value={form.owner}
                onChange={(e) => handleChange("owner", e.target.value)}
                className={inputCls()}
              />
            </Field>

            <Field label="Email">
              <input
                type="email"
                value={form.contact_email ?? ""}
                onChange={(e) => handleChange("contact_email", e.target.value)}
                className={inputCls()}
              />
            </Field>

            <Field label="Phone">
              <div className="flex">
                <span className="flex items-center gap-1.5 px-3 py-2 bg-background border border-r-0 border-card-border rounded-l text-sm text-foreground/70 whitespace-nowrap select-none"></span>
                <input
                  type="tel"
                  value={form.contact_phone ?? ""}
                  onChange={(e) => handleChange("contact_phone", e.target.value)}
                  placeholder="Enter a phone number"
                  className={`${inputCls()} rounded-l-none`}
                />
              </div>
            </Field>

            <Field label="Website">
              <input
                type="url"
                value={form.website}
                onChange={(e) => handleChange("website", e.target.value)}
                className={inputCls()}
              />
            </Field>

            <Field label="Facebook URL">
              <input
                type="url"
                value={form.facebook_url}
                onChange={(e) => handleChange("facebook_url", e.target.value)}
                className={inputCls()}
              />
            </Field>

            <Field label="Twitter URL">
              <input
                type="url"
                value={form.twitter_url}
                onChange={(e) => handleChange("twitter_url", e.target.value)}
                className={inputCls()}
              />
            </Field>

            <Field label="Instagram URL">
              <input
                type="url"
                value={form.instagram_url}
                onChange={(e) => handleChange("instagram_url", e.target.value)}
                className={inputCls()}
              />
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
        </>
      )}

      {/* ── Teams tab ───────────────────────────────────────────────────── */}
      {!isNew && activeTab === "teams" && (
        <div className="space-y-6">
          {/* Existing teams table */}
          <div className="bg-card-bg border border-card-border rounded-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-card-border">
              <h2 className="text-sm font-semibold text-foreground">
                Teams ({clubTeams.length})
              </h2>
            </div>

            {clubTeams.length === 0 ? (
              <p className="px-6 py-8 text-sm text-foreground/40 text-center">
                No teams yet.
              </p>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="border-b border-card-border">
                    {["Name", "Season", "Age Group", "Active", ""].map((h) => (
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
                  {clubTeams.map((t) => (
                    <tr
                      key={t.id}
                      className="border-b border-card-border last:border-0 hover:bg-black/3 transition-colors"
                    >
                      <td className="px-4 py-3 text-sm text-foreground font-medium">
                        {t.name}
                      </td>
                      <td className="px-4 py-3 text-sm text-foreground">
                        {t.season_name}
                      </td>
                      <td className="px-4 py-3 text-sm text-foreground">
                        {t.age_group_label || "—"}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                            t.is_active
                              ? "bg-green-500/10 text-green-600"
                              : "bg-foreground/10 text-foreground/50"
                          }`}
                        >
                          {t.is_active ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <Link
                          href={`/teams/${t.id}`}
                          className="inline-flex items-center justify-center w-7 h-7 rounded bg-btn-edit hover:bg-btn-edit/90 text-white transition-colors"
                          aria-label="Edit team"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="w-3.5 h-3.5"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                            />
                          </svg>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Add team form */}
          <div className="bg-card-bg border border-card-border rounded-lg p-6 space-y-5">
            <h2 className="text-sm font-semibold text-foreground/50 uppercase tracking-wider">
              Add Team
            </h2>

            <Field label="Name" required error={teamErrors.name}>
              <input
                type="text"
                value={teamForm.name}
                onChange={(e) => handleTeamChange("name", e.target.value)}
                className={inputCls(!!teamErrors.name)}
              />
            </Field>

            <Field label="Age Group Label">
              <input
                type="text"
                value={teamForm.age_group_label}
                onChange={(e) =>
                  handleTeamChange("age_group_label", e.target.value)
                }
                className={inputCls()}
              />
            </Field>

            <Field label="Season" required error={teamErrors.season}>
              <SearchableSelect
                options={seasonOptions}
                value={teamForm.season}
                onChange={(v) => handleTeamChange("season", v)}
                placeholder="Select season…"
                hasError={!!teamErrors.season}
              />
            </Field>

            <Field label="Active">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={teamForm.is_active}
                  onChange={(e) =>
                    handleTeamChange("is_active", e.target.checked)
                  }
                  className="w-4 h-4 accent-accent"
                />
                <span className="text-sm text-foreground">Team is active</span>
              </label>
            </Field>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={handleTeamSave}
                disabled={teamSaving}
                className="px-6 py-2 bg-accent hover:bg-accent/90 disabled:opacity-60 text-white font-semibold rounded text-sm transition-colors"
              >
                {teamSaving ? "Creating…" : "Add Team"}
              </button>

              {teamStatus === "success" && (
                <span className="text-sm text-green-600">
                  Team created successfully.
                </span>
              )}
              {teamStatus === "error" && (
                <div className="flex flex-col gap-0.5">
                  <span className="text-sm text-red-500">
                    Failed to create team. Please try again.
                  </span>
                  {teamServerError && (
                    <span className="text-xs text-red-400">
                      {teamServerError}
                    </span>
                  )}
                </div>
              )}
            </div>
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
