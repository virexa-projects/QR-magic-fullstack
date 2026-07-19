// components/BrandFooter.tsx
import { memo } from "react";
import { ArrowRight } from "lucide-react";

function BrandFooterBase({ accent }: { accent: string }) {
  return (
    <div className="mt-8 flex items-center justify-between rounded-2xl border border-neutral-200 bg-white px-4 py-3 sm:mt-10">
      <div className="flex items-center gap-2">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg" style={{ backgroundColor: `${accent}1a` }}>
          <span className="text-[11px] font-bold" style={{ color: accent }}>V</span>
        </div>
        <span className="text-[12px] text-neutral-500">
          Made with <span className="font-semibold text-neutral-700">Virexa</span>
        </span>
      </div>
      <a href="/" className="flex items-center gap-1 text-[12px] font-semibold" style={{ color: accent }}>
        Create yours <ArrowRight className="h-3 w-3" />
      </a>
    </div>
  );
}

export const BrandFooter = memo(BrandFooterBase);
