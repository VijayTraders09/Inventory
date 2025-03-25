import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

// Async Thunk to Fetch Buyer Data
export const fetchCategories  = createAsyncThunk(
  'category/fetchCategory ',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get('/api/category'); // Change API URL as needed
      return response.data; 
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Failed to fetch category');
    }
  }
);

const categorySlice = createSlice({
  name: 'categories',
  initialState: {
    categories: [],
    loading: false,
    fetched: false,
    error: null
  },
  reducers: {
    updateCategory: (state, action) => {
      state.categories = action.payload.data;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCategories .pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCategories .fulfilled, (state, action) => {
        state.loading = false;
        state.categories = action.payload.data;
        state.fetched = true;
      })
      .addCase(fetchCategories .rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  }
});

export const { updateCategory } = categorySlice.actions;
export default categorySlice.reducer;
