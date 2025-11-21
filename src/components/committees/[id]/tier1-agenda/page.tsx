"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";

interface User {
  id: string;
  name: string;
}

interface Meeting {
  id: string;
  name: string;
  type: string;
  start_at: string;
  location: string;
  status: string;
}

interface AgendaItem {
  id: string;
  title: string;
  description?: string;
  status: string;
  presenter_id: string;
  meeting_id: string;
  meeting: Meeting;
}

interface Committee {
  id: string;
  name: string;
  description?: string;
}

export default function Tier1AgendaPage({ params }: { params: { id: string } }) {
  const committeeId = params.id;

  const [committee, setCommittee] = useState<Committee | null>(null);
  const [agendaItems, setAgendaItems] = useState<AgendaItem[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch Committee
  const fetchCommittee = async () => {
    const res = await fetch(`/api/committees/${committeeId}`);
    const data = await res.json();
    setCommittee(data);
  };

  // Fetch Tier 1 Agenda
  const fetchAgenda = async () => {
    const res = await fetch(`/api/committees/${committeeId}/tier1-agenda`);
    const data = await res.json();
    setAgendaItems(data);
  };

  // Fetch Users
  const fetchUsers = async () => {
    const res = await fetch("/api/users");
    const data = await res.json();
    setUsers(data);
  };

  useEffect(() => {
    Promise.all([fetchCommittee(), fetchAgenda(), fetchUsers()]).then(() =>
      setLoading(false)
    );
  }, []);

  const getPresenterName = (id: string) => {
    const user = users.find((u) => u.id === id);
    return user ? user.name : "Unknown";
  };

  const statusColors: Record<string, string> = {
    Pending: "bg-yellow-100 text-yellow-700",
    Approved: "bg-green-100 text-green-700",
    Rejected: "bg-red-100 text-red-700",
  };

  if (loading) {
    return <div className="p-6 text-gray-500">Loading...</div>;
  }

  return (
    <div className="p-6 space-y-8">
      {/* Committee Header */}
      <div className="border-b pb-4">
        <h1 className="text-2xl font-bold">{committee?.name}</h1>
        <p className="text-gray-600">{committee?.description}</p>
      </div>

      {/* Agenda List */}
      <div className="space-y-6">
        <h2 className="text-xl font-semibold">Tier 1 Agenda Items</h2>

        {agendaItems.length === 0 ? (
          <div className="p-4 bg-gray-100 rounded-lg text-gray-500">
            No agenda items found.
          </div>
        ) : (
          <div className="space-y-4">
            {agendaItems.map((agenda) => (
              <div
                key={agenda.id}
                className="p-4 border rounded-xl bg-white shadow-sm"
              >
                <div className="flex items-start justify-between">
                  <h3 className="text-lg font-semibold">{agenda.title}</h3>

                  <span
                    className={`px-3 py-1 rounded-full text-sm ${
                      statusColors[agenda.status] || "bg-gray-200 text-gray-700"
                    }`}
                  >
                    {agenda.status}
                  </span>
                </div>

                {agenda.description && (
                  <p className="text-gray-600 mt-1">{agenda.description}</p>
                )}

                {/* Presenter */}
                <p className="mt-3">
                  <span className="font-medium">Presenter:</span>{" "}
                  {getPresenterName(agenda.presenter_id)}
                </p>

                {/* Meeting Link */}
                <p className="mt-1">
                  <span className="font-medium">Meeting:</span>{" "}
                  <Link
                    href={`/meetings/${agenda.meeting_id}`}
                    className="text-blue-600 underline hover:text-blue-800"
                  >
                    {agenda.meeting?.name ?? agenda.meeting_id}
                  </Link>
                </p>

                {/* Meeting Details */}
                {agenda.meeting && (
                  <div className="mt-3 text-sm text-gray-500">
                    <p>
                      <strong>Type:</strong> {agenda.meeting.type}
                    </p>
                    <p>
                      <strong>Starts:</strong>{" "}
                      {new Date(agenda.meeting.start_at).toLocaleString()}
                    </p>
                    <p>
                      <strong>Location:</strong> {agenda.meeting.location}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
