// components/content/LocationContent.tsx
import { memo } from "react";
import { MapPin } from "lucide-react";
import { trackAndGo } from "../../lib/tracking";
import { getMapsHref } from "../../lib/location";
import type { ContentProps } from "../../types";

function LocationContentBase({ data, shortCode }: ContentProps) {
  const isUrlMode = data.mode === "url" && data.mapsUrl;
  const mapsHref = getMapsHref(data);

  return (
    <div className="flex flex-col">
      <div className="relative flex items-center justify-center bg-[color:var(--accent)]/5" style={{ minHeight: 180 }}>
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage:
              "linear-gradient(#00000010 1px, transparent 1px), linear-gradient(90deg, #00000010 1px, transparent 1px)",
            backgroundSize: "32px 32px",
          }}
        />
        <div className="relative z-10 flex flex-col items-center">
          <MapPin className="h-12 w-12 text-red-500 drop-shadow-lg sm:h-14 sm:w-14" />
        </div>
      </div>
      <div className="px-5 py-5 text-center sm:px-8">
        <p className="text-sm font-semibold text-neutral-900">Pinned Location</p>
        <p className="mt-0.5 truncate text-[11px] text-neutral-500">
          {isUrlMode ? mapsHref : `${data.latitude || "28.6139"}°N, ${data.longitude || "77.2090"}°E`}
        </p>
        <button
          onClick={() => trackAndGo(shortCode, mapsHref, true)}
          className="mt-4 flex h-11 w-full items-center justify-center gap-2 rounded-2xl text-sm font-semibold text-white"
          style={{ backgroundColor: "var(--accent)" }}
        >
          <MapPin className="h-4 w-4" /> Get Directions
        </button>
      </div>
    </div>
  );
}

export default memo(LocationContentBase);
