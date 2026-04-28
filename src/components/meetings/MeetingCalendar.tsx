// src/components/meetings/MeetingCalendar.tsx
"use client";
import React, { useRef, useEffect, useState, useCallback } from "react";
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
  Loader2, 
  Globe, 
  Clock,
  RefreshCw,
  MapPin,
  Calendar as CalendarIcon,
  ChevronDown
} from "lucide-react";

interface MeetingCalendarProps {
  events: EventInput[];
  loading?: boolean;
  settings?: {
    timezone: string;
    date_format: string;
    time_format: '12' | '24';
  };
  onDateSelect?: (date: string) => void;
  onEventClick?: (event: any) => void;
  onTimeFormatChange?: (format: '12' | '24') => void;
}

export default function MeetingCalendar({ 
  events, 
  loading = false, 
  settings: propSettings, 
  onDateSelect, 
  onEventClick,
  onTimeFormatChange
}: MeetingCalendarProps) {
  const calendarRef = useRef<FullCalendar>(null);
  
  // Use provided settings or defaults
  const [localTimeFormat, setLocalTimeFormat] = useState<'12' | '24'>(
    propSettings?.time_format || '24'
  );
  
  const systemSettings = {
    timezone: propSettings?.timezone || 'Africa/Nairobi',
    date_format: propSettings?.date_format || 'DD/MM/YYYY',
    time_format: localTimeFormat
  };
  
  const [currentTime, setCurrentTime] = useState(new Date());
  const [showTimeFormatMenu, setShowTimeFormatMenu] = useState(false);
  const timeFormatMenuRef = useRef<HTMLDivElement>(null);

  // Real-time clock update
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Close time format menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (timeFormatMenuRef.current && !timeFormatMenuRef.current.contains(event.target as Node)) {
        setShowTimeFormatMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleTimeFormatChange = (format: '12' | '24') => {
    setLocalTimeFormat(format);
    setShowTimeFormatMenu(false);
    
    // Call the callback if provided
    if (onTimeFormatChange) {
      onTimeFormatChange(format);
    }
    
    // Refresh the calendar to apply new time format
    if (calendarRef.current) {
      const calendarApi = calendarRef.current.getApi();
      calendarApi.setOption('eventTimeFormat', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: format === '12',
        meridiem: format === '12' ? 'short' : false
      });
      calendarApi.setOption('slotLabelFormat', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: format === '12',
        meridiem: format === '12' ? 'short' : false
      });
    }
  };

  const handleDateSelect = (selectInfo: DateSelectArg) => {
    if (onDateSelect) {
      onDateSelect(selectInfo.startStr);
    }
  };

  const handleEventClick = (clickInfo: EventClickArg) => {
    if (onEventClick) {
      onEventClick({
        id: clickInfo.event.id,
        name: clickInfo.event.title,
        type: clickInfo.event.extendedProps.type,
        start_at: clickInfo.event.start?.toISOString(),
        period: clickInfo.event.extendedProps.period,
        location: clickInfo.event.extendedProps.location,
        chair_id: clickInfo.event.extendedProps.chair_id,
        status: clickInfo.event.extendedProps.status,
        description: clickInfo.event.extendedProps.description,
        colour: clickInfo.event.extendedProps.colour
      });
    }
  };

  // Format date according to system settings
  const formatDisplayDate = useCallback((date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    
    switch(systemSettings.date_format) {
      case 'DD/MM/YYYY':
        return `${day}/${month}/${year}`;
      case 'MM/DD/YYYY':
        return `${month}/${day}/${year}`;
      case 'YYYY-MM-DD':
      default:
        return `${year}-${month}-${day}`;
    }
  }, [systemSettings.date_format]);

  // Format time according to system settings
  const formatDisplayTime = useCallback((date: Date) => {
    return date.toLocaleTimeString('en-US', {
      timeZone: systemSettings.timezone,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: systemSettings.time_format === '12'
    });
  }, [systemSettings.timezone, systemSettings.time_format]);

  // Get FullCalendar date format based on system settings
  const getDayHeaderFormat = useCallback(() => {
    const dateFormat = systemSettings.date_format;
    
    if (dateFormat === 'DD/MM/YYYY') {
      return { weekday: 'short', day: 'numeric', month: 'numeric' }; // "Mon 14/04"
    } else if (dateFormat === 'MM/DD/YYYY') {
      return { weekday: 'short', month: 'numeric', day: 'numeric' }; // "Mon 04/14"
    } else {
      return { weekday: 'short', month: 'numeric', day: 'numeric', omitCommas: true };
    }
  }, [systemSettings.date_format]);

  if (loading && events.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        <span className="ml-2 text-gray-600 dark:text-gray-400">Loading calendar...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Timezone Info Card */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl border border-blue-200 dark:border-blue-800 p-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/40 rounded-lg">
              <Globe className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                System Timezone: <span className="font-bold">{systemSettings.timezone}</span>
              </h3>
              <p className="text-xs text-gray-600 dark:text-gray-400 flex items-center gap-1">
                <Clock size={12} className="animate-pulse" />
                All times are displayed in your system timezone
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="text-sm font-semibold text-gray-900 dark:text-white">
                {formatDisplayDate(currentTime)}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                Date Format: {systemSettings.date_format}
              </div>
            </div>
            <div className="h-8 w-px bg-gray-300 dark:bg-gray-700"></div>
            <div className="text-right relative" ref={timeFormatMenuRef}>
              <div 
                className="flex items-center gap-2 cursor-pointer group"
                onClick={() => setShowTimeFormatMenu(!showTimeFormatMenu)}
              >
                <div>
                  <div className="text-2xl font-bold text-blue-600 dark:text-blue-400 font-mono tabular-nums">
                    {formatDisplayTime(currentTime)}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center justify-end gap-1">
                    <RefreshCw size={10} className="animate-spin-slow" />
                    <span className="flex items-center gap-1">
                      Real-time 
                      <span className="inline-flex items-center gap-1 ml-1 px-1.5 py-0.5 bg-blue-100 dark:bg-blue-900/40 rounded-full text-blue-600 dark:text-blue-400 group-hover:bg-blue-200 dark:group-hover:bg-blue-800/60 transition-colors">
                        {systemSettings.time_format === '12' ? '12h' : '24h'}
                        <ChevronDown size={12} className={`transform transition-transform ${showTimeFormatMenu ? 'rotate-180' : ''}`} />
                      </span>
                    </span>
                  </div>
                </div>
              </div>

              {/* Time Format Dropdown Menu */}
              {showTimeFormatMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden z-50">
                  <div className="py-1">
                    <button
                      onClick={() => handleTimeFormatChange('24')}
                      className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center justify-between ${
                        systemSettings.time_format === '24' 
                          ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20' 
                          : 'text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      <span>24-hour format</span>
                      {systemSettings.time_format === '24' && (
                        <span className="text-xs">✓</span>
                      )}
                    </button>
                    <button
                      onClick={() => handleTimeFormatChange('12')}
                      className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center justify-between ${
                        systemSettings.time_format === '12' 
                          ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20' 
                          : 'text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      <span>12-hour format</span>
                      {systemSettings.time_format === '12' && (
                        <span className="text-xs">✓</span>
                      )}
                    </button>
                  </div>
                  <div className="border-t border-gray-200 dark:border-gray-700 px-4 py-2 bg-gray-50 dark:bg-gray-900/50">
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Example: {new Date().toLocaleTimeString('en-US', {
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: systemSettings.time_format === '12'
                      })}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Calendar */}
      <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] overflow-hidden">
        <div className="custom-calendar">
          <FullCalendar
            ref={calendarRef}
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
            initialView="dayGridMonth"
            headerToolbar={{
              left: "prev,next today",
              center: "title",
              right: "dayGridMonth,timeGridWeek,timeGridDay",
            }}
            events={events}
            selectable={true}
            select={handleDateSelect}
            eventClick={handleEventClick}
            eventContent={renderEventContent}
            timeZone={systemSettings.timezone}
            eventTimeFormat={{
              hour: '2-digit',
              minute: '2-digit',
              hour12: systemSettings.time_format === '12',
              meridiem: systemSettings.time_format === '12' ? 'short' : false
            }}
            dayHeaderFormat={getDayHeaderFormat()}
            slotLabelFormat={{
              hour: '2-digit',
              minute: '2-digit',
              hour12: systemSettings.time_format === '12',
              meridiem: systemSettings.time_format === '12' ? 'short' : false
            }}
            eventDisplay="block"
            displayEventTime={true}
            displayEventEnd={true}
            nextDayThreshold="00:00:00"
            slotEventOverlap={true}
            nowIndicator={true}
            now={new Date().toISOString()}
          />
        </div>
      </div>

      {/* Event Legend */}
      <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-full bg-blue-500"></div>
          <span>Cabinet Meetings</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-full bg-green-500"></div>
          <span>Committee Meetings</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-full bg-purple-500"></div>
          <span>Special Sessions</span>
        </div>
        <div className="flex items-center gap-1 ml-auto">
          <Clock size={12} />
          <span>All times in {systemSettings.timezone}</span>
        </div>
      </div>
    </div>
  );
}

