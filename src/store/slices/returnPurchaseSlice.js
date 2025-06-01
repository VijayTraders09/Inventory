import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

// Async Thunk to Fetch Buyer Data
export const fetchReturnPurchases  = createAsyncThunk(
  'return-purchases/fetchReturnPurchases ',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get('/api/return-purchase'); // Change API URL as needed
      return response.data; 
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Failed to fetch returnPurchases');
    }
  }
);

const returnPurchaseSlice = createSlice({
  name: 'returnPurchases',
  initialState: {
    returnPurchases: [],
    loading: false,
    fetched: false,
    error: null
  },
  reducers: {
    updateReturnPurchases: (state, action) => {
      state.returnPurchases = action.payload.data;
    },
    updateReturnPurchasesFetched: (state, action) => {
      state.fetched = action.payload.data;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchReturnPurchases .pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchReturnPurchases .fulfilled, (state, action) => {
        state.loading = false;
        state.returnPurchases = action.payload.data;
        state.fetched = true;
      })
      .addCase(fetchReturnPurchases .rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  }
});

export const { updateReturnPurchases ,updateReturnPurchasesFetched} = returnPurchaseSlice.actions;
export default returnPurchaseSlice.reducer;
