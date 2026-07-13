import { configureStore } from "@reduxjs/toolkit";
import { TypedUseSelectorHook, useDispatch, useSelector } from "react-redux";
import authReducer from "./slices/authSlice";
import billingReducer from "./slices/Billingslice"; 
import qrReducer from "./slices/qrSlice";
import analyticsReducer from "./slices/analyticsSlice"
export const store = configureStore({
  reducer: {
    auth: authReducer,
    billing: billingReducer,
    qr:qrReducer,
     analytics: analyticsReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

// Use throughout your app instead of plain `useDispatch` and `useSelector`
export const useAppDispatch: () => AppDispatch = useDispatch;
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
