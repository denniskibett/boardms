// src/components/meetings/MeetingFormModal.tsx
// Create / edit a meeting in the right-side SlideOver.
"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ExternalLink } from "lucide-react";
import {
  SlideOver,
  FormGrid,
  FormSection,
  Field,
  TextInput,
  TextArea,
  SelectInput,
  Btn,
} from "@/components/ui/kit";

interface Category {
  id: string | number;
  name: string;
  type?: string;
  colour?: string;
}

interface ChairUser {
  id: string | number;
  name: string;
  email?: string;
  role?: string;
}

export interface MeetingFormData {
  name: string;
  type: string;
  start_at: string; // YYYY-MM-DD
  start_time: string; // HH:mm
  period: string;
  location: string;
  chair_id: string;
  status: string;
  description: string;
  colour: string;
}

export interface MeetingFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Meeting being edited; null/undefined to schedule a new one. */
  selectedEvent?: any;
  /** Pre-fill date (YYYY-MM-DD) for a new meeting, e.g. from a calendar click. */
  initialDate?: string;
  onSuccess: (meeting: any) => void;
  cachedData?: {
    locations: Category[];
    meetingTypes: Category[];
    meetingStatuses: Category[];
    colours?: Category[];
    users: ChairUser[];
    settings?: { timezone?: string; date_format?: string; time_format?: string };
  };
}

const COLOURS = [
  { value: "#3b82f6", label: "Blue" },
  { value: "#ef4444", label: "Red" },
  { value: "#10b981", label: "Green" },
  { value: "#f59e0b", label: "Amber" },
  { value: "#8b5cf6", label: "Purple" },
  { value: "#06b6d4", label: "Cyan" },
  { value: "#f97316", label: "Orange" },
  { value: "#84cc16", label: "Lime" },
];

const CHAIR_ROLES =
  "President,Deputy President,Cabinet Secretary,Principal Secretary,Prime Cabinet Secretary,Attorney General";

const pad = (n: number) => String(n).padStart(2, "0");

