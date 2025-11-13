// components/meetings/MeetingParticipants.tsx
"use client";
import React, { useState, useEffect } from 'react';
import { 
  Users, 
  UserPlus, 
  UserCheck, 
  UserX, 
  Clock,
  Search,
  Loader2,
  X
} from 'lucide-react';

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  image?: string;
}

interface MeetingParticipant {
  id: number;
  meeting_id: number;
  user_id: number;
  rsvp_id: number | null;
  user: User;
}

interface RSVP {
  id: number;
  name: string;
  type: string;
  colour?: string;
}

interface MeetingParticipantsProps {
  meetingId: number;
  onParticipantsUpdate?: (participants: MeetingParticipant[]) => void;
  compact?: boolean;
}

const MeetingParticipants: React.FC<MeetingParticipantsProps> = ({ 
  meetingId, 
  onParticipantsUpdate,
  compact = false
}) => {
  const [participants, setParticipants] = useState<MeetingParticipant[]>([]);
  const [availableUsers, setAvailableUsers] = useState<User[]>([]);
  const [rsvpOptions, setRsvpOptions] = useState<RSVP[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUsers, setSelectedUsers] = useState<number[]>([]);

  // Fetch participants data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        
        // Fetch meeting participants
        const participantsResponse = await fetch(`/api/meetings/${meetingId}/participants`);
        if (participantsResponse.ok) {
          const participantsData = await participantsResponse.json();
          setParticipants(participantsData);
        }

        // Fetch target users (high-level roles only)
        const usersResponse = await fetch('/api/users?role=all');
        if (usersResponse.ok) {
          const usersData = await usersResponse.json();
          const targetRoleUsers = usersData.filter((user: User) => 
            ['Deputy President', 'President', 'Principal Secretary', 'Cabinet Secretary']
              .includes(user.role)
          );
          setAvailableUsers(targetRoleUsers);
        }

        // Fetch RSVP options
        const rsvpResponse = await fetch('/api/categories?type=rsvp_status');
        if (rsvpResponse.ok) {
          const rsvpData = await rsvpResponse.json();
          setRsvpOptions(rsvpData);
        }

      } catch (error) {
        console.error('Error fetching participants data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (meetingId) {
      fetchData();
    }
  }, [meetingId]);

  // Filter available users
  const filteredUsers = availableUsers.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const notAlreadyAdded = !participants.some(p => p.user_id === user.id);
    
    return matchesSearch && notAlreadyAdded;
  });

  // Add participants to meeting
  const addParticipants = async () => {
    if (selectedUsers.length === 0) return;

    try {
      setIsAdding(true);
      
      const response = await fetch(`/api/meetings/${meetingId}/participants`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_ids: selectedUsers,
        }),
      });

      if (response.ok) {
        const newParticipants = await response.json();
        setParticipants(prev => [...prev, ...newParticipants]);
        setSelectedUsers([]);
        setSearchTerm('');
        
        if (onParticipantsUpdate) {
          onParticipantsUpdate([...participants, ...newParticipants]);
        }
      } else {
        const error = await response.json();
        alert(`Failed to add participants: ${error.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error adding participants:', error);
      alert('Failed to add participants.');
    } finally {
      setIsAdding(false);
    }
  };

  // Remove participant from meeting
  const removeParticipant = async (participantId: number) => {
    if (!confirm('Are you sure you want to remove this participant?')) return;

    try {
      const response = await fetch(`/api/meetings/${meetingId}/participants/${participantId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setParticipants(prev => prev.filter(p => p.id !== participantId));
        
        if (onParticipantsUpdate) {
          onParticipantsUpdate(participants.filter(p => p.id !== participantId));
        }
      } else {
        const error = await response.json();
        alert(`Failed to remove participant: ${error.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error removing participant:', error);
      alert('Failed to remove participant');
    }
  };

  // Update participant RSVP status
  const updateParticipantRsvp = async (participantId: number, rsvpId: number) => {
    try {
      const response = await fetch(`/api/meetings/${meetingId}/participants/${participantId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ rsvp_id: rsvpId }),
      });

      if (response.ok) {
        const updatedParticipant = await response.json();
        setParticipants(prev => 
          prev.map(p => p.id === participantId ? updatedParticipant : p)
        );
        
        if (onParticipantsUpdate) {
          onParticipantsUpdate(participants.map(p => p.id === participantId ? updatedParticipant : p));
        }
      } else {
        const error = await response.json();
        alert(`Failed to update RSVP: ${error.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error updating RSVP:', error);
      alert('Failed to update RSVP status');
    }
  };

  // Toggle user selection
  const toggleUserSelection = (userId: number) => {
    setSelectedUsers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  // Get RSVP status badge
  const getRsvpBadge = (rsvpType: string) => {
    const baseClasses = "inline-flex items-center px-2 py-1 rounded-full text-xs font-medium";
    
    switch (rsvpType?.toLowerCase()) {
      case 'accepted':
        return `${baseClasses} bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300`;
      case 'declined':
        return `${baseClasses} bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300`;
      case 'tentative':
        return `${baseClasses} bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300`;
    }
  };

  // Get role badge color
  const getRoleBadge = (role: string) => {
    const baseClasses = "inline-flex items-center px-2 py-1 rounded-full text-xs font-medium";
    
    switch (role) {
      case 'President':
        return `${baseClasses} bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300`;
      case 'Deputy President':
        return `${baseClasses} bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300`;
      case 'Cabinet Secretary':
        return `${baseClasses} bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300`;
      case 'Principal Secretary':
        return `${baseClasses} bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300`;
    }
  };

  // Get RSVP status name by ID
  const getRsvpStatusName = (rsvpId: number | null) => {
    if (!rsvpId) return 'Pending';
    const rsvp = rsvpOptions.find(r => r.id === rsvpId);
    return rsvp?.name || 'Pending';
  };

  // Get user initials for avatar
  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Loading participants...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Statistics - Compact version for cards */}
      {compact ? (
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 text-center">
            <Users className="h-5 w-5 text-blue-600 dark:text-blue-400 mx-auto mb-1" />
            <p className="text-lg font-bold text-gray-900 dark:text-white">{participants.length}</p>
            <p className="text-xs text-gray-600 dark:text-gray-400">Total</p>
          </div>
          
          <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3 text-center">
            <UserCheck className="h-5 w-5 text-green-600 dark:text-green-400 mx-auto mb-1" />
            <p className="text-lg font-bold text-gray-900 dark:text-white">
              {participants.filter(p => getRsvpStatusName(p.rsvp_id) === 'Accepted').length}
            </p>
            <p className="text-xs text-gray-600 dark:text-gray-400">Accepted</p>
          </div>
        </div>
      ) : (
        /* Full version for slide-over */
        <>
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Meeting Participants
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Manage invitees and track RSVP status
              </p>
            </div>
          </div>

          {/* Add Participants Section */}
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
            <h4 className="font-medium text-gray-900 dark:text-white mb-4">
              Add Participants
            </h4>
            
            <div className="space-y-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search users by name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>

              {/* Available Users List */}
              {filteredUsers.length > 0 && (
                <div className="border border-gray-200 dark:border-gray-600 rounded-lg max-h-48 overflow-y-auto">
                  <div className="p-3 bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Available Users ({filteredUsers.length})
                    </p>
                  </div>
                  <div className="divide-y divide-gray-200 dark:divide-gray-600">
                    {filteredUsers.map(user => (
                      <div
                        key={user.id}
                        className="flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
                        onClick={() => toggleUserSelection(user.id)}
                      >
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            checked={selectedUsers.includes(user.id)}
                            onChange={() => toggleUserSelection(user.id)}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            onClick={(e) => e.stopPropagation()}
                          />
                          <div className="flex items-center gap-3">
                            {user.image ? (
                              <img 
                                src={user.image} 
                                alt={user.name}
                                className="w-8 h-8 rounded-full object-cover"
                              />
                            ) : (
                              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                <span className="text-sm font-medium text-blue-600">
                                  {getInitials(user.name)}
                                </span>
                              </div>
                            )}
                            <div>
                              <p className="text-sm font-medium text-gray-900 dark:text-white">
                                {user.name}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                {user.role}
                              </p>
                            </div>
                          </div>
                        </div>
                        <span className={getRoleBadge(user.role)}>
                          {user.role}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Add Button */}
              {selectedUsers.length > 0 && (
                <div className="flex items-center justify-between pt-2">
                  <p className="text-sm text-blue-600 dark:text-blue-400">
                    {selectedUsers.length} user(s) selected
                  </p>
                  <button
                    onClick={addParticipants}
                    disabled={isAdding}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  >
                    {isAdding ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <UserPlus className="h-4 w-4" />
                    )}
                    Add Selected
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Participants List */}
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
            <div className="p-6 border-b border-gray-200 dark:border-gray-600">
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-gray-900 dark:text-white">
                  Participants ({participants.length})
                </h4>
                <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                  <span className="flex items-center gap-1">
                    <UserCheck className="h-4 w-4 text-green-500" />
                    {participants.filter(p => getRsvpStatusName(p.rsvp_id) === 'Accepted').length}
                  </span>
                  <span className="flex items-center gap-1">
                    <UserX className="h-4 w-4 text-red-500" />
                    {participants.filter(p => getRsvpStatusName(p.rsvp_id) === 'Declined').length}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-4 w-4 text-yellow-500" />
                    {participants.filter(p => !p.rsvp_id || getRsvpStatusName(p.rsvp_id) === 'Pending').length}
                  </span>
                </div>
              </div>
            </div>
            
            {participants.length === 0 ? (
              <div className="text-center py-12">
                <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400">No participants added yet</p>
                <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
                  Add participants using the form above
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200 dark:divide-gray-600 max-h-96 overflow-y-auto">
                {participants.map(participant => (
                  <div key={participant.id} className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 flex-1">
                        {/* User Avatar */}
                        {participant.user?.image ? (
                          <img
                            src={participant.user.image}
                            alt={participant.user.name}
                            className="w-10 h-10 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                            <span className="text-sm font-medium text-blue-600">
                              {getInitials(participant.user?.name || 'U')}
                            </span>
                          </div>
                        )}

                        {/* User Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <p className="font-medium text-gray-900 dark:text-white truncate">
                              {participant.user?.name}
                            </p>
                            <span className={getRoleBadge(participant.user?.role)}>
                              {participant.user?.role}
                            </span>
                          </div>
                          <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                            {participant.user?.email}
                          </p>
                        </div>
                      </div>

                      {/* RSVP Status */}
                      <div className="flex items-center gap-3">
                        <select
                          value={participant.rsvp_id || ''}
                          onChange={(e) => updateParticipantRsvp(participant.id, parseInt(e.target.value))}
                          className="px-2 py-1 border border-gray-300 rounded text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        >
                          <option value="">Pending</option>
                          {rsvpOptions.map(rsvp => (
                            <option key={rsvp.id} value={rsvp.id}>{rsvp.name}</option>
                          ))}
                        </select>
                        
                        <button
                          onClick={() => removeParticipant(participant.id)}
                          className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                          title="Remove participant"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Full Statistics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 text-center">
              <Users className="h-6 w-6 text-blue-500 mx-auto mb-2" />
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{participants.length}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Total</p>
            </div>
            
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 text-center">
              <UserCheck className="h-6 w-6 text-green-500 mx-auto mb-2" />
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {participants.filter(p => getRsvpStatusName(p.rsvp_id) === 'Accepted').length}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Accepted</p>
            </div>
            
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 text-center">
              <UserX className="h-6 w-6 text-red-500 mx-auto mb-2" />
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {participants.filter(p => getRsvpStatusName(p.rsvp_id) === 'Declined').length}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Declined</p>
            </div>
            
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 text-center">
              <Clock className="h-6 w-6 text-yellow-500 mx-auto mb-2" />
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {participants.filter(p => !p.rsvp_id || getRsvpStatusName(p.rsvp_id) === 'Pending').length}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Pending</p>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default MeetingParticipants;