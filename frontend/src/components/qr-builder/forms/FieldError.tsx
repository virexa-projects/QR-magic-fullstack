// components/qr-builder/forms/FieldError.tsx
"use client";

export default function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="text-[11px] text-destructive mt-1">{message}</p>;
}

/** Utility so inputs can flip to a red ring when their field has an error. */
export function errorRing(hasError?: boolean) {
  return hasError ? "border-destructive focus-visible:ring-destructive/40" : "";
}
