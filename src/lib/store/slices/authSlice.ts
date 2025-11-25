// lib/store/slices/authSlice.ts
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { signIn, signOut, getSession } from 'next-auth/react';

interface AuthState {
  isAuthenticated: boolean;
  user: any;
  loading: boolean;
  error: string | null;
}

const initialState: AuthState = {
  isAuthenticated: false,
  user: null,
  loading: false,
  error: null,
};

export const checkAuth = createAsyncThunk(
  'auth/checkAuth',
  async () => {
    const session = await getSession();
    if (session?.user) {
      console.log('✅ Auth session found:', session.user.id);
    }
    return session;
  }
);

export const loginUser = createAsyncThunk(
  'auth/login',
  async (credentials: { email: string; password: string }) => {
    const result = await signIn('credentials', {
      redirect: false,
      ...credentials,
    });
    
    if (result?.error) {
      throw new Error(result.error);
    }
    
    const session = await getSession();
    return session;
  }
);

export const logoutUser = createAsyncThunk(
  'auth/logout',
  async () => {
    await signOut({ redirect: false });
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setAuthState: (state, action) => {
      state.isAuthenticated = action.payload.isAuthenticated;
      state.user = action.payload.user;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(checkAuth.pending, (state) => {
        state.loading = true;
      })
      .addCase(checkAuth.fulfilled, (state, action) => {
        state.loading = false;
        state.isAuthenticated = !!action.payload;
        state.user = action.payload?.user || null;
        console.log('✅ Auth state updated:', { 
          isAuthenticated: state.isAuthenticated,
          userId: state.user?.id 
        });
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false;
        state.isAuthenticated = !!action.payload;
        state.user = action.payload?.user || null;
        state.error = null;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Login failed';
      })
      .addCase(logoutUser.fulfilled, (state) => {
        state.isAuthenticated = false;
        state.user = null;
      });
  },
});

export const { setAuthState, clearError } = authSlice.actions;
export default authSlice.reducer;