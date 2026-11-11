// src/components/meetings/MeetingCalendar.tsx
"use client";
import React, { useEffect, useRef, useState } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import { EventInput, DateSelectArg, EventClickArg, EventContentArg } from "@fullcalendar/core";
import { Clock, Loader2, MapPin } from "lucide-react";

interface MeetingCalendarProps {
  events?: EventInput[];
  loading?: boolean;
  settings?: { timezone?: string; date_format?: string; time_format?: string };
  /** Called with YYYY-MM-DD when a date range is selected; omit to disable selection. */
  onDateSelect?: (date: string) => void;
  /** Called with the clicked meeting's id. */
  onEventClick?: (event: { id: string }) => void;
}

export default function MeetingCalendar({
  events = [],
  loading = false,
  settings,
  onDateSelect,
  onEventClick,
}: MeetingCalendarProps) {
  const calendarRef = useRef<FullCalendar>(null);
  const [isMobile, setIsMobile] = useState(false);
  const timezone = settings?.timezone || "Africa/Nairobi";
  const hour12 = settings?.time_format === "12";
  const timeFormat = { hour: "2-digit", minute: "2-digit", hour12, meridiem: hour12 ? "short" : false } as const;
  const selectable = !!onDateSelect;

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 639px)");
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  const handleDateSelect = (info: DateSelectArg) => onDateSelect?.(info.startStr.slice(0, 10));
  const handleEventClick = (info: EventClickArg) => onEventClick?.({ id: info.event.id });

  if (loading && events.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center text-theme-sm text-gray-500 dark:text-gray-400">
        <Loader2 className="mr-2 h-5 w-5 animate-spin text-brand-500" />
        Loading calendar…
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="custom-calendar max-w-full overflow-x-auto rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
        <FullCalendar
          ref={calendarRef}
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          headerToolbar={
            isMobile
              ? { left: "prev,next", center: "title", right: "today" }
              : { left: "prev,next today", center: "title", right: "dayGridMonth,timeGridWeek,timeGridDay" }
          }
          footerToolbar={isMobile ? { center: "dayGridMonth,timeGridWeek,timeGridDay" } : undefined}
          height="auto"
          events={events}
          selectable={selectable}
          select={handleDateSelect}
          eventClick={handleEventClick}
          eventContent={renderEventContent}
          timeZone={timezone}
          eventTimeFormat={timeFormat}
          slotLabelFormat={timeFormat}
          dayHeaderFormat={{ weekday: "short" }}
          eventDisplay="block"
          displayEventTime
          displayEventEnd={false}
          nextDayThreshold="00:00:00"
          nowIndicator
        />
      </div>
      <p className="flex items-center gap-1.5 text-theme-xs text-gray-500 dark:text-gray-400">
        <Clock className="h-3.5 w-3.5" />
        Times shown in {timezone}.{selectable ? " Select a date to schedule a meeting." : ""}
      </p>
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
      title={[eventInfo.event.title, location, timeText].filter(Boolean).join(" · ")}
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

    </div>
  );
};