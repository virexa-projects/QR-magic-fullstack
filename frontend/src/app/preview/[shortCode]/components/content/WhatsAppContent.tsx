// components/content/WhatsAppContent.tsx
import { memo, useMemo } from "react";
import { User, MessageSquare } from "lucide-react";
import { trackAndGo } from "../../lib/tracking";
import type { ContentProps } from "../../types";

function WhatsAppContentBase({ data, shortCode }: ContentProps) {
  const phone = data.phone || "+91 XXXXX XXXXX";
  const message = data.message || "Hi! 👋";
  const waHref = useMemo(
    () => `https://wa.me/${phone.replace(/\D/g, "")}${message ? `?text=${encodeURIComponent(message)}` : ""}`,
    [phone, message]
  );

  return (
    <div className="flex flex-col bg-[#ece5dd]">
      <div className="flex items-center gap-3 bg-[#075e54] px-4 py-3 sm:px-6">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/20">
          <User className="h-4 w-4 text-white" />
        </div>
        <div>
          <p className="text-sm font-semibold text-white">{phone}</p>
          <p className="text-[10px] text-white/70">online</p>
        </div>
      </div>
      <div className="flex min-h-[220px] flex-col justify-end px-4 py-6 sm:px-8">
        <div className="max-w-[85%] self-end sm:max-w-sm">
          <div className="rounded-lg rounded-tr-none bg-[#dcf8c6] px-3.5 py-2.5 shadow-sm">
            <p className="text-[13px] text-[#303030]">{message}</p>
            <p className="mt-1 text-right text-[9px] text-[#999]">9:41 AM</p>
          </div>
        </div>
      </div>
      <div className="bg-white px-4 py-4 sm:px-8">
        <button
          onClick={() => trackAndGo(shortCode, waHref, true)}
          className="flex h-11 w-full items-center justify-center gap-2 rounded-2xl bg-[#075e54] text-sm font-semibold text-white"
        >
          <MessageSquare className="h-4 w-4" /> Open WhatsApp
        </button>
      </div>
    </div>
  );
}

export default memo(WhatsAppContentBase);
