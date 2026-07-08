// qrSlice.ts
import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { api } from "@/lib/api";
import { toast } from "sonner";

// --- Types ---
export type QrType =
  | "url"
  | "text"
  | "whatsapp"
  | "wifi"
  | "vcard"
  | "email"
  | "phone"
  | "sms"
  | "location";

export type QrStatus = "active" | "paused" | "archived" | "expired";

export interface QrDesign {
  fgColor: string;
  bgColor: string;
  eyeColor?: string;
  dotStyle: "square" | "rounded" | "dots";
  frame: "none" | "rounded" | "scan-me";
  logo?: string;
  bannerColor?: string;
  accentColor?: string;
}

// Matches the real Mongo document shape returned by the API
export interface QrCode {
  _id: string;
  owner: string;
  name: string;
  type: QrType;
  destination: string;
  content?: Record<string, any>; // per-type structured fields (vcard phones, wifi ssid, etc.)
  shortCode: string;
  shortUrl: string;
  isDynamic: boolean;
  status: QrStatus;
  design: QrDesign;
  scansTotal: number;
  scansToday: number;
  lastScanAt?: string;
  expiresAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface QrPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface QrListFilters {
  page?: number;
  limit?: number;
  status?: QrStatus;
  type?: QrType;
  search?: string;
  sort?: "recent" | "scans" | "name";
}

interface QrState {
  items: QrCode[];
  pagination: QrPagination;
  currentQr: QrCode | null;
  currentShortQr: QrCode | null;
  shortUrl: string | null;
  loading: boolean;
  actionLoading: boolean;
  error: string | null;
}

const initialState: QrState = {
  items: [],
  pagination: {
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  },
  currentQr: null,
  currentShortQr: null,
  shortUrl: null,
  loading: false,
  actionLoading: false,
  error: null,
};

// --- Async Thunks ---
export const fetchQrByShortCode = createAsyncThunk(
  "qr/fetchByShortCode",
  async (shortCode: string, { rejectWithValue }) => {
    if (!shortCode) {
      return rejectWithValue("No short code provided");
    }

    try {
      const res = await api.get(`/qr/short/${shortCode}`);

      // Backend returns:
      // { qr: {...}, shortUrl: "..." }

      return res.data.data as {
        qr: QrCode;
        shortUrl: string;
      };
    } catch (err: any) {
      return rejectWithValue(
        err.response?.data?.message || "Failed to load QR"
      );
    }
  }
);
/** Fetch paginated and filtered list of QR codes */
export const fetchQrCodes = createAsyncThunk(
  "qr/fetchList",
  async (filters: QrListFilters | undefined, { rejectWithValue }) => {
    try {
      const res = await api.get("/qr", { params: filters });
      return {
        items: res.data.data as QrCode[],
        pagination: res.data.meta as QrPagination,
      };
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || "Failed to load QR codes");
    }
  }
);

/** Fetch a single QR code by :id param, along with its short URL */
export const fetchQrById = createAsyncThunk(
  "qr/fetchById",
  async (id: string, { rejectWithValue }) => {
    if (!id) return rejectWithValue("No QR code id provided");
    try {
      const res = await api.get(`/qr/${id}`);
      // Backend returns: { qr: {...}, shortUrl: "..." }
      return res.data.data as { qr: QrCode; shortUrl: string };
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || "Failed to load QR code details");
    }
  }
);

/** Create a new QR code (Respects plan limits/quota) */
export const createQr = createAsyncThunk(
  "qr/create",
  async (payload: Record<string, any>, { rejectWithValue }) => {
    try {
      const res = await api.post("/qr", payload);
      toast.success("QR code created successfully!");
      // Backend returns: { qr, shortUrl, imageDataUrl }
      return res.data.data.qr as QrCode;
    } catch (err: any) {
      const message = err.response?.data?.message || "Failed to create QR code";
      toast.error(message);
      return rejectWithValue(message);
    }
  }
);

/** Update an existing QR code */
export const updateQr = createAsyncThunk(
  "qr/update",
  async ({ id, data }: { id: string; data: Record<string, any> }, { rejectWithValue }) => {
    try {
      const res = await api.patch(`/qr/${id}`, data);
      toast.success("QR code updated successfully!");
      return res.data.data as QrCode;
    } catch (err: any) {
      const message = err.response?.data?.message || "Failed to update QR code";
      toast.error(message);
      return rejectWithValue(message);
    }
  }
);

/** Delete a QR code */
export const deleteQr = createAsyncThunk(
  "qr/delete",
  async (id: string, { rejectWithValue }) => {
    try {
      await api.delete(`/qr/${id}`);
      toast.success("QR code deleted successfully");
      return id;
    } catch (err: any) {
      const message = err.response?.data?.message || "Failed to delete QR code";
      toast.error(message);
      return rejectWithValue(message);
    }
  }
);

// --- Slice Definition ---
const qrSlice = createSlice({
  name: "qr",
  initialState,
  reducers: {
    clearCurrentQr: (state) => {
      state.currentQr = null;
      state.shortUrl = null;
    },
    clearQrError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch by Short Code
      .addCase(fetchQrByShortCode.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.currentShortQr = null;
      })

      .addCase(fetchQrByShortCode.fulfilled, (state, action) => {
        state.loading = false;
        state.currentShortQr = action.payload.qr;
        state.shortUrl = action.payload.shortUrl;
      })

      .addCase(fetchQrByShortCode.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        state.currentShortQr = null;
      })
      // Fetch List
      .addCase(fetchQrCodes.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchQrCodes.fulfilled, (state, action) => {
        state.items = action.payload.items;
        if (action.payload.pagination) {
          state.pagination = action.payload.pagination;
        }
        state.loading = false;
      })
      .addCase(fetchQrCodes.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // Fetch Single (params-based)
      .addCase(fetchQrById.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.currentQr = null; // avoid showing stale QR while a new id loads
      })
      .addCase(fetchQrById.fulfilled, (state, action) => {
        state.currentQr = action.payload.qr;
        state.shortUrl = action.payload.shortUrl;
        state.loading = false;
      })
      .addCase(fetchQrById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        state.currentQr = null;
      })

      // Create QR
      .addCase(createQr.pending, (state) => {
        state.actionLoading = true;
      })
      .addCase(createQr.fulfilled, (state, action) => {
        state.items.unshift(action.payload);
        state.actionLoading = false;
      })
      .addCase(createQr.rejected, (state) => {
        state.actionLoading = false;
      })

      // Update QR
      .addCase(updateQr.pending, (state) => {
        state.actionLoading = true;
      })
      .addCase(updateQr.fulfilled, (state, action) => {
        state.actionLoading = false;
        const index = state.items.findIndex((item) => item._id === action.payload._id);
        if (index !== -1) {
          state.items[index] = action.payload;
        }
        if (state.currentQr?._id === action.payload._id) {
          state.currentQr = action.payload;
        }
      })
      .addCase(updateQr.rejected, (state) => {
        state.actionLoading = false;
      })

      // Delete QR
      .addCase(deleteQr.pending, (state) => {
        state.actionLoading = true;
      })
      .addCase(deleteQr.fulfilled, (state, action) => {
        state.items = state.items.filter((item) => item._id !== action.payload);
        if (state.currentQr?._id === action.payload) {
          state.currentQr = null;
          state.shortUrl = null;
        }
        state.actionLoading = false;
      })
      .addCase(deleteQr.rejected, (state) => {
        state.actionLoading = false;
      });
  },
});

export const { clearCurrentQr, clearQrError } = qrSlice.actions;
export default qrSlice.reducer;