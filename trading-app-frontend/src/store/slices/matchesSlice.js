import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';
import appwriteAIMatching from '../../services/appwriteAIMatching';
import matchingService from '../../services/matchingService';

export const fetchMatches = createAsyncThunk(
  'matches/fetchMatches',
  async ({ page = 1, limit = 10, force_refresh = false, useAI = true }) => {
    try {
      // Try Appwrite AI matching first
      if (useAI) {
        const aiMatches = await appwriteAIMatching.generateAIMatches(null, {
          maxMatches: limit,
          includeSemanticMatches: true,
          includeBundleMatches: true,
          includeProactiveMatches: true
        });
        
        if (aiMatches && aiMatches.length > 0) {
          return {
            matches: aiMatches,
            page: page,
            total_pages: Math.ceil(aiMatches.length / limit),
            total: aiMatches.length
          };
        }
      }
      
      // Fall back to regular matching service
      const result = await matchingService.getMatches({ page, limit });
      if (result.success) {
        return {
          matches: result.matches,
          page: result.page || page,
          total_pages: result.total_pages || 1,
          total: result.total || 0
        };
      }
      
      // Finally try legacy API
      const response = await api.get(`/matching/user-matches/me?max_matches=${limit}&include_expired=false${force_refresh ? '&_t=' + Date.now() : ''}`);
      return {
        matches: response.data || [],
        page: page,
        total_pages: Math.ceil((response.data?.length || 0) / limit),
        total: response.data?.length || 0
      };
    } catch (error) {
      console.error('Failed to fetch matches:', error);
      return {
        matches: [],
        page: 1,
        total_pages: 0,
        total: 0
      };
    }
  }
);

export const acceptMatch = createAsyncThunk(
  'matches/acceptMatch',
  async (acceptData) => {
    try {
      // Try Appwrite AI matching service first
      const userId = await appwriteAIMatching.initializeForUser();
      if (userId && acceptData.match_id) {
        const result = await appwriteAIMatching.acceptMatch(acceptData.match_id, userId);
        if (result.success) {
          return result.match;
        }
      }
      
      // Fall back to legacy API
      const response = await api.post('/matching/accept-match', acceptData);
      return response.data;
    } catch (error) {
      console.error('Failed to accept match:', error);
      throw error;
    }
  }
);

export const declineMatch = createAsyncThunk(
  'matches/declineMatch',
  async (declineData) => {
    try {
      // Try Appwrite AI matching service first
      const userId = await appwriteAIMatching.initializeForUser();
      if (userId && declineData.match_id) {
        const result = await appwriteAIMatching.declineMatch(
          declineData.match_id, 
          userId, 
          declineData.reason
        );
        if (result.success) {
          return result.match;
        }
      }
      
      // Fall back to legacy API
      const response = await api.post('/matching/decline-match', declineData);
      return response.data;
    } catch (error) {
      console.error('Failed to decline match:', error);
      throw error;
    }
  }
);

const matchesSlice = createSlice({
  name: 'matches',
  initialState: {
    matches: [],
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
      .addCase(fetchMatches.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMatches.fulfilled, (state, action) => {
        state.loading = false;
        state.matches = action.payload.matches;
        state.currentPage = action.payload.page;
        state.totalPages = action.payload.total_pages;
        state.totalCount = action.payload.total;
      })
      .addCase(fetchMatches.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      .addCase(acceptMatch.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(acceptMatch.fulfilled, (state, action) => {
        state.loading = false;
        // Remove accepted match from the list
        state.matches = state.matches.filter(match => match.id !== action.meta.arg.match_id);
      })
      .addCase(acceptMatch.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      .addCase(declineMatch.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(declineMatch.fulfilled, (state, action) => {
        state.loading = false;
        // Remove declined match from the list
        state.matches = state.matches.filter(match => match.id !== action.meta.arg.match_id);
      })
      .addCase(declineMatch.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      });
  },
});

export const { clearError, setCurrentPage } = matchesSlice.actions;
export default matchesSlice.reducer;