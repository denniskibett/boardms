"use client";

import { useState, useEffect } from "react";

export function useGroups() {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  /* ----------------------------- FETCH ALL GROUPS ----------------------------- */
  const fetchGroups = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/groups");
      const data = await res.json();
      setGroups(data);
    } catch (err) {
      setError("Failed to load groups");
    } finally {
      setLoading(false);
    }
  };

  /* ----------------------------- CREATE GROUP ----------------------------- */
  const createGroup = async (payload: { name: string; users: any[] }) => {
    try {
      setLoading(true);
      const res = await fetch("/api/groups", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      await res.json();
      await fetchGroups();
    } catch (err) {
      setError("Failed to create group");
    } finally {
      setLoading(false);
    }
  };

  /* ----------------------------- UPDATE GROUP ----------------------------- */
  const updateGroup = async (
    id: number,
    payload: { name: string; users: any[] }
  ) => {
    try {
      setLoading(true);
      const res = await fetch(`/api/groups/${id}`, {
        method: "PUT",
        body: JSON.stringify(payload),
      });
      await res.json();
      await fetchGroups();
    } catch (err) {
      setError("Failed to update group");
    } finally {
      setLoading(false);
    }
  };

  /* ----------------------------- DELETE GROUP ----------------------------- */
  const deleteGroup = async (id: number) => {
    try {
      setLoading(true);
      await fetch(`/api/groups/${id}`, {
        method: "DELETE",
      });
      await fetchGroups();
    } catch (err) {
      setError("Failed to delete group");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGroups();
  }, []);

  return {
    groups,
    loading,
    error,
    createGroup,
    updateGroup,
    deleteGroup,
    reload: fetchGroups,
  };
}
