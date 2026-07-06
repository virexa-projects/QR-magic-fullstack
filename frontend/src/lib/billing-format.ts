/**
 * Shared formatting helpers for anything that renders a plan "limit"
 * value coming from the backend, where `-1` is the sentinel for
 * "unlimited". Keep all of that logic here so no component has to
 * special-case -1 on its own.
 */

const UNLIMITED = -1;

/**
 * formatLimit(-1)   -> "Unlimited"
 * formatLimit(25000) -> "25,000"
 * formatLimit(5)     -> "5"
 */
export function formatLimit(value: number): string {
  if (value === UNLIMITED) return "Unlimited";
  return value.toLocaleString("en-IN");
}

export function isUnlimited(value: number): boolean {
  return value === UNLIMITED;
}

export interface UsageSummary {
  isUnlimited: boolean;
  percentage: number;
  label: string;
}

/**
 * calculateUsage(5, 20)  -> { isUnlimited: false, percentage: 25, label: "5 of 20 used" }
 * calculateUsage(5, -1)  -> { isUnlimited: true,  percentage: 0,  label: "5 used (Unlimited)" }
 */
export function calculateUsage(used: number, limit: number): UsageSummary {
  if (isUnlimited(limit)) {
    return {
      isUnlimited: true,
      percentage: 0,
      label: `${used.toLocaleString("en-IN")} used (Unlimited)`,
    };
  }

  const percentage = limit > 0 ? Math.min(100, Math.round((used / limit) * 100)) : 0;

  return {
    isUnlimited: false,
    percentage,
    label: `${used.toLocaleString("en-IN")} of ${limit.toLocaleString("en-IN")} used`,
  };
}