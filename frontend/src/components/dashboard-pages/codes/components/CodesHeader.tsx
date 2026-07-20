// components/dashboard-pages/codes/components/CodesHeader.tsx
"use client";
import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  loading: boolean;
  total: number;
  page: number;
  totalPages: number;
}

export default function CodesHeader({ loading, total, page, totalPages }: Props) {
  return (
    <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold font-heading text-foreground">My QR Codes</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {loading ? "Loading…" : `${total} code${total === 1 ? "" : "s"} total — page ${page} of ${totalPages}`}
        </p>
      </div>
      <Button asChild className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-full shadow-blue self-start md:self-auto">
        <Link href="/dashboard/create">
          <Plus className="w-4 h-4 mr-1" /> Create QR Code
        </Link>
      </Button>
    </div>
  );
}
