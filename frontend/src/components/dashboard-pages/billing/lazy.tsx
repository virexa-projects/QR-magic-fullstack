import dynamic from "next/dynamic";
import { ModalSkeleton, PaypalCheckoutModalSkeleton } from "./components/Skeletons";

// PayPal result modal (processing/success/scheduled/error). Never
// needed on first paint — only mounted after a checkout attempt.
export const PaypalModal = dynamic(() => import("./components/PaypalModal"), {
  ssr: false,
  loading: () => <ModalSkeleton />,
});

// PayPal Buttons checkout modal. Pulls in the PayPal SDK script, so
// keep it out of the initial bundle entirely.
export const PaypalCheckoutModal = dynamic(
  () => import("./components/PaypalCheckoutModal").then((m) => m.PaypalCheckoutModal),
  {
    ssr: false,
    loading: () => <PaypalCheckoutModalSkeleton />,
  }
);

// Downgrade confirmation modal — only needed on a downgrade selection.
export const DowngradeConfirmModal = dynamic(
  () => import("./components/DowngradeConfirmModal").then((m) => m.DowngradeConfirmModal),
  {
    ssr: false,
    loading: () => <ModalSkeleton />,
  }
);
