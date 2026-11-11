// src/components/meetings/MeetingParticipants.tsx
// Participants of a meeting: list with RSVP, add people or whole groups, remove.
// Rendered inside the participants SlideOver on the meeting page.
"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Loader2, Search, UserPlus, Users } from "lucide-react";
import { ActionsMenu, Btn, Checkbox, ConfirmDialog, StatusBadge, TextInput, type Tone } from "@/components/ui/kit";
import { usePermissions } from "@/hooks/usePermissions";

interface PersonLite {
  id: string; // auth uuid
  auth_id: string;
  name: string;
  email: string;
  role?: string;
  image?: string | null;
}

interface Group {
  id: string;
  name: string;
  users?: PersonLite[];
}

export interface MeetingParticipant {
  id: string;
  meeting_id: string;
  user_id: string | null;
  group_id: string | null;
  rsvp_id: string | null;
  type: "individual" | "group";
  user?: PersonLite;
  group?: Group;
  rsvp?: { id: string; name: string; colour?: string } | null;
}

interface RSVP {
  id: string | number;
  name: string;
}

interface MeetingParticipantsProps {
  meetingId: number;
  /** Ignored: the component loads participants itself. Kept for compatibility. */
  participants?: any[];
  onParticipantsUpdate?: (participants: MeetingParticipant[]) => void;
  onRefresh?: () => void;
  compact?: boolean;
  settings?: unknown;
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function initials(name = "") {
  const parts = name.replace(",", " ").trim().split(/\s+/).filter(Boolean);
  return (parts.length > 1 ? parts[0][0] + parts[1][0] : name.charAt(0) || "?").toUpperCase();
}

function rsvpTone(name?: string | null): Tone {
  const n = (name || "").toLowerCase();
  if (/accept|attend|yes|confirm/.test(n) && !/not attend/.test(n)) return "success";
  if (/declin|not attend|^no$|absent/.test(n)) return "error";
  if (/tentative|maybe/.test(n)) return "warning";
  return "gray";
}

async function getJson(url: string) {
  const res = await fetch(url);
  const data = await res.json().catch(() => null);
  if (!res.ok) throw new Error(data?.error || `Request failed (HTTP ${res.status})`);
  return data;
}

function Avatar({ name, image }: { name: string; image?: string | null }) {
  const [broken, setBroken] = useState(false);
  const src = image && !broken ? (image.startsWith("http") || image.startsWith("/") ? image : `/meetings/${image}`) : null;
  return (
    <span className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-brand-50 text-theme-xs font-semibold text-brand-600 dark:bg-brand-500/15 dark:text-brand-400">
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt="" className="h-full w-full object-cover" onError={() => setBroken(true)} />
      ) : (
        initials(name)
      )}
    </span>
  );
}

