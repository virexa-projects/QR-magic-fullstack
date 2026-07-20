// components/content/FeedbackContent.tsx
import { memo, useCallback, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { ShieldCheck, Star, Loader2 } from "lucide-react";
import { trackClickBeacon } from "../../lib/tracking";
import type { AppDispatch, RootState } from "@/store"; // adjust to your actual store path
import { submitFeedback, resetSubmitState } from "@/store/slices/feedback.slice";
import type { ContentProps } from "../../types";

type Question = { id: string; type: "rating" | "text" | "yesno"; label: string; required?: boolean };

function FeedbackContentBase({ data, shortCode }: ContentProps) {
  const dispatch = useDispatch<AppDispatch>();
  const { submitting, submitError, submitted } = useSelector((s: RootState) => s.feedback);

  const headline = data.headline || "How was your experience?";
  const subheading = data.subheading || "";
  const questions: Question[] = data.questions || [];
  const thankYouMessage = data.thankYouMessage || "Thanks for your feedback!";

  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [validationError, setValidationError] = useState<string | null>(null);

  const handleSubmit = useCallback(() => {
    const missing = questions.filter(
      (q) => q.required && (answers[q.id] === undefined || answers[q.id] === "")
    );
    if (missing.length > 0) {
      setValidationError(`Please answer: ${missing.map((q) => q.label).join(", ")}`);
      return;
    }
    setValidationError(null);

    trackClickBeacon(shortCode);

    dispatch(
      submitFeedback({
        shortCode,
        answers: Object.entries(answers).map(([questionId, value]) => ({ questionId, value })),
      })
    );
  }, [answers, questions, shortCode, dispatch]);

  const handleSubmitAnother = useCallback(() => {
    setAnswers({});
    setValidationError(null);
    dispatch(resetSubmitState());
  }, [dispatch]);

  if (submitted) {
    return (
      <div className="flex flex-col items-center px-6 py-14 text-center sm:px-8">
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[color:var(--accent)]/10">
          <ShieldCheck className="h-7 w-7" style={{ color: "var(--accent)" }} />
        </div>
        <p className="text-sm font-semibold text-neutral-900">{thankYouMessage}</p>
        <button
          onClick={handleSubmitAnother}
          className="mt-4 text-[13px] font-medium underline"
          style={{ color: "var(--accent)" }}
        >
          Submit another response
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      <div className="px-6 pt-7 text-center sm:px-8">
        <h2 className="text-lg font-bold text-neutral-900">{headline}</h2>
        {subheading && <p className="mt-1 text-[13px] text-neutral-500">{subheading}</p>}
      </div>

      <div className="mt-5 space-y-5 px-6 sm:px-8">
        {questions.map((q) => (
          <div key={q.id}>
            <p className="mb-2 text-[13px] font-medium text-neutral-800">
              {q.label}
              {q.required && <span style={{ color: "var(--accent)" }}> *</span>}
            </p>

            {q.type === "rating" && (
              <div className="flex gap-1.5">
                {Array.from({ length: 5 }).map((_, i) => {
                  const filled = (answers[q.id] || 0) > i;
                  return (
                    <button key={i} onClick={() => setAnswers((a) => ({ ...a, [q.id]: i + 1 }))}>
                      <Star className={`h-6 w-6 ${filled ? "fill-amber-400 text-amber-400" : "text-neutral-200"}`} />
                    </button>
                  );
                })}
              </div>
            )}

            {q.type === "yesno" && (
              <div className="flex gap-2">
                {["Yes", "No"].map((opt) => (
                  <button
                    key={opt}
                    onClick={() => setAnswers((a) => ({ ...a, [q.id]: opt }))}
                    className="flex-1 rounded-xl border py-2 text-[13px] font-medium"
                    style={
                      answers[q.id] === opt
                        ? { backgroundColor: "var(--accent)", borderColor: "var(--accent)", color: "#fff" }
                        : { borderColor: "#e5e5e5", color: "#404040" }
                    }
                  >
                    {opt}
                  </button>
                ))}
              </div>
            )}

            {q.type === "text" && (
              <textarea
                value={answers[q.id] || ""}
                onChange={(e) => setAnswers((a) => ({ ...a, [q.id]: e.target.value }))}
                placeholder="Type your answer…"
                className="min-h-[70px] w-full rounded-xl border border-neutral-200 p-3 text-[13px] outline-none focus:border-neutral-400"
              />
            )}
          </div>
        ))}
        {questions.length === 0 && <p className="py-4 text-center text-xs text-neutral-400">No questions added yet.</p>}
      </div>

      {(validationError || submitError) && (
        <p className="px-6 pt-2 text-[12px] text-red-500 sm:px-8">{validationError || submitError}</p>
      )}

      <div className="px-6 py-6 sm:px-8">
        <button
          onClick={handleSubmit}
          disabled={submitting}
          className="flex h-11 w-full items-center justify-center gap-2 rounded-2xl text-sm font-semibold text-white disabled:opacity-60"
          style={{ backgroundColor: "var(--accent)" }}
        >
          {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
          {submitting ? "Submitting…" : "Submit"}
        </button>
        {data.allowAnonymous && <p className="mt-2 text-center text-[11px] text-neutral-400">Your response is anonymous</p>}
      </div>
    </div>
  );
}

export default memo(FeedbackContentBase);