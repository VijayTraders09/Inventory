import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

// Async Thunk to Fetch Buyer Data
export const fetchGoddowns  = createAsyncThunk(
  'goddown/fetchGoddowns ',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get('/api/goddown'); // Change API URL as needed
      return response.data; 
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Failed to fetch goddown');
    }
  }
);

const goddownSlice = createSlice({
  name: 'goddowns',
  initialState: {
    goddowns: [],
    loading: false,
    fetched: false,
    error: null
  },
  reducers: {
    updateGoddown: (state, action) => {
      state.goddowns = action.payload.data;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchGoddowns .pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchGoddowns .fulfilled, (state, action) => {
        state.loading = false;
        state.goddowns = action.payload.data;
        state.fetched = true;
      })
      .addCase(fetchGoddowns .rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  }
});

export const { updateGoddown } = goddownSlice.actions;
export default goddownSlice.reducer;
