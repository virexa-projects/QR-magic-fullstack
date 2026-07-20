// components/dashboard-pages/codes/components/DownloadMenu.tsx
"use client";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import DownloadPopover from "@/components/dashboard/DownloadPopover";
import type { QrCode, QRDesign } from "../codes.types";

interface Props {
  qr: QrCode;
  design: QRDesign;
  compact?: boolean;
}

export default function DownloadMenu({ qr, design, compact }: Props) {
  return (
    <DownloadPopover
      value={qr.shortUrl}
      design={design}
      filename={qr.name}
      trigger={
        compact ? (
          <Button size="icon" variant="outline" className="h-8 w-8 border-border hover:border-primary/50 hover:text-primary">
            <Download className="w-3.5 h-3.5" />
          </Button>
        ) : (
          <Button size="sm" variant="outline" className="h-8 gap-1.5 text-xs border-border hover:border-primary/50 hover:text-primary">
            <Download className="w-3.5 h-3.5" />
            Download
          </Button>
        )
      }
    />
  );
}
