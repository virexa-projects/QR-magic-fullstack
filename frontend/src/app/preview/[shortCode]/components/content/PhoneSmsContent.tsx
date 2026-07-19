// components/content/PhoneSmsContent.tsx
import { memo, useMemo } from "react";
import { User, Phone, MessageCircle } from "lucide-react";
import { trackAndGo } from "../../lib/tracking";
import type { ContentProps } from "../../types";

export const PhoneCallContent = memo(function PhoneCallContentBase({ data, shortCode }: ContentProps) {
  const phone = data.phone || "+91 XXXXX XXXXX";
  return (
    <div className="flex flex-col items-center bg-gradient-to-b from-neutral-50 to-white px-6 py-10 text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-white shadow-sm sm:h-24 sm:w-24">
        <User className="h-9 w-9 text-neutral-400 sm:h-11 sm:w-11" />
      </div>
      <p className="mt-4 text-xl font-semibold text-neutral-900 sm:text-2xl">{phone}</p>
      <p className="mt-1 text-xs text-neutral-500">Mobile</p>
      <div className="mt-8 flex w-full max-w-xs gap-3">
        <button
          onClick={() => trackAndGo(shortCode, `tel:${phone}`, false)}
          className="flex h-12 flex-1 items-center justify-center gap-2 rounded-2xl bg-emerald-500 text-sm font-semibold text-white"
        >
          <Phone className="h-4 w-4" /> Call
        </button>
        <button
          onClick={() => trackAndGo(shortCode, `sms:${phone}`, false)}
          className="flex h-12 flex-1 items-center justify-center gap-2 rounded-2xl text-sm font-semibold text-white"
          style={{ backgroundColor: "var(--accent)" }}
        >
          <MessageCircle className="h-4 w-4" /> Message
        </button>
      </div>
    </div>
  );
});

export const SMSContent = memo(function SMSContentBase({ data, shortCode }: ContentProps) {
  const phone = data.phone || "+91 XXXXX XXXXX";
  const message = data.message || "Your message...";
  const smsHref = useMemo(() => `sms:${phone}?body=${encodeURIComponent(message)}`, [phone, message]);

  return (
    <div className="flex flex-col">
      <div className="flex items-center gap-2.5 border-b border-neutral-100 px-5 py-3 sm:px-8">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-neutral-100">
          <User className="h-4 w-4 text-neutral-400" />
        </div>
        <p className="text-sm font-semibold text-neutral-900">{phone}</p>
      </div>
      <div className="flex min-h-[180px] flex-col justify-end px-5 py-6 sm:px-8">
        <div className="max-w-[85%] self-end sm:max-w-sm">
          <div className="rounded-2xl rounded-tr-sm px-3.5 py-2.5" style={{ backgroundColor: "var(--accent)" }}>
            <p className="text-[13px] text-white">{message}</p>
          </div>
        </div>
      </div>
      <div className="px-5 pb-5 sm:px-8">
        <button
          onClick={() => trackAndGo(shortCode, smsHref, false)}
          className="flex h-11 w-full items-center justify-center gap-2 rounded-2xl text-sm font-semibold text-white"
          style={{ backgroundColor: "var(--accent)" }}
        >
          Send Message
        </button>
      </div>
    </div>
  );
});

// Default export kept for the dynamic-import router (phone type only —
// SMS is imported directly as a named export where it's used).
export default PhoneCallContent;