const MeetingParticipants: React.FC<MeetingParticipantsProps> = ({ meetingId, onParticipantsUpdate, onRefresh }) => {
  const { can } = usePermissions();
  const canAdd = can("meetings", "create");
  const canEdit = can("meetings", "edit");
  const canRemove = can("meetings", "delete");

  const [participants, setParticipants] = useState<MeetingParticipant[]>([]);
  const [users, setUsers] = useState<PersonLite[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [rsvps, setRsvps] = useState<RSVP[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const [adding, setAdding] = useState(false);
  const [tab, setTab] = useState<"users" | "groups">("users");
  const [pickSearch, setPickSearch] = useState("");
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [selectedGroups, setSelectedGroups] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const [toRemove, setToRemove] = useState<MeetingParticipant | null>(null);
  const [removing, setRemoving] = useState(false);

  const publish = useCallback(
    (list: MeetingParticipant[]) => {
      setParticipants(list);
      onParticipantsUpdate?.(list);
    },
    [onParticipantsUpdate],
  );

  const loadParticipants = useCallback(async () => {
    const data = await getJson(`/api/meetings/${meetingId}/participants`);
    publish(Array.isArray(data) ? data : []);
  }, [meetingId, publish]);

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        await loadParticipants();
        const [rsvpData] = await Promise.all([getJson("/api/categories?type=rsvp_status").catch(() => [])]);
        if (alive) setRsvps(Array.isArray(rsvpData) ? rsvpData : []);
      } catch (e) {
        if (alive) setError(e instanceof Error ? e.message : "Failed to load participants");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [meetingId]);

  // People and groups are only needed when adding.
  useEffect(() => {
    if (!adding || users.length || groups.length) return;
    Promise.all([getJson("/api/users").catch(() => []), getJson("/api/groups").catch(() => [])]).then(([u, g]) => {
      const valid = (list: any[]) =>
        (Array.isArray(list) ? list : [])
          .filter((x) => UUID.test(x?.auth_id || ""))
          .map((x) => ({ ...x, id: x.auth_id }));
      setUsers(valid(u));
      setGroups((Array.isArray(g) ? g : []).map((gr: any) => ({ ...gr, users: valid(gr.users || []) })));
    });
  }, [adding, users.length, groups.length]);

  const existing = useMemo(() => new Set(participants.map((p) => p.user_id).filter(Boolean)), [participants]);

  const visible = useMemo(() => {
    const q = search.toLowerCase();
    return participants
      .filter((p) => !q || `${p.user?.name} ${p.user?.email} ${p.user?.role} ${p.group?.name}`.toLowerCase().includes(q))
      .sort((a, b) => (a.user?.name || a.group?.name || "").localeCompare(b.user?.name || b.group?.name || ""));
  }, [participants, search]);

  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    for (const p of participants) {
      const k = p.rsvp?.name || "No response";
      c[k] = (c[k] || 0) + 1;
    }
    return c;
  }, [participants]);

  const pickUsers = useMemo(() => {
    const q = pickSearch.toLowerCase();
    return users.filter((u) => !existing.has(u.auth_id) && (!q || `${u.name} ${u.email} ${u.role}`.toLowerCase().includes(q)));
  }, [users, existing, pickSearch]);

  const pickGroups = useMemo(() => {
    const q = pickSearch.toLowerCase();
    return groups.filter((g) => !q || g.name.toLowerCase().includes(q));
  }, [groups, pickSearch]);

  const toggle = (list: string[], id: string) => (list.includes(id) ? list.filter((x) => x !== id) : [...list, id]);

  const addSelected = async () => {
    const ids = new Set(selectedUsers);
    for (const gid of selectedGroups) groups.find((g) => g.id === gid)?.users?.forEach((u) => ids.add(u.auth_id));
    const userIds = [...ids].filter((id) => UUID.test(id) && !existing.has(id));
    if (!userIds.length) {
      setNotice("Everyone selected is already a participant.");
      return;
    }
    setSaving(true);
    setError(null);
    setNotice(null);
    try {
      const res = await fetch(`/api/meetings/${meetingId}/participants`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_ids: userIds, group_ids: [] }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error || "Failed to add participants");
      await loadParticipants();
      setNotice(`${Array.isArray(data) ? data.length : userIds.length} participant(s) added.`);
      setSelectedUsers([]);
      setSelectedGroups([]);
      setPickSearch("");
      setAdding(false);
      onRefresh?.();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to add participants");
    } finally {
      setSaving(false);
    }
  };

  const updateRsvp = async (p: MeetingParticipant, rsvpId: string) => {
    setError(null);
    try {
      const res = await fetch(`/api/meetings/${meetingId}/participants`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ participantId: p.id, rsvp_id: rsvpId || null }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error || "Failed to update RSVP");
      publish(participants.map((x) => (x.id === p.id ? { ...x, rsvp_id: rsvpId || null, rsvp: data?.rsvp ?? null } : x)));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to update RSVP");
    }
  };

  const confirmRemove = async () => {
    if (!toRemove) return;
    setRemoving(true);
    setError(null);
    try {
      const res = await fetch(`/api/meetings/${meetingId}/participants?participantId=${toRemove.id}`, { method: "DELETE" });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error || "Failed to remove participant");
      publish(participants.filter((x) => x.id !== toRemove.id));
      setToRemove(null);
      onRefresh?.();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to remove participant");
      setToRemove(null);
    } finally {
      setRemoving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-40 items-center justify-center text-theme-sm text-gray-500">
        <Loader2 className="mr-2 h-5 w-5 animate-spin text-brand-500" />
        Loading participants…
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {error && (
        <div className="rounded-lg border border-error-200 bg-error-50 px-4 py-3 text-theme-sm text-error-600 dark:border-error-500/30 dark:bg-error-500/15 dark:text-error-400">
          {error}
        </div>
      )}
      {notice && !error && (
        <div className="rounded-lg border border-success-200 bg-success-50 px-4 py-3 text-theme-sm text-success-700 dark:border-success-500/30 dark:bg-success-500/15 dark:text-success-500">
          {notice}
        </div>
      )}

      {/* Summary */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-theme-sm font-medium text-gray-800 dark:text-white/90">{participants.length} participants</span>
        {Object.entries(counts).map(([name, n]) => (
          <StatusBadge key={name} tone={rsvpTone(name)}>
            {name}: {n}
          </StatusBadge>
        ))}
      </div>

      {/* Add panel */}
      {canAdd &&
        (adding ? (
          <div className="space-y-3 rounded-xl border border-gray-200 p-4 dark:border-gray-800">
            <div className="flex items-center justify-between gap-3">
              <div className="inline-flex rounded-lg bg-gray-100 p-0.5 dark:bg-gray-900">
                {(["users", "groups"] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTab(t)}
                    className={`rounded-md px-3 py-1.5 text-theme-sm font-medium ${
                      tab === t ? "bg-white text-gray-900 shadow-theme-xs dark:bg-gray-800 dark:text-white" : "text-gray-500 dark:text-gray-400"
                    }`}
                  >
                    {t === "users" ? "People" : "Groups"}
                  </button>
                ))}
              </div>
              <span className="text-theme-xs text-gray-500 dark:text-gray-400">
                {selectedUsers.length + selectedGroups.length} selected
              </span>
            </div>
            <TextInput
              value={pickSearch}
              onChange={(e) => setPickSearch(e.target.value)}
              placeholder={tab === "users" ? "Search people" : "Search groups"}
              aria-label="Search"
            />
            <div className="custom-scrollbar max-h-72 space-y-2 overflow-y-auto pr-1">
              {tab === "users" &&
                (pickUsers.length ? (
                  pickUsers.map((u) => (
                    <Checkbox
                      key={u.auth_id}
                      checked={selectedUsers.includes(u.auth_id)}
                      onChange={() => setSelectedUsers((s) => toggle(s, u.auth_id))}
                      label={u.name}
                      description={[u.role, u.email].filter(Boolean).join(" · ")}
                    />
                  ))
                ) : (
                  <p className="py-4 text-center text-theme-sm text-gray-500">No people to add.</p>
                ))}
              {tab === "groups" &&
                (pickGroups.length ? (
                  pickGroups.map((g) => (
                    <Checkbox
                      key={g.id}
                      checked={selectedGroups.includes(g.id)}
                      onChange={() => setSelectedGroups((s) => toggle(s, g.id))}
                      label={g.name}
                      description={`${g.users?.length ?? 0} members`}
                    />
                  ))
                ) : (
                  <p className="py-4 text-center text-theme-sm text-gray-500">No groups found.</p>
                ))}
            </div>
            <div className="flex justify-end gap-2">
              <Btn variant="outline" size="sm" onClick={() => setAdding(false)} disabled={saving}>
                Cancel
              </Btn>
              <Btn size="sm" onClick={addSelected} loading={saving} disabled={!selectedUsers.length && !selectedGroups.length}>
                Add selected
              </Btn>
            </div>
          </div>
        ) : (
          <Btn
            variant="outline"
            onClick={() => {
              setNotice(null);
              setAdding(true);
            }}
          >
            <UserPlus className="h-4 w-4" />
            Add participants
          </Btn>
        ))}

      {/* List */}
      {participants.length > 0 && (
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <TextInput
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search participants"
            aria-label="Search participants"
            className="pl-9"
          />
        </div>
      )}

      {participants.length === 0 ? (
        <div className="py-10 text-center">
          <Users className="mx-auto mb-2 h-8 w-8 text-gray-300 dark:text-gray-600" />
          <p className="text-theme-sm text-gray-500 dark:text-gray-400">No participants yet.</p>
        </div>
      ) : (
        <ul className="divide-y divide-gray-100 rounded-xl border border-gray-200 dark:divide-gray-800 dark:border-gray-800">
          {visible.map((p) => {
            const name = p.user?.name || p.group?.name || "Unknown";
            return (
              <li key={p.id} className="flex flex-wrap items-center gap-3 px-3 py-3 sm:flex-nowrap">
                <Avatar name={name} image={p.user?.image} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-theme-sm font-medium text-gray-800 dark:text-white/90">{name}</p>
                  <p className="truncate text-theme-xs text-gray-500 dark:text-gray-400">
                    {p.type === "group" ? `Group · ${p.group?.users?.length ?? 0} members` : p.user?.role || p.user?.email}
                  </p>
                </div>
                {canEdit && rsvps.length > 0 ? (
                  <select
                    aria-label={`RSVP for ${name}`}
                    value={p.rsvp_id ?? ""}
                    onChange={(e) => updateRsvp(p, e.target.value)}
                    className="h-9 rounded-lg border border-gray-300 bg-transparent px-2 text-theme-xs text-gray-700 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"
                  >
                    <option value="">No response</option>
                    {rsvps.map((r) => (
                      <option key={r.id} value={String(r.id)}>
                        {r.name}
                      </option>
                    ))}
                  </select>
                ) : (
                  <StatusBadge tone={rsvpTone(p.rsvp?.name)}>{p.rsvp?.name || "No response"}</StatusBadge>
                )}
                {canRemove && <ActionsMenu items={[{ label: "Remove", danger: true, onClick: () => setToRemove(p) }]} />}
              </li>
            );
          })}
          {visible.length === 0 && <li className="px-3 py-6 text-center text-theme-sm text-gray-500">No matches.</li>}
        </ul>
      )}

      <ConfirmDialog
        open={!!toRemove}
        title="Remove participant?"
        message={`${toRemove?.user?.name || toRemove?.group?.name || "This participant"} will no longer be invited to this meeting.`}
        confirmLabel="Remove"
        busy={removing}
        onConfirm={confirmRemove}
        onCancel={() => setToRemove(null)}
      />
    </div>
  );
};

export default MeetingParticipants;
