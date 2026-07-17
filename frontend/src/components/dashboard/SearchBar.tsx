"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, QrCode, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";

interface SearchResult {
  _id: string;
  name: string;
  type: string;
  status: string;
  shortCode: string;
  isDynamic: boolean;
  scansTotal: number;
  clicksTotal: number;
}

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1";

export function SearchBar() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (!query.trim()) {
      setResults([]);
      setOpen(false);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `${API}/search/qr?q=${encodeURIComponent(query)}`,
          { credentials: "include" }
        );
        const data = await res.json();
        setResults(data.success ? data.results : []);
        setOpen(true);
      } catch (err) {
        console.error("Search failed", err);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  function goToCode(id: string) {
    setOpen(false);
    setQuery("");
    router.push(`/dashboard/codes/${id}`);
  }

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => results.length > 0 && setOpen(true)}
          placeholder="Search QR codes, analytics…"
          className="pl-9 h-9 bg-secondary/60 border-transparent focus-visible:bg-card"
        />
        {loading && (
          <Loader2 className="w-3.5 h-3.5 absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground animate-spin" />
        )}
      </div>

      {open && (
        <div className="absolute top-full mt-1 w-full min-w-[320px] bg-card border border-border rounded-lg shadow-lg overflow-hidden z-40">
          {results.length === 0 ? (
            <p className="px-3 py-4 text-sm text-muted-foreground text-center">
              {loading ? "Searching…" : "No matching QR codes"}
            </p>
          ) : (
            <ul className="max-h-80 overflow-y-auto py-1">
              {results.map((r) => (
                <li key={r._id}>
                  <button
                    onClick={() => goToCode(r._id)}
                    className="w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-secondary transition-colors"
                  >
                    <span className="shrink-0 w-8 h-8 rounded-md bg-secondary flex items-center justify-center">
                      <QrCode className="w-4 h-4 text-muted-foreground" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-medium text-foreground truncate">
                        {r.name}
                      </span>
                      <span className="block text-xs text-muted-foreground truncate">
                        {r.shortCode} · {r.scansTotal} scans · {r.clicksTotal} clicks
                      </span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}