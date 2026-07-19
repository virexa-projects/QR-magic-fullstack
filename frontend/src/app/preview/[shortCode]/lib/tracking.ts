// lib/tracking.ts
const API_BASE = process.env.NEXT_PUBLIC_API_URL || "";

/** Fire-and-forget click beacon — never blocks navigation on the result. */
export function trackClickBeacon(shortCode: string) {
  try {
    navigator.sendBeacon(`${API_BASE}/qr/short/${shortCode}/click`);
  } catch {
    // sendBeacon unsupported in some old webviews — don't block on it
  }
}

export function trackAndGo(shortCode: string, href: string, external?: boolean) {
  trackClickBeacon(shortCode);
  if (external) window.open(href, "_blank", "noreferrer");
  else window.location.href = href;
}
