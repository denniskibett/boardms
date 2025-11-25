// src/lib/store/slices/meetingsSlice.ts - COMPLETE VERSION
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';

export interface Meeting {
  id: number;
  name: string;
  type: string;
  start_at: string;
  period: number;
  actual_end: string;
  location: string;
  chair_id: number | null;
  status: string;
  created_at: string;
  updated_at: string;
  approved_by: number | null;
  created_by: number;
  description: string;
  colour: string;
  chair_name?: string;
  chair_email?: string;
  chair_role?: string;
  created_by_name?: string;
  approved_by_name?: string;
  attendees_count?: number;
  participants?: Array<{
    id: string;
    name: string;
    email: string;
    role: string;
    image?: string;
  }>;
  agenda?: Array<{
    id: string;
    name: string;
    description: string;
    status: string;
    sort_order: number;
    presenter_id: string;
    ministry_id: string | null;
    memo_id: string | null;
    cabinet_approval_required: boolean;
    meeting_id: string;
    created_at: string;
    updated_at: string;
    documents?: any[];
    ministry?: {
      id: string;
      name: string;
    };
  }>;
}

export interface Category {
  id: string;
  name: string;
  type: string;
  colour?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface MeetingsState {
  meetings: Meeting[];
  categories: {
    locations: Category[];
    meetingTypes: Category[];
    meetingStatuses: Category[];
    colours: Category[];
  };
  chairs: User[];
  currentMeeting: Meeting | null;
  loading: boolean;
  error: string | null;
  creating: boolean;
  createError: string | null;
  updating: boolean;
  deleting: boolean;
}

const initialState: MeetingsState = {
  meetings: [],
  categories: {
    locations: [],
    meetingTypes: [],
    meetingStatuses: [],
    colours: []
  },
  chairs: [],
  currentMeeting: null,
  loading: false,
  error: null,
  creating: false,
  createError: null,
  updating: false,
  deleting: false,
};

// Async thunks
export const fetchMeetingsData = createAsyncThunk(
  'meetings/fetchMeetingsData',
  async (_, { rejectWithValue }) => {
    try {
      console.log('🔄 Starting Redux data fetch...');
      
      // Fetch all data in parallel with CORRECT role parameters
      const [meetingsRes, locationsRes, meetingTypesRes, meetingStatusesRes, coloursRes, chairsRes] = await Promise.all([
        fetch('/api/meetings'),
        fetch('/api/categories?type=location'),
        fetch('/api/categories?type=meeting'),
        fetch('/api/categories?type=meeting_status'),
        fetch('/api/categories?type=colour'),
        // Use the exact role names from your database
        fetch('/api/users?roles=President,Deputy President,Cabinet Secretary,Principal Secretary,Prime Cabinet Secretary,Attorney General&orderBy=name&order=asc')
      ]);

      // Handle responses
      const meetings = meetingsRes.ok ? await meetingsRes.json() : [];
      const locations = locationsRes.ok ? await locationsRes.json() : [];
      const meetingTypes = meetingTypesRes.ok ? await meetingTypesRes.json() : [];
      const meetingStatuses = meetingStatusesRes.ok ? await meetingStatusesRes.json() : [];
      const colours = coloursRes.ok ? await coloursRes.json() : [];
      const chairs = chairsRes.ok ? await chairsRes.json() : [];

      console.log('📊 Data fetched via Redux:', {
        meetings: meetings.length,
        locations: locations.length,
        meetingTypes: meetingTypes.length,
        meetingStatuses: meetingStatuses.length,
        colours: colours.length,
        chairs: chairs.length
      });

      return {
        meetings: meetings || [],
        categories: { 
          locations: locations || [], 
          meetingTypes: meetingTypes || [], 
          meetingStatuses: meetingStatuses || [], 
          colours: colours || [] 
        },
        chairs: chairs || []
      };
    } catch (error: any) {
      console.error('❌ Error fetching meetings data:', error);
      return rejectWithValue(error.message);
    }
  }
);

export const fetchMeetingById = createAsyncThunk(
  'meetings/fetchMeetingById',
  async (meetingId: string, { rejectWithValue }) => {
    try {
      console.log('🔄 Fetching single meeting via Redux:', meetingId);
      
      const response = await fetch(`/api/meetings/${meetingId}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch meeting: ${response.status}`);
      }
      
      const meetingData = await response.json();
      console.log('✅ Single meeting fetched via Redux:', meetingData.id);
      
      return meetingData;
    } catch (error: any) {
      console.error('❌ Error fetching single meeting:', error);
      return rejectWithValue(error.message);
    }
  }
);

