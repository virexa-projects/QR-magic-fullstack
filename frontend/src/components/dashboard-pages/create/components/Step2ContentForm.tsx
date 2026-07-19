// components/dashboard-pages/create/components/Step2ContentForm.tsx
"use client";
import { memo } from "react";
import { motion } from "framer-motion";
import { Input } from "@/components/ui/input";
import type { QrTypeDefinition } from "@/lib/qr-types/schema";

interface Props {
  FormComponent: QrTypeDefinition["FormComponent"];
  formValue: any;
  onChange: (v: any) => void;
  errors: Record<string, string>;
  qrName: string;
  onQrNameChange: (v: string) => void;
  onChangeType: () => void;
}

function Step2ContentFormBase({ FormComponent, formValue, onChange, errors, qrName, onQrNameChange, onChangeType }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 8 }}
      transition={{ duration: 0.18 }}
      className="space-y-4"
    >
      <div className="bg-card rounded-xl border border-border p-5">
        <h3 className="text-sm font-semibold text-foreground mb-1">Name this QR</h3>
        <p className="text-[11px] text-muted-foreground mb-3">For your library — won't appear on the code.</p>
        <Input placeholder="e.g. Diwali landing page" value={qrName} onChange={(e) => onQrNameChange(e.target.value)} className="h-10" />
      </div>
      <div className="flex items-center justify-between px-1">
        <div>
          <h2 className="text-base font-bold text-foreground">Add your content</h2>
          <p className="text-xs text-muted-foreground mt-0.5">Watch the phone preview update as you type.</p>
        </div>
        <button onClick={onChangeType} className="text-[11px] text-muted-foreground hover:text-foreground underline-offset-2 hover:underline">
          Change type
        </button>
      </div>
      <FormComponent value={formValue} onChange={onChange} errors={errors} />
    </motion.div>
  );
}

export const Step2ContentForm = memo(Step2ContentFormBase);