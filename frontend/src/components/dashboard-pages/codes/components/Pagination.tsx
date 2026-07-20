// components/dashboard-pages/codes/components/Pagination.tsx
"use client";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";

interface Props {
  page: number;
  pageSize: number;
  total: number;
  pageNumbers: number[];
  canPrev: boolean;
  canNext: boolean;
  onFirst: () => void;
  onPrev: () => void;
  onNext: () => void;
  onLast: () => void;
  onPage: (n: number) => void;
}

export default function Pagination({ page, pageSize, total, pageNumbers, canPrev, canNext, onFirst, onPrev, onNext, onLast, onPage }: Props) {
  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-2 px-5 py-3 border-t border-border/60 bg-secondary/30">
      <span className="text-xs text-muted-foreground">
        {total > 0 ? `Showing ${(page - 1) * pageSize + 1}–${Math.min(page * pageSize, total)} of ${total}` : "No results"}
      </span>
      <div className="flex items-center gap-1">
        <button
          onClick={onFirst}
          disabled={!canPrev}
          title="First page"
          className="p-1.5 rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground disabled:opacity-30 disabled:hover:bg-transparent"
        >
          <ChevronsLeft className="w-4 h-4" />
        </button>
        <button
          onClick={onPrev}
          disabled={!canPrev}
          title="Previous page"
          className="p-1.5 rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground disabled:opacity-30 disabled:hover:bg-transparent"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        {pageNumbers.map((n) => (
          <button
            key={n}
            onClick={() => onPage(n)}
            className={`w-8 h-8 rounded-lg text-xs font-semibold transition ${
              n === page ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-secondary hover:text-foreground"
            }`}
          >
            {n}
          </button>
        ))}
        <button
          onClick={onNext}
          disabled={!canNext}
          title="Next page"
          className="p-1.5 rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground disabled:opacity-30 disabled:hover:bg-transparent"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
        <button
          onClick={onLast}
          disabled={!canNext}
          title="Last page"
          className="p-1.5 rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground disabled:opacity-30 disabled:hover:bg-transparent"
        >
          <ChevronsRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
