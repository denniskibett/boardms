"use client";
import React from 'react';
import { User, Users } from 'lucide-react';

interface Participant {
  id: string;
  name: string;
  email: string;
  role: string;
  image?: string;
  user?: {
    name: string;
    image?: string;
  };
}

interface Meeting {
  chair_name?: string;
  chair_role?: string;
  chair_image?: string;
  participants?: Participant[];
}

interface MeetingInviteesProps {
  meeting: Meeting;
}

const MeetingInvitees: React.FC<MeetingInviteesProps> = ({ meeting }) => {
  const totalParticipants = meeting.participants?.length || 0;
  const visibleCount = Math.max(1, Math.floor(totalParticipants / 3));
  const visibleParticipants = meeting.participants?.slice(0, visibleCount) || [];
  const hiddenParticipants = meeting.participants?.slice(visibleCount) || [];

  // Function to get initials (first letters of first two words)
  const getInitials = (name: string) => {
    if (!name) return "?";
    const words = name.trim().split(" ").filter(word => word.length > 0);
    if (words.length >= 2) {
      return words.slice(0, 2).map(w => w[0]?.toUpperCase() || '').join("");
    }
    return name.charAt(0).toUpperCase();
  };

  // Function to generate consistent color based on name
  const getAvatarColor = (name: string) => {
    const colors = [
      'bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-orange-500', 
      'bg-red-500', 'bg-teal-500', 'bg-indigo-500', 'bg-pink-500'
    ];
    const index = name.length % colors.length;
    return colors[index];
  };

  // Helper function to get participant display name
  const getDisplayName = (participant: Participant) => {
    return participant.user?.name || participant.name || "Unknown";
  };

  // Helper function to get participant image
  const getParticipantImage = (participant: Participant) => {
    return participant.user?.image || participant.image || null;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-6">
      <div className="lg:col-span-12 rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/3">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90 mb-4">Invitees</h3>
        <div className="space-y-4">
          {/* Chairperson */}
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
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                Participants ({totalParticipants})
              </label>

              <div className="flex items-center -space-x-2">
                {/* Visible participants */}
                {visibleParticipants.map((participant, index) => {
                  const displayName = getDisplayName(participant);
                  const imageUrl = getParticipantImage(participant);
                  const hasImage = !!imageUrl;
                  const initials = getInitials(displayName);
                  const avatarColor = getAvatarColor(displayName);
                  
                  return (
                    <div key={participant.id || index} className="relative group">
                      <div className={`w-8 h-8 overflow-hidden border-2 border-white rounded-full dark:border-gray-900 flex items-center justify-center cursor-pointer ${hasImage ? 'bg-gray-200' : avatarColor}`}>
                        {hasImage ? (
                          <img
                            src={imageUrl}
                            alt={displayName}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              // If image fails to load, show initials instead
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
                        {participant.role && (
                          <div className="text-gray-300 text-xs mt-0.5">
                            {participant.role}
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
                          <li key={p.id || i} className="truncate">{getDisplayName(p)} - {p.role || "Unknown"}</li>
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
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MeetingInvitees;