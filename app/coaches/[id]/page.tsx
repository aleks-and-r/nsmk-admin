'use client';

import type { ReactNode } from 'react';
import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { useCoachById } from '@/hooks/queries/useCoaches';
import { createCoach, updateCoach } from '@/services/coaches.service';
import EditPageHeader from '@/components/admin/EditPageHeader';
import ImageUpload from '@/components/admin/ImageUpload';

interface FormState {
  first_name: string;
  last_name: string;
  middle_name: string;
  email: string;
  birth_year: string;
}

const EMPTY_FORM: FormState = {
  first_name: '',
  last_name: '',
  middle_name: '',
  email: '',
  birth_year: '',
};

export default function CoachPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const isNew = id === 'new';
  const router = useRouter();

  const { data: coach, isLoading, isError } = useCoachById(isNew ? '' : id);

  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');

  useEffect(() => {
    if (coach) {
      setForm({
        first_name: coach.first_name ?? '',
        last_name: coach.last_name ?? '',
        middle_name: coach.middle_name ?? '',
        email: coach.email ?? '',
        birth_year: String(coach.birth_year ?? ''),
      });
    }
  }, [coach]);

  function handleChange(key: keyof FormState, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setSaveStatus('idle');
  }

  async function handleSave() {
    setSaving(true);
    setSaveStatus('idle');
    try {
      const payload = {
        first_name: form.first_name,
        last_name: form.last_name,
        middle_name: form.middle_name,
        email: form.email,
        birth_year: form.birth_year ? Number(form.birth_year) : undefined,
      };

      if (imageFile) {
        const fd = new FormData();
        Object.entries(payload).forEach(([k, v]) => v !== undefined && fd.append(k, String(v)));
        fd.append('image', imageFile);
        if (isNew) {
          await createCoach(fd);
        } else {
          await updateCoach(id, fd);
        }
      } else {
        if (isNew) {
          await createCoach(payload);
        } else {
          await updateCoach(id, payload);
        }
      }

      setSaveStatus('success');
      if (isNew) {
        setTimeout(() => router.push('/coaches'), 1000);
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

  if (!isNew && (isError || !coach)) {
    return <p className="text-red-500 text-sm">Failed to load coach.</p>;
  }

  const title = isNew ? 'Create coach' : 'Edit coach';
  const subtitle = isNew ? '' : (coach?.full_name ?? '');

  return (
    <div className="max-w-2xl">
      <EditPageHeader
        title={title}
        subtitle={subtitle}
        breadcrumbs={[
          { label: 'Coaches', href: '/coaches' },
          { label: isNew ? 'Create new' : (coach?.full_name ?? '') },
        ]}
      />

      <ImageUpload onFileChange={setImageFile} />

      <div className="bg-card-bg border border-card-border rounded-lg p-6 space-y-5">
        <Field label="First name">
          <input
            type="text"
            value={form.first_name}
            onChange={(e) => handleChange('first_name', e.target.value)}
            className={inputCls}
          />
        </Field>

        <Field label="Last name">
          <input
            type="text"
            value={form.last_name}
            onChange={(e) => handleChange('last_name', e.target.value)}
            className={inputCls}
          />
        </Field>

        <Field label="Middle name">
          <input
            type="text"
            value={form.middle_name}
            onChange={(e) => handleChange('middle_name', e.target.value)}
            className={inputCls}
          />
        </Field>

        <Field label="Email">
          <input
            type="email"
            value={form.email}
            onChange={(e) => handleChange('email', e.target.value)}
            className={inputCls}
          />
        </Field>

        <Field label="Year of birth">
          <input
            type="number"
            value={form.birth_year}
            onChange={(e) => handleChange('birth_year', e.target.value)}
            className={inputCls}
            min={1950}
            max={2020}
          />
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
