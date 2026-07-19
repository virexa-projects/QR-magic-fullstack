// components/dashboard-pages/create/hooks/useQrDownloadActions.ts
"use client";
import { useCallback, useState } from "react";
import { toast } from "sonner";
import type { RefObject } from "react";

/** Isolated download/copy logic — depends only on a canvas ref + filename, never re-created for unrelated state. */
export function useQrDownloadActions(canvasRef: RefObject<HTMLDivElement>, fileBaseName: string) {
  const [copied, setCopied] = useState(false);

  const handleDownload = useCallback(() => {
    const canvas = canvasRef.current?.querySelector("canvas") as HTMLCanvasElement | null;
    if (canvas) {
      const a = document.createElement("a");
      a.href = canvas.toDataURL("image/png");
      a.download = `${fileBaseName}.png`;
      a.click();
      toast.success("Downloaded");
      return;
    }
    const svg = canvasRef.current?.querySelector("svg") as SVGSVGElement | null;
    if (svg) {
      const xml = new XMLSerializer().serializeToString(svg);
      const blob = new Blob([xml], { type: "image/svg+xml" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${fileBaseName}.svg`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Downloaded");
      return;
    }
    toast.error("Nothing to download yet");
  }, [canvasRef, fileBaseName]);

  const handleCopy = useCallback(async () => {
    const canvas = canvasRef.current?.querySelector("canvas") as HTMLCanvasElement | null;
    if (canvas) {
      canvas.toBlob(async (blob) => {
        if (blob) {
          await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        }
      });
      return;
    }
    const svg = canvasRef.current?.querySelector("svg") as SVGSVGElement | null;
    if (svg) {
      const xml = new XMLSerializer().serializeToString(svg);
      await navigator.clipboard.writeText(xml);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
      return;
    }
    toast.error("Nothing to copy yet");
  }, [canvasRef]);

  return { copied, handleDownload, handleCopy };
}