// components/qr-builder/forms/types/MenuForm.tsx
"use client";
import FormSection from "../FormSection";
import FieldError, { errorRing } from "../FieldError";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UtensilsCrossed, Plus, X, FolderPlus } from "lucide-react";
import type { MenuValue, MenuCategory, MenuItem } from "@/lib/qr-types/schema";

interface Props { value: MenuValue; onChange: (v: MenuValue) => void; errors?: Record<string, string> }

const THEMES: { id: MenuValue["theme"]; label: string }[] = [
  { id: "classic", label: "Classic" },
  { id: "modern", label: "Modern" },
  { id: "rustic", label: "Rustic" },
];

export default function MenuForm({ value, onChange, errors }: Props) {
  const set = <K extends keyof MenuValue>(k: K, v: MenuValue[K]) => onChange({ ...value, [k]: v });

  const addCategory = () =>
    set("categories", [...value.categories, { id: `cat_${Date.now()}`, name: "New category", items: [] }]);
  const removeCategory = (i: number) => set("categories", value.categories.filter((_, idx) => idx !== i));
  const updateCategory = (i: number, patch: Partial<MenuCategory>) =>
    set("categories", value.categories.map((c, idx) => (idx === i ? { ...c, ...patch } : c)));

  const addItem = (catIdx: number) => {
    const cat = value.categories[catIdx];
    updateCategory(catIdx, { items: [...cat.items, { id: `item_${Date.now()}`, name: "", price: "" }] });
  };
  const updateItem = (catIdx: number, itemIdx: number, patch: Partial<MenuItem>) => {
    const cat = value.categories[catIdx];
    updateCategory(catIdx, { items: cat.items.map((it, idx) => (idx === itemIdx ? { ...it, ...patch } : it)) });
  };
  const removeItem = (catIdx: number, itemIdx: number) => {
    const cat = value.categories[catIdx];
    updateCategory(catIdx, { items: cat.items.filter((_, idx) => idx !== itemIdx) });
  };

  return (
    <div className="space-y-3">
      <FormSection title="Restaurant info" icon={UtensilsCrossed} defaultOpen error={errors?.restaurantName}>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-muted-foreground">Restaurant name</Label>
            <Input
              value={value.restaurantName}
              onChange={(e) => set("restaurantName", e.target.value)}
              placeholder="Cafe Bharat"
              className={`h-10 ${errorRing(!!errors?.restaurantName)}`}
            />
            <FieldError message={errors?.restaurantName} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground">Currency</Label>
              <Input value={value.currency} onChange={(e) => set("currency", e.target.value)} placeholder="₹" className="h-10" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground">Theme</Label>
              <select
                value={value.theme}
                onChange={(e) => set("theme", e.target.value as MenuValue["theme"])}
                className="h-10 w-full rounded-md border border-border bg-background text-sm px-2"
              >
                {THEMES.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
              </select>
            </div>
          </div>
        </div>
      </FormSection>

      <FormSection title="Menu categories" icon={FolderPlus} badge={`${value.categories.length}`} defaultOpen error={errors?.categories}>
        <div className="space-y-3">
          {value.categories.map((cat, ci) => (
            <div key={cat.id} className="p-3 rounded-lg border border-border space-y-2">
              <div className="flex items-center gap-2">
                <Input
                  value={cat.name}
                  onChange={(e) => updateCategory(ci, { name: e.target.value })}
                  placeholder="Category name (e.g. Starters)"
                  className="h-9 text-xs font-semibold flex-1"
                />
                <button onClick={() => removeCategory(ci)} className="p-1.5 text-muted-foreground hover:text-destructive shrink-0">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="space-y-1.5 pl-2 border-l-2 border-border">
                {cat.items.map((item, ii) => (
                  <div key={item.id} className="flex items-center gap-1.5">
                    <Input
                      value={item.name}
                      onChange={(e) => updateItem(ci, ii, { name: e.target.value })}
                      placeholder="Item name"
                      className="h-8 text-[11px] flex-1"
                    />
                    <Input
                      value={item.price}
                      onChange={(e) => updateItem(ci, ii, { price: e.target.value })}
                      placeholder="Price"
                      className="h-8 text-[11px] w-20"
                    />
                    <button onClick={() => removeItem(ci, ii)} className="p-1 text-muted-foreground hover:text-destructive shrink-0">
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => addItem(ci)}
                  className="flex items-center gap-1 text-[11px] text-primary font-medium hover:underline"
                >
                  <Plus className="w-3 h-3" /> Add item
                </button>
              </div>
            </div>
          ))}
          <button type="button" onClick={addCategory} className="flex items-center gap-1.5 text-xs text-primary font-medium hover:underline">
            <Plus className="w-3.5 h-3.5" /> Add category
          </button>
          <FieldError message={errors?.categories} />
        </div>
      </FormSection>
    </div>
  );
}

// --- Preview ---
export function MenuPreview({ value }: { value: MenuValue }) {
  return (
    <div className="w-[228px] rounded-xl border border-border bg-card overflow-hidden">
      <div className="bg-foreground text-background px-4 py-3 text-center">
        <p className="text-sm font-bold font-heading">{value.restaurantName || "Restaurant Name"}</p>
        <p className="text-[9px] opacity-70 uppercase tracking-wider mt-0.5">Menu</p>
      </div>
      <div className="p-3 space-y-3 max-h-[220px] overflow-y-auto">
        {(value.categories.length ? value.categories : [{ id: "1", name: "Starters", items: [{ id: "1", name: "Sample item", price: "150" }] }]).map((cat) => (
          <div key={cat.id}>
            <p className="text-[11px] font-bold text-primary uppercase tracking-wide mb-1">{cat.name}</p>
            {cat.items.map((item) => (
              <div key={item.id} className="flex justify-between text-[11px] py-1 border-b border-border/30">
                <span className="text-foreground">{item.name || "Item"}</span>
                <span className="text-muted-foreground">{value.currency}{item.price || "0"}</span>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
