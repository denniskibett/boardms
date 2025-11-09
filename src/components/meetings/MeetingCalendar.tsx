// app/components/meetings/MeetingCalendar.tsx - FIXED VERSION
"use client";
import React, { useState, useRef, useEffect, useCallback } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import {
  EventInput,
  DateSelectArg,
  EventClickArg,
  EventContentArg,
} from "@fullcalendar/core";
import { 
  MapPin, 
  CheckCircle, 
  Clock, 
  XCircle, 
  Loader2,
  X,
  Users,
  FileText,
  Tag,
  Globe,
  Eye,
  ExternalLink
} from "lucide-react";
import { 
  formatDateForInput, 
  parseDateFromInput, 
  setSystemTimezone,
  getSystemTimezone,
  toTimezone,
  addMinutes,
  formatDate,
  formatDateTime 
} from "@/lib/utils/date-utils";
import Link from "next/link";

interface CalendarEvent extends EventInput {
  extendedProps: {
    committee: string;
    type: string;
    location: string;
    chair_id?: string;
    status?: string;
    description?: string;
    period?: string;
    actual_end?: string;
    colour?: string;
  };
}

interface MeetingFormData {
  name: string;
  type: string;
  start_at: string;
  period: string;
  location: string;
  chair_id: string;
  status: string;
  description: string;
  colour: string;
}

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

interface SystemSettings {
  timezone: string;
  date_format: string;
  timezones: { name: string; abbrev: string; utc_offset: string }[];
}

