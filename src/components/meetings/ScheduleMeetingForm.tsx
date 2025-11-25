// app/components/meetings/ScheduleMeetingForm.tsx - UPDATED WITH REDUX
"use client";
import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useMeetings } from '@/hooks/useMeetings';
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import Button from "@/components/ui/button/Button";
import { fetchMeetingsData } from "@/lib/store/slices/meetingsSlice";
import { RootState, AppDispatch } from "@/lib/store";

interface ScheduleMeetingFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function ScheduleMeetingForm({ onSuccess, onCancel }: ScheduleMeetingFormProps) {
  const dispatch = useDispatch<AppDispatch>();
  
  // Get data from Redux store
  const {
    categories: { locations, meetingTypes, meetingStatuses, colours },
    chairs,
    loading: isLoadingData
  } = useSelector((state: RootState) => state.meetings);
  
  const { user } = useSelector((state: RootState) => state.auth);
  const { createNewMeeting, creating, createError, clearCreationError } = useMeetings();
  
  const [formData, setFormData] = useState({
    name: "",
    type: "",
    start_at: "",
    period: 60,
    location: "",
    chair_id: "",
    status: "",
    description: "",
    colour: "#3b82f6"
  });

  // Fetch all required data using Redux
  useEffect(() => {
    console.log("🔄 Fetching meetings data via Redux for form...");
    dispatch(fetchMeetingsData());
  }, [dispatch]);

