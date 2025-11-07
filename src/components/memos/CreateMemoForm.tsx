"use client";
import React, { useState, useEffect } from "react";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import Button from "@/components/ui/button/Button";
import { DocumentIcon, UploadIcon } from "@/icons";

// Types for our entities
interface Ministry {
  id: number;
  name: string;
  acronym: string;
}

interface StateDepartment {
  id: number;
  name: string;
  ministry_id: number;
}

interface Agency {
  id: number;
  name: string;
  ministry_id: number;
  state_department_id: number;
}

const memoTypes = [
  { id: "cabinet", name: "Cabinet Committee" },
  { id: "interior", name: "Interior Memo" },
  { id: "treasury", name: "Treasury Memo" },
  { id: "presidential", name: "Presidential Memo" },
];

const priorityLevels = [
  { id: "low", name: "Low" },
  { id: "medium", name: "Medium" },
  { id: "high", name: "High" },
  { id: "urgent", name: "Urgent" },
];

export default function CreateMemoForm() {
  const [formData, setFormData] = useState({
    name: "",
    summary: "",
    body: "",
    memo_type: "cabinet",
    priority: "medium",
    ministry_id: "",
    state_department_id: "",
    agency_id: "",
    attachments: [] as File[],
  });

  const [entities, setEntities] = useState({
    ministries: [] as Ministry[],
    stateDepartments: [] as StateDepartment[],
    agencies: [] as Agency[],
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [debugInfo, setDebugInfo] = useState<any>(null);

  // Fetch ministries on component mount
  useEffect(() => {
    const fetchMinistries = async () => {
      try {
        const response = await fetch('/api/ministries');
        if (response.ok) {
          const ministries = await response.json();
          setEntities(prev => ({ ...prev, ministries }));
        }
      } catch (error) {
        console.error('Error fetching ministries:', error);
      }
    };
    
    fetchMinistries();
  }, []);

  // Fetch state departments when ministry is selected
  useEffect(() => {
    const fetchStateDepartments = async () => {
      if (formData.ministry_id) {
        try {
          const response = await fetch(`/api/state_departments?ministry_id=${formData.ministry_id}`);
          if (response.ok) {
            const stateDepartments = await response.json();
            setEntities(prev => ({ ...prev, stateDepartments }));
            
            // Reset dependent fields
            setFormData(prev => ({
              ...prev, 
              state_department_id: "",
              agency_id: ""
            }));
          }
        } catch (error) {
          console.error('Error fetching state departments:', error);
        }
      } else {
        setEntities(prev => ({ ...prev, stateDepartments: [] }));
      }
    };

    fetchStateDepartments();
  }, [formData.ministry_id]);

  // Fetch agencies when state department is selected
  useEffect(() => {
    const fetchAgencies = async () => {
      if (formData.state_department_id) {
        try {
          const response = await fetch(`/api/agencies?state_department_id=${formData.state_department_id}`);
          if (response.ok) {
            const agencies = await response.json();
            setEntities(prev => ({ ...prev, agencies }));
            
            // Reset agency field
            setFormData(prev => ({ ...prev, agency_id: "" }));
          }
        } catch (error) {
          console.error('Error fetching agencies:', error);
        }
      } else {
        setEntities(prev => ({ ...prev, agencies: [] }));
      }
    };

    fetchAgencies();
  }, [formData.state_department_id]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFormData(prev => ({
        ...prev,
        attachments: Array.from(e.target.files || [])
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      // Prepare form data for submission
      const submissionData = {
        name: formData.name,
        summary: formData.summary,
        body: formData.body,
        memo_type: formData.memo_type,
        priority: formData.priority,
        ministry_id: formData.ministry_id,
        state_department_id: formData.state_department_id || null,
        agency_id: formData.agency_id || null,
        status: "draft", // or "submitted" based on your workflow
      };

      console.log("Submitting memo data:", submissionData);
      
      const response = await fetch('/api/memos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submissionData),
      });

      const result = await response.json();
      
      if (!response.ok) {
        // Capture detailed error information
        setDebugInfo({
          error: true,
          status: response.status,
          statusText: response.statusText,
          serverError: result.error,
          submittedData: submissionData,
          timestamp: new Date().toISOString(),
        });
        throw new Error(result.error || 'Failed to create memo');
      }

      // Success - capture debug info
      setDebugInfo({
        error: false,
        status: response.status,
        createdMemo: result,
        submittedData: submissionData,
        timestamp: new Date().toISOString(),
      });

      console.log("Memo created successfully:", result);
      
      // TODO: Handle file uploads here if needed
      if (formData.attachments.length > 0) {
        console.log("Files to upload:", formData.attachments);
        // Implement file upload logic here
      }

      // Reset form
      setFormData({
        name: "",
        summary: "",
        body: "",
        memo_type: "cabinet",
        priority: "medium",
        ministry_id: "",
        state_department_id: "",
        agency_id: "",
        attachments: [],
      });

    } catch (error) {
      console.error("Error creating memo:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xs border border-gray-200 dark:border-gray-700">
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          Memo Details
        </h2>
      </div>
      
      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        {/* Basic Information */}
        <div>
          <Label htmlFor="name">
            Memo Title <span className="text-error-500">*</span>
          </Label>
          <Input
            id="name"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            placeholder="Enter memo title"
            required
          />
        </div>

        <div>
          <Label htmlFor="summary">
            Executive Summary <span className="text-error-500">*</span>
          </Label>
          <textarea
            id="summary"
            name="summary"
            value={formData.summary}
            onChange={handleInputChange}
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            placeholder="Provide a brief summary of the memo..."
            required
          />
        </div>

        <div>
          <Label htmlFor="body">
            Detailed Content <span className="text-error-500">*</span>
          </Label>
          <textarea
            id="body"
            name="body"
            value={formData.body}
            onChange={handleInputChange}
            rows={8}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            placeholder="Provide detailed content, background, and recommendations..."
            required
          />
        </div>

        {/* Memo Type and Priority */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div>
            <Label htmlFor="memo_type">
              Memo Type <span className="text-error-500">*</span>
            </Label>
            <select
              id="memo_type"
              name="memo_type"
              value={formData.memo_type}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              required
            >
              {memoTypes.map(type => (
                <option key={type.id} value={type.id}>
                  {type.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <Label htmlFor="priority">Priority Level</Label>
            <select
              id="priority"
              name="priority"
              value={formData.priority}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            >
              {priorityLevels.map(level => (
                <option key={level.id} value={level.id}>
                  {level.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Cascading Dropdowns */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <div>
            <Label htmlFor="ministry_id">
              Ministry <span className="text-error-500">*</span>
            </Label>
            <select
              id="ministry_id"
              name="ministry_id"
              value={formData.ministry_id}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              required
            >
              <option value="">Select a ministry</option>
              {entities.ministries.map(ministry => (
                <option key={ministry.id} value={ministry.id}>
                  {ministry.name} ({ministry.acronym})
                </option>
              ))}
            </select>
          </div>

          <div>
            <Label htmlFor="state_department_id">State Department</Label>
            <select
              id="state_department_id"
              name="state_department_id"
              value={formData.state_department_id}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              disabled={!formData.ministry_id}
            >
              <option value="">Select state department</option>
              {entities.stateDepartments.map(dept => (
                <option key={dept.id} value={dept.id}>
                  {dept.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <Label htmlFor="agency_id">Agency</Label>
            <select
              id="agency_id"
              name="agency_id"
              value={formData.agency_id}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              disabled={!formData.state_department_id}
            >
              <option value="">Select agency</option>
              {entities.agencies.map(agency => (
                <option key={agency.id} value={agency.id}>
                  {agency.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* File Attachments */}
        <div>
          <Label>Attachments</Label>
          <div className="mt-2 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center">
            <UploadIcon className="mx-auto h-12 w-12 text-gray-400" />
            <div className="mt-4">
              <label htmlFor="attachments" className="cursor-pointer">
                <span className="text-sm font-medium text-brand-500 hover:text-brand-600">
                  Upload files
                </span>
                <input
                  id="attachments"
                  name="attachments"
                  type="file"
                  multiple
                  onChange={handleFileChange}
                  className="sr-only"
                />
              </label>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                PDF, DOC, DOCX, Excel, Images up to 10MB each
              </p>
            </div>
            {formData.attachments.length > 0 && (
              <div className="mt-4">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {formData.attachments.length} file(s) selected
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Debug Information */}
        {debugInfo && (
          <div className={`p-4 rounded-lg border ${
            debugInfo.error 
              ? 'bg-error-50 border-error-200 text-error-800' 
              : 'bg-success-50 border-success-200 text-success-800'
          }`}>
            <h3 className="font-semibold mb-2">
              {debugInfo.error ? 'Submission Failed' : 'Submission Successful'}
            </h3>
            <pre className="text-xs whitespace-pre-wrap">
              {JSON.stringify(debugInfo, null, 2)}
            </pre>
          </div>
        )}

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
            {isSubmitting ? "Creating Memo..." : "Create Memo"}
          </Button>
        </div>
      </form>
    </div>
  );
}