"use client";

import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Copy, Download, ExternalLink, Sparkles } from "lucide-react";
import { toast } from "sonner";
import StyledQrPreview from "./StyledQrPreview";
import DownloadPopover from "./DownloadPopover";
import type { QrCode } from "@/store/slices/qrSlice";
import type { QRDesign } from "@/lib/mockData";

const typeColors: Record<string, string> = {
    url: "bg-primary-soft text-primary",
    text: "bg-secondary text-foreground",
    whatsapp: "bg-success/10 text-success",
    wifi: "bg-warning/10 text-warning",
    vcard: "bg-accent text-accent-foreground",
    email: "bg-primary-soft text-primary",
    phone: "bg-success/10 text-success",
    sms: "bg-warning/10 text-warning",
    location: "bg-accent text-accent-foreground",
};

interface Props {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    qr: QrCode | null;
    design: QRDesign;
}

export default function QrPreviewDrawer({ open, onOpenChange, qr, design }: Props) {
    if (!qr) return null;

    const handleCopyLink = async () => {
        await navigator.clipboard.writeText(qr.shortUrl);
        toast.success("Link copied");
    };

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent side="right" className="w-full sm:max-w-md flex flex-col">
                <SheetHeader className="text-left">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                        <Badge className={`${typeColors[qr.type] ?? "bg-secondary text-foreground"} border-0 font-semibold uppercase text-[10px]`}>
                            {qr.type}
                        </Badge>
                        {qr.isDynamic && (
                            <Badge variant="outline" className="text-[10px] border-primary/30 text-primary flex items-center gap-1">
                                <Sparkles className="w-2.5 h-2.5" /> DYNAMIC
                            </Badge>
                        )}
                        <span
                            className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${qr.status === "active" ? "bg-success/10 text-success" : "bg-muted text-muted-foreground"
                                }`}
                        >
                            <span className={`w-1.5 h-1.5 rounded-full ${qr.status === "active" ? "bg-success animate-pulse" : "bg-muted-foreground"}`} />
                            {qr.status}
                        </span>
                    </div>
                    <SheetTitle className="text-lg">{qr.name}</SheetTitle>
                    <SheetDescription>
                        Created {new Date(qr.createdAt).toLocaleDateString("en-IN")}
                    </SheetDescription>
                </SheetHeader>

                {/* Large centered preview */}
                <div className="flex-1 flex flex-col items-center justify-center gap-5 py-6">
                    <div className="p-4 rounded-2xl border border-border bg-white shadow-card">
                        <StyledQrPreview value={qr.shortUrl} design={design} size={220} />
                    </div>

                    <div className="w-full space-y-2 text-xs px-1">
                        <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-secondary/50">
                            <span className="text-muted-foreground">Total scans</span>
                            <span className="font-bold text-foreground">{qr.scansTotal.toLocaleString("en-IN")}</span>
                        </div>
                        {qr.scansToday > 0 && (
                            <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-secondary/50">
                                <span className="text-muted-foreground">Scans today</span>
                                <span className="font-bold text-success">+{qr.scansToday}</span>
                            </div>
                        )}
                        <button
                            onClick={handleCopyLink}
                            className="w-full flex items-center justify-between px-3 py-2 rounded-lg bg-secondary/50 hover:bg-secondary transition text-left"
                        >
                            <span className="flex items-center gap-1.5 text-foreground text-sm font-medium">
                                Copy Link
                            </span>
                            <Copy className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                        </button>
                    </div>
                </div>

                {/* Actions */}
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border">
                    <DownloadPopover
                        value={qr.shortUrl}
                        design={design}
                        filename={qr.name}
                        trigger={
                            <Button variant="outline" className="w-full h-10 gap-2">
                                <Download className="w-4 h-4" /> Download
                            </Button>
                        }
                    />
                    <Button asChild variant="outline" className="w-full h-10 gap-2">
                        <a href={qr.shortUrl} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="w-4 h-4" /> Open link
                        </a>
                    </Button>
                </div>
            </SheetContent>
        </Sheet>
    );
}