import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { api } from "@/lib/api";

/* ------------------------------------------------------------------ */
/*  Per-QR types (existing)                                            */
/* ------------------------------------------------------------------ */

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
  lat?: number | null;
  lng?: number | null;
}

export interface RecentScanRow {
  city: string;
  device: string;
  browser?: string;
  scannedAt: string;
}

/* ------------------------------------------------------------------ */
/*  Geo report types (country / region / city drill-down)              */
/* ------------------------------------------------------------------ */

export interface GeoCountry {
  country: string;
  scans: number;
  pct: number;
  lat: number | null;
  lng: number | null;
}

export interface GeoRegion {
  country: string;
  region: string;
  scans: number;
  pct: number;
  lat: number | null;
  lng: number | null;
}

export interface GeoCity {
  country: string;
  region: string | null;
  city: string;
  scans: number;
  pct: number;
  lat: number | null;
  lng: number | null;
}

export interface GeoReport {
  countries: GeoCountry[];
  regions: GeoRegion[];
  cities: GeoCity[];
}

/* ------------------------------------------------------------------ */
/*  Account-wide types                                                  */
/* ------------------------------------------------------------------ */

export interface DashboardSummary {
  totalQRs: number;
  activeQRs: number;
  totalScans: number;
  scansToday: number;
}

export interface TrendPoint {
  date: string; // already formatted e.g. "Jul 13"
  scans: number;
}

export interface HourlyPoint {
  hour: string; // "00:00", "01:00", ...
  scans: number;
}

// Matches analyticsService.getTopQRs()
export interface TopQr {
  id: string;
  name: string;
  type: string;
  destination: string;
  scansToday: number;
  scans: number; // scansTotal
}

export interface DateRangeParams {
  startDate?: string; // "yyyy-MM-dd" — omit for current month
  endDate?: string;   // "yyyy-MM-dd" — omit for current month
}

interface AnalyticsState {
  // account-wide
  summary: DashboardSummary | null;
  trend: TrendPoint[];
  devices: Record<string, number>;
  accountLocations: QrLocationRow[];
  hourly: HourlyPoint[];
  topQrs: TopQr[];

  summaryLoading: boolean;
  trendLoading: boolean;
  devicesLoading: boolean;
  topQrsLoading: boolean;

  // per-QR
  qrId: string | null;
  dailyRows: QrAnalyticsDay[];
  locations: QrLocationRow[];
  recentScans: RecentScanRow[];
  qrScansToday: number;
  loading: boolean;

  // per-QR geo report
  geoReport: GeoReport | null;
  geoLoading: boolean;

  error: string | null;
}

const initialState: AnalyticsState = {
  summary: null,
  trend: [],
  devices: {},
  accountLocations: [],
  hourly: [],
  topQrs: [],

  summaryLoading: false,
  trendLoading: false,
  devicesLoading: false,
  topQrsLoading: false,

  qrId: null,
  dailyRows: [],
  locations: [],
  recentScans: [],
  qrScansToday: 0,
  loading: false,

  geoReport: null,
  geoLoading: false,

  error: null,
};

/* ------------------------------------------------------------------ */
/*  Account-wide thunks — now take startDate/endDate, default to the   */
/*  current month on the backend when omitted.                         */
/* ------------------------------------------------------------------ */

export const fetchSummary = createAsyncThunk(
  "analytics/fetchSummary",
  async ({ startDate, endDate }: DateRangeParams = {}, { rejectWithValue }) => {
    try {
      const res = await api.get("/analytics/summary", { params: { startDate, endDate } });
      return res.data.data as DashboardSummary;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || "Failed to load summary");
    }
  }
);

export const fetchTrend = createAsyncThunk(
  "analytics/fetchTrend",
  async ({ startDate, endDate }: DateRangeParams = {}, { rejectWithValue }) => {
    try {
      const res = await api.get("/analytics/trend", { params: { startDate, endDate } });
      return res.data.data as TrendPoint[];
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || "Failed to load scans trend");
    }
  }
);

export const fetchDevices = createAsyncThunk(
  "analytics/fetchDevices",
  async ({ startDate, endDate }: DateRangeParams = {}, { rejectWithValue }) => {
    try {
      const res = await api.get("/analytics/devices", { params: { startDate, endDate } });
      return res.data.data as Record<string, number>;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || "Failed to load device breakdown");
    }
  }
);

export const fetchAccountLocations = createAsyncThunk(
  "analytics/fetchAccountLocations",
  async ({ limit = 10 }: { limit?: number } = {}, { rejectWithValue }) => {
    try {
      const res = await api.get("/analytics/locations", { params: { limit } });
      return res.data.data as QrLocationRow[];
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || "Failed to load location breakdown");
    }
  }
);

export const fetchHourly = createAsyncThunk(
  "analytics/fetchHourly",
  async ({ startDate, endDate }: DateRangeParams = {}, { rejectWithValue }) => {
    try {
      const res = await api.get("/analytics/hourly", { params: { startDate, endDate } });
      return res.data.data as HourlyPoint[];
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || "Failed to load hourly heatmap");
    }
  }
);