function hexToRGBA(hex: string, alpha = 1) {
  hex = hex.replace('#', '');
  if (hex.length === 3) {
    hex = hex.split('').map(char => char + char).join('');
  }
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

const renderEventContent = (eventInfo: EventContentArg) => {
  const colour = eventInfo.event.extendedProps.colour || '#3b82f6';
  const location = eventInfo.event.extendedProps.location;
  const status = eventInfo.event.extendedProps.status;
  const timeText = eventInfo.timeText || '';
  
  return (
    <div
      className="event-fc-color flex fc-event-main p-2 rounded-sm shadow-sm cursor-pointer hover:shadow-md transition-all duration-200 relative group"
      style={{
        backgroundColor: hexToRGBA(colour, 0.1)
      }}
    >
      {/* Event dot for visual indicator */}
      <div
        className="fc-daygrid-event-dot mr-1 mt-[4px]"
        style={{ borderColor: colour, backgroundColor: colour }}
      ></div>

      {/* Event content */}
      <div className="flex-1 min-w-0">
        {/* Time */}
        {timeText && (
          <div className="fc-event-time text-xs font-semibold text-gray-600 dark:text-gray-400 truncate">
            {timeText}
          </div>
        )}

        {/* Title */}
        <div className="fc-event-title text-sm font-medium text-gray-800 dark:text-white truncate">
          {eventInfo.event.title}
        </div>

        {/* Location */}
        {location && (
          <div className="fc-event-location text-xs text-gray-500 dark:text-gray-400 truncate opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
            <MapPin size={8} />
            <span className="truncate">{location}</span>
          </div>
        )}

        {/* Status */}
        {status && (
          <div className="fc-event-status text-xs text-gray-500 dark:text-gray-400 truncate flex items-center gap-1">
            <div
              className="w-1.5 h-1.5 rounded-full flex-shrink-0"
              style={{ backgroundColor: colour }}
            />
            <span className="truncate">{status}</span>
          </div>
        )}
      </div>

      {/* Tooltip */}
      <div className="absolute hidden group-hover:block z-50 bg-gray-900 text-white text-xs rounded py-1 px-2 -top-8 left-0 whitespace-nowrap">
        {eventInfo.event.title}
        {location && ` • ${location}`}
        {timeText && ` • ${timeText}`}
      </div>
    </div>
  );
};