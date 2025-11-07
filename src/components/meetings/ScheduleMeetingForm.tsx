// app/components/meetings/ScheduleMeetingForm.tsx
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

const meetingTypes = [
  { id: "regular", name: "Regular Meeting" },
  { id: "special", name: "Special Session" },
  { id: "emergency", name: "Emergency Meeting" },
];

export default function ScheduleMeetingForm() {
  const [formData, setFormData] = useState({
    title: "",
    committee: "",
    type: "regular",
    date: "",
    time: "",
    duration: "60",
    location: "",
    description: "",
    agendaItems: [] as string[],
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    console.log("Meeting scheduled:", formData);
    setIsSubmitting(false);
    
    // Reset form
    setFormData({
      title: "",
      committee: "",
      type: "regular",
      date: "",
      time: "",
      duration: "60",
      location: "",
      description: "",
      agendaItems: [],
    });
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xs border border-gray-200 dark:border-gray-700">
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          Meeting Details
        </h2>
      </div>
      
      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        {/* Basic Information */}
        <div>
          <Label htmlFor="title">
            Meeting Title <span className="text-error-500">*</span>
          </Label>
          <Input
            id="title"
            name="title"
            value={formData.title}
            onChange={handleInputChange}
            placeholder="Enter meeting title"
            required
          />
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
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

          <div>
            <Label htmlFor="type">Meeting Type</Label>
            <select
              id="type"
              name="type"
              value={formData.type}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            >
              {meetingTypes.map(type => (
                <option key={type.id} value={type.id}>
                  {type.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <div>
            <Label htmlFor="date">
              Date <span className="text-error-500">*</span>
            </Label>
            <Input
              id="date"
              name="date"
              type="date"
              value={formData.date}
              onChange={handleInputChange}
              required
            />
          </div>

          <div>
            <Label htmlFor="time">
              Time <span className="text-error-500">*</span>
            </Label>
            <Input
              id="time"
              name="time"
              type="time"
              value={formData.time}
              onChange={handleInputChange}
              required
            />
          </div>

          <div>
            <Label htmlFor="duration">Duration (minutes)</Label>
            <select
              id="duration"
              name="duration"
              value={formData.duration}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            >
              <option value="30">30 minutes</option>
              <option value="60">1 hour</option>
              <option value="90">1.5 hours</option>
              <option value="120">2 hours</option>
              <option value="180">3 hours</option>
            </select>
          </div>
        </div>

        <div>
          <Label htmlFor="location">
            Location <span className="text-error-500">*</span>
          </Label>
          <Input
            id="location"
            name="location"
            value={formData.location}
            onChange={handleInputChange}
            placeholder="Enter meeting location"
            required
          />
        </div>

        <div>
          <Label htmlFor="description">Meeting Description</Label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            placeholder="Provide meeting description and objectives..."
          />
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
            {isSubmitting ? "Scheduling..." : "Schedule Meeting"}
          </Button>
        </div>
      </form>
    </div>
  );
}