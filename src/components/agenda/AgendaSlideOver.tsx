"use client";
// Create / edit an agenda item in the right-side SlideOver, with its documents.
// Used by OpenBook, the agenda list and the meeting page.

import React, { useEffect, useRef, useState } from "react";
import { ExternalLink, Trash2, Upload } from "lucide-react";
import {
  SlideOver,
  FormGrid,
  FormSection,
  Field,
  TextInput,
  TextArea,
  SelectInput,
  Checkbox,
  Btn,
  ConfirmDialog,
} from "@/components/ui/kit";
import { usePermissions } from "@/hooks/usePermissions";
import { uploadAgendaDocument } from "@/lib/agenda-documents";
import FileIcon from "@/components/agenda/FileIcon";

export interface AgendaSlideOverProps {
  /** Existing item to edit, or a partial `{ meeting_id }` / null to create one. */
  agenda: any;
  isOpen: boolean;
  onClose: () => void;
  onSave: (agenda: any) => void;
  /** Meeting for a new item when `agenda` doesn't carry one. If neither is set, a meeting picker is shown. */
  meetingId?: string | number;
}

interface Option {
  id: string | number;
  name: string;
}

interface AgendaDocument {
  id: string | number;
  name: string;
  file_url: string;
  file_type?: string;
  file_size?: number;
  uploaded_at?: string;
}

const toArray = (d: any): any[] => (Array.isArray(d) ? d : Array.isArray(d?.data) ? d.data : Array.isArray(d?.rows) ? d.rows : []);

async function getList(url: string): Promise<any[]> {
  try {
    const r = await fetch(url);
    return r.ok ? toArray(await r.json()) : [];
  } catch {
    return [];
  }
}

export function formatFileSize(bytes?: number) {
  if (!bytes) return "";
  const units = ["B", "KB", "MB", "GB"];
  const i = Math.min(units.length - 1, Math.floor(Math.log(bytes) / Math.log(1024)));
  return `${(bytes / Math.pow(1024, i)).toFixed(i ? 1 : 0)} ${units[i]}`;
}

const DEFAULT_STATUSES: Option[] = [
  { id: "draft", name: "draft" },
  { id: "pending", name: "pending" },
  { id: "approved", name: "approved" },
  { id: "deferred", name: "deferred" },
  { id: "rejected", name: "rejected" },
];

const emptyForm = {
  name: "",
  description: "",
  status: "draft",
  sort_order: "",
  presenter_id: "",
  ministry_id: "",
  meeting_id: "",
  cabinet_approval_required: false,
};

function plainDescription(d: unknown): string {
  if (typeof d !== "string") return "";
  if (d.startsWith("{")) {
    try {
      const p = JSON.parse(d);
      return typeof p === "string" ? p : p.text || "";
    } catch {
      /* plain text */
    }
  }
  return d;
}

