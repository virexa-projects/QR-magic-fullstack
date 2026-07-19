// lib/ics.ts
import { trackClickBeacon } from "./tracking";

function escapeICSValue(value: string): string {
  return String(value ?? "")
    .replace(/\\/g, "\\\\")
    .replace(/\n/g, "\\n")
    .replace(/,/g, "\\,")
    .replace(/;/g, "\\;");
}

function icsDateTime(date: string, time?: string): string {
  const d = (date || "").replace(/-/g, "");
  if (!time) return d;
  const t = time.replace(":", "") + "00";
  return `${d}T${t}`;
}

function reminderToTrigger(reminder?: string): string | null {
  if (!reminder || reminder === "none") return null;
  const m = reminder.match(/(\d+)\s*(min|hour|day)/i);
  if (!m) return "-PT15M";
  const [, n, unit] = m;
  if (unit.startsWith("min")) return `-PT${n}M`;
  if (unit.startsWith("hour")) return `-PT${n}H`;
  return `-P${n}D`;
}

export function buildICSString(data: Record<string, any>): string {
  const {
    title = "Event",
    description = "",
    location = "",
    startDate = "",
    startTime = "",
    endDate = "",
    endTime = "",
    allDay = false,
    reminder = "",
    organizerName = "",
  } = data;

  const lines = ["BEGIN:VCALENDAR", "VERSION:2.0", "BEGIN:VEVENT"];
  lines.push(`SUMMARY:${escapeICSValue(title)}`);
  if (description) lines.push(`DESCRIPTION:${escapeICSValue(description)}`);
  if (location) lines.push(`LOCATION:${escapeICSValue(location)}`);
  if (organizerName) lines.push(`ORGANIZER;CN=${escapeICSValue(organizerName)}:MAILTO:noreply@example.com`);

  if (allDay) {
    lines.push(`DTSTART;VALUE=DATE:${icsDateTime(startDate)}`);
    lines.push(`DTEND;VALUE=DATE:${icsDateTime(endDate || startDate)}`);
  } else {
    lines.push(`DTSTART:${icsDateTime(startDate, startTime || "00:00")}`);
    lines.push(`DTEND:${icsDateTime(endDate || startDate, endTime || startTime || "00:00")}`);
  }

  const trigger = reminderToTrigger(reminder);
  if (trigger) {
    lines.push("BEGIN:VALARM", "ACTION:DISPLAY", `TRIGGER:${trigger}`, "END:VALARM");
  }

  lines.push("END:VEVENT", "END:VCALENDAR");
  return lines.join("\r\n");
}

export function formatEventDate(date: string, time: string, allDay: boolean) {
  if (!date) return "";
  const iso = allDay ? date : `${date}T${time || "00:00"}`;
  const d = new Date(iso);
  if (isNaN(d.getTime())) return date;
  const dateStr = d.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric", year: "numeric" });
  if (allDay) return dateStr;
  const timeStr = d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
  return `${dateStr} · ${timeStr}`;
}

export function downloadICS(shortCode: string, data: Record<string, any>) {
  trackClickBeacon(shortCode);
  const ics = buildICSString(data);
  const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const filename = `${(data.title || "event").trim().replace(/\s+/g, "_")}.ics`;
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}
