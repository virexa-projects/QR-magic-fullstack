// components/dashboard-pages/create/components/Step1TypeSelect.tsx
"use client";
import { memo } from "react";
import { motion } from "framer-motion";
import { LayoutGrid } from "lucide-react";
import { QrTypeGrid } from "../lazy";
import type { QrTypeId } from "@/lib/qr-types/schema";

interface Props {
  selectedType: QrTypeId;
  onSelect: (id: QrTypeId) => void;
}

function Step1TypeSelectBase({ selectedType, onSelect }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
    >

      <QrTypeGrid selected={selectedType} onSelect={onSelect} />
    </motion.div>
  );
}

export const Step1TypeSelect = memo(Step1TypeSelectBase);