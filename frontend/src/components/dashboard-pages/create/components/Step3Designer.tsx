// components/dashboard-pages/create/components/Step3Designer.tsx
"use client";
import { memo, type Dispatch, type SetStateAction } from "react";
import { motion } from "framer-motion";
import { Palette } from "lucide-react";
import type { QRDesign } from "@/lib/mockData";
import { Step3Qr } from "../lazy";
import { PRESET_COLORS } from "../create.constants";

interface Props {
  design: QRDesign;
  fgColor: string;
  setFgColor: (c: string) => void;
  bgColor: string;
  setBgColor: (c: string) => void;
  qrName: string;
  setQrName: (v: string) => void;
  isDynamic: boolean;
  setIsDynamic: (v: boolean) => void;
  onSave: () => void;
  isLoading: boolean;
  qrValue: string;
  onCancel: () => void;
  setDesign: Dispatch<SetStateAction<QRDesign>>;
}

function Step3DesignerBase(props: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
    >
      {/* Step header */}
      <div className="flex items-center gap-3 mb-5 px-1">
        <div className="w-9 h-9 rounded-xl bg-primary/10 grid place-items-center">
          <Palette className="w-4.5 h-4.5 text-primary" />
        </div>
        <div>
          <h2 className="text-base font-bold text-foreground leading-tight">
            Design your QR code
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Choose colors, dot styles, and frames — then save.
          </p>
        </div>
      </div>

      <Step3Qr {...props} presetColors={PRESET_COLORS as any} />
    </motion.div>
  );
}

export const Step3Designer = memo(Step3DesignerBase);