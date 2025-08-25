import { configureStore } from '@reduxjs/toolkit';
import userReducer from './slices/userSlice';
import matchesReducer from './slices/matchesSlice';
import listingsReducer from './slices/listingsSlice';

export const store = configureStore({
  reducer: {
    user: userReducer,
    matches: matchesReducer,
    listings: listingsReducer,
  },
});