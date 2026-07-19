// components/ScanPulse.tsx
import { memo } from "react";
import { motion } from "framer-motion";
import { ShieldCheck } from "lucide-react";

function ScanPulseBase({ accent, active }: { accent: string; active: boolean }) {
  return (
    <div className="relative flex h-14 w-14 items-center justify-center">
      {active && (
        <>
          <motion.span
            className="absolute inset-0 rounded-full"
            style={{ backgroundColor: accent }}
            initial={{ opacity: 0.35, scale: 0.6 }}
            animate={{ opacity: 0, scale: 2.1 }}
            transition={{ duration: 1, ease: "easeOut" }}
          />
          <motion.span
            className="absolute inset-0 rounded-full"
            style={{ backgroundColor: accent }}
            initial={{ opacity: 0.25, scale: 0.6 }}
            animate={{ opacity: 0, scale: 1.6 }}
            transition={{ duration: 0.8, ease: "easeOut", delay: 0.1 }}
          />
        </>
      )}
      <div className="flex h-14 w-14 items-center justify-center rounded-full shadow-sm" style={{ backgroundColor: `${accent}1f` }}>
        <ShieldCheck className="h-6 w-6" style={{ color: accent }} />
      </div>
    </div>
  );
}

export const ScanPulse = memo(ScanPulseBase);
