"use client";

import { useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { QRCodeCanvas } from "qrcode.react";
import {
    X, Check, Download, Copy, ExternalLink, Sparkles, Link as LinkIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export interface QrPreviewModalProps {
    open: boolean;
    onClose: () => void;
    onViewInLibrary: () => void;
    onCreateAnother: () => void;
    qrName: string;
    qrType: string;
    qrValue: string;
    fgColor: string;
    bgColor: string;
    isDynamic: boolean;
    shortUrl?: string; // full short link for dynamic QR codes, e.g. https://yourapp.com/preview/abc123
}

export default function QrPreviewModal({
    open,
    onClose,
    onViewInLibrary,
    onCreateAnother,
    qrName,
    qrType,
    qrValue,
    fgColor,
    bgColor,
    isDynamic,
    shortUrl,
}: QrPreviewModalProps) {
    const canvasRef = useRef<HTMLDivElement>(null);

    const handleDownload = () => {
        const canvas = canvasRef.current?.querySelector("canvas");
        if (!canvas) return;
        const a = document.createElement("a");
        a.href = canvas.toDataURL("image/png");
        a.download = `${qrName || "qrcode"}.png`;
        a.click();
        toast.success("Downloaded");
    };

    const handleCopyLink = async () => {
        if (!shortUrl) return;
        await navigator.clipboard.writeText(shortUrl);
        toast.success("Link copied");
    };

    return (
        <AnimatePresence>
            {open && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
                    onClick={onClose}
                >
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 10 }}
                        transition={{ duration: 0.18 }}
                        onClick={(e) => e.stopPropagation()}
                        className="w-full max-w-sm bg-card rounded-2xl border border-border shadow-2xl overflow-hidden"
                    >
                        {/* Header */}
                        <div className="relative px-5 pt-5 pb-4 text-center border-b border-border">
                            <button
                                onClick={onClose}
                                className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
                            >
                                <X className="w-4 h-4" />
                            </button>
                            <div className="w-11 h-11 mx-auto rounded-full bg-lime/20 flex items-center justify-center mb-2.5">
                                <Check className="w-5 h-5 text-lime" strokeWidth={2.5} />
                            </div>
                            <h2 className="text-base font-bold text-foreground">QR code created!</h2>
                            <p className="text-xs text-muted-foreground mt-0.5">
                                {qrName || "Your QR code"} is ready to use.
                            </p>
                        </div>

                        {/* QR preview */}
                        <div className="p-5">
                            <div
                                ref={canvasRef}
                                className="flex items-center justify-center p-4 rounded-xl border border-border mx-auto w-fit"
                                style={{ backgroundColor: bgColor }}
                            >
                                <QRCodeCanvas value={qrValue} size={160} fgColor={fgColor} bgColor={bgColor} level="H" includeMargin />
                            </div>

                            <div className="mt-4 space-y-2 text-xs">
                                <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-secondary/50">
                                    <span className="text-muted-foreground">Type</span>
                                    <span className="font-semibold text-foreground capitalize">{qrType}</span>
                                </div>
                                <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-secondary/50">
                                    <span className="text-muted-foreground">Mode</span>
                                    <span className="font-semibold text-foreground flex items-center gap-1">
                                        {isDynamic && <Sparkles className="w-3 h-3 text-lime" />}
                                        {isDynamic ? "Dynamic" : "Static"}
                                    </span>
                                </div>
                                {shortUrl && (
                                    <button
                                        onClick={handleCopyLink}
                                        className="w-full flex items-center justify-between px-3 py-2 rounded-lg bg-secondary/50 hover:bg-secondary transition text-left"
                                    >
                                        <span className="flex items-center gap-1.5 text-foreground font-mono text-[11px] truncate">
                                            <LinkIcon className="w-3 h-3 shrink-0 text-muted-foreground" />
                                            {shortUrl.replace(/^https?:\/\//, "")}
                                        </span>
                                        <Copy className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                                    </button>
                                )}
                            </div>

                            <div className="mt-4 grid grid-cols-2 gap-2">
                                <Button variant="outline" size="sm" onClick={handleDownload} className="h-9 text-xs">
                                    <Download className="w-3.5 h-3.5 mr-1.5" /> Download
                                </Button>
                                <Button variant="outline" size="sm" onClick={onCreateAnother} className="h-9 text-xs">
                                    Create another
                                </Button>
                            </div>

                            <Button
                                onClick={onViewInLibrary}
                                className="w-full h-10 mt-2 bg-primary text-primary-foreground hover:bg-primary/90 font-semibold text-sm"
                            >
                                View in my QR codes <ExternalLink className="w-3.5 h-3.5 ml-1.5" />
                            </Button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}