// components/content/EventContent.tsx
import { memo, useMemo } from "react";
import { CalendarPlus, Clock, MapPin, Users } from "lucide-react";
import { downloadICS, formatEventDate } from "../../lib/ics";
import type { ContentProps } from "../../types";

function EventContentBase({ data, shortCode }: ContentProps) {
  const title = data.title || "Event";
  const description = data.description || "";
  const location = data.location || "";
  const allDay = !!data.allDay;
  const organizerName = data.organizerName || "";
  const reminder = data.reminder || "";

  const startLabel = useMemo(() => formatEventDate(data.startDate, data.startTime, allDay), [data.startDate, data.startTime, allDay]);
  const endLabel = useMemo(() => formatEventDate(data.endDate, data.endTime, allDay), [data.endDate, data.endTime, allDay]);
  const sameDay = data.startDate === data.endDate;

  return (
    <div className="flex flex-col">
      <div className="flex items-center gap-3 px-5 py-4 sm:px-8" style={{ backgroundColor: "var(--accent)" }}>
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/20">
          <CalendarPlus className="h-5 w-5 text-white" />
        </div>
        <h2 className="truncate text-base font-bold text-white sm:text-lg">{title}</h2>
      </div>

      <div className="space-y-3 px-5 py-5 sm:px-8">
        <div className="flex items-start gap-3">
          <Clock className="mt-0.5 h-4 w-4 shrink-0 text-neutral-400" />
          <div className="text-[13px] text-neutral-700">
            <p className="font-medium">{startLabel}</p>
            {!sameDay && endLabel && <p className="text-neutral-500">to {endLabel}</p>}
            {sameDay && !allDay && data.endTime && (
              <p className="text-neutral-500">
                until {new Date(`${data.endDate}T${data.endTime}`).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}
              </p>
            )}
          </div>
        </div>

        {location && (
          <div className="flex items-start gap-3">
            <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-neutral-400" />
            <p className="truncate text-[13px] text-neutral-700">{location}</p>
          </div>
        )}

        {organizerName && (
          <div className="flex items-start gap-3">
            <Users className="mt-0.5 h-4 w-4 shrink-0 text-neutral-400" />
            <p className="text-[13px] text-neutral-700">Hosted by {organizerName}</p>
          </div>
        )}

        {description && (
          <p className="rounded-xl bg-neutral-50 px-3.5 py-3 text-[13px] leading-relaxed text-neutral-600">{description}</p>
        )}

        {reminder && reminder !== "none" && (
          <p className="text-[11px] text-neutral-400">Reminder set for {reminder} before</p>
        )}
      </div>

      <div className="px-5 pb-5 sm:px-8">
        <button
          onClick={() => downloadICS(shortCode, data)}
          className="flex h-11 w-full items-center justify-center gap-2 rounded-2xl text-sm font-semibold text-white"
          style={{ backgroundColor: "var(--accent)" }}
        >
          <CalendarPlus className="h-4 w-4" /> Add to Calendar
        </button>
      </div>
    </div>
  );
}

export default memo(EventContentBase);