const AgendaSlideOver: React.FC<AgendaSlideOverProps> = ({ agenda, isOpen, onClose, onSave, meetingId }) => {
  const { can } = usePermissions();
  const isEdit = !!agenda?.id;
  const fixedMeetingId = agenda?.meeting_id ?? meetingId ?? "";

  const [form, setForm] = useState(emptyForm);
  const [users, setUsers] = useState<Option[]>([]);
  const [ministries, setMinistries] = useState<Option[]>([]);
  const [statuses, setStatuses] = useState<Option[]>(DEFAULT_STATUSES);
  const [meetings, setMeetings] = useState<Option[]>([]);
  const [documents, setDocuments] = useState<AgendaDocument[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [upload, setUpload] = useState<{ name: string; progress: number } | null>(null);
  const [docToDelete, setDocToDelete] = useState<AgendaDocument | null>(null);
  const [deletingDoc, setDeletingDoc] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const canSave = isEdit ? can("agenda", "edit") : can("agenda", "create");

  // Load options and documents when the panel opens.
  useEffect(() => {
    if (!isOpen) return;
    let alive = true;
    (async () => {
      const [u, m, s, mt, docs] = await Promise.all([
        getList("/api/users"),
        getList("/api/ministries"),
        getList("/api/categories?type=decision_status"),
        fixedMeetingId ? Promise.resolve([]) : getList("/api/meetings"),
        agenda?.id ? getList(`/api/agenda/documents?agendaId=${agenda.id}`) : Promise.resolve([]),
      ]);
      if (!alive) return;
      setUsers(u.map((x) => ({ id: x.id, name: x.name || x.email })));
      setMinistries(m.map((x) => ({ id: x.id, name: x.name })));
      if (s.length) setStatuses(s.map((x) => ({ id: x.name, name: x.name })));
      setMeetings(
        mt.map((x) => ({
          id: x.id,
          name: `${x.name}${x.start_at ? ` (${String(x.start_at).slice(0, 10)})` : ""}`,
        })),
      );
      setDocuments(docs);
    })();
    return () => {
      alive = false;
    };
  }, [isOpen, agenda?.id, fixedMeetingId]);

  // Reset the form from the item each time the panel opens.
  useEffect(() => {
    if (!isOpen) return;
    setError(null);
    setUpload(null);
    if (agenda?.id) {
      setForm({
        name: agenda.name || agenda.title || "",
        description: plainDescription(agenda.description),
        status: agenda.status || "draft",
        sort_order: String(agenda.sort_order ?? agenda.order ?? ""),
        presenter_id: agenda.presenter_id ? String(agenda.presenter_id) : "",
        ministry_id: agenda.ministry_id ? String(agenda.ministry_id) : "",
        meeting_id: agenda.meeting_id ? String(agenda.meeting_id) : "",
        cabinet_approval_required: !!agenda.cabinet_approval_required,
      });
    } else {
      setForm({ ...emptyForm, meeting_id: fixedMeetingId ? String(fixedMeetingId) : "" });
    }
  }, [isOpen, agenda, fixedMeetingId]);

  const set = <K extends keyof typeof emptyForm>(k: K, v: (typeof emptyForm)[K]) => setForm((p) => ({ ...p, [k]: v }));

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!form.name.trim()) return setError("Agenda item title is required.");
    if (!form.meeting_id) return setError("Select the meeting this item belongs to.");

    setSaving(true);
    setError(null);
    try {
      const payload = {
        name: form.name.trim(),
        description: form.description.trim(),
        status: form.status || "draft",
        sort_order: form.sort_order ? Number(form.sort_order) : undefined,
        cabinet_approval_required: form.cabinet_approval_required,
        meeting_id: Number(form.meeting_id),
        presenter_id: form.presenter_id || null,
        ministry_id: form.ministry_id || null,
      };
      const res = await fetch(isEdit ? `/api/agenda/${agenda.id}` : "/api/agenda", {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(isEdit ? { ...payload, sort_order: payload.sort_order ?? agenda.sort_order ?? 1 } : payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.details || data.error || `Failed to save (HTTP ${res.status})`);
      onSave(data);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save agenda item");
    } finally {
      setSaving(false);
    }
  };

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !agenda?.id) return;
    setError(null);
    setUpload({ name: file.name, progress: 0 });
    try {
      const doc = await uploadAgendaDocument(file, agenda.id, {
        name: file.name,
        onProgress: (f) => setUpload({ name: file.name, progress: f }),
      });
      setDocuments((prev) => [doc as AgendaDocument, ...prev]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUpload(null);
    }
  };

  const confirmDeleteDoc = async () => {
    if (!docToDelete) return;
    setDeletingDoc(true);
    try {
      const res = await fetch(`/api/agenda/documents?documentId=${docToDelete.id}`, { method: "DELETE" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Failed to delete document");
      setDocuments((prev) => prev.filter((d) => d.id !== docToDelete.id));
      setDocToDelete(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete document");
      setDocToDelete(null);
    } finally {
      setDeletingDoc(false);
    }
  };

  const toOptions = (list: Option[]) => list.map((o) => ({ value: String(o.id), label: o.name }));

  return (
    <>
      <SlideOver
        open={isOpen}
        onClose={onClose}
        busy={saving || !!upload}
        size="lg"
        title={isEdit ? "Edit agenda item" : "New agenda item"}
        description={isEdit ? agenda.name || agenda.title : "Add an item to the meeting agenda."}
        footer={
          <>
            <Btn variant="outline" onClick={onClose} disabled={saving}>
              {canSave ? "Cancel" : "Close"}
            </Btn>
            {canSave && (
              <Btn onClick={() => handleSubmit()} loading={saving} disabled={!!upload}>
                {isEdit ? "Save changes" : "Add item"}
              </Btn>
            )}
          </>
        }
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="rounded-lg border border-error-200 bg-error-50 px-4 py-3 text-theme-sm text-error-600 dark:border-error-500/30 dark:bg-error-500/15 dark:text-error-400">
              {error}
            </div>
          )}

          <fieldset disabled={!canSave} className="space-y-6">
            <FormSection title="Item">
              <FormGrid>
                <Field label="Title" required>
                  <TextInput value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="Agenda item title" />
                </Field>
                {!fixedMeetingId && (
                  <Field label="Meeting" required>
                    <SelectInput
                      value={form.meeting_id}
                      onChange={(e) => set("meeting_id", e.target.value)}
                      placeholder="Select meeting"
                      options={toOptions(meetings)}
                    />
                  </Field>
                )}
                <Field label="Status" span={1}>
                  <SelectInput value={form.status} onChange={(e) => set("status", e.target.value)} options={toOptions(statuses)} />
                </Field>
                <Field label="Order" span={1} hint={isEdit ? undefined : "Leave blank to add at the end."}>
                  <TextInput
                    type="number"
                    min={1}
                    value={form.sort_order}
                    onChange={(e) => set("sort_order", e.target.value)}
                  />
                </Field>
                <Field label="Presenter" span={1}>
                  <SelectInput
                    value={form.presenter_id}
                    onChange={(e) => set("presenter_id", e.target.value)}
                    placeholder="No presenter"
                    options={toOptions(users)}
                  />
                </Field>
                <Field label="Ministry" span={1}>
                  <SelectInput
                    value={form.ministry_id}
                    onChange={(e) => set("ministry_id", e.target.value)}
                    placeholder="General"
                    options={toOptions(ministries)}
                  />
                </Field>
                <Field label="Description">
                  <TextArea rows={4} value={form.description} onChange={(e) => set("description", e.target.value)} />
                </Field>
                <div className="sm:col-span-2">
                  <Checkbox
                    checked={form.cabinet_approval_required}
                    onChange={(v) => set("cabinet_approval_required", v)}
                    label="Requires Cabinet approval"
                  />
                </div>
              </FormGrid>
            </FormSection>
          </fieldset>

          {isEdit && (
            <FormSection title="Documents" description="Papers attached to this agenda item.">
              <div className="space-y-3">
                {documents.length === 0 && !upload && (
                  <p className="text-theme-sm text-gray-500 dark:text-gray-400">No documents attached.</p>
                )}
                <ul className="divide-y divide-gray-100 rounded-lg border border-gray-200 dark:divide-gray-800 dark:border-gray-800">
                  {upload && (
                    <li className="px-3 py-2.5">
                      <div className="flex items-center justify-between gap-3 text-theme-sm">
                        <span className="truncate text-gray-700 dark:text-gray-300">{upload.name}</span>
                        <span className="shrink-0 text-gray-500">{Math.round(upload.progress * 100)}%</span>
                      </div>
                      <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
                        <div className="h-full bg-brand-500 transition-all" style={{ width: `${upload.progress * 100}%` }} />
                      </div>
                    </li>
                  )}
                  {documents.map((d) => (
                    <li key={d.id} className="flex items-center gap-3 px-3 py-2.5">
                      <FileIcon fileType={d.file_type} fileName={d.name} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-theme-sm text-gray-800 dark:text-white/90">{d.name}</p>
                        <p className="text-theme-xs text-gray-500 dark:text-gray-400">{formatFileSize(d.file_size)}</p>
                      </div>
                      <a
                        href={d.file_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={`Open ${d.name}`}
                        className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-800 dark:hover:bg-white/5 dark:hover:text-white"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </a>
                      {can("agenda", "delete") && (
                        <button
                          type="button"
                          onClick={() => setDocToDelete(d)}
                          aria-label={`Delete ${d.name}`}
                          className="rounded-lg p-2 text-gray-500 hover:bg-error-50 hover:text-error-600 dark:hover:bg-error-500/15"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </li>
                  ))}
                </ul>
                {can("agenda", "edit") && (
                  <>
                    <input ref={fileRef} type="file" className="hidden" onChange={handleFile} />
                    <Btn variant="outline" size="sm" onClick={() => fileRef.current?.click()} disabled={!!upload}>
                      <Upload className="h-4 w-4" />
                      Upload document
                    </Btn>
                  </>
                )}
              </div>
            </FormSection>
          )}
          <button type="submit" className="hidden" />
        </form>
      </SlideOver>

      <ConfirmDialog
        open={!!docToDelete}
        title="Delete document?"
        message={`"${docToDelete?.name}" will be removed from this agenda item. This cannot be undone.`}
        busy={deletingDoc}
        onConfirm={confirmDeleteDoc}
        onCancel={() => setDocToDelete(null)}
      />
    </>
  );
};

export default AgendaSlideOver;
