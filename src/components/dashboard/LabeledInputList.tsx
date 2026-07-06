import { Plus, X, ChevronDown } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export type LabeledItem = { label: string; value: string };

interface Props {
  title: string;
  addLabel: string;
  items: LabeledItem[];
  labels: string[];
  placeholder: string;
  type?: string;
  onChange: (items: LabeledItem[]) => void;
}

/** Styled label + value list (used for phones, emails). */
export default function LabeledInputList({
  title, addLabel, items, labels, placeholder, type = "text", onChange,
}: Props) {
  const update = (i: number, patch: Partial<LabeledItem>) =>
    onChange(items.map((it, idx) => (idx === i ? { ...it, ...patch } : it)));
  const add = () => onChange([...items, { label: labels[0], value: "" }]);
  const remove = (i: number) => onChange(items.filter((_, idx) => idx !== i));

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label className="text-xs font-semibold text-foreground">{title}</Label>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={add}
          className="h-7 gap-1 text-[11px] text-primary hover:text-primary hover:bg-primary-soft"
        >
          <Plus className="w-3 h-3" /> {addLabel}
        </Button>
      </div>

      {items.length === 0 ? (
        <button
          type="button"
          onClick={add}
          className="w-full py-3 text-[11px] text-muted-foreground border border-dashed border-border rounded-lg hover:border-primary/40 hover:text-primary transition"
        >
          + {addLabel}
        </button>
      ) : (
        <div className="space-y-1.5">
          {items.map((it, i) => (
            <div key={i} className="flex gap-1.5 items-center">
              {/* Custom-styled select with proper chevron */}
              <div className="relative w-[120px] shrink-0">
                <select
                  value={it.label}
                  onChange={(e) => update(i, { label: e.target.value })}
                  className="appearance-none w-full h-10 pl-3 pr-7 rounded-lg border border-border bg-background text-xs font-medium text-foreground cursor-pointer hover:border-foreground/30 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition"
                >
                  {labels.map((l) => <option key={l} value={l}>{l}</option>)}
                </select>
                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
              </div>
              <Input
                type={type}
                placeholder={placeholder}
                value={it.value}
                onChange={(e) => update(i, { value: e.target.value })}
                className="h-10 flex-1 bg-background"
              />
              <button
                type="button"
                onClick={() => remove(i)}
                className="p-1.5 rounded-md text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition"
                title="Remove"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
