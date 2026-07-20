// components/dashboard-pages/codes/components/ViewToggle.tsx
"use client";
import { LayoutGrid, List } from "lucide-react";
import type { ViewMode } from "../codes.types";

interface Props {
  value: ViewMode;
  onChange: (v: ViewMode) => void;
}

export default function ViewToggle({ value, onChange }: Props) {
  return (
    <div className="flex items-center gap-1 h-10 px-1 rounded-lg border border-border bg-card shrink-0">
      <button
        type="button"
        title="List view"
        onClick={() => onChange("list")}
        className={`p-1.5 rounded-md transition ${value === "list" ? "bg-secondary text-foreground" : "text-muted-foreground hover:text-foreground"}`}
      >
        <List className="w-4 h-4" />
      </button>
      <button
        type="button"
        title="Grid view"
        onClick={() => onChange("grid")}
        className={`p-1.5 rounded-md transition ${value === "grid" ? "bg-secondary text-foreground" : "text-muted-foreground hover:text-foreground"}`}
      >
        <LayoutGrid className="w-4 h-4" />
      </button>
    </div>
  );
}
