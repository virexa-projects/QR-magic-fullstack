// utils/time.ts
export function getISTHour(date: Date = new Date()): number {
  return Number(
    new Intl.DateTimeFormat("en-IN", {
      hour: "numeric",
      hour12: false,
      timeZone: "Asia/Kolkata",
    }).format(date)
  );
}