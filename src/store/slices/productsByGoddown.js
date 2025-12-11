import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

// Async Thunk to Fetch Products by Category ID
export const fetchProductsByGoddown = createAsyncThunk(
  'products/fetchByGoddown',
  async (goddownId, { rejectWithValue }) => {
    try {
      const response = await axios.post(`/api/goddown/get-productsby-goddown`,{godownId:goddownId});
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Failed to fetch products');
    }
  }
);

const productsByGoddownSlice = createSlice({
  name: 'productsByGoddown',
  initialState: {
    products: [],
    loading: false,
    fetched: false,
    error: null
  },
  reducers: {
    updateProducts: (state, action) => {
      state.products = action.payload.data;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchProductsByGoddown.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProductsByGoddown.fulfilled, (state, action) => {
        state.loading = false;
        state.products = action.payload.data;
        state.fetched = true;
      })
      .addCase(fetchProductsByGoddown.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  }
});

export const { updateProducts } = productsByGoddownSlice.actions;
export default productsByGoddownSlice.reducer;
