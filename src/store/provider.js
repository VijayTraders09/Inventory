"use client";
import React from "react";
import { Provider } from "react-redux";
import { store } from "./store";
import { ToastContainer } from "react-toastify";

const ReduxProvider = ({ children }) => {
  return (
    <Provider store={store}>
      <ToastContainer position="top-right" autoClose={3000} />
      {children}
    </Provider>
  );
};

export default ReduxProvider;
