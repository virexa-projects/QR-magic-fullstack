import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { api } from "@/lib/api";

export interface QrAnalyticsDay {
  date: string;       // "yyyy-MM-dd"
  label: string;       // "Jul 13"
  scans: number;
  clicks: number;
  uniqueIps: number;
  deviceBreakdown: Record<string, number>;
  countryBreakdown: Record<string, number>;
  hourlyBreakdown: number[];
}

export interface QrLocationRow {
  city: string;
  country?: string;
  scans: number;
  pct: number;
}

export interface RecentScanRow {
  city: string;
  device: string;
  browser?: string;
  scannedAt: string;
}

interface AnalyticsState {
  qrId: string | null;
  dailyRows: QrAnalyticsDay[];
  locations: QrLocationRow[];
  recentScans: RecentScanRow[];
  loading: boolean;
  error: string | null;
}

const initialState: AnalyticsState = {
  qrId: null,
  dailyRows: [],
  locations: [],
  recentScans: [],
  loading: false,
  error: null,
};

export const fetchQrAnalytics = createAsyncThunk(
  "analytics/fetchQrAnalytics",
  async ({ id, days = 30 }: { id: string; days?: number }, { rejectWithValue }) => {
    try {
      const res = await api.get(`/analytics/qr/${id}`, { params: { days } });
      return { id, rows: res.data.data as QrAnalyticsDay[] };
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || "Failed to load QR analytics");
    }
  }
);

export const fetchQrLocations = createAsyncThunk(
  "analytics/fetchQrLocations",
  async ({ id, limit = 6 }: { id: string; limit?: number }, { rejectWithValue }) => {
    try {
      const res = await api.get(`/analytics/qr/${id}/locations`, { params: { limit } });
      return res.data.data as QrLocationRow[];
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || "Failed to load location breakdown");
    }
  }
);

export const fetchQrRecentScans = createAsyncThunk(
  "analytics/fetchQrRecentScans",
  async ({ id, limit = 8 }: { id: string; limit?: number }, { rejectWithValue }) => {
    try {
      const res = await api.get(`/analytics/qr/${id}/recent`, { params: { limit } });
      return res.data.data as RecentScanRow[];
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || "Failed to load recent scans");
    }
  }
);

const analyticsSlice = createSlice({
  name: "analytics",
  initialState,
  reducers: {
    clearQrAnalytics: (state) => {
      state.qrId = null;
      state.dailyRows = [];
      state.locations = [];
      state.recentScans = [];
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchQrAnalytics.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchQrAnalytics.fulfilled, (state, action) => {
        state.loading = false;
        state.qrId = action.payload.id;
        state.dailyRows = action.payload.rows;
      })
      .addCase(fetchQrAnalytics.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(fetchQrLocations.fulfilled, (state, action) => {
        state.locations = action.payload;
      })
      .addCase(fetchQrRecentScans.fulfilled, (state, action) => {
        state.recentScans = action.payload;
      });
  },
});

export const { clearQrAnalytics } = analyticsSlice.actions;
export default analyticsSlice.reducer;