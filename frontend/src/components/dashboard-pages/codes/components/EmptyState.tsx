// components/dashboard-pages/codes/components/EmptyState.tsx
"use client";
import { QrCode as QrIcon } from "lucide-react";

interface Props {
  colSpan?: number;
  asTableRow?: boolean;
}

export default function EmptyState({ colSpan, asTableRow }: Props) {
  const body = (
    <div className="flex flex-col items-center justify-center gap-2 py-12 text-muted-foreground">
      <QrIcon className="w-8 h-8 opacity-30" />
      <p className="text-sm">No QR codes match your filters.</p>
    </div>
  );

  if (asTableRow) {
    return (
      <tr>
        <td colSpan={colSpan} className="text-center py-4">
          {body}
        </td>
      </tr>
    );
  }

  return body;
}