const Calendar: React.FC = () => {
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [isSliderOpen, setIsSliderOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [locations, setLocations] = useState<Category[]>([]);
  const [meetingTypes, setMeetingTypes] = useState<Category[]>([]);
  const [meetingStatuses, setMeetingStatuses] = useState<Category[]>([]);
  const [colours, setColours] = useState<Category[]>([]);
  const [chairs, setChairs] = useState<User[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [systemSettings, setSystemSettings] = useState<SystemSettings>({
    timezone: 'UTC',
    date_format: 'YYYY-MM-DD',
    timezones: []
  });
  const calendarRef = useRef<FullCalendar>(null);

  const [formData, setFormData] = useState<MeetingFormData>({
    name: "",
    type: "",
    start_at: "",
    period: "60",
    location: "",
    chair_id: "",
    status: "",
    description: "",
    colour: "#3b82f6"
  });

  // Fetch system settings
  useEffect(() => {
    const fetchSystemSettings = async () => {
      try {
        const response = await fetch('/api/settings');
        if (response.ok) {
          const settings = await response.json();
          setSystemSettings({
            timezone: settings.timezone || 'UTC',
            date_format: settings.date_format || 'YYYY-MM-DD',
            timezones: settings.timezones || []
          });
          
          // Initialize date-utils with system timezone
          setSystemTimezone(settings.timezone || 'UTC');
          console.log(`🌍 System settings loaded:`, {
            timezone: settings.timezone,
            date_format: settings.date_format
          });
        }
      } catch (error) {
        console.error('Failed to fetch system settings:', error);
      }
    };

    fetchSystemSettings();
  }, []);

  // Format date according to system settings
  const formatSystemDate = (date: Date, includeTime: boolean = false): string => {
    if (includeTime) {
      return formatDateTime(date, systemSettings.timezone);
    }
    return formatDate(date, systemSettings.date_format, systemSettings.timezone);
  };

  // Get appropriate chair based on meeting type
  const getDefaultChairForMeetingType = (meetingType: string): string => {
    if (!meetingType || !chairs.length) return "";
    
    const typeLower = meetingType.toLowerCase();
    
    if (typeLower.includes('cabinet')) {
      // Find president
      const president = chairs.find(chair => 
        chair.role.toLowerCase().includes('president') && 
        !chair.role.toLowerCase().includes('deputy')
      );
      return president?.id || "";
    } 
    else if (typeLower.includes('committee')) {
      // Find deputy president
      const deputyPresident = chairs.find(chair => 
        chair.role.toLowerCase().includes('deputy') || 
        chair.role.toLowerCase().includes('vice')
      );
      return deputyPresident?.id || "";
    }
    
    return "";
  };

  // Fetch all required data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoadingData(true);
        console.log("Starting data fetch...");
        
        // Fetch categories by type in parallel with proper error handling
        const [locationsRes, meetingTypesRes, meetingStatusesRes, coloursRes, chairsRes, meetingsRes] = await Promise.all([
          fetch('/api/categories?type=location'),
          fetch('/api/categories?type=meeting'),
          fetch('/api/categories?type=meeting_status'),
          fetch('/api/categories?type=colour'),
          fetch('/api/users?role=all'),
          fetch('/api/meetings')
        ]);

        console.log("API responses received");

        // Handle responses with error checking
        const locationsData = locationsRes.ok ? await locationsRes.json() : [];
        const meetingTypesData = meetingTypesRes.ok ? await meetingTypesRes.json() : [];
        const meetingStatusesData = meetingStatusesRes.ok ? await meetingStatusesRes.json() : [];
        const coloursData = coloursRes.ok ? await coloursRes.json() : [];
        const chairsData = chairsRes.ok ? await chairsRes.json() : [];
        const meetingsData = meetingsRes.ok ? await meetingsRes.json() : [];

        console.log("Data counts:", {
          locations: locationsData.length,
          meetingTypes: meetingTypesData.length,
          meetingStatuses: meetingStatusesData.length,
          colours: coloursData.length,
          chairs: chairsData.length,
          meetings: meetingsData.length
        });

        setLocations(locationsData);
        setMeetingTypes(meetingTypesData);
        setMeetingStatuses(meetingStatusesData);
        setColours(coloursData);
        setChairs(chairsData);

        // Set default status if available
        if (meetingStatusesData.length > 0) {
          const defaultStatus = meetingStatusesData.find((status: Category) => 
            status.name.toLowerCase() === 'scheduled'
          ) || meetingStatusesData[0];
          setFormData(prev => ({ ...prev, status: defaultStatus.name }));
          console.log("Default status set to:", defaultStatus.name);
        }

        // Set default colour if available
        if (coloursData.length > 0) {
          const defaultColour = coloursData.find((colour: Category) => 
            colour.name.toLowerCase() === 'blue'
          ) || coloursData[0];
          setFormData(prev => ({ ...prev, colour: defaultColour.colour || "#3b82f6" }));
          console.log("Default colour set to:", defaultColour.colour);
        }

        // Transform meetings data for calendar
        const calendarEvents = meetingsData.map((meeting: any) => ({
          id: meeting.id.toString(),
          title: meeting.name,
          start: meeting.start_at,
          end: meeting.actual_end,
          extendedProps: {
            committee: meeting.type,
            type: meeting.type,
            location: meeting.location,
            chair_id: meeting.chair_id,
            status: meeting.status,
            description: meeting.description,
            colour: meeting.colour,
            period: meeting.period
          }
        }));
        setEvents(calendarEvents);

        console.log("Data fetch completed successfully");

      } catch (error) {
        console.error('Error in fetchData:', error);
      } finally {
        setIsLoadingData(false);
      }
    };

    fetchData();
  }, []);

  const handleDateSelect = (selectInfo: DateSelectArg) => {
    resetForm();
    
    // Get the selected date and convert to system timezone
    const startDate = selectInfo.start;
    const dateInSystemTimezone = toTimezone(startDate, systemSettings.timezone);
    
    // Format for datetime-local input using system timezone
    const formattedDate = formatDateForInput(dateInSystemTimezone, systemSettings.timezone);
    
    console.log("Date selected:", { 
      original: startDate,
      systemTimezone: systemSettings.timezone,
      inSystemTimezone: dateInSystemTimezone,
      formattedDate 
    });
    
    setFormData(prev => ({
      ...prev,
      start_at: formattedDate,
      period: "60",
      status: meetingStatuses.find(status => 
        status.name.toLowerCase() === 'scheduled'
      )?.name || meetingStatuses[0]?.name || '',
      colour: colours.find(colour => 
        colour.name.toLowerCase() === 'blue'
      )?.colour || colours[0]?.colour || "#3b82f6"
    }));
    openSlider();
  };

  const handleEventClick = (clickInfo: EventClickArg) => {
    const event = clickInfo.event;
    const extendedProps = event.extendedProps;
    
    // Convert event date to system timezone for display
    const startDate = event.start ? new Date(event.start) : new Date();
    const dateInSystemTimezone = toTimezone(startDate, systemSettings.timezone);
    const formattedDate = formatDateForInput(dateInSystemTimezone, systemSettings.timezone);
    
    setSelectedEvent(event as unknown as CalendarEvent);
    setFormData({
      name: event.title || "",
      type: extendedProps.type || "",
      start_at: formattedDate,
      period: extendedProps.period || "60",
      location: extendedProps.location || "",
      chair_id: extendedProps.chair_id || "",
      status: extendedProps.status || "",
      description: extendedProps.description || "",
      colour: extendedProps.colour || "#3b82f6"
    });
    
    openSlider();
  };

  const handleInputChange = (field: keyof MeetingFormData, value: string) => {
    const newFormData = {
      ...formData,
      [field]: value
    };

    // Auto-assign chair based on meeting type when type changes
    if (field === 'type' && value) {
      const defaultChairId = getDefaultChairForMeetingType(value);
      if (defaultChairId) {
        newFormData.chair_id = defaultChairId;
        console.log(`Auto-assigned chair for ${value}: ${defaultChairId}`);
      }
    }

    setFormData(newFormData);
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    try {
      console.log("🔄 Starting meeting submission...");
      
      // Basic validation
      const requiredFields = ['name', 'type', 'start_at', 'location', 'status'];
      const missingFields = requiredFields.filter(field => !formData[field as keyof MeetingFormData]);
      
      if (missingFields.length > 0) {
        throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
      }

      // Parse the datetime input considering system timezone
      let startDate: Date;
      let endDate: Date;
      
      try {
        startDate = parseDateFromInput(formData.start_at, systemSettings.timezone);
        console.log("📅 Parsed start date:", {
          input: formData.start_at,
          parsed: startDate,
          iso: startDate.toISOString(),
          timezone: systemSettings.timezone
        });
        
        // Calculate end date based on period
        endDate = addMinutes(startDate, parseInt(formData.period) || 60, systemSettings.timezone);
      } catch (dateError) {
        console.error("❌ Date parsing error:", dateError);
        throw new Error(`Invalid date format: ${formData.start_at}. Please check the date and time.`);
      }

      // Prepare meeting data with correct data types
      const meetingData = {
        name: formData.name.trim(),
        type: formData.type,
        start_at: startDate.toISOString(), // Store as UTC ISO string
        period: parseInt(formData.period) || 60, // Convert to integer
        location: formData.location,
        chair_id: formData.chair_id ? parseInt(formData.chair_id) : null, // Convert to integer or null
        status: formData.status,
        description: formData.description?.trim() || '',
        colour: formData.colour,
        actual_end: endDate.toISOString(), // Store calculated end time
        created_by: 1, // TODO: Replace with actual logged-in user ID from session
        approved_by: formData.status.toLowerCase() === "confirmed" ? 1 : null, // TODO: Replace with actual approver ID
        timezone: systemSettings.timezone // Store the timezone used for creation
      };

      console.log("📤 Submitting meeting data:", meetingData);

      // FIXED: Use correct URL format for PUT requests
      const url = selectedEvent 
        ? `/api/meetings?id=${selectedEvent.id}` 
        : '/api/meetings';
      const method = selectedEvent ? 'PUT' : 'POST';

      console.log(`🌐 Making ${method} request to: ${url}`);

      const response = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(meetingData),
      });

      const responseText = await response.text();
      console.log(`📥 Response status: ${response.status}`, responseText);

      let responseData;
      try {
        responseData = responseText ? JSON.parse(responseText) : {};
      } catch (parseError) {
        console.error("❌ Failed to parse response:", parseError);
        throw new Error(`Server returned invalid response: ${responseText.substring(0, 100)}`);
      }

      if (!response.ok) {
        console.error("❌ Server error response:", {
          status: response.status,
          statusText: response.statusText,
          data: responseData
        });
        
        const errorMessage = responseData.error || 
                            responseData.details || 
                            responseData.message || 
                            `Server error: ${response.status} ${response.statusText}`;
        
        throw new Error(errorMessage);
      }

      const savedMeeting = responseData;
      console.log("✅ Meeting saved successfully:", savedMeeting);

      // Refetch all meetings to update calendar
      console.log("🔄 Refetching meetings...");
      const meetingsResponse = await fetch('/api/meetings');
      
      if (!meetingsResponse.ok) {
        console.warn("⚠️ Failed to refetch meetings, but meeting was saved");
      } else {
        const meetingsData = await meetingsResponse.json();
        
        // Transform meetings data for calendar
        const calendarEvents = meetingsData.map((meeting: any) => ({
          id: meeting.id.toString(),
          title: meeting.name,
          start: meeting.start_at,
          end: meeting.actual_end,
          extendedProps: {
            committee: meeting.type,
            type: meeting.type,
            location: meeting.location,
            chair_id: meeting.chair_id,
            status: meeting.status,
            description: meeting.description,
            colour: meeting.colour,
            period: meeting.period,
            timezone: meeting.timezone
          }
        }));
        
        setEvents(calendarEvents);
        console.log("📊 Calendar events updated:", calendarEvents.length);
      }

      closeSlider();
      resetForm();

      // Force calendar refresh
      if (calendarRef.current) {
        const calendarApi = calendarRef.current.getApi();
        calendarApi.refetchEvents();
      }

      // Show success message
      alert(`✅ Meeting ${selectedEvent ? 'updated' : 'scheduled'} successfully!`);

    } catch (error) {
      console.error("❌ Error saving meeting:", error);
      
      let userMessage = "Failed to save meeting. Please try again.";
      
      if (error instanceof Error) {
        if (error.message.includes('Missing required fields')) {
          userMessage = error.message;
        } else if (error.message.includes('Invalid date format')) {
          userMessage = error.message;
        } else if (error.message.includes('Network') || error.message.includes('fetch')) {
          userMessage = "Network error. Please check your connection and try again.";
        } else if (error.message.includes('Server error')) {
          userMessage = error.message;
        } else {
          userMessage = error.message;
        }
      }
      
      alert(userMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    const defaultStatus = meetingStatuses.find(status => 
      status.name.toLowerCase() === 'scheduled'
    )?.name || meetingStatuses[0]?.name || '';

    const defaultColour = colours.find(colour => 
      colour.name.toLowerCase() === 'blue'
    )?.colour || colours[0]?.colour || "#3b82f6";

    setFormData({
      name: "",
      type: "",
      start_at: "",
      period: "60",
      location: "",
      chair_id: "",
      status: defaultStatus,
      description: "",
      colour: defaultColour
    });
    setSelectedEvent(null);
  };

  const openSlider = () => {
    setIsSliderOpen(true);
    document.body.style.overflow = 'hidden';
  };

  const closeSlider = () => {
    setIsSliderOpen(false);
    document.body.style.overflow = 'unset';
    resetForm();
  };

  // Render timezone and date format info
  const renderSystemInfo = () => (
    <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
      <div className="flex items-center">
        <Globe className="h-3 w-3 mr-1" />
        <span>Timezone: <strong>{systemSettings.timezone}</strong></span>
      </div>
      <div>
        <span>Format: <strong>{systemSettings.date_format}</strong></span>
      </div>
    </div>
  );

  // Render View Details link for existing events
  const renderViewDetailsLink = () => {
    if (!selectedEvent) return null;

    return (
      <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Eye className="h-4 w-4 text-blue-600 dark:text-blue-400 mr-2" />
            <span className="text-sm font-medium text-blue-800 dark:text-blue-300">
              View full meeting details
            </span>
          </div>
          <Link 
            href={`/meetings/${selectedEvent.id}`}
            className="flex items-center px-3 py-1.5 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            onClick={(e) => {
              e.stopPropagation(); // Prevent closing the slider
            }}
          >
            <ExternalLink className="h-3 w-3 mr-1" />
            Open
          </Link>
        </div>
        <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
          View complete information including participants, full description, and meeting history
        </p>
      </div>
    );
  };

  if (isLoadingData) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        <span className="ml-2 text-gray-600">Loading calendar...</span>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Calendar Header with System Info */}
      <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">Meeting Calendar</h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              All times are displayed in <strong>{systemSettings.timezone}</strong> timezone
            </p>
          </div>
          <div className="text-right text-sm text-gray-600 dark:text-gray-400">
            <div>Date Format: <strong>{systemSettings.date_format}</strong></div>
            <div>Current Time: <strong>{formatSystemDate(new Date(), true)}</strong></div>
          </div>
        </div>
      </div>

      {/* TailAdmin-styled Calendar with wrapper */}
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-4">
        <div className="custom-calendar">
          <FullCalendar
            ref={calendarRef}
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
            initialView="dayGridMonth"
            headerToolbar={{
              left: "prev,next addEventButton",
              center: "title",
              right: "dayGridMonth,timeGridWeek,timeGridDay",
            }}
            events={events}
            selectable={true}
            select={handleDateSelect}
            eventClick={handleEventClick}
            eventContent={renderEventContent}
            customButtons={{
              addEventButton: {
                text: "Schedule Meeting +",
                click: openSlider,
              },
            }}
            timeZone={systemSettings.timezone}
            eventTimeFormat={{
              hour: '2-digit',
              minute: '2-digit',
              hour12: false,
              meridiem: false
            }}
          />
        </div>
      </div>

      {/* Full Page Slider Overlay */}
      <div className={`fixed inset-0 z-50 transition-all duration-300 ease-in-out ${
        isSliderOpen ? 'visible' : 'invisible'
      }`}>
        {/* Full page backdrop */}
        <div 
          className={`absolute inset-0 bg-black transition-opacity duration-300 ${
            isSliderOpen ? 'bg-opacity-50' : 'bg-opacity-0'
          }`}
          onClick={closeSlider}
        />
        
        {/* Slider Panel - Full height */}
        <div 
          className={`absolute right-0 top-0 h-full w-full max-w-2xl bg-white dark:bg-gray-900 shadow-2xl transform transition-transform duration-300 ease-in-out overflow-hidden ${
            isSliderOpen ? 'translate-x-0' : 'translate-x-full'
          }`}
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
                onClick={closeSlider}
                className="rounded-lg p-2 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <X className="h-5 w-5 text-gray-500 dark:text-gray-400" />
              </button>
            </div>

            {/* Form Content */}
            <div className="flex-1 overflow-y-auto px-6 py-4">
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
                      {meetingTypes.map(type => (
                        <option key={type.id} value={type.name}>{type.name}</option>
                      ))}
                    </select>
                    {meetingTypes.length === 0 && (
                      <p className="text-xs text-red-500 mt-1">No meeting types found. Check API endpoint.</p>
                    )}
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
                      {meetingStatuses.map(status => (
                        <option key={status.id} value={status.name}>
                          {status.name}
                        </option>
                      ))}
                    </select>
                    {meetingStatuses.length === 0 && (
                      <p className="text-xs text-red-500 mt-1">No statuses found. Check API endpoint.</p>
                    )}
                  </div>
                </div>

                {/* Date and Duration */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="flex items-center mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                      Start Date & Time *
                    </label>
                    <input
                      type="datetime-local"
                      value={formData.start_at}
                      onChange={(e) => handleInputChange('start_at', e.target.value)}
                      className="w-full rounded-lg border border-gray-300 bg-transparent px-4 py-3 text-sm text-gray-800 focus:border-blue-500 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                    />
                    {renderSystemInfo()}
                  </div>

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
                      {locations.map(location => (
                        <option key={location.id} value={location.name}>{location.name}</option>
                      ))}
                    </select>
                    {locations.length === 0 && (
                      <p className="text-xs text-red-500 mt-1">No locations found. Check API endpoint.</p>
                    )}
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
                      {chairs.map(chair => (
                        <option key={chair.id} value={chair.id}>
                          {chair.name} ({chair.role})
                        </option>
                      ))}
                    </select>
                    {formData.type && formData.chair_id && (
                      <p className="text-xs text-green-600 mt-1">
                        Auto-assigned for {formData.type}
                      </p>
                    )}
                  </div>
                </div>

                {/* Colour Selection from Categories */}
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
                  {colours.length === 0 && (
                    <p className="text-xs text-gray-500 mt-1">Using default colours. Add colour categories via API.</p>
                  )}
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
                  onClick={closeSlider}
                  className="px-6 py-2.5 text-sm font-medium text-gray-700 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={isLoading || !formData.name || !formData.type || !formData.start_at || !formData.location || !formData.status}
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
    </div>
  );
};

