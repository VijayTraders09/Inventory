import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

// Async Thunk to Fetch Products by Category ID
export const fetchProductsByCategory = createAsyncThunk(
  'products/fetchByCategory',
  async (categoryId, { rejectWithValue }) => {
    try {
      const response = await axios.get(`/api/products?categoryId=${categoryId}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Failed to fetch products');
    }
  }
);

const productSlice = createSlice({
  name: 'products',
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
      .addCase(fetchProductsByCategory.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProductsByCategory.fulfilled, (state, action) => {
        state.loading = false;
        state.products = action.payload.data;
        state.fetched = true;
      })
      .addCase(fetchProductsByCategory.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  }
});

export const { updateProducts } = productSlice.actions;
export default productSlice.reducer;
