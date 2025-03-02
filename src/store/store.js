"use client"
import { configureStore } from "@reduxjs/toolkit";
import alertReducer from "./slices/alertSlice";

export const store = configureStore({
  reducer: {
    alert: alertReducer,
  },
});