  // Set default values when categories are loaded
  useEffect(() => {
    if (meetingStatuses.length > 0 && !formData.status) {
      const defaultStatus = meetingStatuses.find(status => 
        status.name.toLowerCase() === 'scheduled'
      ) || meetingStatuses[0];
      setFormData(prev => ({ ...prev, status: defaultStatus.name }));
      console.log("✅ Default status set to:", defaultStatus.name);
    }

    if (meetingTypes.length > 0 && !formData.type) {
      const defaultType = meetingTypes.find(type => 
        type.name.toLowerCase().includes('regular') || 
        type.name.toLowerCase().includes('cabinet')
      ) || meetingTypes[0];
      setFormData(prev => ({ ...prev, type: defaultType.name }));
      console.log("✅ Default type set to:", defaultType.name);
    }

    if (colours.length > 0 && !formData.colour) {
      const defaultColour = colours.find(colour => 
        colour.name.toLowerCase() === 'blue'
      ) || colours[0];
      setFormData(prev => ({ ...prev, colour: defaultColour.colour || "#3b82f6" }));
      console.log("✅ Default colour set to:", defaultColour.colour);
    }
  }, [meetingStatuses, meetingTypes, colours]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ 
      ...prev, 
      [name]: name === 'period' ? parseInt(value) || 60 : value 
    }));
    
    // Clear error when user starts typing
    if (createError) {
      clearCreationError();
    }
  };

  // Get appropriate chair based on meeting type
  const getDefaultChairForMeetingType = (meetingType: string): string => {
    if (!meetingType || !chairs.length) return "";
    
    const typeLower = meetingType.toLowerCase();
    
    console.log("🔍 Looking for chair for meeting type:", typeLower);
    console.log("👥 Available chairs:", chairs.map(c => ({ id: c.id, name: c.name, role: c.role })));
    
    if (typeLower.includes('cabinet') || typeLower.includes('full')) {
      const president = chairs.find(chair => 
        chair.role.toLowerCase().includes('president')
      );
      console.log("👑 President found:", president);
      return president?.id || "";
    } 
    else if (typeLower.includes('committee')) {
      const deputy = chairs.find(chair => 
        chair.role.toLowerCase().includes('deputy') || 
        chair.role.toLowerCase().includes('vice')
      );
      console.log("👥 Deputy found:", deputy);
      return deputy?.id || "";
    }
    else if (typeLower.includes('technical') || typeLower.includes('departmental')) {
      const secretary = chairs.find(chair => 
        chair.role.toLowerCase().includes('secretary') &&
        !chair.role.toLowerCase().includes('cabinet')
      );
      console.log("📝 Secretary found:", secretary);
      return secretary?.id || "";
    }
    
    return "";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log("🔄 Starting meeting submission...");
    
    // Basic validation
    const requiredFields = ['name', 'type', 'start_at', 'location', 'status'];
    const missingFields = requiredFields.filter(field => !formData[field as keyof typeof formData]);
    
    if (missingFields.length > 0) {
      alert(`Missing required fields: ${missingFields.join(', ')}`);
      return;
    }

    try {
      // Combine date and time into ISO string
      const startAt = new Date(`${formData.start_at}`).toISOString();
      
      // Calculate end time based on period
      const startDate = new Date(startAt);
      const endDate = new Date(startDate.getTime() + (formData.period * 60 * 1000));
      
      const meetingData = {
        name: formData.name.trim(),
        type: formData.type,
        start_at: startAt,
        period: formData.period,
        location: formData.location,
        chair_id: formData.chair_id ? parseInt(formData.chair_id) : null,
        status: formData.status,
        description: formData.description.trim(),
        colour: formData.colour,
        actual_end: endDate.toISOString(),
        created_by: user?.id || 1,
        approved_by: formData.status.toLowerCase() === "confirmed" ? (user?.id || 1) : null,
      };

      console.log("📤 Submitting meeting data:", meetingData);

      const result = await createNewMeeting(meetingData);
      
      if (result.meta?.requestStatus === 'fulfilled') {
        console.log("✅ Meeting created successfully");
        
        // Reset form on success
        setFormData({
          name: "",
          type: meetingTypes[0]?.name || "",
          start_at: "",
          period: 60,
          location: "",
          chair_id: "",
          status: meetingStatuses.find(s => s.name.toLowerCase() === 'scheduled')?.name || meetingStatuses[0]?.name || "",
          description: "",
          colour: "#3b82f6"
        });
        
        // Refetch data to update any caches
        dispatch(fetchMeetingsData());
        
        // Call success callback
        if (onSuccess) {
          onSuccess();
        }
      } else {
        console.error("❌ Failed to create meeting:", result);
      }
    } catch (error) {
      console.error("❌ Error creating meeting:", error);
    }
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    } else {
      window.history.back();
    }
  };

  // Auto-assign chair when meeting type changes
  useEffect(() => {
    if (formData.type && chairs.length > 0) {
      const defaultChairId = getDefaultChairForMeetingType(formData.type);
      if (defaultChairId && !formData.chair_id) {
        console.log(`🤝 Auto-assigning chair ${defaultChairId} for ${formData.type}`);
        setFormData(prev => ({ ...prev, chair_id: defaultChairId }));
      }
    }
  }, [formData.type, chairs]);

  // Debug current state
  useEffect(() => {
    console.log("📊 Form State:", {
      formData,
      chairsCount: chairs?.length || 0,
      locationsCount: locations?.length || 0,
      meetingTypesCount: meetingTypes?.length || 0,
      meetingStatusesCount: meetingStatuses?.length || 0,
      isLoadingData,
      creating,
      createError
    });
  }, [formData, chairs, locations, meetingTypes, meetingStatuses, isLoadingData, creating, createError]);

  if (isLoadingData) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Loading form data via Redux...</span>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xs border border-gray-200 dark:border-gray-700">
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          Schedule New Meeting
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          Data loaded via Redux: {chairs.length} chairs, {locations.length} locations
        </p>
        {createError && (
          <div className="mt-2 p-3 bg-error-50 border border-error-200 rounded-lg">
            <p className="text-error-700 text-sm">{createError}</p>
          </div>
        )}
      </div>
      
      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        {/* Basic Information */}
        <div>
          <Label htmlFor="name">
            Meeting Title <span className="text-error-500">*</span>
          </Label>
          <Input
            id="name"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            placeholder="Enter meeting title"
            required
            disabled={creating}
          />
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div>
            <Label htmlFor="type">
              Meeting Type <span className="text-error-500">*</span>
            </Label>
            <select
              id="type"
              name="type"
              value={formData.type}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              required
              disabled={creating}
            >
              <option value="">Select meeting type</option>
              {meetingTypes.map(type => (
                <option key={type.id} value={type.name}>
                  {type.name}
                </option>
              ))}
            </select>
            {meetingTypes.length === 0 && (
              <p className="text-xs text-red-500 mt-1">No meeting types found</p>
            )}
          </div>

          <div>
            <Label htmlFor="status">Status <span className="text-error-500">*</span></Label>
            <select
              id="status"
              name="status"
              value={formData.status}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              required
              disabled={creating}
            >
              <option value="">Select status</option>
              {meetingStatuses.map(status => (
                <option key={status.id} value={status.name}>
                  {status.name}
                </option>
              ))}
            </select>
            {meetingStatuses.length === 0 && (
              <p className="text-xs text-red-500 mt-1">No statuses found</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <div>
            <Label htmlFor="start_at">
              Start Date & Time <span className="text-error-500">*</span>
            </Label>
            <Input
              id="start_at"
              name="start_at"
              type="datetime-local"
              value={formData.start_at}
              onChange={handleInputChange}
              required
              disabled={creating}
            />
          </div>

          <div>
            <Label htmlFor="period">Duration (minutes)</Label>
            <select
              id="period"
              name="period"
              value={formData.period}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              disabled={creating}
            >
              <option value={30}>30 minutes</option>
              <option value={60}>1 hour</option>
              <option value={90}>1.5 hours</option>
              <option value={120}>2 hours</option>
              <option value={180}>3 hours</option>
            </select>
          </div>

          <div>
            <Label htmlFor="location">
              Location <span className="text-error-500">*</span>
            </Label>
            <select
              id="location"
              name="location"
              value={formData.location}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              required
              disabled={creating}
            >
              <option value="">Select location</option>
              {locations.map(location => (
                <option key={location.id} value={location.name}>
                  {location.name}
                </option>
              ))}
            </select>
            {locations.length === 0 && (
              <p className="text-xs text-red-500 mt-1">No locations found</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div>
            <Label htmlFor="chair_id">Chair Person</Label>
            <select
              id="chair_id"
              name="chair_id"
              value={formData.chair_id}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              disabled={creating}
            >
              <option value="">Select chair person</option>
              {chairs.map(chair => (
                <option key={chair.id} value={chair.id}>
                  {chair.name} ({chair.role})
                </option>
              ))}
            </select>
            {chairs.length === 0 && (
              <p className="text-xs text-red-500 mt-1">No chairs found</p>
            )}
            {formData.type && formData.chair_id && (
              <p className="text-xs text-green-600 mt-1">
                Auto-assigned for {formData.type}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="colour">Meeting Colour</Label>
            <div className="flex gap-2 mt-2">
              {getColourOptions().map((color) => (
                <button
                  key={color.value}
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, colour: color.value }))}
                  className={`w-8 h-8 rounded-full border-2 transition-all ${
                    formData.colour === color.value 
                      ? 'border-gray-800 dark:border-white scale-110' 
                      : 'border-gray-300 dark:border-gray-600 hover:scale-105'
                  }`}
                  style={{ backgroundColor: color.value }}
                  title={color.label}
                />
              ))}
            </div>
          </div>
        </div>

        <div>
          <Label htmlFor="description">Description</Label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            placeholder="Provide meeting description and objectives..."
            disabled={creating}
          />
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-4 pt-6 border-t border-gray-200 dark:border-gray-700">
          <Button
            type="button"
            variant="outline"
            onClick={handleCancel}
            disabled={creating}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={creating || !formData.name || !formData.type || !formData.start_at || !formData.location || !formData.status}
          >
            {creating ? "Scheduling..." : "Schedule Meeting"}
          </Button>
        </div>
      </form>
    </div>
  );
}

// Helper function for colour options
const getColourOptions = () => {
  return [
    { value: "#3b82f6", label: "Blue" },
    { value: "#ef4444", label: "Red" },
    { value: "#10b981", label: "Green" },
    { value: "#f59e0b", label: "Yellow" },
    { value: "#8b5cf6", label: "Purple" },
    { value: "#06b6d4", label: "Cyan" },
    { value: "#f97316", label: "Orange" },
    { value: "#84cc16", label: "Lime" }
  ];
};