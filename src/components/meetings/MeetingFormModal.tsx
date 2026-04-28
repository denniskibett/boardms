// src/components/meetings/MeetingFormModal.tsx
"use client";
import React, { useState, useEffect } from "react";
import {
  MapPin,
  CheckCircle,
  Clock,
  Loader2,
  X,
  Users,
  FileText,
  Tag,
  Globe,
  Eye,
  ExternalLink,
  Calendar as CalendarIcon
} from "lucide-react";
import Link from "next/link";

interface Category {
  id: string;
  name: string;
  type: string;
  colour?: string;
}

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface MeetingFormData {
  name: string;
  type: string;
  start_at: string;
  start_time: string;
  period: string;
  location: string;
  chair_id: string;
  status: string;
  description: string;
  colour: string;
}

interface MeetingFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  formData: MeetingFormData;
  setFormData: React.Dispatch<React.SetStateAction<MeetingFormData>>;
  selectedEvent: any;
  onSuccess: () => void;
  cachedData?: {
    locations: Category[];
    meetingTypes: Category[];
    meetingStatuses: Category[];
    colours: Category[];
    users: User[];
    settings: {
      timezone: string;
      date_format: string;
      time_format: '12' | '24';
    };
  };
}

export default function MeetingFormModal({
  isOpen,
  onClose,
  formData,
  setFormData,
  selectedEvent,
  onSuccess,
  cachedData
}: MeetingFormModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  
  // Use cached data directly - no loading state needed!
  const locations = cachedData?.locations || [];
  const meetingTypes = cachedData?.meetingTypes || [];
  const meetingStatuses = cachedData?.meetingStatuses || [];
  const colours = cachedData?.colours || [];
  const chairs = cachedData?.users || [];
  const systemSettings = cachedData?.settings || {
    timezone: 'Africa/Nairobi',
    date_format: 'DD/MM/YYYY',
    time_format: '24' as const
  };

  // Auto-assign chair based on meeting type
  useEffect(() => {
    if (!formData.type || !chairs.length) return;
    
    const typeLower = formData.type.toLowerCase();
    
    // Cabinet meetings → President
    if (typeLower.includes('cabinet')) {
      const president = chairs.find((chair: User) => 
        chair.role.toLowerCase().includes('president') && 
        !chair.role.toLowerCase().includes('deputy')
      );
      if (president && president.id !== formData.chair_id) {
        setFormData((prev: MeetingFormData) => ({ ...prev, chair_id: president.id }));
        console.log('✅ Auto-assigned President for Cabinet meeting');
      }
    } 
    // Committee meetings → Deputy President
    else if (typeLower.includes('committee')) {
      const deputyPresident = chairs.find((chair: User) => 
        chair.role.toLowerCase().includes('deputy president')
      );
      if (deputyPresident && deputyPresident.id !== formData.chair_id) {
        setFormData((prev: MeetingFormData) => ({ ...prev, chair_id: deputyPresident.id }));
        console.log('✅ Auto-assigned Deputy President for Committee meeting');
      }
    }
    // Special sessions → Prime CS
    else if (typeLower.includes('prime') || typeLower.includes('special')) {
      const primeCs = chairs.find((chair: User) => 
        chair.role.toLowerCase().includes('prime cabinet') ||
        chair.role.toLowerCase().includes('prime cs')
      );
      if (primeCs && primeCs.id !== formData.chair_id) {
        setFormData((prev: MeetingFormData) => ({ ...prev, chair_id: primeCs.id }));
        console.log('✅ Auto-assigned Prime CS for special meeting');
      }
    }
  }, [formData.type, chairs, setFormData, formData.chair_id]);

  const handleInputChange = (field: keyof MeetingFormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    // Clear any previous errors when user starts typing
    if (localError) setLocalError(null);
  };

  const validateForm = () => {
    const required = ['name', 'type', 'start_at', 'start_time', 'location', 'status'];
    const missing = required.filter(field => !formData[field as keyof MeetingFormData]);
    
    if (missing.length > 0) {
      setLocalError(`Missing required fields: ${missing.join(', ')}`);
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    
    setIsLoading(true);
    setLocalError(null);
    
    try {
      // WYSIWYG - Store exactly what the user selected
      const dateTimeString = `${formData.start_at} ${formData.start_time}:00`;
      
      const meetingData = {
        name: formData.name.trim(),
        type: formData.type,
        start_at: dateTimeString,
        period: parseInt(formData.period) || 60,
        location: formData.location,
        chair_id: formData.chair_id ? parseInt(formData.chair_id) : null,
        status: formData.status,
        description: formData.description?.trim() || '',
        colour: formData.colour,
        timezone: systemSettings.timezone
      };

      console.log('📤 Submitting meeting:', {
        ...meetingData,
        date: formData.start_at,
        time: formData.start_time
      });

      const url = selectedEvent 
        ? `/api/meetings?id=${selectedEvent.id}` 
        : '/api/meetings';
      const method = selectedEvent ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(meetingData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save meeting');
      }

      const result = await response.json();
      console.log('✅ Meeting saved:', result);
      
      onSuccess();
      onClose();
    } catch (error) {
      console.error('❌ Error saving meeting:', error);
      setLocalError(error instanceof Error ? error.message : 'Failed to save meeting');
    } finally {
      setIsLoading(false);
    }
  };

  // Format date for display based on system settings
  const formatDisplayDate = (dateStr: string) => {
    if (!dateStr) return '';
    const [year, month, day] = dateStr.split('-');
    
    switch(systemSettings.date_format) {
      case 'DD/MM/YYYY':
        return `${day}/${month}/${year}`;
      case 'MM/DD/YYYY':
        return `${month}/${day}/${year}`;
      case 'YYYY-MM-DD':
      default:
        return dateStr;
    }
  };

  // Render timezone and date format info
  const renderSystemInfo = () => (
    <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
      <div className="flex items-center">
        <Globe className="h-3 w-3 mr-1" />
        <span>Timezone: <strong>{systemSettings.timezone}</strong></span>
      </div>
      <div className="flex items-center gap-2">
        <span>Format: <strong>{systemSettings.date_format}</strong></span>
        <span>•</span>
        <span>{systemSettings.time_format === '12' ? '12h' : '24h'} format</span>
      </div>
    </div>
  );

  // Render View Details link for existing events
  const renderViewDetailsLink = () => {
    if (!selectedEvent) return null;

    let displayDateTime = selectedEvent.start_at;
    
    try {
      const date = new Date(selectedEvent.start_at);
      if (!isNaN(date.getTime())) {
        displayDateTime = date.toLocaleString('en-US', {
          timeZone: systemSettings.timezone,
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          hour12: systemSettings.time_format === '12'
        });
      }
    } catch (e) {
      console.error('Error formatting date:', e);
    }

    return (
      <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Eye className="h-4 w-4 text-blue-600 dark:text-blue-400 mr-2" />
            <div>
              <span className="text-sm font-medium text-blue-800 dark:text-blue-300">
                {selectedEvent.name}
              </span>
              <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                {displayDateTime}
              </p>
              <p className="text-xs text-blue-500 dark:text-blue-500 mt-0.5">
                {systemSettings.timezone}
              </p>
            </div>
          </div>
          <Link 
            href={`/meetings/${selectedEvent.id}`}
            className="flex items-center px-3 py-1.5 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
          >
            <ExternalLink className="h-3 w-3 mr-1" />
            Open
          </Link>
        </div>
        {selectedEvent.description && (
          <p className="text-xs text-blue-600 dark:text-blue-400 mt-2">
            {selectedEvent.description}
          </p>
        )}
      </div>
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[99999] transition-all duration-300 ease-in-out">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-300"
        onClick={onClose}
      />
      
      {/* Modal Panel */}
      <div 
        className="absolute right-0 top-0 h-full w-full max-w-2xl bg-white dark:bg-gray-900 shadow-2xl transform transition-transform duration-300 ease-in-out overflow-hidden translate-x-0"
        style={{ zIndex: 60 }}
      >
        <div className="flex h-full flex-col">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 px-6 py-4">
            <div>
              <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
                {selectedEvent ? "Edit Meeting" : "Schedule New Meeting"}
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {selectedEvent ? "Update meeting details" : "Fill in all meeting information"}
              </p>
              {renderSystemInfo()}
            </div>
            <button
              onClick={onClose}
              className="rounded-lg p-2 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <X className="h-5 w-5 text-gray-500 dark:text-gray-400" />
            </button>
          </div>

          {/* Form Content */}
          <div className="flex-1 overflow-y-auto px-6 py-4">
            {/* Error Message */}
            {localError && (
              <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="text-sm text-red-600 dark:text-red-400">{localError}</p>
              </div>
            )}

            <div className="space-y-6">
              {/* View Details Link - Only for existing events */}
              {selectedEvent && renderViewDetailsLink()}

              {/* Meeting Name */}
              <div>
                <label className="flex items-center mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                  <FileText className="h-4 w-4 mr-2" />
                  Meeting Title *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className="w-full rounded-lg border border-gray-300 bg-transparent px-4 py-3 text-sm text-gray-800 placeholder:text-gray-400 focus:border-blue-500 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:placeholder:text-gray-500"
                  placeholder="Enter meeting title"
                />
              </div>

              {/* Meeting Type and Status */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="flex items-center mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                    <Tag className="h-4 w-4 mr-2" />
                    Meeting Type *
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) => handleInputChange('type', e.target.value)}
                    className="w-full rounded-lg border border-gray-300 bg-transparent px-4 py-3 text-sm text-gray-800 focus:border-blue-500 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                  >
                    <option value="">Select Type</option>
                    {meetingTypes.map((type: Category) => (
                      <option key={type.id} value={type.name}>{type.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="flex items-center mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Status *
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => handleInputChange('status', e.target.value)}
                    className="w-full rounded-lg border border-gray-300 bg-transparent px-4 py-3 text-sm text-gray-800 focus:border-blue-500 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                  >
                    <option value="">Select Status</option>
                    {meetingStatuses.map((status: Category) => (
                      <option key={status.id} value={status.name}>
                        {status.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Date and Time Pickers */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {/* Date Picker */}
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                    Start Date *
                  </label>
                  <div className="relative">
                    <input
                      type="date"
                      value={formData.start_at}
                      onChange={(e) => handleInputChange("start_at", e.target.value)}
                      onClick={(e) => (e.target as HTMLInputElement).showPicker()}
                      className="dark:bg-gray-900 shadow-theme-xs focus:border-blue-400 focus:ring-blue-500/10 dark:focus:border-blue-700 h-11 w-full appearance-none rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 pr-11 text-sm text-gray-800 placeholder:text-gray-400 focus:ring-2 focus:outline-none dark:border-gray-700 dark:text-white/90 dark:placeholder:text-white/30"
                    />
                    <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-gray-500 dark:text-gray-400">
                      <CalendarIcon size={18} />
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Selected: {formData.start_at ? formatDisplayDate(formData.start_at) : "No date selected"}
                  </p>
                </div>

                {/* Time Picker */}
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                    Start Time *
                  </label>
                  <div className="relative">
                    <input
                      type="time"
                      value={formData.start_time}
                      onChange={(e) => handleInputChange('start_time', e.target.value)}
                      onClick={(e) => (e.target as HTMLInputElement).showPicker()}
                      className="dark:bg-dark-900 shadow-theme-xs focus:border-brand-300 focus:ring-brand-500/10 dark:focus:border-brand-800 h-11 w-full appearance-none rounded-lg border border-gray-300 bg-transparent bg-none px-4 py-2.5 pr-11 pl-4 text-sm text-gray-800 placeholder:text-gray-400 focus:ring-3 focus:outline-hidden dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30"
                    />
                    <span className="absolute top-1/2 right-3 -translate-y-1/2 text-gray-500 dark:text-gray-400">
                      <Clock size={18} />
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {systemSettings.time_format === '12' ? '12-hour format' : '24-hour format'}
                  </p>
                </div>

                {/* Duration */}
                <div>
                  <label className="flex items-center mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                    <Clock className="h-4 w-4 mr-2" />
                    Duration (minutes)
                  </label>
                  <input
                    type="number"
                    value={formData.period}
                    onChange={(e) => handleInputChange('period', e.target.value)}
                    className="w-full rounded-lg border border-gray-300 bg-transparent px-4 py-3 text-sm text-gray-800 focus:border-blue-500 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                    placeholder="60"
                    min="15"
                    step="15"
                  />
                </div>
              </div>

              {/* Location and Chair */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="flex items-center mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                    <MapPin className="h-4 w-4 mr-2" />
                    Location *
                  </label>
                  <select
                    value={formData.location}
                    onChange={(e) => handleInputChange('location', e.target.value)}
                    className="w-full rounded-lg border border-gray-300 bg-transparent px-4 py-3 text-sm text-gray-800 focus:border-blue-500 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                  >
                    <option value="">Select Location</option>
                    {locations.map((location: Category) => (
                      <option key={location.id} value={location.name}>{location.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="flex items-center mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                    <Users className="h-4 w-4 mr-2" />
                    Chair Person
                  </label>
                  <select
                    value={formData.chair_id}
                    onChange={(e) => handleInputChange('chair_id', e.target.value)}
                    className="w-full rounded-lg border border-gray-300 bg-transparent px-4 py-3 text-sm text-gray-800 focus:border-blue-500 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                  >
                    <option value="">Select Chair</option>
                    {chairs.map((chair: User) => (
                      <option key={chair.id} value={chair.id}>
                        {chair.name} ({chair.role})
                      </option>
                    ))}
                  </select>
                  {formData.type && (
                    <p className="text-xs text-green-600 mt-1">
                      Auto-assigned based on meeting type
                    </p>
                  )}
                </div>
              </div>

              {/* Colour Selection */}
              <div>
                <label className="flex items-center mb-3 text-sm font-medium text-gray-700 dark:text-gray-300">
                  <div className="h-4 w-4 mr-2 rounded-full" style={{ backgroundColor: formData.colour }} />
                  Meeting Colour
                </label>
                <div className="flex flex-wrap gap-2">
                  {getColourOptions().map((colour, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => handleInputChange('colour', colour.value)}
                      className={`w-8 h-8 rounded-full border-2 transition-all ${
                        formData.colour === colour.value 
                          ? 'border-gray-800 dark:border-white scale-110' 
                          : 'border-gray-300 dark:border-gray-600 hover:scale-105'
                      }`}
                      style={{ backgroundColor: colour.value }}
                      title={colour.label}
                    />
                  ))}
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="flex items-center mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                  <FileText className="h-4 w-4 mr-2" />
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  rows={4}
                  className="w-full rounded-lg border border-gray-300 bg-transparent px-4 py-3 text-sm text-gray-800 placeholder:text-gray-400 focus:border-blue-500 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:placeholder:text-gray-500"
                  placeholder="Enter meeting description and agenda..."
                />
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="border-t border-gray-200 dark:border-gray-700 px-6 py-4">
            <div className="flex items-center justify-between">
              <button
                onClick={onClose}
                className="px-6 py-2.5 text-sm font-medium text-gray-700 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={isLoading || !formData.name || !formData.type || !formData.start_at || !formData.start_time || !formData.location || !formData.status}
                className="flex items-center px-6 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    {selectedEvent ? "Updating..." : "Scheduling..."}
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    {selectedEvent ? "Update Meeting" : "Schedule Meeting"}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper function for colour options
const getColourOptions = () => {
  return [
    { value: "#3b82f6", label: "Blue", bg: "bg-blue-500" },
    { value: "#ef4444", label: "Red", bg: "bg-red-500" },
    { value: "#10b981", label: "Green", bg: "bg-green-500" },
    { value: "#f59e0b", label: "Yellow", bg: "bg-yellow-500" },
    { value: "#8b5cf6", label: "Purple", bg: "bg-purple-500" },
    { value: "#06b6d4", label: "Cyan", bg: "bg-cyan-500" },
    { value: "#f97316", label: "Orange", bg: "bg-orange-500" },
    { value: "#84cc16", label: "Lime", bg: "bg-lime-500" }
  ];
};