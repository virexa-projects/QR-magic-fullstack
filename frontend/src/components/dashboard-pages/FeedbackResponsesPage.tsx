"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import * as XLSX from "xlsx";
import { Download, Star, MessageSquare, CheckCircle2, XCircle, User, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AppDispatch, RootState } from "@/store";
import {
  fetchFeedbackResponses,
  fetchFeedbackSummary,
  FeedbackResponse,
} from "@/store/slices/feedback.slice";
import { usePageRefresh } from "@/components/Context/RefreshContext";
import { api } from "@/lib/api";

interface FeedbackQuestion {
  id: string;
  label: string; // adjust to your actual field name on QRCode.content.questions
  type: "rating" | "text" | "yesno";
  required: boolean;
}

interface Props {
  qrId: string;
  qrName: string;
}

export default function FeedbackResponsesPage({ qrId, qrName }: Props) {
  const dispatch = useDispatch<AppDispatch>();
  const { responsesByQr, responsesLoading, summaryByQr, summaryLoading } = useSelector(
    (s: RootState) => s.feedback
  );
  console.log("qrId",qrId)
  console.log("responsesByQr, responsesLoading, summaryByQr, summaryLoading",responsesByQr, responsesLoading, summaryByQr, summaryLoading)
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [exporting, setExporting] = useState(false);
  const [questions, setQuestions] = useState<FeedbackQuestion[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const responses = responsesByQr[qrId];
  const summary = summaryByQr[qrId];

  // Question definitions live on the QR doc itself (content.questions),
  // not on the feedback slice — fetch once so we can render human labels
  // instead of raw questionId in the table/export.
  useEffect(() => {
    if (!qrId) return;
    api.get(`/qr/${qrId}`).then((res) => {
      setQuestions(res.data?.data?.qr?.content?.questions ?? []);
    }).catch(() => setQuestions([]));
  }, [qrId]);

  const questionMap = useMemo(
    () => new Map(questions.map((q) => [q.id, q])),
    [questions]
  );

  const load = useCallback(() => {
    dispatch(fetchFeedbackResponses({ qrId, page, limit }));
    dispatch(fetchFeedbackSummary(qrId));
  }, [dispatch, qrId, page, limit]);

  useEffect(() => {
    load();
  }, [load]);

  // Global refresh button → only refetches this feedback QR's data
  usePageRefresh(
    useCallback(async () => {
      await Promise.all([
        dispatch(fetchFeedbackResponses({ qrId, page, limit })),
        dispatch(fetchFeedbackSummary(qrId)),
      ]);
    }, [dispatch, qrId, page, limit]),
    [qrId, page, limit]
  );

  /**
   * Export ALL responses (not just the current page) to Excel.
   * Loops through every page at the max allowed limit (100, per the
   * backend's Math.min cap) and combines results before building the sheet.
   */
  const handleExport = async () => {
    setExporting(true);
    try {
      const EXPORT_PAGE_SIZE = 100;
      let currentPage = 1;
      let totalPages = 1;
      const allItems: FeedbackResponse[] = [];

      do {
        const result = await dispatch(
          fetchFeedbackResponses({ qrId, page: currentPage, limit: EXPORT_PAGE_SIZE })
        ).unwrap();
        allItems.push(...result.items);
        totalPages = result.totalPages;
        currentPage++;
      } while (currentPage <= totalPages);

      if (allItems.length === 0) {
        setExporting(false);
        return;
      }

      // Build one flat row per response, one column per question
      const rows = allItems.map((r) => {
        const row: Record<string, any> = {
          "Submitted At": new Date(r.submittedAt).toLocaleString("en-IN"),
          "Respondent Name": r.respondentName || "Anonymous",
          "Contact": r.respondentContact || "",
        };
        r.answers.forEach((a) => {
          const q = questionMap.get(a.questionId);
          const label = q?.label || a.questionId;
          let value: string | number = String(a.value);
          if (a.type === "yesno") value = a.value ? "Yes" : "No";
          if (a.type === "rating") value = Number(a.value);
          row[label] = value;
        });
        return row;
      });

      const worksheet = XLSX.utils.json_to_sheet(rows);

      // Auto-size columns roughly based on content length
      const colWidths = Object.keys(rows[0]).map((key) => ({
        wch: Math.max(key.length, ...rows.map((r) => String(r[key] ?? "").length)) + 2,
      }));
      worksheet["!cols"] = colWidths;

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Responses");

      const filename = `${qrName.replace(/[^a-z0-9]/gi, "_")}_feedback_${new Date()
        .toISOString()
        .slice(0, 10)}.xlsx`;

      XLSX.writeFile(workbook, filename);
    } catch (err) {
      console.error("Export failed:", err);
    } finally {
      setExporting(false);
    }
  };

  const renderAnswerValue = (a: FeedbackResponse["answers"][number]) => {
    if (a.type === "rating") {
      const rating = Number(a.value);
      return (
        <div className="flex items-center gap-0.5">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star
              key={i}
              className={`w-3.5 h-3.5 ${i < rating ? "fill-warning text-warning" : "text-muted-foreground/30"}`}
            />
          ))}
          <span className="text-xs text-muted-foreground ml-1">{rating}/5</span>
        </div>
      );
    }
    if (a.type === "yesno") {
      return a.value ? (
        <span className="inline-flex items-center gap-1 text-xs text-success font-medium">
          <CheckCircle2 className="w-3.5 h-3.5" /> Yes
        </span>
      ) : (
        <span className="inline-flex items-center gap-1 text-xs text-muted-foreground font-medium">
          <XCircle className="w-3.5 h-3.5" /> No
        </span>
      );
    }
    return <p className="text-sm text-foreground">{String(a.value)}</p>;
  };

  return (
    <div className="space-y-5 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl md:text-2xl font-bold font-heading text-foreground">Feedback responses</h1>
          <p className="text-xs md:text-sm text-muted-foreground mt-0.5">{qrName}</p>
        </div>
        <Button
          onClick={handleExport}
          disabled={exporting || !responses?.total}
          className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-full"
        >
          <Download className="w-3.5 h-3.5 mr-1.5" />
          {exporting ? "Exporting…" : "Export to Excel"}
        </Button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <div className="bg-card rounded-xl p-4 border border-border">
          <div className="text-2xl font-bold font-heading text-foreground">
            {summaryLoading ? "—" : summary?.totalResponses ?? 0}
          </div>
          <div className="text-xs text-muted-foreground mt-0.5">Total responses</div>
        </div>
        <div className="bg-card rounded-xl p-4 border border-border">
          <div className="text-2xl font-bold font-heading text-foreground flex items-center gap-1.5">
            {summaryLoading ? "—" : summary?.averageRating != null ? summary.averageRating.toFixed(1) : "—"}
            {summary?.averageRating != null && <Star className="w-4 h-4 fill-warning text-warning" />}
          </div>
          <div className="text-xs text-muted-foreground mt-0.5">Average rating</div>
        </div>
        <div className="bg-card rounded-xl p-4 border border-border">
          <div className="text-2xl font-bold font-heading text-foreground">
            {summaryLoading ? "—" : summary?.ratingCount ?? 0}
          </div>
          <div className="text-xs text-muted-foreground mt-0.5">Rating responses</div>
        </div>
      </div>

      {/* Response list — expandable detail */}
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        {responsesLoading && !responses && (
          <div className="p-8 text-center text-sm text-muted-foreground">Loading responses…</div>
        )}

        {!responsesLoading && responses?.items.length === 0 && (
          <div className="p-8 text-center text-sm text-muted-foreground">No feedback submitted yet.</div>
        )}

        {responses?.items.map((r) => {
          const expanded = expandedId === r._id;
          return (
            <div key={r._id} className="border-b border-border last:border-0">
              <button
                onClick={() => setExpandedId(expanded ? null : r._id)}
                className="w-full flex items-center gap-3 p-4 hover:bg-secondary/50 transition text-left"
              >
                <div className="w-8 h-8 rounded-lg bg-primary-soft text-primary flex items-center justify-center shrink-0">
                  <User className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-foreground truncate">
                    {r.respondentName || "Anonymous"}
                  </div>
                  <div className="text-[11px] text-muted-foreground flex items-center gap-1">
                    <Calendar className="w-3 h-3" /> {new Date(r.submittedAt).toLocaleString("en-IN")}
                  </div>
                </div>
                <div className="text-xs text-muted-foreground shrink-0">
                  {r.answers.length} answer{r.answers.length !== 1 ? "s" : ""}
                </div>
              </button>

              {expanded && (
                <div className="px-4 pb-4 space-y-3 bg-secondary/20">
                  {r.respondentContact && (
                    <div className="text-xs text-muted-foreground">Contact: {r.respondentContact}</div>
                  )}
                  {r.answers.map((a) => {
                    const q = questionMap.get(a.questionId);
                    return (
                      <div key={a.questionId} className="bg-card rounded-lg p-3 border border-border/60">
                        <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground mb-1.5">
                          <MessageSquare className="w-3 h-3" />
                          {q?.label || a.questionId}
                        </div>
                        {renderAnswerValue(a)}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Pagination */}
      {responses && responses.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
          >
            Previous
          </Button>
          <span className="text-xs text-muted-foreground">
            Page {responses.page} of {responses.totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= responses.totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}