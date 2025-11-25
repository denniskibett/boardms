"use client";
import React, { useState, useEffect, useCallback } from 'react';
import { User, Users, RefreshCw, Loader2 } from 'lucide-react';
import { useParams } from 'next/navigation'; // ADD THIS IMPORT

interface Participant {
  id: string;
  meeting_id: string;
  name: string;
  email: string;
  role: string;
  image?: string;
  user?: {
    id: string;
    name: string;
    email: string;
    role: string;
    image?: string;
  };
}

interface Meeting {
  id: string;
  chair_name?: string;
  chair_role?: string;
  chair_image?: string;
  participants?: Participant[];
}

interface MeetingInviteesProps {
  meeting: Meeting;
  realTimeUpdates?: boolean;
  reloadInterval?: number;
  maxReloads?: number;
}

const MeetingInvitees: React.FC<MeetingInviteesProps> = ({ 
  meeting, 
  realTimeUpdates = true,
  reloadInterval = 1000,
  maxReloads = 5
}) => {
  // FIXED: Get the actual meeting ID from the URL
  const params = useParams();
  const urlMeetingId = params.id as string;
  
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [reloadCount, setReloadCount] = useState(0);
  const [isAutoReloading, setIsAutoReloading] = useState(false);

  // FIXED: Use URL meeting ID as the source of truth
  const currentMeetingId = urlMeetingId || meeting.id;

  const totalParticipants = participants.length;
  const visibleCount = Math.max(1, Math.floor(totalParticipants / 3));
  const visibleParticipants = participants.slice(0, visibleCount);
  const hiddenParticipants = participants.slice(visibleCount);

  // FIXED: Always use the URL meeting ID for API calls
  const fetchParticipants = useCallback(async (): Promise<Participant[]> => {
    try {
      console.log(`🔍 Fetching participants for ACTUAL meeting ID: ${currentMeetingId}`);
      
      const response = await fetch(`/api/meetings/${currentMeetingId}/participants`);
      if (!response.ok) {
        throw new Error(`Failed to fetch participants for meeting ${currentMeetingId}`);
      }
      const data = await response.json();
      
      // Validate that we only get participants for this specific meeting
      const validatedData = data
        .filter((participant: any) => {
          const isForThisMeeting = participant.meeting_id === currentMeetingId.toString();
          if (!isForThisMeeting) {
            console.warn(`⚠️ Filtered out participant from wrong meeting:`, {
              participantMeetingId: participant.meeting_id,
              currentMeetingId: currentMeetingId
            });
          }
          return isForThisMeeting;
        })
        .map((participant: any) => ({
          id: participant.id,
          meeting_id: participant.meeting_id,
          name: participant.user?.name || participant.name || 'Unknown',
          email: participant.user?.email || participant.email || '',
          role: participant.user?.role || participant.role || 'Participant',
          image: participant.user?.image || participant.image,
          user: participant.user ? {
            id: participant.user.id,
            name: participant.user.name,
            email: participant.user.email,
            role: participant.user.role,
            image: participant.user.image
          } : undefined
        }));
      
      console.log(`✅ Validated ${validatedData.length} participants for ACTUAL meeting ${currentMeetingId}`);
      return validatedData;
    } catch (error) {
      console.error('❌ Error fetching participants:', error);
      return participants;
    }
  }, [currentMeetingId, participants]);

  // FIXED: Use currentMeetingId in reload function
  const reloadParticipants = useCallback(async (isManual = false) => {
    if (isLoading && !isManual) return;
    
    setIsLoading(true);
    try {
      const newParticipants = await fetchParticipants();
      setParticipants(newParticipants);
      setLastUpdate(new Date());
      
      if (!isManual) {
        setReloadCount(prev => prev + 1);
      } else {
        setReloadCount(0);
      }
      
      console.log(`🔄 Participants reloaded for ACTUAL meeting ${currentMeetingId} (${isManual ? 'manual' : 'auto'}) - Count: ${newParticipants.length}`);
    } catch (error) {
      console.error('Failed to reload participants:', error);
    } finally {
      setIsLoading(false);
    }
  }, [fetchParticipants, isLoading, currentMeetingId]);

  // Auto-reload effect - FIXED: use currentMeetingId
  useEffect(() => {
    if (!realTimeUpdates) return;

    let intervalId: NodeJS.Timeout;
    
    if (reloadCount < maxReloads) {
      setIsAutoReloading(true);
      intervalId = setInterval(() => {
        reloadParticipants(false);
      }, reloadInterval);
    } else {
      setIsAutoReloading(false);
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [realTimeUpdates, reloadInterval, maxReloads, reloadCount, reloadParticipants]);

  // FIXED: Reset when URL meeting ID changes
  useEffect(() => {
    console.log(`🔄 URL Meeting ID changed to: ${urlMeetingId}, resetting participants`);
    setParticipants([]); // Clear previous meeting's participants
    setReloadCount(0);
    reloadParticipants(true);
  }, [urlMeetingId]); // Watch URL meeting ID changes

  // FIXED: Initial load uses URL meeting ID
  useEffect(() => {
    console.log(`📥 Initial load for ACTUAL meeting ${currentMeetingId}`);
    reloadParticipants(true);
  }, []); // Load once on mount

  // ... (rest of your functions remain the same - getInitials, getAvatarColor, etc.)

  const getInitials = (name: string) => {
    if (!name) return "?";
    const words = name.trim().split(" ").filter(word => word.length > 0);
    if (words.length >= 2) {
      return words.slice(0, 2).map(w => w[0]?.toUpperCase() || '').join("");
    }
    return name.charAt(0).toUpperCase();
  };

  const getAvatarColor = (name: string) => {
    const colors = [
      'bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-orange-500', 
      'bg-red-500', 'bg-teal-500', 'bg-indigo-500', 'bg-pink-500'
    ];
    const index = name.length % colors.length;
    return colors[index];
  };

  const getDisplayName = (participant: Participant) => {
    return participant.user?.name || participant.name || "Unknown";
  };

  const getParticipantImage = (participant: Participant) => {
    return participant.user?.image || participant.image || null;
  };

  const getParticipantRole = (participant: Participant) => {
    return participant.user?.role || participant.role || "Participant";
  };

  const formatImageUrl = (imageUrl: string | undefined) => {
    if (!imageUrl) return null;
    if (imageUrl.startsWith('http') || imageUrl.startsWith('/')) {
      return imageUrl;
    }
    return `/meetings/${imageUrl}`;
  };

  const formatLastUpdate = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-6">
      <div className="lg:col-span-12 rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/3">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">Invitees</h3>
          
          {/* Refresh Controls */}
          <div className="flex items-center gap-3">
            {realTimeUpdates && (
              <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                {isAutoReloading ? (
                  <div className="flex items-center gap-1">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    <span>Auto-updating...</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span>Live</span>
                  </div>
                )}
                <span>•</span>
                <span>Updated: {formatLastUpdate(lastUpdate)}</span>
              </div>
            )}
            
            <button
              onClick={() => reloadParticipants(true)}
              disabled={isLoading}
              className="flex items-center gap-2 px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg disabled:opacity-50 transition-colors"
              title="Refresh participants"
            >
              {isLoading ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <RefreshCw className="h-3 w-3" />
              )}
              Refresh
            </button>
          </div>
        </div>

        <div className="space-y-4">
          {/* FIXED: Use meeting data but prioritize URL ID */}
          {meeting.chair_name && (
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Chair Person</label>
              <div className="flex items-center mt-1">
                <div className="w-8 h-8 overflow-hidden border-2 border-white rounded-full dark:border-gray-900 bg-gray-200 flex items-center justify-center mr-3">
                  {meeting.chair_image ? (
                    <img
                      src={meeting.chair_image}
                      alt={meeting.chair_name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User className="h-4 w-4 text-gray-600" />
                  )}
                </div>
                <div>
                  <p className="text-sm text-gray-900 dark:text-white">{meeting.chair_name}</p>
                  {meeting.chair_role && (
                    <p className="text-xs text-gray-500 dark:text-gray-400">{meeting.chair_role}</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Participants */}
          {totalParticipants > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Participants ({totalParticipants})
                </label>
                {realTimeUpdates && reloadCount > 0 && (
                  <span className="text-xs text-blue-600 dark:text-blue-400">
                    Auto-updated {reloadCount}/{maxReloads} times
                  </span>
                )}
              </div>

              <div className="flex items-center -space-x-2">
                {/* Visible participants */}
                {visibleParticipants.map((participant, index) => {
                  const displayName = getDisplayName(participant);
                  const imageUrl = formatImageUrl(getParticipantImage(participant));
                  const hasImage = !!imageUrl;
                  const initials = getInitials(displayName);
                  const avatarColor = getAvatarColor(displayName);
                  
                  return (
                    <div key={participant.id || `participant-${index}`} className="relative group">
                      <div className={`w-8 h-8 overflow-hidden border-2 border-white rounded-full dark:border-gray-900 flex items-center justify-center cursor-pointer ${hasImage ? 'bg-gray-200' : avatarColor}`}>
                        {hasImage ? (
                          <img
                            src={imageUrl}
                            alt={displayName}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                              const parent = e.currentTarget.parentElement;
                              if (parent) {
                                const fallback = document.createElement('div');
                                fallback.className = `w-full h-full flex items-center justify-center text-white text-xs font-bold ${avatarColor}`;
                                fallback.textContent = initials;
                                parent.appendChild(fallback);
                              }
                            }}
                          />
                        ) : (
                          <span className="text-xs font-bold text-white">
                            {initials}
                          </span>
                        )}
                      </div>

                      {/* Tooltip showing name */}
                      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap pointer-events-none z-10">
                        {displayName}
                        {getParticipantRole(participant) && (
                          <div className="text-gray-300 text-xs mt-0.5">
                            {getParticipantRole(participant)}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}

                {/* Remaining participants under +X */}
                {hiddenParticipants.length > 0 && (
                  <div className="relative group w-8 h-8 bg-gray-100 border-2 border-white rounded-full dark:border-gray-900 dark:bg-gray-700 flex items-center justify-center cursor-pointer">
                    <span className="text-xs font-medium text-gray-600 dark:text-gray-300">
                      +{hiddenParticipants.length}
                    </span>

                    {/* Hover popover with remaining names */}
                    <div className="absolute bottom-10 left-1/2 -translate-x-1/2 bg-white dark:bg-gray-800 shadow-lg border border-gray-200 dark:border-gray-700 rounded-lg p-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-20 w-max max-w-xs text-sm text-gray-800 dark:text-gray-200">
                      <p className="font-medium text-gray-600 dark:text-gray-300 mb-1">
                        Other Participants:
                      </p>
                      <ul className="space-y-1">
                        {hiddenParticipants.map((p, i) => (
                          <li key={p.id || `hidden-${i}`} className="truncate">
                            {getDisplayName(p)} - {getParticipantRole(p) || "Unknown"}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Empty state */}
          {totalParticipants === 0 && (
            <div className="text-center py-4">
              <Users className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-500 dark:text-gray-400">No participants added yet</p>
              <button
                onClick={() => reloadParticipants(true)}
                className="mt-2 text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400"
              >
                Check for updates
              </button>
            </div>
          )}
        </div>

       
      </div>
    </div>
  );
};

export default MeetingInvitees;