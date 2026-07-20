// components/dashboard-pages/codes/components/ShareMenu.tsx
"use client";
import { Share2, Copy, Mail, MessageCircle } from "lucide-react";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import type { QrCode } from "../codes.types";

interface Props {
  qr: QrCode;
  compact?: boolean;
}

export default function ShareMenu({ qr, compact }: Props) {
  const copyLink = async () => {
    await navigator.clipboard.writeText(qr.shortUrl);
    toast.success("Link copied");
  };

  const shareViaWhatsapp = () => {
    const text = encodeURIComponent(`Check out my QR code "${qr.name}": ${qr.shortUrl}`);
    window.open(`https://wa.me/?text=${text}`, "_blank", "noopener,noreferrer");
  };

  const shareViaEmail = () => {
    const subject = encodeURIComponent(`QR code: ${qr.name}`);
    const body = encodeURIComponent(`Here's the link for "${qr.name}": ${qr.shortUrl}`);
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  };

  const nativeShare = async () => {
    if (typeof navigator !== "undefined" && "share" in navigator) {
      try {
        await (navigator as any).share({ title: qr.name, url: qr.shortUrl });
      } catch {
        /* user cancelled — no-op */
      }
    } else {
      copyLink();
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        {compact ? (
          <Button size="icon" variant="outline" className="h-8 w-8 border-border hover:border-primary/50 hover:text-primary">
            <Share2 className="w-3.5 h-3.5" />
          </Button>
        ) : (
          <Button size="sm" variant="outline" className="h-8 gap-1.5 text-xs border-border hover:border-primary/50 hover:text-primary">
            <Share2 className="w-3.5 h-3.5" />
            Share
          </Button>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem onClick={copyLink}>
          <Copy className="mr-2 h-4 w-4" />
          Copy link
        </DropdownMenuItem>
        <DropdownMenuItem onClick={shareViaWhatsapp}>
          <MessageCircle className="mr-2 h-4 w-4" />
          Share on WhatsApp
        </DropdownMenuItem>
        <DropdownMenuItem onClick={shareViaEmail}>
          <Mail className="mr-2 h-4 w-4" />
          Share via email
        </DropdownMenuItem>
        <DropdownMenuItem onClick={nativeShare}>
          <Share2 className="mr-2 h-4 w-4" />
          More options…
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
