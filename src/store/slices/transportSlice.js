import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

// Async Thunk to Fetch Buyer Data
export const fetchTransport  = createAsyncThunk(
  'transport/fetchCategory ',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get('/api/transport'); // Change API URL as needed
      return response.data; 
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Failed to fetch transport');
    }
  }
);

const transportSlice = createSlice({
  name: 'transports',
  initialState: {
    transports: [],
    loading: false,
    fetched: false,
    error: null
  },
  reducers: {
    updateTransport: (state, action) => {
      state.transports = action.payload.data;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchTransport .pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTransport .fulfilled, (state, action) => {
        state.loading = false;
        state.transports = action.payload.data;
        state.fetched = true;
      })
      .addCase(fetchTransport .rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  }
});

export const { updateTransport } = transportSlice.actions;
export default transportSlice.reducer;
