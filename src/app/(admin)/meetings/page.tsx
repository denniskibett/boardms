// src/app/(admin)/meetings/page.tsx
"use client";
import { useState, useMemo } from "react";
import { useSystemSettings } from "@/context/SystemSettingsContext";
import { useMeetingsData } from "@/hooks/useMeetingsData";
import MeetingCalendar from "@/components/meetings/MeetingCalendar";
import UpcomingMeetings from "@/components/meetings/UpcomingMeetings";
import MeetingTable from "@/components/meetings/MeetingTable";
import MeetingFormModal from "@/components/meetings/MeetingFormModal";
import {
  Calendar,
  LayoutGrid,
  Table,
  Plus,
  RefreshCw,
  TrendingUp,
  Loader2
} from "lucide-react";

type ViewMode = 'calendar' | 'table' | 'cards';

export default function MeetingCalendarPage() {
  const { getPrimaryColor, getSecondaryColor } = useSystemSettings();
  const [viewMode, setViewMode] = useState<ViewMode>('calendar');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [selectedDate, setSelectedDate] = useState<string>("");
  
  // Use our cached data hook
  const {
    meetings,
    upcomingMeetings,
    pastMeetings,
    calendarEvents,
    stats,
    categories,
    users,
    settings,
    loading,
    refreshAll
  } = useMeetingsData();

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    type: "",
    start_at: "",
    start_time: "",
    period: "60",
    location: "",
    chair_id: "",
    status: "",
    description: "",
    colour: "#3b82f6"
  });

  const handleScheduleMeeting = (date?: string) => {
    setSelectedEvent(null);
    
    // Pre-fill with today's date
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    let hour = now.getHours();
    const minute = String(now.getMinutes()).padStart(2, '0');
    
    if (parseInt(minute) > 30) {
      hour = (hour + 1) % 24;
    }
    
    setFormData({
      name: "",
      type: "",
      start_at: date || `${year}-${month}-${day}`,
      start_time: `${String(hour).padStart(2, '0')}:00`,
      period: "60",
      location: "",
      chair_id: "",
      status: "",
      description: "",
      colour: "#3b82f6"
    });
    setIsModalOpen(true);
  };

  const handleEditMeeting = (meeting: any) => {
    setSelectedEvent(meeting);
    
    let dateStr = meeting.start_at;
    let year, month, day, hour, minute;
    
    if (dateStr.includes('T')) {
      [year, month, day] = dateStr.split('T')[0].split('-').map(Number);
      [hour, minute] = dateStr.split('T')[1].split(':').map(Number);
    } else {
      const [datePart, timePart] = dateStr.split(' ');
      [year, month, day] = datePart.split('-').map(Number);
      [hour, minute] = timePart.split(':').map(Number);
    }
    
    setFormData({
      name: meeting.name || "",
      type: meeting.type || "",
      start_at: `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
      start_time: `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`,
      period: meeting.period?.toString() || "60",
      location: meeting.location || "",
      chair_id: meeting.chair_id?.toString() || "",
      status: meeting.status || "",
      description: meeting.description || "",
      colour: meeting.colour || "#3b82f6"
    });
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedEvent(null);
    refreshAll();
  };

  // Get view stats
  const viewStats = useMemo(() => {
    switch(viewMode) {
      case 'calendar':
        return { label: 'Events this month', value: stats?.thisMonth ?? 0 };
      case 'table':
        return { label: 'Total meetings', value: stats?.total ?? 0 };
      case 'cards':
        return { label: 'Upcoming', value: upcomingMeetings.length };
    }
  }, [viewMode, stats, upcomingMeetings]);

  // if (loading && meetings.length === 0) {
  //   return (
  //     <div className="flex items-center justify-center min-h-screen">
  //       <div className="text-center">
  //         <Loader2 className="h-12 w-12 animate-spin text-blue-500 mx-auto mb-4" />
  //         <p className="text-gray-600 dark:text-gray-400">Loading meetings...</p>
  //       </div>
  //     </div>
  //   );
  // }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Meeting Calendar
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            View and manage all scheduled cabinet and committee meetings
          </p>
        </div>
      </div>

      {/* Main Card */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        {/* Card Header */}
        <div className="border-b border-gray-200 dark:border-gray-700">
          <div className="px-6 py-4 bg-gradient-to-r from-gray-50 to-white dark:from-gray-800/50 dark:to-gray-800">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              {/* Stats */}
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg" style={{ backgroundColor: getPrimaryColor() + '20' }}>
                    {viewMode === 'calendar' && <Calendar size={20} style={{ color: getPrimaryColor() }} />}
                    {viewMode === 'table' && <Table size={20} style={{ color: getPrimaryColor() }} />}
                    {viewMode === 'cards' && <LayoutGrid size={20} style={{ color: getPrimaryColor() }} />}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <div className="text-2xl font-bold text-gray-900 dark:text-white">
                        {viewStats.value}
                      </div>
                      <span className="text-xs text-green-600 bg-green-100 dark:bg-green-900/20 dark:text-green-400 px-2 py-1 rounded-full flex items-center gap-1">
                        <TrendingUp size={12} />
                        +12%
                      </span>
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {viewStats.label}
                    </div>
                  </div>
                </div>
                
                <div className="h-8 w-px bg-gray-200 dark:bg-gray-700"></div>
                
                {/* Quick Stats */}
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-500"></div>
                    <span className="text-xs text-gray-600 dark:text-gray-400">
                      Today: <span className="font-medium text-gray-900 dark:text-white ml-1">{stats?.today ?? 0}</span>
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                    <span className="text-xs text-gray-600 dark:text-gray-400">
                      This week: <span className="font-medium text-gray-900 dark:text-white ml-1">{stats?.thisWeek ?? 0}</span>
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-purple-500"></div>
                    <span className="text-xs text-gray-600 dark:text-gray-400">
                      This month: <span className="font-medium text-gray-900 dark:text-white ml-1">{stats?.thisMonth ?? 0}</span>
                    </span>
                  </div>
                </div>
              </div>

              {/* Tabs and Actions */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                <div className="flex space-x-1 bg-gray-100 dark:bg-gray-700 rounded-lg p-1 order-2 sm:order-1">
                  <button
                    onClick={() => setViewMode('calendar')}
                    className={`px-4 py-2 text-sm font-medium rounded-md transition-colors flex items-center gap-2 ${
                      viewMode === 'calendar'
                        ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                    }`}
                  >
                    <Calendar size={16} />
                    Calendar
                  </button>
                  <button
                    onClick={() => setViewMode('table')}
                    className={`px-4 py-2 text-sm font-medium rounded-md transition-colors flex items-center gap-2 ${
                      viewMode === 'table'
                        ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                    }`}
                  >
                    <Table size={16} />
                    Table
                  </button>
                  <button
                    onClick={() => setViewMode('cards')}
                    className={`px-4 py-2 text-sm font-medium rounded-md transition-colors flex items-center gap-2 ${
                      viewMode === 'cards'
                        ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                    }`}
                  >
                    <LayoutGrid size={16} />
                    Upcoming Meetings
                  </button>
                </div>

                <div className="flex items-center gap-2 order-1 sm:order-2">
                  <button
                    onClick={refreshAll}
                    className="p-2 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                    title="Refresh"
                    disabled={loading}
                  >
                    <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
                  </button>

                  <button
                    onClick={() => handleScheduleMeeting()}
                    className="px-4 py-2 text-sm font-medium text-white rounded-lg flex items-center gap-2 transition-all hover:scale-105"
                    style={{ backgroundColor: getPrimaryColor() }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = getSecondaryColor()}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = getPrimaryColor()}
                  >
                    <Plus size={16} />
                    Schedule Meeting
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Card Body */}
        <div className="p-6">
          {viewMode === 'calendar' && (
            <MeetingCalendar 
              events={calendarEvents}
              loading={loading}
              settings={settings}
              onDateSelect={(date) => handleScheduleMeeting(date)}
              onEventClick={handleEditMeeting}
            />
          )}
          {viewMode === 'table' && (
            <MeetingTable 
              meetings={meetings}
              loading={loading}
              onEdit={handleEditMeeting}
              onRefresh={refreshAll}
            />
          )}
          {viewMode === 'cards' && (
            <UpcomingMeetings 
              meetings={upcomingMeetings}
              pastMeetings={pastMeetings}
              allMeetings={meetings}
              loading={loading}
              onEdit={handleEditMeeting}
              onRefresh={refreshAll}
              settings={settings}
            />
          )}
        </div>
      </div>

      {/* Meeting Form Modal */}
      <MeetingFormModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        formData={formData}
        setFormData={setFormData}
        selectedEvent={selectedEvent}
        onSuccess={handleModalClose}
        cachedData={{
          locations: categories.locations,
          meetingTypes: categories.meetingTypes,
          meetingStatuses: categories.meetingStatuses,
          colours: categories.colours,
          users: users,
          settings: settings
        }}
      />
    </div>
  );
}