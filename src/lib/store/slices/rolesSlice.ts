// Roles cache for Redux consumers. The Roles & Permissions screen talks to /api/roles directly;
// permission checks use usePermissions() / lib/rbac — never this slice.
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import type { Permissions } from '@/lib/rbac';

export interface Role {
  id: number;
  roleKey: string;
  name: string;
  description: string;
  hierarchy: number;
  isSystemRole: boolean;
  permissions: Permissions;
  userCount: number;
}

interface RolesState {
  roles: Role[];
  loading: boolean;
  error: string | null;
}

const initialState: RolesState = { roles: [], loading: false, error: null };

export const fetchRoles = createAsyncThunk('roles/fetchRoles', async (_: void, { rejectWithValue }) => {
  const res = await fetch('/api/roles');
  const json = await res.json().catch(() => ({}));
  if (!res.ok) return rejectWithValue(json.error || 'Failed to load roles');
  return json as Role[];
});

const rolesSlice = createSlice({
  name: 'roles',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchRoles.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchRoles.fulfilled, (state, action) => {
        state.loading = false;
        state.roles = action.payload;
      })
      .addCase(fetchRoles.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) ?? 'Failed to load roles';
      });
  },
});

export const { clearError } = rolesSlice.actions;
export default rolesSlice.reducer;