// Helper function for colour options (keep your existing implementation)
const getColourOptions = () => {
  // ... your existing getColourOptions implementation
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

const renderEventContent = (eventInfo: EventContentArg) => {
  const colorClass = `fc-bg-${eventInfo.event.extendedProps.calendar?.toLowerCase() || 'primary'}`;
  const colour = eventInfo.event.extendedProps.colour || '#3b82f6';
  const status = eventInfo.event.extendedProps.status;
  
  return (
    <div
      className={`event-fc-color flex fc-event-main ${colorClass} p-2 rounded-lg border-l-3 shadow-sm`}
      style={{ 
        borderLeftColor: colour,
        backgroundColor: `${colour}15`,
        border: `1px solid ${colour}20`
      }}
    >
      <div className="fc-daygrid-event-dot"></div><br />
      <div className="fc-event-time text-xs font-semibold text-gray-600 dark:text-gray-400">
        {eventInfo.timeText}
      </div>
      <div className="fc-event-title text-sm font-medium text-gray-800 dark:text-white mt-1">
        {eventInfo.event.title}
      </div>
      {status && (
        <div className="fc-event-status text-xs text-gray-500 dark:text-gray-400 mt-1 flex items-center">
          <div 
            className="w-2 h-2 rounded-full mr-1"
            style={{ backgroundColor: colour }}
          />
          {status}
        </div>
      )}
    </div>
  );
};

export default Calendar;