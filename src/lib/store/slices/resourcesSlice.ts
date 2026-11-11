// src/lib/store/slices/resourcesSlice.ts
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';

export interface Resource {
  id: number;
  name: string;
  display_name: string;
  resource_type_id: number;
  year: number;
  description?: string;
  metadata?: Record<string, unknown> | null;
  created_by: number | null;
  created_at: string;
  updated_at: string;
  resource_type_name?: string;
  created_by_name?: string;
  file_count?: number;
}

export interface ResourceCategory {
  id: number;
  name: string;
  type: string;
  metadata?: Record<string, unknown> | null;
}

export interface ResourceFile {
  id: number;
  resource_id: number;
  name: string;
  display_name: string;
  file_type: string;
  file_url: string;
  file_size: number;
  ministry_id?: number | null;
  uploaded_by: number | null;
  uploaded_at: string;
  metadata?: Record<string, unknown> | null;
  ministry_name?: string;
  uploaded_by_name?: string;
}

interface ResourcesState {
  resources: Resource[];
  categories: ResourceCategory[];
  files: { [resourceId: number]: ResourceFile[] };
  loading: boolean;
  error: string | null;
  lastFetched: number | null;
}

const initialState: ResourcesState = {
  resources: [],
  categories: [],
  files: {},
  loading: false,
  error: null,
  lastFetched: null,
};

// Async thunks — everything goes through the guarded /api/resources routes (never straight to Supabase from the browser).
async function call<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: init?.body && !(init.body instanceof FormData) ? { 'Content-Type': 'application/json' } : undefined,
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error || `Request failed (${res.status})`);
  return json as T;
}

export const fetchResources = createAsyncThunk(
  'resources/fetchResources',
  async (filters?: { year?: number; typeId?: number }) => {
    const qs = new URLSearchParams();
    if (filters?.year) qs.set('year', String(filters.year));
    if (filters?.typeId) qs.set('type_id', String(filters.typeId));
    return call<Resource[]>(`/api/resources${qs.toString() ? `?${qs}` : ''}`);
  }
);

export const fetchCategories = createAsyncThunk('resources/fetchCategories', async () =>
  call<ResourceCategory[]>('/api/categories?type=resource_type')
);

export type ResourceInput = {
  name: string;
  display_name: string;
  resource_type_id: number;
  year: number;
  description?: string;
  metadata?: Record<string, unknown> | null;
};

export const createResource = createAsyncThunk('resources/createResource', async (resourceData: ResourceInput) =>
  call<Resource>('/api/resources', { method: 'POST', body: JSON.stringify(resourceData) })
);

export const updateResource = createAsyncThunk(
  'resources/updateResource',
  async ({ id, updates }: { id: number; updates: Partial<ResourceInput> }) =>
    call<Resource>(`/api/resources/${id}`, { method: 'PUT', body: JSON.stringify(updates) })
);

export const deleteResource = createAsyncThunk('resources/deleteResource', async (id: number) => {
  await call(`/api/resources/${id}`, { method: 'DELETE' });
  return id;
});

export const fetchResourceFiles = createAsyncThunk('resources/fetchResourceFiles', async (resourceId: number) => ({
  resourceId,
  files: await call<ResourceFile[]>(`/api/resources/${resourceId}/files`),
}));

/** Uploads via the API route, which stores the file in the Supabase Storage bucket "documents". */
export const uploadFile = createAsyncThunk(
  'resources/uploadFile',
  async ({ resourceId, file, ministryId, displayName }: { resourceId: number; file: File; ministryId?: number; displayName: string }) => {
    const body = new FormData();
    body.append('file', file);
    body.append('displayName', displayName);
    if (ministryId) body.append('ministryId', String(ministryId));
    return call<ResourceFile>(`/api/resources/${resourceId}/files`, { method: 'POST', body });
  }
);

export const deleteFile = createAsyncThunk(
  'resources/deleteFile',
  async ({ resourceId, fileId }: { resourceId: number; fileId: number }) => {
    await call(`/api/resources/${resourceId}/files?fileId=${fileId}`, { method: 'DELETE' });
    return { resourceId, fileId };
  }
);

const resourcesSlice = createSlice({
  name: 'resources',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearFiles: (state, action: PayloadAction<number>) => {
      delete state.files[action.payload];
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch Resources
      .addCase(fetchResources.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchResources.fulfilled, (state, action) => {
        state.loading = false;
        state.resources = action.payload;
        state.lastFetched = Date.now();
      })
      .addCase(fetchResources.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch resources';
      })
      // Fetch Categories
      .addCase(fetchCategories.fulfilled, (state, action) => {
        state.categories = action.payload;
      })
      // Create Resource
      .addCase(createResource.fulfilled, (state, action) => {
        state.resources.unshift(action.payload);
      })
      // Update Resource
      .addCase(updateResource.fulfilled, (state, action) => {
        const index = state.resources.findIndex(r => r.id === action.payload.id);
        if (index !== -1) {
          state.resources[index] = { ...state.resources[index], ...action.payload };
        }
      })
      // Delete Resource
      .addCase(deleteResource.fulfilled, (state, action) => {
        state.resources = state.resources.filter(r => r.id !== action.payload);
      })
      // Fetch Files
      .addCase(fetchResourceFiles.fulfilled, (state, action) => {
        state.files[action.payload.resourceId] = action.payload.files;
      })
      // Upload File
      .addCase(uploadFile.fulfilled, (state, action) => {
        const resourceId = action.payload.resource_id;
        if (state.files[resourceId]) {
          state.files[resourceId].unshift(action.payload);
        }
        // Update file count in resources list
        const resource = state.resources.find(r => r.id === resourceId);
        if (resource) {
          resource.file_count = (resource.file_count || 0) + 1;
        }
      })
      // Delete File
      .addCase(deleteFile.fulfilled, (state, action) => {
        const { resourceId, fileId } = action.payload;
        if (state.files[resourceId]) {
          state.files[resourceId] = state.files[resourceId].filter(f => f.id !== fileId);
        }
        // Update file count in resources list
        const resource = state.resources.find(r => r.id === resourceId);
        if (resource && resource.file_count) {
          resource.file_count -= 1;
        }
      });
  },
});

export const { clearError, clearFiles } = resourcesSlice.actions;
export default resourcesSlice.reducer;