// components/dashboard-pages/codes/components/Toolbar.tsx
"use client";
import SearchBar from "./SearchBar";
import FilterBar from "./FilterBar";
import ViewToggle from "./ViewToggle";
import type { SortOption, ViewMode } from "../codes.types";

interface Props {
  query: string;
  onQueryChange: (v: string) => void;
  typeFilter: string;
  onTypeChange: (v: string) => void;
  statusFilter: string;
  onStatusChange: (v: string) => void;
  sortBy: SortOption;
  onSortChange: (v: SortOption) => void;
  pageSize: number;
  onPageSizeChange: (n: number) => void;
  view: ViewMode;
  onViewChange: (v: ViewMode) => void;
}

export default function Toolbar(props: Props) {
  return (
    <div className="flex flex-col sm:flex-row gap-2">
      <SearchBar value={props.query} onChange={props.onQueryChange} />
      <FilterBar
        typeFilter={props.typeFilter}
        onTypeChange={props.onTypeChange}
        statusFilter={props.statusFilter}
        onStatusChange={props.onStatusChange}
        sortBy={props.sortBy}
        onSortChange={props.onSortChange}
        pageSize={props.pageSize}
        onPageSizeChange={props.onPageSizeChange}
      />
      <ViewToggle value={props.view} onChange={props.onViewChange} />
    </div>
  );
}
