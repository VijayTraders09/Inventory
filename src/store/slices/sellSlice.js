import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

// Async Thunk to Fetch Buyer Data
export const fetchSells = createAsyncThunk(
  "sell/fetchSells ",
  async (buyerId='', { rejectWithValue }) => {
    try {
      const response = await axios.get(`/api/sell?buyerId=${buyerId}`); // Change API URL as needed
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || "Failed to fetch sells");
    }
  }
);

const sellSlice = createSlice({
  name: "sells",
  initialState: {
    sells: [],
    loading: false,
    fetched: false,
    error: null,
  },
  reducers: {
    updateSell: (state, action) => {
      state.sells = action.payload.data;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchSells.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSells.fulfilled, (state, action) => {
        state.loading = false;
        state.sells = action.payload.data;
        state.fetched = true;
      })
      .addCase(fetchSells.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { updateSell } = sellSlice.actions;
export default sellSlice.reducer;
