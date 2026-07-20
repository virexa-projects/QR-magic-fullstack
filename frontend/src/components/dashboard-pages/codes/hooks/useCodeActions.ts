// components/dashboard-pages/codes/hooks/useCodeActions.ts
import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "sonner";
import type { AppDispatch, RootState } from "@/store";
import { updateQr } from "@/store/slices/qrSlice";
import type { QrCode, QRDesign, EditableFields } from "../codes.types";
import { getEditableFields, buildDestination } from "../codes.utils";

export function useCodeActions() {
  const dispatch = useDispatch<AppDispatch>();
  const actionLoading = useSelector((state: RootState) => state.qr.actionLoading);

  const [editing, setEditing] = useState<QrCode | null>(null);
  const [editFields, setEditFields] = useState<EditableFields>({});
  const [designing, setDesigning] = useState<QrCode | null>(null);

  const toggleStatus = async (q: QrCode) => {
    const nextStatus = q.status === "active" ? "paused" : "active";
    try {
      await dispatch(updateQr({ id: q._id, data: { status: nextStatus } })).unwrap();
    } catch {
      // updateQr thunk already toasts the error
    }
  };

  const openEdit = (q: QrCode) => {
    if (!q.isDynamic) {
      toast.error("Static QRs can't be edited", { description: "Re-create as dynamic to enable editing." });
      return;
    }
    setEditing(q);
    setEditFields(getEditableFields(q));
  };

  const closeEdit = () => setEditing(null);

  const setEditField = (key: string, value: string) => setEditFields((prev) => ({ ...prev, [key]: value }));

  const saveEdit = async () => {
    if (!editing) return;
    const newDestination = buildDestination(editing.type, editFields);
    try {
      await dispatch(
        updateQr({
          id: editing._id,
          data: { destination: newDestination, content: editFields },
        })
      ).unwrap();
      toast.success("Destination updated", { description: "Existing printed QRs now point to the new destination." });
      setEditing(null);
    } catch {
      // updateQr thunk already toasts the error
    }
  };

  const openDesign = (q: QrCode) => setDesigning(q);
  const closeDesign = () => setDesigning(null);

  const saveDesign = async (d: QRDesign, logoFile?: File | null) => {
    if (!designing) return;
    try {
      if (logoFile) {
        const fd = new FormData();
        fd.append("logo", logoFile); // binary, matches uploadLogo.single("logo")
        // other design fields must go as strings/JSON — multer won't parse nested objects
        fd.append("design", JSON.stringify({ ...d, logo: undefined })); // let backend fill logo URL
        await dispatch(updateQr({ id: designing._id, data: fd })).unwrap();
      } else {
        await dispatch(updateQr({ id: designing._id, data: { design: d } })).unwrap();
      }
      setDesigning(null);
    } catch {
      // updateQr thunk already toasts the error
    }
  };

  return {
    actionLoading,
    toggleStatus,
    editing,
    editFields,
    openEdit,
    closeEdit,
    setEditField,
    saveEdit,
    designing,
    openDesign,
    closeDesign,
    saveDesign,
  };
}
