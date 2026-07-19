// components/dashboard-pages/create/hooks/useQrValidation.ts
"use client";
import { useCallback, useState } from "react";
import { toast } from "sonner";
import { validateQrValue, type QrTypeId } from "@/lib/qr-types/schema";

/**
 * Validation is intentionally NOT run on every keystroke — only on:
 *  - blur (via onFieldBlur, wired up by individual form fields if needed)
 *  - the "Next" button (validateAndReport)
 *  - the "Save" button (validateAndReport)
 * Once errors exist, onChangeClearIfFixed re-validates a single field's
 * worth of state so error rings clear live — this mirrors the previous
 * "live-clear" UX cheaply, without a full validate on every change while
 * the form is still clean.
 */
export function useQrValidation(selectedType: QrTypeId) {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [hasErrors, setHasErrors] = useState(false);

  const validateAndReport = useCallback(
    (value: any): boolean => {
      const result = validateQrValue(selectedType, value);
      setErrors(result.errors);
      setHasErrors(!result.success);
      if (!result.success) {
        const firstMessage = Object.values(result.errors)[0];
        toast.error(firstMessage || "Please fix the highlighted fields");
      }
      return result.success;
    },
    [selectedType]
  );

  /** Cheap "clear as you fix" check — only runs the full parse if errors are currently showing. */
  const onChangeClearIfFixed = useCallback(
    (value: any) => {
      if (!hasErrors) return;
      const result = validateQrValue(selectedType, value);
      setErrors(result.errors);
      setHasErrors(!result.success);
    },
    [selectedType, hasErrors]
  );

  const resetErrors = useCallback(() => {
    setErrors({});
    setHasErrors(false);
  }, []);

  return { errors, validateAndReport, onChangeClearIfFixed, resetErrors };
}