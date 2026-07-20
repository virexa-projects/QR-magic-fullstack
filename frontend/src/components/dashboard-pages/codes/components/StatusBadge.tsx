// components/dashboard-pages/codes/components/StatusBadge.tsx
"use client";
import type { QrCode } from "../codes.types";

interface Props {
  status: QrCode["status"];
  disabled?: boolean;
  onToggle?: () => void;
}

export default function StatusBadge({ status, disabled, onToggle }: Props) {
  const isActive = status === "active";
  const content = (
    <>
      <span className={`w-1.5 h-1.5 rounded-full ${isActive ? "bg-success animate-pulse" : "bg-muted-foreground"}`} />
      {status}
    </>
  );

  const classes = `inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider disabled:opacity-50 ${
    isActive ? "bg-success/10 text-success" : "bg-muted text-muted-foreground"
  }`;

  if (!onToggle) {
    return <span className={classes}>{content}</span>;
  }

  return (
    <button disabled={disabled} onClick={onToggle} className={classes}>
      {content}
    </button>
  );
}
