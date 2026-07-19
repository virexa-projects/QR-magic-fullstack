import { CheckCircle2, XCircle, Loader2, Copy, Check } from "lucide-react";
import { memo, useState } from "react";
import { Button } from "@/components/ui/button";

export type PaypalResult =
  | { status: "processing" }
  | {
      status: "success";
      planName: string;
      amount: number;
      currency: string;
      paymentId: string;
      date: string;
    }
  | {
      status: "scheduled";
      planName: string;
      fromPlanName: string;
      effectiveDate: string;
    }
  | {
      status: "error";
      message: string;
      retryable: boolean;
    };

function formatDateTime(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function CopyableId({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // clipboard API unavailable — fail silently, id is still visible/selectable
    }
  }

  return (
    <button
      onClick={handleCopy}
      className="inline-flex items-center gap-1 font-mono text-[11px] text-foreground/80 hover:text-foreground transition-colors"
      title="Copy transaction ID"
    >
      {value}
      {copied ? (
        <Check className="w-3 h-3 text-emerald shrink-0" />
      ) : (
        <Copy className="w-3 h-3 shrink-0 opacity-60" />
      )}
    </button>
  );
}

function PaypalModalBase({
  result,
  loading = false,
  onClose,
  onRetry,
}: {
  result: PaypalResult;
  loading?: boolean;
  onClose: () => void;
  onRetry?: () => void;
}) {
  const isProcessing = result.status === "processing";
  const isSuccess = result.status === "success";
  const isError = result.status === "error";

  // Processing state can't be dismissed by backdrop click — payment is
  // actively in flight, don't let the user think closing cancels it.
  function handleBackdropClick() {
    if (!isProcessing) onClose();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={handleBackdropClick}
    >
      <div
        className="bg-card border border-border/60 rounded-2xl p-6 w-full max-w-sm shadow-xl relative text-center"
        onClick={(e) => e.stopPropagation()}
      >
        {!isProcessing && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
            aria-label="Close"
          >
            <XCircle className="w-4 h-4" />
          </button>
        )}

        {/* Icon */}
        <div
          className={`mx-auto w-14 h-14 rounded-full flex items-center justify-center transition-colors ${
            isProcessing
              ? "bg-secondary"
              : isSuccess
              ? "bg-emerald/10"
              : "bg-destructive/10"
          }`}
        >
          {isProcessing && (
            <Loader2 className="w-6 h-6 text-muted-foreground animate-spin" />
          )}
          {isSuccess && <CheckCircle2 className="w-7 h-7 text-emerald" />}
          {isError && <XCircle className="w-7 h-7 text-destructive" />}
        </div>

        {/* Heading */}
        <h3 className="text-base font-semibold font-heading text-foreground mt-4">
          {isProcessing && "Confirming your payment…"}
          {isSuccess && "Payment successful"}
          {isError && "Payment failed"}
        </h3>

        {/* Body */}
        {isProcessing && (
          <p className="text-xs text-muted-foreground mt-2">
            Don't close this window — we're finalizing things with PayPal.
          </p>
        )}

        {isSuccess && (
          <>
            <p className="text-xs text-muted-foreground mt-2">
              You're now on the{" "}
              <span className="font-semibold text-foreground">{result.planName}</span>{" "}
              plan. It's active on your account.
            </p>

            <div className="mt-4 rounded-xl bg-secondary/50 border border-border/60 p-3.5 text-left space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Amount charged</span>
                <span className="font-semibold text-foreground">
                  {result.currency === "INR" ? "₹" : "$"}
                  {result.amount.toLocaleString("en-US", {
                    minimumFractionDigits: result.currency === "USD" ? 2 : 0,
                  })}{" "}
                  {result.currency !== "INR" && result.currency}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Date</span>
                <span className="text-foreground">{formatDateTime(result.date)}</span>
              </div>
              <div className="flex items-center justify-between text-xs gap-2">
                <span className="text-muted-foreground shrink-0">Transaction ID</span>
                <CopyableId value={result.paymentId} />
              </div>
            </div>

            <p className="text-[11px] text-muted-foreground mt-3">
              A receipt has been emailed to you. You can also find this in Invoices.
            </p>
          </>
        )}

        {isError && (
          <>
            <p className="text-xs text-muted-foreground mt-2">
              {result.message || "Something went wrong while processing your payment."}
            </p>
            <p className="text-[11px] text-muted-foreground mt-2">
              You haven't been charged. If money left your account, it will be
              automatically refunded within 5–7 business days.
            </p>
          </>
        )}

        {/* Actions */}
        {!isProcessing && (
          <div className="mt-6 flex gap-2">
            {isError && result.retryable && onRetry && (
              <Button
                variant="outline"
                onClick={onRetry}
                disabled={loading}
                className="flex-1 h-10 rounded-full"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin mx-auto" />
                ) : (
                  "Try again"
                )}
              </Button>
            )}
            <Button
              onClick={onClose}
              className={`flex-1 h-10 rounded-full ${
                isSuccess
                  ? "bg-emerald hover:bg-emerald/90 text-emerald-foreground"
                  : "bg-primary hover:bg-primary/90 text-primary-foreground"
              }`}
            >
              {isSuccess ? "Done" : "Close"}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

export default memo(PaypalModalBase);
