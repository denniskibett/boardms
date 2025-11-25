import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';

export interface Permission {
  id: string;
  name: string;
  description: string;
  module: string;
}

export interface Role {
  id: string;
  name: string;
  description: string;
  permissions: string[]; // array of permission IDs
  userCount: number;
  isSystemRole: boolean;
}

interface RolesState {
  roles: Role[];
  permissions: Permission[];
  loading: boolean;
  error: string | null;
  currentUserRole: Role | null;
}

const initialState: RolesState = {
  roles: [],
  permissions: [],
  loading: false,
  error: null,
  currentUserRole: null,
};

// Mock permissions data - you can expand this
export const systemPermissions: Permission[] = [
  // Memos Module
  { id: 'memos_create', name: 'Create Memos', description: 'Create new memos', module: 'memos' },
  { id: 'memos_read', name: 'View Memos', description: 'View existing memos', module: 'memos' },
  { id: 'memos_update', name: 'Edit Memos', description: 'Edit existing memos', module: 'memos' },
  { id: 'memos_delete', name: 'Delete Memos', description: 'Delete memos', module: 'memos' },
  { id: 'memos_approve', name: 'Approve Memos', description: 'Approve memos', module: 'memos' },
  
  // Committees Module
  { id: 'committees_read', name: 'View Committees', description: 'View committees', module: 'committees' },
  { id: 'committees_manage', name: 'Manage Committees', description: 'Manage committee structure', module: 'committees' },
  { id: 'committees_chair', name: 'Chair Committees', description: 'Chair committee meetings', module: 'committees' },
  { id: 'committees_participate', name: 'Participate', description: 'Participate in committees', module: 'committees' },
  
  // Meetings Module
  { id: 'meetings_create', name: 'Create Meetings', description: 'Schedule new meetings', module: 'meetings' },
  { id: 'meetings_read', name: 'View Meetings', description: 'View meeting details', module: 'meetings' },
  { id: 'meetings_update', name: 'Edit Meetings', description: 'Edit meeting details', module: 'meetings' },
  { id: 'meetings_delete', name: 'Delete Meetings', description: 'Delete meetings', module: 'meetings' },
  { id: 'meetings_chair', name: 'Chair Meetings', description: 'Chair meetings', module: 'meetings' },
  { id: 'meetings_manage', name: 'Manage Meetings', description: 'Manage meeting workflow', module: 'meetings' },
  { id: 'meetings_participate', name: 'Participate', description: 'Participate in meetings', module: 'meetings' },
  
  // Users Module
  { id: 'users_read', name: 'View Users', description: 'View user profiles', module: 'users' },
  { id: 'users_create', name: 'Create Users', description: 'Create new users', module: 'users' },
  { id: 'users_update', name: 'Edit Users', description: 'Edit user profiles', module: 'users' },
  { id: 'users_manage', name: 'Manage Users', description: 'Full user management', module: 'users' },
  
  // Reports Module
  { id: 'reports_read', name: 'View Reports', description: 'View system reports', module: 'reports' },
  { id: 'reports_export', name: 'Export Reports', description: 'Export report data', module: 'reports' },
  { id: 'reports_generate', name: 'Generate Reports', description: 'Generate new reports', module: 'reports' },
  
  // Settings Module
  { id: 'settings_read', name: 'View Settings', description: 'View system settings', module: 'settings' },
  { id: 'settings_update', name: 'Edit Settings', description: 'Modify system settings', module: 'settings' },
];

// Mock roles data
const systemRoles: Role[] = [
  {
    id: 'president',
    name: 'President',
    description: 'Full system access, final decision authority, e-signature capabilities',
    permissions: [
      'memos_create', 'memos_read', 'memos_update', 'memos_delete', 'memos_approve',
      'committees_read', 'committees_manage', 'committees_chair',
      'meetings_create', 'meetings_read', 'meetings_update', 'meetings_delete', 'meetings_chair',
      'users_read', 'users_manage',
      'reports_read', 'reports_export',
      'settings_read', 'settings_update'
    ],
    userCount: 1,
    isSystemRole: true,
  },
  {
    id: 'deputy_president',
    name: 'Deputy President',
    description: 'Committee chair responsibilities, decision review, extensive system access',
    permissions: [
      'memos_create', 'memos_read', 'memos_update',
      'committees_read', 'committees_manage', 'committees_chair',
      'meetings_create', 'meetings_read', 'meetings_update', 'meetings_chair',
      'users_read',
      'reports_read', 'reports_export',
      'settings_read'
    ],
    userCount: 1,
    isSystemRole: true,
  },
  {
    id: 'cabinet_secretary',
    name: 'Cabinet Secretary',
    description: 'Ministry-specific access, memo creation, committee participation',
    permissions: [
      'memos_create', 'memos_read', 'memos_update',
      'committees_read', 'committees_participate',
      'meetings_read', 'meetings_participate',
      'users_read',
      'reports_read'
    ],
    userCount: 22,
    isSystemRole: true,
  },
  {
    id: 'secretariat',
    name: 'Secretariat',
    description: 'System administration, workflow management, user support',
    permissions: [
      'memos_create', 'memos_read', 'memos_update',
      'committees_read', 'committees_manage',
      'meetings_create', 'meetings_read', 'meetings_update', 'meetings_manage',
      'users_create', 'users_read', 'users_update',
      'reports_read', 'reports_export', 'reports_generate',
      'settings_read', 'settings_update'
    ],
    userCount: 8,
    isSystemRole: true,
  },
];

// Async thunks
export const fetchRoles = createAsyncThunk(
  'roles/fetchRoles',
  async () => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    return systemRoles;
  }
);

export const fetchPermissions = createAsyncThunk(
  'roles/fetchPermissions',
  async () => {
    return systemPermissions;
  }
);

export const updateRolePermissions = createAsyncThunk(
  'roles/updatePermissions',
  async ({ roleId, permissions }: { roleId: string; permissions: string[] }) => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500));
    return { roleId, permissions };
  }
);

export const setCurrentUserRole = createAsyncThunk(
  'roles/setCurrentUserRole',
  async (roleId: string) => {
    const role = systemRoles.find(r => r.id === roleId);
    if (!role) {
      throw new Error('Role not found');
    }
    return role;
  }
);

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
      })
      .addCase(fetchRoles.fulfilled, (state, action) => {
        state.loading = false;
        state.roles = action.payload;
      })
      .addCase(fetchRoles.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch roles';
      })
      .addCase(fetchPermissions.fulfilled, (state, action) => {
        state.permissions = action.payload;
      })
      .addCase(updateRolePermissions.fulfilled, (state, action) => {
        const { roleId, permissions } = action.payload;
        const role = state.roles.find(r => r.id === roleId);
        if (role && !role.isSystemRole) {
          role.permissions = permissions;
        }
      })
      .addCase(setCurrentUserRole.fulfilled, (state, action) => {
        state.currentUserRole = action.payload;
      });
  },
});

export const { clearError } = rolesSlice.actions;
export default rolesSlice.reducer;