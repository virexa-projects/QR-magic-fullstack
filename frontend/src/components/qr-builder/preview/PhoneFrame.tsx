// components/qr-builder/preview/PhoneFrame.tsx
"use client";
import { Signal, Wifi } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Props {
  /** Unique key for the content currently shown — drives the swap animation. */
  animKey: string;
  children: React.ReactNode;
}

export default function PhoneFrame({ animKey, children }: Props) {
  return (
    <div className="relative mx-auto w-[260px]">
      <div className="relative rounded-[2.5rem] border-[6px] border-foreground/90 bg-foreground/90 shadow-2xl overflow-hidden">
        {/* Notch */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[100px] h-[22px] bg-foreground/90 rounded-b-2xl z-20" />

        {/* Status bar */}
        <div className="relative h-[44px] bg-card flex items-end justify-between px-6 pb-1 z-10">
          <span className="text-[10px] font-semibold text-foreground">9:41</span>
          <div className="flex items-center gap-1">
            <Signal className="w-3 h-3 text-foreground" />
            <Wifi className="w-3 h-3 text-foreground" />
            <div className="w-5 h-2.5 rounded-sm border border-foreground/60 relative">
              <div className="absolute inset-[1px] right-[2px] bg-foreground/60 rounded-[1px]" />
            </div>
          </div>
        </div>

        {/* Screen content */}
        <div className="bg-card min-h-[440px] max-h-[440px] overflow-y-auto flex items-start justify-center py-4 px-1">
          <AnimatePresence mode="wait">
            <motion.div
              key={animKey}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Home indicator */}
        <div className="bg-card pb-2 pt-1 flex justify-center">
          <div className="w-[100px] h-[4px] rounded-full bg-foreground/20" />
        </div>
      </div>
    </div>
  );
}
