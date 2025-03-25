"use client";
import { configureStore } from "@reduxjs/toolkit";
import alertReducer from "./slices/alertSlice";
import buyerReducer from "./slices/buyerSlice";
import goddownReducer from "./slices/goddownSlice";
import productReducer from "./slices/productSlice";
import categoryReducer from "./slices/categorySlice";
import sellerReducer from "./slices/sellerSlice";
import sellReducer from "./slices/sellSlice";
import purchaseReducer from "./slices/purchaseSlice";

export const store = configureStore({
  reducer: {
    alert: alertReducer,
    buyers: buyerReducer,
    goddowns: goddownReducer,
    products: productReducer,
    categories: categoryReducer,
    sellers: sellerReducer,
    sells: sellReducer,
    purchases: purchaseReducer,
  },
});
