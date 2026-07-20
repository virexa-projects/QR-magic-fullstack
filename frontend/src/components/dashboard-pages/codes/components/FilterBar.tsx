// components/dashboard-pages/codes/components/FilterBar.tsx
"use client";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { SortOption } from "../codes.types";
import { PAGE_SIZE_OPTIONS } from "../codes.constants";

interface Props {
  typeFilter: string;
  onTypeChange: (v: string) => void;
  statusFilter: string;
  onStatusChange: (v: string) => void;
  sortBy: SortOption;
  onSortChange: (v: SortOption) => void;
  pageSize: number;
  onPageSizeChange: (n: number) => void;
}

export default function FilterBar({
  typeFilter,
  onTypeChange,
  statusFilter,
  onStatusChange,
  sortBy,
  onSortChange,
  pageSize,
  onPageSizeChange,
}: Props) {
  return (
    <>
      <Select value={typeFilter} onValueChange={onTypeChange}>
        <SelectTrigger className="h-10 w-full sm:w-[160px] bg-card">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All types</SelectItem>
          <SelectItem value="url">Website</SelectItem>
          <SelectItem value="text">Text</SelectItem>
          <SelectItem value="whatsapp">WhatsApp</SelectItem>
          <SelectItem value="wifi">Wi-Fi</SelectItem>
          <SelectItem value="vcard">vCard</SelectItem>
          <SelectItem value="email">Email</SelectItem>
          <SelectItem value="phone">Phone</SelectItem>
          <SelectItem value="sms">SMS</SelectItem>
          <SelectItem value="location">Location</SelectItem>
        </SelectContent>
      </Select>

      <Select value={statusFilter} onValueChange={onStatusChange}>
        <SelectTrigger className="h-10 w-full sm:w-[140px] bg-card">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All status</SelectItem>
          <SelectItem value="active">Active</SelectItem>
          <SelectItem value="paused">Paused</SelectItem>
          <SelectItem value="expired">Expired</SelectItem>
        </SelectContent>
      </Select>

      <Select value={sortBy} onValueChange={(v) => onSortChange(v as SortOption)}>
        <SelectTrigger className="h-10 w-full sm:w-[160px] bg-card">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="recent">Most recent</SelectItem>
          <SelectItem value="scans">Most scanned</SelectItem>
          <SelectItem value="name">Name (A–Z)</SelectItem>
        </SelectContent>
      </Select>

      <Select value={String(pageSize)} onValueChange={(v) => onPageSizeChange(Number(v))}>
        <SelectTrigger className="h-10 w-full sm:w-[120px] bg-card">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {PAGE_SIZE_OPTIONS.map((n) => (
            <SelectItem key={n} value={String(n)}>
              {n} / page
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </>
  );
}
