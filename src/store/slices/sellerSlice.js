import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

// Async Thunk to Fetch Seller Data
export const fetchSeller = createAsyncThunk(
  'seller/fetchSeller',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get('/api/seller'); // Change API URL as needed
      return response.data; // Expecting { buyerName, mobileNumber }
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Failed to fetch seller');
    }
  }
);

const sellerSlice = createSlice({
  name: 'sellers',
  initialState: {
    sellers: [],
    loading: false,
    fetched: false,
    error: null
  },
  reducers: {
    updateSeller: (state, action) => {
      state.buyerName = action.payload.buyerName;
      state.mobileNumber = action.payload.mobileNumber;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchSeller.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSeller.fulfilled, (state, action) => {
        state.loading = false;
        state.sellers = action.payload.data;
        state.fetched = true;
      })
      .addCase(fetchSeller.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  }
});

export const { updateSeller } = sellerSlice.actions;
export default sellerSlice.reducer;