export const createMeeting = createAsyncThunk(
  'meetings/createMeeting',
  async (meetingData: any, { rejectWithValue }) => {
    try {
      console.log('🔄 Creating meeting via Redux:', meetingData);
      
      const response = await fetch('/api/meetings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(meetingData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create meeting');
      }

      console.log('✅ Meeting created via Redux:', result.id);
      return result;
    } catch (error: any) {
      console.error('❌ Error creating meeting:', error);
      return rejectWithValue(error.message);
    }
  }
);

export const updateMeeting = createAsyncThunk(
  'meetings/updateMeeting',
  async ({ id, meetingData }: { id: number; meetingData: any }, { rejectWithValue }) => {
    try {
      console.log('🔄 Updating meeting via Redux:', { id, meetingData });
      
      const response = await fetch(`/api/meetings?id=${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(meetingData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to update meeting');
      }

      console.log('✅ Meeting updated via Redux:', result.id);
      return result;
    } catch (error: any) {
      console.error('❌ Error updating meeting:', error);
      return rejectWithValue(error.message);
    }
  }
);

export const deleteMeeting = createAsyncThunk(
  'meetings/deleteMeeting',
  async (meetingId: string, { rejectWithValue }) => {
    try {
      console.log('🔄 Deleting meeting via Redux:', meetingId);
      
      const response = await fetch(`/api/meetings/${meetingId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete meeting');
      }
      
      console.log('✅ Meeting deleted via Redux:', meetingId);
      return meetingId;
    } catch (error: any) {
      console.error('❌ Error deleting meeting:', error);
      return rejectWithValue(error.message);
    }
  }
);

const meetingsSlice = createSlice({
  name: 'meetings',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
      state.createError = null;
    },
    clearCreateError: (state) => {
      state.createError = null;
    },
    clearMeetingError: (state) => {
      state.error = null;
    },
    clearCurrentMeeting: (state) => {
      state.currentMeeting = null;
    },
    updateMeetingInList: (state, action: PayloadAction<Meeting>) => {
      const index = state.meetings.findIndex(meeting => meeting.id === action.payload.id);
      if (index !== -1) {
        state.meetings[index] = action.payload;
      }
    },
    addMeetingToList: (state, action: PayloadAction<Meeting>) => {
      state.meetings.unshift(action.payload);
    },
    removeMeetingFromList: (state, action: PayloadAction<number>) => {
      state.meetings = state.meetings.filter(meeting => meeting.id !== action.payload);
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch meetings data
      .addCase(fetchMeetingsData.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMeetingsData.fulfilled, (state, action) => {
        state.loading = false;
        state.meetings = action.payload.meetings;
        state.categories = action.payload.categories;
        state.chairs = action.payload.chairs;
      })
      .addCase(fetchMeetingsData.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // Fetch single meeting by ID
      .addCase(fetchMeetingById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMeetingById.fulfilled, (state, action) => {
        state.loading = false;
        state.currentMeeting = action.payload;
      })
      .addCase(fetchMeetingById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        state.currentMeeting = null;
      })
      
      // Create meeting
      .addCase(createMeeting.pending, (state) => {
        state.creating = true;
        state.createError = null;
      })
      .addCase(createMeeting.fulfilled, (state, action) => {
        state.creating = false;
        state.meetings.push(action.payload);
      })
      .addCase(createMeeting.rejected, (state, action) => {
        state.creating = false;
        state.createError = action.payload as string;
      })
      
      // Update meeting
      .addCase(updateMeeting.pending, (state) => {
        state.updating = true;
      })
      .addCase(updateMeeting.fulfilled, (state, action) => {
        state.updating = false;
        // Update in meetings list
        const index = state.meetings.findIndex(meeting => meeting.id === action.payload.id);
        if (index !== -1) {
          state.meetings[index] = action.payload;
        }
        // Update current meeting if it's the same
        if (state.currentMeeting && state.currentMeeting.id === action.payload.id) {
          state.currentMeeting = action.payload;
        }
      })
      .addCase(updateMeeting.rejected, (state, action) => {
        state.updating = false;
        state.error = action.payload as string;
      })
      
      // Delete meeting
      .addCase(deleteMeeting.pending, (state) => {
        state.deleting = true;
      })
      .addCase(deleteMeeting.fulfilled, (state, action) => {
        state.deleting = false;
        // Remove the deleted meeting from the meetings array
        state.meetings = state.meetings.filter(meeting => meeting.id.toString() !== action.payload);
        state.currentMeeting = null;
      })
      .addCase(deleteMeeting.rejected, (state, action) => {
        state.deleting = false;
        state.error = action.payload as string;
      });
  },
});

export const { 
  clearError, 
  clearCreateError, 
  clearMeetingError, 
  clearCurrentMeeting,
  updateMeetingInList,
  addMeetingToList,
  removeMeetingFromList
} = meetingsSlice.actions;

export default meetingsSlice.reducer;