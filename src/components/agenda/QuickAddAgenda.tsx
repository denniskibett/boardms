"use client";
// Inline "add item by title" row for a meeting's agenda. Full details are edited in AgendaSlideOver.
import React, { useState } from "react";
import { Plus } from "lucide-react";
import { Btn, TextInput } from "@/components/ui/kit";
import { usePermissions } from "@/hooks/usePermissions";

interface QuickAddAgendaProps {
  meetingId: string;
  onAgendaAdded: (agenda?: any) => void;
}

const QuickAddAgenda: React.FC<QuickAddAgendaProps> = ({ meetingId, onAgendaAdded }) => {
  const { can } = usePermissions();
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!can("agenda", "create")) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return setError("Enter a title for the agenda item.");
    setSaving(true);
    setError(null);
    try {
      // The API appends the item at the end of the meeting's agenda when sort_order is omitted.
      const res = await fetch("/api/agenda", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), meeting_id: Number(meetingId), status: "draft" }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.details || data.error || "Failed to add agenda item");
      setName("");
      onAgendaAdded(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add agenda item");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-1.5">
      <div className="flex gap-2">
        <TextInput
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            if (error) setError(null);
          }}
          placeholder="Add an agenda item"
          aria-label="New agenda item title"
          disabled={saving}
        />
        <Btn type="submit" loading={saving} aria-label="Add agenda item">
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">Add</span>
        </Btn>
      </div>
      {error && <p className="text-theme-xs text-error-500">{error}</p>}
    </form>
  );
};

export default QuickAddAgenda;
