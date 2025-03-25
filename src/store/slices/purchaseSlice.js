import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

// Async Thunk to Fetch Buyer Data
export const fetchPurchases  = createAsyncThunk(
  'purchase/fetchPurchases ',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get('/api/purchase'); // Change API URL as needed
      return response.data; 
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Failed to fetch purchases');
    }
  }
);

const purchaseSlice = createSlice({
  name: 'purchases',
  initialState: {
    purchases: [],
    loading: false,
    fetched: false,
    error: null
  },
  reducers: {
    updatePurchase: (state, action) => {
      state.purchases = action.payload.data;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchPurchases .pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPurchases .fulfilled, (state, action) => {
        state.loading = false;
        state.purchases = action.payload.data;
        state.fetched = true;
      })
      .addCase(fetchPurchases .rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  }
});

export const { updatePurchase } = purchaseSlice.actions;
export default purchaseSlice.reducer;
