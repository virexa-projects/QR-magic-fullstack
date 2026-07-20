// components/dashboard-pages/codes/lazy/EditQrDialog.tsx
"use client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import type { QrCode, EditableFields } from "../codes.types";
import { FIELD_CONFIG } from "../codes.constants";

interface Props {
  editing: QrCode | null;
  fields: EditableFields;
  actionLoading: boolean;
  onFieldChange: (key: string, value: string) => void;
  onClose: () => void;
  onSave: () => void;
}

export default function EditQrDialog({ editing, fields, actionLoading, onFieldChange, onClose, onSave }: Props) {
  const fieldConfig = editing ? FIELD_CONFIG[editing.type] ?? [] : [];

  return (
    <Dialog open={!!editing} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit destination</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Editing updates where the printed QR points — <span className="text-foreground font-semibold">no need to reprint</span>.
          </p>

          {fieldConfig.map((f) => (
            <div key={f.key} className="space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground">{f.label}</Label>
              {f.multiline ? (
                <Textarea
                  value={fields[f.key] || ""}
                  onChange={(e) => onFieldChange(f.key, e.target.value)}
                  placeholder={f.placeholder}
                  className="bg-card text-sm min-h-[90px]"
                />
              ) : (
                <Input
                  type={f.type || "text"}
                  value={fields[f.key] || ""}
                  onChange={(e) => onFieldChange(f.key, e.target.value)}
                  placeholder={f.placeholder}
                  className="bg-card text-sm"
                />
              )}
            </div>
          ))}

          {editing?.type === "vcard" && (
            <p className="text-[11px] text-muted-foreground bg-secondary/50 rounded-lg px-3 py-2">
              Phone numbers, emails, and social links aren't editable here — use{" "}
              <span className="font-semibold text-foreground">Customize design</span> or recreate the vCard to change those.
            </p>
          )}

          {fieldConfig.length === 0 && editing?.type !== "vcard" && (
            <p className="text-[11px] text-muted-foreground bg-secondary/50 rounded-lg px-3 py-2">
              This QR type doesn't support quick inline editing — recreate it via the Create flow to change its content.
            </p>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={onSave} disabled={actionLoading} className="bg-primary text-primary-foreground">
            {actionLoading ? "Saving…" : "Save changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
