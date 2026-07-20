// components/dashboard-pages/codes/lazy/PreviewDialog.tsx
"use client";
import QrPreviewDrawer from "@/components/dashboard/QrPreviewDrawer";
import type { QrCode, QRDesign } from "../codes.types";
import { defaultDesign } from "../codes.constants";

interface Props {
  qr: QrCode | null;
  onClose: () => void;
}

// The existing QrPreviewDrawer already covers everything this dialog needs
// (preview, scans, copy link, download, open link). Kept as its own file
// here so it can be code-split alongside the other lazy-loaded dialogs.
export default function PreviewDialog({ qr, onClose }: Props) {
  const design: QRDesign = qr?.design ?? defaultDesign;
  return <QrPreviewDrawer open={!!qr} onOpenChange={(o) => !o && onClose()} qr={qr} design={design} />;
}
