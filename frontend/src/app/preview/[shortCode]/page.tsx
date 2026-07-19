"use client";
// src/app/preview/[shortCode]/page.tsx
import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { fetchQrByShortCode } from "@/store/slices/qrSlice";
import type { AppDispatch, RootState } from "@/store";

import type { QRType, QrDesign } from "./types";
import { trackAndGo } from "./lib/tracking";
import { downloadVCard } from "./lib/vcard";
import { downloadICS } from "./lib/ics";
import { getPrimaryAction } from "./lib/primaryAction";
import { ScanPulse } from "./components/ScanPulse";
import { StateScreen } from "./components/StateScreen";
import { BrandFooter } from "./components/BrandFooter";
import { ContentRouter } from "./components/ContentRouter";

interface PageProps {
  params: Promise<{ shortCode: string }>;
}

export default function PreviewPage({ params }: PageProps) {
  const dispatch = useDispatch<AppDispatch>();
  const { currentShortQr, loading, error } = useSelector((state: RootState) => state.qr);
  const [justArrived, setJustArrived] = useState(true);

  useEffect(() => {
    const loadQr = async () => {
      const { shortCode } = await params;
      if (shortCode) dispatch(fetchQrByShortCode(shortCode));
    };
    loadQr();
    const t = setTimeout(() => setJustArrived(false), 900);
    return () => clearTimeout(t);
  }, [dispatch, params]);

  // Derived values only need recomputing when the fetched QR actually changes.
  const derived = useMemo(() => {
    if (!currentShortQr) return null;
    const design: QrDesign = currentShortQr.design || {};
    const content = currentShortQr.content || {};
    const type = currentShortQr.type as QRType;
    const shortCode = currentShortQr.shortCode as string;
    const accent =
      (type === "vcard" && content?.theme?.accentColor) || design.accentColor || design.fgColor || "#0d9488";
    const primaryAction = getPrimaryAction(type, content);
    return { design, content, type, shortCode, accent, primaryAction };
  }, [currentShortQr]);

  if (loading) return <StateScreen kind="loading" />;
  if (error) return <StateScreen kind="error" message={error} />;
  if (!currentShortQr || !derived) return <StateScreen kind="missing" />;

  const { design, content, type, shortCode, accent, primaryAction } = derived;

  return (
    <div
      className="relative min-h-screen w-full overflow-x-hidden bg-[#FAFAF8] text-[#14151A]"
      style={{ ["--accent" as string]: accent }}
    >
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-72 opacity-[0.14] blur-3xl"
        style={{ background: `radial-gradient(60% 100% at 50% 0%, ${accent}, transparent)` }}
      />

      <div className="relative mx-auto flex min-h-screen w-full max-w-md flex-col px-4 pb-28 pt-8 sm:max-w-lg sm:px-6 sm:pt-14 lg:max-w-xl">
        <div className="mb-5 flex justify-center sm:mb-7">
          <ScanPulse accent={accent} active={justArrived} />
        </div>

        <div className="overflow-hidden rounded-[28px] border border-neutral-200/80 bg-white shadow-[0_1px_2px_rgba(0,0,0,0.04),0_16px_40px_-12px_rgba(0,0,0,0.12)]">
          <AnimatePresence mode="wait">
            <motion.div key={type} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, ease: "easeOut" }}>
              <ContentRouter type={type} data={content} design={design} shortCode={shortCode} />
            </motion.div>
          </AnimatePresence>
        </div>

        <p className="mt-5 text-center text-[12px] text-neutral-400 sm:mt-6">
          Shared by <span className="font-medium text-neutral-500">{currentShortQr.name || "a Virexa user"}</span>
        </p>

        <div className="mt-auto" />

        <BrandFooter accent={accent} />
      </div>

      {primaryAction && (
        <div className="fixed inset-x-0 bottom-0 z-20 border-t border-neutral-200 bg-white/90 p-3 backdrop-blur sm:hidden">
          <button
            onClick={() => {
              if (primaryAction.isVCard) downloadVCard(shortCode, content);
              else if (primaryAction.isICS) downloadICS(shortCode, content);
              else trackAndGo(shortCode, primaryAction.href, primaryAction.external);
            }}
            className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl text-sm font-semibold text-white shadow-sm"
            style={{ backgroundColor: accent }}
          >
            {primaryAction.label} <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}
