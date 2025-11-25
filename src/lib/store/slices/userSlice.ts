// lib/store/slices/userSlice.ts
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';

interface User {
  id: string;
  name: string;
  email: string;
  image?: string;
  role: string;
  status: string;
  phone?: string;
  last_login?: string;
  ministry_id?: number;
  committees?: string[];
  created_at: string;
  updated_at: string;
  auth_id?: string; // Add auth_id to track the auth user
}

interface UserState {
  currentUser: User | null;
  users: User[];
  loading: boolean;
  error: string | null;
}

const initialState: UserState = {
  currentUser: null,
  users: [],
  loading: false,
  error: null,
};

// Async thunks
export const fetchUserProfile = createAsyncThunk(
  'user/fetchProfile',
  async (userId: string) => {
    const response = await fetch(`/api/users/${userId}`);
    if (!response.ok) {
      throw new Error('Failed to fetch user');
    }
    return response.json();
  }
);

export const syncUserData = createAsyncThunk(
  'user/syncData',
  async (authUserId: string) => {
    console.log('🔄 Syncing user data for auth ID:', authUserId);
    
    try {
      // First, try to get user by auth_id from custom table
      const customUserResponse = await fetch(`/api/users/auth/${authUserId}`);
      
      if (customUserResponse.ok) {
        const customUser = await customUserResponse.json();
        console.log('✅ Found user in custom table:', customUser);
        return customUser;
      }
      
      // If not found in custom table, try to get from auth table via API
      const authUserResponse = await fetch(`/api/auth/users/${authUserId}`);
      if (authUserResponse.ok) {
        const authUser = await authUserResponse.json();
        console.log('✅ Found user in auth table:', authUser);
        return authUser;
      }
      
      throw new Error('User not found in custom or auth tables');
      
    } catch (error) {
      console.error('❌ Error syncing user data:', error);
      throw error;
    }
  }
);

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    setCurrentUser: (state, action: PayloadAction<User>) => {
      state.currentUser = action.payload;
    },
    updateUserImage: (state, action: PayloadAction<string>) => {
      if (state.currentUser) {
        state.currentUser.image = action.payload;
      }
    },
    clearError: (state) => {
      state.error = null;
    },
    resetUserState: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      // Fetch user profile
      .addCase(fetchUserProfile.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUserProfile.fulfilled, (state, action) => {
        state.loading = false;
        state.currentUser = action.payload;
      })
      .addCase(fetchUserProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch user';
      })
      // Sync user data
      .addCase(syncUserData.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(syncUserData.fulfilled, (state, action) => {
        state.loading = false;
        state.currentUser = action.payload;
        console.log('✅ User data synced successfully');
      })
      .addCase(syncUserData.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to sync user data';
        console.error('❌ User data sync failed:', action.error);
      });
  },
});

export const { setCurrentUser, updateUserImage, clearError, resetUserState } = userSlice.actions;
export default userSlice.reducer;