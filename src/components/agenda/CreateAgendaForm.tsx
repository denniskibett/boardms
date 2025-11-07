"use client";
import React, { useState } from "react";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import Button from "@/components/ui/button/Button";

const committees = [
  { id: "infrastructure", name: "Infrastructure & Energy Committee" },
  { id: "finance", name: "Budget & Finance Committee" },
  { id: "social", name: "Social Services Committee" },
  { id: "security", name: "Security & Administration Committee" },
  { id: "cabinet", name: "Full Cabinet Meeting" },
];

const agendaTypes = [
  { id: "tier1", name: "Committee Agenda" },
  { id: "tier2", name: "Cabinet Agenda" },
];

export default function CreateAgendaForm() {
  const [formData, setFormData] = useState({
    title: "",
    committee: "",
    type: "tier1",
    meetingDate: "",
    description: "",
    agendaItems: [] as Array<{
      id: string;
      title: string;
      memoId: string;
      presenter: string;
      duration: number;
      documents: File[];
    }>,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const addAgendaItem = () => {
    setFormData(prev => ({
      ...prev,
      agendaItems: [
        ...prev.agendaItems,
        {
          id: Date.now().toString(),
          title: "",
          memoId: "",
          presenter: "",
          duration: 15,
          documents: [],
        }
      ]
    }));
  };

  const updateAgendaItem = (index: number, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      agendaItems: prev.agendaItems.map((item, i) => 
        i === index ? { ...item, [field]: value } : item
      )
    }));
  };

  const removeAgendaItem = (index: number) => {
    setFormData(prev => ({
      ...prev,
      agendaItems: prev.agendaItems.filter((_, i) => i !== index)
    }));
  };

  const handleFileUpload = (index: number, files: FileList) => {
    updateAgendaItem(index, "documents", Array.from(files));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    console.log("Agenda created:", formData);
    setIsSubmitting(false);
    
    // Reset form
    setFormData({
      title: "",
      committee: "",
      type: "tier1",
      meetingDate: "",
      description: "",
      agendaItems: [],
    });
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xs border border-gray-200 dark:border-gray-700">
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          Agenda Details
        </h2>
      </div>
      
      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        {/* Basic Information */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div>
            <Label htmlFor="title">
              Agenda Title <span className="text-error-500">*</span>
            </Label>
            <Input
              id="title"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              placeholder="Enter agenda title"
              required
            />
          </div>

          <div>
            <Label htmlFor="committee">
              Committee <span className="text-error-500">*</span>
            </Label>
            <select
              id="committee"
              name="committee"
              value={formData.committee}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              required
            >
              <option value="">Select committee</option>
              {committees.map(committee => (
                <option key={committee.id} value={committee.id}>
                  {committee.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div>
            <Label htmlFor="type">Agenda Type</Label>
            <select
              id="type"
              name="type"
              value={formData.type}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            >
              {agendaTypes.map(type => (
                <option key={type.id} value={type.id}>
                  {type.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <Label htmlFor="meetingDate">
              Meeting Date <span className="text-error-500">*</span>
            </Label>
            <Input
              id="meetingDate"
              name="meetingDate"
              type="date"
              value={formData.meetingDate}
              onChange={handleInputChange}
              required
            />
          </div>
        </div>

        <div>
          <Label htmlFor="description">Agenda Description</Label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            placeholder="Provide agenda description and objectives..."
          />
        </div>

        {/* Agenda Items */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <Label>Agenda Items</Label>
            <button
              type="button"
              onClick={addAgendaItem}
              className="rounded-lg bg-brand-500 px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-600"
            >
              Add Item
            </button>
          </div>

          <div className="space-y-4">
            {formData.agendaItems.map((item, index) => (
              <div key={item.id} className="border border-gray-200 rounded-lg p-4 dark:border-gray-700">
                <div className="flex items-start justify-between mb-4">
                  <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                    Agenda Item {index + 1}
                  </h4>
                  <button
                    type="button"
                    onClick={() => removeAgendaItem(index)}
                    className="text-red-500 hover:text-red-700"
                  >
                    Remove
                  </button>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <Label htmlFor={`item-title-${index}`}>Item Title</Label>
                    <Input
                      id={`item-title-${index}`}
                      value={item.title}
                      onChange={(e) => updateAgendaItem(index, "title", e.target.value)}
                      placeholder="Enter item title"
                    />
                  </div>
                  <div>
                    <Label htmlFor={`memo-id-${index}`}>Memo ID</Label>
                    <Input
                      id={`memo-id-${index}`}
                      value={item.memoId}
                      onChange={(e) => updateAgendaItem(index, "memoId", e.target.value)}
                      placeholder="e.g., MEM-001"
                    />
                  </div>
                  <div>
                    <Label htmlFor={`presenter-${index}`}>Presenter</Label>
                    <Input
                      id={`presenter-${index}`}
                      value={item.presenter}
                      onChange={(e) => updateAgendaItem(index, "presenter", e.target.value)}
                      placeholder="Enter presenter name"
                    />
                  </div>
                  <div>
                    <Label htmlFor={`duration-${index}`}>Duration (minutes)</Label>
                    <Input
                      id={`duration-${index}`}
                      type="number"
                      value={item.duration}
                      onChange={(e) => updateAgendaItem(index, "duration", parseInt(e.target.value))}
                      min="5"
                      max="120"
                    />
                  </div>
                </div>

                <div className="mt-4">
                  <Label>Supporting Documents</Label>
                  <input
                    type="file"
                    multiple
                    onChange={(e) => handleFileUpload(index, e.target.files!)}
                    className="mt-2 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-medium file:bg-brand-50 file:text-brand-700 hover:file:bg-brand-100"
                  />
                  {item.documents.length > 0 && (
                    <div className="mt-2 text-sm text-gray-500">
                      {item.documents.length} file(s) selected
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {formData.agendaItems.length === 0 && (
            <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg dark:border-gray-600">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                No agenda items added yet
              </p>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-4 pt-6 border-t border-gray-200 dark:border-gray-700">
          <Button
            type="button"
            variant="outline"
            onClick={() => window.history.back()}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Creating Agenda..." : "Create Agenda"}
          </Button>
        </div>
      </form>
    </div>
  );
}