import { UAParser } from "ua-parser-js";
import geoip from "geoip-lite";
import { Request } from "express";
import { DeviceType } from "@app-types/enums";

export function getClientIp(req: Request): string {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string" && forwarded.length > 0) {
    return forwarded.split(",")[0].trim();
  }
  return req.socket.remoteAddress || req.ip || "0.0.0.0";
}

export function parseDevice(userAgent: string) {
  const parser = new UAParser(userAgent);
  const os = parser.getOS();
  const browser = parser.getBrowser();

  let device = DeviceType.OTHER;
  const osName = (os.name || "").toLowerCase();
  if (osName.includes("android")) device = DeviceType.ANDROID;
  else if (osName.includes("ios") || osName.includes("mac")) device = DeviceType.IOS;
  else if (osName.includes("windows") || osName.includes("linux")) device = DeviceType.DESKTOP;

  return {
    device,
    os: os.name,
    browser: browser.name,
  };
}

export function geoLookup(ip: string) {
  const geo = geoip.lookup(ip);
  if (!geo) return { country: undefined, region: undefined, city: undefined, lat: undefined, lng: undefined };
  return {
    country: geo.country,
    region: geo.region,
    city: geo.city,
    lat: geo.ll?.[0],
    lng: geo.ll?.[1],
  };
}
