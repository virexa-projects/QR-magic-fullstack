// components/dashboard-pages/create/lazy.ts
import dynamic from "next/dynamic";
import {
  Step3Skeleton,
  QrPreviewSkeleton,
  PhoneFrameSkeleton,
  TypeGridSkeleton,
} from "./components/Skeletons";

// Heaviest — full design/color/gradient UI. Only needed once user hits Step 3.
export const Step3Qr = dynamic(() => import("@/components/qr-builder/Step3Qr"), {
  ssr: false,
  loading: () => <Step3Skeleton />,
});

// Pulls in qr-code-styling — never needed until QR tab is viewed.
export const StyledQrPreview = dynamic(() => import("@/components/dashboard/StyledQrPreview"), {
  ssr: false,
  loading: () => <QrPreviewSkeleton />,
});

// Only needed for the "Preview" tab of the right panel.
export const PhoneFrame = dynamic(() => import("@/components/qr-builder/preview/PhoneFrame"), {
  ssr: false,
  loading: () => <PhoneFrameSkeleton />,
});

// Only mounted after a successful save — modal, not needed on initial paint.
export const QrPreviewModal = dynamic(() => import("@/components/dashboard/QrPreviewModal"), {
  ssr: false,
});

// Step 1 only — but still worth deferring off the very first paint tick.
export const QrTypeGrid = dynamic(() => import("@/components/qr-builder/QrTypeGrid"), {
  ssr: false,
  loading: () => <TypeGridSkeleton />,
});