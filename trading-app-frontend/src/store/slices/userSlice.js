import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';
import appwriteAuth from '../../services/appwriteAuth';

export const fetchUserProfile = createAsyncThunk(
  'user/fetchProfile',
  async () => {
    console.log('🔍 Fetching user profile...');
    const response = await api.get('/users/me');
    console.log('✅ User profile fetched:', response.data);
    return response.data;
  }
);

export const updateUserProfile = createAsyncThunk(
  'user/updateProfile',
  async (profileData) => {
    const response = await api.put('/users/me', profileData);
    return response.data;
  }
);

export const login = createAsyncThunk(
  'user/login',
  async (credentials, { rejectWithValue }) => {
    try {
      console.log('🔑 Logging in with Appwrite:', credentials.email);
      
      // Use Appwrite authentication directly
      const result = await appwriteAuth.login(credentials.email, credentials.password);
      
      if (!result.success) {
        return rejectWithValue(result.error);
      }
      
      console.log('✅ Login successful:', result.user.$id);
      
      // Return user data in format expected by Redux
      return {
        id: result.user.$id,
        email: result.user.email,
        name: result.user.name,
        username: result.profile?.username || result.user.email.split('@')[0],
        created_at: result.user.$createdAt,
        profile: result.profile
      };
      
    } catch (error) {
      console.error('❌ Login failed:', error);
      return rejectWithValue({
        message: error.message || 'Login failed',
        code: error.code || 'login_error'
      });
    }
  }
);

export const signup = createAsyncThunk(
  'user/signup',
  async (userData, { rejectWithValue }) => {
    try {
      console.log('🔐 Registering user with Appwrite:', userData);
      
      // Prepare additional data
      const additionalData = {
        username: userData.username,
        zipcode: userData.zipcode,
        optInLocation: userData.optInLocation
      };
      
      // Use Appwrite authentication directly with additional data
      const result = await appwriteAuth.register(
        userData.email,
        userData.password,
        userData.name || userData.username,
        additionalData
      );
      
      if (!result.success) {
        return rejectWithValue(result.error);
      }
      
      console.log('✅ Registration successful:', result.user.$id);
      
      // Return user data in format expected by Redux
      return {
        id: result.user.$id,
        email: result.user.email,
        name: result.user.name,
        username: result.profile?.username || userData.email.split('@')[0],
        created_at: result.user.$createdAt,
        profile: result.profile
      };
      
    } catch (error) {
      console.error('❌ Registration failed:', error);
      return rejectWithValue({
        message: error.message || 'Registration failed',
        code: error.code || 'registration_error'
      });
    }
  }
);

export const logout = createAsyncThunk(
  'user/logout',
  async () => {
    localStorage.removeItem('token');
    return null;
  }
);

const userSlice = createSlice({
  name: 'user',
  initialState: {
    currentUser: null,
    isAuthenticated: false,
    loading: false,
    error: null,
  },
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setError: (state, action) => {
      state.error = action.payload;
      state.loading = false;
    },
    setUser: (state, action) => {
      state.currentUser = action.payload;
      state.isAuthenticated = true;
      state.loading = false;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
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
        state.error = action.error.message;
        // If user profile fetch fails and we have a token, it might be invalid
        if (localStorage.getItem('token')) {
          console.log('❌ User profile fetch failed with token present - clearing invalid token');
          localStorage.removeItem('token');
        }
        state.isAuthenticated = false;
        state.currentUser = null;
      })
      .addCase(updateUserProfile.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateUserProfile.fulfilled, (state, action) => {
        state.loading = false;
        state.currentUser = action.payload;
      })
      .addCase(updateUserProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      .addCase(login.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.loading = false;
        state.currentUser = action.payload;
        state.isAuthenticated = true;
      })
      .addCase(login.rejected, (state, action) => {
        state.loading = false;
        // Use the specific error message from rejectWithValue
        state.error = action.payload || action.error.message || 'Login failed. Please try again.';
        console.error('Login rejected with error:', action.error);
      })
      .addCase(logout.fulfilled, (state) => {
        state.currentUser = null;
        state.isAuthenticated = false;
      })
      .addCase(signup.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(signup.fulfilled, (state, action) => {
        state.loading = false;
        // Don't set currentUser or isAuthenticated - user needs to login
      })
      .addCase(signup.rejected, (state, action) => {
        state.loading = false;
        // Handle both rejectWithValue payload and error object
        if (action.payload) {
          state.error = action.payload.message || action.payload || 'Registration failed';
        } else if (action.error) {
          state.error = action.error.message || 'Registration failed';
        } else {
          state.error = 'Registration failed. Please try again.';
        }
        console.error('Signup rejected with error:', action.payload || action.error);
      });
  },
});

export const { clearError, setError, setUser } = userSlice.actions;
export default userSlice.reducer;