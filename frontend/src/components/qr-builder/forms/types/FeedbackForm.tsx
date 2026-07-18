// components/qr-builder/forms/types/FeedbackForm.tsx
"use client";
import FormSection from "../FormSection";
import FieldError, { errorRing } from "../FieldError";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { MessageSquareHeart, Plus, X, Star } from "lucide-react";
import type { FeedbackValue, FeedbackQuestion } from "@/lib/qr-types/schema";

interface Props { value: FeedbackValue; onChange: (v: FeedbackValue) => void; errors?: Record<string, string> }

const QUESTION_TYPES: { id: FeedbackQuestion["type"]; label: string }[] = [
  { id: "rating", label: "Star rating" },
  { id: "text", label: "Text answer" },
  { id: "yesno", label: "Yes / No" },
];

export default function FeedbackForm({ value, onChange, errors }: Props) {
  const set = <K extends keyof FeedbackValue>(k: K, v: FeedbackValue[K]) => onChange({ ...value, [k]: v });

  const updateQ = (i: number, patch: Partial<FeedbackQuestion>) =>
    set("questions", value.questions.map((q, idx) => (idx === i ? { ...q, ...patch } : q)));
  const removeQ = (i: number) => set("questions", value.questions.filter((_, idx) => idx !== i));
  const addQ = () =>
    set("questions", [...value.questions, { id: `q_${Date.now()}`, type: "rating", label: "New question", required: false }]);

  return (
    <div className="space-y-3">
      <FormSection title="Header" icon={MessageSquareHeart} defaultOpen error={errors?.headline}>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-muted-foreground">Headline</Label>
            <Input
              value={value.headline}
              onChange={(e) => set("headline", e.target.value)}
              placeholder="How was your experience?"
              className={`h-10 ${errorRing(!!errors?.headline)}`}
            />
            <FieldError message={errors?.headline} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-muted-foreground">Subheading</Label>
            <Input value={value.subheading} onChange={(e) => set("subheading", e.target.value)} placeholder="We'd love your feedback" className="h-10" />
          </div>
        </div>
      </FormSection>

      <FormSection title="Questions" icon={MessageSquareHeart} badge={`${value.questions.length}`} defaultOpen error={errors?.questions}>
        <div className="space-y-3">
          {value.questions.map((q, i) => (
            <div key={q.id} className="p-3 rounded-lg border border-border space-y-2">
              <div className="flex items-center gap-2">
                <Input
                  value={q.label}
                  onChange={(e) => updateQ(i, { label: e.target.value })}
                  placeholder="Question text"
                  className={`h-9 text-xs flex-1 ${errorRing(!q.label.trim() && Boolean(errors?.questions))}`}
                />
                <button onClick={() => removeQ(i)} className="p-1.5 text-muted-foreground hover:text-destructive shrink-0">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="flex items-center gap-2">
                <select
                  value={q.type}
                  onChange={(e) => updateQ(i, { type: e.target.value as FeedbackQuestion["type"] })}
                  className="h-8 rounded-md border border-border bg-background text-[11px] px-2"
                >
                  {QUESTION_TYPES.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
                </select>
                <label className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                  <input type="checkbox" checked={q.required} onChange={(e) => updateQ(i, { required: e.target.checked })} className="accent-primary" />
                  Required
                </label>
              </div>
            </div>
          ))}
          <button type="button" onClick={addQ} className="flex items-center gap-1.5 text-xs text-primary font-medium hover:underline">
            <Plus className="w-3.5 h-3.5" /> Add question
          </button>
          <FieldError message={errors?.questions} />
        </div>
      </FormSection>

      <FormSection title="Settings" icon={MessageSquareHeart}>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-xs">Allow anonymous responses</Label>
            <Switch checked={value.allowAnonymous} onCheckedChange={(v) => set("allowAnonymous", v)} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-muted-foreground">Thank-you message</Label>
            <Textarea value={value.thankYouMessage} onChange={(e) => set("thankYouMessage", e.target.value)} className="min-h-[60px]" />
          </div>
        </div>
      </FormSection>
    </div>
  );
}

// --- Preview ---
export function FeedbackPreview({ value }: { value: FeedbackValue }) {
  return (
    <div className="w-[228px] rounded-xl border border-border bg-card p-4 space-y-3">
      <div className="text-center">
        <p className="text-sm font-bold text-foreground">{value.headline || "How was your experience?"}</p>
        {value.subheading && <p className="text-[10px] text-muted-foreground mt-0.5">{value.subheading}</p>}
      </div>
      {(value.questions.length ? value.questions : [{ id: "1", type: "rating" as const, label: "Overall rating", required: false }])
        .slice(0, 3)
        .map((q) => (
          <div key={q.id} className="space-y-1">
            <p className="text-[11px] font-medium text-foreground">{q.label}</p>
            {q.type === "rating" ? (
              <div className="flex gap-1">
                {Array.from({ length: 5 }).map((_, i) => <Star key={i} className="w-4 h-4 text-amber-400 fill-amber-400" />)}
              </div>
            ) : q.type === "yesno" ? (
              <div className="flex gap-2">
                <div className="flex-1 h-7 rounded bg-secondary flex items-center justify-center text-[10px]">Yes</div>
                <div className="flex-1 h-7 rounded bg-secondary flex items-center justify-center text-[10px]">No</div>
              </div>
            ) : (
              <div className="h-7 rounded bg-secondary/50" />
            )}
          </div>
        ))}
      <div className="w-full h-8 rounded-lg bg-primary flex items-center justify-center">
        <span className="text-[11px] text-primary-foreground font-medium">Submit</span>
      </div>
    </div>
  );
}
