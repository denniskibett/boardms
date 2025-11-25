"use client";
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  Users, 
  UserPlus, 
  UserCheck, 
  UserX, 
  Clock,
  Search,
  Loader2,
  X,
  UsersIcon,
  RefreshCw
} from 'lucide-react';

interface User {
  id: string; // This should be auth_id (UUID)
  auth_id: string;
  name: string;
  email: string;
  role: string;
  image?: string;
}

interface Group {
  id: string;
  name: string;
  users?: User[];
}

interface MeetingParticipant {
  id: string;
  meeting_id: string;
  user_id: string | null; // UUID
  group_id: string | null;
  rsvp_id: string | null;
  type: 'individual' | 'group';
  user?: User;
  group?: Group;
  rsvp?: {
    id: string;
    name: string;
    colour?: string;
  };
}

interface RSVP {
  id: string;
  name: string;
  type: string;
  colour?: string;
}

interface MeetingParticipantsProps {
  meetingId: number;
  participants?: any[];
  onParticipantsUpdate?: (participants: any[]) => void;
  onRefresh?: () => void;
  compact?: boolean;
}

const MeetingParticipants: React.FC<MeetingParticipantsProps> = ({ 
  meetingId, 
  participants: initialParticipants = [],
  onParticipantsUpdate,
  onRefresh,
  compact = false
}) => {
  const [participants, setParticipants] = useState<MeetingParticipant[]>([]);
  const [availableUsers, setAvailableUsers] = useState<User[]>([]);
  const [availableGroups, setAvailableGroups] = useState<Group[]>([]);
  const [rsvpOptions, setRsvpOptions] = useState<RSVP[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [selectedGroups, setSelectedGroups] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<'users' | 'groups'>('users');

  const hasLoadedRef = useRef({
    users: false,
    groups: false,
    rsvp: false,
    participants: false
  });

  // FIXED: UUID validation helper
  const isValidUUID = (id: string | null | undefined): boolean => {
    if (!id) return false;
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
  };

  // FIXED: Filter and validate users to only include those with valid UUIDs
  const filterValidUsers = (users: any[]): User[] => {
    return users
      .filter(user => user && isValidUUID(user.auth_id))
      .map(user => ({
        ...user,
        id: user.auth_id, // Use auth_id as primary ID
        auth_id: user.auth_id // Keep original
      }));
  };

  // FIXED: Format participants with UUID validation
  const formatParticipants = useCallback((participantsData: any[]): MeetingParticipant[] => {
    console.log('🔄 Formatting participants data:', participantsData);
    
    return participantsData
      .filter(participant => {
        // Only include participants with valid UUID user_id or group participants
        const isValid = participant.type === 'group' || 
                       (participant.type === 'individual' && isValidUUID(participant.user_id));
        
        if (!isValid) {
          console.warn('⚠️ Filtering out invalid participant:', participant);
        }
        
        return isValid;
      })
      .map(participant => {
        let userImage = undefined;
        if (participant.user?.image) {
          userImage = participant.user.image.startsWith('/') 
            ? participant.user.image 
            : `/meetings/${participant.user.image}`;
        }

        const formatted: MeetingParticipant = {
          id: participant.id?.toString(),
          meeting_id: participant.meeting_id?.toString(),
          user_id: participant.user_id || null,
          group_id: participant.group_id?.toString() || null,
          rsvp_id: participant.rsvp_id?.toString() || participant.rsvp_status?.id?.toString() || null,
          type: participant.group_id ? 'group' : 'individual',
          user: participant.user ? {
            id: participant.user.auth_id,
            auth_id: participant.user.auth_id,
            name: participant.user.name,
            email: participant.user.email,
            role: participant.user.role,
            image: userImage
          } : undefined,
          group: participant.group,
          rsvp: participant.rsvp || participant.rsvp_status
        };

        console.log(`📝 Participant ${formatted.id}:`, {
          type: formatted.type,
          user_id: formatted.user_id,
          user: formatted.user?.name,
          rsvp_id: formatted.rsvp_id
        });

        return formatted;
      });
  }, []);

  // FIXED: Data loading with UUID validation
  const reloadAllData = useCallback(async () => {
    try {
      setIsLoading(true);
      console.log('🔄 Reloading all data with UUID validation...');
      
      hasLoadedRef.current = {
        users: false,
        groups: false,
        rsvp: false,
        participants: false
      };

      const [participantsRes, usersRes, groupsRes, rsvpRes] = await Promise.all([
        fetch(`/api/meetings/${meetingId}/participants`).then(res => {
          if (!res.ok) throw new Error(`Participants API error: ${res.status}`);
          return res.json();
        }),
        fetch('/api/users?role=all').then(res => {
          if (!res.ok) throw new Error(`Users API error: ${res.status}`);
          return res.json();
        }),
        fetch('/api/groups').then(res => {
          if (!res.ok) throw new Error(`Groups API error: ${res.status}`);
          return res.json();
        }),
        fetch('/api/categories?type=rsvp_status').then(res => {
          if (!res.ok) throw new Error(`RSVP API error: ${res.status}`);
          return res.json();
        })
      ]);

      // FIXED: Filter and validate users
      const validUsers = filterValidUsers(Array.isArray(usersRes) ? usersRes : []);
      console.log(`✅ Valid users with UUIDs: ${validUsers.length} (filtered from ${usersRes.length})`);

      // FIXED: Transform groups to ensure user IDs are valid UUIDs
      const validGroups = Array.isArray(groupsRes) ? groupsRes.map(group => ({
        ...group,
        users: filterValidUsers(group.users || [])
      })) : [];

      const formattedParticipants = formatParticipants(participantsRes);
      setParticipants(formattedParticipants);
      setAvailableUsers(validUsers);
      setAvailableGroups(validGroups);
      setRsvpOptions(Array.isArray(rsvpRes) ? rsvpRes : []);
      
      hasLoadedRef.current = {
        users: true,
        groups: true,
        rsvp: true,
        participants: true
      };

      console.log('✅ All data reloaded with UUID validation:', {
        participants: formattedParticipants.length,
        users: validUsers.length,
        groups: validGroups.length,
        rsvp: rsvpRes.length
      });
      
    } catch (error: any) {
      console.error('❌ Error reloading data:', error);
      alert(`Failed to reload data: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  }, [meetingId, formatParticipants]);

  const loadRequiredData = useCallback(async () => {
    try {
      setIsLoading(true);
      console.log('🔄 Loading required data with UUID validation...');

      const dataPromises = [];

      if (!hasLoadedRef.current.participants && initialParticipants.length === 0) {
        dataPromises.push(
          fetch(`/api/meetings/${meetingId}/participants`)
            .then(res => {
              if (!res.ok) throw new Error(`Participants API error: ${res.status}`);
              return res.json();
            })
            .then(data => {
              const formatted = formatParticipants(data);
              setParticipants(formatted);
              hasLoadedRef.current.participants = true;
              console.log('✅ Participants loaded:', formatted.length);
            })
        );
      }

      if (!hasLoadedRef.current.users) {
        dataPromises.push(
          fetch('/api/users?role=all')
            .then(res => {
              if (!res.ok) throw new Error(`Users API error: ${res.status}`);
              return res.json();
            })
            .then(data => {
              // FIXED: Filter and validate users
              const validUsers = filterValidUsers(Array.isArray(data) ? data : []);
              setAvailableUsers(validUsers);
              hasLoadedRef.current.users = true;
              console.log('✅ Valid users loaded with UUIDs:', validUsers.length);
            })
        );
      }

      if (!hasLoadedRef.current.groups) {
        dataPromises.push(
          fetch('/api/groups')
            .then(res => {
              if (!res.ok) throw new Error(`Groups API error: ${res.status}`);
              return res.json();
            })
            .then(data => {
              // FIXED: Transform groups to ensure UUID validation
              const groupsData = Array.isArray(data) ? data.map(group => ({
                ...group,
                users: filterValidUsers(group.users || [])
              })) : [];
              setAvailableGroups(groupsData);
              hasLoadedRef.current.groups = true;
              console.log('✅ Groups loaded with validated users:', groupsData.length);
            })
        );
      }

      if (!hasLoadedRef.current.rsvp) {
        dataPromises.push(
          fetch('/api/categories?type=rsvp_status')
            .then(res => {
              if (!res.ok) throw new Error(`RSVP API error: ${res.status}`);
              return res.json();
            })
            .then(data => {
              setRsvpOptions(Array.isArray(data) ? data : []);
              hasLoadedRef.current.rsvp = true;
              console.log('✅ RSVP options loaded:', data.length);
            })
        );
      }

      await Promise.all(dataPromises);
      console.log('✅ All required data loaded with UUID validation');

    } catch (error: any) {
      console.error('❌ Error loading data:', error);
      alert(`Failed to load data: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  }, [meetingId, initialParticipants, formatParticipants]);

  useEffect(() => {
    if (initialParticipants && initialParticipants.length > 0) {
      console.log('🔄 Syncing participants from parent:', initialParticipants.length);
      const formattedParticipants = formatParticipants(initialParticipants);
      setParticipants(formattedParticipants);
      hasLoadedRef.current.participants = true;
    }
  }, [initialParticipants, formatParticipants]);

  useEffect(() => {
    if (meetingId) {
      loadRequiredData();
    }
  }, [meetingId, loadRequiredData]);

  // FIXED: Filter available users and groups with UUID validation
  const filteredUsers = availableUsers
    .filter(user => 
      user?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user?.role?.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .filter(user => 
      !participants.some(p => p.user_id === user.id) // UUID comparison
    );

  const filteredGroups = availableGroups
    .filter(group =>
      group?.name?.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .filter(group => {
      if (!group.users || group.users.length === 0) return false;
      
      const usersNotInMeeting = group.users.filter(user => 
        !participants.some(p => p.user_id === user.id) // UUID comparison
      );
      
      return usersNotInMeeting.length > 0;
    });

  // FIXED: Add participants with UUID validation
  const addParticipants = useCallback(async () => {
    if (selectedUsers.length === 0 && selectedGroups.length === 0) return;

    try {
      setIsAdding(true);
      
      console.log('🔄 Adding participants with UUID validation:', {
        selectedUsers,
        selectedGroups
      });

      // Extract users from groups + individual selections
      let allUserIds = [...selectedUsers];
      
      if (selectedGroups.length > 0) {
        selectedGroups.forEach(groupId => {
          const group = availableGroups.find(g => g.id === groupId);
          if (group?.users) {
            console.log(`📝 Processing group ${group.name}:`, group.users);
            
            // Use ONLY validated UUIDs
            const groupUserIds = group.users
              .map(user => user.auth_id)
              .filter(uuid => isValidUUID(uuid));
            
            allUserIds = [...allUserIds, ...groupUserIds];
          }
        });
      }

      // Remove duplicates and validate UUIDs
      allUserIds = [...new Set(allUserIds)].filter(id => isValidUUID(id));

      console.log('📤 Final validated UUIDs to add:', allUserIds);

      if (allUserIds.length === 0) {
        alert('No valid users to add. Please check that your selections contain users with valid UUIDs.');
        return;
      }

      const response = await fetch(`/api/meetings/${meetingId}/participants`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_ids: allUserIds,
          group_ids: [],
        }),
      });

      const responseData = await response.json();

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error(`Meeting not found. Please refresh the page and try again.`);
        }
        throw new Error(responseData.error || 'Failed to add participants');
      }

      if (responseData.length === 0) {
        alert('No participants were added. They may already be in the meeting.');
        return;
      }

      const formattedNewParticipants = formatParticipants(responseData);
      
      const updatedParticipants = [...participants, ...formattedNewParticipants];
      setParticipants(updatedParticipants);
      setSelectedUsers([]);
      setSelectedGroups([]);
      setSearchTerm('');
      
      if (onParticipantsUpdate) {
        onParticipantsUpdate(updatedParticipants);
      }

      console.log('✅ Participants added successfully:', formattedNewParticipants.length);
      
      if (formattedNewParticipants.length > 0) {
        alert(`Successfully added ${formattedNewParticipants.length} participants to the meeting.`);
      }
      
      await reloadAllData();
      
    } catch (error: any) {
      console.error('❌ Error adding participants:', error);
      alert(error.message || 'Failed to add participants.');
    } finally {
      setIsAdding(false);
    }
  }, [meetingId, selectedUsers, selectedGroups, participants, availableGroups, formatParticipants, onParticipantsUpdate, reloadAllData]);

  // ... (rest of the functions remain the same - removeParticipant, updateParticipantRsvp, etc.)

  const removeParticipant = useCallback(async (participantId: string) => {
    if (!confirm('Are you sure you want to remove this participant?')) return;

    try {
      const response = await fetch(`/api/meetings/${meetingId}/participants?participantId=${participantId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to remove participant');
      }

      const updatedParticipants = participants.filter(p => p.id !== participantId);
      setParticipants(updatedParticipants);
      
      if (onParticipantsUpdate) {
        onParticipantsUpdate(updatedParticipants);
      }
      
      console.log('✅ Participant removed:', participantId);
      await reloadAllData();
      
    } catch (error: any) {
      console.error('❌ Error removing participant:', error);
      alert(error.message || 'Failed to remove participant');
    }
  }, [meetingId, participants, onParticipantsUpdate, reloadAllData]);

  const updateParticipantRsvp = useCallback(async (participantId: string, rsvpId: string) => {
    try {
      const response = await fetch(`/api/meetings/${meetingId}/participants`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          participantId,
          rsvp_id: rsvpId 
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update RSVP');
      }

      const updatedParticipantData = await response.json();
      
      const updatedParticipants = participants.map(p => 
        p.id === participantId 
          ? { ...p, rsvp_id: rsvpId, rsvp: updatedParticipantData.rsvp }
          : p
      );
      
      setParticipants(updatedParticipants);
      
      if (onParticipantsUpdate) {
        onParticipantsUpdate(updatedParticipants);
      }
      
      console.log('✅ RSVP updated for participant:', participantId);
      
    } catch (error: any) {
      console.error('❌ Error updating RSVP:', error);
      alert(error.message || 'Failed to update RSVP status');
    }
  }, [meetingId, participants, onParticipantsUpdate]);

  const toggleUserSelection = useCallback((userId: string) => {
    setSelectedUsers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  }, []);

  const toggleGroupSelection = useCallback((groupId: string) => {
    setSelectedGroups(prev => 
      prev.includes(groupId)
        ? prev.filter(id => id !== groupId)
        : [...prev, groupId]
    );
  }, []);

  const handleManualRefresh = useCallback(async () => {
    console.log('🔄 Manual refresh triggered');
    
    if (onRefresh) {
      await onRefresh();
    }
    
    await reloadAllData();
  }, [onRefresh, reloadAllData]);

  const getRsvpBadge = useCallback((rsvpType: string) => {
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
  }, []);

  const getRoleBadge = useCallback((role: string) => {
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
  }, []);

  const getRsvpStatusName = useCallback((rsvpId: string | null) => {
    if (!rsvpId) return 'Pending';
    const rsvp = rsvpOptions.find(r => r.id === rsvpId);
    return rsvp?.name || 'Pending';
  }, [rsvpOptions]);

  const getInitials = useCallback((name: string) => {
    if (!name) return "?";
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  }, []);

  const getTotalAttendeeCount = useCallback(() => {
    let count = 0;
    participants.forEach(participant => {
      if (participant.type === 'individual') {
        count += 1;
      } else if (participant.type === 'group' && participant.group?.users) {
        count += participant.group.users.length;
      }
    });
    return count;
  }, [participants]);

  const getParticipantStats = useCallback(() => {
    const individualCount = participants.filter(p => p.type === 'individual').length;
    const groupCount = participants.filter(p => p.type === 'group').length;
    const acceptedCount = participants.filter(p => getRsvpStatusName(p.rsvp_id) === 'Accepted').length;
    const declinedCount = participants.filter(p => getRsvpStatusName(p.rsvp_id) === 'Declined').length;
    const pendingCount = participants.filter(p => !p.rsvp_id || getRsvpStatusName(p.rsvp_id) === 'Pending').length;

    return {
      individualCount,
      groupCount,
      acceptedCount,
      declinedCount,
      pendingCount,
      totalAttendees: getTotalAttendeeCount()
    };
  }, [participants, getRsvpStatusName, getTotalAttendeeCount]);

  const stats = getParticipantStats();

  if (isLoading && participants.length === 0) {
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
      {compact ? (
        // Compact version for cards
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 text-center">
            <Users className="h-5 w-5 text-blue-600 dark:text-blue-400 mx-auto mb-1" />
            <p className="text-lg font-bold text-gray-900 dark:text-white">{participants.length}</p>
            <p className="text-xs text-gray-600 dark:text-gray-400">Participants</p>
          </div>
          <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3 text-center">
            <UserCheck className="h-5 w-5 text-green-600 dark:text-green-400 mx-auto mb-1" />
            <p className="text-lg font-bold text-gray-900 dark:text-white">
              {stats.acceptedCount}
            </p>
            <p className="text-xs text-gray-600 dark:text-gray-400">Accepted</p>
          </div>
        </div>
      ) : (
        // Full version for slide-over
        <>
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Meeting Participants
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {stats.individualCount} individual(s) • {stats.groupCount} group(s) • Total: {participants.length}
              </p>
            </div>
            <button
              onClick={handleManualRefresh}
              disabled={isLoading}
              className="flex items-center gap-2 px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              Refresh
            </button>
          </div>

          {/* Enhanced Debug Section */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-xs">
            <h4 className="font-semibold text-yellow-800 mb-2">Debug Info:</h4>
            <div className="grid grid-cols-2 gap-2">
              <div>Participants: {participants.length}</div>
              <div>Available Users: {availableUsers.length}</div>
              <div>Available Groups: {availableGroups.length}</div>
              <div>Filtered Groups: {filteredGroups.length}</div>
              <div>Selected Users: {selectedUsers.length}</div>
              <div>Selected Groups: {selectedGroups.length}</div>
            </div>
            <div className="mt-2">
              <div>Participant Breakdown:</div>
              <div>• Individual: {stats.individualCount}</div>
              <div>• Groups: {stats.groupCount}</div>
              <div>• Total Attendees: {stats.totalAttendees}</div>
            </div>
            <div className="mt-2">
              <div>Group Analysis:</div>
              {availableGroups.map((group, index) => {
                const existingMembers = group.users?.filter(user => 
                  participants.some(p => p.user_id === user.id)
                ) || [];
                const newMembers = group.users?.filter(user => 
                  !participants.some(p => p.user_id === user.id)
                ) || [];
                
                return (
                  <div key={group.id} className="text-xs mt-1">
                    {group.name}: {existingMembers.length} existing, {newMembers.length} new members
                  </div>
                );
              })}
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
                  placeholder="Search users or groups..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>

              {/* Tabs for Users/Groups */}
              <div className="flex border-b border-gray-200 dark:border-gray-600">
                <button
                  onClick={() => setActiveTab('users')}
                  className={`px-4 py-2 font-medium text-sm ${
                    activeTab === 'users'
                      ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400'
                      : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                  }`}
                >
                  Users ({filteredUsers.length})
                </button>
                <button
                  onClick={() => setActiveTab('groups')}
                  className={`px-4 py-2 font-medium text-sm ${
                    activeTab === 'groups'
                      ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400'
                      : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                  }`}
                >
                  Groups ({filteredGroups.length})
                  {availableGroups.length > 0 && filteredGroups.length === 0 && (
                    <span className="ml-1 text-xs text-orange-500">(all members added)</span>
                  )}
                </button>
              </div>

              {/* Available Users/Groups List */}
              {(activeTab === 'users' ? filteredUsers : filteredGroups).length > 0 && (
                <div className="border border-gray-200 dark:border-gray-600 rounded-lg max-h-48 overflow-y-auto">
                  <div className="p-3 bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Available {activeTab === 'users' ? 'Users' : 'Groups'} ({
                        activeTab === 'users' ? filteredUsers.length : filteredGroups.length
                      })
                    </p>
                  </div>
                  <div className="divide-y divide-gray-200 dark:divide-gray-600">
                    {activeTab === 'users' ? (
                      // Users list
                      filteredUsers.map(user => (
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
                                  {user.role} • {user.email}
                                </p>
                              </div>
                            </div>
                          </div>
                          <span className={getRoleBadge(user.role)}>
                            {user.role}
                          </span>
                        </div>
                      ))
                    ) : (
                      // Groups list
                      filteredGroups.map(group => (
                        <div
                          key={group.id}
                          className="flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
                          onClick={() => toggleGroupSelection(group.id)}
                        >
                          <div className="flex items-center gap-3">
                            <input
                              type="checkbox"
                              checked={selectedGroups.includes(group.id)}
                              onChange={() => toggleGroupSelection(group.id)}
                              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                              onClick={(e) => e.stopPropagation()}
                            />
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                                <UsersIcon className="w-4 h-4 text-purple-600" />
                              </div>
                              <div>
                                <p className="text-sm font-medium text-gray-900 dark:text-white">
                                  {group.name}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                  {group.users?.length || 0} members
                                </p>
                              </div>
                            </div>
                          </div>
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300">
                            Group
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* Add Button */}
              {(selectedUsers.length > 0 || selectedGroups.length > 0) && (
                <div className="flex items-center justify-between pt-2">
                  <p className="text-sm text-blue-600 dark:text-blue-400">
                    {selectedUsers.length} user(s) and {selectedGroups.length} group(s) selected
                    {selectedGroups.length > 0 && (
                      <span className="block text-xs text-gray-500">
                        ({selectedGroups.reduce((total, groupId) => {
                          const group = availableGroups.find(g => g.id === groupId);
                          return total + (group?.users?.length || 0);
                        }, 0)} total users from groups)
                      </span>
                    )}
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
                    {stats.acceptedCount}
                  </span>
                  <span className="flex items-center gap-1">
                    <UserX className="h-4 w-4 text-red-500" />
                    {stats.declinedCount}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-4 w-4 text-yellow-500" />
                    {stats.pendingCount}
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
                        {/* Avatar */}
                        {participant.type === 'individual' ? (
                          participant.user?.image ? (
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
                          )
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                            <UsersIcon className="w-5 h-5 text-purple-600" />
                          </div>
                        )}

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <p className="font-medium text-gray-900 dark:text-white truncate">
                              {participant.type === 'individual' 
                                ? participant.user?.name 
                                : participant.group?.name
                              }
                            </p>
                            <span className={
                              participant.type === 'individual' 
                                ? getRoleBadge(participant.user?.role || 'Participant')
                                : "inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300"
                            }>
                              {participant.type === 'individual' 
                                ? participant.user?.role 
                                : 'Group'
                              }
                            </span>
                            <span className={getRsvpBadge(getRsvpStatusName(participant.rsvp_id))}>
                              {getRsvpStatusName(participant.rsvp_id)}
                            </span>
                          </div>
                          <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                            {participant.type === 'individual' 
                              ? participant.user?.email
                              : `${participant.group?.users?.length || 0} members`
                            }
                          </p>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-3">
                        <select
                          value={participant.rsvp_id || ''}
                          onChange={(e) => updateParticipantRsvp(participant.id, e.target.value)}
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

                    {/* Group Members (if group) */}
                    {participant.type === 'group' && participant.group?.users && (
                      <div className="mt-3 pl-13">
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Group members:</p>
                        <div className="space-y-2">
                          {participant.group.users.map(user => (
                            <div key={user.id} className="flex items-center gap-2 text-sm">
                              <div className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center">
                                <span className="text-xs text-gray-600">
                                  {getInitials(user.name)}
                                </span>
                              </div>
                              <span className="text-gray-700 dark:text-gray-300">{user.name}</span>
                              <span className={getRoleBadge(user.role)}>
                                {user.role}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Statistics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 text-center">
              <Users className="h-6 w-6 text-blue-500 mx-auto mb-2" />
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalAttendees}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Total Attendees</p>
            </div>
            
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 text-center">
              <UserCheck className="h-6 w-6 text-green-500 mx-auto mb-2" />
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {stats.acceptedCount}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Accepted</p>
            </div>
            
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 text-center">
              <UserX className="h-6 w-6 text-red-500 mx-auto mb-2" />
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {stats.declinedCount}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Declined</p>
            </div>
            
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 text-center">
              <Clock className="h-6 w-6 text-yellow-500 mx-auto mb-2" />
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {stats.pendingCount}
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