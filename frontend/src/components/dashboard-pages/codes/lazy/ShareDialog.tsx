// components/dashboard-pages/codes/lazy/ShareDialog.tsx
"use client";
import { useState } from "react";
import { Copy, Mail, MessageCircle, Check } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { QrCode } from "../codes.types";

interface Props {
  qr: QrCode | null;
  onClose: () => void;
}

export default function ShareDialog({ qr, onClose }: Props) {
  const [copied, setCopied] = useState(false);
  if (!qr) return null;

  const embedSnippet = `<a href="${qr.shortUrl}" target="_blank" rel="noopener noreferrer">${qr.name}</a>`;

  const copy = async (text: string, label: string) => {
    await navigator.clipboard.writeText(text);
    toast.success(`${label} copied`);
    if (label === "Link") {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  };

  return (
    <Dialog open={!!qr} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-base">Share "{qr.name}"</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-muted-foreground">Link</Label>
            <div className="flex gap-2">
              <Input readOnly value={qr.shortUrl} className="bg-card text-xs font-mono" />
              <Button size="icon" variant="outline" onClick={() => copy(qr.shortUrl, "Link")} className="shrink-0">
                {copied ? <Check className="w-4 h-4 text-success" /> : <Copy className="w-4 h-4" />}
              </Button>
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1 h-10 gap-2 text-xs"
              onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent(`Check out "${qr.name}": ${qr.shortUrl}`)}`, "_blank", "noopener,noreferrer")}
            >
              <MessageCircle className="w-4 h-4" /> WhatsApp
            </Button>
            <Button
              variant="outline"
              className="flex-1 h-10 gap-2 text-xs"
              onClick={() =>
                (window.location.href = `mailto:?subject=${encodeURIComponent(`QR code: ${qr.name}`)}&body=${encodeURIComponent(qr.shortUrl)}`)
              }
            >
              <Mail className="w-4 h-4" /> Email
            </Button>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-muted-foreground">Embed snippet</Label>
            <div className="flex gap-2">
              <Input readOnly value={embedSnippet} className="bg-card text-[11px] font-mono" />
              <Button size="icon" variant="outline" onClick={() => copy(embedSnippet, "Snippet")} className="shrink-0">
                <Copy className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
