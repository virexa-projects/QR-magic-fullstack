import { env } from "@config/env";

interface RateCache {
  rate: number;
  fetchedAt: number;
}

let cache: RateCache | null = null;
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

// Fallback used only if the live FX API is unreachable, so checkout
// never breaks because of a third-party outage. Update this in .env
// every so often to keep it close to the real rate.
const FALLBACK_RATE = Number(env.INR_TO_USD_FALLBACK_RATE) || 0.012;

async function fetchLiveRate(): Promise<number> {
  const res = await fetch("https://open.er-api.com/v6/latest/INR");
  if (!res.ok) throw new Error("FX API request failed");
  const data = (await res.json()) as { rates?: Record<string, number> };
  const rate = data?.rates?.USD;
  if (!rate || typeof rate !== "number") throw new Error("FX API returned no USD rate");
  return rate;
}

/** Cached INR->USD rate, refreshed hourly, with a static fallback. */
export async function getInrToUsdRate(): Promise<number> {
  if (cache && Date.now() - cache.fetchedAt < CACHE_TTL_MS) {
    return cache.rate;
  }
  try {
    const rate = await fetchLiveRate();
    cache = { rate, fetchedAt: Date.now() };
    return rate;
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("Failed to fetch live INR->USD rate, using fallback:", err);
    return FALLBACK_RATE;
  }
}

/**
 * Converts an INR amount to USD, rounded to 2 decimals (PayPal
 * requires exactly 2 decimal places for USD). Returns the rate used
 * too, so the UI can be transparent about it ("≈ $3.61 at ₹1 = $0.0121").
 */
export async function convertInrToUsd(
  amountInr: number
): Promise<{ usdAmount: number; rate: number }> {
  const rate = await getInrToUsdRate();
  const usdAmount = Math.round(amountInr * rate * 100) / 100;
  return { usdAmount, rate };
}