import geoip from "geoip-lite";
import type { Request } from "express";

export interface GeoResult {
  ip: string;
  country?: string;
  region?: string; // state/province code, e.g. "TN"
  city?: string;
  lat?: number;
  lng?: number;
  timezone?: string;
}

/**
 * Extracts the real client IP from behind a proxy/load balancer.
 * IMPORTANT: requires `app.set("trust proxy", true)` in your Express
 * bootstrap, or `req.ip` / X-Forwarded-For will resolve to the proxy's
 * IP instead of the visitor's.
 */
export function getClientIp(req: Request): string {
  const fwd = req.headers["x-forwarded-for"];
  if (typeof fwd === "string" && fwd.length > 0) {
    return fwd.split(",")[0].trim();
  }
  return req.socket.remoteAddress || req.ip || "0.0.0.0";
}

const isDev = process.env.NODE_ENV !== "production";
let cachedDevPublicIp: string | null = null;

/**
 * Dev-only helper: asks a public IP-echo service what your machine's real
 * internet-facing IP is, so `geoip.lookup()` has something resolvable to
 * work with. `::1` / `127.0.0.1` / `192.168.x.x` are not real network
 * locations — no geolocation provider on earth can put a pin on them,
 * because that data doesn't exist. This is purely so you can see the
 * pipeline populate real city/lat/lng while developing on localhost.
 * Never runs in production — a real proxy already hands you a genuine
 * visitor IP there.
 */
async function getDevPublicIp(): Promise<string | null> {
  if (cachedDevPublicIp) return cachedDevPublicIp;
  try {
    const res = await fetch("https://api.ipify.org?format=json");
    const data = (await res.json()) as { ip: string };
    cachedDevPublicIp = data.ip;
    return cachedDevPublicIp;
  } catch {
    return null;
  }
}

/**
 * Resolves geo data from an IP using the local geoip-lite database.
 * Fully offline — no network call, no rate limit, no permission prompt.
 * City-level accuracy; good for analytics, not for turn-by-turn directions.
 *
 * Private/loopback IPs (127.0.0.1, 192.168.x.x, ::1) resolve to nulls —
 * expected, since they're not routable public addresses. In development
 * this falls back to your machine's real public IP just so you can watch
 * the feature work end-to-end; in production the request IP is already
 * real and this fallback never triggers.
 */
export async function resolveGeo(req: Request): Promise<GeoResult> {
  const ip = getClientIp(req);
  let lookup = geoip.lookup(ip);

  if (!lookup && isDev) {
    const devIp = await getDevPublicIp();
    if (devIp) lookup = geoip.lookup(devIp);
  }

  if (!lookup) {
    return { ip };
  }

  const [lat, lng] = lookup.ll || [undefined, undefined];

  return {
    ip,
    country: lookup.country,
    region: lookup.region,
    city: lookup.city,
    lat,
    lng,
    timezone: lookup.timezone,
  };
}