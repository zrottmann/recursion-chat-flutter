import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

export const fetchListings = createAsyncThunk(
  'listings/fetchListings',
  async ({ page = 1, limit = 10, userId = null }) => {
    const url = userId 
      ? `/users/${userId}/listings?page=${page}&limit=${limit}`
      : `/api/listings?page=${page}&limit=${limit}`;
    const response = await api.get(url);
    return response.data;
  }
);

export const createListing = createAsyncThunk(
  'listings/createListing',
  async (listingData) => {
    const response = await api.post('/items', listingData);
    return response.data;
  }
);

export const updateListing = createAsyncThunk(
  'listings/updateListing',
  async ({ id, data }) => {
    const response = await api.put(`/items/${id}`, data);
    return response.data;
  }
);

export const deleteListing = createAsyncThunk(
  'listings/deleteListing',
  async (id) => {
    await api.delete(`/items/${id}`);
    return id;
  }
);

export const searchListings = createAsyncThunk(
  'listings/searchListings',
  async ({ radius, query, latitude, longitude }) => {
    const response = await api.post('/api/listings/search', {
      radius: radius || 10,
      query: query || null,
      latitude: latitude || null,
      longitude: longitude || null
    });
    return response.data;
  }
);

const listingsSlice = createSlice({
  name: 'listings',
  initialState: {
    listings: [],
    searchResults: [],
    currentPage: 1,
    totalPages: 1,
    totalCount: 0,
    loading: false,
    error: null,
  },
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setCurrentPage: (state, action) => {
      state.currentPage = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchListings.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchListings.fulfilled, (state, action) => {
        state.loading = false;
        state.listings = action.payload.listings;
        state.currentPage = action.payload.page;
        state.totalPages = action.payload.total_pages;
        state.totalCount = action.payload.total;
      })
      .addCase(fetchListings.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      .addCase(createListing.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createListing.fulfilled, (state, action) => {
        state.loading = false;
        state.listings.unshift(action.payload);
      })
      .addCase(createListing.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      .addCase(updateListing.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateListing.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.listings.findIndex(l => l.id === action.payload.id);
        if (index !== -1) {
          state.listings[index] = action.payload;
        }
      })
      .addCase(updateListing.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      .addCase(deleteListing.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteListing.fulfilled, (state, action) => {
        state.loading = false;
        state.listings = state.listings.filter(l => l.id !== action.payload);
      })
      .addCase(deleteListing.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      .addCase(searchListings.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(searchListings.fulfilled, (state, action) => {
        state.loading = false;
        state.searchResults = action.payload;
      })
      .addCase(searchListings.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      });
  },
});

export const { clearError, setCurrentPage } = listingsSlice.actions;
export default listingsSlice.reducer;