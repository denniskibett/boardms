'use client';
import React, { useEffect, useState } from 'react';
import { Btn, Field, FormGrid, SelectInput, SlideOver, TextArea, TextInput } from '@/components/ui/kit';
import { CLASSIFICATIONS, type BookCover, type MeetingBookData } from '@/lib/books/types';

/** Right-side panel to edit the book cover. Empty fields fall back to the meeting's data. */
export default function CoverForm({
  open,
  onClose,
  data,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  data: MeetingBookData;
  onSaved: (cover: BookCover) => void;
}) {
  const [form, setForm] = useState<BookCover>(data.cover);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setForm(data.cover);
      setError(null);
    }
  }, [open, data.cover]);

  const set = (k: keyof BookCover) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/books/${data.meeting.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || 'Could not save');
      onSaved(body.cover);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SlideOver
      open={open}
      onClose={onClose}
      busy={saving}
      title="Book cover"
      description="Shown on the first page of the meeting book. Leave a field empty to use the meeting's details."
      footer={
        <>
          <Btn variant="outline" onClick={onClose} disabled={saving}>
            Cancel
          </Btn>
          <Btn type="submit" form="cover-form" loading={saving}>
            Save cover
          </Btn>
        </>
      }
    >
      <form id="cover-form" onSubmit={save} className="space-y-5">
        {error && <p className="rounded-lg bg-error-50 px-4 py-3 text-sm text-error-600">{error}</p>}
        <FormGrid>
          <Field label="Title" hint={`Default: ${data.meeting.name}`}>
            <TextInput value={form.title ?? ''} onChange={set('title')} placeholder={data.meeting.name} />
          </Field>
          <Field label="Subtitle" hint={`Default: ${data.meeting.type || 'Board'} Meeting Book`}>
            <TextInput value={form.subtitle ?? ''} onChange={set('subtitle')} />
          </Field>
          <Field label="Reference number" span={1}>
            <TextInput value={form.reference ?? ''} onChange={set('reference')} placeholder="e.g. CAB/2026/14" />
          </Field>
          <Field label="Classification" span={1}>
            <SelectInput
              value={form.classification ?? ''}
              onChange={set('classification')}
              placeholder="None"
              options={CLASSIFICATIONS.map((c) => ({ value: c, label: c }))}
            />
          </Field>
          <Field label="Prepared by">
            <TextInput value={form.preparedBy ?? ''} onChange={set('preparedBy')} placeholder="e.g. Cabinet Secretariat" />
          </Field>
          <Field label="Cover note">
            <TextArea value={form.note ?? ''} onChange={set('note')} rows={3} />
          </Field>
        </FormGrid>
      </form>
    </SlideOver>
  );
}
