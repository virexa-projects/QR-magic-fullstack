// components/content/TextContent.tsx
import { memo } from "react";
import { FileText } from "lucide-react";

function TextContentBase({ data }: { data: Record<string, any> }) {
  const text = data.text || "Your text will appear here...";
  return (
    <div className="px-6 py-8 sm:px-8">
      <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-[color:var(--accent)]/10">
        <FileText className="h-5 w-5" style={{ color: "var(--accent)" }} />
      </div>
      <div className="rounded-xl border border-neutral-100 bg-neutral-50 p-4">
        <p className="whitespace-pre-wrap text-[14px] leading-relaxed text-neutral-700">{text}</p>
      </div>
    </div>
  );
}

export default memo(TextContentBase);
