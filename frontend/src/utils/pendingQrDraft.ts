// utils/pendingQrDraft.ts
const KEY = "pendingQrDraft";
const TTL_MS = 30 * 60 * 1000; // 30 min

interface PendingQrDraft {
  type: string;
  formData: Record<string, any>;
  qrName: string;
  isDynamic: boolean;
  design: Record<string, any>;
  savedAt: number;
}

export function savePendingQrDraft(draft: Omit<PendingQrDraft, "savedAt">) {
  localStorage.setItem(KEY, JSON.stringify({ ...draft, savedAt: Date.now() }));
}

export function getPendingQrDraft(): PendingQrDraft | null {
  const raw = localStorage.getItem(KEY);
  if (!raw) return null;
  try {
    const parsed: PendingQrDraft = JSON.parse(raw);
    if (Date.now() - parsed.savedAt > TTL_MS) {
      localStorage.removeItem(KEY);
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function clearPendingQrDraft() {
  localStorage.removeItem(KEY);
}