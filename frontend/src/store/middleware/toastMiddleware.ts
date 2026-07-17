// store/middleware/toastMiddleware.ts
import { Middleware, isRejectedWithValue, isFulfilled } from "@reduxjs/toolkit";
import { toast } from "sonner";

/**
 * Generic across every slice — no per-thunk-name config, no RTK version
 * dependency on meta-argument typings.
 *
 * SUCCESS: only toasts if the thunk's fulfilled payload is shaped like
 *   { data, toastMessage }. Thunks that just return raw data (GET/fetch
 *   thunks) won't match this shape, so they stay silent automatically.
 *
 * ERROR: toasts using action.payload (from rejectWithValue), which was
 * already generic — no change needed there.
 */
function isToastPayload(payload: unknown): payload is { data: unknown; toastMessage?: string } {
  return !!payload && typeof payload === "object" && "toastMessage" in (payload as object);
}

export const toastMiddleware: Middleware =
  () => (next) => (action: any) => {
    if (isRejectedWithValue(action)) {
      const ignoredActions = [
        "auth/fetchCurrentUser/rejected",
      ];

      if (ignoredActions.includes(action.type)) {
        return next(action);
      }

      const message =
        typeof action.payload === "string"
          ? action.payload
          : action.payload?.message ||
            "Something went wrong. Please try again.";

      toast.error(message);
    }

    if (isFulfilled(action) && isToastPayload(action.payload)) {
      if (action.payload.toastMessage) {
        toast.success(action.payload.toastMessage);
      }
    }

    return next(action);
  };