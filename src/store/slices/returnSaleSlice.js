import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

// Async Thunk to Fetch Buyer Data
export const fetchReturnSale  = createAsyncThunk(
  'return-sale/fetchReturnSale ',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get('/api/return-sale'); // Change API URL as needed
      return response.data; 
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Failed to fetch returnSale');
    }
  }
);

const returnSaleSlice = createSlice({
  name: 'returnSales',
  initialState: {
    returnSales: [],
    loading: false,
    fetched: false,
    error: null
  },
  reducers: {
    updateSalePurchases: (state, action) => {
      state.returnSales = action.payload.data;
    },
     updateSalePurchasesFetched: (state, action) => {
      state.fetched = action.payload.data;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchReturnSale .pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchReturnSale .fulfilled, (state, action) => {
        state.loading = false;
        state.returnSales = action.payload.data;
        state.fetched = true;
      })
      .addCase(fetchReturnSale .rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  }
});

export const { updateSalePurchases,updateSalePurchasesFetched } = returnSaleSlice.actions;
export default returnSaleSlice.reducer;
