// components/qr-builder/forms/types/FeedbackForm.tsx
"use client";
import FormSection from "../FormSection";
import FieldError, { errorRing } from "../FieldError";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  MessageSquareHeart, Plus, X, Star, Type, ThumbsUp, GripVertical,
} from "lucide-react";
import type { FeedbackValue, FeedbackQuestion } from "@/lib/qr-types/schema";

interface Props { value: FeedbackValue; onChange: (v: FeedbackValue) => void; errors?: Record<string, string> }

const QUESTION_TYPES: { id: FeedbackQuestion["type"]; label: string; icon: React.ElementType }[] = [
  { id: "rating", label: "Rating", icon: Star },
  { id: "text", label: "Text", icon: Type },
  { id: "yesno", label: "Yes / No", icon: ThumbsUp },
];

const HEADLINE_MAX = 80;
const SUBHEADING_MAX = 120;
const THANKYOU_MAX = 200;

export default function FeedbackForm({ value, onChange, errors }: Props) {
  const set = <K extends keyof FeedbackValue>(k: K, v: FeedbackValue[K]) => onChange({ ...value, [k]: v });

  const updateQ = (i: number, patch: Partial<FeedbackQuestion>) =>
    set("questions", value.questions.map((q, idx) => (idx === i ? { ...q, ...patch } : q)));
  const removeQ = (i: number) => set("questions", value.questions.filter((_, idx) => idx !== i));
  const addQ = () =>
    set("questions", [
      ...value.questions,
      { id: `q_${Date.now()}`, type: "rating", label: "", required: false },
    ]);
  const moveQ = (i: number, dir: -1 | 1) => {
    const target = i + dir;
    if (target < 0 || target >= value.questions.length) return;
    const next = [...value.questions];
    [next[i], next[target]] = [next[target], next[i]];
    set("questions", next);
  };

  return (
    <div className="space-y-3">
      <FormSection title="Header" icon={MessageSquareHeart} defaultOpen error={errors?.headline}>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-medium text-muted-foreground">Headline</Label>
              <span className="text-[10px] text-muted-foreground/70 tabular-nums">
                {value.headline.length}/{HEADLINE_MAX}
              </span>
            </div>
            <Input
              value={value.headline}
              onChange={(e) => set("headline", e.target.value.slice(0, HEADLINE_MAX))}
              placeholder="How was your experience?"
              className={`h-10 ${errorRing(!!errors?.headline)}`}
            />
            <FieldError message={errors?.headline} />
          </div>
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-medium text-muted-foreground">Subheading</Label>
              <span className="text-[10px] text-muted-foreground/70 tabular-nums">
                {value.subheading.length}/{SUBHEADING_MAX}
              </span>
            </div>
            <Input
              value={value.subheading}
              onChange={(e) => set("subheading", e.target.value.slice(0, SUBHEADING_MAX))}
              placeholder="We'd love your feedback"
              className="h-10"
            />
          </div>
        </div>
      </FormSection>

      <FormSection
        title="Questions"
        icon={MessageSquareHeart}
        badge={value.questions.length ? `${value.questions.length}` : undefined}
        defaultOpen
        error={errors?.questions}
      >
        <div className="space-y-2.5">
          {value.questions.length === 0 && (
            <div className="rounded-lg border border-dashed border-border py-6 px-4 text-center">
              <MessageSquareHeart className="w-5 h-5 text-muted-foreground/50 mx-auto mb-2" />
              <p className="text-xs text-muted-foreground">No questions yet — add your first one below.</p>
            </div>
          )}

          {value.questions.map((q, i) => {
            const TypeIcon = QUESTION_TYPES.find((t) => t.id === q.type)?.icon ?? Star;
            const labelMissing = !q.label.trim() && Boolean(errors?.questions);
            return (
              <div
                key={q.id}
                className={`rounded-lg border bg-background/60 p-3 space-y-2.5 transition ${
                  labelMissing ? "border-destructive/50" : "border-border"
                }`}
              >
                <div className="flex items-start gap-2">
                  <div className="flex flex-col gap-0.5 pt-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => moveQ(i, -1)}
                      disabled={i === 0}
                      className="text-muted-foreground/40 hover:text-muted-foreground disabled:opacity-30 disabled:cursor-not-allowed"
                      aria-label="Move up"
                    >
                      <GripVertical className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="shrink-0 w-6 h-6 rounded-md bg-primary/10 text-primary grid place-items-center">
                        <TypeIcon className="w-3.5 h-3.5" />
                      </span>
                      <Input
                        value={q.label}
                        onChange={(e) => updateQ(i, { label: e.target.value })}
                        placeholder="Question text"
                        className={`h-9 text-xs flex-1 ${errorRing(labelMissing)}`}
                      />
                      <button
                        type="button"
                        onClick={() => removeQ(i)}
                        className="p-1.5 text-muted-foreground hover:text-destructive shrink-0"
                        aria-label="Remove question"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="inline-flex rounded-md border border-border p-0.5 bg-secondary/30">
                        {QUESTION_TYPES.map((t) => {
                          const Icon = t.icon;
                          const active = q.type === t.id;
                          return (
                            <button
                              key={t.id}
                              type="button"
                              onClick={() => updateQ(i, { type: t.id })}
                              className={`flex items-center gap-1 px-2 py-1 rounded text-[11px] font-medium transition ${
                                active
                                  ? "bg-background text-foreground shadow-sm"
                                  : "text-muted-foreground hover:text-foreground"
                              }`}
                            >
                              <Icon className="w-3 h-3" /> {t.label}
                            </button>
                          );
                        })}
                      </div>
                      <label className="flex items-center gap-1.5 text-[11px] text-muted-foreground cursor-pointer">
                        <input
                          type="checkbox"
                          checked={q.required}
                          onChange={(e) => updateQ(i, { required: e.target.checked })}
                          className="accent-primary"
                        />
                        Required
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          <button
            type="button"
            onClick={addQ}
            className="flex items-center gap-1.5 text-xs text-primary font-medium hover:underline"
          >
            <Plus className="w-3.5 h-3.5" /> Add question
          </button>
          <FieldError message={errors?.questions} />
        </div>
      </FormSection>

      <FormSection title="Settings" icon={MessageSquareHeart}>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-xs">Allow anonymous responses</Label>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                Skip collecting a name or contact from respondents.
              </p>
            </div>
            <Switch checked={value.allowAnonymous} onCheckedChange={(v) => set("allowAnonymous", v)} />
          </div>
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-medium text-muted-foreground">Thank-you message</Label>
              <span className="text-[10px] text-muted-foreground/70 tabular-nums">
                {value.thankYouMessage.length}/{THANKYOU_MAX}
              </span>
            </div>
            <Textarea
              value={value.thankYouMessage}
              onChange={(e) => set("thankYouMessage", e.target.value.slice(0, THANKYOU_MAX))}
              className="min-h-[60px]"
              placeholder="Thanks for your feedback!"
            />
          </div>
        </div>
      </FormSection>
    </div>
  );
}

// --- Preview ---
export function FeedbackPreview({ value }: { value: FeedbackValue }) {
  return (
    <div className="w-[228px] rounded-xl border border-border bg-card p-4 space-y-3.5 shadow-sm">
      <div className="text-center space-y-1">
        <p className="text-sm font-bold text-foreground leading-snug">
          {value.headline || "How was your experience?"}
        </p>
        {value.subheading && <p className="text-[10px] text-muted-foreground">{value.subheading}</p>}
      </div>

      {(value.questions.length
        ? value.questions
        : [{ id: "1", type: "rating" as const, label: "Overall rating", required: false }]
      )
        .slice(0, 3)
        .map((q) => (
          <div key={q.id} className="space-y-1.5">
            <p className="text-[11px] font-medium text-foreground flex items-center gap-1">
              {q.label || "Untitled question"}
              {q.required && <span className="text-destructive">*</span>}
            </p>
            {q.type === "rating" ? (
              <div className="flex gap-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className="w-4 h-4 text-amber-400 fill-amber-400" />
                ))}
              </div>
            ) : q.type === "yesno" ? (
              <div className="flex gap-2">
                <div className="flex-1 h-7 rounded-md border border-border bg-secondary/60 flex items-center justify-center text-[10px] font-medium">
                  Yes
                </div>
                <div className="flex-1 h-7 rounded-md border border-border bg-secondary/30 flex items-center justify-center text-[10px] font-medium text-muted-foreground">
                  No
                </div>
              </div>
            ) : (
              <div className="h-8 rounded-md border border-border bg-secondary/30 px-2 flex items-center">
                <span className="text-[10px] text-muted-foreground/60">Type your answer…</span>
              </div>
            )}
          </div>
        ))}

      <div className="w-full h-8 rounded-lg bg-primary flex items-center justify-center mt-1">
        <span className="text-[11px] text-primary-foreground font-medium">Submit</span>
      </div>

      {value.allowAnonymous && (
        <p className="text-[9px] text-muted-foreground text-center">Responses can be submitted anonymously</p>
      )}
    </div>
  );
}