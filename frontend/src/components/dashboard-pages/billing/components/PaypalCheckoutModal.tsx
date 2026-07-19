import { memo, useEffect, useRef, useState } from "react";
import { useDispatch } from "react-redux";
import { Loader2, X, AlertTriangle } from "lucide-react";
import { fetchPaypalQuote, type PaypalQuote } from "@/store/slices/Billingslice";
import type { ApiPlan, AppDispatch } from "../billing.types";
import { loadPaypalScript } from "./paypalSdkLoader";

// PayPal checkout modal. Fetches a converted-price quote up front so
// the user sees the real USD amount before the Buttons widget even
// renders, then renders PayPal Buttons once the SDK script has loaded.
//
// NOTE: this modal only handles getting the buyer TO an approved
// PayPal order — it does not own any post-approval result state.
// That lives in usePaypalCheckout, because this modal gets unmounted
// (onApprove closes it) right as capture kicks off, so any state
// stored in here would vanish at exactly the moment it'd be needed.
function PaypalCheckoutModalBase({
  plan,
  onClose,
  onCreateOrder,
  onApprove,
  onError,
}: {
  plan: ApiPlan;
  onClose: () => void;
  onCreateOrder: () => Promise<string>; // returns PayPal orderId
  onApprove: (orderId: string) => Promise<void>;
  onError: (message: string) => void;
}) {
  const dispatch = useDispatch<AppDispatch>();
  const buttonsRef = useRef<HTMLDivElement>(null);
  const [sdkReady, setSdkReady] = useState(false);
  const [sdkFailed, setSdkFailed] = useState(false);
  const [quote, setQuote] = useState<PaypalQuote | null>(null);
  const [quoteFailed, setQuoteFailed] = useState(false);

  // Preview the converted USD amount. This is a preview only — the
  // real conversion happens again server-side when create-order fires,
  // using the same live rate (cached hourly), so the two should match.
  useEffect(() => {
    let cancelled = false;
    dispatch(fetchPaypalQuote(plan._id))
      .unwrap()
      .then((q: PaypalQuote) => {
        if (!cancelled) setQuote(q);
      })
      .catch(() => {
        if (!cancelled) setQuoteFailed(true);
      });
    return () => {
      cancelled = true;
    };
  }, [dispatch, plan._id]);

  useEffect(() => {
    const clientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID as string;
    // PayPal cannot receive INR — this must always be USD regardless
    // of plan.currency, which stays INR for display everywhere else.
    const paypalCurrency = "USD";

    if (!clientId) {
      setSdkFailed(true);
      onError("PayPal client ID is not configured.");
      return;
    }

    loadPaypalScript(clientId, paypalCurrency).then((loaded) => {
      if (!loaded) {
        setSdkFailed(true);
        onError("Couldn't load PayPal checkout. Check your connection and try again.");
        return;
      }
      setSdkReady(true);
    });
  }, [onError]);

  useEffect(() => {
    if (!sdkReady || !buttonsRef.current) return;

    const paypal = (window as any).paypal;
    if (!paypal) return;

    buttonsRef.current.innerHTML = "";

    const buttons = paypal.Buttons({
      style: { layout: "vertical", shape: "rect", label: "pay" },
      createOrder: async () => {
        try {
          return await onCreateOrder();
        } catch (err: any) {
          onError(err?.message || "Failed to create PayPal order");
          throw err;
        }
      },
      onApprove: async (data: { orderID: string }) => {
        try {
          await onApprove(data.orderID);
        } catch (err: any) {
          onError(err?.message || "Payment approval failed");
        }
      },
      onError: () => {
        onError("PayPal checkout ran into a problem. Please try again.");
      },
      onCancel: () => {
        onClose();
      },
    });

    buttons.render(buttonsRef.current);

    return () => {
      if (buttonsRef.current) buttonsRef.current.innerHTML = "";
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sdkReady]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-card border border-border/60 rounded-2xl p-6 w-full max-w-sm shadow-xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>
        <h3 className="text-base font-semibold font-heading text-foreground">
          Pay for {plan.name}
        </h3>
        <p className="text-xs text-muted-foreground mt-1">
          Complete payment with PayPal. (Sandbox mode — no real charge.)
        </p>

        {/* Converted-amount preview */}
        <div className="mt-4 rounded-xl bg-secondary/50 border border-border/60 p-3">
          {quoteFailed ? (
            <p className="text-xs text-muted-foreground">
              Charging {plan.currency === "INR" ? "₹" : "$"}
              {plan.price.toLocaleString("en-US")} via PayPal.
            </p>
          ) : !quote ? (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Loader2 className="w-3.5 h-3.5 animate-spin" /> Getting current rate…
            </div>
          ) : quote.originalCurrency === "INR" ? (
            <p className="text-xs text-foreground">
              <span className="font-semibold">${quote.amount.toFixed(2)} USD</span>{" "}
              <span className="text-muted-foreground">
                (≈ ₹{quote.originalAmount.toLocaleString("en-IN")}, rate ₹1 = ${quote.rate.toFixed(4)})
              </span>
            </p>
          ) : (
            <p className="text-xs text-foreground">
              <span className="font-semibold">
                ${quote.amount.toFixed(2)} {quote.currency}
              </span>
            </p>
          )}
        </div>

        <div className="mt-5 min-h-[120px]">
          {sdkFailed ? (
            <div className="flex items-center gap-2 text-xs text-destructive">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              Couldn't load PayPal. Please try again.
            </div>
          ) : !sdkReady ? (
            <div className="flex items-center justify-center h-24">
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            </div>
          ) : null}
          <div ref={buttonsRef} />
        </div>
      </div>
    </div>
  );
}

export const PaypalCheckoutModal = memo(PaypalCheckoutModalBase);
