// src/components/meetings/MeetingParticipants.tsx
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
  RefreshCw,
  HelpCircle,
  CheckCircle,
  AlertCircle,
  Calendar
} from 'lucide-react';
import { useMeetingsData } from '@/hooks/useMeetingsData';

interface User {
  id: string;
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
  user_id: string | null;
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
  settings?: {
    timezone: string;
    date_format: string;
    time_format: '12' | '24';
  };
}

// Helper function to get initials from name (first letter of first and last name)
const getInitials = (name: string): string => {
  if (!name) return "?";
  
  // Handle names with commas (e.g., "Mudavadi, Musalia")
  if (name.includes(',')) {
    const [lastName, firstName] = name.split(',').map(s => s.trim());
    const lastInitial = lastName.charAt(0).toUpperCase();
    const firstInitial = firstName.charAt(0).toUpperCase();
    return `${firstInitial}${lastInitial}`;
  }
  
  // Handle regular names (e.g., "Musalia Mudavadi")
  const words = name.trim().split(' ').filter(word => word.length > 0);
  if (words.length >= 2) {
    return words.slice(0, 2).map(word => word.charAt(0).toUpperCase()).join('');
  }
  
  return name.charAt(0).toUpperCase();
};

// Helper function to get avatar color based on name
const getAvatarColor = (name: string): string => {
  const colors = [
    'bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-orange-500', 
    'bg-red-500', 'bg-teal-500', 'bg-indigo-500', 'bg-pink-500',
    'bg-yellow-500', 'bg-cyan-500', 'bg-emerald-500', 'bg-rose-500'
  ];
  const index = (name?.length || 0) % colors.length;
  return colors[index];
};

// RSVP status configuration for accurate display
const RSVP_STATUSES = {
  ATTENDING: { 
    label: 'Attending', 
    color: 'bg-green-500',
    bgLight: 'bg-green-100',
    textLight: 'text-green-800',
    bgDark: 'dark:bg-green-900',
    textDark: 'dark:text-green-300',
    icon: CheckCircle,
    order: 1
  },
  DECLINED: { 
    label: 'Declined', 
    color: 'bg-red-500',
    bgLight: 'bg-red-100',
    textLight: 'text-red-800',
    bgDark: 'dark:bg-red-900',
    textDark: 'dark:text-red-300',
    icon: X,
    order: 2
  },
  TENTATIVE: { 
    label: 'Tentative', 
    color: 'bg-yellow-500',
    bgLight: 'bg-yellow-100',
    textLight: 'text-yellow-800',
    bgDark: 'dark:bg-yellow-900',
    textDark: 'dark:text-yellow-300',
    icon: Clock,
    order: 3
  },
  NO_RESPONSE: { 
    label: 'No Response', 
    color: 'bg-gray-500',
    bgLight: 'bg-gray-100',
    textLight: 'text-gray-800',
    bgDark: 'dark:bg-gray-700',
    textDark: 'dark:text-gray-300',
    icon: HelpCircle,
    order: 4
  },
  PENDING: { 
    label: 'Pending', 
    color: 'bg-blue-500',
    bgLight: 'bg-blue-100',
    textLight: 'text-blue-800',
    bgDark: 'dark:bg-blue-900',
    textDark: 'dark:text-blue-300',
    icon: Clock,
    order: 5
  },
  NOT_ATTENDING: { 
    label: 'Not Attending', 
    color: 'bg-orange-500',
    bgLight: 'bg-orange-100',
    textLight: 'text-orange-800',
    bgDark: 'dark:bg-orange-900',
    textDark: 'dark:text-orange-300',
    icon: UserX,
    order: 6
  }
};

