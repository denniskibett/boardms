// app/components/agendas/CreateAgendaForm.tsx
"use client";
import React, { useState } from "react";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import Button from "@/components/ui/button/Button";
import { useRouter } from "next/navigation";

interface AgendaFormData {
  name: string;
  description: string;
  status: "draft" | "published" | "finalized" | "pending" | "in_progress";
  sort_order: number;
  presenter_name: string;
  ministry_id: string;
  memo_id: string;
  cabinet_approval_required: boolean;
  meeting_id: string;
}

const ministries = [
  { id: "ministry-env", name: "Ministry of Environment" },
  { id: "ministry-transport", name: "Ministry of Transport" },
  { id: "ministry-energy", name: "Ministry of Energy" },
  { id: "ministry-finance", name: "Ministry of Finance" },
  { id: "ministry-health", name: "Ministry of Health" },
  { id: "", name: "No Ministry (General)" },
];

const meetings = [
  { id: "meeting-001", name: "Cabinet Meeting - January 2024", date: "2024-01-18" },
  { id: "meeting-002", name: "Infrastructure Committee - January 2024", date: "2024-01-20" },
  { id: "meeting-003", name: "Budget Review - Q1 2024", date: "2024-01-25" },
];

const statusOptions = [
  { id: "draft", name: "Draft" },
  { id: "pending", name: "Pending" },
  { id: "in_progress", name: "In Progress" },
  { id: "published", name: "Published" },
  { id: "finalized", name: "Finalized" },
];

export default function CreateAgendaForm() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<AgendaFormData>({
    name: "",
    description: "",
    status: "draft",
    sort_order: 1,
    presenter_name: "",
    ministry_id: "",
    memo_id: "",
    cabinet_approval_required: false,
    meeting_id: "",
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else if (name === 'sort_order') {
      setFormData(prev => ({ ...prev, [name]: parseInt(value) || 1 }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const response = await fetch('/api/agendas', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const newAgenda = await response.json();
        console.log("Agenda created:", newAgenda);
        
        // Redirect to agendas list or the new agenda
        router.push('/agendas');
        router.refresh();
      } else {
        console.error('Failed to create agenda');
        alert('Failed to create agenda. Please try again.');
      }
    } catch (error) {
      console.error('Error creating agenda:', error);
      alert('Error creating agenda. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xs border border-gray-200 dark:border-gray-700">
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          Create New Agenda Item
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Add a new agenda item to the meeting
        </p>
      </div>
      
      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        {/* Basic Information */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div>
            <Label htmlFor="name">
              Agenda Item Name <span className="text-error-500">*</span>
            </Label>
            <Input
              id="name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              placeholder="e.g., Opening Remarks, Budget Presentation"
              required
            />
          </div>

          <div>
            <Label htmlFor="meeting_id">
              Meeting <span className="text-error-500">*</span>
            </Label>
            <select
              id="meeting_id"
              name="meeting_id"
              value={formData.meeting_id}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              required
            >
              <option value="">Select meeting</option>
              {meetings.map(meeting => (
                <option key={meeting.id} value={meeting.id}>
                  {meeting.name} - {new Date(meeting.date).toLocaleDateString()}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div>
            <Label htmlFor="presenter_name">Presenter Name</Label>
            <Input
              id="presenter_name"
              name="presenter_name"
              value={formData.presenter_name}
              onChange={handleInputChange}
              placeholder="e.g., Minister of Environment"
            />
          </div>

          <div>
            <Label htmlFor="ministry_id">Ministry</Label>
            <select
              id="ministry_id"
              name="ministry_id"
              value={formData.ministry_id}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            >
              <option value="">Select ministry (optional)</option>
              {ministries.map(ministry => (
                <option key={ministry.id} value={ministry.id || ""}>
                  {ministry.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div>
            <Label htmlFor="memo_id">Memo ID</Label>
            <Input
              id="memo_id"
              name="memo_id"
              value={formData.memo_id}
              onChange={handleInputChange}
              placeholder="e.g., MEM-001, REF-2024-01"
            />
          </div>

          <div>
            <Label htmlFor="sort_order">Sort Order</Label>
            <Input
              id="sort_order"
              name="sort_order"
              type="number"
              value={formData.sort_order}
              onChange={handleInputChange}
              min="1"
              max="100"
            />
          </div>
        </div>

        <div>
          <Label htmlFor="description">Agenda Item Description</Label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            placeholder="Provide detailed description of the agenda item..."
          />
        </div>

        {/* Settings */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div>
            <Label htmlFor="status">Status</Label>
            <select
              id="status"
              name="status"
              value={formData.status}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            >
              {statusOptions.map(status => (
                <option key={status.id} value={status.id}>
                  {status.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center space-x-3 pt-6">
            <input
              id="cabinet_approval_required"
              name="cabinet_approval_required"
              type="checkbox"
              checked={formData.cabinet_approval_required}
              onChange={handleInputChange}
              className="h-4 w-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
            />
            <Label htmlFor="cabinet_approval_required" className="!mb-0">
              Requires Cabinet Approval
            </Label>
          </div>
        </div>

        {/* File Upload Section (Separate from agenda creation) */}
        <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
          <div className="mb-4">
            <h3 className="text-md font-medium text-gray-900 dark:text-white">
              Supporting Documents
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Files can be uploaded after creating the agenda item
            </p>
          </div>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center dark:border-gray-600">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              Upload supporting documents after creating the agenda item
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-4 pt-6 border-t border-gray-200 dark:border-gray-700">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Creating Agenda Item..." : "Create Agenda Item"}
          </Button>
        </div>
      </form>
    </div>
  );
}