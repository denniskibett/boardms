'use client';

import React, { useEffect, useState } from 'react';
import { Btn, Field, FormGrid, SelectInput, SlideOver, TextArea, TextInput } from '@/components/ui/kit';
import { useResources } from '@/hooks/useResources';
import type { Resource } from '@/lib/store/slices/resourcesSlice';
import { typeLabel } from './resourceUtils';

interface Props {
  open: boolean;
  onClose: () => void;
  onSaved?: () => void;
  resource?: Resource | null;
}

const thisYear = new Date().getFullYear();
const blank = { display_name: '', name: '', resource_type_id: '', year: String(thisYear), description: '' };
const toFolder = (s: string) => s.toUpperCase().trim().replace(/\s+/g, '-').replace(/[^A-Z0-9-]/g, '');

/** Create / edit a resource folder in the right-side slide-over. */
export default function ResourceForm({ open, onClose, onSaved, resource }: Props) {
  const { categories, createResource, updateResource } = useResources();
  const [form, setForm] = useState(blank);
  const [folderTouched, setFolderTouched] = useState(false);
  const [errors, setErrors] = useState<Record<string, string | undefined>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setErrors({});
    setFolderTouched(!!resource);
    setForm(
      resource
        ? {
            display_name: resource.display_name ?? '',
            name: resource.name ?? '',
            resource_type_id: resource.resource_type_id ? String(resource.resource_type_id) : '',
            year: String(resource.year ?? thisYear),
            description: resource.description ?? '',
          }
        : blank,
    );
  }, [open, resource]);

  const set = (k: keyof typeof blank) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const value = e.target.value;
    setForm((f) => ({
      ...f,
      [k]: value,
      // Suggest the folder name from the display name until the user edits it.
      ...(k === 'display_name' && !folderTouched ? { name: toFolder(value) } : {}),
    }));
    if (k === 'name') setFolderTouched(true);
    setErrors((er) => ({ ...er, [k]: undefined }));
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const er: Record<string, string> = {};
    if (!form.display_name.trim()) er.display_name = 'Display name is required';
    if (!toFolder(form.name)) er.name = 'Folder name is required';
    if (!form.resource_type_id) er.resource_type_id = 'Choose a resource type';
    const year = parseInt(form.year, 10);
    if (!year || year < 1963 || year > thisYear + 5) er.year = 'Enter a valid year';
    setErrors(er);
    if (Object.keys(er).length) return;

    setSaving(true);
    try {
      const data = {
        display_name: form.display_name.trim(),
        name: form.name.trim(),
        resource_type_id: parseInt(form.resource_type_id, 10),
        year,
        description: form.description.trim(),
      };
      if (resource) await updateResource(resource.id, data);
      else await createResource(data);
      onSaved?.();
      onClose();
    } catch (err) {
      setErrors({ form: (err as Error).message || 'Could not save the resource' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <SlideOver
      open={open}
      onClose={onClose}
      busy={saving}
      title={resource ? 'Edit resource' : 'New resource'}
      description="A resource is a folder of documents, grouped by type and year."
      footer={
        <>
          <Btn variant="outline" onClick={onClose} disabled={saving}>
            Cancel
          </Btn>
          <Btn type="submit" form="resource-form" loading={saving}>
            {resource ? 'Save changes' : 'Create resource'}
          </Btn>
        </>
      }
    >
      <form id="resource-form" onSubmit={submit} className="space-y-5">
        {errors.form && (
          <div className="rounded-lg border border-error-200 bg-error-50 px-4 py-3 text-theme-sm text-error-700 dark:border-error-500/30 dark:bg-error-500/10 dark:text-error-400">
            {errors.form}
          </div>
        )}
        <FormGrid>
          <Field label="Display name" required error={errors.display_name}>
            <TextInput value={form.display_name} onChange={set('display_name')} placeholder="e.g. Cabinet Meeting January 2025" />
          </Field>
          <Field label="Folder name" required error={errors.name} hint="Saved in upper case with dashes, e.g. CABINET-MEETING-JANUARY-2025.">
            <TextInput value={form.name} onChange={set('name')} placeholder="CABINET-MEETING-JANUARY-2025" />
          </Field>
          <Field label="Resource type" required span={1} error={errors.resource_type_id}>
            <SelectInput
              value={form.resource_type_id}
              onChange={set('resource_type_id')}
              options={categories.map((c) => ({ value: c.id, label: typeLabel(c.name) }))}
              placeholder="Select type"
            />
          </Field>
          <Field label="Year" required span={1} error={errors.year}>
            <TextInput type="number" inputMode="numeric" value={form.year} onChange={set('year')} min={1963} max={thisYear + 5} />
          </Field>
          <Field label="Description">
            <TextArea value={form.description} onChange={set('description')} rows={3} placeholder="Optional" />
          </Field>
        </FormGrid>
      </form>
    </SlideOver>
  );
}
