// lib/qr-types/encoders/ics.ts
import type { EventValue } from "../schema";

function toIcsDate(date: string, time: string, allDay: boolean): string {
  if (!date) return "";
  const clean = date.replace(/-/g, "");
  if (allDay) return clean;
  const t = (time || "00:00").replace(":", "") + "00";
  return `${clean}T${t}`;
}

const REMINDER_MINUTES: Record<EventValue["reminder"], number | null> = {
  none: null,
  "15min": 15,
  "1hour": 60,
  "1day": 1440,
};

/** Builds a minimal .ics VEVENT payload from the event form value. */
export function encodeICS(v: EventValue): string {
  const dtStart = toIcsDate(v.startDate, v.startTime, v.allDay);
  const dtEnd = toIcsDate(v.endDate || v.startDate, v.endTime, v.allDay);
  const reminderMin = REMINDER_MINUTES[v.reminder];

  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "BEGIN:VEVENT",
    `SUMMARY:${v.title || ""}`,
    v.description ? `DESCRIPTION:${v.description.replace(/\n/g, "\\n")}` : "",
    v.location ? `LOCATION:${v.location}` : "",
    `DTSTART${v.allDay ? ";VALUE=DATE" : ""}:${dtStart}`,
    `DTEND${v.allDay ? ";VALUE=DATE" : ""}:${dtEnd}`,
    ...(reminderMin != null
      ? ["BEGIN:VALARM", "ACTION:DISPLAY", `TRIGGER:-PT${reminderMin}M`, "END:VALARM"]
      : []),
    "END:VEVENT",
    "END:VCALENDAR",
  ].filter(Boolean);

  return lines.join("\n");
}
