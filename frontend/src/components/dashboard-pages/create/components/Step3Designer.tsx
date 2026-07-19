// components/dashboard-pages/create/components/Step3Designer.tsx
"use client";
import { memo } from "react";
import { motion } from "framer-motion";
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
  setDesign: (d: QRDesign) => void;
}

function Step3DesignerBase(props: Props) {
  return (
    <motion.div initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 8 }} transition={{ duration: 0.18 }}>
      <Step3Qr {...props} presetColors={PRESET_COLORS as any} />
    </motion.div>
  );
}

export const Step3Designer = memo(Step3DesignerBase);