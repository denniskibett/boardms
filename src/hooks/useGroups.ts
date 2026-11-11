"use client";

import { useCallback, useEffect, useState } from "react";

export interface GroupMember {
  id: string; // auth uuid
  auth_id: string;
  name: string;
  email: string;
  role?: string;
  image?: string | null;
}

export interface Group {
  id: string;
  name: string;
  users: GroupMember[];
}

/** Participant groups. `user_ids` are users' auth uuids. */
export function useGroups() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const send = async (url: string, method: string, body?: unknown) => {
    const res = await fetch(url, {
      method,
      headers: body ? { "Content-Type": "application/json" } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || `Request failed (HTTP ${res.status})`);
    return data;
  };

  const fetchGroups = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const data = await send("/api/groups", "GET");
      setGroups(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load groups");
    } finally {
      setLoading(false);
    }
  }, []);

  const run = async (fn: () => Promise<unknown>, fallback: string) => {
    try {
      setLoading(true);
      setError("");
      await fn();
      await fetchGroups();
    } catch (err) {
      setError(err instanceof Error ? err.message : fallback);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const createGroup = (payload: { name: string; user_ids?: string[] }) =>
    run(() => send("/api/groups", "POST", payload), "Failed to create group");

  const updateGroup = (id: number | string, payload: { name: string; user_ids?: string[] }) =>
    run(() => send(`/api/groups/${id}`, "PUT", payload), "Failed to update group");

  const deleteGroup = (id: number | string) =>
    run(() => send(`/api/groups/${id}`, "DELETE"), "Failed to delete group");

  useEffect(() => {
    fetchGroups();
  }, [fetchGroups]);

  return { groups, loading, error, createGroup, updateGroup, deleteGroup, reload: fetchGroups };
}
