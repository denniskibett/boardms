// store/slices/participantsSlice.ts
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

// Async thunks for API calls
export const fetchParticipants = createAsyncThunk(
  'participants/fetchParticipants',
  async (meetingId: string) => {
    const response = await fetch(`/api/meetings/${meetingId}/participants`);
    return response.json();
  }
);

export const addParticipants = createAsyncThunk(
  'participants/addParticipants',
  async ({ meetingId, user_ids }: { meetingId: string; user_ids: string[] }) => {
    const response = await fetch(`/api/meetings/${meetingId}/participants`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_ids, group_ids: [] }),
    });
    return response.json();
  }
);

const participantsSlice = createSlice({
  name: 'participants',
  initialState: {
    items: [],
    availableUsers: [],
    availableGroups: [],
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchParticipants.fulfilled, (state, action) => {
        state.items = action.payload;
      })
      .addCase(addParticipants.fulfilled, (state, action) => {
        state.items.push(...action.payload);
      });
  },
});

export default participantsSlice.reducer;