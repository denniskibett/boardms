'use client';

import React, { useEffect, useState } from 'react';
import { Btn, Field, FormGrid, SelectInput, SlideOver, TextArea, TextInput } from '@/components/ui/kit';
import { api } from '@/components/memos/memoOptions';

export const LETTER_STATUSES = [
  { value: 'pending', label: 'Pending' },
  { value: 'sent', label: 'Sent' },
  { value: 'acknowledged', label: 'Acknowledged' },
  { value: 'in_progress', label: 'In progress' },
  { value: 'completed', label: 'Completed' },
  { value: 'overdue', label: 'Overdue' },
];

export interface ActionLetter {
  id: number;
  deliberation_id: number | null;
  to_ministry_id: number | null;
  subject: string | null;
  content: string | null;
  due_date: string | null;
  status: string | null;
  sent_at: string | null;
  acknowledged_at: string | null;
  created_at: string;
  ministry_name?: string | null;
  decision_text?: string | null;
}

interface Props {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  letter?: ActionLetter | null;
  /** Pre-select the decision when issuing a letter from the decisions list. */
  decisionId?: number | null;
  decisionSubject?: string | null;
}

const blank = { subject: '', content: '', to_ministry_id: '', deliberation_id: '', due_date: '', status: 'pending' };

export default function ActionLetterFormSlideOver({ open, onClose, onSaved, letter, decisionId, decisionSubject }: Props) {
  const [form, setForm] = useState(blank);
  const [errors, setErrors] = useState<Record<string, string | undefined>>({});
  const [saving, setSaving] = useState(false);
  const [ministries, setMinistries] = useState<{ id: number; name: string }[]>([]);
  const [decisions, setDecisions] = useState<{ id: number; decision_text: string | null; agenda_name: string | null }[]>([]);

  useEffect(() => {
    if (!open) return;
    setErrors({});
    setForm(
      letter
        ? {
            subject: letter.subject ?? '',
            content: letter.content ?? '',
            to_ministry_id: letter.to_ministry_id ? String(letter.to_ministry_id) : '',
            deliberation_id: letter.deliberation_id ? String(letter.deliberation_id) : '',
            due_date: letter.due_date ? letter.due_date.slice(0, 10) : '',
            status: letter.status ?? 'pending',
          }
        : { ...blank, deliberation_id: decisionId ? String(decisionId) : '', subject: decisionSubject ?? '' },
    );
    api<{ id: number; name: string }[]>('/api/ministries').then(setMinistries).catch(() => setMinistries([]));
    api<{ id: number; decision_text: string | null; agenda_name: string | null }[]>('/api/decisions')
      .then(setDecisions)
      .catch(() => setDecisions([]));
  }, [open, letter, decisionId, decisionSubject]);

  const set = (k: keyof typeof blank) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm((f) => ({ ...f, [k]: e.target.value }));
    setErrors((er) => ({ ...er, [k]: undefined }));
  };

  const submit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const er: Record<string, string> = {};
    if (!form.subject.trim()) er.subject = 'Subject is required';
    if (!form.to_ministry_id) er.to_ministry_id = 'Choose the recipient ministry';
    setErrors(er);
    if (Object.keys(er).length) return;

    setSaving(true);
    try {
      await api(letter ? `/api/action-letters/${letter.id}` : '/api/action-letters', {
        method: letter ? 'PUT' : 'POST',
        body: JSON.stringify(form),
      });
      onSaved();
      onClose();
    } catch (err) {
      setErrors({ form: (err as Error).message });
    } finally {
      setSaving(false);
    }
  };

  const decisionLabel = (d: { id: number; decision_text: string | null; agenda_name: string | null }) => {
    const text = d.agenda_name || d.decision_text || `Decision #${d.id}`;
    return text.length > 80 ? `${text.slice(0, 77)}…` : text;
  };

  return (
    <SlideOver
      open={open}
      onClose={onClose}
      busy={saving}
      size="lg"
      title={letter ? 'Edit action letter' : 'New action letter'}
      description="Instruct a ministry to implement a cabinet decision."
      footer={
        <>
          <Btn variant="outline" onClick={onClose} disabled={saving}>
            Cancel
          </Btn>
          <Btn type="submit" form="action-letter-form" loading={saving}>
            {letter ? 'Save changes' : 'Create letter'}
          </Btn>
        </>
      }
    >
      <form id="action-letter-form" onSubmit={submit} className="space-y-5">
        {errors.form && (
          <div className="rounded-lg border border-error-200 bg-error-50 px-4 py-3 text-theme-sm text-error-700 dark:border-error-500/30 dark:bg-error-500/10 dark:text-error-400">
            {errors.form}
          </div>
        )}
        <FormGrid>
          <Field label="Subject" required error={errors.subject}>
            <TextInput value={form.subject} onChange={set('subject')} placeholder="e.g. Implementation of the housing programme" />
          </Field>
          <Field label="Recipient ministry" required error={errors.to_ministry_id}>
            <SelectInput
              value={form.to_ministry_id}
              onChange={set('to_ministry_id')}
              options={ministries.map((m) => ({ value: m.id, label: m.name }))}
              placeholder="Select ministry"
            />
          </Field>
          <Field label="Cabinet decision" hint="The decision this letter implements.">
            <SelectInput
              value={form.deliberation_id}
              onChange={set('deliberation_id')}
              options={decisions.map((d) => ({ value: d.id, label: decisionLabel(d) }))}
              placeholder="None"
            />
          </Field>
          <Field label="Due date" span={1}>
            <TextInput type="date" value={form.due_date} onChange={set('due_date')} />
          </Field>
          <Field label="Status" span={1}>
            <SelectInput value={form.status} onChange={set('status')} options={LETTER_STATUSES} />
          </Field>
          <Field label="Letter content">
            <TextArea value={form.content} onChange={set('content')} rows={8} placeholder="Instructions to the ministry" />
          </Field>
        </FormGrid>
      </form>
    </SlideOver>
  );
}
