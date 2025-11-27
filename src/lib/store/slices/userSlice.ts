// src/lib/store/slices/userSlice.ts
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { supabase } from '@/lib/supabase/client';

export interface User {
  id: string;
  auth_id: string;
  email: string;
  name: string;
  role: string;
  status: string;
  image?: string;
  phone?: string;
  last_login?: string;
  created_at: string;
  updated_at: string;
}

interface UserState {
  currentUser: User | null;
  loading: boolean;
  error: string | null;
  isAuthenticated: boolean;
}

const initialState: UserState = {
  currentUser: null,
  loading: false,
  error: null,
  isAuthenticated: false,
};

export const fetchUserProfile = createAsyncThunk(
  'user/fetchUserProfile',
  async (authUserId: string, { rejectWithValue }) => {
    try {
      console.log('🔄 Fetching user profile for:', authUserId);

      // Method 1: Try to get user from our custom users table via Supabase
      const { data: dbUser, error: dbError } = await supabase
        .from('users')
        .select('*')
        .eq('id', authUserId)
        .single();

      if (!dbError && dbUser) {
        console.log('✅ User found in database:', dbUser.email);
        return dbUser;
      }

      console.log('🔍 User not found in database table, trying auth API...');

      // Method 2: Try to get user via our custom API route
      try {
        const authUserResponse = await fetch(`/api/auth/user?id=${authUserId}`);
        
        if (!authUserResponse.ok) {
          throw new Error(`API returned ${authUserResponse.status}`);
        }
        
        const authUser = await authUserResponse.json();
        console.log('✅ Found user via auth API:', authUser.email);
        return authUser;
      } catch (apiError) {
        console.error('❌ API call failed:', apiError);
        
        // Method 3: Fallback - Get basic info from Supabase auth directly
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        
        if (authError || !user) {
          throw new Error('Could not fetch user from any source');
        }

        // Create a basic user object from auth data
        const fallbackUser: User = {
          id: user.id,
          auth_id: user.id,
          email: user.email || '',
          name: user.user_metadata?.name || user.email?.split('@')[0] || 'User',
          role: user.user_metadata?.role || 'user',
          status: 'active',
          image: user.user_metadata?.avatar_url || user.user_metadata?.picture,
          phone: user.user_metadata?.phone,
          last_login: user.last_sign_in_at,
          created_at: user.created_at,
          updated_at: user.updated_at,
        };

        console.log('✅ Using fallback user data:', fallbackUser.email);
        return fallbackUser;
      }

    } catch (error: any) {
      console.error('❌ Error in fetchUserProfile:', error);
      return rejectWithValue(error.message);
    }
  }
);

export const initializeUser = createAsyncThunk(
  'user/initializeUser',
  async (_, { dispatch }) => {
    try {
      console.log('🔄 Initializing user...');
      
      // Get current session from Supabase
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error || !session) {
        console.log('❌ No active session found');
        return null;
      }

      console.log('✅ Session found, fetching user profile...');
      
      // Fetch user profile using the user ID from session
      const result = await dispatch(fetchUserProfile(session.user.id));
      
      if (fetchUserProfile.fulfilled.match(result)) {
        return result.payload;
      } else {
        throw new Error(result.payload as string);
      }
    } catch (error) {
      console.error('❌ Error initializing user:', error);
      throw error;
    }
  }
);

export const signOutUser = createAsyncThunk(
  'user/signOut',
  async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  }
);

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setUser: (state, action: PayloadAction<User>) => {
      state.currentUser = action.payload;
      state.isAuthenticated = true;
    },
    clearUser: (state) => {
      state.currentUser = null;
      state.isAuthenticated = false;
      state.loading = false;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Initialize User
      .addCase(initializeUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(initializeUser.fulfilled, (state, action) => {
        state.loading = false;
        state.currentUser = action.payload;
        state.isAuthenticated = !!action.payload;
      })
      .addCase(initializeUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        state.isAuthenticated = false;
        state.currentUser = null;
      })
      // Fetch User Profile
      .addCase(fetchUserProfile.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUserProfile.fulfilled, (state, action) => {
        state.loading = false;
        state.currentUser = action.payload;
        state.isAuthenticated = true;
      })
      .addCase(fetchUserProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        state.isAuthenticated = false;
      })
      // Sign Out
      .addCase(signOutUser.fulfilled, (state) => {
        state.currentUser = null;
        state.isAuthenticated = false;
        state.loading = false;
        state.error = null;
      })
      .addCase(signOutUser.rejected, (state, action) => {
        state.error = action.error.message || 'Failed to sign out';
      });
  },
});

export const { clearError, setUser, clearUser } = userSlice.actions;
export default userSlice.reducer;