// NEW: powers the "Top performing QRs today" card on the overview page
export const fetchTopQrs = createAsyncThunk(
  "analytics/fetchTopQrs",
  async ({ limit = 4 }: { limit?: number } = {}, { rejectWithValue }) => {
    try {
      const res = await api.get("/analytics/top-qrs", { params: { limit } });
      return res.data.data as TopQr[];
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || "Failed to load top QR codes");
    }
  }
);

/* ------------------------------------------------------------------ */
/*  Per-QR thunks — fetchQrAnalytics now takes startDate/endDate;       */
/*  fetchQrLocations / fetchQrRecentScans unchanged (limit-based).      */
/* ------------------------------------------------------------------ */

export const fetchQrAnalytics = createAsyncThunk(
  "analytics/fetchQrAnalytics",
  async (
    { id, startDate, endDate }: { id: string } & DateRangeParams,
    { rejectWithValue }
  ) => {
    try {
      const res = await api.get(`/analytics/qr/${id}`, { params: { startDate, endDate } });
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

export const fetchQrScansToday = createAsyncThunk(
  "analytics/fetchQrScansToday",
  async ({ id }: { id: string }, { rejectWithValue }) => {
    try {
      const res = await api.get(`/analytics/qr/${id}/today`);
      return res.data.data as { scansToday: number };
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || "Failed to load today's scans");
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

// NEW: country / region / city drill-down for a single QR
export const fetchQrGeoReport = createAsyncThunk(
  "analytics/fetchQrGeoReport",
  async ({ id }: { id: string }, { rejectWithValue }) => {
    try {
      const res = await api.get(`/analytics/qr/${id}/geo`);
      return res.data.data as GeoReport;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || "Failed to load geo report");
    }
  }
);

/* ------------------------------------------------------------------ */
/*  Slice                                                               */
/* ------------------------------------------------------------------ */

const analyticsSlice = createSlice({
  name: "analytics",
  initialState,
  reducers: {
    clearQrAnalytics: (state) => {
      state.qrId = null;
      state.dailyRows = [];
      state.locations = [];
      state.recentScans = [];
      state.qrScansToday = 0;
      state.geoReport = null;
      state.geoLoading = false;
      state.error = null;
    },
    clearAccountAnalytics: (state) => {
      state.summary = null;
      state.trend = [];
      state.devices = {};
      state.accountLocations = [];
      state.hourly = [];
      state.topQrs = [];
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Account-wide
      .addCase(fetchSummary.pending, (state) => {
        state.summaryLoading = true;
        state.error = null;
      })
      .addCase(fetchSummary.fulfilled, (state, action) => {
        state.summary = action.payload;
        state.summaryLoading = false;
      })
      .addCase(fetchSummary.rejected, (state, action) => {
        state.summaryLoading = false;
        state.error = action.payload as string;
      })
      .addCase(fetchTrend.pending, (state) => {
        state.trendLoading = true;
      })
      .addCase(fetchTrend.fulfilled, (state, action) => {
        state.trend = action.payload;
        state.trendLoading = false;
      })
      .addCase(fetchTrend.rejected, (state, action) => {
        state.trendLoading = false;
        state.error = action.payload as string;
      })
      .addCase(fetchDevices.pending, (state) => {
        state.devicesLoading = true;
      })
      .addCase(fetchDevices.fulfilled, (state, action) => {
        state.devices = action.payload;
        state.devicesLoading = false;
      })
      .addCase(fetchDevices.rejected, (state, action) => {
        state.devicesLoading = false;
        state.error = action.payload as string;
      })
      .addCase(fetchAccountLocations.fulfilled, (state, action) => {
        state.accountLocations = action.payload;
      })
      .addCase(fetchHourly.fulfilled, (state, action) => {
        state.hourly = action.payload;
      })
      .addCase(fetchTopQrs.pending, (state) => {
        state.topQrsLoading = true;
      })
      .addCase(fetchTopQrs.fulfilled, (state, action) => {
        state.topQrs = action.payload;
        state.topQrsLoading = false;
      })
      .addCase(fetchTopQrs.rejected, (state, action) => {
        state.topQrsLoading = false;
        state.error = action.payload as string;
      })

      // Per-QR
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
      })
      .addCase(fetchQrScansToday.fulfilled, (state, action) => {
        state.qrScansToday = action.payload.scansToday;
      })

      // Per-QR geo report
      .addCase(fetchQrGeoReport.pending, (state) => {
        state.geoLoading = true;
      })
      .addCase(fetchQrGeoReport.fulfilled, (state, action) => {
        state.geoReport = action.payload;
        state.geoLoading = false;
      })
      .addCase(fetchQrGeoReport.rejected, (state, action) => {
        state.geoLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearQrAnalytics, clearAccountAnalytics } = analyticsSlice.actions;
export default analyticsSlice.reducer;