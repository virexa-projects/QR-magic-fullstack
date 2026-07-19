// components/content/URLContent.tsx
import { memo } from "react";
import { Lock, Globe, ExternalLink, ShieldCheck } from "lucide-react";
import { trackAndGo } from "../../lib/tracking";
import type { ContentProps } from "../../types";

function URLContentBase({ data, shortCode }: ContentProps) {
  const url = data.url || "https://yourwebsite.com";
  const domain = url.replace(/https?:\/\//, "").split("/")[0] || "yourwebsite.com";
  return (
    <div className="flex flex-col">
      <div className="flex items-center gap-2 border-b border-neutral-100 bg-neutral-50 px-5 py-2.5 sm:px-7">
        <Lock className="h-3.5 w-3.5 text-neutral-400" />
        <p className="truncate text-xs text-neutral-500">{domain}</p>
      </div>
      <div className="flex flex-col items-center px-6 py-8 text-center sm:px-10 sm:py-10">
        <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-[color:var(--accent)]/10 sm:h-20 sm:w-20">
          <Globe className="h-8 w-8 sm:h-9 sm:w-9" style={{ color: "var(--accent)" }} />
        </div>
        <h2 className="text-lg font-bold text-neutral-900 sm:text-xl">{domain}</h2>
        <p className="mt-1.5 max-w-xs text-[13px] text-neutral-500">
          This QR code opens the link above. Tap below to continue.
        </p>
        <button
          onClick={() => trackAndGo(shortCode, url, true)}
          className="mt-6 flex h-12 w-full max-w-xs items-center justify-center gap-2 rounded-2xl text-sm font-semibold text-white shadow-sm"
          style={{ backgroundColor: "var(--accent)" }}
        >
          Visit site <ExternalLink className="h-4 w-4" />
        </button>
        <p className="mt-3 flex items-center gap-1 text-[11px] text-neutral-400">
          <ShieldCheck className="h-3 w-3" /> Scanned links are shown before you open them
        </p>
      </div>
    </div>
  );
}

export default memo(URLContentBase);
