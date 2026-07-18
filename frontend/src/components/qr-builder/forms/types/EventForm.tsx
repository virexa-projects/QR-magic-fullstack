// components/qr-builder/forms/types/EventForm.tsx
"use client";
import FormSection from "../FormSection";
import FieldError, { errorRing } from "../FieldError";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { CalendarDays, MapPin, Bell } from "lucide-react";
import type { EventValue } from "@/lib/qr-types/schema";

interface Props { value: EventValue; onChange: (v: EventValue) => void; errors?: Record<string, string> }

const REMINDERS: { id: EventValue["reminder"]; label: string }[] = [
  { id: "none", label: "None" },
  { id: "15min", label: "15 min before" },
  { id: "1hour", label: "1 hour before" },
  { id: "1day", label: "1 day before" },
];

export default function EventForm({ value, onChange, errors }: Props) {
  const set = <K extends keyof EventValue>(k: K, v: EventValue[K]) => onChange({ ...value, [k]: v });

  return (
    <div className="space-y-3">
      <FormSection title="Event details" icon={CalendarDays} defaultOpen error={errors?.title}>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-muted-foreground">Event title</Label>
            <Input
              value={value.title}
              onChange={(e) => set("title", e.target.value)}
              placeholder="Product Launch Party"
              className={`h-10 ${errorRing(!!errors?.title)}`}
            />
            <FieldError message={errors?.title} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-muted-foreground">Description</Label>
            <Textarea value={value.description} onChange={(e) => set("description", e.target.value)} placeholder="What's this event about?" className="min-h-[70px]" />
          </div>
        </div>
      </FormSection>

      <FormSection title="Date & time" icon={CalendarDays} defaultOpen error={errors?.startDate || errors?.endDate}>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-xs">All-day event</Label>
            <Switch checked={value.allDay} onCheckedChange={(v) => set("allDay", v)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-[11px] text-muted-foreground">Starts</Label>
              <Input
                type="date"
                value={value.startDate}
                onChange={(e) => set("startDate", e.target.value)}
                className={`h-9 text-xs ${errorRing(!!errors?.startDate)}`}
              />
              <FieldError message={errors?.startDate} />
            </div>
            {!value.allDay && (
              <div className="space-y-1.5">
                <Label className="text-[11px] text-muted-foreground opacity-0">.</Label>
                <Input type="time" value={value.startTime} onChange={(e) => set("startTime", e.target.value)} className="h-9 text-xs" />
              </div>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-[11px] text-muted-foreground">Ends</Label>
              <Input
                type="date"
                value={value.endDate}
                onChange={(e) => set("endDate", e.target.value)}
                className={`h-9 text-xs ${errorRing(!!errors?.endDate)}`}
              />
              <FieldError message={errors?.endDate} />
            </div>
            {!value.allDay && (
              <div className="space-y-1.5">
                <Label className="text-[11px] text-muted-foreground opacity-0">.</Label>
                <Input type="time" value={value.endTime} onChange={(e) => set("endTime", e.target.value)} className="h-9 text-xs" />
              </div>
            )}
          </div>
        </div>
      </FormSection>

      <FormSection title="Location" icon={MapPin}>
        <Input value={value.location} onChange={(e) => set("location", e.target.value)} placeholder="Venue address or online link" className="h-10" />
      </FormSection>

      <FormSection title="Reminder" icon={Bell}>
        <div className="grid grid-cols-2 gap-2">
          {REMINDERS.map((r) => (
            <button
              key={r.id}
              type="button"
              onClick={() => set("reminder", r.id)}
              className={`py-2 rounded-lg border text-xs font-medium transition ${
                value.reminder === r.id ? "bg-foreground text-background border-foreground" : "border-border text-muted-foreground hover:border-foreground/30"
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </FormSection>
    </div>
  );
}

// --- Preview ---
export function EventPreview({ value }: { value: EventValue }) {
  return (
    <div className="w-[228px] rounded-xl border border-border bg-card overflow-hidden">
      <div className="bg-primary text-primary-foreground px-4 py-3 text-center">
        <p className="text-[10px] uppercase tracking-wider opacity-80">
          {value.startDate ? new Date(value.startDate).toLocaleDateString("en-IN", { month: "short" }) : "Date"}
        </p>
        <p className="text-2xl font-bold font-heading">
          {value.startDate ? new Date(value.startDate).getDate() : "--"}
        </p>
      </div>
      <div className="p-4 space-y-2">
        <p className="text-sm font-semibold text-foreground truncate">{value.title || "Event title"}</p>
        {!value.allDay && value.startTime && (
          <p className="text-[11px] text-muted-foreground">{value.startTime} {value.endTime && `– ${value.endTime}`}</p>
        )}
        {value.location && (
          <p className="text-[11px] text-muted-foreground flex items-center gap-1 truncate">
            <MapPin className="w-3 h-3 shrink-0" /> {value.location}
          </p>
        )}
        <div className="w-full h-8 rounded-lg bg-primary/10 flex items-center justify-center mt-2">
          <span className="text-[10px] text-primary font-medium">Add to Calendar</span>
        </div>
      </div>
    </div>
  );
}
