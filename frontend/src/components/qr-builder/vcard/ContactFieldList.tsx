// components/qr-builder/vcard/ContactFieldList.tsx
"use client";
import { Plus, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import FieldError, { errorRing } from "../forms/FieldError";

interface Item { label: string; value: string }
interface Props {
  items: Item[];
  labels: string[];
  placeholder: string;
  type?: string;
  onChange: (items: Item[]) => void;
  error?: string;
}

export default function ContactFieldList({ items, labels, placeholder, type = "text", onChange, error }: Props) {
  const update = (i: number, patch: Partial<Item>) =>
    onChange(items.map((it, idx) => (idx === i ? { ...it, ...patch } : it)));
  const remove = (i: number) => onChange(items.filter((_, idx) => idx !== i));
  const add = () => onChange([...items, { label: labels[0], value: "" }]);

  return (
    <div className="space-y-2">
      {items.map((item, i) => (
        <div key={i} className="flex items-center gap-2">
          <select
            value={item.label}
            onChange={(e) => update(i, { label: e.target.value })}
            className="h-9 rounded-md border border-border bg-background text-xs px-2 w-24 shrink-0"
          >
            {labels.map((l) => <option key={l} value={l}>{l}</option>)}
          </select>
          <Input
            type={type}
            value={item.value}
            onChange={(e) => update(i, { value: e.target.value })}
            placeholder={placeholder}
            className={`h-9 text-xs flex-1 ${errorRing(!item.value.trim() && Boolean(error))}`}
          />
          <button onClick={() => remove(i)} className="p-1.5 text-muted-foreground hover:text-destructive shrink-0">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}
      <Button type="button" variant="outline" size="sm" onClick={add} className="h-8 text-xs gap-1.5">
        <Plus className="w-3.5 h-3.5" /> Add
      </Button>
      <FieldError message={error} />
    </div>
  );
}
