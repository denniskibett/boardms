// src/lib/store/slices/resourcesSlice.ts
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { supabase } from '@/lib/supabase/client';

interface Resource {
  id: number;
  name: string;
  display_name: string;
  resource_type_id: number;
  year: number;
  description?: string;
  metadata?: any;
  created_by: string;
  created_at: string;
  updated_at: string;
  resource_type_name?: string;
  created_by_name?: string;
  file_count?: number;
}

interface ResourceCategory {
  id: number;
  name: string;
  type: string;
  metadata?: any;
}

interface ResourceFile {
  id: number;
  resource_id: number;
  name: string;
  display_name: string;
  file_type: string;
  file_url: string;
  file_size: number;
  ministry_id?: number;
  uploaded_by: string;
  uploaded_at: string;
  metadata?: any;
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

// Async thunks
export const fetchResources = createAsyncThunk(
  'resources/fetchResources',
  async (filters?: { year?: number; type?: string }) => {
    let query = supabase
      .from('resources')
      .select(`
        *,
        categories!resource_type_id(name),
        users!created_by(name),
        resource_files(count)
      `);

    if (filters?.year) {
      query = query.eq('year', filters.year);
    }
    if (filters?.type) {
      query = query.eq('categories.name', filters.type);
    }

    const { data, error } = await query
      .order('year', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) throw error;

    return data.map(resource => ({
      ...resource,
      resource_type_name: resource.categories?.name,
      created_by_name: resource.users?.name,
      file_count: resource.resource_files?.[0]?.count || 0
    }));
  }
);

export const fetchCategories = createAsyncThunk(
  'resources/fetchCategories',
  async () => {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('type', 'resource_type')
      .order('name');

    if (error) throw error;
    return data;
  }
);

export const createResource = createAsyncThunk(
  'resources/createResource',
  async (resourceData: {
    name: string;
    display_name: string;
    resource_type_id: number;
    year: number;
    description?: string;
    metadata?: any;
  }) => {
    const folderName = resourceData.name.toUpperCase().replace(/ /g, '-').replace(/[^A-Z0-9-]/g, '');
    
    const { data, error } = await supabase
      .from('resources')
      .insert([{
        ...resourceData,
        name: folderName,
        created_by: (await supabase.auth.getUser()).data.user?.id
      }])
      .select(`
        *,
        categories!resource_type_id(name),
        users!created_by(name)
      `)
      .single();

    if (error) throw error;

    return {
      ...data,
      resource_type_name: data.categories?.name,
      created_by_name: data.users?.name,
      file_count: 0
    };
  }
);

export const updateResource = createAsyncThunk(
  'resources/updateResource',
  async ({ id, updates }: { id: number; updates: Partial<Resource> }) => {
    const { data, error } = await supabase
      .from('resources')
      .update(updates)
      .eq('id', id)
      .select(`
        *,
        categories!resource_type_id(name),
        users!created_by(name)
      `)
      .single();

    if (error) throw error;

    return {
      ...data,
      resource_type_name: data.categories?.name,
      created_by_name: data.users?.name
    };
  }
);

export const deleteResource = createAsyncThunk(
  'resources/deleteResource',
  async (id: number) => {
    const { error } = await supabase
      .from('resources')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return id;
  }
);

export const fetchResourceFiles = createAsyncThunk(
  'resources/fetchResourceFiles',
  async (resourceId: number) => {
    const { data, error } = await supabase
      .from('resource_files')
      .select(`
        *,
        ministries(name),
        users!uploaded_by(name)
      `)
      .eq('resource_id', resourceId)
      .order('uploaded_at', { ascending: false });

    if (error) throw error;

    return {
      resourceId,
      files: data.map(file => ({
        ...file,
        ministry_name: file.ministries?.name,
        uploaded_by_name: file.users?.name
      }))
    };
  }
);

export const uploadFile = createAsyncThunk(
  'resources/uploadFile',
  async ({
    resourceId,
    file,
    ministryId,
    displayName
  }: {
    resourceId: number;
    file: File;
    ministryId?: number;
    displayName: string;
  }) => {
    // Upload file to Supabase Storage
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
    const filePath = `resources/${resourceId}/${fileName}`;

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('documents')
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('documents')
      .getPublicUrl(filePath);

    // Create file record in database
    const { data, error } = await supabase
      .from('resource_files')
      .insert([{
        resource_id: resourceId,
        name: fileName,
        display_name: displayName,
        file_type: file.type,
        file_url: publicUrl,
        file_size: file.size,
        ministry_id: ministryId,
        uploaded_by: (await supabase.auth.getUser()).data.user?.id
      }])
      .select(`
        *,
        ministries(name),
        users!uploaded_by(name)
      `)
      .single();

    if (error) throw error;

    return {
      ...data,
      ministry_name: data.ministries?.name,
      uploaded_by_name: data.users?.name
    };
  }
);

export const deleteFile = createAsyncThunk(
  'resources/deleteFile',
  async (fileId: number) => {
    // First get file info to delete from storage
    const { data: file, error: fetchError } = await supabase
      .from('resource_files')
      .select('*')
      .eq('id', fileId)
      .single();

    if (fetchError) throw fetchError;

    // Delete from storage
    const { error: storageError } = await supabase.storage
      .from('documents')
      .remove([file.file_url]);

    if (storageError) {
      console.error('Storage deletion error:', storageError);
      // Continue with database deletion even if storage fails
    }

    // Delete from database
    const { error } = await supabase
      .from('resource_files')
      .delete()
      .eq('id', fileId);

    if (error) throw error;

    return { fileId, resourceId: file.resource_id };
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
          state.resources[index] = action.payload;
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