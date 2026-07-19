// lib/location.ts
export function getMapsHref(data: Record<string, any>): string {
  if (data.mode === "url" && data.mapsUrl) return data.mapsUrl;
  const lat = data.latitude || "28.6139";
  const lng = data.longitude || "77.2090";
  return `https://www.google.com/maps?q=${lat},${lng}`;
}
