import type { Request } from "express";
import geoip from "geoip-lite"; // kept only as an offline fallback if ip-api.com fails/rate-limits

export interface GeoResult {
  ip: string;
  country?: string;
  region?: string;
  city?: string;
  lat?: number;
  lng?: number;
  timezone?: string;
}

export function getClientIp(req: Request): string {
  const fwd = req.headers["x-forwarded-for"];
  if (typeof fwd === "string" && fwd.length > 0) {
    return fwd.split(",")[0].trim();
  }
  return req.socket.remoteAddress || req.ip || "0.0.0.0";
}

function isPrivateOrLoopback(ip: string): boolean {
  return (
    ip === "0.0.0.0" ||
    ip === "::1" ||
    ip.startsWith("127.") ||
    ip.startsWith("10.") ||
    ip.startsWith("192.168.") ||
    /^172\.(1[6-9]|2\d|3[0-1])\./.test(ip) ||
    ip.startsWith("::ffff:127.")
  );
}

// Simple in-memory cache — same IP hitting your redirect repeatedly
// (e.g. one visitor scanning multiple times) shouldn't burn ip-api.com's
// free-tier rate limit (45 req/min) on redundant lookups.
const geoCache = new Map<string, { data: GeoResult; expiresAt: number }>();
const CACHE_TTL_MS = 6 * 60 * 60 * 1000; // 6 hours

interface IpApiResponse {
  status: "success" | "fail";
  country?: string;
  countryCode?: string;
  regionName?: string;
  region?: string;
  city?: string;
  lat?: number;
  lon?: number;
  timezone?: string;
  message?: string;
}

async function lookupViaIpApi(ip: string): Promise<GeoResult | null> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000);

    const res = await fetch(
      `http://ip-api.com/json/${ip}?fields=status,message,country,countryCode,regionName,city,lat,lon,timezone`,
      { signal: controller.signal }
    );
    clearTimeout(timeout);

    const data = (await res.json()) as IpApiResponse;
    if (data.status !== "success") return null;

    return {
      ip,
      country: data.countryCode,
      region: data.regionName,
      city: data.city,
      lat: data.lat,
      lng: data.lon,
      timezone: data.timezone,
    };
  } catch {
    return null; // network error / timeout — fall through to offline lookup
  }
}

function lookupViaGeoipLite(ip: string): GeoResult | null {
  const lookup = geoip.lookup(ip);
  if (!lookup) return null;
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

const isDev = process.env.NODE_ENV !== "production";
let cachedDevPublicIp: string | null = null;

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
 * Resolution order:
 *  1. Cache (6h TTL per IP)
 *  2. ip-api.com — live, accurate, handles CGNAT/mobile carrier ranges
 *     that offline databases miss
 *  3. geoip-lite — offline fallback if ip-api.com is down/rate-limited
 *  4. Dev-only: substitute machine's own public IP if the resolved IP
 *     is private/loopback (localhost/LAN testing)
 */
export async function resolveGeo(req: Request): Promise<GeoResult> {
  let ip = getClientIp(req);

  if (isPrivateOrLoopback(ip) && isDev) {
    const devIp = await getDevPublicIp();
    if (devIp) ip = devIp;
  }

  const cached = geoCache.get(ip);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.data;
  }

  let result = await lookupViaIpApi(ip);
  if (!result) {
    result = lookupViaGeoipLite(ip);
  }
  if (!result) {
    result = { ip };
  }

  geoCache.set(ip, { data: result, expiresAt: Date.now() + CACHE_TTL_MS });
  return result;
}