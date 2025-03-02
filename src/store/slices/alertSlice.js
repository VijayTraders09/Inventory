import { createSlice } from "@reduxjs/toolkit";

const alertSlice = createSlice({
  name: "alert",
  initialState: { type: null, message: null },
  reducers: {
    showAlert: (state, action) => {
      state.type = action.payload.type;
      state.message = action.payload.message;
    },
    hideAlert: (state) => {
      state.type = null;
      state.message = null;
    },
  },
});

export const { showAlert, hideAlert } = alertSlice.actions;
export default alertSlice.reducer;
