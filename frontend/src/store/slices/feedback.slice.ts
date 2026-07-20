// store/slices/feedback.slice.ts
import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { api } from "@/lib/api";
import { toast } from "sonner";

// ----------------------------------------------------------------------
// Types
// ----------------------------------------------------------------------
export type FeedbackAnswerType = "rating" | "text" | "yesno";

export interface FeedbackAnswer {
  questionId: string;
  type: FeedbackAnswerType;
  value: string | number | boolean;
}

export interface FeedbackResponse {
  _id: string;
  qrCode: string;
  owner: string;
  answers: FeedbackAnswer[];
  respondentName?: string;
  respondentContact?: string;
  ip?: string;
  userAgent?: string;
  submittedAt: string;
}

export interface FeedbackSummary {
  totalResponses: number;
  averageRating: number | null;
  ratingCount: number;
}

interface SubmitFeedbackPayload {
  shortCode: string;
  answers: Array<{ questionId: string; value: string | number | boolean }>;
  respondentName?: string;
  respondentContact?: string;
}

interface FetchResponsesPayload {
  qrId: string;
  page?: number;
  limit?: number;
}

interface FeedbackState {
  // Public submit flow (preview page)
  submitting: boolean;
  submitError: string | null;
  submitted: boolean; // drives the "thank you" screen after a successful POST

  // Owner dashboard — responses list, keyed by qrId so switching between
  // feedback QRs on the dashboard doesn't require re-fetching each time
  responsesByQr: Record<
  string,
  {
    items: FeedbackResponse[];
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  }
>;

  responsesLoading: boolean;
  responsesError: string | null;

  // Owner dashboard — summary card, keyed by qrId
  summaryByQr: Record<string, FeedbackSummary>;
  summaryLoading: boolean;
  summaryError: string | null;
}

const initialState: FeedbackState = {
  submitting: false,
  submitError: null,
  submitted: false,

  responsesByQr: {},
  responsesLoading: false,
  responsesError: null,

  summaryByQr: {},
  summaryLoading: false,
  summaryError: null,
};

// ----------------------------------------------------------------------
// Thunks
// ----------------------------------------------------------------------

// Public — no auth. Called from the /preview/:shortCode page's Submit button.
export const submitFeedback = createAsyncThunk(
  "feedback/submitFeedback",
  async (payload: SubmitFeedbackPayload, { rejectWithValue }) => {
    try {
      const { shortCode, ...body } = payload;
      const response = await api.post(`/feedback/${shortCode}/submit`, body);
      toast.success(response.data.message || "Feedback submitted");
      return response.data.data;
    } catch (error: any) {
      const message = error.response?.data?.message || "Couldn't submit feedback";
      toast.error(message);
      return rejectWithValue(message);
    }
  }
);

// Owner-only — dashboard list of responses for one feedback QR.
export const fetchFeedbackResponses = createAsyncThunk(
  "feedback/fetchFeedbackResponses",
  async ({ qrId, page = 1, limit = 20 }: FetchResponsesPayload, { rejectWithValue }) => {
    try {
      const response = await api.get(`/feedback/${qrId}/responses`, {
        params: { page, limit },
      });
      return {
        qrId,
        items: response.data.data,
        page: response.data.meta.page,
        limit: response.data.meta.limit,
        total: response.data.meta.total,
        totalPages: response.data.meta.totalPages,
      };
    } catch (error: any) {
      const message = error.response?.data?.message || "Couldn't load feedback responses";
      return rejectWithValue(message);
    }
  }
);

// Owner-only — summary card (total responses, average rating).
export const fetchFeedbackSummary = createAsyncThunk(
  "feedback/fetchFeedbackSummary",
  async (qrId: string, { rejectWithValue }) => {
    try {
      const response = await api.get(`/feedback/${qrId}/summary`);
      return { qrId, summary: response.data.data as FeedbackSummary };
    } catch (error: any) {
      const message = error.response?.data?.message || "Couldn't load feedback summary";
      return rejectWithValue(message);
    }
  }
);

// ----------------------------------------------------------------------
// Slice
// ----------------------------------------------------------------------
const feedbackSlice = createSlice({
  name: "feedback",
  initialState,
  reducers: {
    // Reset the "thank you" state — call when navigating away from a
    // preview page or opening a fresh feedback form.
    resetSubmitState: (state) => {
      state.submitting = false;
      state.submitError = null;
      state.submitted = false;
    },
  },
  extraReducers: (builder) => {
    // submitFeedback
    builder.addCase(submitFeedback.pending, (state) => {
      state.submitting = true;
      state.submitError = null;
      state.submitted = false;
    });
    builder.addCase(submitFeedback.fulfilled, (state) => {
      state.submitting = false;
      state.submitted = true;
    });
    builder.addCase(submitFeedback.rejected, (state, action: PayloadAction<any>) => {
      state.submitting = false;
      state.submitError = action.payload;
      state.submitted = false;
    });

    // fetchFeedbackResponses
    builder.addCase(fetchFeedbackResponses.pending, (state) => {
      state.responsesLoading = true;
      state.responsesError = null;
    });
    builder.addCase(fetchFeedbackResponses.fulfilled, (state, action) => {
      state.responsesLoading = false;
      const { qrId, items, page, limit, total, totalPages } = action.payload;
      state.responsesByQr[qrId] = { items, page, limit, total, totalPages };
    });
    builder.addCase(fetchFeedbackResponses.rejected, (state, action: PayloadAction<any>) => {
      state.responsesLoading = false;
      state.responsesError = action.payload;
    });

    // fetchFeedbackSummary
    builder.addCase(fetchFeedbackSummary.pending, (state) => {
      state.summaryLoading = true;
      state.summaryError = null;
    });
    builder.addCase(fetchFeedbackSummary.fulfilled, (state, action) => {
      state.summaryLoading = false;
      state.summaryByQr[action.payload.qrId] = action.payload.summary;
    });
    builder.addCase(fetchFeedbackSummary.rejected, (state, action: PayloadAction<any>) => {
      state.summaryLoading = false;
      state.summaryError = action.payload;
    });
  },
});

export const { resetSubmitState } = feedbackSlice.actions;
export default feedbackSlice.reducer;