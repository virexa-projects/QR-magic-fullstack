// components/content/EmailContent.tsx
import { memo, useMemo } from "react";
import { Mail } from "lucide-react";
import { trackAndGo } from "../../lib/tracking";
import type { ContentProps } from "../../types";

function EmailContentBase({ data, shortCode }: ContentProps) {
  const email = data.email || "hello@example.com";
  const subject = data.subject || "Subject line";
  const body = data.body || "Your message here...";
  const mailtoHref = useMemo(
    () => `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`,
    [email, subject, body]
  );

  return (
    <div className="flex flex-col">
      <div className="border-b border-neutral-100 px-5 py-3 sm:px-8">
        <p className="text-sm font-semibold text-neutral-900">New Message</p>
      </div>
      <div className="px-5 sm:px-8">
        <div className="flex items-center border-b border-neutral-100 py-2.5">
          <span className="w-12 text-xs text-neutral-400">To:</span>
          <span className="text-[13px] text-neutral-800">{email}</span>
        </div>
        <div className="flex items-center border-b border-neutral-100 py-2.5">
          <span className="w-12 text-xs text-neutral-400">Sub:</span>
          <span className="text-[13px] text-neutral-800">{subject}</span>
        </div>
      </div>
      <div className="px-5 py-4 sm:px-8">
        <p className="text-[13px] leading-relaxed text-neutral-600">{body}</p>
      </div>
      <div className="px-5 pb-5 sm:px-8">
        <button
          onClick={() => trackAndGo(shortCode, mailtoHref, false)}
          className="flex h-11 w-full items-center justify-center gap-2 rounded-2xl text-sm font-semibold text-white"
          style={{ backgroundColor: "var(--accent)" }}
        >
          <Mail className="h-4 w-4" /> Send Email
        </button>
      </div>
    </div>
  );
}

export default memo(EmailContentBase);
