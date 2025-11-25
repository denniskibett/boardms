// lib/store/slices/systemSettingsSlice.ts
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

interface SystemSettings {
  id: number;
  name: string;
  version: string;
  timezone: string;
  date_format: string;
  language: string;
  email_notifications: boolean;
  push_notifications: boolean;
  meeting_reminders: boolean;
  deadline_alerts: boolean;
  weekly_reports: boolean;
  session_timeout: number;
  password_policy: string;
  two_factor_auth: boolean;
  ip_whitelist: string[];
  audit_log_retention: number;
}

interface SystemSettingsState {
  settings: SystemSettings | null;
  loading: boolean;
  error: string | null;
}

const initialState: SystemSettingsState = {
  settings: null,
  loading: false,
  error: null,
};

export const fetchSystemSettings = createAsyncThunk(
  'systemSettings/fetchSettings',
  async () => {
    const response = await fetch('/api/settings');
    if (!response.ok) {
      throw new Error('Failed to fetch system settings');
    }
    return response.json();
  }
);

const systemSettingsSlice = createSlice({
  name: 'systemSettings',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchSystemSettings.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSystemSettings.fulfilled, (state, action) => {
        state.loading = false;
        state.settings = action.payload;
        console.log('✅ System settings loaded in Redux:', action.payload.name);
      })
      .addCase(fetchSystemSettings.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch system settings';
      });
  },
});

export const { clearError } = systemSettingsSlice.actions;
export default systemSettingsSlice.reducer;