// Map RSVP names to status keys
const mapRsvpToStatus = (rsvpName: string): keyof typeof RSVP_STATUSES => {
  const lower = rsvpName?.toLowerCase() || '';
  
  if (lower.includes('accept') || lower.includes('attend') || lower === 'yes') return 'ATTENDING';
  if (lower.includes('declin') || lower === 'no') return 'DECLINED';
  if (lower.includes('tentative') || lower.includes('maybe')) return 'TENTATIVE';
  if (lower.includes('no response') || lower.includes('none')) return 'NO_RESPONSE';
  if (lower.includes('pending')) return 'PENDING';
  if (lower.includes('not attend')) return 'NOT_ATTENDING';
  
  return 'PENDING'; // Default
};

const MeetingParticipants: React.FC<MeetingParticipantsProps> = ({ 
  meetingId, 
  participants: initialParticipants = [],
  onParticipantsUpdate,
  onRefresh,
  compact = false,
  settings
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
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});

  const hasLoadedRef = useRef({
    users: false,
    groups: false,
    rsvp: false,
    participants: false
  });

  // Use cached data from useMeetingsData
  const { 
    users: cachedUsers, 
    categories,
    settings: cachedSettings 
  } = useMeetingsData();

  // UUID validation helper
  const isValidUUID = (id: string | null | undefined): boolean => {
    if (!id) return false;
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
  };

  // Filter and validate users
  const filterValidUsers = (users: any[]): User[] => {
    return users
      .filter(user => user && isValidUUID(user.auth_id))
      .map(user => ({
        ...user,
        id: user.auth_id,
        auth_id: user.auth_id
      }));
  };

  // Format participants
  const formatParticipants = useCallback((participantsData: any[]): MeetingParticipant[] => {
    return participantsData
      .filter(participant => {
        return participant.type === 'group' || 
               (participant.type === 'individual' && isValidUUID(participant.user_id));
      })
      .map(participant => {
        let userImage = undefined;
        if (participant.user?.image) {
          userImage = participant.user.image.startsWith('/') 
            ? participant.user.image 
            : `/meetings/${participant.user.image}`;
        }

        return {
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
      });
  }, []);

  // Data loading with caching
  const reloadAllData = useCallback(async () => {
    try {
      setIsLoading(true);

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

      const validUsers = filterValidUsers(Array.isArray(usersRes) ? usersRes : []);
      const validGroups = Array.isArray(groupsRes) ? groupsRes.map(group => ({
        ...group,
        users: filterValidUsers(group.users || [])
      })) : [];

      const formattedParticipants = formatParticipants(participantsRes);
      setParticipants(formattedParticipants);
      setAvailableUsers(validUsers);
      setAvailableGroups(validGroups);
      setRsvpOptions(Array.isArray(rsvpRes) ? rsvpRes : []);
      
    } catch (error: any) {
      console.error('❌ Error reloading data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [meetingId, formatParticipants]);

  const loadRequiredData = useCallback(async () => {
    try {
      setIsLoading(true);

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
            })
        );
      }

      // Try to use cached users first
      if (cachedUsers && cachedUsers.length > 0 && !hasLoadedRef.current.users) {
        const validUsers = filterValidUsers(cachedUsers);
        setAvailableUsers(validUsers);
        hasLoadedRef.current.users = true;
      } else if (!hasLoadedRef.current.users) {
        dataPromises.push(
          fetch('/api/users?role=all')
            .then(res => {
              if (!res.ok) throw new Error(`Users API error: ${res.status}`);
              return res.json();
            })
            .then(data => {
              const validUsers = filterValidUsers(Array.isArray(data) ? data : []);
              setAvailableUsers(validUsers);
              hasLoadedRef.current.users = true;
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
              const groupsData = Array.isArray(data) ? data.map(group => ({
                ...group,
                users: filterValidUsers(group.users || [])
              })) : [];
              setAvailableGroups(groupsData);
              hasLoadedRef.current.groups = true;
            })
        );
      }

      // Try to use cached RSVP options
      if (categories?.decisionStatus && categories.decisionStatus.length > 0 && !hasLoadedRef.current.rsvp) {
        setRsvpOptions(categories.decisionStatus);
        hasLoadedRef.current.rsvp = true;
      } else if (!hasLoadedRef.current.rsvp) {
        dataPromises.push(
          fetch('/api/categories?type=rsvp_status')
            .then(res => {
              if (!res.ok) throw new Error(`RSVP API error: ${res.status}`);
              return res.json();
            })
            .then(data => {
              setRsvpOptions(Array.isArray(data) ? data : []);
              hasLoadedRef.current.rsvp = true;
            })
        );
      }

      await Promise.all(dataPromises);

    } catch (error: any) {
      console.error('❌ Error loading data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [meetingId, initialParticipants, formatParticipants, cachedUsers, categories]);

  useEffect(() => {
    if (initialParticipants && initialParticipants.length > 0) {
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

  // Filter available users and groups
  const filteredUsers = availableUsers
    .filter(user => 
      user?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user?.role?.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .filter(user => 
      !participants.some(p => p.user_id === user.id)
    );

  const filteredGroups = availableGroups
    .filter(group =>
      group?.name?.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .filter(group => {
      if (!group.users || group.users.length === 0) return false;
      const usersNotInMeeting = group.users.filter(user => 
        !participants.some(p => p.user_id === user.id)
      );
      return usersNotInMeeting.length > 0;
    });

  // Add participants
  const addParticipants = useCallback(async () => {
    if (selectedUsers.length === 0 && selectedGroups.length === 0) return;

    try {
      setIsAdding(true);

      let allUserIds = [...selectedUsers];
      
      if (selectedGroups.length > 0) {
        selectedGroups.forEach(groupId => {
          const group = availableGroups.find(g => g.id === groupId);
          if (group?.users) {
            const groupUserIds = group.users
              .map(user => user.auth_id)
              .filter(uuid => isValidUUID(uuid));
            allUserIds = [...allUserIds, ...groupUserIds];
          }
        });
      }

      allUserIds = [...new Set(allUserIds)].filter(id => isValidUUID(id));

      if (allUserIds.length === 0) {
        alert('No valid users to add.');
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

      await reloadAllData();
      
    } catch (error: any) {
      console.error('❌ Error adding participants:', error);
      alert(error.message || 'Failed to add participants.');
    } finally {
      setIsAdding(false);
    }
  }, [meetingId, selectedUsers, selectedGroups, participants, availableGroups, formatParticipants, onParticipantsUpdate, reloadAllData]);

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
    if (onRefresh) {
      await onRefresh();
    }
    await reloadAllData();
  }, [onRefresh, reloadAllData]);

  const handleImageError = useCallback((participantId: string) => {
    setImageErrors(prev => ({ ...prev, [participantId]: true }));
  }, []);

  // Helper functions
  const getRsvpBadge = useCallback((rsvpId: string | null) => {
    if (!rsvpId) return RSVP_STATUSES.PENDING;
    
    const rsvp = rsvpOptions.find(r => r.id === rsvpId);
    const statusKey = mapRsvpToStatus(rsvp?.name || '');
    return RSVP_STATUSES[statusKey];
  }, [rsvpOptions]);

  const getRsvpStatusName = useCallback((rsvpId: string | null) => {
    if (!rsvpId) return 'Pending';
    const rsvp = rsvpOptions.find(r => r.id === rsvpId);
    return rsvp?.name || 'Pending';
  }, [rsvpOptions]);

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

  // Calculate RSVP statistics with proper grouping
  const getRsvpStats = useCallback(() => {
    // Initialize all statuses with zero counts
    const stats: { [key in keyof typeof RSVP_STATUSES]: { 
      count: number; 
      percentage: number; 
      color: string;
      label: string;
      icon: any;
    } } = {
      ATTENDING: { count: 0, percentage: 0, color: RSVP_STATUSES.ATTENDING.color, label: RSVP_STATUSES.ATTENDING.label, icon: RSVP_STATUSES.ATTENDING.icon },
      DECLINED: { count: 0, percentage: 0, color: RSVP_STATUSES.DECLINED.color, label: RSVP_STATUSES.DECLINED.label, icon: RSVP_STATUSES.DECLINED.icon },
      TENTATIVE: { count: 0, percentage: 0, color: RSVP_STATUSES.TENTATIVE.color, label: RSVP_STATUSES.TENTATIVE.label, icon: RSVP_STATUSES.TENTATIVE.icon },
      NO_RESPONSE: { count: 0, percentage: 0, color: RSVP_STATUSES.NO_RESPONSE.color, label: RSVP_STATUSES.NO_RESPONSE.label, icon: RSVP_STATUSES.NO_RESPONSE.icon },
      PENDING: { count: 0, percentage: 0, color: RSVP_STATUSES.PENDING.color, label: RSVP_STATUSES.PENDING.label, icon: RSVP_STATUSES.PENDING.icon },
      NOT_ATTENDING: { count: 0, percentage: 0, color: RSVP_STATUSES.NOT_ATTENDING.color, label: RSVP_STATUSES.NOT_ATTENDING.label, icon: RSVP_STATUSES.NOT_ATTENDING.icon }
    };

    // Count participants for each status
    participants.forEach(participant => {
      const rsvpName = getRsvpStatusName(participant.rsvp_id);
      const statusKey = mapRsvpToStatus(rsvpName);
      stats[statusKey].count += 1;
    });

    // Calculate percentages
    const totalParticipants = participants.length;
    Object.keys(stats).forEach(key => {
      const statusKey = key as keyof typeof RSVP_STATUSES;
      stats[statusKey].percentage = totalParticipants > 0 
        ? (stats[statusKey].count / totalParticipants) * 100 
        : 0;
    });

    // Sort by predefined order
    const sortedStats = Object.entries(stats)
      .sort(([, a], [, b]) => {
        const orderA = RSVP_STATUSES[a.label as keyof typeof RSVP_STATUSES]?.order || 999;
        const orderB = RSVP_STATUSES[b.label as keyof typeof RSVP_STATUSES]?.order || 999;
        return orderA - orderB;
      })
      .reduce((acc, [key, value]) => {
        acc[key as keyof typeof RSVP_STATUSES] = value;
        return acc;
      }, {} as typeof stats);

    return sortedStats;
  }, [participants, getRsvpStatusName]);

  const getParticipantStats = useCallback(() => {
    const individualCount = participants.filter(p => p.type === 'individual').length;
    const groupCount = participants.filter(p => p.type === 'group').length;
    
    // Calculate RSVP counts using our status mapping
    let acceptedCount = 0;
    let declinedCount = 0;
    let pendingCount = 0;
    
    participants.forEach(participant => {
      const rsvpName = getRsvpStatusName(participant.rsvp_id);
      const statusKey = mapRsvpToStatus(rsvpName);
      
      switch(statusKey) {
        case 'ATTENDING':
          acceptedCount++;
          break;
        case 'DECLINED':
        case 'NOT_ATTENDING':
          declinedCount++;
          break;
        default:
          pendingCount++;
          break;
      }
    });

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
  const rsvpStats = getRsvpStats();

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
            <p className="text-xs text-gray-600 dark:text-gray-400">Attending</p>
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
              className="flex items-center gap-2 px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg disabled:opacity-50 transition-colors"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              Refresh
            </button>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
              <p className="text-sm text-gray-500 dark:text-gray-400">Attending</p>
            </div>
            
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 text-center">
              <UserX className="h-6 w-6 text-red-500 mx-auto mb-2" />
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {stats.declinedCount}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Not Attending</p>
            </div>
            
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 text-center">
              <Clock className="h-6 w-6 text-yellow-500 mx-auto mb-2" />
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {stats.pendingCount}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Pending</p>
            </div>
          </div>

          {/* RSVP Status Breakdown */}
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
            <h4 className="font-medium text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <HelpCircle className="h-5 w-5 text-blue-500" />
              RSVP Status Breakdown
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {Object.entries(rsvpStats).map(([statusKey, data]) => {
                const Icon = data.icon;
                return (
                  <div key={statusKey} className="text-center">
                    <div className={`w-12 h-12 ${data.color} rounded-full flex items-center justify-center mx-auto mb-2`}>
                      <Icon className="h-6 w-6 text-white" />
                    </div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">
                      {data.label}
                    </p>
                    <p className="text-lg font-bold text-gray-900 dark:text-white">
                      {data.count}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {data.percentage.toFixed(1)}%
                    </p>
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
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
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
                </button>
              </div>

              {/* Available Users/Groups List */}
              {(activeTab === 'users' ? filteredUsers : filteredGroups).length > 0 && (
                <div className="border border-gray-200 dark:border-gray-600 rounded-lg max-h-48 overflow-y-auto">
                  <div className="p-3 bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Available {activeTab === 'users' ? 'Users' : 'Groups'} ({activeTab === 'users' ? filteredUsers.length : filteredGroups.length})
                    </p>
                  </div>
                  <div className="divide-y divide-gray-200 dark:divide-gray-600">
                    {activeTab === 'users' ? (
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
                              {user.image && !imageErrors[user.id] ? (
                                <img 
                                  src={user.image} 
                                  alt={user.name}
                                  className="w-8 h-8 rounded-full object-cover"
                                  onError={() => handleImageError(user.id)}
                                />
                              ) : (
                                <div className={`w-8 h-8 ${getAvatarColor(user.name)} rounded-full flex items-center justify-center text-white text-xs font-bold`}>
                                  {getInitials(user.name)}
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
                  </p>
                  <button
                    onClick={addParticipants}
                    disabled={isAdding}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-50 transition-colors"
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
                {participants.map(participant => {
                  const rsvpBadge = getRsvpBadge(participant.rsvp_id);
                  const Icon = rsvpBadge.icon;
                  
                  return (
                    <div key={participant.id} className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 flex-1">
                          {/* Avatar with fallback initials */}
                          {participant.type === 'individual' ? (
                            participant.user?.image && !imageErrors[participant.user.id] ? (
                              <img
                                src={participant.user.image}
                                alt={participant.user.name}
                                className="w-10 h-10 rounded-full object-cover"
                                onError={() => handleImageError(participant.user!.id)}
                              />
                            ) : (
                              <div className={`w-10 h-10 ${getAvatarColor(participant.user?.name || '')} rounded-full flex items-center justify-center text-white text-sm font-bold`}>
                                {getInitials(participant.user?.name || '')}
                              </div>
                            )
                          ) : (
                            <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
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
                              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${rsvpBadge.bgLight} ${rsvpBadge.textLight} dark:${rsvpBadge.bgDark} dark:${rsvpBadge.textDark}`}>
                                <Icon className="h-3 w-3 mr-1" />
                                {rsvpBadge.label}
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
                            className="px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                          >
                            <option value="">Pending</option>
                            {rsvpOptions.map(rsvp => {
                              const statusKey = mapRsvpToStatus(rsvp.name);
                              const status = RSVP_STATUSES[statusKey];
                              return (
                                <option key={rsvp.id} value={rsvp.id}>
                                  {status?.label || rsvp.name}
                                </option>
                              );
                            })}
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
                                {user.image && !imageErrors[user.id] ? (
                                  <img
                                    src={user.image}
                                    alt={user.name}
                                    className="w-6 h-6 rounded-full object-cover"
                                    onError={() => handleImageError(user.id)}
                                  />
                                ) : (
                                  <div className={`w-6 h-6 ${getAvatarColor(user.name)} rounded-full flex items-center justify-center text-white text-xs font-bold`}>
                                    {getInitials(user.name)}
                                  </div>
                                )}
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
                  );
                })}
              </div>
            )}
          </div>

          {/* Timezone Info Footer */}
          {settings && (
            <div className="text-xs text-gray-500 dark:text-gray-400 text-right">
              All times in {settings.timezone} • {settings.time_format === '12' ? '12h' : '24h'} format
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default MeetingParticipants;