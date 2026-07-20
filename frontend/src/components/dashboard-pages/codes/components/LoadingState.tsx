// components/dashboard-pages/codes/components/LoadingState.tsx
"use client";

interface Props {
  colSpan?: number;
  asTableRow?: boolean;
}

export default function LoadingState({ colSpan, asTableRow }: Props) {
  const body = <div className="text-center py-12 text-muted-foreground text-sm">Loading your QR codes…</div>;

  if (asTableRow) {
    return (
      <tr>
        <td colSpan={colSpan}>{body}</td>
      </tr>
    );
  }

  return body;
}
