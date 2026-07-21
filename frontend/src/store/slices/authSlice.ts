import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { api, setAccessToken } from "@/lib/api";
import { toast } from "sonner";

// Assuming UserRole enum from backend
export enum UserRole {
  SUPERADMIN = "superadmin",
  ADMIN = "admin",
  USER = "user",
}

export interface User {
  _id: string;
  name: string;
  email: string;
  role: UserRole;
  isActive: boolean;
  isVerified: boolean;
  avatar?: string;
  currentPlan?: any;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
  verifyingEmail: boolean;
  resendingVerification: boolean;
}

const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  loading: true, // Initially true while we verify session on app load
  error: null,
  verifyingEmail: false,
  resendingVerification: false,
};

export const fetchCurrentUser = createAsyncThunk(
  "auth/fetchCurrentUser",
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get("/auth/me");
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message);
    }
  }
);

export const loginUser = createAsyncThunk(
  "auth/loginUser",
  async (credentials: any, { rejectWithValue }) => {
    try {
      const response = await api.post("/auth/login", credentials);
      const { user, accessToken } = response.data.data;
      setAccessToken(accessToken);
      toast.success(response.data.message || "Login successful");
      return user;
    } catch (error: any) {
      const message = error.response?.data?.message || "Login failed";
      toast.error(message);
      return rejectWithValue(message);
    }
  }
);

export const registerUser = createAsyncThunk(
  "auth/registerUser",
  async (userData: any, { rejectWithValue }) => {
    try {
      const response = await api.post("/auth/register", userData);
      const { user, accessToken } = response.data.data;
      setAccessToken(accessToken);
      toast.success(response.data.message || "Account created successfully");
      return user;
    } catch (error: any) {
      const message = error.response?.data?.message || "Registration failed";
      toast.error(message);
      return rejectWithValue(message);
    }
  }
);

export const logoutUser = createAsyncThunk(
  "auth/logoutUser",
  async (_, { rejectWithValue }) => {
    try {
      await api.post("/auth/logout");
      setAccessToken(null);
      toast.success("Logged out successfully");
      return null;
    } catch (error: any) {
      const message = error.response?.data?.message || "Logout failed";
      toast.error(message);
      return rejectWithValue(message);
    }
  }
);

export const googleLogin = createAsyncThunk(
  "auth/googleLogin",
  async (credential: string, { rejectWithValue }) => {
    try {
      const response = await api.post("/auth/google", { credential });
      const { user, accessToken } = response.data.data;
      setAccessToken(accessToken);
      toast.success(response.data.message || "Signed in with Google");
      return user;
    } catch (error: any) {
      const message = error.response?.data?.message || "Google sign-in failed";
      toast.error(message);
      return rejectWithValue(message);
    }
  }
);

/**
 * Confirms a user's email using the token + email pair from the emailed
 * verification link. Does NOT touch access tokens or session state — the
 * user may click this link on a different device/browser than the one
 * they registered on, so we only patch `user.isVerified` if a session
 * already happens to be loaded for that same account.
 */
export const verifyEmail = createAsyncThunk(
  "auth/verifyEmail",
  async ({ email, token }: { email: string; token: string }, { rejectWithValue }) => {
    try {
      const response = await api.post("/auth/verify-email", { email, token });
      toast.success(response.data.message || "Email verified successfully");
      return response.data.data.user as User;
    } catch (error: any) {
      const message = error.response?.data?.message || "Verification failed";
      return rejectWithValue(message);
    }
  }
);

export const resendVerification = createAsyncThunk(
  "auth/resendVerification",
  async (email: string, { rejectWithValue }) => {
    try {
      const response = await api.post("/auth/resend-verification", { email });
      toast.success(response.data.message || "Verification email sent");
      return true;
    } catch (error: any) {
      const message = error.response?.data?.message || "Failed to resend verification email";
      toast.error(message);
      return rejectWithValue(message);
    }
  }
);

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    // Optional: force clear session directly without API call (e.g. on 401)
    clearSession: (state) => {
      state.user = null;
      state.isAuthenticated = false;
      state.loading = false;
    },
  },
  extraReducers: (builder) => {
    // fetchCurrentUser
    builder.addCase(fetchCurrentUser.pending, (state) => {
      if (!state.isAuthenticated) {
        state.loading = true;
      }
      state.error = null;
    });
    builder.addCase(fetchCurrentUser.fulfilled, (state, action: PayloadAction<User>) => {
      state.user = action.payload;
      state.isAuthenticated = true;
      state.loading = false;
    });
    builder.addCase(fetchCurrentUser.rejected, (state) => {
      state.user = null;
      state.isAuthenticated = false;
      state.loading = false;
    });

    // loginUser
    builder.addCase(loginUser.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(loginUser.fulfilled, (state, action: PayloadAction<User>) => {
      state.user = action.payload;
      state.isAuthenticated = true;
      state.loading = false;
    });
    builder.addCase(loginUser.rejected, (state, action: PayloadAction<any>) => {
      state.loading = false;
      state.error = action.payload;
    });

    // googleLogin
    builder.addCase(googleLogin.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(googleLogin.fulfilled, (state, action: PayloadAction<User>) => {
      state.user = action.payload;
      state.isAuthenticated = true;
      state.loading = false;
    });
    builder.addCase(googleLogin.rejected, (state, action: PayloadAction<any>) => {
      state.loading = false;
      state.error = action.payload;
    });

    // registerUser
    builder.addCase(registerUser.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(registerUser.fulfilled, (state, action: PayloadAction<User>) => {
      state.user = action.payload;
      state.isAuthenticated = true;
      state.loading = false;
    });
    builder.addCase(registerUser.rejected, (state, action: PayloadAction<any>) => {
      state.loading = false;
      state.error = action.payload;
    });

    // logoutUser
    builder.addCase(logoutUser.fulfilled, (state) => {
      state.user = null;
      state.isAuthenticated = false;
      state.loading = false;
    });

    // verifyEmail
    builder.addCase(verifyEmail.pending, (state) => {
      state.verifyingEmail = true;
    });
    builder.addCase(verifyEmail.fulfilled, (state, action: PayloadAction<User>) => {
      state.verifyingEmail = false;
      // Always trust the server response here — don't gate on whether a
      // session was already loaded. If a session exists for this account,
      // sync it immediately; if not, fetchCurrentUser (dispatched by the
      // page below) will pick it up on next load.
      if (state.user && state.user._id === action.payload._id) {
        state.user.isVerified = true;
      }
    });
    builder.addCase(verifyEmail.rejected, (state) => {
      state.verifyingEmail = false;
    });

    // resendVerification
    builder.addCase(resendVerification.pending, (state) => {
      state.resendingVerification = true;
    });
    builder.addCase(resendVerification.fulfilled, (state) => {
      state.resendingVerification = false;
    });
    builder.addCase(resendVerification.rejected, (state) => {
      state.resendingVerification = false;
    });
  },
});

export const { clearError, clearSession } = authSlice.actions;
export default authSlice.reducer;