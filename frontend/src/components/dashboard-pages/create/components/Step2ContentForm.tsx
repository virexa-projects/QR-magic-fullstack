// components/dashboard-pages/create/components/Step2ContentForm.tsx
"use client";
import { memo } from "react";
import { motion } from "framer-motion";
import { PenLine, ArrowLeft } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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

function Step2ContentFormBase({
  FormComponent,
  formValue,
  onChange,
  errors,
  qrName,
  onQrNameChange,
  onChangeType,
}: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className="space-y-5"
    >
      {/* Step header */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-primary/10 grid place-items-center">
            <PenLine className="w-4.5 h-4.5 text-primary" />
          </div>
          <div>
            <h2 className="text-base font-bold text-foreground leading-tight">
              Add your content
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Fill in the details — preview updates live.
            </p>
          </div>
        </div>

        <button
          onClick={onChangeType}
          className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-primary transition-colors px-3 py-1.5 rounded-lg hover:bg-primary/5"
        >
          <ArrowLeft className="w-3 h-3" /> Change type
        </button>
      </div>

      {/* Name input card */}
      <div className="bg-card rounded-2xl border border-border p-5">
        <Label htmlFor="qr-name" className="text-sm font-semibold text-foreground">
          Name this QR
        </Label>
        <p className="text-[11px] text-muted-foreground mt-0.5 mb-3">
          For your library only — it won't appear on the code.
        </p>
        <Input
          id="qr-name"
          placeholder="e.g. Diwali landing page"
          value={qrName}
          onChange={(e) => onQrNameChange(e.target.value)}
          className="h-11 rounded-xl bg-background border-border"
        />
      </div>

      {/* Dynamic form content */}
      <div className="bg-card rounded-2xl border border-border p-5">
        <FormComponent value={formValue} onChange={onChange} errors={errors} />
      </div>
    </motion.div>
  );
}

export const Step2ContentForm = memo(Step2ContentFormBase);