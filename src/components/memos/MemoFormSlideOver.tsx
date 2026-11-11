'use client';

import React, { useEffect, useState } from 'react';
import { Btn, Field, FormGrid, FormSection, SelectInput, SlideOver, TextArea, TextInput } from '@/components/ui/kit';
import { MEMO_PRIORITIES, MEMO_TYPES, api, type Memo } from './memoOptions';

interface Entity {
  id: number;
  name: string;
  acronym?: string | null;
}

interface Props {
  open: boolean;
  onClose: () => void;
  /** Called after a successful save so the list can refresh in place. */
  onSaved: () => void;
  /** Edit this memo; omit to create a new one. */
  memoId?: number | null;
}

const EMPTY = {
  name: '',
  summary: '',
  body: '',
  memo_type: 'cabinet',
  priority: 'medium',
  ministry_id: '',
  state_department_id: '',
  agency_id: '',
};

type FormState = typeof EMPTY;
type Errors = Partial<Record<keyof FormState | 'form', string>>;

export default function MemoFormSlideOver({ open, onClose, onSaved, memoId }: Props) {
  const isEdit = !!memoId;
  const [form, setForm] = useState<FormState>(EMPTY);
  const [status, setStatus] = useState<string>('draft');
  const [errors, setErrors] = useState<Errors>({});
  const [saving, setSaving] = useState<false | 'draft' | 'submitted' | 'save'>(false);
  const [loadingMemo, setLoadingMemo] = useState(false);
  const [ministries, setMinistries] = useState<Entity[]>([]);
  const [departments, setDepartments] = useState<Entity[]>([]);
  const [agencies, setAgencies] = useState<Entity[]>([]);

  // Reset / load when opened.
  useEffect(() => {
    if (!open) return;
    setErrors({});
    api<Entity[]>('/api/ministries').then(setMinistries).catch(() => setMinistries([]));
    if (!memoId) {
      setForm(EMPTY);
      setStatus('draft');
      return;
    }
    setLoadingMemo(true);
    api<Memo>(`/api/memos/${memoId}`)
      .then((m) => {
        setStatus(m.status);
        setForm({
          name: m.name ?? '',
          summary: m.summary ?? '',
          body: m.body ?? '',
          memo_type: m.memo_type ?? 'cabinet',
          priority: m.priority ?? 'medium',
          ministry_id: m.ministry_id ? String(m.ministry_id) : '',
          state_department_id: m.state_department_id ? String(m.state_department_id) : '',
          agency_id: m.agency_id ? String(m.agency_id) : '',
        });
      })
      .catch((e: Error) => setErrors({ form: e.message }))
      .finally(() => setLoadingMemo(false));
  }, [open, memoId]);

  // Cascading lookups.
  useEffect(() => {
    if (!open || !form.ministry_id) return setDepartments([]);
    api<Entity[]>(`/api/state_departments?ministry_id=${form.ministry_id}`).then(setDepartments).catch(() => setDepartments([]));
  }, [open, form.ministry_id]);

  useEffect(() => {
    if (!open || !form.state_department_id) return setAgencies([]);
    api<Entity[]>(`/api/agencies?state_department_id=${form.state_department_id}`).then(setAgencies).catch(() => setAgencies([]));
  }, [open, form.state_department_id]);

  const set = (key: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const value = e.target.value;
    setForm((f) => {
      const next = { ...f, [key]: value };
      if (key === 'ministry_id') {
        next.state_department_id = '';
        next.agency_id = '';
      }
      if (key === 'state_department_id') next.agency_id = '';
      return next;
    });
    setErrors((er) => ({ ...er, [key]: undefined }));
  };

  const validate = (): boolean => {
    const er: Errors = {};
    if (!form.name.trim()) er.name = 'Title is required';
    if (!form.summary.trim()) er.summary = 'Summary is required';
    if (!form.body.trim()) er.body = 'Memo content is required';
    if (!form.ministry_id) er.ministry_id = 'Choose the submitting ministry';
    setErrors(er);
    return Object.keys(er).length === 0;
  };

  const save = async (mode: 'draft' | 'submitted' | 'save') => {
    if (!validate()) return;
    setSaving(mode);
    try {
      const payload: Record<string, unknown> = { ...form };
      if (mode !== 'save') payload.status = mode;
      if (isEdit) {
        await api(`/api/memos/${memoId}`, { method: 'PUT', body: JSON.stringify(payload) });
      } else {
        await api('/api/memos', { method: 'POST', body: JSON.stringify(payload) });
      }
      onSaved();
      onClose();
    } catch (e) {
      setErrors({ form: (e as Error).message });
    } finally {
      setSaving(false);
    }
  };

  const busy = saving !== false;
  const opt = (list: Entity[]) => list.map((m) => ({ value: m.id, label: m.acronym ? `${m.name} (${m.acronym})` : m.name }));

  return (
    <SlideOver
      open={open}
      onClose={onClose}
      busy={busy}
      size="lg"
      title={isEdit ? 'Edit memo' : 'New memo'}
      description={isEdit ? 'Update the memo details.' : 'Draft a memo for cabinet consideration.'}
      footer={
        <div className="flex w-full flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Btn variant="outline" onClick={onClose} disabled={busy}>
            Cancel
          </Btn>
          {isEdit ? (
            <>
              {status === 'draft' && (
                <Btn variant="outline" onClick={() => save('submitted')} loading={saving === 'submitted'} disabled={busy || loadingMemo}>
                  Save &amp; submit
                </Btn>
              )}
              <Btn onClick={() => save('save')} loading={saving === 'save'} disabled={busy || loadingMemo}>
                Save changes
              </Btn>
            </>
          ) : (
            <>
              <Btn variant="outline" onClick={() => save('draft')} loading={saving === 'draft'} disabled={busy}>
                Save as draft
              </Btn>
              <Btn onClick={() => save('submitted')} loading={saving === 'submitted'} disabled={busy}>
                Submit memo
              </Btn>
            </>
          )}
        </div>
      }
    >
      <form
        id="memo-form"
        className="space-y-6"
        onSubmit={(e) => {
          e.preventDefault();
          save(isEdit ? 'save' : 'draft');
        }}
      >
        {errors.form && (
          <div className="rounded-lg border border-error-200 bg-error-50 px-4 py-3 text-theme-sm text-error-700 dark:border-error-500/30 dark:bg-error-500/10 dark:text-error-400">
            {errors.form}
          </div>
        )}
        {loadingMemo ? (
          <div className="space-y-3">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="h-11 animate-pulse rounded-lg bg-gray-100 dark:bg-gray-800" />
            ))}
          </div>
        ) : (
          <>
            <FormSection title="Memo">
              <FormGrid>
                <Field label="Title" required error={errors.name}>
                  <TextInput value={form.name} onChange={set('name')} placeholder="e.g. Proposal for the National Housing Programme" />
                </Field>
                <Field label="Type" span={1}>
                  <SelectInput value={form.memo_type} onChange={set('memo_type')} options={MEMO_TYPES} />
                </Field>
                <Field label="Priority" span={1}>
                  <SelectInput value={form.priority} onChange={set('priority')} options={MEMO_PRIORITIES} />
                </Field>
                <Field label="Executive summary" required error={errors.summary}>
                  <TextArea value={form.summary} onChange={set('summary')} rows={3} placeholder="A short overview of the proposal" />
                </Field>
                <Field label="Content" required error={errors.body}>
                  <TextArea value={form.body} onChange={set('body')} rows={10} placeholder="Background, analysis and recommendations" />
                </Field>
              </FormGrid>
            </FormSection>

            <FormSection title="Submitting entity" description="The ministry, state department or agency presenting this memo.">
              <FormGrid>
                <Field label="Ministry" required error={errors.ministry_id}>
                  <SelectInput value={form.ministry_id} onChange={set('ministry_id')} options={opt(ministries)} placeholder="Select ministry" />
                </Field>
                <Field label="State department" span={1}>
                  <SelectInput
                    value={form.state_department_id}
                    onChange={set('state_department_id')}
                    options={opt(departments)}
                    placeholder={form.ministry_id ? 'Optional' : 'Select a ministry first'}
                    disabled={!form.ministry_id}
                  />
                </Field>
                <Field label="Agency" span={1}>
                  <SelectInput
                    value={form.agency_id}
                    onChange={set('agency_id')}
                    options={opt(agencies)}
                    placeholder={form.state_department_id ? 'Optional' : 'Select a department first'}
                    disabled={!form.state_department_id}
                  />
                </Field>
              </FormGrid>
            </FormSection>
          </>
        )}
      </form>
    </SlideOver>
  );
}
