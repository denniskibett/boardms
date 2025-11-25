// src/lib/store/slices/mdasSlice.ts
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { MDAEntity, MDAType, Pagination, HierarchicalData } from '@/types/mda';

interface UseMDAsParams {
  type?: MDAType;
  page?: number;
  limit?: number;
  search?: string;
}

interface MDAsState {
  // Flat list state (for useMDAs hook)
  entities: MDAEntity[];
  entitiesLoading: boolean;
  entitiesError: string | null;
  entitiesPagination: Pagination;
  entitiesFilters: UseMDAsParams;
  
  // Single MDA state (for useMDA hook)
  currentMDA: any | null;
  currentMDALoading: boolean;
  currentMDAError: string | null;
  
  // Hierarchical data state (for useHierarchicalMDAs hook)
  hierarchicalData: HierarchicalData | null;
  hierarchicalLoading: boolean;
  hierarchicalError: string | null;
  
  // Search state
  search: string;
}

const initialState: MDAsState = {
  // Flat list
  entities: [],
  entitiesLoading: false,
  entitiesError: null,
  entitiesPagination: {
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  },
  entitiesFilters: {
    type: 'agency',
    page: 1,
    limit: 10,
    search: ''
  },
  
  // Single MDA
  currentMDA: null,
  currentMDALoading: false,
  currentMDAError: null,
  
  // Hierarchical data
  hierarchicalData: null,
  hierarchicalLoading: true,
  hierarchicalError: null,
  
  // Search
  search: ''
};

// Async thunks matching your existing hook functionality
export const fetchMDAs = createAsyncThunk(
  'mdas/fetchMDAs',
  async (params: UseMDAsParams = {}, { rejectWithValue }) => {
    try {
      const { type = 'agency', page = 1, limit = 10, search = '' } = params;
      
      const urlParams = new URLSearchParams({
        type,
        page: page.toString(),
        limit: limit.toString(),
        ...(search && { search })
      });

      const response = await fetch(`/api/mdas?${urlParams}`);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch MDAs');
      }

      return result;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const fetchMDA = createAsyncThunk(
  'mdas/fetchMDA',
  async (id: string, { rejectWithValue }) => {
    try {
      if (!id) throw new Error('MDA ID is required');

      const response = await fetch(`/api/mdas/${id}`);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch MDA');
      }

      return result.data;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const fetchHierarchicalMDAs = createAsyncThunk(
  'mdas/fetchHierarchicalMDAs',
  async (_, { rejectWithValue }) => {
    try {
      const response = await fetch('/api/mdas/hierarchical');
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();

      if (result.error) {
        throw new Error(result.error);
      }

      return result.data || { ministries: [], totalAgencies: 0, totalDepartments: 0 };
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

const mdasSlice = createSlice({
  name: 'mdas',
  initialState,
  reducers: {
    setSearch: (state, action: PayloadAction<string>) => {
      state.search = action.payload;
      state.entitiesFilters.search = action.payload;
    },
    setEntitiesFilters: (state, action: PayloadAction<Partial<UseMDAsParams>>) => {
      state.entitiesFilters = { ...state.entitiesFilters, ...action.payload };
    },
    clearEntitiesFilters: (state) => {
      state.entitiesFilters = {
        type: 'agency',
        page: 1,
        limit: 10,
        search: ''
      };
      state.search = '';
    },
    clearCurrentMDA: (state) => {
      state.currentMDA = null;
      state.currentMDAError = null;
    },
    clearHierarchicalError: (state) => {
      state.hierarchicalError = null;
    },
    clearAllErrors: (state) => {
      state.entitiesError = null;
      state.currentMDAError = null;
      state.hierarchicalError = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // fetchMDAs
      .addCase(fetchMDAs.pending, (state) => {
        state.entitiesLoading = true;
        state.entitiesError = null;
      })
      .addCase(fetchMDAs.fulfilled, (state, action) => {
        state.entitiesLoading = false;
        state.entities = action.payload.data;
        state.entitiesPagination = action.payload.pagination;
      })
      .addCase(fetchMDAs.rejected, (state, action) => {
        state.entitiesLoading = false;
        state.entitiesError = action.payload as string;
      })
      // fetchMDA
      .addCase(fetchMDA.pending, (state) => {
        state.currentMDALoading = true;
        state.currentMDAError = null;
      })
      .addCase(fetchMDA.fulfilled, (state, action) => {
        state.currentMDALoading = false;
        state.currentMDA = action.payload;
      })
      .addCase(fetchMDA.rejected, (state, action) => {
        state.currentMDALoading = false;
        state.currentMDAError = action.payload as string;
      })
      // fetchHierarchicalMDAs
      .addCase(fetchHierarchicalMDAs.pending, (state) => {
        state.hierarchicalLoading = true;
        state.hierarchicalError = null;
      })
      .addCase(fetchHierarchicalMDAs.fulfilled, (state, action) => {
        state.hierarchicalLoading = false;
        state.hierarchicalData = action.payload;
      })
      .addCase(fetchHierarchicalMDAs.rejected, (state, action) => {
        state.hierarchicalLoading = false;
        state.hierarchicalError = action.payload as string;
      });
  }
});

export const {
  setSearch,
  setEntitiesFilters,
  clearEntitiesFilters,
  clearCurrentMDA,
  clearHierarchicalError,
  clearAllErrors
} = mdasSlice.actions;

export default mdasSlice.reducer;