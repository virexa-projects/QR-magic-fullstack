// components/dashboard-pages/codes/codes.types.ts
import type { QrCode, QrType, QrStatus } from "@/store/slices/qrSlice";
import type { QRDesign } from "@/lib/mockData";

// Note: the store's QrCode.design is typed via qrSlice's own QrDesign, but
// every design-rendering component in this app (StyledQrPreview,
// QRDesignDialog, DownloadPopover, FramedPreview) is written against
// lib/mockData's QRDesign instead. The two shapes are structurally
// compatible, so we standardize on QRDesign here to match what those
// components actually import — same convention the original
// CodesContent.tsx used.
export type { QrCode, QrType, QrStatus, QRDesign };

export type ViewMode = "list" | "grid";

export type SortOption = "recent" | "scans" | "name";

export interface QrFilters {
  query: string;
  debouncedQuery: string;
  typeFilter: string;
  statusFilter: string;
  sortBy: SortOption;
}

export interface FieldConfigItem {
  key: string;
  label: string;
  placeholder: string;
  type?: string;
  multiline?: boolean;
}

/** Plain, human-editable key/value map derived from a QrCode's content/destination. */
export type EditableFields = Record<string, string>;

export interface BulkActionResult {
  succeeded: number;
  failed: number;
}
