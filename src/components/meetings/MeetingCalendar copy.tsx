// app/components/meetings/MeetingCalendar.tsx - FIXED VERSION
"use client";
import React, { useState, useRef, useEffect } from "react";
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
import { useModal } from "@/hooks/useModal";
import { useCategories } from '@/hooks/useCategories';
import { Modal } from "@/components/ui/modal";

interface CalendarEvent extends EventInput {
  extendedProps: {
    committee: string;
    type: string;
    location: string;
    chair_id: string;
    status: string;
    description?: string;
    participants: string[];
    colour: string;
  };
}

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  ministry?: string;
}

interface Category {
  id: string;
  name: string;
  type: string;
  colour?: string;
}

const Calendar: React.FC = () => {
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [eventTitle, setEventTitle] = useState("");
  const [eventType, setEventType] = useState("");
  const [eventLocation, setEventLocation] = useState("");
  const [eventStartDate, setEventStartDate] = useState("");
  const [eventStartTime, setEventStartTime] = useState("");
  const [eventEndDate, setEventEndDate] = useState("");
  const [eventEndTime, setEventEndTime] = useState("");
  const [eventDescription, setEventDescription] = useState("");
  const [eventChair, setEventChair] = useState("");
  const [eventCommittee, setEventCommittee] = useState("");
  const [eventColour, setEventColour] = useState("#3B82F6");
  const [selectedParticipants, setSelectedParticipants] = useState<string[]>([]);
  const [participantSearch, setParticipantSearch] = useState("");
  
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  // const [meetingTypes, setMeetingTypes] = useState<Category[]>([]);
  // const [locations, setLocations] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  
  const calendarRef = useRef<FullCalendar>(null);
  const { isOpen, openModal, closeModal } = useModal();
  const { categories, meetingTypes, locations, loading: categoriesLoading, refetch } = useCategories();


  // Fetch data on component mount
  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        fetchMeetings(),
        fetchUsers(),
        fetchMeetings()
      ]);
    } catch (error) {
      console.error('Error fetching initial data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/users?role=all');
      const result = await response.json();
      
      if (response.ok && Array.isArray(result)) {
        setUsers(result);
      } else {
        console.error('Failed to fetch users:', result);
        setUsers([]);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      setUsers([]);
    }
  };

  // const fetchMeetingTypes = async () => {
  //   try {
  //     const response = await fetch('/api/categories');
  //     const result = await response.json();

  //     if (response.ok && Array.isArray(result)) {
  //       // Fixed: Filter for meeting types (adjust based on your actual category types)
  //       const filtered = result.filter((cat: Category) => 
  //         cat.type === 'meeting' || cat.type === 'meeting_type' || cat.type === 'meeting_status'
  //       );
  //       console.log('Meeting types loaded:', filtered);
  //       setMeetingTypes(filtered);
  //     } else {
  //       console.error('Failed to fetch meeting types:', result);
  //       setMeetingTypes([]);
  //     }
  //   } catch (error) {
  //     console.error('Error fetching meeting types:', error);
  //     setMeetingTypes([]);
  //   }
  // };

  // const fetchLocations = async () => {
  //   try {
  //     const response = await fetch('/api/categories');
  //     const result = await response.json();

  //     if (response.ok && Array.isArray(result)) {
  //       // Fixed: Filter for location types
  //       const filtered = result.filter((cat: Category) => cat.type === 'location');
  //       console.log('Locations loaded:', filtered);
  //       setLocations(filtered);
  //     } else {
  //       console.error('Failed to fetch locations:', result);
  //       setLocations([]);
  //     }
  //   } catch (error) {
  //     console.error('Error fetching locations:', error);
  //     setLocations([]);
  //   }
  // };

  const fetchMeetings = async () => {
    try {
      const response = await fetch('/api/meetings');
      const result = await response.json();
      
      console.log('Meetings API raw response:', result);
      
      if (response.ok && Array.isArray(result)) {
        console.log(`Processing ${result.length} meetings`);
        
        const calendarEvents = result.map((meeting: any) => {
          console.log('Processing meeting:', meeting);
          return {
            id: meeting.id,
            title: meeting.name,
            start: meeting.start_at,
            end: meeting.actual_end || meeting.start_at,
            color: meeting.colour || '#3B82F6',
            extendedProps: {
              committee: meeting.committee || '',
              type: meeting.type,
              location: meeting.location,
              chair_id: meeting.chair_id,
              status: meeting.status,
              description: meeting.description,
              participants: meeting.participants || [],
              colour: meeting.colour || '#3B82F6'
            }
          };
        });
        
        console.log('Calendar events:', calendarEvents);
        setEvents(calendarEvents);
      } else {
        console.error('Failed to fetch meetings:', result);
        setEvents([]);
      }
    } catch (error) {
      console.error('Error fetching meetings:', error);
      setEvents([]);
    }
  };

  const handleDateSelect = (selectInfo: DateSelectArg) => {
    resetModalFields();
    
    const startDate = new Date(selectInfo.startStr);
    const endDate = selectInfo.endStr ? new Date(selectInfo.endStr) : new Date(startDate.getTime() + 60 * 60 * 1000); // Default 1 hour
    
    // Set date and time separately for form inputs
    setEventStartDate(startDate.toISOString().split('T')[0]);
    setEventStartTime(startDate.toTimeString().slice(0, 5));
    setEventEndDate(endDate.toISOString().split('T')[0]);
    setEventEndTime(endDate.toTimeString().slice(0, 5));
    
    openModal();
  };

  const handleEventClick = (clickInfo: EventClickArg) => {
    const event = clickInfo.event;
    const startDate = event.start ? new Date(event.start) : new Date();
    const endDate = event.end ? new Date(event.end) : new Date(startDate.getTime() + 60 * 60 * 1000);
    
    setSelectedEvent(event as unknown as CalendarEvent);
    setEventTitle(event.title);
    setEventType(event.extendedProps.type);
    setEventLocation(event.extendedProps.location);
    setEventDescription(event.extendedProps.description || "");
    setEventChair(event.extendedProps.chair_id);
    setEventCommittee(event.extendedProps.committee || "");
    setEventColour(event.extendedProps.colour || '#3B82F6');
    setEventStartDate(startDate.toISOString().split("T")[0]);
    setEventStartTime(startDate.toTimeString().slice(0, 5));
    setEventEndDate(endDate.toISOString().split("T")[0]);
    setEventEndTime(endDate.toTimeString().slice(0, 5));
    setSelectedParticipants(event.extendedProps.participants || []);
    
    openModal();
  };

  // Auto-assign chair and committee based on meeting type
  const handleMeetingTypeChange = (typeName: string) => {
    setEventType(typeName);

    const category = categories.find(cat => cat.name === typeName);
    if (category && category.colour) {
      setEventColour(category.colour);
    }

    if (typeName.toLowerCase().includes('cabinet')) {
      // Cabinet meetings: President as chair, Deputy President as committee
      const president = users.find(u => u.role.toLowerCase() === 'president');
      if (president) setEventChair(president.id);

      setEventCommittee('Deputy President');
    } else {
      // Committee meetings: Chair is committee, allow selection
      setEventCommittee('Committee');
    }
  };


  const calculateDuration = (startDate: string, startTime: string, endDate: string, endTime: string): number => {
    const start = new Date(`${startDate}T${startTime}`);
    const end = new Date(`${endDate}T${endTime}`);
    const durationMs = end.getTime() - start.getTime();
    const durationHours = durationMs / (1000 * 60 * 60);
    return Math.max(0.5, durationHours); // Minimum 0.5 hours
  };

  const handleAddOrUpdateEvent = async () => {
    if (!eventTitle || !eventType || !eventStartDate || !eventStartTime || !eventLocation || !eventChair) {
      alert('Please fill in all required fields');
      return;
    }

    // Calculate duration in hours
    const duration = calculateDuration(eventStartDate, eventStartTime, eventEndDate, eventEndTime);
    
    const meetingData = {
      name: eventTitle,
      type: eventType,
      start_at: `${eventStartDate}T${eventStartTime}:00`,
      period: duration, // Duration in hours
      location: eventLocation,
      chair_id: eventChair,
      description: eventDescription,
      colour: eventColour,
      committee: eventCommittee,
      participants: selectedParticipants,
      ...(selectedEvent && { id: selectedEvent.id })
    };

    console.log('Saving meeting:', meetingData);

    try {
      const url = selectedEvent ? `/api/meetings/${selectedEvent.id}` : '/api/meetings';
      const method = selectedEvent ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(meetingData),
      });

      const result = await response.json();

      if (response.ok) {
        await fetchMeetings(); // Refresh events
        closeModal();
        resetModalFields();
      } else {
        console.error('Failed to save meeting:', result);
        alert(`Failed to save meeting: ${result.error}`);
      }
    } catch (error) {
      console.error('Error saving meeting:', error);
      alert('Error saving meeting. Please try again.');
    }
  };

  const resetModalFields = () => {
    setEventTitle("");
    setEventType("");
    setEventLocation("");
    setEventStartDate("");
    setEventStartTime("");
    setEventEndDate("");
    setEventEndTime("");
    setEventDescription("");
    setEventChair("");
    setEventCommittee("");
    setEventColour("#3B82F6");
    setSelectedParticipants([]);
    setParticipantSearch("");
    setSelectedEvent(null);
  };

  const toggleParticipant = (userId: string) => {
    setSelectedParticipants(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  // Filter users based on search
  const filteredUsers = Array.isArray(users) 
    ? users.filter(user => 
        user.name.toLowerCase().includes(participantSearch.toLowerCase()) ||
        user.role.toLowerCase().includes(participantSearch.toLowerCase()) ||
        (user.ministry && user.ministry.toLowerCase().includes(participantSearch.toLowerCase()))
      )
    : [];

  if (loading) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] p-8">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-gray-600">Loading calendar...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Meeting Calendar
          </h2>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            {events.length} {events.length === 1 ? 'event' : 'events'} scheduled
          </div>
        </div>
      </div>
      
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
              click: openModal,
            },
          }}
          height="auto"
        />
      </div>

      <Modal
        isOpen={isOpen}
        onClose={closeModal}
        className="max-w-4xl p-6 lg:p-8 max-h-[90vh] overflow-y-auto"
      >
        <div className="flex flex-col">
          <div className="mb-6">
            <h5 className="mb-2 font-semibold text-gray-800 modal-title text-theme-xl dark:text-white/90 lg:text-2xl">
              {selectedEvent ? "Edit Meeting" : "Schedule Meeting"}
            </h5>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {selectedEvent ? "Update meeting details" : "Schedule a new cabinet or committee meeting"}
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Column - Basic Info */}
            <div className="space-y-6">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                  Meeting Title *
                </label>
                <input
                  type="text"
                  value={eventTitle}
                  onChange={(e) => setEventTitle(e.target.value)}
                  className="dark:bg-dark-900 h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
                  placeholder="Enter meeting title"
                  required
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                  Meeting Type *
                </label>
                <select
                  value={eventType}
                  onChange={(e) => handleMeetingTypeChange(e.target.value)}
                  className="dark:bg-dark-900 h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800"
                  required
                >
                  <option value="">Select Type</option>
                  {meetingTypes.map((cat) => (
                    <option key={cat.id} value={cat.name}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                  Location *
                </label>
                <select
                  value={eventLocation}
                  onChange={(e) => setEventLocation(e.target.value)}
                  className="dark:bg-dark-900 h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800"
                  required
                >
                  <option value="">Select Location</option>
                  {locations.map((cat) => (
                    <option key={cat.id} value={cat.name}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                  Meeting Colour
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={eventColour}
                    onChange={(e) => setEventColour(e.target.value)}
                    className="w-12 h-12 rounded-lg border border-gray-300 cursor-pointer dark:border-gray-600"
                  />
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {eventColour}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                    Start Date *
                  </label>
                  <input
                    type="date"
                    value={eventStartDate}
                    onChange={(e) => setEventStartDate(e.target.value)}
                    className="dark:bg-dark-900 h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800"
                    required
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                    Start Time *
                  </label>
                  <input
                    type="time"
                    value={eventStartTime}
                    onChange={(e) => setEventStartTime(e.target.value)}
                    className="dark:bg-dark-900 h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={eventEndDate}
                    onChange={(e) => setEventEndDate(e.target.value)}
                    className="dark:bg-dark-900 h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                    End Time
                  </label>
                  <input
                    type="time"
                    value={eventEndTime}
                    onChange={(e) => setEventEndTime(e.target.value)}
                    className="dark:bg-dark-900 h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                  Chair Person *
                </label>
                <select
                  value={eventChair}
                  onChange={(e) => setEventChair(e.target.value)}
                  className="dark:bg-dark-900 h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800"
                  required
                >
                  <option value="">Select Chair Person</option>
                  {Array.isArray(users) && users.map(user => (
                    <option key={user.id} value={user.id}>
                      {user.name} - {user.role}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                  Committee
                </label>
                <input
                  type="text"
                  value={eventCommittee}
                  onChange={(e) => setEventCommittee(e.target.value)}
                  className="dark:bg-dark-900 h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
                  placeholder="Enter committee name"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                  Description
                </label>
                <textarea
                  value={eventDescription}
                  onChange={(e) => setEventDescription(e.target.value)}
                  rows={3}
                  className="w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
                  placeholder="Meeting description and objectives..."
                />
              </div>
            </div>

            {/* Right Column - Participants */}
            <div className="space-y-6">
              <div>
                <label className="mb-3 block text-sm font-medium text-gray-700 dark:text-gray-400">
                  Participants ({selectedParticipants.length} selected)
                </label>
                
                {/* Search Input */}
                <div className="mb-4">
                  <input
                    type="text"
                    value={participantSearch}
                    onChange={(e) => setParticipantSearch(e.target.value)}
                    placeholder="Search participants by name, role, or ministry..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                </div>

                <div className="max-h-96 overflow-y-auto border border-gray-200 rounded-lg dark:border-gray-700 p-4">
                  {filteredUsers.length > 0 ? (
                    filteredUsers.map(user => (
                      <div key={user.id} className="flex items-center p-3 border-b border-gray-100 dark:border-gray-800 last:border-b-0 hover:bg-gray-50 dark:hover:bg-gray-900/50 rounded-lg">
                        <input
                          type="checkbox"
                          id={`user-${user.id}`}
                          checked={selectedParticipants.includes(user.id)}
                          onChange={() => toggleParticipant(user.id)}
                          className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500 border-gray-300 dark:border-gray-600"
                        />
                        <label 
                          htmlFor={`user-${user.id}`}
                          className="ml-3 text-sm text-gray-700 dark:text-gray-300 flex-1 cursor-pointer"
                        >
                          <div className="font-medium">{user.name}</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 capitalize">{user.role}</div>
                          {user.ministry && (
                            <div className="text-xs text-gray-400 dark:text-gray-500">{user.ministry}</div>
                          )}
                        </label>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-4 text-gray-500 dark:text-gray-400">
                      {participantSearch ? 'No users found matching your search' : 'No users available'}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={closeModal}
              type="button"
              className="flex w-full justify-center rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] sm:w-auto"
            >
              Cancel
            </button>
            <button
              onClick={handleAddOrUpdateEvent}
              type="button"
              className="btn btn-success btn-update-event flex w-full justify-center rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 sm:w-auto"
            >
              {selectedEvent ? "Update Meeting" : "Schedule Meeting"}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

const renderEventContent = (eventInfo: EventContentArg) => {
  const eventColor = eventInfo.event.backgroundColor || eventInfo.event.extendedProps.colour || '#3B82F6';
  
  return (
    <div 
      className="event-fc-color fc-event-main p-2 rounded-sm border-l-4"
      style={{ 
        backgroundColor: eventColor + '20',
        borderLeftColor: eventColor,
        borderColor: eventColor
      }}
    >
      <div className="fc-event-time text-xs font-bold mb-1" style={{ color: eventColor }}>
        {eventInfo.timeText}
      </div>
      <div className="fc-event-title text-sm font-medium truncate" style={{ color: eventColor }}>
        {eventInfo.event.title}
      </div>
    </div>
  );
};

export default Calendar;