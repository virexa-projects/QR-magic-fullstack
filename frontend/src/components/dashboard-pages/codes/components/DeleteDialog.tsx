// components/dashboard-pages/codes/components/DeleteDialog.tsx
"use client";
import { AlertTriangle } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { DeleteTarget } from "../hooks/useDeleteQr";

interface Props {
  target: DeleteTarget | null;
  deleting: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export default function DeleteDialog({ target, deleting, onCancel, onConfirm }: Props) {
  return (
    <Dialog open={!!target} onOpenChange={(o) => !o && onCancel()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <span className="w-9 h-9 rounded-full bg-red-50 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-4.5 h-4.5 text-red-600" />
            </span>
            Delete {target?.kind === "bulk" ? "QR codes" : "QR code"}?
          </DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          {target?.kind === "bulk"
            ? `This will permanently delete ${target.label}. Any printed codes will stop working immediately.`
            : `This will permanently delete "${target?.label}". Any printed copies of this code will stop working immediately.`}
          {" "}This can't be undone.
        </p>
        <DialogFooter>
          <Button variant="outline" onClick={onCancel} disabled={deleting}>
            Cancel
          </Button>
          <Button
            onClick={onConfirm}
            disabled={deleting}
            className="bg-red-600 text-white hover:bg-red-600/90"
          >
            {deleting ? "Deleting…" : "Delete"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
