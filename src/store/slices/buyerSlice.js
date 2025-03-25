import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

// Async Thunk to Fetch Buyer Data
export const fetchBuyer = createAsyncThunk(
  'buyer/fetchBuyer',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get('/api/buyer'); // Change API URL as needed
      return response.data; // Expecting { buyerName, mobileNumber }
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Failed to fetch buyer');
    }
  }
);

const buyerSlice = createSlice({
  name: 'buyers',
  initialState: {
    buyers: [],
    loading: false,
    fetched: false,
    error: null
  },
  reducers: {
    updateBuyer: (state, action) => {
      state.buyerName = action.payload.buyerName;
      state.mobileNumber = action.payload.mobileNumber;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchBuyer.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchBuyer.fulfilled, (state, action) => {
        state.loading = false;
        state.buyers = action.payload.data;
        state.fetched = true;
      })
      .addCase(fetchBuyer.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  }
});

export const { updateBuyer } = buyerSlice.actions;
export default buyerSlice.reducer;
