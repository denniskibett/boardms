"use client";
import React, { useState, useEffect, useCallback } from "react";
import { X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

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

interface Memo {
  id: string;
  name: string;
  summary: string;
  body: string;
  memo_type: string;
  priority: string;
  status: string;
  ministry_id: number;
  state_department_id: number | null;
  agency_id: number | null;
  ministry_name: string;
  state_department_name: string | null;
  agency_name: string | null;
  created_by: number;
  creator_name: string;
  affected_entities?: string[];
}

interface EditMemoSlideOverProps {
  isOpen: boolean;
  onClose: () => void;
  onMemoUpdated: () => void;
  memoId: string | null;
}

const memoTypes = [
  { id: "cabinet", name: "Cabinet Memo" },
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

export default function EditMemoSlideOver({
  isOpen,
  onClose,
  onMemoUpdated,
  memoId,
}: EditMemoSlideOverProps) {
  const [formData, setFormData] = useState({
    name: "",
    summary: "",
    body: "",
    memo_type: "cabinet",
    priority: "medium",
    ministry_id: "",
    state_department_id: "",
    agency_id: "",
    status: "draft",
    attachments: [] as File[],
  });

  const [entities, setEntities] = useState({
    ministries: [] as Ministry[],
    stateDepartments: [] as StateDepartment[],
    agencies: [] as Agency[],
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [debugInfo, setDebugInfo] = useState<any>(null);

  // Fetch memo data when component opens
  useEffect(() => {
    if (isOpen && memoId) {
      fetchMemoData();
      fetchMinistries();
    }
  }, [isOpen, memoId]);

  const fetchMemoData = async () => {
    if (!memoId) return;
    
    try {
      setIsLoading(true);
      const response = await fetch(`/api/memos/${memoId}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch memo: ${response.status}`);
      }
      
      const memoData: Memo = await response.json();
      
      // Set form data with fetched memo data
      setFormData({
        name: memoData.name || "",
        summary: memoData.summary || "",
        body: memoData.body || "",
        memo_type: memoData.memo_type || "cabinet",
        priority: memoData.priority || "medium",
        ministry_id: memoData.ministry_id?.toString() || "",
        state_department_id: memoData.state_department_id?.toString() || "",
        agency_id: memoData.agency_id?.toString() || "",
        status: memoData.status || "draft",
        attachments: [],
      });

    } catch (error) {
      console.error("Error fetching memo data:", error);
      setDebugInfo({
        error: true,
        message: "Failed to load memo data",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchMinistries = async () => {
    try {
      const response = await fetch("/api/ministries");
      if (response.ok) {
        const ministries = await response.json();
        setEntities((prev) => ({ ...prev, ministries }));
      }
    } catch (error) {
      console.error("Error fetching ministries:", error);
    }
  };

  useEffect(() => {
    const fetchStateDepartments = async () => {
      if (formData.ministry_id) {
        try {
          const response = await fetch(
            `/api/state_departments?ministry_id=${formData.ministry_id}`
          );
          if (response.ok) {
            const stateDepartments = await response.json();
            setEntities((prev) => ({ ...prev, stateDepartments }));
          }
        } catch (error) {
          console.error("Error fetching state departments:", error);
        }
      } else {
        setEntities((prev) => ({ ...prev, stateDepartments: [] }));
      }
    };

    fetchStateDepartments();
  }, [formData.ministry_id]);

  useEffect(() => {
    const fetchAgencies = async () => {
      if (formData.state_department_id) {
        try {
          const response = await fetch(
            `/api/agencies?state_department_id=${formData.state_department_id}`
          );
          if (response.ok) {
            const agencies = await response.json();
            setEntities((prev) => ({ ...prev, agencies }));
          }
        } catch (error) {
          console.error("Error fetching agencies:", error);
        }
      } else {
        setEntities((prev) => ({ ...prev, agencies: [] }));
      }
    };

    fetchAgencies();
  }, [formData.state_department_id]);

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFormData((prev) => ({
        ...prev,
        attachments: Array.from(e.target.files || []),
      }));
    }
  };

    const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!memoId) return;

    setIsSubmitting(true);
    setDebugInfo(null);

    try {
        const submissionData = {
        name: formData.name,
        summary: formData.summary,
        body: formData.body,
        memo_type: formData.memo_type,
        priority: formData.priority,
        status: formData.status,
        ministry_id: formData.ministry_id,
        state_department_id: formData.state_department_id || null,
        agency_id: formData.agency_id || null,
        };

        console.log("🔄 Submitting update for memo:", memoId);
        console.log("📦 Submission data:", submissionData);

        const response = await fetch(`/api/memos/${memoId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(submissionData),
        });

        console.log("📡 Response status:", response.status);
        console.log("📡 Response ok:", response.ok);

        const result = await response.json();
        console.log("📨 Response data:", result);

        if (!response.ok) {
        console.error("❌ API Error:", result);
        throw new Error(result.error || `HTTP ${response.status}: Failed to update memo`);
        }

        console.log("✅ Memo updated successfully!");
        setDebugInfo({
        error: false,
        message: "Memo updated successfully!",
        });

        onMemoUpdated();
        setTimeout(onClose, 1500);

    } catch (error) {
        console.error("❌ Error updating memo:", error);
        setDebugInfo({
        error: true,
        message: error instanceof Error ? error.message : "Failed to update memo. Please check the console for details.",
        });
    } finally {
        setIsSubmitting(false);
    }
    };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Background Overlay */}
          <motion.div
            className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm z-40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Slide-Over Panel */}
          <motion.div
            className="fixed inset-y-0 right-0 max-w-2xl w-full bg-white dark:bg-gray-900 shadow-2xl z-50 flex flex-col"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 250, damping: 30 }}
          >
             <br /><br /><br />
            {/* Header */}
            <div className="flex justify-between items-center border-b border-gray-200 dark:border-gray-700 p-5">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Edit Memo
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Update memo details and documents
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Form Content */}
            <div className="flex-1 overflow-y-auto">
              <div className="p-6">
                {isLoading ? (
                  <div className="flex justify-center items-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    <span className="ml-3 text-gray-600 dark:text-gray-400">Loading memo data...</span>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Basic Information */}
                    <div>
                      <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Memo Title <span className="text-red-500">*</span>
                      </label>
                      <input
                        id="name"
                        name="name"
                        type="text"
                        value={formData.name}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                        placeholder="Enter memo title"
                        required
                      />
                    </div>

                    <div>
                      <label htmlFor="summary" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Executive Summary <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        id="summary"
                        name="summary"
                        value={formData.summary}
                        onChange={handleInputChange}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 resize-none"
                        placeholder="Provide a brief summary of the memo..."
                        required
                      />
                    </div>

                    <div>
                      <label htmlFor="body" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Detailed Content <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        id="body"
                        name="body"
                        value={formData.body}
                        onChange={handleInputChange}
                        rows={6}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 resize-none"
                        placeholder="Provide detailed content, background, and recommendations..."
                        required
                      />
                    </div>

                    {/* Memo Type and Priority */}
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div>
                        <label htmlFor="memo_type" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Memo Type <span className="text-red-500">*</span>
                        </label>
                        <select
                          id="memo_type"
                          name="memo_type"
                          value={formData.memo_type}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
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
                        <label htmlFor="priority" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Priority Level
                        </label>
                        <select
                          id="priority"
                          name="priority"
                          value={formData.priority}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        >
                          {priorityLevels.map(level => (
                            <option key={level.id} value={level.id}>
                              {level.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Status */}
                    <div>
                      <label htmlFor="status" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Status
                      </label>
                      <select
                        id="status"
                        name="status"
                        value={formData.status}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      >
                        <option value="draft">Draft</option>
                        <option value="submitted">Submitted</option>
                        <option value="under_review">Under Review</option>
                        <option value="approved">Approved</option>
                        <option value="rejected">Rejected</option>
                      </select>
                    </div>

                    {/* Cascading Dropdowns */}
                    <div className="space-y-4">
                      <div>
                        <label htmlFor="ministry_id" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Ministry <span className="text-red-500">*</span>
                        </label>
                        <select
                          id="ministry_id"
                          name="ministry_id"
                          value={formData.ministry_id}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
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
                        <label htmlFor="state_department_id" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          State Department
                        </label>
                        <select
                          id="state_department_id"
                          name="state_department_id"
                          value={formData.state_department_id}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
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
                        <label htmlFor="agency_id" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Agency
                        </label>
                        <select
                          id="agency_id"
                          name="agency_id"
                          value={formData.agency_id}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
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
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Attachments
                      </label>
                      <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center transition-colors hover:border-gray-400 dark:hover:border-gray-500">
                        <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                        <div className="mt-4">
                          <label htmlFor="attachments" className="cursor-pointer">
                            <span className="text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors">
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

                    {/* Success/Error Messages */}
                    {debugInfo && (
                      <div className={`p-4 rounded-lg border ${
                        debugInfo.error 
                          ? 'bg-red-50 border-red-200 text-red-800 dark:bg-red-900/20 dark:border-red-800 dark:text-red-200' 
                          : 'bg-green-50 border-green-200 text-green-800 dark:bg-green-900/20 dark:border-green-800 dark:text-green-200'
                      }`}>
                        <div className="flex items-center">
                          {debugInfo.error ? (
                            <svg className="h-5 w-5 text-red-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                            </svg>
                          ) : (
                            <svg className="h-5 w-5 text-green-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                          )}
                          <span className="text-sm font-medium">
                            {debugInfo.error ? 'Failed to update memo' : 'Memo updated successfully!'}
                          </span>
                        </div>
                      </div>
                    )}
                  </form>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="flex justify-end gap-3 border-t border-gray-200 dark:border-gray-700 p-5 bg-gray-50 dark:bg-gray-800">
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-md text-sm bg-white border border-gray-300 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600"
                disabled={isSubmitting || isLoading}
              >
                Cancel
              </button>
              <button
                type="submit"
                onClick={handleSubmit}
                disabled={isSubmitting || isLoading}
                className="px-4 py-2 rounded-md text-sm bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50"
              >
                {isSubmitting ? "Updating..." : "Update Memo"}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}