/** Splits a stored start_at ("YYYY-MM-DD HH:mm:ss" or ISO) into date + time without timezone shifting. */
function splitStart(value?: string): { date: string; time: string } {
  if (!value) return { date: "", time: "" };
  const m = value.match(/^(\d{4}-\d{2}-\d{2})[T ](\d{2}):(\d{2})/);
  if (m) return { date: m[1], time: `${m[2]}:${m[3]}` };
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return { date: "", time: "" };
  return { date: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`, time: `${pad(d.getHours())}:${pad(d.getMinutes())}` };
}

function emptyForm(date?: string): MeetingFormData {
  const now = new Date();
  const hour = (now.getHours() + (now.getMinutes() > 30 ? 1 : 0)) % 24;
  return {
    name: "",
    type: "",
    start_at: date || `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`,
    start_time: `${pad(hour)}:00`,
    period: "60",
    location: "",
    chair_id: "",
    status: "",
    description: "",
    colour: "#3b82f6",
  };
}

function formFromMeeting(m: any): MeetingFormData {
  const { date, time } = splitStart(m.start_at);
  return {
    name: m.name || "",
    type: m.type || "",
    start_at: date,
    start_time: time,
    period: m.period?.toString() || "60",
    location: m.location || "",
    chair_id: m.chair_id?.toString() || "",
    status: m.status || "",
    description: m.description || "",
    colour: m.colour || "#3b82f6",
  };
}

/** Suggests a chair from the meeting type (Cabinet → President, Committee → Deputy President, Special → Prime CS). */
function suggestChair(type: string, chairs: ChairUser[]): ChairUser | undefined {
  const t = type.toLowerCase();
  const role = (c: ChairUser) => (c.role || "").toLowerCase();
  if (t.includes("cabinet")) return chairs.find((c) => role(c).includes("president") && !role(c).includes("deputy"));
  if (t.includes("committee")) return chairs.find((c) => role(c).includes("deputy president"));
  if (t.includes("prime") || t.includes("special"))
    return chairs.find((c) => role(c).includes("prime cabinet") || role(c).includes("prime cs"));
  return undefined;
}

export default function MeetingFormModal({
  isOpen,
  onClose,
  selectedEvent,
  initialDate,
  onSuccess,
  cachedData,
}: MeetingFormModalProps) {
  const [form, setForm] = useState<MeetingFormData>(() => emptyForm(initialDate));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [touched, setTouched] = useState(false);

  // Options come from the caller; when it has none (e.g. the meeting page), load them on first open.
  const [loaded, setLoaded] = useState<MeetingFormModalProps["cachedData"] | null>(null);
  useEffect(() => {
    if (!isOpen || cachedData || loaded) return;
    const list = (d: any) => (Array.isArray(d) ? d : Array.isArray(d?.data) ? d.data : []);
    const get = (url: string) => fetch(url).then((r) => (r.ok ? r.json() : null)).catch(() => null);
    Promise.all([
      get("/api/categories?all=true"),
      get(`/api/users?roles=${encodeURIComponent(CHAIR_ROLES)}&orderBy=name&order=asc`),
      get("/api/system-settings"),
    ]).then(([cats, users, settings]) => {
      const c = list(cats);
      setLoaded({
        locations: c.filter((x: Category) => x.type === "location"),
        meetingTypes: c.filter((x: Category) => x.type === "meeting"),
        meetingStatuses: c.filter((x: Category) => x.type === "meeting_status"),
        users: list(users),
        settings: settings || undefined,
      });
    });
  }, [isOpen, cachedData, loaded]);
  const options = cachedData || loaded;

  const locations = options?.locations || [];
  const meetingTypes = options?.meetingTypes || [];
  const meetingStatuses = options?.meetingStatuses || [];
  const chairs = useMemo(() => options?.users || [], [options?.users]);
  const timezone = options?.settings?.timezone || "Africa/Nairobi";
  const isEdit = !!selectedEvent;

  // Reset the form each time the panel opens.
  useEffect(() => {
    if (!isOpen) return;
    setForm(selectedEvent ? formFromMeeting(selectedEvent) : emptyForm(initialDate));
    setError(null);
    setTouched(false);
  }, [isOpen, selectedEvent, initialDate]);

  const set = <K extends keyof MeetingFormData>(key: K, value: MeetingFormData[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const onTypeChange = (type: string) => {
    setForm((prev) => {
      const chair = !prev.chair_id || !isEdit ? suggestChair(type, chairs) : undefined;
      return { ...prev, type, chair_id: chair ? String(chair.id) : prev.chair_id };
    });
  };

  const missing = (k: keyof MeetingFormData) => touched && !String(form[k] || "").trim();

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setTouched(true);
    const required: (keyof MeetingFormData)[] = ["name", "type", "start_at", "start_time", "location", "status"];
    if (required.some((k) => !String(form[k] || "").trim())) {
      setError("Please fill in the required fields.");
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const payload = {
        name: form.name.trim(),
        type: form.type,
        start_at: `${form.start_at} ${form.start_time}:00`,
        period: parseInt(form.period) || 60,
        location: form.location,
        chair_id: form.chair_id ? parseInt(form.chair_id) : null,
        status: form.status,
        description: form.description.trim(),
        colour: form.colour,
      };
      const res = await fetch(isEdit ? `/api/meetings/${selectedEvent.id}` : "/api/meetings", {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.details || data.error || "Failed to save meeting");
      onSuccess(data);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save meeting");
    } finally {
      setSaving(false);
    }
  };

  return (
    <SlideOver
      open={isOpen}
      onClose={onClose}
      busy={saving}
      size="lg"
      title={isEdit ? "Edit meeting" : "Schedule meeting"}
      description={`Times are in ${timezone}.`}
      footer={
        <div className="flex w-full flex-wrap items-center justify-between gap-3">
          {isEdit ? (
            <Link
              href={`/meetings/${selectedEvent.id}`}
              className="inline-flex items-center gap-1.5 text-theme-sm font-medium text-brand-500 hover:text-brand-600"
            >
              <ExternalLink className="h-4 w-4" />
              Open meeting
            </Link>
          ) : (
            <span />
          )}
          <div className="flex gap-3">
            <Btn variant="outline" onClick={onClose} disabled={saving}>
              Cancel
            </Btn>
            <Btn onClick={() => handleSubmit()} loading={saving}>
              {isEdit ? "Save changes" : "Schedule meeting"}
            </Btn>
          </div>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="rounded-lg border border-error-200 bg-error-50 px-4 py-3 text-theme-sm text-error-600 dark:border-error-500/30 dark:bg-error-500/15 dark:text-error-400">
            {error}
          </div>
        )}

        <FormSection title="Details">
          <FormGrid>
            <Field label="Title" required error={missing("name") ? "Title is required" : null}>
              <TextInput value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="e.g. Full Cabinet Meeting" />
            </Field>
            <Field label="Meeting type" required span={1} error={missing("type") ? "Select a type" : null}>
              <SelectInput
                value={form.type}
                onChange={(e) => onTypeChange(e.target.value)}
                placeholder="Select type"
                options={meetingTypes.map((t) => ({ value: t.name, label: t.name }))}
              />
            </Field>
            <Field label="Status" required span={1} error={missing("status") ? "Select a status" : null}>
              <SelectInput
                value={form.status}
                onChange={(e) => set("status", e.target.value)}
                placeholder="Select status"
                options={meetingStatuses.map((s) => ({ value: s.name, label: s.name }))}
              />
            </Field>
          </FormGrid>
        </FormSection>

        <FormSection title="When and where">
          <FormGrid>
            <Field label="Date" required span={1} error={missing("start_at") ? "Pick a date" : null}>
              <TextInput type="date" value={form.start_at} onChange={(e) => set("start_at", e.target.value)} />
            </Field>
            <Field label="Start time" required span={1} error={missing("start_time") ? "Pick a time" : null}>
              <TextInput type="time" value={form.start_time} onChange={(e) => set("start_time", e.target.value)} />
            </Field>
            <Field label="Duration (minutes)" span={1}>
              <TextInput
                type="number"
                min={15}
                step={15}
                value={form.period}
                onChange={(e) => set("period", e.target.value)}
              />
            </Field>
            <Field label="Location" required span={1} error={missing("location") ? "Select a location" : null}>
              <SelectInput
                value={form.location}
                onChange={(e) => set("location", e.target.value)}
                placeholder="Select location"
                options={locations.map((l) => ({ value: l.name, label: l.name }))}
              />
            </Field>
            <Field label="Chair" hint={!isEdit && form.type ? "Suggested from the meeting type; change if needed." : undefined}>
              <SelectInput
                value={form.chair_id}
                onChange={(e) => set("chair_id", e.target.value)}
                placeholder="No chair"
                options={chairs.map((c) => ({ value: String(c.id), label: `${c.name}${c.role ? ` (${c.role})` : ""}` }))}
              />
            </Field>
          </FormGrid>
        </FormSection>

        <FormSection title="Calendar colour">
          <div className="flex flex-wrap gap-2">
            {COLOURS.map((c) => (
              <button
                key={c.value}
                type="button"
                onClick={() => set("colour", c.value)}
                aria-label={c.label}
                aria-pressed={form.colour === c.value}
                title={c.label}
                className={`h-8 w-8 rounded-full border-2 transition ${
                  form.colour === c.value ? "border-gray-800 ring-2 ring-offset-2 ring-gray-300 dark:border-white" : "border-transparent"
                }`}
                style={{ backgroundColor: c.value }}
              />
            ))}
          </div>
        </FormSection>

        <FormSection title="Notes">
          <Field label="Description">
            <TextArea
              rows={4}
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              placeholder="Purpose of the meeting"
            />
          </Field>
        </FormSection>
        <button type="submit" className="hidden" />
      </form>
    </SlideOver>
  );
}
