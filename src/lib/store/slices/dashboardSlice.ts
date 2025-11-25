// src/lib/store/slices/dashboardSlice.ts
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';

interface DashboardState {
  user: any;
  ministry: any;
  memos: any[];
  meetings: any[];
  metrics: any;
  loading: boolean;
  error: string | null;
}

const initialState: DashboardState = {
  user: null,
  ministry: null,
  memos: [],
  meetings: [],
  metrics: {},
  loading: false,
  error: null,
};

// Async thunks for client-side data fetching
export const fetchMemos = createAsyncThunk(
  'dashboard/fetchMemos',
  async (_, { rejectWithValue }) => {
    try {
      const response = await fetch('/api/memos');
      if (!response.ok) throw new Error('Failed to fetch memos');
      return await response.json();
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const fetchMeetings = createAsyncThunk(
  'dashboard/fetchMeetings',
  async (_, { rejectWithValue }) => {
    try {
      const response = await fetch('/api/meetings');
      if (!response.ok) throw new Error('Failed to fetch meetings');
      return await response.json();
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const dashboardSlice = createSlice({
  name: 'dashboard',
  initialState,
  reducers: {
    setDashboardData: (state, action: PayloadAction<Partial<DashboardState>>) => {
      return { ...state, ...action.payload };
    },
    updateUser: (state, action: PayloadAction<any>) => {
      state.user = { ...state.user, ...action.payload };
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Memos
      .addCase(fetchMemos.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchMemos.fulfilled, (state, action) => {
        state.loading = false;
        state.memos = action.payload;
      })
      .addCase(fetchMemos.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Fetch Meetings
      .addCase(fetchMeetings.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchMeetings.fulfilled, (state, action) => {
        state.loading = false;
        state.meetings = action.payload;
      })
      .addCase(fetchMeetings.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { setDashboardData, updateUser, clearError } = dashboardSlice.actions;
export default dashboardSlice.reducer;