// components/content/UPIContent.tsx
import { memo, useMemo } from "react";
import { CreditCard, ShieldCheck } from "lucide-react";
import { trackAndGo } from "../../lib/tracking";
import type { ContentProps } from "../../types";

function UPIContentBase({ data, shortCode }: ContentProps) {
  const name = data.name || "Payee Name";
  const amount = data.amount || "0.00";
  const upiId = data.upiId || "";

  const upiHref = useMemo(
    () =>
      `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(name)}&am=${encodeURIComponent(amount)}${
        data.note ? `&tn=${encodeURIComponent(data.note)}` : ""
      }`,
    [upiId, name, amount, data.note]
  );

  return (
    <div className="flex flex-col items-center px-6 py-8 text-center sm:px-10 sm:py-10">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[color:var(--accent)]/10 sm:h-20 sm:w-20">
        <CreditCard className="h-7 w-7 sm:h-9 sm:w-9" style={{ color: "var(--accent)" }} />
      </div>
      <p className="mt-3 text-base font-semibold text-neutral-900 sm:text-lg">{name}</p>
      {upiId && <p className="mt-0.5 text-xs text-neutral-500">{upiId}</p>}

      <div className="mt-6">
        <p className="text-[11px] font-medium uppercase tracking-wider text-neutral-400">Amount</p>
        <p className="mt-1 text-4xl font-bold text-neutral-900 sm:text-5xl">₹{amount}</p>
      </div>

      {data.note && <p className="mt-3 rounded-full bg-neutral-100 px-4 py-1.5 text-xs text-neutral-500">{data.note}</p>}

      <button
        onClick={() => trackAndGo(shortCode, upiHref, false)}
        className="mt-7 flex h-12 w-full max-w-xs items-center justify-center rounded-2xl text-sm font-semibold text-white shadow-sm"
        style={{ backgroundColor: "var(--accent)" }}
      >
        Pay ₹{amount}
      </button>
      <p className="mt-3 flex items-center gap-1 text-[11px] text-neutral-400">
        <ShieldCheck className="h-3 w-3" /> Paid directly to {name}, verified by UPI
      </p>
      <div className="mt-4 flex justify-center gap-6">
        {["GPay", "PhonePe", "Paytm"].map((app) => (
          <span key={app} className="text-[11px] text-neutral-400">{app}</span>
        ))}
      </div>
    </div>
  );
}

export default memo(UPIContentBase);
