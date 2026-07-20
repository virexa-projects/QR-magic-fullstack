// components/dashboard-pages/codes/hooks/useDeleteQr.ts
import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch, RootState } from "@/store";
import { deleteQr } from "@/store/slices/qrSlice";
import type { QrCode } from "../codes.types";

export interface DeleteTarget {
  kind: "single" | "bulk";
  ids: string[];
  label: string;
}

export function useDeleteQr(opts: { currentPage: number; itemsOnPage: number; onPageEmptied: () => void; onDone?: () => void }) {
  const dispatch = useDispatch<AppDispatch>();
  const actionLoading = useSelector((state: RootState) => state.qr.actionLoading);
  const [target, setTarget] = useState<DeleteTarget | null>(null);
  const [deleting, setDeleting] = useState(false);

  const requestDelete = (q: QrCode) => setTarget({ kind: "single", ids: [q._id], label: q.name });
  const requestBulkDelete = (ids: string[]) =>
    setTarget({ kind: "bulk", ids, label: `${ids.length} QR code${ids.length === 1 ? "" : "s"}` });
  const cancel = () => setTarget(null);

  const confirm = async () => {
    if (!target) return;
    setDeleting(true);
    let failed = 0;
    for (const id of target.ids) {
      try {
        await dispatch(deleteQr(id)).unwrap();
      } catch {
        failed += 1;
        // deleteQr thunk already toasts the error per-item
      }
    }
    setDeleting(false);
    setTarget(null);

    const remaining = opts.itemsOnPage - (target.ids.length - failed);
    if (remaining <= 0 && opts.currentPage > 1) opts.onPageEmptied();
    opts.onDone?.();
  };

  return { target, requestDelete, requestBulkDelete, cancel, confirm, deleting, actionLoading };
}
