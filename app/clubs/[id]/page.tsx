'use client';

import type { ReactNode } from 'react';
import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { useClub } from '@/hooks/queries/useClubs';
import { createClub, updateClub } from '@/services/clubs.service';
import EditPageHeader from '@/components/admin/EditPageHeader';
import ImageUpload from '@/components/admin/ImageUpload';

interface FormState {
  name: string;
  short_name: string;
  owner: string;
  email: string;
  phone: string;
  website: string;
  facebook_url: string;
  twitter_url: string;
  instagram_url: string;
}

const EMPTY: FormState = {
  name: '',
  short_name: '',
  owner: '',
  email: '',
  phone: '',
  website: '',
  facebook_url: '',
  twitter_url: '',
  instagram_url: '',
};

export default function ClubPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const isNew = id === 'new';
  const router = useRouter();

  // Pass empty string when creating — disables the query (enabled: !!id)
  const { data: club, isLoading, isError } = useClub(isNew ? '' : id);

  const [form, setForm] = useState<FormState>(EMPTY);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');

  useEffect(() => {
    if (club) {
      setForm({
        name: club.name ?? '',
        short_name: club.short_name ?? '',
        owner: club.owner ?? '',
        email: club.email ?? '',
        phone: club.phone ?? '',
        website: club.website ?? '',
        facebook_url: club.facebook_url ?? '',
        twitter_url: club.twitter_url ?? '',
        instagram_url: club.instagram_url ?? '',
      });
    }
  }, [club]);

  function handleChange(key: keyof FormState, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setSaveStatus('idle');
  }

  async function handleSave() {
    setSaving(true);
    setSaveStatus('idle');
    try {
      if (imageFile) {
        const fd = new FormData();
        Object.entries(form).forEach(([k, v]) => fd.append(k, v));
        fd.append('image', imageFile);
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

      setSaveStatus('success');
      if (isNew) {
        setTimeout(() => router.push('/clubs'), 1000);
      }
    } catch {
      setSaveStatus('error');
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

  if (!isNew && (isError || !club)) {
    return <p className="text-red-500 text-sm">Failed to load club.</p>;
  }

  const title = isNew ? 'Create club' : 'Edit club';
  const subtitle = isNew ? '' : (club?.name ?? '');

  return (
    <div className="max-w-2xl">
      <EditPageHeader
        title={title}
        subtitle={subtitle}
        breadcrumbs={[
          { label: 'Clubs', href: '/clubs' },
          { label: isNew ? 'Create new' : (club?.name ?? '') },
        ]}
      />

      <ImageUpload onFileChange={setImageFile} />

      <div className="bg-card-bg border border-card-border rounded-lg p-6 space-y-5">
        <Field label="Name">
          <input type="text" value={form.name} onChange={(e) => handleChange('name', e.target.value)} className={inputCls} />
        </Field>

        <Field label="Short name">
          <input type="text" value={form.short_name} onChange={(e) => handleChange('short_name', e.target.value)} className={inputCls} />
        </Field>

        <Field label="Owner">
          <input type="text" value={form.owner} onChange={(e) => handleChange('owner', e.target.value)} className={inputCls} />
        </Field>

        <Field label="Email">
          <input type="email" value={form.email} onChange={(e) => handleChange('email', e.target.value)} className={inputCls} />
        </Field>

        <Field label="Phone">
          <div className="flex">
            <span className="flex items-center gap-1.5 px-3 py-2 bg-background border border-r-0 border-card-border rounded-l text-sm text-foreground/70 whitespace-nowrap select-none">
              🇷🇸 +381
            </span>
            <input
              type="tel"
              value={form.phone}
              onChange={(e) => handleChange('phone', e.target.value)}
              placeholder="Enter a phone number"
              className={`${inputCls} rounded-l-none`}
            />
          </div>
        </Field>

        <Field label="Website">
          <input type="url" value={form.website} onChange={(e) => handleChange('website', e.target.value)} className={inputCls} />
        </Field>

        <Field label="Facebook URL">
          <input type="url" value={form.facebook_url} onChange={(e) => handleChange('facebook_url', e.target.value)} className={inputCls} />
        </Field>

        <Field label="Twitter URL">
          <input type="url" value={form.twitter_url} onChange={(e) => handleChange('twitter_url', e.target.value)} className={inputCls} />
        </Field>

        <Field label="Instagram URL">
          <input type="url" value={form.instagram_url} onChange={(e) => handleChange('instagram_url', e.target.value)} className={inputCls} />
        </Field>

        <div className="flex items-center gap-3 pt-2">
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-2 bg-accent hover:bg-accent/90 disabled:opacity-60 text-white font-semibold rounded text-sm transition-colors"
          >
            {saving ? 'Saving…' : 'Save'}
          </button>

          {saveStatus === 'success' && (
            <span className="text-sm text-green-600">
              {isNew ? 'Created successfully. Redirecting…' : 'Saved successfully.'}
            </span>
          )}
          {saveStatus === 'error' && (
            <span className="text-sm text-red-500">Failed to save. Please try again.</span>
          )}
        </div>
      </div>
    </div>
  );
}

const inputCls =
  'w-full px-3 py-2 bg-background border border-card-border rounded text-sm text-foreground focus:ring-2 focus:ring-accent focus:outline-none';

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-foreground mb-1">{label}</label>
      {children}
    </div>
  );
}
