// components/ContactRow.tsx
import { memo } from "react";

interface Props {
  icon: React.ElementType;
  label: string;
  value: string;
  accent?: string;
}

function ContactRowBase({ icon: Icon, label, value, accent }: Props) {
  return (
    <div className="flex items-center gap-3 rounded-xl bg-neutral-50 px-3.5 py-2.5">
      <div
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md"
        style={accent ? { backgroundColor: `${accent}14` } : undefined}
      >
        <Icon className="h-3.5 w-3.5" style={{ color: accent || "var(--accent)" }} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[9px] font-medium uppercase tracking-wider text-neutral-400">{label}</p>
        <p className="truncate text-[13px] font-medium text-neutral-800">{value}</p>
      </div>
    </div>
  );
}

export const ContactRow = memo(ContactRowBase);
