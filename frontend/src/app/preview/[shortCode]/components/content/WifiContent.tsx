// components/content/WifiContent.tsx
import { memo } from "react";
import { Wifi, Lock } from "lucide-react";
import { trackAndGo } from "../../lib/tracking";
import type { ContentProps } from "../../types";

function WifiContentBase({ data, shortCode }: ContentProps) {
  const ssid = data.ssid || "Network Name";
  const enc = data.encryption || "WPA";
  const password = data.password || "";
  const wifiHref = `WIFI:T:${enc};S:${ssid};P:${password};;`;

  return (
    <div className="flex flex-col items-center px-6 py-8 text-center sm:px-10 sm:py-10">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[color:var(--accent)]/10 sm:h-20 sm:w-20">
        <Wifi className="h-7 w-7 sm:h-9 sm:w-9" style={{ color: "var(--accent)" }} />
      </div>
      <h2 className="mt-4 text-lg font-bold text-neutral-900">{ssid}</h2>
      <p className="mt-1 text-xs text-neutral-500">Secured with {enc}</p>

      <button
        onClick={() => trackAndGo(shortCode, wifiHref, false)}
        className="mt-7 flex h-12 w-full max-w-xs items-center justify-center rounded-2xl text-sm font-semibold text-white shadow-sm"
        style={{ backgroundColor: "var(--accent)" }}
      >
        Join Network
      </button>
      <p className="mt-3 flex items-center gap-1 text-[11px] text-neutral-400">
        <Lock className="h-3 w-3" /> One tap — no typing the password
      </p>
    </div>
  );
}

export default memo(WifiContentBase);
